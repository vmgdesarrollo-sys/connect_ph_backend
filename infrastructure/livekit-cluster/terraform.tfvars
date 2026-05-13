project_id            = "project-0f0aa45c-bb59-45f2-9dc"
region                = "us-central1"
zone                  = "us-central1-a"
environment           = "testing"
ssh_key               = ""
livekit_api_key       = "test-key"
livekit_api_secret    = "test-secret"

# Cost optimization settings
use_preemptible       = true        # ~80% savings on VMs
enable_autoscaler     = true        # Scale to zero when idle
autoscaler_min_replicas  = 0        # Scale to zero when no traffic
autoscaler_max_replicas  = 4
autoscaler_target_cpu_utilization = 0.65