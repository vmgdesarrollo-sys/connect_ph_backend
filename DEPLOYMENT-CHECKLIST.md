# QUÉ FALTA PARA DESPLEGAR DESDE GITHUB

## 📋 CHECKLIST PRE-DEPLOY

### 1. Cuenta GitHub

- [x] Repositorio creado (connect_ph_backend)
- [ ] Código subido (main branch)
- [ ] GitHub Actions habilitado

### 2. Google Cloud Platform

- [ ] Project creado (`connect-ph-XXXXX`)
- [ ] Billing habilitado
- [ ] APIs habilitadas:
  - [ ] Cloud SQL Admin API
  - [ ] Compute Engine API
  - [ ] Cloud Run API
  - [ ] Secret Manager API
  - [ ] Cloud Build API

### 3. Service Account (SA) para GitHub Actions

```bash
# Crear SA
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# Asignar roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

Generar key:

```bash
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com
```

### 4. VPC Network (si no existe)

```bash
# Si usas el Terraform de LiveKit, crea la VPC automáticamente.
# Si prefieres manual:
gcloud compute networks create livekit-vpc \
  --subnet-mode=custom

gcloud compute networks subnets create livekit-subnet \
  --network=livekit-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24
```

---

## 🔐 CONFIGURAR GITHUB SECRETS

Ir a: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

### Secretos (Tipo: Secret)

| Nombre                       | Valor                                   | Cómo obtener                                          |
| ---------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `GCP_SA_KEY`                 | JSON completo de la service account key | `cat ~/github-actions-key.json`                       |
| `DB_PASSWORD`                | Password para Cloud SQL (mín 16 chars)  | `openssl rand -base64 32`                             |
| `LIVEKIT_API_KEY`            | API key de LiveKit                      | `docker exec livekit livekit-server --create-api-key` |
| `LIVEKIT_API_SECRET`         | API secret de LiveKit                   | Mismo comando anterior                                |
| `JWT_SECRET`                 | Clave JWT (min 64 chars)                | `openssl rand -base64 64`                             |
| `SLACK_WEBHOOK` _(opcional)_ | Webhook URL de Slack                    | Crear app en Slack → Incoming Webhook                 |

### Variables (Tipo: Variable)

| Nombre           | Valor                                             |
| ---------------- | ------------------------------------------------- |
| `GCP_PROJECT_ID` | `connect-ph-123456`                               |
| `VPC_ID`         | `projects/PROJECT_ID/global/networks/livekit-vpc` |
| `CORS_ORIGINS`   | `https://app.connectph.com` (o `*` para dev)      |

---

## 🚀 PRIMER DESPLIEGUE

### Opción A: Automático (Push a main)

```bash
# 1. Clonar y configurar
git clone <tu-repo>
cd connect_ph_backend

# 2. Crear terraform.tfvars
cd infrastructure/cloudsql
cp terraform.tfvars.example terraform.tfvars
# Editar: project_id, vpc_id, db_password (debe coincidir con GitHub secret)

# 3. Commit y push
git add .
git commit -m "feat: initial infrastructure setup"
git push origin main
```

El workflow `.github/workflows/deploy-gcp.yml` se ejecutará automáticamente.

### Opción B: Manual (recomendado para primer deploy)

```bash
# 1. Deploy Cloud SQL
cd infrastructure/cloudsql
terraform init
terraform apply
# Anotar: DB_HOST (private IP)

# 2. Deploy LiveKit
cd ../livekit-cluster
terraform init
terraform apply
# Anotar: LIVEKIT_LB_IP

# 3. Configurar .env local
cat > .env <<EOF
DB_HOST=<DB_HOST_de_terraform>
DB_USER=connect_ph_user
DB_PASSWORD=<DB_PASSWORD>
DB_DATABASE=connect_ph_prod
DB_SSL=require

LIVEKIT_URL=wss://<LIVEKIT_LB_IP>:7880
LIVEKIT_API_KEY=<tu_key>
LIVEKIT_API_SECRET=<tu_secret>
LIVEKIT_REDIS_HOST=<redis_host_de_terraform>
JWT_SECRET=<tu_jwt_secret>
...
EOF

# 4. Deploy manual a Cloud Run
gcloud run deploy connect-ph-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars-file=.env

# 5. Probar
curl https://<cloud-run-url>/health
```

---

## 📊 MONITOREO POST-DEPLOY

### Cloud Monitoring Dashboards

```bash
# Crear dashboard rápido en Console:
# Monitoring → Dashboards → Create Dashboard → Add Chart

# Métricas clave:
1. Cloud SQL: connections, CPU, memory
2. LiveKit: participants, jitter, packet_loss
3. Cloud Run: instance count, request count, latency
4. Redis: used_memory, connections
```

### Alertas

