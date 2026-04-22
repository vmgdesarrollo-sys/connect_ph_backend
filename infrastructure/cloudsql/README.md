# Cloud SQL PostgreSQL - Connect PH Backend

## 📋 Visión General

Instancia de **PostgreSQL 15** en Google Cloud SQL configurada para soportar **+2,000 usuarios concurrentes** en asambleas virtuales con baja latencia.

---

## 🔧 Especificaciones Técnicas

### Configuración de Instancia

| Parámetro          | Valor                           | Razón                                               |
| ------------------ | ------------------------------- | --------------------------------------------------- |
| **Versión**        | PostgreSQL 15 (LTS)             | Mejor rendimiento, soporte largo                    |
| **Tier**           | `db-custom-4-15360`             | 4 vCPU, 15GB RAM - suficiente para 2,000 conexiones |
| **Almacenamiento** | SSD 20GB → auto-resize a 100GB  | Espacio para índices y logs                         |
| **Availability**   | REGIONAL (HA)                   | Standby en otra zona, failover automático < 60s     |
| **Backup**         | Diario 3AM UTC, PITR 7 días     | Recuperación a punto en tiempo                      |
| **Red**            | Private IP solamente (VPC)      | Seguridad, latencia baja                            |
| **SSL**            | Requerido (Cloud SQL auto-cert) | Cifrado tránsito                                    |

### Connection Pooling

**Importante:** Cloud SQL incluye connection pooler integrado, pero también puedes usar PgBouncer en la aplicación. La configuración en `AppModule` está ajustada a:

```typescript
extra: {
  max: 100,              // max conexiones desde la app
  min: 10,               // min conexiones idle
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false }
}
```

**Por qué 100 conexiones max?**

- Cloud SQL `max_connections` configurado a 300
- Reserve 100 para réplicas/administradores
- 100 conexiones concurrentes from NestJS son suficientes si el pool se reutiliza eficientemente (2,000 usuarios no hacen 2,000 queries simultáneas - la mayoría están en Q&A WebSocket)

---

## 🚀 Despliegue con Terraform

### Requisitos Previos

```bash
# 1. Instalar Terraform
brew install terraform  # macOS
# o sudo apt-get install terraform (Ubuntu)

# 2. Autenticarse en GCP
gcloud auth application-default login
gcloud config set project tu-project-id

# 3. Habilitar APIs
gcloud services enable \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com
```

### Variables de Entorno

Crear `infrastructure/cloudsql/terraform.tfvars`:

```hcl
project_id       = "connect-ph-123456"      # Tu GCP project ID
region           = "us-central1"            # Región (misma que LiveKit)
zone             = "us-central1-a"          # Zona primaria
vpc_id           = "projects/PROJECT_ID/global/networks/livekit-vpc"
environment      = "production"
db_password      = "TU_PASSWORD_SUPER_SEGURO"  # Mínimo 16 chars
enable_replica   = false                    # Cambiar a true si necesitas réplica
machine_tier     = "db-custom-4-15360"      # 4 vCPU, 15GB RAM
```

**IMPORTANTE:** Para producción, usa **Secret Manager** para la password y NO la guardes en plain text. Puedes generar una password segura:

```bash
openssl rand -base64 32
```

Luego subir a Secret Manager:

```bash
echo -n "tu_password" | gcloud secrets versions create connect-ph-db-password --data-file=-
```

Y actualizar `terraform.tfvars` con `db_password = ""` (vacío) y el script lee de Secret Manager.

### Desplegar

```bash
cd infrastructure/cloudsql

# Inicializar
terraform init

# Plan (revisar)
terraform plan -out=tfplan

# Aplicar
terraform apply tfplan
```

**Tiempo:** 10-15 minutos (Cloud SQL crea la instancia y aplica configuraciones).

### Outputs Importantes

Tras el deploy, Terraform mostrará:

