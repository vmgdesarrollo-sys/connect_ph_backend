variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment label (dev, staging, prod)"
  type        = string
  default     = "testing" # TODO PRODUCCION: Cambiar a "production"
}

variable "ssh_key" {
  description = "SSH public key for admin access (optional)"
  type        = string
  default     = ""
}

variable "initial_node_count" {
  description = "Initial number of LiveKit nodes (1 for testing)"
  type        = number
  default     = 1
}

variable "min_nodes" {
  description = "Minimum number of nodes in MIG"
  type        = number
  default     = 1
}

variable "max_nodes" {
  description = "Maximum number of nodes in MIG"
  type        = number
  default     = 2
}

variable "use_preemptible" {
  description = "Use preemptible/spot VMs for ~80% cost savings"
  type        = bool
  default     = true
}

variable "enable_autoscaler" {
  description = "Enable autoscaler for the MIG (scale to zero when idle)"
  type        = bool
  default     = true
}

variable "autoscaler_min_replicas" {
  description = "Minimum replicas for autoscaler (0 = scale to zero when idle)"
  type        = number
  default     = 0
}

variable "autoscaler_max_replicas" {
  description = "Maximum replicas for autoscaler"
  type        = number
  default     = 4
}

variable "autoscaler_target_cpu_utilization" {
  description = "Target CPU utilization for autoscaler (0.0-1.0)"
  type        = number
  default     = 0.65
}

variable "livekit_api_key" {
  description = "LiveKit API Key (will be stored in Secret Manager)"
  type        = string
  sensitive   = true
}

variable "livekit_api_secret" {
  description = "LiveKit API Secret (will be stored in Secret Manager)"
  type        = string
  sensitive   = true
}
