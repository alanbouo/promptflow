# Deploying PromptFlow to Coolify

This guide covers deploying the separated frontend/backend architecture to Coolify.

## Architecture Overview

```
promptflow.run          → Landing Page (port 3000)
app.promptflow.run      → Frontend App (port 3000)
api.promptflow.run      → Backend API (port 4000)
PostgreSQL              → Database (port 5432)
```

## Prerequisites

1. Coolify server with access to your Git repository
2. PostgreSQL database (can be deployed via Coolify)
3. Domains configured:
   - `promptflow.run` (landing page)
   - `app.promptflow.run` (frontend)
   - `api.promptflow.run` (backend API)

---

## Option A: Deploy as Separate Services (Recommended)

### Step 1: Deploy PostgreSQL Database

1. In Coolify: **+ New** → **Database** → **PostgreSQL**
2. Configure:
   - **Name**: `promptflow-db`
   - **Database**: `promptflow`
   - **Username**: `promptflow`
   - **Password**: Generate a secure password
3. Note the internal connection URL: `postgresql://promptflow:PASSWORD@promptflow-db:5432/promptflow`

### Step 2: Deploy Backend API

1. **+ New** → **Application** → **Docker**
2. Connect your Git repository
3. Configure:
   - **Base Directory**: `backend`
   - **Dockerfile**: `Dockerfile`
   - **Port**: `4000`
4. **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://promptflow:PASSWORD@promptflow-db:5432/promptflow` |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `INTERNAL_API_SECRET` | Generate: `openssl rand -base64 32` (shared with frontend) |
| `OPENAI_API_KEY` | `sk-...` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (optional) |
| `XAI_API_KEY` | `xai-...` (optional) |
| `RESEND_API_KEY` | `re_...` (for password reset emails) |
| `EMAIL_FROM` | `PromptFlow <noreply@promptflow.run>` |
| `FRONTEND_URL` | `https://app.promptflow.run` |
| `PORT` | `4000` |

5. **Domain**: `api.promptflow.run` with HTTPS
6. Deploy and run database migration:
   ```bash
   docker exec -it <container_id> npx prisma db push
   ```

### Step 3: Deploy Frontend App

1. **+ New** → **Application** → **Docker**
2. Connect your Git repository
3. Configure:
   - **Base Directory**: `app`
   - **Dockerfile**: `Dockerfile.standalone`
   - **Port**: `3000`
4. **Build Arguments** (required for Next.js):

| Argument | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.promptflow.run` |
| `NEXT_PUBLIC_APP_URL` | `https://app.promptflow.run` |

5. **Environment Variables** (runtime):

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://app.promptflow.run` |
| `INTERNAL_API_SECRET` | Same value as backend's `INTERNAL_API_SECRET` |
| `DATABASE_URL` | Same PostgreSQL connection string as backend |
| `OPENAI_API_KEY` | `sk-...` (for direct LLM calls) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (optional) |
| `XAI_API_KEY` | `xai-...` (optional) |
| `N8N_WEBHOOK_SINGLE` | n8n webhook URL for single processing (optional) |
| `N8N_WEBHOOK_BATCH` | n8n webhook URL for batch processing (optional) |
| `N8N_WEBHOOK_AUTH_TOKEN` | n8n webhook auth token (optional) |

6. **Domain**: `app.promptflow.run` with HTTPS
7. Deploy

### Step 4: Deploy Landing Page

1. **+ New** → **Application** → **Docker**
2. Connect your Git repository
3. Configure:
   - **Base Directory**: `landing`
   - **Dockerfile**: `Dockerfile`
   - **Port**: `3000`
4. **Build Arguments**:

| Argument | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://app.promptflow.run` |

5. **Domain**: `promptflow.run` with HTTPS
6. Deploy

---

## Option B: Deploy with Docker Compose

Use the provided `docker-compose.coolify.yml` for a single-stack deployment.

1. In Coolify: **+ New** → **Docker Compose**
2. Connect your Git repository
3. Set **Docker Compose File**: `docker-compose.coolify.yml`
4. Configure environment variables in Coolify's UI
5. Deploy

