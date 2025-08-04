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
- **Application Password**: `O8gaByG2cHVQSrwuxEseVDoDH`

### Google Kubernetes Engine (GKE)
- **Cluster Name**: `tandembrain-cluster`
- **Zone**: `us-west2-a`
- **Node Pool**: Default configuration

### Google Artifact Registry
- **Repository URL**: `us-west2-docker.pkg.dev/neuronotify/neuronotifyagent`
- **Region**: `us-west2`
- **Purpose**: Stores Docker images for agent containers

## Database Connection Details

### Public Connection
```bash
# Connect via gcloud as admin
gcloud sql connect tandembrain-db --user=postgres --project=neuronotify
# Password: TempPassword123!

# Connection string for public IP (development only)
postgresql://tandembrain_app:O8gaByG2cHVQSrwuxEseVDoDH@34.102.18.89:5432/tandembrain
```

### Application Connection (from GKE)
For secure connection from GKE, use Cloud SQL Proxy:
```bash
# Connection string via proxy (recommended for production)
postgresql://tandembrain_app:O8gaByG2cHVQSrwuxEseVDoDH@127.0.0.1:5432/tandembrain
```

## Environment Variables

### Production Environment
```env
# Database (via Cloud SQL Proxy)
DATABASE_URL=postgresql://tandembrain_app:O8gaByG2cHVQSrwuxEseVDoDH@127.0.0.1:5432/tandembrain

# Google Cloud
GOOGLE_CLOUD_PROJECT=neuronotify
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account.json

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-secure-secret>
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
# Password: TempPassword123!

# Connect via psql directly (development)
PGPASSWORD='O8gaByG2cHVQSrwuxEseVDoDH' psql -h 34.102.18.89 -U tandembrain_app -d tandembrain

# Create Kubernetes secret
kubectl create secret generic tandembrain-secrets \
  --from-literal=DATABASE_URL='postgresql://tandembrain_app:O8gaByG2cHVQSrwuxEseVDoDH@127.0.0.1:5432/tandembrain' \
  --from-literal=JWT_SECRET='k7Hv1sAeKFgVW2NNzFrm+Z2X7okAnY+A/S9ulhOWOl0=' \
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