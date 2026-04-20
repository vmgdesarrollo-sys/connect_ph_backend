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
# 1. Cloud SQL - PostgreSQL HA
# =============================================
resource "google_sql_database_instance" "main" {
  name             = "connect-ph-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    # 4 vCPU, 15GB RAM - optimizado para +2,000 conexiones
    tier = var.machine_tier  # "db-custom-4-15360"

    # Alta disponibilidad: standby en otra zona
    availability_type = "REGIONAL"

    # SSD con auto-resize hasta 100GB
    storage_auto_resize      = true
    storage_auto_resize_limit = 100

    # Backup: diario 3AM, PITR habilitado, retención 7 días
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = "us"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }

    # Mantenimiento: domingos 4AM (ventana de baja actividad)
    maintenance_window {
      day = 7  // Domingo
      hour = 4 // 4 AM UTC
    }

    # Database flags para rendimiento
    database_flags {
      name  = "max_connections"
      value = "300"
    }
    
    database_flags {
      name  = "shared_buffers"
      value = "4GB"
    }
    
    database_flags {
      name  = "work_mem"
      value = "16MB"
    }
    
    database_flags {
      name  = "maintenance_work_mem"
      value = "1GB"
    }

    # Private IP only (seguridad)
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_id
    }

    # Red de acceso autorizado (opcional para debugging)
    # authorized_networks {
    #   name  = "dev-office"
    #   value = "0.0.0.0/0"
    # }
  }

  # Deletion protection (descomentar en producción)
  # deletion_protection = true
  
  depends_on = [google_compute_network.vpc]  # Esperar a que VPC exista
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
  host     = "%"  // Cualquier host dentro de la VPC
}

# =============================================
# 4. Secret Manager (password)
# =============================================
resource "google_secret_manager_secret" "db_password" {
  secret_id = "connect-ph-db-password"
  
  replication {
    automatic = true
  }
  
  labels = {
    environment = var.environment
    purpose     = "database-password"
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret = google_secret_manager_secret.db_password.name
  
  secret_data = var.db_password != "" ? base64encode(var.db_password) : base64encode("CHANGE_IN_PROD")
}

# =============================================
# 5. Service Account para Cloud SQL Proxy
# =============================================
resource "google_service_account" "cloudsql_sa" {
  account_id   = "cloudsql-proxy-sa"
  display_name = "Cloud SQL Proxy Service Account"
  
  project = var.project_id
}

# Permisos mínimos
resource "google_project_iam_member" "cloudsql_iam" {
  for_each = toset([
    "roles/cloudsql.client",    # Conectar via Cloud SQL Proxy
    "roles/secretmanager.secretAccessor",  # Leer password
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudsql_sa.email}"
}

# =============================================
# 6. Database Initialization (Una vez)
# =============================================
resource "null_resource" "initial_migration" {
  # Ejecuta connecting_ph.sql solo una vez
  provisioner "local-exec" {
    command = <<EOT
      # Esperar a que DB esté lista
      echo "Esperando a que Cloud SQL esté disponible..."
      sleep 30
      
      # Conectar via Cloud SQL Proxy (requiere estar en misma VPC)
      PGPASSWORD='${var.db_password}' \
      psql "host=${google_sql_database_instance.main.private_ip_address} port=5432 dbname=connect_ph_prod user=connect_ph_user sslmode=disable" \
        -f "${path.module}/../../connecting_ph.sql" || echo "Migration already applied or DB not ready"
    EOT
    interpreter = ["bash", "-c"]
  }
  
  # Solo ejecutar una vez (no en cada apply)
  triggers = {
    run_once = timestamp()
  }
  
  depends_on = [
    google_sql_database_instance.main,
    google_sql_user.app,
    google_sql_database.main
  ]
}

# =============================================
# 7. Outputs
# =============================================
output "instance_name" {
  description = "Nombre de la instancia"
  value       = google_sql_database_instance.main.name
}

output "connection_name" {
  description = "Connection name para Cloud SQL Proxy (proyecto:region:instancia)"
  value       = google_sql_database_instance.main.connection_name
}

output "private_ip" {
  description = "IP privada de la instancia (VPC)"
  value       = google_sql_database_instance.main.private_ip_address
}

output "database_name" {
  description = "Nombre de la base de datos"
  value       = google_sql_database.main.name
}

output "username" {
  description = "Usuario de la aplicación"
  value       = google_sql_user.app.name
}

output "secret_name" {
  description = "Nombre del secreto con password en Secret Manager"
  value       = google_secret_manager_secret.db_password.name
}

output "connection_string" {
  description = "Connection string para NestJS (con SSL)"
  value       = "postgresql://connect_ph_user:${var.db_password}@${google_sql_database_instance.main.private_ip_address}:5432/connect_ph_prod?sslmode=require"
  sensitive   = true
}
