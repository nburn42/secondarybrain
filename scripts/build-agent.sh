#!/bin/bash

# Neural Notify Agent Container Build Script
# Builds and pushes the agent Docker image to GCP Artifact Registry

set -e

# Configuration
PROJECT_ID="neuronotify"
REGION="us-west2"
REPOSITORY="neuronotifyagent"
IMAGE_NAME="neural-notify-agent"
TAG=${1:-latest}

# Full image path
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${TAG}"

echo "🚀 Building Neural Notify Agent Container"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Repository: ${REPOSITORY}"
echo "Image: ${IMAGE_NAME}:${TAG}"
echo "Full path: ${IMAGE_PATH}"
echo ""

# Configure Docker for GCP Artifact Registry
echo "🔧 Configuring Docker for GCP Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build the Docker image
echo "🏗️  Building Docker image..."
cd agent-container
docker build -t ${IMAGE_PATH} .

# Push to Artifact Registry
echo "📤 Pushing image to Artifact Registry..."
docker push ${IMAGE_PATH}

echo ""
echo "✅ Build complete!"
echo "Image available at: ${IMAGE_PATH}"
echo ""
echo "To run locally:"
echo "docker run -e JWT_TOKEN=your-jwt-token -e API_BASE_URL=http://host.docker.internal:5000 ${IMAGE_PATH}"