```bash
Outputs:

connection_name = "connect-ph-db-instance"  # Usar en Cloud SQL Proxy
private_ip      = "10.0.0.10"               # IP privada (VPC)
database_name   = "connect_ph_prod"
username        = "connect_ph_user"
secret_name     = "projects/.../secrets/connect-ph-db-password"
connection_string = "postgresql://connect_ph_user:...@10.0.0.10:5432/connect_ph_prod?sslmode=require"
```

---

## 🔗 Conectar Backend (NestJS)

### Configurar `.env`

```bash
# Producción (Cloud SQL)
DB_HOST=10.0.0.10           # Private IP de Cloud SQL
DB_PORT=5432
DB_USER=connect_ph_user
DB_PASS=tu_password_seguro   # Obtener de Secret Manager
DB_DATABASE=connect_ph_prod
DB_SSL=require              # SSL forzado (recomendado)

# Pooling
DB_POOL_MAX=100
DB_POOL_MIN=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=30000
```

### Conexión via Cloud SQL Proxy (opcional pero recomendado)

Si tu backend corre en Cloud Run o GKE, usa **Cloud SQL Connector** (conexión segura sin IP):

```bash
# Instalar conector
npm install @google-cloud/cloud-sql-connector

# Configurar en NestJS (main.ts):
import { Connector } from '@google-cloud/cloud-sql-connector';

const connector = new Connector();
const clientOpts = {
  instanceConnectionName: 'PROJECT_ID:REGION:INSTANCE_NAME',
  ipType: 'PRIVATE'
};
const pool = await connector.connect(clientOpts, {
  user: 'connect_ph_user',
  password: process.env.DB_PASS,
  database: 'connect_ph_prod'
});
// Luego usar pool con TypeORM (advanced)
```

**Ventaja:** Sin necesidad de configurar IP privada manualmente; Cloud SQL Proxy maneja conexiones seguras via IAM.

---

## 🗄️ Inicialización de Datos

El script `connecting_ph.sql` se ejecuta automáticamente por Terraform (una vez) via `null_resource.initial_migration`. Esto crea:

- **Tablas** (22 tablas)
- **Extensiones** (`uuid-ossp` para generar UUIDs)
- **Índices** (no están en el script original, se agregaron via migration separada)

### Migración Manual (si falla Terraform)

```bash
# Conéctate a la instancia
gcloud sql connect connect-ph-db-instance --user=connect_ph_user

# O via psql directo (requiere acceso VPC)
PGPASSWORD='tu_password' \
psql "host=10.0.0.10 port=5432 dbname=connect_ph_prod user=connect_ph_user"

# Ejecutar script
\i connecting_ph.sql
```

### Índices Adicionales (Optimización)

Los índices críticos para +2,000 usuarios están definidos en las entidades TypeORM:

- `votes(voting_questions_id, assembly_attendances_id)` - unique
- `votes(assembly_attendances_id)` - para consultas por asistencia
- `assembly_attendances(assemblies_id)` - para listar asistencias de asamblea
- `assembly_attendances(unit_assignments_id)` - para votos ponderados
- `qa_entries(assembly_attendances_id)` - para preguntas por asamblea
- `assemblies(phs_id)` - filtrar por PH
- `assemblies(scheduled_at)` - próximas asambleas
- `assemblies(status)` - filtrar por estado

Estos índices se aplican automáticamente al hacer `synchronize: false` + migrations? TypeORM puede no crearlos si `synchronize: false`. **Necesitas generar migraciones TypeORM**:

```bash
# Generar migración desde entidades actualizadas
npm run typeorm migration:generate -- -n AddIndexesForScalability

# Ejecutar migración
npm run typeorm migration:run
```

O aplicar manualmente SQL de índices:

