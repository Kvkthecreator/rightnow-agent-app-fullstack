# Phase 0: Claude Agent SDK Infrastructure
# This Dockerfile adds Node.js + Claude Code CLI to support Claude Agent SDK Python wrapper

FROM python:3.10-slim

# Install Node.js 18.x (REQUIRED for Claude Code CLI)
# The Python SDK wraps the Claude Code CLI which is a Node.js application
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify Node.js and npm installed
RUN node --version && npm --version

# Install Claude Code CLI globally (REQUIRED for Python SDK)
# This is the subprocess that the Python SDK communicates with
RUN npm install -g @anthropic-ai/claude-code

# Verify Claude Code CLI installed
RUN claude-code --version

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 10000

# Start application
# Note: This matches the startCommand in render.yaml
CMD ["uvicorn", "src.app.agent_server:app", "--host", "0.0.0.0", "--port", "10000", "--log-level", "debug"]
