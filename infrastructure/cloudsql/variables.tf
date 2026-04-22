variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region (ej: us-central1)"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone para HA (ej: us-central1-a)"
  type        = string
  default     = "us-central1-a"
}

variable "vpc_id" {
  description = "VPC network ID (ej: projects/PROJECT_ID/global/networks/livekit-vpc)"
  type        = string
}

variable "environment" {
  description = "Environment label (dev, staging, prod)"
  type        = string
  default     = "testing" # TODO PRODUCCION: Cambiar a "production"
}

variable "db_password" {
  description = "Password para usuario connect_ph_user (se guardará en Secret Manager)"
  type        = string
  sensitive   = true
}

variable "enable_replica" {
  description = "Crear réplica de lectura para consultas (recomendado para >2000 usuarios)"
  type        = bool
  default     = false
}

variable "machine_tier" {
  description = "Tier de Cloud SQL (db-g1-small para pruebas, db-custom-4-15360 para prod)"
  type        = string
  default     = "db-g1-small"
}
