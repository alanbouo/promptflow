# Deploying PromptFlow to Coolify

## Prerequisites

1. A Coolify server with access to your Git repository
2. n8n server already running (e.g., `https://n8n-1.alainbouo.com`)
3. Domain configured for the app (e.g., `promptflow.alainbouo.com`)

## Deployment Steps

### 1. Push to Git Repository

Make sure your code is pushed to a Git repository that Coolify can access:

```bash
cd /Volumes/Macintosh_HD/Users/alanbouo/albou/2025/promptflow
git add .
git commit -m "Add Coolify deployment configuration"
git push origin main
```

### 2. Create New Application in Coolify

1. Log in to your Coolify dashboard
2. Go to **Projects** → Select your project (or create new)
3. Click **+ New** → **Application**
4. Select **Docker** as the build pack
5. Connect your Git repository
6. Set the **Base Directory** to `/app` (since the Next.js app is in the `app/` folder)

### 3. Configure Build Settings

In Coolify's application settings:

- **Build Pack**: Docker
- **Dockerfile Location**: `Dockerfile` (relative to base directory)
- **Port**: `3000`

### 4. Configure Environment Variables

Add these environment variables in Coolify:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `file:/app/data/promptflow.db` |
| `NEXT_PUBLIC_APP_URL` | `https://promptflow.alainbouo.com` |
| `N8N_WEBHOOK_SINGLE` | `https://n8n-1.alainbouo.com/webhook/process-single_YOUR_WEBHOOK_ID` |
| `N8N_WEBHOOK_BATCH` | `https://n8n-1.alainbouo.com/webhook/process-batch_YOUR_WEBHOOK_ID` |
| `N8N_WEBHOOK_AUTH_TOKEN` | Your Bearer token for n8n webhook authentication |

### 5. Configure Persistent Storage

To persist the SQLite database across deployments:

1. Go to **Storages** in your application settings
2. Add a new volume:
   - **Source**: `/data/promptflow` (or any path on host)
   - **Destination**: `/app/data`

### 6. Configure Domain

1. Go to **Domains** in your application settings
2. Add your domain: `promptflow.alainbouo.com`
3. Enable HTTPS (Let's Encrypt)

### 7. Deploy

Click **Deploy** to build and start the application.

## Post-Deployment

### Initialize Database

After first deployment, you may need to run Prisma migrations. You can do this via Coolify's terminal or by adding a startup script:

```bash
# In Coolify terminal or via SSH
docker exec -it <container_id> npx prisma db push
```

### Verify n8n Connection

Test that the app can reach your n8n webhooks:

```bash
curl -X POST https://n8n-1.alainbouo.com/webhook/process-single_4FEjn96sNr06KFE8KoiY3IwQMJxsMEFksAb7ntsurSA= \
  -H "Content-Type: application/json" \
  -H "promptflow: YOUR_AUTH_TOKEN" \
  -d '{"jobId": "test", "systemPrompt": "Test", "userPrompts": ["Hello {input}"], "settings": {}, "dataItem": "World"}'
```

## Troubleshooting

### Build Fails

1. Check that `next.config.js` has `output: 'standalone'`
2. Verify Dockerfile is in the `app/` directory
3. Check Coolify build logs for specific errors

### Database Errors

1. Ensure the `/app/data` directory exists and is writable
2. Check that the volume is properly mounted
3. Run `npx prisma db push` to create tables

### n8n Connection Issues

1. Verify `N8N_WEBHOOK_URL` is correct
2. Check n8n webhook authentication settings
3. Ensure n8n workflows are activated

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:/app/data/promptflow.db` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | `https://promptflow.alainbouo.com` |
| `N8N_WEBHOOK_SINGLE` | Full URL for single item processing webhook | `https://n8n-1.alainbouo.com/webhook/process-single_abc123` |
| `N8N_WEBHOOK_BATCH` | Full URL for batch processing webhook | `https://n8n-1.alainbouo.com/webhook/process-batch_xyz789` |
| `N8N_WEBHOOK_AUTH_TOKEN` | Bearer token for n8n webhook authorization | `DlCqTUW7xL2d+Rte4D+B0A68+aEU55hN44hWfSwC/Ls=` |
