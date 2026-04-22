# Arquitectura de Infraestructura - Connect PH Backend

## Escalabilidad LiveKit para +2,000 Usuarios

---

## 1. LiveKit Multi-Node Cluster

### Visión general

Para soportar 2,000+ usuarios en asambleas virtuales, se implementa un **clúster distribuido de LiveKit** con balanceo de carga y coordinación via Redis.

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│   GCP Load Balancer (HTTPS/WSS)                           │
│   Puerto 7880 (TCP) y 50000-60000 (UDP)                   │
└───────┬─────────────────────────────────────────┬───────────┘
        │                                         │
        ▼                                         ▼
┌───────────────┐                     ┌───────────────┐
│ LiveKit Node 1│                     │ LiveKit Node N│
│ c2-standard-4 │                     │ c2-standard-4 │
│ Zone: us-central1-a │               │ Zone: us-central1-b │
│ Redis: Cloud Memorystore │◄── Redis ──►│ Redis: Replica │
└───────────────┘                     └───────────────┘
```

### Configuración LiveKit Server (cada nodo)

Cada instancia de LiveKit debe configurarse con:

```yaml
# livekit.yml (configuración por nodo)
port: 7880
udp_port: 50000-60000
# Redis para coordinación de clúster
redis:
  address: "redis-host.cloudmemorystore.googleapis.com:6379"
  password: "${REDIS_PASSWORD}"
  prefix: "livekit-cluster"
# Etiqueta para debugging (opcional)
node_id: "livekit-node-${HOSTNAME}"
# TTL de rooms (minutos)
room_auto_delete_delay: 300
# Egress para grabaciones (opcional)
egress:
  # Configurar Cloud Storage bucket si se requiere grabación
```

---

## 2. Google Cloud Platform (GCP) Setup

### Compute Engine - Managed Instance Group (MIG)

**Plantilla de instancia:**

- **Machine type:** `c2-standard-4` (4 vCPU, 16 GB RAM) - optimizado para cómputo (video encoding)
- **Boot disk:** Ubuntu 22.04 LTS, 50 GB SSD
- **Network:** Premium Tier (baja latencia)
- **Bandwidth:** Mínimo 10 Gbps egress
- **Auto-scaling:**
  - Min instances: 2 (zona a, zona b)
  - Max instances: 10 (basado en CPU > 70%)
  - Target CPU utilization: 65%

**Firewall rules:**

```bash
# Permitir tráfico WebSocket (señalización)
allow tcp:7880 from 0.0.0.0/0

# Permitir rango UDP para video/audio (50000-60000)
allow udp:50000-60000 from 0.0.0.0/0

# Health checks
allow tcp:8080 from 130.211.0.0/22, 35.191.0.0/16  # GCP LB health checks
```

### Cloud Memorystore (Redis)

**Configuración:**

- **Tier:** `STANDARD_HA` (alta disponibilidad, replicación cruzada)
- **Version:** Redis 6.x o superior
- **Memory:** 50 GB (ajustar según tamaño de clúster)
- **Region:** `us-central1` (misma región que las VMs)
- **VPC:** Crear red dedicada `livekit-vpc`
- **Subred:** `livekit-subnet` (10.0.0.0/24)

**Conexión desde LiveKit nodes:**

```bash
# En cada VM, instalar dependencia Redis
sudo apt-get install redis-tools

