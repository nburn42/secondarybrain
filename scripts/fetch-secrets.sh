#!/bin/bash
set -e

# Script to fetch secrets from Google Secret Manager and create a local .env file
# Usage: ./scripts/fetch-secrets.sh [output-file]

OUTPUT_FILE=${1:-.env}
PROJECT_ID="neuronotify"
SECRET_NAME="tandembrain-secrets"

echo "Fetching secrets from Google Secret Manager..."
echo "Project: $PROJECT_ID"
echo "Secret: $SECRET_NAME"
echo "Output: $OUTPUT_FILE"

# Check if secret exists
if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Error: Secret '$SECRET_NAME' not found in project '$PROJECT_ID'!"
    echo "Please run ./scripts/update-secrets.sh first to create the secret."
    exit 1
fi

# Backup existing .env file if it exists
if [ -f "$OUTPUT_FILE" ]; then
    BACKUP_FILE="${OUTPUT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backing up existing $OUTPUT_FILE to $BACKUP_FILE"
    mv "$OUTPUT_FILE" "$BACKUP_FILE"
fi

# Fetch the latest version of the secret
echo "Retrieving latest secret version..."
gcloud secrets versions access latest \
    --secret="$SECRET_NAME" \
    --project="$PROJECT_ID" \
    > "$OUTPUT_FILE"

# Check if the file was created successfully
if [ -f "$OUTPUT_FILE" ]; then
    # Set appropriate permissions
    chmod 600 "$OUTPUT_FILE"
    
    echo ""
    echo "✅ Secrets fetched successfully!"
    echo "File created: $OUTPUT_FILE"
    echo ""
    echo "The file contains the following variables:"
    grep -E "^[A-Z_]+=" "$OUTPUT_FILE" | cut -d= -f1 | sed 's/^/  - /'
    echo ""
    echo "⚠️  Important: Keep this file secure and never commit it to git!"
else
    echo "Error: Failed to create $OUTPUT_FILE"
    exit 1
fi