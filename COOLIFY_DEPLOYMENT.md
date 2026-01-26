# Deploying PromptFlow to Coolify

This guide covers deploying the separated frontend/backend architecture to Coolify.

## Architecture Overview

```
promptflow.run          → Landing Page (port 3001)
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

5. **Domain**: `app.promptflow.run` with HTTPS
6. Deploy

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
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend public URL |

### Landing (`promptflow.run`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Link to main app |

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
