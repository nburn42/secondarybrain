#!/bin/bash
set -e

# Script to update secrets in Google Secret Manager from a .env file
# Usage: ./scripts/update-secrets.sh [path-to-env-file]

ENV_FILE=${1:-.env}
PROJECT_ID="neuronotify"
SECRET_NAME="tandembrain-secrets"

echo "Updating secrets in Google Secret Manager..."
echo "Project: $PROJECT_ID"
echo "Secret: $SECRET_NAME"
echo "Source: $ENV_FILE"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file '$ENV_FILE' not found!"
    echo "Please create a .env file with your secrets first."
    echo ""
    echo "Example .env file:"
    echo "DATABASE_URL=postgresql://tandembrain_app:password@host:5432/tandembrain"
    echo "JWT_SECRET=your-jwt-secret"
    echo "ANTHROPIC_API_KEY=your-anthropic-api-key"
    echo "POSTGRES_ADMIN_PASSWORD=admin-password"
    echo "DB_APP_PASSWORD=app-password"
    exit 1
fi

# Check if secret exists
if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Creating new secret: $SECRET_NAME"
    gcloud secrets create "$SECRET_NAME" --project="$PROJECT_ID" --replication-policy="automatic"
else
    echo "Secret $SECRET_NAME already exists"
fi

# Create a new version with the env file content
echo "Adding new secret version..."
gcloud secrets versions add "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --data-file="$ENV_FILE"

# Get the latest version number
LATEST_VERSION=$(gcloud secrets versions list "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --limit=1 \
    --format="value(name)")

echo ""
echo "✅ Secret updated successfully!"
echo "Latest version: $LATEST_VERSION"
echo ""
echo "To retrieve these secrets, run:"
echo "./scripts/fetch-secrets.sh"