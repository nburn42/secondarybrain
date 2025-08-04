#!/bin/bash

# Direct database setup using psql

set -e

# Configuration
HOST="34.102.18.89"
PORT="5432"
ADMIN_USER="postgres"
ADMIN_PASSWORD="TempPassword123!"
DATABASE_NAME="tandembrain"
APP_USER="tandembrain_app"

echo "🗄️  Setting up Cloud SQL database directly..."

# Function to generate a secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Generate app password
APP_PASSWORD=$(generate_password)
echo "🔐 Generated application password"

# Create database and user
echo "📝 Creating database and user..."
PGPASSWORD="${ADMIN_PASSWORD}" psql -h ${HOST} -p ${PORT} -U ${ADMIN_USER} -d postgres <<EOF
-- Create database
CREATE DATABASE ${DATABASE_NAME};

-- Create application user
CREATE USER ${APP_USER} WITH ENCRYPTED PASSWORD '${APP_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DATABASE_NAME} TO ${APP_USER};
EOF

# Set up permissions on the new database
echo "🔧 Setting up database permissions..."
PGPASSWORD="${ADMIN_PASSWORD}" psql -h ${HOST} -p ${PORT} -U ${ADMIN_USER} -d ${DATABASE_NAME} <<EOF
-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ${APP_USER};

-- Ensure user can create tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_USER};
EOF

echo "✅ Database setup complete!"
echo ""
echo "📋 Database Details:"
echo "   Host: ${HOST}"
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
echo "postgresql://${APP_USER}:${APP_PASSWORD}@${HOST}:5432/${DATABASE_NAME}"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo ""
echo "To create Kubernetes secret:"
echo "kubectl create secret generic tandembrain-secrets \\"
echo "  --from-literal=DATABASE_URL='postgresql://${APP_USER}:${APP_PASSWORD}@127.0.0.1:5432/${DATABASE_NAME}' \\"
echo "  --from-literal=JWT_SECRET='$(openssl rand -base64 32)' \\"
echo "  -n tandembrain"