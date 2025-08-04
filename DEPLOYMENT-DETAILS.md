# Deployment Details - tandembrain

## Google Cloud Project Configuration

### Project Information
- **Project ID**: `neuronotify`
- **Project Name**: NeuroNotify
- **Region**: `us-west2`
- **Zone**: `us-west2-a` (for GKE cluster)

### Cloud SQL Database
- **Instance Name**: `tandembrain-db`
- **Database Version**: PostgreSQL 15
- **Tier**: `db-f1-micro` (1 vCPU, 0.6 GB RAM)
- **Region**: `us-west2`
- **Zone**: `us-west2-c`
- **Public IP**: `34.102.18.89`
- **Connection Name**: `neuronotify:us-west2:tandembrain-db`
- **Status**: RUNNABLE (Created on 2025-08-04)
- **Database Name**: `tandembrain`
- **Application User**: `tandembrain_app`
- **Application Password**: `[STORED IN SECRET MANAGER]`

### Google Kubernetes Engine (GKE)
- **Cluster Name**: `tandembrain-cluster`
- **Zone**: `us-west2-a`
- **Node Pool**: `standard-pool` with e2-small instances (upgraded from e2-micro due to memory constraints)
- **Node IP**: `35.236.31.255` (authorized for Cloud SQL access)

### Google Artifact Registry
- **Repository URL**: `us-west2-docker.pkg.dev/neuronotify/neuronotifyagent`
- **Region**: `us-west2`
- **Purpose**: Stores Docker images for agent containers

## Database Connection Details

### Public Connection
```bash
# Connect via gcloud as admin
gcloud sql connect tandembrain-db --user=postgres --project=neuronotify
# Password: [STORED IN SECRET MANAGER]

# Connection string for public IP (development only)
postgresql://tandembrain_app:[DB_APP_PASSWORD]@34.102.18.89:5432/tandembrain
```

### Application Connection (from GKE)
For secure connection from GKE, use Cloud SQL Proxy:
```bash
# Connection string via proxy (recommended for production)
postgresql://tandembrain_app:[DB_APP_PASSWORD]@127.0.0.1:5432/tandembrain
```

## Environment Variables

### Secret Management
All secrets are stored in Google Cloud Secret Manager. Use the following scripts:
- `./scripts/fetch-secrets.sh` - Retrieve secrets and create local .env file
- `./scripts/update-secrets.sh` - Update secrets in Cloud Secret Manager
- See `docs/SECRET-MANAGEMENT.md` for detailed instructions

### Production Environment
```env
# Database (via Cloud SQL Proxy)
DATABASE_URL=postgresql://tandembrain_app:[DB_APP_PASSWORD]@127.0.0.1:5432/tandembrain

# Google Cloud
GOOGLE_CLOUD_PROJECT=neuronotify
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account.json

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=[STORED IN SECRET MANAGER]
```

## Current Deployment Status

### ✅ Completed
- Google Cloud project setup (`neuronotify`)
- Cloud SQL PostgreSQL instance created and running
- Database and user created (`tandembrain` / `tandembrain_app`)
- GKE cluster exists (`tandembrain-cluster`)
- Artifact Registry configured
- Agent container deployment scripts ready
- Main application Dockerfile created
- Docker Compose for local development
- Kubernetes manifests for production deployment
- Database setup completed with credentials
- Deployment scripts ready

### ❌ Pending
- Private IP configuration for Cloud SQL (currently using public IP)
- Build and push main application image
- Deploy to GKE cluster
- Configure static IP and DNS
- SSL certificate provisioning
- CI/CD pipeline with GitHub Actions

## Quick Commands

### Database Management
```bash
# Set default project
gcloud config set project neuronotify

# Connect to database as admin
gcloud sql connect tandembrain-db --user=postgres
# Password: [STORED IN SECRET MANAGER]

# Connect via psql directly (development)
PGPASSWORD='[DB_APP_PASSWORD]' psql -h 34.102.18.89 -U tandembrain_app -d tandembrain

# Create Kubernetes secret
kubectl create secret generic tandembrain-secrets \
  --from-literal=DATABASE_URL='postgresql://tandembrain_app:[DB_APP_PASSWORD]@127.0.0.1:5432/tandembrain' \
  --from-literal=JWT_SECRET='[FETCH FROM SECRET MANAGER]' \
  -n tandembrain
```

