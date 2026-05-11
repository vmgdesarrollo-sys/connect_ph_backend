#!/bin/bash
#
# Deploy script for Connect PH Backend to GCP
# Automatiza: Cloud SQL + LiveKit Cluster + Cloud Run API
#
# USO:
#   ./deploy-gcp.sh [command]
#
# Comandos:
#   init           - Configurar GCP project y APIs
#   secrets        - Crear y subir secrets a GitHub
#   terraform      - Aplicar Terraform (DB + LiveKit)
#   deploy-api     - Desplegar API a Cloud Run
#   full           - Despliegue completo (recommended)
#   destroy        - Eliminar toda la infraestructura (¡CUIDADO!)
#

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
PROJECT_ID="${GCP_PROJECT_ID:-connect-ph-123456}"
REGION="us-central1"
SERVICE_NAME="connect-ph-api"
TERRAFORM_DIR_CLOUDSQL="infrastructure/cloudsql"
TERRAFORM_DIR_LIVEKIT="infrastructure/livekit-cluster"

# Funciones de ayuda
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Verificando prerrequisitos..."
  
  # Verificar gcloud
  if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI no instalado. Instalar: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
  
  # Verificar terraform
  if ! command -v terraform &> /dev/null; then
    log_error "Terraform no instalado. Instalar: https://terraform.io/downloads"
    exit 1
  fi
  
  # Verificar autenticación
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    log_error "No autenticado en gcloud. Ejecutar: gcloud auth application-default login"
    exit 1
  fi
  
  log_info "Prerrequisitos OK ✅"
}

cmd_init() {
  log_info "Configurando GCP project..."
  
  # Set project
  gcloud config set project $PROJECT_ID
  
  # Habilitar APIs
  log_info "Habilitando APIs necesarias..."
  gcloud services enable \
    sqladmin.googleapis.com \
    compute.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    redis.googleapis.com \
    cloudbuild.googleapis.com \
    iam.googleapis.com
  
  log_info "Project configurado ✅"
}

cmd_secrets() {
  log_info "Creando secrets en GitHub..."
  
  # Verificar que gh esté instalado
  if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) no instalado. Instalar: https://cli.github.com/"
    exit 1
  fi
   # Pedir valores interactivamente
   read -p "DB_PASSWORD (generar automáticamente? s/n): " gen_pass
   if [[ $gen_pass =~ ^[Ss]$ ]]; then
     DB_PASS=$(openssl rand -base64 32)
     log_info "DB_PASSWORD generado: $DB_PASS"
   else
     read -p "DB_PASSWORD: " DB_PASS
   fi
   
   read -p "LIVEKIT_API_KEY: " LIVEKIT_KEY
   read -p "LIVEKIT_API_SECRET: " LIVEKIT_SECRET
   read -p "JWT_SECRET (dejar vacío para generar): " JWT_SECRET
   
   if [[ -z "$JWT_SECRET" ]]; then
     JWT_SECRET=$(openssl rand -base64 64)
     log_info "JWT_SECRET generado: $JWT_SECRET"
   fi
   
   # Valores fijos para otros secrets
   VPC_ID="projects/$PROJECT_ID/global/networks/livekit-vpc"
   CORS_ORIGINS="https://app.connectph.com"
   
   # Crear/actualizar secrets via gh CLI
   log_info "Subiendo secrets a GitHub..."
   
   gh secret set DB_PASSWORD -b"$DB_PASS"
   gh secret set LIVEKIT_API_KEY -b"$LIVEKIT_KEY"
   gh secret set LIVEKIT_API_SECRET -b"$LIVEKIT_SECRET"
   gh secret set JWT_SECRET -b"$JWT_SECRET"
   gh secret set GCP_PROJECT_ID -b"$PROJECT_ID"
   gh secret set VPC_ID -b"$VPC_ID"
   gh secret set CORS_ORIGINS -b"$CORS_ORIGINS"
  
  # Service Account key
  if [[ -f "$HOME/github-actions-key.json" ]]; then
    log_info "Subiendo GCP_SA_KEY..."
    gh secret set GCP_SA_KEY < "$HOME/github-actions-key.json"
  else
    log_error "No se encontró $HOME/github-actions-key.json"
    log_info "Crear service account y descargar key primero (ver GITHUB-ACTIONS-SETUP.md)"
  fi
  
  log_info "Secrets configurados ✅"
}

