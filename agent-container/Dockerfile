FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create workspace directory
RUN mkdir -p /workspace

# Copy agent code
COPY agent.py .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV WORKSPACE_DIR=/workspace

# Run the agent
CMD ["python", "agent.py"]