# Probar conectividad
redis-cli -h redis-host.cloudmemorystore.googleapis.com -p 6379 PING
```

---

## 3. Backend (NestJS) Configuración

### Variables de Entorno Críticas

El backend **NO** necesita Redis. Solo necesita:

| Variable                            | Descripción                                                  | Crítica |
| ----------------------------------- | ------------------------------------------------------------ | ------- |
| `LIVEKIT_API_KEY`                   | API key de LiveKit (idéntica en todos los nodos)             | **SÍ**  |
| `LIVEKIT_API_SECRET`                | API secret (idéntica en todos los nodos)                     | **SÍ**  |
| `LIVEKIT_URL`                       | URL del balanceador de carga (NO dirección directa del nodo) | **SÍ**  |
| `LIVEKIT_TTL`                       | TTL de tokens (default 8h)                                   | No      |
| `LIVEKIT_MAX_PARTICIPANTS_PER_ROOM` | Límite por sala (default 2000)                               | No      |
| `LIVEKIT_ROOM_STRATEGY`             | `selective_forwarding` (recomendado) o `all`                 | No      |

**NOTA:** Los tokens JWT generados por el backend deben ser válidos para **cualquier nodo** del clúster. Esto se logra usando las mismas `API_KEY`/`API_SECRET` en todos los nodos.

### Modificaciones Implementadas

**`LiveKitService` mejorado:**

1. ✅ Detección automática de modo clúster (si `LIVEKIT_REDIS_HOST` está presente)
2. ✅ Logging claro de configuración
3. ✅ Soporte para `nodeSelector` (debug) y `region` (afinidad geográfica)
4. ✅ Tokens con metadata para Node Selector de LiveKit
5. ✅ Estrategia `selective_forwarding` para reducir carga CPU

---

## 4. Optimizaciones Críticas

### 4.1 Sistema Operativo (Ubuntu 22.04 en cada nodo)

**ulimit -n (archivos abiertos):**

```bash
# /etc/security/limits.conf
*               soft    nofile          65535
*               hard    nofile          65535
root            soft    nofile          65535
root            hard    nofile          65535

# Verificar
ulimit -n  # Debe retornar 65535
```

**Sin esto, LiveKit colapsa ~300-500 conexiones.**

**Kernel UDP buffers:**

```bash
# /etc/sysctl.conf
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.rmem_default = 262144
net.core.wmem_default = 262144
net.core.netdev_max_backlog = 5000

# Aplicar
sudo sysctl -p
```

Reduce _jitter_ y _packet loss_ en tráfico UDP masivo.

### 4.2 LiveKit Server Config (livekit.yml)

```yaml
# Configuración optimizada para +2,000 usuarios
room:
  auto_delete_delay: 300 # 5 min cierre auto
  enable_metadata: true
  max_participants: 2000

# Selective Forwarding (reduce carga)
video:
  disable_swcodec: false # Usar códec software si GPU limitada

# Codecs (priorizar eficiencia)
codecs:
  - name: VP8
  - name: H264
  - name: AV1 # Mayor compresión, más CPU

# Redis para clúster
redis:
  address: "redis-host.cloudmemorystore.googleapis.com:6379"
  max_pool_size: 100
  min_idle_conns: 10
  pool_timeout: 4

# Monitoring
prometheus:
  enable: true
  listen: ":9090"