### Deployment Commands
```bash
# Build and push agent container
./scripts/build-agent.sh

# Deploy agent to GKE
./scripts/deploy-container.sh

# Get cluster credentials
gcloud container clusters get-credentials tandembrain-cluster --zone us-west2-a --project neuronotify

# Check deployments
kubectl get deployments -n default
kubectl get pods -n default
```

## Security Considerations

1. **Database Security**
   - Currently using public IP (temporary)
   - Need to configure private IP for production
   - Implement Cloud SQL Proxy for secure connections

2. **Secrets Management**
   - Store database passwords in Secret Manager
   - Use Kubernetes secrets for pod configuration
   - Rotate credentials regularly

3. **Network Security**
   - Configure VPC for private communication
   - Set up firewall rules
   - Enable Cloud Armor for DDoS protection

## Next Immediate Steps

1. **Create database and user**:
   ```sql
   CREATE DATABASE tandembrain;
   CREATE USER tandembrain_app WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE tandembrain TO tandembrain_app;
   ```

2. **Configure application connection**:
   - Update environment variables
   - Test connection from local environment
   - Configure Cloud SQL Proxy for GKE

3. **Containerize main application**:
   - Create Dockerfile for Express/React app
   - Build and test locally
   - Push to Artifact Registry

4. **Deploy to GKE**:
   - Create Kubernetes manifests
   - Configure ingress and SSL
   - Deploy application

## Deployment Lessons Learned & Critical Information

### 1. Vite Import Issue Fix
The application failed in production with "Cannot find package 'vite'" error:
- **Problem**: `server/index.ts` imports from `./vite` but vite is a dev dependency
- **Solution**: Created `server/index.prod.ts` without vite imports
- **Files Changed**:
  - Created: `server/index.prod.ts`
  - Modified: `package.json` build script to use `esbuild server/index.prod.ts`
  - Modified: `Dockerfile` CMD to run `dist/index.prod.js`

### 2. Memory Constraints Resolution
Pods failed to schedule with "Insufficient memory" on e2-micro instances:
- **Problem**: e2-micro only has ~640MB available memory
- **Solution**: Upgraded to e2-small instances (2GB RAM)
- **Commands Used**:
  ```bash
  gcloud container clusters resize tandembrain-cluster --node-pool default-pool --num-nodes 0 --quiet
  gcloud container node-pools create standard-pool \
    --cluster=tandembrain-cluster \
    --zone=us-west2-a \
    --machine-type=e2-small \
    --num-nodes=1
  ```

### 3. Cloud SQL Authorized Networks
Database connection failed from GKE:
- **Problem**: GKE node IP not authorized for Cloud SQL
- **Solution**: Added node external IP to authorized networks
- **Command**: 
  ```bash
  gcloud sql instances patch tandembrain-db \
    --authorized-networks=35.236.31.255/32 \
    --project=neuronotify
  ```
- **Note**: This uses public IP; Cloud SQL proxy is recommended for production

### 4. Simplified Deployment Without Proxy
Created alternative deployment due to resource constraints:
- **File**: `k8s/app-deployment-simple.yaml`
- **Changes**: Removed Cloud SQL proxy sidecar, uses direct DB connection
- **Database URL**: Uses public IP directly in environment variable

### 5. Actual Deployment Commands
The exact commands used for successful deployment:
```bash
# Build and push image
./scripts/build-app.sh

# Create namespace and secrets
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic tandembrain-secrets \
  --from-literal=DATABASE_URL='[YOUR_DATABASE_URL]' \
  --from-literal=JWT_SECRET='[YOUR_JWT_SECRET]' \
  --from-literal=ANTHROPIC_API_KEY='[YOUR_ANTHROPIC_API_KEY]' \
  -n tandembrain

# Deploy application
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/service-account.yaml
kubectl apply -f k8s/app-deployment-simple.yaml
kubectl apply -f k8s/app-service.yaml
kubectl apply -f k8s/managed-certificate.yaml
kubectl apply -f k8s/ingress.yaml
```