terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# =============================================
# 1. VPC Network
# =============================================
resource "google_compute_network" "livekit_vpc" {
  name                    = "livekit-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

resource "google_compute_subnetwork" "livekit_subnet" {
  name          = "livekit-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.livekit_vpc.id
  
  private_ip_google_access = true
}

# =============================================
# 2. Cloud Memorystore (Redis) - HA
# =============================================
resource "google_redis_instance" "livekit_redis" {
  name               = "livekit-redis"
  tier               = "STANDARD_HA"
  memory_size_gb     = 50
  region             = var.region
  
  redis_version      = "REDIS_6_X"
  location_id        = var.zone
  
  authorized_network = google_compute_network.livekit_vpc.id
  
  maintenance_policy {
    day          = "SUNDAY"
    hour         = 3
  }
  
  labels = {
    environment = var.environment
    purpose     = "livekit-cluster"
  }
}

# =============================================
# 3. Service Account para LiveKit nodes
# =============================================
resource "google_service_account" "livekit_sa" {
  name            = "livekit-node-sa"
  description     = "Service account for LiveKit cluster nodes"
  account_id      = "livekit-node-sa"
  display_name    = "LiveKit Node Service Account"
}

# IAM roles mínimos
resource "google_project_iam_member" "livekit_sa_roles" {
  for_each = toset([
    "roles/redis.viewer",
    "roles/monitoring.viewer",
    "roles/logging.logWriter",
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.livekit_sa.email}"
}

# =============================================
# 4. Instance Template for LiveKit Nodes
# =============================================
resource "google_compute_instance_template" "livekit_node" {
  name_prefix          = "livekit-node-"
  base_instance_name   = "livekit-node"
  region               = var.region
  machine_type         = "c2-standard-4"

  # Boot disk
  disk {
    source_image = "ubuntu-os-cloud/ubuntu-2204-lts-amd64-v20230620"
    auto_delete  = true
    boot         = true
    disk_size_gb = 50
    disk_type    = "pd-ssd"
  }

  # Network
  network_interface {
    network    = google_compute_network.livekit_vpc.id
    subnetwork = google_compute_subnetwork.livekit_subnet.id
  }

  # Metadata
  metadata = {
    ssh-keys = var.ssh_key != "" ? "admin:${var.ssh_key}" : ""
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    set -e
    
    apt-get update && apt-get upgrade -y
    
    # Instalar Docker
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Descargar LiveKit binary
    curl -sSL https://get.livekit.io/cli | bash
    mv livekit /usr/local/bin/
    
    # Configurar LiveKit
    cat > /etc/livekit.yml << LIVEKIT
port: 7880
udp_port: 50000-60000
redis:
  address: "${google_redis_instance.livekit_redis.host}:${google_redis_instance.livekit_redis.port}"
  password: "${google_redis_instance.livekit_redis.auth_string}"
  prefix: "livekit-cluster"
node_id: "livekit-node-\$(hostname)"
room_auto_delete_delay: 300
log_level: info
prometheus:
  enable: true
  listen: ":9090"
LIVEKIT
    
    # Ajustar ulimit
    cat > /etc/security/limits.d/99-livekit.conf << LIMIT
*               soft    nofile          65535
*               hard    nofile          65535
root            soft    nofile          65535
root            hard    nofile          65535
LIMIT
    
    # Ajustar kernel buffers
    cat > /etc/sysctl.d/99-livekit.conf << SYSCTL
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.rmem_default = 262144
net.core.wmem_default = 262144
net.core.netdev_max_backlog = 5000
SYSCTL
    
    sysctl -p /etc/sysctl.d/99-livekit.conf
    
    # Systemd service
    cat > /etc/systemd/system/livekit.service << SERVICE
[Unit]
Description=LiveKit Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/livekit-server --config /etc/livekit.yml
Restart=on-failure
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
SERVICE
    
    systemctl daemon-reload
    systemctl enable livekit
    systemctl start livekit
    
    # Health check
    sleep 5
    curl -f http://localhost:7880/health || exit 1
    
    echo "LiveKit node listo"
  EOF

  # Service Account
  service_account {
    email  = google_service_account.livekit_sa.email
    scopes = ["cloud-platform"]
  }

  # Tags para firewall
  tags = ["livekit-node", "livekit-udp", "livekit-tcp"]

  labels = {
    environment = var.environment
    purpose     = "livekit-node"
    cluster     = "connect-ph"
  }
}

# =============================================
# 5. Managed Instance Group (MIG)
# =============================================
resource "google_compute_region_instance_group_manager" "livekit_mig" {
  name               = "livekit-mig"
  region             = var.region
  version {
    instance_template = google_compute_instance_template.livekit_node.id
    name              = "primary"
  }

  target_size        = var.initial_node_count
  
  auto_healing_policies {
    health_check      = google_compute_health_check.livekit_health_check.id
    initial_delay_sec = 300
  }

  named_port {
    name = "livekit-tcp"
    port = 7880
  }
  
  named_port {
    name = "livekit-metrics"
    port = 9090
  }
}

# AutoScaler
resource "google_compute_region_autoscaler" "livekit_autoscaler" {
  name   = "livekit-autoscaler"
  region = var.region
  target = google_compute_region_instance_group_manager.livekit_mig.id

  autoscaling_policy {
    min_replicas    = var.min_nodes
    max_replicas    = var.max_nodes
    cooldown_period = 300

    cpu_utilization {
      target = 0.65
    }
  }
}

# =============================================
# 6. Health Checks
# =============================================
resource "google_compute_health_check" "livekit_health_check" {
  name               = "livekit-health-check"
  check_interval_sec = 30
  timeout_sec        = 10
  healthy_threshold  = 2
  unhealthy_threshold = 3

  tcp_health_check {
    port_name = "livekit-tcp"
    port      = 7880
    request   = "GET /health HTTP/1.0\r\n\r\n"
    response  = "200"
  }
}

resource "google_compute_health_check" "livekit_tcp_health" {
  name               = "livekit-tcp-health"
  check_interval_sec = 30
  timeout_sec        = 10
  healthy_threshold  = 2
  unhealthy_threshold = 3
  
  tcp_health_check {
    port = 7880
  }
}

# =============================================
# 7. Load Balancer (TCP)
# =============================================
resource "google_compute_global_address" "livekit_lb_ip" {
  name = "livekit-lb-ip"
}

resource "google_compute_backend_service" "livekit_backend" {
  name                  = "livekit-backend"
  protocol              = "TCP"
  port_name             = "livekit-tcp"
  timeout_sec           = 3600
  load_balancing_scheme = "EXTERNAL"
  
  backend {
    group           = google_compute_region_instance_group_manager.livekit_mig.instance_group
    balancing_mode  = "UTILIZATION"
    max_utilization = 0.8
  }

  health_checks = [google_compute_health_check.livekit_tcp_health.id]
}

resource "google_compute_target_tcp_proxy" "livekit_proxy" {
  name            = "livekit-tcp-proxy"
  backend_service = google_compute_backend_service.livekit_backend.id
}

resource "google_compute_global_forwarding_rule" "livekit_tcp" {
  name       = "livekit-tcp-forwarding"
  ip_address = google_compute_global_address.livekit_lb_ip.id
  port_range = "7880"
  target     = google_compute_target_tcp_proxy.livekit_proxy.id
}

# =============================================
# 8. Firewall Rules
# =============================================
resource "google_compute_firewall" "allow_livekit_tcp" {
  name    = "allow-livekit-tcp"
  network = google_compute_network.livekit_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["7880"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["livekit-node"]

  description = "Allow TCP traffic from Load Balancer to LiveKit nodes"
}

resource "google_compute_firewall" "allow_livekit_udp" {
  name    = "allow-livekit-udp"
  network = google_compute_network.livekit_vpc.name

  allow {
    protocol = "udp"
    ports    = ["50000-60000"]
  }

  target_tags = ["livekit-node"]

  description = "Allow UDP traffic for video/audio (50000-60000)"
}

resource "google_compute_firewall" "allow_health_checks" {
  name    = "allow-health-checks"
  network = google_compute_network.livekit_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["livekit-node"]

  description = "Allow health checks from GCP"
}

# =============================================
# 9. Outputs
# =============================================
output "livekit_lb_ip" {
  description = "IP pública del Load Balancer (usar en LIVEKIT_URL)"
  value       = google_compute_global_address.livekit_lb_ip.address
}

output "redis_host" {
  description = "Host de Redis (usar en LIVEKIT_REDIS_HOST)"
  value       = google_redis_instance.livekit_redis.host
}

output "redis_port" {
  description = "Puerto de Redis"
  value       = google_redis_instance.livekit_redis.port
}

output "instances" {
  description = "Lista de instancias LiveKit creadas"
  value       = google_compute_region_instance_group_manager.livekit_mig.instance_group
}

output "backend_service" {
  description = "Backend service del Load Balancer"
  value       = google_compute_backend_service.livekit_backend.id
}
