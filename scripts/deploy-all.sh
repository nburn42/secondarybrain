#!/bin/bash

# Deploy tandembrain application to GKE

set -e

# Configuration
PROJECT_ID="neuronotify"
REGION="us-west2"
ZONE="us-west2-a"
CLUSTER_NAME="tandembrain-cluster"

echo "🚀 Deploying tandembrain to GKE..."

# Get cluster credentials
echo "🔐 Getting cluster credentials..."
gcloud container clusters get-credentials ${CLUSTER_NAME} \
    --zone ${ZONE} \
    --project ${PROJECT_ID}

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Create secrets (you'll need to set these)
echo "🔒 Creating secrets..."
echo "⚠️  Please create secrets manually with:"
echo "kubectl create secret generic tandembrain-secrets \\"
echo "  --from-literal=DATABASE_URL='postgresql://tandembrain_app:PASSWORD@127.0.0.1:5432/tandembrain' \\"
echo "  --from-literal=JWT_SECRET='your-jwt-secret' \\"
echo "  -n tandembrain"

# Apply configurations
echo "⚙️  Applying configurations..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/service-account.yaml

# Deploy application
echo "🌐 Deploying application..."
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml

# Set up ingress and SSL
echo "🔒 Setting up ingress and SSL..."
kubectl apply -f k8s/managed-certificate.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for rollout
echo "⏳ Waiting for deployment rollout..."
kubectl rollout status deployment/tandembrain-app -n tandembrain --timeout=5m

# Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Deployment status:"
kubectl get pods -n tandembrain
echo ""
echo "🌐 Service status:"
kubectl get svc -n tandembrain
echo ""
echo "🔗 Ingress status:"
kubectl get ingress -n tandembrain

echo ""
echo "📝 Next steps:"
echo "1. Create a static IP: gcloud compute addresses create tandembrain-ip --global"
echo "2. Update DNS records to point to the ingress IP"
echo "3. Wait for SSL certificate to be provisioned (can take up to 15 minutes)"
echo "4. Access your application at https://tandembrain.app"