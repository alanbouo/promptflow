# n8n Setup for PromptFlow

This directory contains the n8n workflows and configuration for PromptFlow's backend processing.

## Prerequisites

1. **Docker Desktop for Mac**: Download and install from https://www.docker.com/products/docker-desktop/
2. **API Keys**: You'll need API keys for at least one LLM provider:
   - OpenAI API key (for GPT models)
   - Anthropic API key (for Claude models)

## Setup Instructions

### 1. Configure Environment Variables

Copy the `.env.n8n` file and add your API keys:

```bash
cd /Volumes/Macintosh_HD/Users/alanbouo/albou/2025/promptflow
cp .env.n8n .env.n8n.local
# Edit .env.n8n.local and add your API keys
```

### 2. Start n8n

```bash
# Make sure Docker Desktop is running first
docker-compose up -d n8n
```

Or use the setup script:

```bash
chmod +x setup-n8n.sh
./setup-n8n.sh
```

### 3. Access n8n

Open http://localhost:5678 in your browser and log in with:
- Username: admin
- Password: changeme (or whatever you set in .env.n8n)

### 4. Configure Credentials in n8n

1. Go to **Credentials** in the left sidebar
2. Add credentials for your LLM providers:
   
   **For OpenAI:**
   - Click "Add Credential"
   - Select "OpenAI API"
   - Enter your OpenAI API key
   - Save

   **For Anthropic (Claude):**
   - Click "Add Credential"
   - Select "HTTP Header Auth"
   - Header Name: `x-api-key`
   - Header Value: Your Anthropic API key
   - Save

### 5. Import Workflows

1. In n8n, go to **Workflows**
2. Click the menu (three dots) → **Import from File**
3. Import these workflow files:
   - `workflows/process-single.json` - For single item processing
   - `workflows/process-batch.json` - For batch processing

### 6. Activate Workflows

After importing, make sure both workflows are activated (toggle switch should be ON).

### 7. Test the Connection

From the promptflow app directory:

```bash
cd /Volumes/Macintosh_HD/Users/alanbouo/albou/2025/promptflow/app
node test-n8n.js
```

## Workflow Descriptions

### process-single.json
Handles single item processing with prompt chaining:
- Receives a single data item
- Processes through multiple prompts in sequence
- Returns results immediately via webhook response

### process-batch.json
Handles batch processing with concurrency control:
- Receives multiple data items
- Processes in parallel batches (default: 5 at a time)
- Sends results back via callback URL

## Troubleshooting

### Docker not found
Make sure Docker Desktop is installed and running.

### n8n not accessible
Check if the container is running:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs n8n
```

### Webhook errors
Ensure n8n workflows are activated and webhook URLs match those in the app's .env file.

### LLM errors
Verify your API keys are correctly set in n8n credentials.

## Stopping n8n

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```
