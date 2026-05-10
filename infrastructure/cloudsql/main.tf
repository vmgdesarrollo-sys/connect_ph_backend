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
# 1. Cloud SQL - PostgreSQL (Pruebas)
# TODO PRODUCCION: Cambiar a tier db-custom-4-15360 o superior
# TODO PRODUCCION: Cambiar availability_type a "REGIONAL" para HA
# TODO PRODUCCION: Aumentar disk_size a 100GB y habilitar storage_auto_resize
# TODO PRODUCCION: Habilitar point_in_time_recovery_enabled = true
# TODO PRODUCCION: Aumentar max_connections a 300+
# =============================================
resource "google_sql_database_instance" "main" {
  name             = "connect-ph-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.machine_tier
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 10

    maintenance_window {
      day  = 7
      hour = 4
    }

    database_flags {
      name  = "max_connections"
      value = "50"
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00"
      location   = "us"
      backup_retention_settings {
        retained_backups = 3
      }
    }

    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name = "allow-all"
        value = "0.0.0.0/0"
      }
      # private_network = var.vpc_id  # TODO PRODUCCION: Habilitar private IP
    }
  }

  deletion_protection = false
}

# =============================================
# 2. Base de Datos
# =============================================
resource "google_sql_database" "main" {
  name     = "connect_ph_prod"
  instance = google_sql_database_instance.main.name
  charset  = "UTF8"
}

# =============================================
# 3. Usuario de aplicación
# =============================================
resource "google_sql_user" "app" {
  name     = "connect_ph_user"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# =============================================
# 4. Secret Manager (password) - omitido para pruebas
# Para prod: descomentar cuando el provider soporte replication
# =============================================
# resource "google_secret_manager_secret" "db_password" {
#   secret_id = "connect-ph-db-password"
#   replication { automatic = true }
# }
# resource "google_secret_manager_secret_version" "db_password" {
#   secret = google_secret_manager_secret.db_password.name
#   secret_data = var.db_password
# }

# =============================================
# 5. Outputs
# =============================================
output "instance_name" {
  description = "Nombre de la instancia"
  value       = google_sql_database_instance.main.name
}

output "connection_name" {
  description = "Connection name para Cloud SQL Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "private_ip" {
  description = "IP privada de la instancia"
  value       = google_sql_database_instance.main.private_ip_address
}

output "public_ip" {
  description = "IP pública de la instancia"
  value       = google_sql_database_instance.main.ip_address
}

output "database_name" {
  description = "Nombre de la base de datos"
  value       = google_sql_database.main.name
}

output "username" {
  description = "Usuario de la aplicación"
  value       = google_sql_user.app.name
}

# output "secret_name" {
#   description = "Nombre del secreto en Secret Manager"
#   value       = google_secret_manager_secret.db_password.name
# }

output "connection_string" {
  description = "Connection string para NestJS"
  value       = "postgresql://connect_ph_user:${var.db_password}@${google_sql_database_instance.main.private_ip_address}:5432/connect_ph_prod?sslmode=require"
  sensitive   = true
}

resource "google_project_iam_member" "cloudsql_iam" {
  for_each = toset([
    "roles/cloudsql.client",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudsql_sa.email}"
}

# =============================================
# 5. Outputs
# =============================================
output "instance_name" {
  description = "Nombre de la instancia"
  value       = google_sql_database_instance.main.name
}

output "connection_name" {
  description = "Connection name para Cloud SQL Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "private_ip" {
  description = "IP privada de la instancia"
  value       = google_sql_database_instance.main.private_ip_address
}

output "public_ip" {
  description = "IP pública de la instancia"
  value       = google_sql_database_instance.main.ip_address
}

output "database_name" {
  description = "Nombre de la base de datos"
  value       = google_sql_database.main.name
}

output "username" {
  description = "Usuario de la aplicación"
  value       = google_sql_user.app.name
}

# output "secret_name" {
#   description = "Nombre del secreto en Secret Manager"
#   value       = google_secret_manager_secret.db_password.name
# }

output "connection_string" {
  description = "Connection string para NestJS"
  value       = "postgresql://connect_ph_user:${var.db_password}@${google_sql_database_instance.main.private_ip_address}:5432/connect_ph_prod?sslmode=require"
  sensitive   = true
}

# IAM role for Cloud SQL Admin (needed to change instance tier)
resource "google_project_iam_member" "cloudsql_scheduler_iam" {
  for_each = toset([
    "roles/cloudsql.admin",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudsql_scheduler_sa.email}"
}

# =============================================
# 6. Cloud Scheduler Jobs to reduce Cloud SQL tier during off-hours
# =============================================
resource "google_cloud_scheduler_job" "cloudsql_reduce_tier" {
  name     = "cloudsql-reduce-tier"
  description = "Reduce Cloud SQL tier to minimum during off-hours (8PM-8AM)"
  schedule = "0 20 * * *"  # 8:00 PM
  time_zone = "America/Bogota"

  attempt_deadline = "30s"

  http_target {
    http_method = "PATCH"
    uri = "https://sqladmin.googleapis.com/v1beta4/projects/${var.project_id}/instances/connect-ph-db-instance"

    oidc_token {
      service_account_email = google_service_account.cloudsql_scheduler_sa.email
      # Use cloud-platform scope for full access, or sqlservice.admin for more restricted
      scope = "https://www.googleapis.com/auth/cloud-platform"
    }

    headers = {
      "Content-Type" = "application/json"
    }

    body = jsonencode({
      settings = {
        tier = "db-f1-micro"
      }
    })
  }
}

resource "google_cloud_scheduler_job" "cloudsql_restore_tier" {
  name     = "cloudsql-restore-tier"
  description = "Restore Cloud SQL tier to normal during business hours (8AM-8PM)"
  schedule = "0 8 * * *"  # 8:00 AM
  time_zone = "America/Bogota"

  attempt_deadline = "30s"

  http_target {
    http_method = "PATCH"
    uri = "https://sqladmin.googleapis.com/v1beta4/projects/${var.project_id}/instances/connect-ph-db-instance"

    oidc_token {
      service_account_email = google_service_account.cloudsql_scheduler_sa.email
      scope = "https://www.googleapis.com/auth/cloud-platform"
    }

    headers = {
      "Content-Type" = "application/json"
    }

    body = jsonencode({
      settings = {
        tier = var.machine_tier  # Use the variable tier (db-g1-small or db-f1-micro)
      }
    })
  }
}

output "connection_name" {
  description = "Connection name para Cloud SQL Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "private_ip" {
  description = "IP privada de la instancia"
  value       = google_sql_database_instance.main.private_ip_address
}

output "public_ip" {
  description = "IP pública de la instancia"
  value       = google_sql_database_instance.main.ip_address
}

output "database_name" {
  description = "Nombre de la base de datos"
  value       = google_sql_database.main.name
}

output "username" {
  description = "Usuario de la aplicación"
  value       = google_sql_user.app.name
}

# output "secret_name" {
#   description = "Nombre del secreto en Secret Manager"
#   value       = google_secret_manager_secret.db_password.name
# }

output "connection_string" {
  description = "Connection string para NestJS"
  value       = "postgresql://connect_ph_user:${var.db_password}@${google_sql_database_instance.main.private_ip_address}:5432/connect_ph_prod?sslmode=require"
  sensitive   = true
}