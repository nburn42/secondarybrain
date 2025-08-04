#!/bin/bash

# Setup Cloud SQL database for tandembrain

set -e

# Configuration
PROJECT_ID="neuronotify"
INSTANCE_NAME="tandembrain-db"
DATABASE_NAME="tandembrain"
APP_USER="tandembrain_app"

echo "🗄️  Setting up Cloud SQL database..."

# Function to generate a secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Check if instance is ready
echo "⏳ Checking if Cloud SQL instance is ready..."
STATE=$(gcloud sql instances describe ${INSTANCE_NAME} --project=${PROJECT_ID} --format="get(state)")
while [ "$STATE" != "RUNNABLE" ]; do
    echo "Instance state: $STATE. Waiting..."
    sleep 10
    STATE=$(gcloud sql instances describe ${INSTANCE_NAME} --project=${PROJECT_ID} --format="get(state)")
done
echo "✅ Instance is ready!"

# Generate password
APP_PASSWORD=$(generate_password)
echo "🔐 Generated application password"

# Create SQL commands file
cat > /tmp/setup-tandembrain.sql <<EOF
-- Create database
CREATE DATABASE ${DATABASE_NAME};

-- Create application user
CREATE USER ${APP_USER} WITH ENCRYPTED PASSWORD '${APP_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DATABASE_NAME} TO ${APP_USER};

-- Connect to the database
\c ${DATABASE_NAME}

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ${APP_USER};

-- Ensure user can create tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_USER};
EOF

echo "📝 SQL setup script created"

# Connect and run setup
echo "🔌 Connecting to Cloud SQL..."
PGPASSWORD="TempPassword123!" gcloud sql connect ${INSTANCE_NAME} \
    --user=postgres \
    --project=${PROJECT_ID} < /tmp/setup-tandembrain.sql

# Clean up
rm -f /tmp/setup-tandembrain.sql

echo "✅ Database setup complete!"
echo ""
echo "📋 Database Details:"
echo "   Database: ${DATABASE_NAME}"
echo "   User: ${APP_USER}"
echo "   Password: ${APP_PASSWORD}"
echo ""
echo "🔗 Connection strings:"
echo ""
echo "From local with Cloud SQL Proxy:"
echo "postgresql://${APP_USER}:${APP_PASSWORD}@127.0.0.1:5432/${DATABASE_NAME}"
echo ""
echo "From GKE with sidecar proxy:"
echo "postgresql://${APP_USER}:${APP_PASSWORD}@127.0.0.1:5432/${DATABASE_NAME}"
echo ""
echo "Public IP (not recommended for production):"
echo "postgresql://${APP_USER}:${APP_PASSWORD}@34.102.18.89:5432/${DATABASE_NAME}"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo ""
echo "To create Kubernetes secret:"
echo "kubectl create secret generic tandembrain-secrets \\"
echo "  --from-literal=DATABASE_URL='postgresql://${APP_USER}:${APP_PASSWORD}@127.0.0.1:5432/${DATABASE_NAME}' \\"
echo "  --from-literal=JWT_SECRET='$(openssl rand -base64 32)' \\"
echo "  -n tandembrain"