```sql
-- Índices para assembly_attendances
CREATE INDEX IF NOT EXISTS idx_assembly_attendances_assembly ON assembly_attendances(assemblies_id);
CREATE INDEX IF NOT EXISTS idx_assembly_attendances_unit_assignment ON assembly_attendances(unit_assignments_id);

-- Índices para votes
CREATE INDEX IF NOT EXISTS idx_votes_assembly_attendance ON votes(assembly_attendances_id);
CREATE INDEX IF NOT EXISTS idx_votes_question ON votes(voting_questions_id);

-- Índices para qa_entries
CREATE INDEX IF NOT EXISTS idx_qa_entries_attendance ON qa_entries(assembly_attendances_id);
CREATE INDEX IF NOT EXISTS idx_qa_entries_created_at ON qa_entries(created_at);

-- Índices para assemblies
CREATE INDEX IF NOT EXISTS idx_assemblies_ph ON assemblies(phs_id);
CREATE INDEX IF NOT EXISTS idx_assemblies_scheduled_at ON assemblies(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_assemblies_status ON assemblies(status);
```

---

## ⚡ Optimizaciones Aplicadas

### 1. Connection Pooling (TypeORM)

```typescript
extra: {
  max: 100,              // No más de 100 conexiones desde la app
  min: 10,               // Mantener 10 idle
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
}
```

### 2. Database Flags (Cloud SQL)

| Flag                   | Valor | Objetivo                                           |
| ---------------------- | ----- | -------------------------------------------------- |
| `max_connections`      | 300   | Soporta 2,000 usuarios (pooling reduce conexiones) |
| `shared_buffers`       | 4GB   | Cache en memoria (25% de RAM)                      |
| `work_mem`             | 16MB  | Ordenamientos/aggregaciones                        |
| `maintenance_work_mem` | 1GB   | VACUUM/ANALIZE                                     |

### 3. SSL Enforced

Todas las conexiones usan SSL (obligatorio en producción). Cloud SQL provee certificados automáticos.

### 4. Backup & PITR

- Backups diarios 3AM UTC
- Point-in-time recovery a 7 días
- Réplica opcional (para consultas pesadas)

---

## 📊 Monitoreo

### Métricas clave en Cloud Monitoring

| Métrica                              | Descripción                  | Alerta si          |
| ------------------------------------ | ---------------------------- | ------------------ |
| `cloudsql.database.connection_count` | Conexiones activas           | > 250 (80% de 300) |
| `cloudsql.database.cpu.utilization`  | CPU usage                    | > 80%              |
| `cloudsql.database.memory.usage`     | RAM usage                    | > 85%              |
| `cloudsql.database.disk.usage`       | Almacenamiento               | > 80%              |
| `cloudsql.replication.lag`           | Réplica lag (si hay réplica) | > 30s              |

### Query Performance

Habilitar `log_min_duration_statement = 1000` para registrar queries > 1s.

Revisar planes de ejecución:

```sql
EXPLAIN ANALYZE SELECT ...;
```

### Slow Queries típicos

1. **Cálculo de resultados de votación** (agregación por `coefficient_at_voting`):

```sql
SELECT option_id, SUM(coefficient_at_voting)
FROM votes
WHERE voting_questions_id = ?
GROUP BY option_id;
-- Índice en (voting_questions_id) ayuda
```

2. **Listar asistencias de asamblea**:

```sql
SELECT * FROM assembly_attendances WHERE assemblies_id = ?;
-- Índice idx_assembly_attendances_assembly
```

3. **Preguntas Q&A moderadas**:

```sql
SELECT * FROM qa_entries
WHERE assembly_attendances_id IN (...)
  AND is_moderated = true
ORDER BY upvotes DESC, created_at DESC;
-- Índice compuesto (assembly_attendances_id, is_moderated, upvotes)
```

---

## 🔄 Migraciones

### Usando TypeORM Migrations (Recomendado)

Generar migración desde cambios en entidades:

