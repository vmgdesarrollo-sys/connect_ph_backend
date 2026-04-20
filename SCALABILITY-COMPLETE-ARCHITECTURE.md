# CONNECT PH - ARQUITECTURA DE ESCALABILIDAD TOTAL

## Diagrama de Componentes GCP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GOOGLE CLOUD PLATFORM (GCP)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       FRONTEND / MOBILE APP                          │  │
│  │  (React Native / Web -消耗 2000 usuarios concurrentes)                │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
│                                  │ HTTPS/WSS (443)                          │
│                                  ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     GCP HTTP(S) LOAD BALANCER                         │  │
│  │  (Global, SSL termination, CDN)                                       │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
│                                  │                                          │
│         ┌────────────────────────┼────────────────────────┐               │
│         │                        │                        │               │
│         ▼                        ▼                        ▼               │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐        │
│  │ Cloud Run    │        │ Cloud Run    │        │ Cloud Run    │        │
│  │ NestJS API   │        │ NestJS API   │        │ NestJS API   │        │
│  │ (replicas)   │◄──────►│ (replicas)   │◄──────►│ (replicas)   │        │
│  └──────┬───────┘        └──────┬───────┘        └──────┬───────┘        │
│         │                       │                        │               │
│         │            VPC PEERING │                       │               │
│         │                       │                        │               │
│         │        ┌──────────────▼──────────────┐         │               │
│         │        │                             │         │               │
│         │        │   Cloud SQL PostgreSQL HA   │         │               │
│         │        │   (db-custom-4-15360)      │         │               │
│         │        │   + 100 conexiones pool    │         │               │
│         │        │   + Réplica de lectura     │         │               │
│         │        │   (opcional)              │         │               │
│         │        │                             │         │               │
│         │        └──────────────▲──────────────┘         │               │
│         │                       │                        │               │
│         │        VPC PEERING   │   VPC PEERING         │               │
│         │                       │                        │               │
│         ▼                        ▼                        ▼               │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐        │
│  │ LiveKit Node │        │ LiveKit Node │        │ LiveKit Node │        │
│  │ #1 (c2-4)    │        │ #2 (c2-4)    │        │ #N (c2-4)    │        │
│  │ us-central1-a│        │ us-central1-b│        │ (auto-scale) │        │
│  └──────┬───────┘        └──────┬───────┘        └──────┬───────┘        │
│         │                       │                        │               │
│         └───────────┬───────────┴───────────┬────────────┘               │
│                     │                       │                           │
│                     ▼                       ▼                           │
│        ┌───────────────────────────────────────────────────────┐          │
│        │        Cloud Memorystore (Redis 6.x - HA)            │          │
│        │        - 50GB RAM                                    │          │
│        │        - Coordinación clúster LiveKit                │          │
│        │        - Comparte estado salas/participantes          │          │
│        └───────────────────────────────────────────────────────┘          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                  Secret Manager (DB_PASS, LIVEKIT_KEYS)              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                 Cloud Monitoring / Prometheus / Grafana              │ │
│  │  - CPU, Memory, Jitter, Packet Loss, Connection Count                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE DATOS EN ASAMBLEA (2,000 usuarios)

```
[Usuario 1..2000]
      │
      ├─> GET /video/token (NestJS API)
      │        │
      │        ├─ Genera JWT con signature shared (LIVEKIT_API_KEY/SECRET)
      │        └─ Devuelve token + wss://<LB-IP>:7880
      │
      ▼
[LiveKit Load Balancer:7880]
      │
      ├─ Node Selector (hash(roomName)) → Asigna user1..N a LiveKit Node 1 o 2
      │
      ▼
[LiveKit Node X: c2-4]
      │
      ├─ Redis (Cloud Memorystore) sincroniza participantes entre nodos
      ├─ UDP (50000-60000) → flujo video/audio (selective_forwarding)
      │   - Solo hablan: 2-5 usuarios (canPublish=true)
      │   - Escuchan: ~1,995 usuarios (viewer mode)
      │
      ▼
[WebSocket Events]
      ├─ user_joined → AssemblyAttendance.created (DB)
      ├─ send_question → QaEntry.created (DB)
      ├─ vote → Vote.created (DB) → actualiza resultado en tiempo real
      └─ user_left → AssemblyAttendance.updated
```

**Nota de diseño:** El backend no necesita escala horizontal para los WebSockets de Q&A (usamos Socket.IO gateway en cada API instance). Cada API instance maneja miles de conexiones WS, pero el tráfico de video NO pasa por backend - va directo LiveKit node <-> client.

---

## 📊 CAPACIDAD POR COMPONENTE

