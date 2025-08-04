#!/bin/bash

# Complete deployment script for tandembrain to GKE

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "📄 .env file not found, fetching secrets from Google Secret Manager..."
    ./scripts/fetch-secrets.sh
    if [ -f .env ]; then
        echo "✅ .env file created successfully"
        export $(grep -v '^#' .env | xargs)
    else
        echo "❌ Failed to create .env file from Google Secret Manager"
        echo "   Please ensure you have access to the 'tandembrain-secrets' secret"
        echo "   Or create .env manually from .env.example"
        exit 1
    fi
fi

# Use environment variables or defaults
PROJECT_ID="${PROJECT_ID:-neuronotify}"
CLUSTER_NAME="${CLUSTER_NAME:-tandembrain-cluster}"
ZONE="${ZONE:-us-west2-a}"

echo "🚀 Deploying tandembrain to GKE..."
echo "   Project: $PROJECT_ID"
echo "   Cluster: $CLUSTER_NAME"
echo "   Zone: $ZONE"

# 1. Build and push Docker image
echo "📦 Building and pushing Docker image..."
./scripts/build-app.sh

# 2. Get cluster credentials
echo "🔐 Getting cluster credentials..."
gcloud container clusters get-credentials ${CLUSTER_NAME} \
    --zone ${ZONE} \
    --project ${PROJECT_ID}

# 3. Create namespace
echo "📁 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# 4. Create secrets from environment variables
echo "🔒 Creating secrets from .env file..."

# Validate required environment variables
if [ -z "$DATABASE_URL" ] || [ -z "$JWT_SECRET" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Missing required environment variables in .env file:"
    [ -z "$DATABASE_URL" ] && echo "   - DATABASE_URL"
    [ -z "$JWT_SECRET" ] && echo "   - JWT_SECRET"
    [ -z "$ANTHROPIC_API_KEY" ] && echo "   - ANTHROPIC_API_KEY"
    echo ""
    echo "Please update your .env file with the correct values."
    exit 1
fi

# Create or update secrets
echo "Creating Kubernetes secrets..."
kubectl create secret generic tandembrain-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -n tandembrain \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secrets created/updated successfully"

# 5. Apply all configurations
echo "⚙️ Applying configurations..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/service-account.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml
kubectl apply -f k8s/managed-certificate.yaml
kubectl apply -f k8s/ingress.yaml

# 6. Wait for rollout
echo "⏳ Waiting for deployment..."
kubectl rollout status deployment/tandembrain-app -n tandembrain --timeout=5m

# 7. Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
kubectl get pods -n tandembrain
kubectl get svc -n tandembrain
kubectl get ingress -n tandembrain

echo ""
echo "🌐 Your application should be available at:"
echo "  HTTP:  http://tandembrain.com"
echo "  HTTPS: https://tandembrain.com (once SSL cert is ready)"
echo ""
echo "📋 Check SSL certificate status:"
echo "  kubectl describe managedcertificate tandembrain-cert -n tandembrain"