```bash
# Generar archivo de migración
npm run typeorm migration:generate -- -n AddIndexesScalability202604

# Revisar archivo generado en src/migrations/
# Aplicar migración
npm run typeorm migration:run

# Revertir (si necesario)
npm run typeorm migration:revert
```

### Migraciones Manuales (SQL directo)

Para cambios urgentes, ejecutar SQL via `psql` o Cloud Console.

---

## 🛡️ Seguridad

### Private IP Only

No IP pública. El backend se conecta via:

- **Opción A:** Private IP (VPC peering) - más simple
- **Opción B:** Cloud SQL Proxy (recomendado para Cloud Run) - usa IAM

### IAM Roles

- **Backend SA:** `roles/cloudsql.client` (conexión)
- **Admin SA:** `roles/cloudsql.admin` (gestión)
- **Secret Manager Accessor:** leer password

### Secret Manager

Password almacenado en `connect-ph-db-password`. La app la lee al iniciar:

```typescript
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({
  name: "projects/PROJECT_ID/secrets/connect-ph-db-password/versions/latest",
});
const dbPassword = version.payload?.data?.toString();
```

---

## 🚨 Disaster Recovery

### Failover HA

- **Regional HA:** Standby automático en otra zona de misma región
- **Failover tiempo:** < 60 segundos
- **Pruebas:** `gcloud sql instancesPatch --activation-policy=ALWAYS`

### Backups

- Automáticos diarios 3AM
- Retención 7 días (ajustable)
- PITR: Recuperar a cualquier segundo en últimos 7 días

### Export/Import

Exportar datos a Cloud Storage:

```bash
gcloud sql export sql connect-ph-db-instance gs://bucket/backup.sql.gz --database=connect_ph_prod
```

Importar:

```bash
gcloud sql import sql connect-ph-db-instance gs://bucket/backup.sql.gz --database=connect_ph_prod
```

---

## 📈 Escalabilidad

### Escalamiento Vertical (más potencia)

```bash
# Escalar instancia (ej: a 8 vCPU, 30GB)
gcloud sql instances patch connect-ph-db-instance \
  --tier=db-custom-8-30720
```

**Downtime:** ~5-10 minutos (reinicicio).

### Escalamiento Horizontal (réplicas)

Añadir réplica de lectura:

```bash
gcloud sql instances create connect-ph-db-replica \
  --master-instance-name=connect-ph-db-instance \
  --tier=db-custom-4-15360 \
  --region=us-central1
```

Usar en consultas pesadas (Q&A, reportes):

```typescript
// En NestJS, marcar transacción como read-only para ir a réplica
await this.transactionManager.transaction("READ COMMITTED", async (txm) => {
  // Esta query va a la réplica si está configurado
  const result = await txm.manager.query("SELECT ...");
});
```

---

## 🧪 Testing de Carga DB

Simular 2,000 usuarios concurrentes (cada uno con 1-2 queries/seg):

```bash
# Instalar pgbench
sudo apt-get install postgresql-client

# Inicializar benchmark
pgbench -h 10.0.0.10 -p 5432 -U connect_ph_user -i -s 10 connect_ph_prod

# Ejecutar test (100 clientes, 10 segundos)
pgbench -h 10.0.0.10 -p 5432 -U connect_ph_user -c 100 -j 4 -T 10 connect_ph_prod
```

**Métricas objetivo:**

- TPS > 5,000 (transacciones por segundo)
- Latencia promedio < 50ms
- Errores < 0.1%

---

## 🐛 Troubleshooting

### No puedo conectar desde el backend

```bash
# Verificar Private IP connectivity
ping 10.0.0.10

# Probar puerto
nc -zv 10.0.0.10 5432

# Verificar SSL
openssl s_client -connect 10.0.0.10:5432 -showcerts
```

**Errores comunes:**

- `password authentication failed`: Revisar password en Secret Manager
- `no pg_hba.conf entry`: Cloud SQL por defecto requiere SSL y usuario válido
- `connection refused`: IP no en authorized networks o Private IP mal configurada

