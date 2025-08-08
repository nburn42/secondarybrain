#!/bin/bash

# Set variables
PROJECT_ID="neuronotify"
REGION="us-west2"
REPOSITORY="tandembrain"
IMAGE_NAME="tandembrain-agent"
TAG="latest"

# Full image URL
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${TAG}"

# Clean up Docker space before build
echo "Cleaning up Docker space..."
docker system prune -f

# Build the Docker image
echo "Building task agent Docker image..."
docker build -t ${IMAGE_NAME} .

# Tag for Artifact Registry
echo "Tagging image for Artifact Registry..."
docker tag ${IMAGE_NAME} ${IMAGE_URL}

# Push to Artifact Registry
echo "Pushing to Artifact Registry..."
docker push ${IMAGE_URL}

echo "Build complete!"
echo "Image pushed to: ${IMAGE_URL}"

# Clean up local images after successful push
echo "Cleaning up local Docker images..."
docker rmi ${IMAGE_NAME} ${IMAGE_URL} 2>/dev/null || true
docker image prune -f