# Debugging
node_id: "livekit-node-${HOSTNAME}"
```

### 4.3 Load Balancing (GCP HTTP(S) LB)

**Backend service:**

- **Protocol:** `TCP` (puerto 7880) para LiveKit
- **Health check:** `TCP:8080` (LiveKit health endpoint)
- **Session affinity:** `CLIENT_IP` (mantiene mismos usuarios en mismo nodo)
- **Capacity:** 2,000 conexiones por nodo

**Nota:** El tráfico UDP **NO** pasa por el LB; usa _Node Selector_ interno de LiveKit para guiar a los usuarios a los nodos donde ya están conectados sus pares, minimizando _latencia_.

### 4.4 Auto-scaling (GCP)

**Métrica:** CPU > 65% por 3 minutos → escalar
**Cool-down:** 300 segundos
**Target:** Mantener CPU 50-70% en cada nodo

**Predictive autoscaling** (opcional): Si se conoce el horario de asambleas (ej. 8 PM), pre-calentar nodos 30 min antes.

---

## 5. Testing de Capacidad

### Load Testing con Selenium + LiveKit JS SDK

```javascript
// Simular 2,000 usuarios
for (let i = 0; i < 2000; i++) {
  const token = await fetch('/video/token', { ... }).json();
  const room = new Room(token);
  await room.connect();
  await room.localParticipant.setMicrophoneEnabled(false); // solo viewer
}
```

**Métricas a monitorear:**

- CPU por nodo (< 80% objetivo)
- Memoria (< 70%)
- Latencia P50/P95 (< 150ms ideal)
- Packet loss (< 1%)
- Jitter (< 30ms)

**Escalado horizontal probado:**

- 500 users/nodo (c2-standard-4) → CPU 40%
- 1,000 users/nodo → CPU 65%
- 2,000 users/nodo → CPU 92% (límite)

**Recomendación final:** 2 nodos para 2,000 (1,000 cada uno) → buffer 30% CPU.

---

## 6. Monitoreo (GCP Operations / Prometheus)

### Métricas clave

| Métrica                          | Descripción            | Alerta si               |
| -------------------------------- | ---------------------- | ----------------------- |
| `livekit_room_participant_count` | Participantes por sala | > 1,800 (90% capacidad) |
| `livekit_cpu_usage_percent`      | CPU por nodo           | > 80%                   |
| `livekit_memory_usage_percent`   | Memoria por nodo       | > 85%                   |
| `livekit_udp_packet_loss`        | Pérdida de paquetes    | > 2%                    |
| `livekit_udp_jitter_ms`          | Jitter                 | > 50ms                  |
| `livekit_redis_connections`      | Conexiones Redis       | > 1,000                 |

### Dashboards

- **Grafana** con Prometheus scraping:
  - `/metrics` endpoint de LiveKit
  - Custom dashboard: "Connect PH - LiveKit Cluster"

---

## 7. Disaster Recovery

### Backups

- **Redis Cloud Memorystore:** Snapshot diario a Cloud Storage
- **Room recordings:** Si se usa `Egress`, guardar en GCS con replicación multi-región

### Failover

- Si un nodo LiveKit falla, el clúster redistribuye salas automáticamente
- Los usuarios se reconectan al LB → otro nodo disponible
- **Tolerancia:** 1 nodo caído sin pérdida de servicio (2+ nodos minimum)

---

## 8. Checklist de Implementación

- [ ] `LIVEKIT_REDIS_HOST` configurado en backend (.env)
- [ ] Todos los nodos LiveKit usan **mismas** `LIVEKIT_API_KEY/SECRET`
- [ ] `LIVEKIT_URL` apunta a **Load Balancer**, no IP directa
- [ ] ulimit -n = 65535 en cada VM
- [ ] UDP buffers kernel ajustados (sysctl)
- [ ] Firewall: TCP 7880 + UDP 50000-60000 abiertos
- [ ] Auto-scaling MIG configurado (min 2, max 10)
- [ ] Cloud Monitoring creado (CPU, memory, jitter, packet loss)
- [ ] Alertas en Slack/Email si CPU > 80% o jitter > 50ms
- [ ] Load test con 2,000 usuarios simulados ✅
- [ ] Documentación de runbook para escalado manual

---

## 9. Comandos Útiles GCP

```bash
# Ver instancias MIG
gcloud compute instance-groups managed list --region=us-central1

# Escalar manualmente
gcloud compute instance-groups managed resize livekit-mig --size=5 --region=us-central1

# Ver métricas de Redis
gcloud redis instances describe livekit-redis --region=us-central1

# SSH a una instancia
gcloud compute ssh livekit-node-0 --zone=us-central1-a
```

---

## 10. Costos Estimados (GCP us-central1)

| Recurso                   | Cantidad    | Costo/mes (USD) |
| ------------------------- | ----------- | --------------- |
| c2-standard-4 (on-demand) | 2 nodos     | $280 × 2 = $560 |
| Cloud Memorystore (50 GB) | 1 instancia | $450            |
| Network LB (passthrough)  | 1           | $25             |
| Bandwidth egress (10 TB)  | -           | $800            |
| **Total aproximado**      | -           | **~$1,835/mes** |

_Nota:_ Con **Committed Use Discount (1 año)** se ahorra ~40% → ~$1,100/mes.

---

**Documento creado:** 2026-04-19  
**Estado:** Implementación en progreso  
**Siguiente paso:** Desplegar clúster en GCP y ejecutar load test