```bash
# En Cloud Monitoring → Alerting → Create Policy

Alerta 1: DB connections > 240 (80%)
- Condition: metric.cloudsql.database.connection_count > 240
- Duration: 5m
- Notification: Email/Slack

Alerta 2: LiveKit CPU > 80%
- Condition: metric.livekit_cpu_usage > 80
- Notification: Email/Slack

Alerta 3: API error rate > 1%
- Condition: metric.cloud_run/function/response_count{response_code=~"5.."} > 1%
- Notification: Email/Slack
```

---

## 🐛 TROUBLESHOOTING

### Job falla en "Terraform Init"

```yaml
# Error: Could not download plugin
# Solución: El runner ya tiene Terraform instalado (actions/setup-terraform)
```

### Job "deploy-cloudsql" falla

```bash
# Revisar logs:
- Verificar GCP_SA_KEY permissions
- Verificar VPC_ID correcto
- Revisar que DB_Password cumple requisitos (min 16 chars)
```

### Cloud Run deployment falla

```bash
# Logs:
gcloud run services logs read connect-ph-api --region us-central1

# Problemas comunes:
- DB_HOST no alcanzable (verificar VPC peering)
- DB_SSL misconfigured
- JWT_SECRET muy corto (< 32 chars)
```

### LiveKit nodes no healthy

```bash
# SSH a una instancia (si tienes IP pública temporal):
gcloud compute ssh livekit-node-0 --zone=us-central1-a

# Verificar:
sudo systemctl status livekit
sudo journalctl -u livekit -f
curl localhost:7880/health
```

---

## 📁 ESTRUCTURA FINAL DEL REPO

```
connect_ph_backend/
├── .github/
│   └── workflows/
│       └── deploy-gcp.yml          # ✅ Pipeline CI/CD
├── infrastructure/
│   ├── cloudsql/                   # ✅ Terraform DB
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── README.md
│   └── livekit-cluster/            # ✅ Terraform LiveKit
│       ├── main.tf
│       ├── variables.tf
│       └── README.md
├── src/                            # ✅ Código NestJS
│   └── core/
├── connecting_ph.sql               # ✅ Schema DB
├── .env.example                    # ✅ Variables local
├── docker-compose.yml              # ✅ Dev local
├── Dockerfile                      # ✅ Producción
├── deploy-gcp.sh                   # ✅ Deploy manual
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 QUÉ FALTA **AHORA** (Acciones Inmediatas)

### 1. Crear Service Account en GCP

```bash
# 5 minutos
gcloud iam service-accounts create github-actions-deployer
# Asignar roles (comandos arriba)
# Descargar key JSON
```

### 2. Agregar Secrets a GitHub

```bash
# En GitHub UI (10 minutos):
# Copiar cada valor de la lista de secrets arriba
```

### 3. Configurar terraform.tfvars

```bash
cd infrastructure/cloudsql
cp terraform.tfvars.example terraform.tfvars
# Editar con:
# - project_id = "tu-project-id"
# - vpc_id = "projects/.../networks/livekit-vpc"
# - db_password = "la_misma_que_en_github_secret"
```

### 4. Primer Push

```bash
git add .
git commit -m "ci: add GitHub Actions deployment pipeline"
git push origin main
# Esperar ~30 minutos a que termine el workflow
```

---

## ✅ VERIFICACIÓN FINAL

Una vez desplegado:

```bash
# 1. Ver Cloud Run service
gcloud run services list --region us-central1

# 2. Obtener URL
gcloud run services describe connect-ph-api --region us-central1

# 3. Probar health
curl https://<URL>/health
# Debe retornar JSON con cluster info

# 4. Probar API
curl https://<URL>/api/v1/phs \
  -H "Authorization: Bearer <tu-jwt-token>"

# 5. Verificar DB conexión
# En Cloud SQL Console: Ver "Connections" metric
```

---

## 📞 SOPORTE

**Problemas comunes:**

| Síntoma                        | Causa probable          | Solución                             |
| ------------------------------ | ----------------------- | ------------------------------------ |
| Workflow se queda en "pending" | Secrets no configurados | Agregar todos los secrets requeridos |
| Terraform "permission denied"  | SA sin roles correctos  | Asignar todos los roles IAM          |
| Cloud Run "failed to start"    | DB_HOST incorrecto      | Verificar VPC peering y Private IP   |
| Health check 500               | JWT_SECRET muy corto    | Usar al menos 32 chars               |
| DB connections denied          | Pool muy grande         | Reducir DB_POOL_MAX a 50             |

---

**RESUMEN:** Solo te falta **configurar los 8 secrets en GitHub** y **crear la Service Account**. Todo el código ya está listo. Un push a `main` y se desplegará automáticamente todo el stack en ~30 minutos.
