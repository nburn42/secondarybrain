#!/bin/bash
# Script to run database migrations using Cloud SQL Proxy

set -e

echo "🔄 Setting up Cloud SQL Proxy..."

# Download Cloud SQL Proxy if not exists
if [ ! -f ./cloud-sql-proxy ]; then
    echo "📥 Downloading Cloud SQL Proxy..."
    curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.linux.amd64
    chmod +x cloud-sql-proxy
fi

# Kill any existing proxy
pkill -f "cloud-sql-proxy.*5433" || true

# Start Cloud SQL Proxy in background
echo "🚀 Starting Cloud SQL Proxy..."
./cloud-sql-proxy --port 5433 neuronotify:us-west2:tandembrain-db &
PROXY_PID=$!

# Wait for proxy to be ready
echo "⏳ Waiting for proxy to be ready..."
sleep 5

# Test connection
if ! nc -z localhost 5433; then
    echo "❌ Cloud SQL Proxy failed to start"
    kill $PROXY_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Cloud SQL Proxy established"

# Run drizzle-kit push with local connection
echo "🚀 Running database migration..."
DATABASE_URL='postgresql://tandembrain_app:O8gaByG2cHVQSrwuxEseVDoDH@localhost:5433/tandembrain' npm run db:push

# Kill proxy
kill $PROXY_PID 2>/dev/null || true

echo "✅ Migration complete!"