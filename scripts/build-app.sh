#!/bin/bash

# Build and push main tandembrain application to Google Artifact Registry

set -e

# Configuration
PROJECT_ID="neuronotify"
REGION="us-west2"
REPOSITORY="tandembrain"
IMAGE_NAME="tandembrain-app"
FULL_IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}"

echo "🚀 Building tandembrain application..."

# Ensure we're in the right directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if repository exists, if not create it
echo "📦 Checking Artifact Registry repository..."
if ! gcloud artifacts repositories describe ${REPOSITORY} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
    echo "Creating repository ${REPOSITORY}..."
    gcloud artifacts repositories create ${REPOSITORY} \
        --repository-format=docker \
        --location=${REGION} \
        --description="Tandembrain application images" \
        --project=${PROJECT_ID}
fi

# Configure Docker to use gcloud as credential helper
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t ${FULL_IMAGE_NAME}:latest .

# Tag with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag ${FULL_IMAGE_NAME}:latest ${FULL_IMAGE_NAME}:${TIMESTAMP}

# Push to Artifact Registry
echo "⬆️  Pushing to Artifact Registry..."
docker push ${FULL_IMAGE_NAME}:latest
docker push ${FULL_IMAGE_NAME}:${TIMESTAMP}

echo "✅ Build complete!"
echo "📋 Image pushed:"
echo "   - ${FULL_IMAGE_NAME}:latest"
echo "   - ${FULL_IMAGE_NAME}:${TIMESTAMP}"
echo ""
echo "🚀 To deploy, update the image in your Kubernetes manifests and run:"
echo "   kubectl apply -f k8s/"