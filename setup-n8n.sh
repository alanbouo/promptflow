#!/bin/bash

echo "Setting up n8n for PromptFlow..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop for Mac from:"
    echo "   https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if .env.n8n exists
if [ ! -f .env.n8n ]; then
    echo "❌ .env.n8n file not found. Please copy .env.n8n.example and add your API keys."
    exit 1
fi

# Load environment variables
export $(cat .env.n8n | grep -v '^#' | xargs)

# Start n8n
echo "Starting n8n..."
docker-compose up -d n8n

# Wait for n8n to be ready
echo "Waiting for n8n to start..."
sleep 10

# Check if n8n is running
if docker-compose ps | grep -q "n8n.*Up"; then
    echo "✅ n8n is running!"
    echo ""
    echo "Access n8n at: http://localhost:5678"
    echo "Username: ${N8N_USER:-admin}"
    echo "Password: ${N8N_PASSWORD:-changeme}"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:5678 in your browser"
    echo "2. Log in with the credentials above"
    echo "3. Import the workflow files from n8n/workflows/"
    echo "4. Configure LLM credentials in n8n"
else
    echo "❌ Failed to start n8n. Check logs with: docker-compose logs n8n"
    exit 1
fi
