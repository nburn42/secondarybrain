#!/bin/bash

# Build the Docker image
echo "Building task agent Docker image..."
docker build -t neural-notify-agent .

echo "Build complete!"
echo "To run the agent, use:"
echo "  docker run -e JWT_TOKEN=<your-jwt-token> neural-notify-agent"
echo ""
echo "Or use docker-compose:"
echo "  JWT_TOKEN=<your-jwt-token> docker-compose up"