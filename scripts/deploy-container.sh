#!/bin/bash

# tandembrain Container Deployment Script
# Creates and runs agent containers in GKE

set -e

# Configuration
PROJECT_ID="neuronotify"
REGION="us-west2"
REPOSITORY="neuronotifyagent"
IMAGE_NAME="tandembrain-agent"
CLUSTER_NAME="tandembrain-cluster"
ZONE="us-west2-a"

# Function to create container
create_container() {
    local CONTAINER_NAME=$1
    local PROJECT_ID_PARAM=$2
    local JWT_TOKEN=$3
    local IMAGE_TAG=${4:-latest}
    
    local IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
    
    echo "🚀 Creating container: ${CONTAINER_NAME}"
    echo "Project ID: ${PROJECT_ID_PARAM}"
    echo "Image: ${IMAGE_PATH}"
    
    # Create Kubernetes Job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${CONTAINER_NAME}
  namespace: default
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: agent
        image: ${IMAGE_PATH}
        env:
        - name: JWT_TOKEN
          value: "${JWT_TOKEN}"
        - name: API_BASE_URL
          value: "http://neural-notify-api:5000"
        - name: PROJECT_ID
          value: "${PROJECT_ID_PARAM}"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
EOF
    
    echo "✅ Container ${CONTAINER_NAME} created successfully"
}

# Function to check container status
check_status() {
    local CONTAINER_NAME=$1
    
    echo "📊 Checking status of ${CONTAINER_NAME}..."
    kubectl get job ${CONTAINER_NAME} -o wide
    kubectl get pods -l job-name=${CONTAINER_NAME}
}

# Function to get container logs
get_logs() {
    local CONTAINER_NAME=$1
    
    echo "📋 Getting logs for ${CONTAINER_NAME}..."
    POD_NAME=$(kubectl get pods -l job-name=${CONTAINER_NAME} -o jsonpath='{.items[0].metadata.name}')
    if [ ! -z "$POD_NAME" ]; then
        kubectl logs $POD_NAME
    else
        echo "No pods found for job ${CONTAINER_NAME}"
    fi
}

# Function to delete container
delete_container() {
    local CONTAINER_NAME=$1
    
    echo "🗑️  Deleting container: ${CONTAINER_NAME}"
    kubectl delete job ${CONTAINER_NAME} --ignore-not-found=true
    echo "✅ Container ${CONTAINER_NAME} deleted"
}

# Main script logic
case "${1}" in
    create)
        if [ $# -lt 4 ]; then
            echo "Usage: $0 create <container-name> <project-id> <jwt-token> [image-tag]"
            exit 1
        fi
        create_container "$2" "$3" "$4" "$5"
        ;;
    status)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 status <container-name>"
            exit 1
        fi
        check_status "$2"
        ;;
    logs)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 logs <container-name>"
            exit 1
        fi
        get_logs "$2"
        ;;
    delete)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 delete <container-name>"
            exit 1
        fi
        delete_container "$2"
        ;;
    *)
        echo "Usage: $0 {create|status|logs|delete} [options]"
        echo ""
        echo "Commands:"
        echo "  create <name> <project-id> <jwt-token> [tag]  - Create and run container"
        echo "  status <name>                                 - Check container status"
        echo "  logs <name>                                   - Get container logs"
        echo "  delete <name>                                 - Delete container"
        exit 1
        ;;
esac