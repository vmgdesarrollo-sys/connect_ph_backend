# Cómo desplegar el clúster LiveKit en GCP con Terraform

## Requisitos previos

1. **Instalar Terraform** (>= 1.0):

```bash
brew install terraform  # macOS
# o
sudo apt-get install terraform  # Ubuntu
```

2. **Instalar Google Cloud SDK** y autenticarse:

```bash
gcloud auth application-default login
gcloud config set project connect-ph-123456  # Tu project ID
```

3. **Habilitar APIs necesarias**:

```bash
gcloud services enable \
  compute.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com
```

## Pasos de despliegue

### 1. Configurar variables de entorno

Crear archivo `terraform.tfvars`:

```hcl
project_id       = "connect-ph-123456"
region           = "us-central1"
zone             = "us-central1-a"
environment      = "production"
initial_node_count = 2
min_nodes        = 2
max_nodes        = 10
livekit_api_key  = "sk_xxxxxxxxxxxxxxxxxxxx"
livekit_api_secret = "xxxxxxxxxxxxxxxxxxxx"
```

**Nota:** `livekit_api_key` y `livekit_api_secret` son las mismas credenciales que usas en tu backend NestJS (`.env`). Deben ser idénticas en todos los nodos.

### 2. Initializar Terraform

```bash
cd infrastructure/livekit-cluster
terraform init
```

### 3. Planificar (revisar cambios)

```bash
terraform plan -out=tfplan
```

Verifica que los recursos a crear sean:

- 1 VPC network (livekit-vpc)
- 1 Subnet (10.0.0.0/24)
- 1 Redis instance (50GB, STANDARD_HA)
- 1 Instance Template (c2-standard-4, Ubuntu 22.04)
- 1 Region Instance Group (2-10 nodos)
- 1 AutoScaler (CPU 65%)
- 1 TCP Load Balancer (puerto 7880)
- 3 Firewall rules
- Service Account

### 4. Aplicar (desplegar)

```bash
terraform apply tfplan
```

**Tiempo estimado:** 15-20 minutos.

### 5. Obtener outputs

```bash
terraform output
```

Verás:

- `livekit_lb_ip`: IP del balanceador de carga (usar en `LIVEKIT_URL` del backend)
- `redis_host`: Host de Redis (ej: `10.0.0.3:6379` → usar en `LIVEKIT_REDIS_HOST`)
- `instances`: URLs de las instancias creadas

### 6. Configurar backend NestJS

Actualizar `.env` del backend:

```bash
LIVEKIT_URL=wss://<LIVEKIT_LB_IP>:7880
LIVEKIT_API_KEY=sk_xxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxx
LIVEKIT_REDIS_HOST=<REDIS_HOST>  # ej: 10.0.0.3
LIVEKIT_MAX_PARTICIPANTS_PER_ROOM=2000
LIVEKIT_ROOM_STRATEGY=selective_forwarding
```

**Importante:** `LIVEKIT_URL` debe usar `wss://` para WebSocket seguro.

### 7. Desplegar backend (NestJS)

```bash
# Build
npm run build

# Deploy a Cloud Run (serverless, más fácil)
gcloud run deploy connect-ph-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "LIVEKIT_URL=${LIVEKIT_URL},LIVEKIT_REDIS_HOST=${LIVEKIT_REDIS_HOST},LIVEKIT_API_KEY=${LIVEKIT_API_KEY},LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}"

# O deploy a Compute Engine (VM) si prefieres:
gcloud compute instances create-with-container connect-ph-api \
  --container-image=gcr.io/${PROJECT_ID}/connect-ph-api:latest \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --environment-variables="LIVEKIT_URL=${LIVEKIT_URL},LIVEKIT_REDIS_HOST=${LIVEKIT_REDIS_HOST},..."
```

---

## Verificación

### 1. Verificar que todos los nodos estén healthy

```bash
gcloud compute instance-groups managed list-instances livekit-mig \
  --region us-central1 \
  --state=RUNNING
```

### 2. Verificar health checks

```bash
gcloud compute backend-services get-health livekit-backend \
  --global
```

Debe mostrar todos los nodos `HEALTHY`.

### 3. Probar conexión desde backend

