# tandembrain Agent Container

This Docker container provides the execution environment for tandembrain task agents. It includes a complete workspace setup with repository cloning and JWT-based authentication.

## Features

- **JWT Authentication**: Secure token-based authentication with the main API
- **Repository Cloning**: Automatically clones all project repositories into `/workspace`
- **Python Environment**: Pre-configured with git, requests, and JWT libraries
- **Workspace Management**: Organized workspace structure for code execution

## Quick Start

### 1. Build the Container
```bash
./build.sh
```

### 2. Generate a JWT Token
Use the API to generate a token for your project:
```bash
curl -X POST http://localhost:5000/api/projects/YOUR_PROJECT_ID/agent-token \
  -H "Content-Type: application/json" \
  -d '{"taskId": "optional-task-id"}'
```

### 3. Run the Agent
```bash
docker run -e JWT_TOKEN=your-jwt-token tandembrain-agent
```

Or using docker-compose:
```bash
JWT_TOKEN=your-jwt-token docker-compose up
```

## Environment Variables

- `JWT_TOKEN` (required): Authentication token for API access
- `API_BASE_URL` (default: http://host.docker.internal:5000): Main API endpoint
- `WORKSPACE_DIR` (default: /workspace): Directory for cloned repositories

## Development

### Testing
Run the test script to verify token generation and API connectivity:
```bash
python3 test-agent.py
```

### Container Structure
```
/app/
├── agent.py          # Main agent execution script
├── requirements.txt  # Python dependencies
└── /workspace/       # Cloned repositories
    ├── repo1/
    ├── repo2/
    └── ...
```

## API Endpoints

The agent uses these authenticated API endpoints:

- `POST /api/projects/:id/agent-token` - Generate JWT token
- `GET /api/agent/repositories` - Get project repositories (authenticated)

## Next Steps

This is the foundation for agent execution. Future iterations will add:

- Task execution logic
- File manipulation capabilities
- Tool calling infrastructure
- Result reporting
- Error handling and recovery