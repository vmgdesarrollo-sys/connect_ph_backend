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
  default     = "production"
}

variable "ssh_key" {
  description = "SSH public key for admin access (optional)"
  type        = string
  default     = ""
}

variable "initial_node_count" {
  description = "Initial number of LiveKit nodes"
  type        = number
  default     = 2
}

variable "min_nodes" {
  description = "Minimum number of nodes in MIG"
  type        = number
  default     = 2
}

variable "max_nodes" {
  description = "Maximum number of nodes in MIG"
  type        = number
  default     = 10
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
