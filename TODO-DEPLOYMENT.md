# TODO: Complete tandembrain Deployment to Google Cloud

## Overview
This document outlines the remaining steps to fully deploy the tandembrain application to Google Cloud Platform. Currently, only the agent containers are deployable to GKE. The main application (React frontend + Express backend) needs containerization and cloud deployment configuration.

## Prerequisites
- [x] Google Cloud Project: `neuronotify`
- [x] GKE Cluster: `tandembrain-cluster` in `us-west2-a`
- [x] Artifact Registry: `us-west2-docker.pkg.dev/neuronotify/neuronotifyagent`
- [ ] Domain name and SSL certificates
- [ ] Cloud SQL instance or migration plan from Neon

## Phase 1: Containerize Main Application

### 1.1 Create Dockerfile for Main App
- [ ] Create `/Dockerfile` for the Express/React application
  - Base image: Node.js 20 Alpine
  - Multi-stage build for optimized production image
  - Build React frontend
  - Copy server files
  - Install production dependencies only
  - Expose port 3000

### 1.2 Create Docker Compose for Local Development
- [ ] Create `/docker-compose.yml` for full stack local development
  - Main app service
  - PostgreSQL service (for local dev)
  - Agent container service
  - Volume mounts for development

### 1.3 Update Build Scripts
- [ ] Create `scripts/build-app.sh` similar to `build-agent.sh`
  - Build Docker image for main application
  - Tag for Artifact Registry
  - Push to GCR

## Phase 2: Configure Google Cloud Services

### 2.1 Set up Cloud SQL
- [ ] Create Cloud SQL PostgreSQL instance
- [ ] Configure private IP for GKE connectivity
- [ ] Create database and user
- [ ] Export data from Neon and import to Cloud SQL
- [ ] Update connection strings in environment variables

### 2.2 Configure Secret Manager
- [ ] Store sensitive environment variables in Secret Manager
  - Database credentials
  - JWT secrets
  - Third-party API keys
- [ ] Create Kubernetes secrets from Secret Manager

### 2.3 Set up Cloud Storage
- [ ] Create GCS bucket for file uploads
- [ ] Configure CORS for frontend access
- [ ] Update storage abstraction layer to support GCS
- [ ] Implement signed URLs for secure uploads

## Phase 3: Kubernetes Configuration

### 3.1 Create Kubernetes Manifests
- [ ] Create `k8s/` directory for all manifests
- [ ] `k8s/app-deployment.yaml` - Main application deployment
  - 3 replicas for high availability
  - Resource limits and requests
  - Health checks and readiness probes
  - Environment variables from ConfigMap and Secrets
- [ ] `k8s/app-service.yaml` - Internal service for the app
- [ ] `k8s/configmap.yaml` - Non-sensitive configuration
- [ ] `k8s/ingress.yaml` - HTTPS ingress with Google-managed certificate

### 3.2 Update Agent Deployment
- [ ] Move agent deployment to `k8s/agent-deployment.yaml`
- [ ] Create horizontal pod autoscaler for agents
- [ ] Configure agent-to-app communication

### 3.3 Create Deployment Script
- [ ] Create `scripts/deploy-all.sh` to deploy entire stack
  - Apply all Kubernetes manifests
  - Wait for rollout completion
  - Run database migrations

## Phase 4: Networking and Security

### 4.1 Configure Load Balancer
- [ ] Set up Google Cloud Load Balancer
- [ ] Configure SSL certificates (Google-managed)
- [ ] Set up CDN for static assets
- [ ] Configure health checks

### 4.2 Set up Cloud Armor
- [ ] Create security policies
- [ ] Configure rate limiting
- [ ] Set up DDoS protection
- [ ] Configure WAF rules

### 4.3 Configure IAM
- [ ] Create service accounts for different components
- [ ] Apply principle of least privilege
- [ ] Configure workload identity for GKE

## Phase 5: CI/CD Pipeline

### 5.1 GitHub Actions Setup
- [ ] Create `.github/workflows/deploy.yml`
  - Build and test on push to main
  - Build Docker images
  - Push to Artifact Registry
  - Deploy to GKE
- [ ] Set up staging and production environments
- [ ] Configure automatic rollbacks

### 5.2 Database Migrations
- [ ] Set up migration job in Kubernetes
- [ ] Automate migrations in CI/CD pipeline
- [ ] Create rollback procedures

## Phase 6: Monitoring and Logging

### 6.1 Configure Google Cloud Monitoring
- [ ] Set up application metrics
- [ ] Create custom dashboards
- [ ] Configure alerts for critical metrics
- [ ] Set up uptime checks

### 6.2 Configure Logging
- [ ] Set up structured logging in application
- [ ] Configure log aggregation
- [ ] Create log-based metrics and alerts
- [ ] Set up error reporting

### 6.3 Set up Tracing
- [ ] Implement OpenTelemetry in application
- [ ] Configure Cloud Trace
- [ ] Set up performance monitoring

## Phase 7: Production Readiness

### 7.1 Performance Optimization
- [ ] Configure CDN for static assets
- [ ] Implement Redis for caching
- [ ] Optimize database queries
- [ ] Configure connection pooling

### 7.2 Backup and Disaster Recovery
- [ ] Set up automated Cloud SQL backups
- [ ] Create disaster recovery plan
- [ ] Test restoration procedures
- [ ] Document recovery procedures

### 7.3 Cost Optimization
- [ ] Set up budget alerts
- [ ] Configure autoscaling policies
- [ ] Implement resource quotas
- [ ] Review and optimize resource allocation

## Environment Variables Needed

Create `.env.production` with:
```
# Database
DATABASE_URL=postgresql://user:pass@cloud-sql-ip/tandembrain

# Google Cloud
GOOGLE_CLOUD_PROJECT=neuronotify
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCS_BUCKET=tandembrain-uploads

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-secure-secret>

# Agent Communication
AGENT_API_URL=http://agent-service:8080
```

## Useful Commands

```bash
# Build and push main app
./scripts/build-app.sh

# Deploy to GKE
./scripts/deploy-all.sh

# Check deployment status
kubectl get pods -n tandembrain
kubectl get ingress -n tandembrain

# View logs
kubectl logs -f deployment/tandembrain-app -n tandembrain

# Connect to Cloud SQL
gcloud sql connect tandembrain-db --user=postgres

# Update secrets
kubectl create secret generic app-secrets \
  --from-env-file=.env.production \
  -n tandembrain
```

## Estimated Timeline
- Phase 1-2: 2-3 days (containerization and cloud services)
- Phase 3-4: 3-4 days (Kubernetes and networking)
- Phase 5: 2 days (CI/CD pipeline)
- Phase 6-7: 3-4 days (monitoring and production readiness)

**Total: ~2 weeks for complete production deployment**

## Next Steps
1. Start with containerizing the main application (Phase 1)
2. Set up a staging environment first
3. Test each phase thoroughly before moving to the next
4. Document any custom configurations or decisions made