| Componente        | Capacidad                                  | Escalabilidad                     |
| ----------------- | ------------------------------------------ | --------------------------------- |
| **LiveKit Node**  | 1,000 usuarios (selective_forwarding)      | Auto-scaling MIG (2→10 nodos)     |
| **Cloud SQL**     | 300 conexiones DB (max_connections)        | Vertical (más RAM/CPU) + réplicas |
| **NestJS API**    | 2,000 RPS (Cloud Run max 1,000 instancias) | Horizontal automático (Cloud Run) |
| **Redis**         | 50,000 conexiones                          | Clúster (Cloud Memorystore)       |
| **Load Balancer** | 10,000 conexiones simultáneas              | Gestionado por GCP (sin límite)   |

**Conclusión:** Para 2,000 usuarios:

- 2 × LiveKit nodes (1,000 c/u)
- 1 × Cloud SQL (db-custom-4-15360)
- Cloud Run con 2-4 instancias de API (cada una 2 vCPU)
- 1 × Redis (50GB)

---

## 💰 COSTO TOTAL ESTIMADO (GCP us-central1)

### Computación

| Recurso                       | Cant. | Costo/mes                            |
| ----------------------------- | ----- | ------------------------------------ |
| LiveKit Node (c2-standard-4)  | 2     | $280 × 2 = $560                      |
| Cloud Run (API, 4 instancias) | 4     | ~$40 × 4 = $160 (2M solicitudes/mes) |
| **Subtotal**                  |       | **$720**                             |

### Almacenamiento & DB

| Recurso                       | Cant. | Costo/mes |
| ----------------------------- | ----- | --------- |
| Cloud SQL (db-custom-4-15360) | 1     | $380      |
| Cloud SQL SSD 100GB           | 100GB | $17       |
| Cloud SQL Backup (2x)         | 200GB | $34       |
| Cloud Memorystore Redis 50GB  | 1     | $450      |
| **Subtotal**                  |       | **$881**  |

### Redes

| Recurso                   | Cant. | Costo/mes   |
| ------------------------- | ----- | ----------- |
| Global TCP Load Balancer  | 1     | $25         |
| Egress 10TB (video/audio) | 10TB  | $800        |
| VPC Peering               | 2     | $0 (gratis) |
| **Subtotal**              |       | **$825**    |

### Otros

| Recurso                    | Cant.      | Costo/mes |
| -------------------------- | ---------- | --------- |
| Cloud Monitoring (metrics) | ~$50       |
| Secret Manager             | 3 secretos | ~$6       |
| **Subtotal**               |            | **~$60**  |

### **Total mensual (on-demand): ~$2,486**

**Ahorro con Committed Use Discount (1 año):**

- Compute Engine (LiveKit): -40% → $336/mes (ahorro $224)
- Cloud SQL: -40% → $228/mes (ahorro $152)
- Cloud Run: 12-month term (similar)
- **Total con descuento: ~$1,900/mes**

---

## 🔐 ARQUITECTURA DE SEGURIDAD

```
                    Internet
                       │
                [Cloud Armor]  (WAF opcional)
                       │
            ┌──────────▼──────────┐
            │  HTTPS LB (SSL offload)
            └──────────┬──────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   [API Instance] [API Instance] [API Instance]
   (Cloud Run)    (Cloud Run)    (Cloud Run)
        │              │              │
        └──────────────┼──────────────┘
                       │
            [VPC Service Perimeter]
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   [Cloud SQL]   [LiveKit Node]  [Redis]
   Private IP    Private IP      Private IP
        │              │              │
        └──────────────┴──────────────┘
                       │
               [Service Accounts]
               - Mínimos permisos IAM
               - Secret Manager accessor
```

**Principios:**

- Zero trust: ningún recurso con IP pública excepto LB
- IAM Service Accounts con roles mínimos
- Secret Manager para credenciales (NUNCA en .env en producción)
- VPC Service Perimeter para aislamiento
- Cloud Audit Logs habilitado

---

## 🚀 PLAN DE ESCALADO (Fases)

### Fase 1 - MVP (Actual)

- 500 usuarios concurrentes
- 1 LiveKit node (c2-standard-4)
- Cloud SQL single zone (no HA)
- Cloud Run 2 instancias
- **Costo: ~$800/mes**

### Fase 2 - Producción (Objetivo)

- 2,000 usuarios concurrentes
- 2 LiveKit nodes (HA) + Auto-scaling
- Cloud SQL Regional HA
- Cloud Run 4 instancias
- Réplica DB para lecturas
- **Costo: ~$2,500/mes**

### Fase 3 - Crecimiento (10,000 usuarios)

- 5 LiveKit nodes (auto-scaling 2→5)
- Cloud SQL escalado a db-custom-8-30720
- 2 réplicas de lectura
- Cloud Run 10 instancias
- CDN para assets estáticos
- **Costo: ~$6,000/mes**

---

## 📈 MÉTRICAS DE ÉXITO (SLOs)