cmd_terraform() {
  log_info "Desplegando infraestructura con Terraform..."
  
  # 1. Cloud SQL
  log_info "1/2 Desplegando Cloud SQL..."
  cd "$TERRAFORM_DIR_CLOUDSQL"
  
  terraform init -upgrade
  
  # Crear tfvars si no existe
  if [[ ! -f terraform.tfvars ]]; then
    log_info "Creando terraform.tfvars desde ejemplo..."
    cp terraform.tfvars.example terraform.tfvars
    log_warn "EDITAR terraform.tfvars con tus valores antes de continuar"
    log_info "Variables requeridas: project_id, vpc_id, db_password"
    read -p "Continuar de todas formas? (s/N): " confirm
    if [[ ! $confirm =~ ^[Ss]$ ]]; then
      exit 1
    fi
  fi
  
  terraform apply -auto-approve
  
   # Capturar outputs
   DB_HOST=$(terraform output -json public_ip | jq -r '.[] | select(.type == "PRIMARY") | .ip_address')
   DB_NAME=$(terraform output -raw database_name)
   DB_USER=$(terraform output -raw username)
   
   log_info "Cloud SQL desplegado ✅"
   log_info "  DB_HOST: $DB_HOST"
   log_info "  DB_NAME: $DB_NAME"
   log_info "  DB_USER: $DB_USER"
   
   cd ../..
   
   # 2. LiveKit Cluster
   log_info "2/2 Desplegando LiveKit Cluster..."
   cd "$TERRAFORM_DIR_LIVEKIT"
   
   terraform init -upgrade
   
   if [[ ! -f terraform.tfvars ]]; then
     cp terraform.tfvars.example terraform.tfvars
   fi
   
   terraform apply -auto-approve
   
   # Capturar outputs
   LIVEKIT_LB_IP=$(terraform output -raw livekit_lb_ip)
   LIVEKIT_REDIS_HOST=$(terraform output -raw redis_host)
   
   log_info "LiveKit Cluster desplegado ✅"
   log_info "  LB IP: $LIVEKIT_LB_IP"
   log_info "  Redis: $LIVEKIT_REDIS_HOST"
   
   cd ../..
   
   # Guardar outputs para deploy-api
   cat > .env.generated <<EOF
DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
LIVEKIT_LB_IP=$LIVEKIT_LB_IP
LIVEKIT_REDIS_HOST=$LIVEKIT_REDIS_HOST
EOF
  
  log_info "Variables guardadas en .env.generated ✅"
}

