terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# =============================================
# 1. VPC Network
# =============================================
resource "google_compute_network" "livekit_vpc" {
  name                    = "livekit-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "livekit_subnet" {
  name          = "livekit-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.livekit_vpc.id

  private_ip_google_access = true
}

# =============================================
# 2. Cloud Memorystore (Redis) - Cost Optimized
# PRODUCCION: Cambiar tier a "STANDARD_HA" para redundancia
# PRODUCCION: Aumentar memory_size_gb a 50GB o más
# =============================================
resource "google_redis_instance" "livekit_redis" {
  name           = "livekit-redis"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region

  redis_version = "REDIS_7_0"
  location_id   = var.zone

  authorized_network = google_compute_network.livekit_vpc.id

  labels = {
    environment = var.environment
    purpose     = "livekit-cluster"
  }
}

# =============================================
# 7. Instance Schedule for LiveKit nodes (8PM-8AM)
# =============================================
resource "google_compute_resource_policy" "livekit_schedule" {
  name        = "livekit-schedule"
  region      = var.region

  instance_schedule_policy {
    vm_start_schedule {
      schedule = "0 8 * * *"
    }
    vm_stop_schedule {
      schedule = "0 20 * * *"
    }
    time_zone = "America/Bogota"
  }
}

# =============================================
# 3. Service Account para LiveKit nodes
# =============================================
resource "google_service_account" "livekit_sa" {
  account_id   = "livekit-node-sa"
  display_name = "LiveKit Node Service Account"
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
# 4. Instance Template for LiveKit Node (Cost-Optimized - Preemptible)
# =============================================
resource "google_compute_instance_template" "livekit_node" {
  name_prefix  = "livekit-node-"
  region       = var.region
  machine_type = "e2-micro"

  scheduling {
    preemptible        = var.use_preemptible
    automatic_restart  = !var.use_preemptible
    on_host_maintenance = var.use_preemptible ? "TERMINATE" : "MIGRATE"
  }

  disk {
    source_image = "ubuntu-os-cloud/ubuntu-2204-lts"
    auto_delete  = true
    boot         = true
    disk_size_gb = 10
    disk_type    = "pd-balanced"
  }

  network_interface {
    network    = google_compute_network.livekit_vpc.id
    subnetwork = google_compute_subnetwork.livekit_subnet.id
    access_config {
      # Ephemeral IP for startup script only
    }
  }

  metadata = {
    ssh-keys                = var.ssh_key != "" ? "admin:${var.ssh_key}" : ""
    shutdown-script         = var.use_preemptible ? "#!/bin/bash\nsystemctl stop livekit || true" : ""
    terminate-notice-sec    = var.use_preemptible ? "30" : ""
  }

  metadata_startup_script = <<-EOF
  #!/bin/bash
  set -e

  # Fast install: skip upgrade, use Docker convenience script
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker

  # Pre-download LiveKit binary & image
  curl -sSL https://get.livekit.io/cli | bash
  mv livekit /usr/local/bin/

  # Pull LiveKit server image in background
  docker pull livekit/livekit-server:latest &

  # Configure LiveKit
  cat > /etc/livekit.yml << LIVEKIT
  port: 7880
  udp_port: 50000-60000
  redis:
    address: "${google_redis_instance.livekit_redis.host}:${google_redis_instance.livekit_redis.port}"
    password: "${google_redis_instance.livekit_redis.auth_string}"
    prefix: "livekit-cluster"
  node_id: "livekit-node-$(hostname)"
  bind_addresses: ["0.0.0.0"]
  room_auto_delete_delay: 300
  log_level: warn
  rtc:
    port_range:
      start: 50000
      end: 60000
  prometheus:
    enable: true
    listen: ":9090"
  LIVEKIT

  # Ulimit
  cat > /etc/security/limits.d/99-livekit.conf << LIMIT
  * soft nofile 65535
  * hard nofile 65535
  LIMIT

  # Wait for Docker image to finish pulling
  wait

  # Run LiveKit via Docker (faster startup, easier updates)
  docker run -d --name livekit-server --restart unless-stopped \
    -p 7880:7880 -p 50000-60000:50000-60000/udp \
    -v /etc/livekit.yml:/etc/livekit.yml \
    -e LIVEKIT_KEY="${var.livekit_api_key}" \
    -e LIVEKIT_SECRET="${var.livekit_api_secret}" \
    livekit/livekit-server:latest

  echo "LiveKit node ready"
  EOF

  service_account {
    email  = google_service_account.livekit_sa.email
    scopes = ["cloud-platform"]
  }

  tags = ["livekit-node", "livekit-udp", "livekit-tcp"]

  labels = {
    environment = var.environment
    purpose     = "livekit-node"
    cluster     = "connect-ph"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================
# 5. Managed Instance Group (MIG) - Cost-Optimized with Autoscaler
# =============================================
resource "google_compute_region_instance_group_manager" "livekit_mig" {
  name               = "livekit-mig"
  region             = var.region
  base_instance_name = "livekit-node"
  version {
    instance_template = google_compute_instance_template.livekit_node.id
    name              = "primary"
  }

  target_size        = var.initial_node_count
  distribution_policy_zones = [var.zone]

  named_port {
    name = "livekit-tcp"
    port = 7880
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.livekit_health_check.id
    initial_delay_sec = 60
  }
}

# =============================================
# 5b. Autoscaler - Scale to zero when idle
# =============================================
resource "google_compute_region_autoscaler" "livekit_autoscaler" {
  count = var.enable_autoscaler ? 1 : 0

  name   = "livekit-autoscaler"
  region = var.region
  target = google_compute_region_instance_group_manager.livekit_mig.id

  autoscaling_policy {
    max_replicas    = var.autoscaler_max_replicas
    min_replicas    = var.autoscaler_min_replicas
    cooldown_period = 60

    cpu_utilization {
      target = var.autoscaler_target_cpu_utilization
    }
  }
}

# =============================================
# 6. Health Checks
# =============================================
resource "google_compute_health_check" "livekit_health_check" {
  name                = "livekit-health-check"
  check_interval_sec  = 30
  timeout_sec         = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3

  tcp_health_check {
    port_name = "livekit-tcp"
    port      = 7880
    request   = "GET /health HTTP/1.0\r\n\r\n"
    response  = "200"
  }
}

resource "google_compute_health_check" "livekit_tcp_health" {
  name                = "livekit-tcp-health"
  check_interval_sec  = 30
  timeout_sec         = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3

  tcp_health_check {
    port = 7880
  }
}

# =============================================
# 6. Load Balancer Global
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
  ip_address = google_compute_global_address.livekit_lb_ip.address
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

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["livekit-node"]

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
  description = "IP pública del Load Balancer Global (usar en LIVEKIT_URL)"
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