# IMPLEMENTACIÓN DE ESCALABILIDAD LIVEKIT - RESUMEN EJECUTIVO

## 🎯 Objetivo

Soporte para **+2,000 usuarios concurrentes** en asambleas virtuales mediante clúster LiveKit distribuido en GCP.

---

## ✅ Cambios Implementados

### 1. Backend (NestJS)

#### `src/core/services/livekit/livekit.service.ts`

- Detección automática de modo clúster (si `LIVEKIT_REDIS_HOST` está configurado)
- Tokens JWT con metadata para Node Selector de LiveKit
- Estrategia `selective_forwarding` configurable (reduce carga CPU)
- Logging detallado de configuración
- Métodos auxiliares: `isClusterMode()`, `getRedisConfig()`

#### `src/main.ts`

- Health check movido a `HealthController` (más limpio, estándar NestJS)

#### `src/core/controllers/health.controller.ts` (NUEVO)

- Endpoint `GET /health` retorna estado y configuración de clúster
- Incluye: uptime, modo (CLUSTER/SINGLE_NODE), LIVEKIT_URL, LIVEKIT_REDIS_HOST

#### `src/core/controllers/livekit/video.controller.ts`

- Webhook handler simplificado con logging (`console.debug`)
- Preparado para eventos: `participant_joined`, `room_started`, `room_ended`
- Eliminado código duplicado

### 2. Variables de Entorno

#### `.env.example` - Agregadas:

```bash
# LiveKit Multi-Node
LIVEKIT_REDIS_HOST=redis-host.cloudmemorystore.googleapis.com
LIVEKIT_REDIS_PORT=6379
LIVEKIT_REDIS_PASSWORD=
LIVEKIT_REDIS_PREFIX=livekit

# Estrategia y límites
LIVEKIT_ROOM_STRATEGY=selective_forwarding
LIVEKIT_MAX_PARTICIPANTS_PER_ROOM=2000

# Infraestructura GCP
LIVEKIT_CLUSTER_REGION=us-central1
LIVEKIT_NODE_NAME=livekit-node-${HOSTNAME}
```

### 3. Infraestructura como Código

#### `docker-compose.yml` (NUEVO)

- **Servicios:** PostgreSQL, Redis, LiveKit, API
- **Rangos:** UDP 50000-60000 para video
- **Desarrollo local:** Un comando `docker-compose up` levanta todo el stack

#### `Dockerfile` (NUEVO - producción)

- Multi-stage build (deps → builder → runner)
- Usuario no-root (`nestjs`) para seguridad
- Health check incluido
- Optimizado para Cloud Run / Compute Engine

#### `Dockerfile.dev` (NUEVO - desarrollo)

- Hot-reload con `npm run start:dev`

#### `deploy-gcp.sh` (NUEVO)

- Script automatizado para desplegar en GCP
- Opciones: Cloud Run (serverless) o Compute Engine (VMs)
- Configura Secret Manager automáticamente

#### `infrastructure/livekit-cluster/` (DIRECTORIO NUEVO)

- `main.tf`: Terraform GCP (VPC, Redis HA, MIG, LB, Firewall)
- `variables.tf`: Variables configurables
- `README.md`: Guía paso a paso de despliegue

### 4. Documentación

#### `INFRASTRUCTURE.md` (NUEVO)

- Arquitectura completa del clúster
- Configuraciones por componente
- Checklist de implementación
- Comandos GCP útiles
- Costos estimados: ~$1,835/mes (o ~$1,100 con committed use discount)

#### `CHANGELOG-SCALABILITY.md` (NUEVO)

- Registro detallado de cambios
- Estado de producción por componente
- Próximos pasos (load testing, monitoreo)

---

## 🏗️ Arquitectura Resultante

```
┌──────────────────────────────────────────────┐
│  GCP Load Balancer (TCP:7880, UDP:50000-60000) │
├─────────────────┬────────────────────────────┤
│  LiveKit Node 1 │  LiveKit Node N (MIG)      │
│  c2-standard-4  │  Auto-scaling (2-10)       │
│  (us-central1-a)│  (us-central1-b)           │
└────────┬────────┴───────────────┬───────────┘
         │                        │
         └────────────┬───────────┘
                      │
           Redis Cloud Memorystore (HA, 50GB)
                      │
         ┌────────────┴────────────┐
         │  NestJS Backend         │
         │  (Cloud Run o GCE)      │
         └─────────────────────────┘
```

---

## 🔑 Puntos Clave

| Aspecto              | Detalle                                                          |
| -------------------- | ---------------------------------------------------------------- |
| **Modo clúster**     | Detectado automáticamente vía `LIVEKIT_REDIS_HOST`               |
| **Coordinación**     | Cloud Memorystore (Redis 6.x, STANDARD_HA)                       |
| **Balanceo**         | TCP LB (GCP) + Node Selector interno de LiveKit                  |
| **Estrategia video** | `selective_forwarding` (solo publican quienes tienen la palabra) |
| **ulimit**           | 65535 archivos abiertos (configurado en startup script)          |
| **UDP buffers**      | Ajustados a 134MB (kernel sysctl)                                |
| **Auto-scaling**     | CPU > 65% escala (2 → 10 nodos)                                  |
| **Tokens JWT**       | Misma `API_KEY/SECRET` en todos los nodos                        |
| **Costo aprox**      | $1,835/mes (on-demand) / $1,100/mes (committed)                  |