cmd_deploy_api() {
  log_info "Desplegando API a Cloud Run..."
  
   # Verificar que tenemos los outputs
   if [[ ! -f .env.generated ]]; then
     log_error "Ejecuta primero: ./deploy-gcp.sh terraform"
     exit 1
   fi

   source .env.generated

   # Configurar gcloud
   gcloud config set project $PROJECT_ID
   gcloud auth configure-docker us-central1-docker.pkg.dev

    # Build y deploy
    log_info "Building and deploying..."
    gcloud run deploy $SERVICE_NAME \
      --source . \
      --region $REGION \
      --platform managed \
      --allow-unauthenticated \
      --max-instances=5 \
      --set-env-vars "NODE_ENV=production" \
      --set-env-vars "DB_HOST=$DB_HOST" \
      --set-env-vars "DB_USER=$DB_USER" \
      --set-env-vars "DB_PASSWORD=$DB_PASSWORD" \
      --set-env-vars "DB_DATABASE=$DB_NAME" \
      --set-env-vars "DB_SSL=false" \
      --set-env-vars "DB_POOL_MAX=100" \
      --set-env-vars "DB_POOL_MIN=10" \
      --set-env-vars "LIVEKIT_URL=wss://$LIVEKIT_LB_IP:7880" \
      --set-env-vars "LIVEKIT_API_KEY=$LIVEKIT_API_KEY" \
      --set-env-vars "LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET" \
      --set-env-vars "LIVEKIT_REDIS_HOST=$LIVEKIT_REDIS_HOST" \
      --set-env-vars "LIVEKIT_REDIS_PORT=6379" \
      --set-env-vars "LIVEKIT_TTL=8h" \
      --set-env-vars "LIVEKIT_ROOM_STRATEGY=selective_forwarding" \
      --set-env-vars "LIVEKIT_MAX_PARTICIPANTS_PER_ROOM=2000" \
      --set-env-vars "JWT_SECRET=$JWT_SECRET" \
      --set-env-vars "JWT_EXPIRE=1h" \
      --set-env-vars "CORS_ORIGINS=$CORS_ORIGINS" \
      --set-env-vars "API_VERSION=api/v1" \
      --set-env-vars "MAIL_HOST=sandbox.smtp.mailtrap.io" \
      --set-env-vars "MAIL_PORT=587" \
      --set-env-vars "MAIL_USER=7819591e5a00bb" \
      --set-env-vars "MAIL_PASS=d32c3e5904b282" \
      --set-env-vars "MAIL_FROM=conectando@conectandoph.com" \
      --set-env-vars "MAIL_SECURE=false" \
      --set-env-vars "APP_BASE_URL=http://localhost:3000/auth/" \
      --set-env-vars "MAIL_REJECT_UNAUTHORIZED=false" \
      --format json \
      2>/dev/null | jq -r '.status.url' > api_url.txt
  
  API_URL=$(cat api_url.txt)
  
  log_info "API desplegada ✅"
  log_info "  URL: $API_URL"
  log_info "  Health: $API_URL/health"
  log_info "  Docs: $API_URL/api/docs"
  
  # Health check
  log_info "Esperando 30s por health check..."
  sleep 30
  
  if curl -f "$API_URL/health" -s | grep -q "ok"; then
    log_info "Health check passed ✅"
  else
    log_error "Health check failed!"
    log_info "Revisar logs: gcloud run services logs read $SERVICE_NAME --region $REGION"
    exit 1
  fi
}

cmd_destroy() {
  log_warn "¡ESTA OPERACIÓN ELIMINARÁ TODA LA INFRAESTRUCTURA!"
  read -p "¿Estás SEGURO? (escribe 'YES' para confirmar): " confirm
  
  if [[ "$confirm" != "YES" ]]; then
    log_info "Operación cancelada"
    exit 0
  fi
  
  log_info "Destruyendo infraestructura..."
  
  # Destroy en orden inverso
  cd "$TERRAFORM_DIR_LIVEKIT"
  terraform destroy -auto-approve
  cd ../..
  
  cd "$TERRAFORM_DIR_CLOUDSQL"
  terraform destroy -auto-approve
  cd ../..
  
  # Eliminar Cloud Run service
  gcloud run services delete $SERVICE_NAME --region $REGION --quiet || true
  
  # Eliminar secrets de GitHub (opcional)
  # gh secret delete DB_PASSWORD
  
  log_info "Infraestructura eliminada ✅"
}

# ============================================
# MAIN
# ============================================
case "${1:-help}" in
  init)
    check_prerequisites
    cmd_init
    ;;
  secrets)
    cmd_secrets
    ;;
  terraform)
    check_prerequisites
    cmd_terraform
    ;;
  deploy-api)
    cmd_deploy_api
    ;;
  full)
    check_prerequisites
    cmd_init
    cmd_terraform
    cmd_deploy_api
    ;;
  destroy)
    cmd_destroy
    ;;
  *)
    echo "Connect PH Backend - GCP Deploy Script"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  init       - Configurar GCP project y APIs (una vez)"
    echo "  secrets    - Crear/actualizar secrets en GitHub"
    echo "  terraform  - Desplegar Cloud SQL + LiveKit (infra)"
    echo "  deploy-api - Desplegar API a Cloud Run"
    echo "  full       - Despliegue completo (init → terraform → deploy-api)"
    echo "  destroy    - ⚠️  Eliminar toda la infraestructura"
    echo ""
    echo "Ejemplo rápido:"
    echo "  1. ./deploy-gcp.sh init"
    echo "  2. ./deploy-gcp.sh secrets  (configura keys en GitHub)"
    echo "  3. ./deploy-gcp.sh full"
    echo ""
    echo "Requisitos: gcloud, terraform, gh (opcional)"
    ;;
esac