| Métrica               | Objetivo           | Alertar si |
| --------------------- | ------------------ | ---------- |
| Latencia API p50      | < 200ms            | > 300ms    |
| Latencia API p95      | < 500ms            | > 800ms    |
| LiveKit jitter        | < 50ms             | > 100ms    |
| LiveKit packet loss   | < 1%               | > 2%       |
| Cloud SQL connections | < 240 (80% de 300) | > 270      |
| DB query latency p95  | < 100ms            | > 200ms    |
| Error rate (5xx)      | < 0.1%             | > 0.5%     |
| Disponibilidad        | 99.9%              | < 99.5%    |

---

## 🧪 PLAN DE PRUEBAS

### 1. Unit Tests

```bash
npm run test  # 6 services, 80% coverage mínimo
```

### 2. Integration Tests

```bash
# Tests de DB + servicios
npm run test:integration

# Tests de WebSocket (Q&A)
npm run test:websocket
```

### 3. Load Test (k6)

```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 2000 },  // Ramp up a 2K
    { duration: '15m', target: 2000 }, // Sostener 15 min
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],  // <1% errores
  },
};

export default function () {
  // 1. Login (20% de usuarios)
  if (__VU % 5 === 0) {
    let res = http.post('http://api:3001/auth/login', { ... });
    check(res, { 'login 200': (r) => r.status === 200 });
  }

  // 2. Obtener token y entrar a sala
  let token = ...;
  let roomRes = http.get(`http://api:3001/video/room/sala-${__VU}?token=${token}`);

  sleep(1);
}
```

Ejecutar:

```bash
k6 run --vus 2000 --duration 20m scripts/load-test.js
```

### 4. Chaos Testing

- Matar un LiveKit node → verificar reconexión automática
- Bloquear DB por 10s → verificar Circuit Breaker
- Latencia alta (200ms) → verificar timeout/retry

---

## 📁 REPOSITORIO DE INFRAESTRUCTURA

```
connect_ph_backend/
├── src/                          # Código NestJS
│   ├── core/
│   │   ├── entities/            # Entidades TypeORM (con índices)
│   │   ├── services/            # Lógica de negocio
│   │   ├── controllers/         # API endpoints
│   │   ├── gateways/            # WebSocket (Q&A)
│   │   └── dtos/                # Validación
│   ├── main.ts
│   └── app.module.ts            # DB pool configurado
├── infrastructure/
│   ├── cloudsql/                # Cloud SQL (PostgreSQL HA)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── README.md
│   ├── livekit-cluster/         # LiveKit MIG + Redis
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── README.md
│   └── networking/              # VPC, Firewall, LB (opcional)
├── connecting_ph.sql            # Schema inicial (idempotente)
├── docker-compose.yml           # Desarrollo local
├── Dockerfile                   # Producción
├── .env.example                 # Variables de entorno
├── INFRASTRUCTURE.md            # Documentación general
├── SCALABILITY-IMPLEMENTATION-SUMMARY.md
└── Terraform (otros módulos)
```

---

## 🔄 CI/CD PIPELINE (GitHub Actions / Cloud Build)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # 1. Deploy Cloud SQL (infraestructura)
      - name: Terraform Apply - Cloud SQL
        run: |
          cd infrastructure/cloudsql
          terraform init
          terraform apply -auto-approve
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}

      # 2. Deploy LiveKit Cluster
      - name: Terraform Apply - LiveKit
        run: |
          cd infrastructure/livekit-cluster
          terraform init
          terraform apply -auto-approve
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}

      # 3. Build and Deploy API
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy connect-ph-api \
            --source . \
            --region us-central1 \
            --set-env-vars "LIVEKIT_URL=${{ secrets.LIVEKIT_URL }},DB_HOST=${{ secrets.DB_HOST }},..."
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
```

---

## ✅ CHECKLIST FINAL DE IMPLEMENTACIÓN

### Backend ✅

- [x] TypeORM configurado con pool (max 100, min 10, SSL)
- [x] Entidades con índices adicionales para escalabilidad
- [x] LiveKitService en modo clúster (Redis)
- [x] HealthController con info de cluster
- [x] Variables de entorno documentadas

### Base de Datos ✅

- [x] Cloud SQL Terraform (HA, Private IP, backups)
- [x] Script SQL inicial idempotente (connecting_ph.sql)
- [x] Índices críticos creados
- [x] Usuario app con permisos mínimos
- [x] Secret Manager para password

### Infraestructura ✅

- [x] LiveKit MIG + LB + Redis (Terraform)
- [x] Docker Compose (desarrollo)
- [x] Scripts de deploy automatizados
- [x] Documentación completa (README por componente)

### Operaciones ✅

- [x] ulimit 65535 documentado
- [x] UDP kernel buffers ajustados
- [x] Prometheus metrics endpoint
- [x] Health checks configurados
- [x] Auto-scaling definido
- [x] Alertas recomendadas (CPU, jitter, connections)

---

**Estado final:** Infraestructura completa para +2,000 usuarios implementada.
**Siguiente paso:** Ejecutar `terraform apply` en ambos módulos y hacer load test.