---

## Environment Variables Reference

### Backend (`api.promptflow.run`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `INTERNAL_API_SECRET` | Yes | Shared secret for frontend-backend token exchange |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic API key |
| `XAI_API_KEY` | No | xAI API key |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `EMAIL_FROM` | No | From address for emails |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `PORT` | No | Server port (default: 4000) |

### Frontend (`app.promptflow.run`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (build arg) |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend public URL (build arg) |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth session encryption |
| `NEXTAUTH_URL` | Yes | Frontend URL for NextAuth callbacks |
| `INTERNAL_API_SECRET` | Yes | Shared secret (must match backend) |
| `DATABASE_URL` | Yes | PostgreSQL connection string (for NextAuth) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for direct LLM calls |
| `ANTHROPIC_API_KEY` | No | Anthropic API key |
| `XAI_API_KEY` | No | xAI API key |
| `N8N_WEBHOOK_SINGLE` | No | n8n webhook URL for single item processing |
| `N8N_WEBHOOK_BATCH` | No | n8n webhook URL for batch processing |
| `N8N_WEBHOOK_AUTH_TOKEN` | No | Bearer token for n8n webhook auth |

### Landing (`promptflow.run`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Link to main app |

---

## Option C: Deploy with n8n (Optional)

If you want to use n8n for workflow processing instead of direct LLM calls:

### Step 1: Deploy n8n

1. **+ New** → **Application** → **Docker Image**
2. Use image: `n8nio/n8n:latest`
3. Configure:
   - **Port**: `5678`
4. **Environment Variables**:

| Variable | Value |
|----------|-------|
| `N8N_BASIC_AUTH_ACTIVE` | `true` |
| `N8N_BASIC_AUTH_USER` | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Generate a secure password |
| `WEBHOOK_URL` | `https://n8n.promptflow.run` |

5. **Domain**: `n8n.promptflow.run` with HTTPS
6. **Volumes**: Mount `/home/node/.n8n` for persistence
7. Deploy and import workflows from `n8n/workflows/`

### Step 2: Configure Frontend for n8n

Add these environment variables to the frontend:

| Variable | Value |
|----------|-------|
| `N8N_WEBHOOK_SINGLE` | `https://n8n.promptflow.run/webhook/process-single` |
| `N8N_WEBHOOK_BATCH` | `https://n8n.promptflow.run/webhook/process-batch` |
| `N8N_WEBHOOK_AUTH_TOKEN` | Your n8n webhook auth token |

---

## Post-Deployment Checklist

- [ ] Database migrations applied (`npx prisma db push`)
- [ ] Backend health check: `curl https://api.promptflow.run/health`
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Login/logout works
- [ ] Job creation works

## Troubleshooting

### Backend won't start
1. Check `DATABASE_URL` is correct
2. Verify PostgreSQL is running and accessible
3. Check logs: `docker logs <container_id>`

### Frontend can't reach backend
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check CORS: `FRONTEND_URL` in backend must match frontend domain
3. Test API directly: `curl https://api.promptflow.run/health`

### Build fails
1. Ensure `next.config.js` has `output: 'standalone'`
2. Check Dockerfile path is correct
3. Review build logs in Coolify

### Database connection errors
1. Verify PostgreSQL container is healthy
2. Check connection string format
3. Ensure database exists: `docker exec -it <pg_container> psql -U promptflow -c '\l'`

### NextAuth/Authentication issues
1. Verify `NEXTAUTH_SECRET` is set and matches across restarts
2. Ensure `NEXTAUTH_URL` matches the frontend domain exactly
3. Check `INTERNAL_API_SECRET` is identical on both frontend and backend
4. Verify `DATABASE_URL` is accessible from the frontend container

### Token exchange fails
1. Check backend logs for "Unauthorized" errors on `/auth/exchange-token`
2. Verify `INTERNAL_API_SECRET` matches between frontend and backend
3. Ensure the user exists in the database
