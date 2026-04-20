#!/bin/bash
#
# Deploy script for Connect PH Backend to GCP
# Requiere: gcloud CLI instalado y autenticado
#

set -e

PROJECT_ID="connect-ph-${USER}"
REGION="us-central1"
ZONE="us-central1-a"
SERVICE_NAME="connect-ph-api"
SERVICE_ACCOUNT="deploy@${PROJECT_ID}.iam.gserviceaccount.com"

echo "================================"
echo "Connect PH Backend - GCP Deploy"
echo "================================"
echo ""

# 1. Configurar proyecto GCP
echo "1. Configurando proyecto GCP..."
gcloud config set project $PROJECT_ID

# 2. Habilitar APIs necesarias
echo "2. Habilitando APIs..."
gcloud services enable \
  compute.googleapis.com \
  run.googleapis.com \
  redis.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# 3. Crear Secret Manager para LIVEKIT credentials
echo "3. Configurando Secret Manager..."
gcloud secrets create LIVEKIT_API_KEY --replication-policy="automatic" 2>/dev/null || true
gcloud secrets create LIVEKIT_API_SECRET --replication-policy="automatic" 2>/dev/null || true

echo "   IMPORTANTE: Sube tus LIVEKIT_API_KEY y LIVEKIT_API_SECRET a Secret Manager:"
echo "   gcloud secrets versions add LIVEKIT_API_KEY --data-file=<(echo -n 'tu_api_key')"
echo "   gcloud secrets versions add LIVEKIT_API_SECRET --data-file=<(echo -n 'tu_api_secret')"

# 4. Deploy to Cloud Run (serverless) o GCE (VMs)
echo ""
echo "4. Selecciona opción de despliegue:"
echo "   a) Cloud Run (serverless, auto-scaling, recomendado para APIs)"
echo "   b) Compute Engine (VMs, control total, necesario para LiveKit)"
read -p "   Opción (a/b): " option

case $option in
  a)
    echo "   Desplegando en Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
      --source . \
      --region $REGION \
      --platform managed \
      --allow-unauthenticated \
      --set-env-vars "LIVEKIT_URL=${LIVEKIT_URL:-https://your-livekit-lb.com},LIVEKIT_REDIS_HOST=${LIVEKIT_REDIS_HOST:-}" \
      --update-secrets="LIVEKIT_API_KEY=LIVEKIT_API_KEY:latest,LIVEKIT_API_SECRET=LIVEKIT_API_SECRET:latest"
    ;;
  b)
    echo "   Creando instancia Compute Engine..."
    # Crear模板 de instancia desde Dockerfile
    gcloud compute instances create-with-container $SERVICE_NAME \
      --container-image=gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
      --zone=$ZONE \
      --machine-type=c2-standard-4 \
      --scopes="https://www.googleapis.com/auth/cloud-platform" \
      --environment-variables="LIVEKIT_URL=${LIVEKIT_URL},LIVEKIT_REDIS_HOST=${LIVEKIT_REDIS_HOST}"
    ;;
  *)
    echo "   Opción no válida"
    exit 1
    ;;
esac

echo ""
echo "✅ Deploy completado!"
echo ""
echo "Próximos pasos:"
echo "1. Configurar LiveKit Cluster (GCP MIG + Redis):"
echo "   $ cd infrastructure/livekit-cluster"
echo "   $ terraform apply"
echo ""
echo "2. Verificar health:"
echo "   curl https://${SERVICE_NAME}-${PROJECT_ID}.run.app/health"
echo ""
echo "3. Acceder a Swagger docs:"
echo "   https://${SERVICE_NAME}-${PROJECT_ID}.run.app/api/docs"
echo ""