---

## 📋 Checklist de Validación

### Backend ✅

- [x] LiveKitService con modo clúster
- [x] HealthController en `/health`
- [x] Tokens con metadata
- [x] Variables de entorno documentadas
- [x] Build exitoso (`npm run build`)

### Infraestructura ✅

- [x] Docker Compose (desarrollo local)
- [x] Dockerfile multi-stage (prod)
- [x] Terraform GCP (VPC, Redis, MIG, LB)
- [x] Script deploy automatizado
- [x] Documentación completa

### Ops & Monitoreo ✅

- [x] ulimit 65535 documentado
- [x] UDP kernel buffers ajustados
- [x] Prometheus metrics endpoint
- [x] Health checks TCP:7880
- [x] Auto-scaling policy definida

---

## 🚀 Próximos Pasos

### 1. Desplegar Infraestructura

```bash
cd infrastructure/livekit-cluster
terraform init
terraform plan
terraform apply
```

### 2. Configurar Backend

Actualizar `.env`:

```bash
LIVEKIT_URL=wss://<LIVEKIT_LB_IP>:7880
LIVEKIT_REDIS_HOST=<REDIS_HOST>  # Output de Terraform
LIVEKIT_API_KEY=sk_...
LIVEKIT_API_SECRET=...
```

### 3. Deploy Backend

```bash
# Cloud Run (recomendado para API)
gcloud run deploy connect-ph-api --source . --region us-central1

# O Compute Engine (si necesitas más control)
gcloud compute instances create-with-container ...
```

### 4. Load Test

```bash
# Simular 2,000 usuarios concurrentes
k6 run load-test.js

# Validar métricas:
# - CPU < 80%
# - Jitter < 50ms
# - Packet loss < 1%
```

### 5. Monitoreo

- Configurar dashboards en Cloud Monitoring
- Crear alertas: CPU > 80%, jitter > 50ms, health check failures

---

## 📊 Costos Estimados (GCP us-central1)

| Recurso                       | Costo/mes   |
| ----------------------------- | ----------- |
| 2 × c2-standard-4 (on-demand) | $560        |
| Cloud Memorystore 50GB (HA)   | $450        |
| Global TCP Load Balancer      | $25         |
| Bandwidth egress 10TB         | $800        |
| **Total**                     | **~$1,835** |

Con **Committed Use Discount (1 año)**: ~$1,100/mes (40% ahorro).

---

## ⚠️ Consideraciones de Seguridad

1. **VPC privada**: LiveKit nodes sin IP pública (solo LB expuesto)
2. **Firewall**: Solo puertos necesarios (7880 TCP, 50000-60000 UDP, 9090 metrics)
3. **Service Account**: Mínimos permisos (redis.viewer, monitoring.viewer, logging.logWriter)
4. **Redis auth**: Cloud Memorystore con password (configurar `LIVEKIT_REDIS_PASSWORD`)
5. **Tokens JWT**: Mismas credenciales en todos los nodos (usar Secret Manager)

---

## 📁 Archivos Modificados/Creados

### Modificados

- `src/core/services/livekit/livekit.service.ts`
- `src/main.ts` (health movido a controller)
- `src/core/controllers/livekit/video.controller.ts`
- `.env.example`

### Creados

- `src/core/controllers/health.controller.ts`
- `docker-compose.yml`
- `Dockerfile`
- `Dockerfile.dev`
- `deploy-gcp.sh`
- `INFRASTRUCTURE.md`
- `CHANGELOG-SCALABILITY.md`
- `infrastructure/livekit-cluster/main.tf`
- `infrastructure/livekit-cluster/variables.tf`
- `infrastructure/livekit-cluster/README.md`

---

## 🎓 Soporte y Troubleshooting

| Problema                  | Diagnóstico                                             | Solución                                                           |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Nodo unhealthy            | `gcloud compute instance-groups managed list-instances` | Verificar firewall, servicio LiveKit corriendo, `/health` endpoint |
| Alta latencia             | Chequear Network Tier (debe ser Premium)                | Cambiar a Premium Tier en VPC                                      |
| Packet loss > 1%          | Ajustar UDP buffers (`sysctl`)                          | Verificar `net.core.rmem_max` y `wmem_max`                         |
| Balanceador no distribuye | Revisar health checks                                   | Todos los nodos deben estar `HEALTHY`                              |
| Redis connectivity        | `redis-cli -h <host> PING`                              | Verificar VPC, authorized network                                  |

---

**Estado actual:** Backend compila sin errores ✅  
**Infraestructura:** Código Terraform listo para deploy  
**Siguiente milestone:** Load test de 2,000 usuarios