### Alta latencia (>200ms)

1. Verificar que el backend esté en misma región que Cloud SQL (`us-central1`)
2. Usar Private IP, NO Public IP
3. Aumentar `DB_POOL_MAX` y `DB_POOL_MIN` (evita abrir/cerrar conexiones)
4. Revisar índices (slow queries)

### Agotamiento de conexiones (`FATAL: remaining connection slots are reserved`)

Casusas:

- Pool demasiado pequeño: aumentar `DB_POOL_MAX`
- Conexiones leaked (no se cierran): verificar que jedes transacción se cierra
- Cloud SQL `max_connections` muy bajo: aumentar flag

Solución:

```sql
-- Aumentar max_connections (requiere Cloud SQL Admin)
UPDATE pg_settings SET setting = '500' WHERE name = 'max_connections';
-- O via Cloud Console > Flags
```

### Tabla locking (deadlocks)

Transacciones largas en votaciones pueden bloquear. Usar:

```typescript
// Transacción corta
await this.dataSource.transaction(async (tx) => {
  const vote = await tx.getRepository(Vote).save(...);
  // Commit rápido
});
```

---

## 📝 Costos Estimados (GCP us-central1)

| Recurso                     | Precio/mes (aproximado) |
| --------------------------- | ----------------------- |
| Cloud SQL db-custom-4-15360 | $380                    |
| Almacenamiento SSD 100GB    | $17                     |
| Backup storage (2x tamaño)  | $34                     |
| Network egress (dentro VPC) | $0 (gratis)             |
| **Total**                   | **~$431/mes**           |

Con **Committed Use Discount (1 año)**: ~$300/mes.

**Comparación:** Cloud SQL es más caro que self-hosted en Compute Engine, pero es managed (backups, HA, parches automáticos). Valorable para producción.

---

## ✅ Checklist Despliegue

- [ ] Terraform instalado y autenticado en GCP
- [ ] `terraform.tfvars` con `project_id`, `vpc_id`, `db_password`
- [ ] `terraform init && terraform apply` completado
- [ ] Cloud SQL instance creada (HA, Private IP)
- [ ] Usuario `connect_ph_user` creado
- [ ] Base de datos `connect_ph_prod` existe
- [ ] Script `connecting_ph.sql` ejecutado (tablas creadas)
- [ ] Índices adicionales aplicados (migration TypeORM)
- [ ] Backend `.env` configurado con IP privada y password
- [ ] Backend compila sin errores
- [ ] Conexión DB probada (`psql` o app)
- [ ] Health check DB funciona
- [ ] Backup automático habilitado
- [ ] Monitoring (Cloud Monitoring) configurado

---

## 📁 Estructura de Archivos

```
infrastructure/cloudsql/
├── main.tf               # Cloud SQL, User, Secret, SA
├── variables.tf          # Inputs configurables
├── outputs.tf           # (Incluido en main.tf)
└── README.md            # Este archivo

# Backend
.env.example            # Variables DB actualizadas
src/app.module.ts       # Pool configurado
src/core/entities/*.entity.ts  # Índices agregados
connecting_ph.sql       # Script inicial (adaptado)
```

---

## 🎯 Siguientes Pasos

1. **Desplegar Cloud SQL** con Terraform
2. **Configurar VPC peering** entre LiveKit VPC y Cloud SQL VPC (son la misma)
3. **Actualizar backend `.env`** con IP privada
4. **Ejecutar migraciones TypeORM** para índices adicionales
5. **Probar conexión** desde backend
6. **Load test** completo (API + LiveKit + DB)

---

**Nota final:** Para un entorno de staging, puedes usar una instancia más pequeña (`db-custom-2-7680`) para ahorrar costos, pero para producción con 2,000 usuarios, `db-custom-4-15360` es el mínimo recomendado.
