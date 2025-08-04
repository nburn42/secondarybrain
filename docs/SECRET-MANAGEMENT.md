# Secret Management Guide

This guide explains how to manage secrets for the tandembrain application using Google Cloud Secret Manager.

## Overview

All sensitive credentials are stored in Google Cloud Secret Manager rather than in code or configuration files. This ensures:
- Secrets are never committed to git
- Easy rotation of credentials
- Centralized secret management
- Secure access from both local development and production environments

## Scripts

### 1. Store/Update Secrets
```bash
./scripts/update-secrets.sh [path-to-env-file]
```

This script uploads your secrets to Google Cloud Secret Manager. By default, it looks for a `.env` file in the project root.

### 2. Retrieve Secrets
```bash
./scripts/fetch-secrets.sh [output-file]
```

This script fetches the latest secrets from Google Cloud Secret Manager and creates a local `.env` file.

## Initial Setup

1. **Create your initial .env file** with all required secrets:
```bash
cp .env.example .env
# Edit .env with your actual values
```

2. **Upload secrets to Google Cloud**:
```bash
./scripts/update-secrets.sh
```

3. **Verify secrets were uploaded**:
```bash
gcloud secrets versions list tandembrain-secrets --project=neuronotify
```

## Local Development

1. **Fetch secrets from cloud**:
```bash
./scripts/fetch-secrets.sh
```

2. **Use with Docker Compose**:
```bash
# The docker-compose.yml file will automatically use values from .env
docker-compose up
```

3. **Override specific values** (optional):
```bash
cp docker-compose.override.yml.example docker-compose.override.yml
# Edit docker-compose.override.yml as needed
```

## Production Deployment

The Kubernetes deployment automatically fetches secrets from Google Cloud Secret Manager. No manual intervention needed.

## Required Secrets

| Secret Key | Description | Example |
|------------|-------------|---------|
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT token signing | Random 32+ character string |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | `sk-ant-api03-...` |
| `POSTGRES_ADMIN_PASSWORD` | PostgreSQL admin password | Strong password |
| `DB_APP_PASSWORD` | Application database user password | Strong password |

## Security Best Practices

1. **Never commit .env files** - The `.gitignore` already excludes them
2. **Rotate secrets regularly** - Use the update script to push new versions
3. **Use different secrets for each environment** - Don't reuse production secrets in development
4. **Limit access** - Only grant Secret Manager access to necessary service accounts
5. **Audit access** - Regularly review who has access to secrets

## Troubleshooting

### Permission Denied
If you get permission errors, ensure you have the necessary IAM roles:
```bash
gcloud projects add-iam-policy-binding neuronotify \
  --member="user:YOUR_EMAIL" \
  --role="roles/secretmanager.admin"
```

### Secret Not Found
If the secret doesn't exist yet, the update script will create it automatically.

### Can't Access from Kubernetes
Ensure the Kubernetes service account has the necessary permissions:
```bash
kubectl describe serviceaccount default -n tandembrain
```

## Emergency Access

If you need to quickly view a secret value:
```bash
gcloud secrets versions access latest \
  --secret="tandembrain-secrets" \
  --project="neuronotify" | grep "SECRET_NAME"
```

## Rotation Schedule

- **Database passwords**: Every 90 days
- **JWT secrets**: Every 180 days
- **API keys**: As needed or when compromised

Remember: Security is everyone's responsibility. If you suspect a secret has been compromised, rotate it immediately and notify the team.