```bash
# Desde Cloud Shell o tu VM del backend
curl ${LIVEKIT_URL}/health
# Respuesta esperada: {"status":"ok"}
```

### 4. Load test ( simulacro 2,000 usuarios )

```bash
# Instalar k6
brew install k6

# Script de test: load-test.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 2000 },  // Ramp up a 2,000 usuarios
    { duration: '5m', target: 2000 },  // Mantener 5 min
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% de requests < 500ms
  },
};

export default function () {
  let url = 'http://localhost:3001/video/token';
  let payload = JSON.stringify({
    roomName: `test-room-${__VU}`,
    identity: `user-${__VU}`,
    role: 'VIEWER'
  });
  let params = { headers: { 'Content-Type': 'application/json' } };

  let res = http.post(url, payload, params);
  check(res, { 'status 200': (r) => r.status === 200 });
}
```

Ejecutar:

```bash
k6 run load-test.js
```

---

## Monitoreo

### Prometheus metrics

LiveKit expone métricas en `:9090/metrics` de cada nodo.

**Configurar scraping en GCP Monitoring (Prometheus):**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "livekit"
    static_configs:
      - targets: ["10.0.0.1:9090", "10.0.0.2:9090", "10.0.0.3:9090"]
```

### Alertas recomendadas (GCP Monitoring)

```bash
# Alerta si CPU > 80%
gcloud monitoring policies create \
  --notification-channels=YOUR_CHANNEL \
  --condition-display-name="LiveKit CPU > 80%" \
  --condition-filter='metric.type="compute.googleapis.com/instance/cpu/utilization"' \
  --condition-comparison="COMPARISON_GT" \
  --condition-threshold-value=0.8 \
  --condition-duration="300s"

# Alerta si jitter > 50ms
gcloud monitoring policies create \
  --condition-display-name="LiveKit Jitter High" \
  --condition-filter='metric.type="livekit.googleapis.com/udp_jitter_ms"' \
  --condition-comparison="COMPARISON_GT" \
  --condition-threshold-value=50 \
  --condition-duration="60s"
```

---

## Troubleshooting

### Nodo no healthy

```bash
# SSH a la instancia
gcloud compute ssh livekit-node-0 --zone=us-central1-a

# Verificar logs de LiveKit
sudo journalctl -u livekit -f

# Verificar conexión a Redis
redis-cli -h <redis-host> -p 6379 PING

# Verificar puertos UDP
sudo netstat -tuln | grep 50000
```

### Alta latencia/jitter

1. Verificar Network Tier: debe ser Premium

```bash
gcloud compute networks describe livekit-vpc --format="value(routingConfig.routingMode)"
```

2. Chequear buffers UDP:

```bash
cat /proc/sys/net/core/rmem_max
cat /proc/sys/net/core/wmem_max
```

### Balanceador no distribuye tráfico

Verificar que los health checks estén pasando:

```bash
gcloud compute backend-services get-health livekit-backend --global
```

Si nodos están `UNHEALTHY`, revisar firewall rules (puerto 7880 TCP) y que LiveKit esté corriendo.

---

## Costos estimados (us-central1, por mes)

| Recurso                     | Cantidad | Costo aprox     |
| --------------------------- | -------- | --------------- |
| c2-standard-4 (on-demand)   | 2 nodos  | $280 × 2 = $560 |
| Cloud Memorystore (50GB HA) | 1        | $450            |
| Global TCP LB               | 1        | $25             |
| Bandwidth egress (10TB)     | -        | $800            |
| **Total**                   | -        | **~$1,835/mes** |

Con **Committed Use Discount (1 año)**: ~$1,100/mes (40% ahorro).

---

## Destroy (eliminar todos los recursos)

```bash
cd infrastructure/livekit-cluster
terraform destroy -auto-approve
```

**Advertencia:** Esto elimina VMs, Redis, LB, firewall. Se perderán todos los datos en Redis (estado temporal de salas).

---

## Soporte

- Documentación LiveKit: https://docs.livekit.io/
- GCP Terraform Provider: https://registry.terraform.io/providers/hashicorp/google/latest/docs
- Issues: https://github.com/Kilo-Org/kilocode/issues
