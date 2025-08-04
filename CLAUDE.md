# CLAUDE.md - Project Context for AI Assistants

## Project Overview
**tandembrain** (formerly secondarybrain) is a task management system with AI agent execution capabilities. It consists of:
- React/TypeScript frontend with Vite
- Express.js/TypeScript backend
- PostgreSQL database (Drizzle ORM)
- Python agent containers for task execution
- Deployment on Google Cloud Platform (GKE)

## Critical Information

### Google Cloud Configuration
- **Project ID**: `neuronotify`
- **Region**: `us-west2`
- **GKE Cluster**: `tandembrain-cluster` (zone: `us-west2-a`)
- **Cloud SQL**: `tandembrain-db` (PostgreSQL 15)
- **Artifact Registry**: `us-west2-docker.pkg.dev/neuronotify/neuronotifyagent`

### Database Connection
```bash
# From GKE/Cloud SQL Proxy
postgresql://postgres:PASSWORD@localhost:5432/tandembrain?host=/cloudsql/neuronotify:us-west2:tandembrain-db

# Public IP (development only)
postgresql://postgres:PASSWORD@34.102.18.89:5432/tandembrain
```

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy agent container
./scripts/build-agent.sh && ./scripts/deploy-container.sh
```

### Linting and Type Checking
Always run these commands before committing:
```bash
# Frontend
cd client && npm run lint && npm run typecheck

# Backend
cd server && npm run lint && npm run typecheck
```

## Architecture Notes

### Directory Structure
- `/client/` - React frontend (Vite, TailwindCSS, shadcn/ui)
- `/server/` - Express backend (API, auth, database)
- `/shared/` - Shared types and database schema
- `/agent-container/` - Python Docker container for task execution
- `/scripts/` - Deployment and build scripts

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (currently Neon, migrating to Cloud SQL)
- **Deployment**: Google Kubernetes Engine, Docker
- **Auth**: JWT-based authentication

### Current Deployment Status
- ✅ Agent containers deployable to GKE
- ❌ Main application needs containerization
- ❌ No CI/CD pipeline yet
- ❌ Missing production environment configuration

## Important Files
- `TODO-DEPLOYMENT.md` - Complete deployment checklist
- `DEPLOYMENT-DETAILS.md` - Current deployment configuration
- `replit.md` - Architecture and recent changes documentation
- `scripts/build-agent.sh` - Agent container build script
- `scripts/deploy-container.sh` - Agent deployment to GKE

## Common Tasks

### Adding a New Feature
1. Update types in `/shared/types/`
2. Add database migrations if needed
3. Implement backend API in `/server/`
4. Create frontend components in `/client/`
5. Run linting and type checking
6. Test thoroughly before committing

### Debugging Deployment Issues
1. Check GKE cluster: `kubectl get pods -n default`
2. View logs: `kubectl logs deployment/agent-deployment`
3. Database connection: `gcloud sql connect tandembrain-db --user=postgres`
4. Container registry: `gcloud artifacts repositories list`

## Security Reminders
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Database passwords should be in Secret Manager
- Always use HTTPS in production
- Implement proper CORS configuration

## Next Steps Priority
1. Create main application Dockerfile
2. Set up Kubernetes manifests for main app
3. Configure Cloud SQL private IP
4. Implement CI/CD with GitHub Actions
5. Set up monitoring and logging