# PromptFlow

A web-based tool for configuring prompts, processing data through LLMs (batch or single), and displaying outputs with support for prompt chaining. Job processing runs through **Inngest** for durable, retryable background execution.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)
![Hono](https://img.shields.io/badge/Hono-API-orange)
![Inngest](https://img.shields.io/badge/Inngest-jobs-blue)

## Features

- **Prompt Configuration** - Set up system prompts, user prompts with placeholders, and LLM settings
- **Prompt Chaining** - Chain multiple prompts together using the `{previous_output}` placeholder
- **Batch Processing** - Process several data items in one job
- **Template Management** - Save and load prompt configurations as reusable templates
- **Prompt Assistant** - Generate, refine and test prompts from the app
- **Multiple LLM Providers** - OpenAI, Anthropic (Claude) and xAI
- **Data Import** - Upload CSV or JSON, or paste data directly
- **Results Export** - Download results as CSV or JSON
- **Job History** - Browse past jobs; progress is polled until the job finishes
- **Accounts** - Email and password sign-in with password reset by email
- **Dark Mode** - Dark/light theme support

Known issues and the roadmap are in [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js, app/)                   │
│  Configure prompts, upload data, display results             │
│  NextAuth sessions; exchanges its session for a backend JWT  │
└─────────────────────────────┬───────────────────────────────┘
                              │  Authorization: Bearer <JWT>
                              ▼
                    ┌─────────────────────┐
                    │  BACKEND (Hono)     │
                    │  /api/jobs          │
                    │  /api/templates     │
                    │  /api/refine        │
                    │  /api/auth, /user   │
                    └──────────┬──────────┘
                     ┌─────────┴─────────┐
                     ▼                   ▼
          ┌─────────────────┐   ┌───────────────────────────┐
          │   PostgreSQL     │   │  Inngest (self-hosted)     │
          │  - Users         │   │  process-job function      │
          │  - Templates     │   │  • one durable step/item   │
          │  - Jobs          │   │  • prompt chaining         │
          └─────────────────┘   │  • retries per item        │
                                 └─────────────┬─────────────┘
                                               ▼
                                   OpenAI / Anthropic / xAI
```

Creating a job returns immediately. The backend stores the job, sends a `job/process.requested` event, and the Inngest server calls the `process-job` function at `/api/inngest`. That function calls the LLM for each item, chains prompts, and writes the results back to PostgreSQL. The frontend polls `GET /api/jobs/:id` until the job reaches a terminal status. If Inngest is unreachable, `POST /api/jobs` marks the job `failed` and returns `503`.

Cancelling a job (`DELETE /api/jobs/:id` while it is running) stops it before the next item. An LLM call already in progress still finishes.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TailwindCSS, Zustand, NextAuth |
| **Backend API** | Hono on Node.js (`backend/`) |
| **Background jobs** | Inngest (self-hosted) |
| **LLM access** | Direct HTTP calls to OpenAI, Anthropic and xAI |
| **Database** | PostgreSQL (via Prisma) |
| **Email** | Resend |
| **Deployment** | Docker, Coolify |

## Prerequisites

- **Node.js** 20+
- **PostgreSQL**
- **An Inngest server** reachable by the backend (see [Running jobs locally](#running-jobs-locally))
- **LLM API keys** for at least one of OpenAI, Anthropic or xAI

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd promptflow
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, INTERNAL_API_SECRET, the LLM keys,
# and the INNGEST_* variables
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The backend listens on `http://localhost:4000`. Check it with `curl http://localhost:4000/health`.

### 3. Set up the frontend

```bash
cd app
cp .env.example .env
# Set NEXTAUTH_SECRET and INTERNAL_API_SECRET (same value as the backend).
# DATABASE_URL must point to the same database as the backend: the NextAuth
# and template/account routes of the frontend read it directly.
npm install
npm run dev
```

Open `http://localhost:3000`.

### Running jobs locally

Jobs only run once the Inngest server has discovered the backend's `process-job` function. Either:

- point `INNGEST_BASE_URL`, `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` at your Inngest server and sync the app from its dashboard (**Apps → Sync**) with `http://localhost:4000/api/inngest`; or
- use the Inngest dev server with `INNGEST_DEV=1` (the SDK's development mode). This path is not documented or tested in this repository.

Without a reachable Inngest server, creating a job fails with `503`.

## Project Structure

```
promptflow/
├── app/                        # Next.js frontend
│   ├── src/app/                # Pages: configure, input, output, history,
│   │                           #   refine, settings, login, register, ...
│   │   └── api/                # NextAuth and routes that use the database
│   │                           #   directly (auth, templates, user, refine)
│   ├── src/{components,lib,store,types}
│   └── prisma/                 # Prisma schema (copy of backend/prisma)
├── backend/                    # Hono API
│   ├── src/routes/             # auth, templates, jobs, user, refine
│   ├── src/inngest/            # process-job function and its tests
│   ├── src/lib/                # llm-client, jwt, db
│   └── prisma/                 # Prisma schema
├── landing/                    # Marketing site (Next.js)
├── docker-compose.coolify.yml  # postgres + backend + frontend + landing
├── COOLIFY_DEPLOYMENT.md       # Deployment guide
└── IMPLEMENTATION_PLAN.md      # Roadmap and known issues
```

`app/prisma/schema.prisma` and `backend/prisma/schema.prisma` are identical today. Change both when you change the schema.

## Usage

### 1. Configure Prompts

Navigate to `/configure` to set up:
- **System Prompt** - Sets the AI's behavior and context
- **User Prompts** - One or more prompts with placeholders:
  - `{input}` - Replaced with the current data item
  - `{previous_output}` - Replaced with the output of the previous prompt (for chaining)
- **LLM Settings** - Provider, model, temperature, max tokens

`{input}` and `{previous_output}` are the only placeholders. Each data item is a single piece of text; named fields such as `{customer}` are not supported yet. Other `{...}` text is left unchanged.

### 2. Input Data

Navigate to `/input` to:
- Enter a single data item for quick testing
- Upload CSV or JSON files for batch processing
- Paste data directly into the text area
- Preview how your prompts will look with the data

### 3. View Results

Navigate to `/output` to:
- Monitor job progress
- View results in a table format
- Expand rows to see full outputs and intermediate chain results
- Export results as CSV or JSON

`/history` lists past jobs.

## Prompt Chaining Example

**Configuration:**
- System Prompt: `You are an expert data analyst.`
- User Prompt 1: `Summarize this data: {input}`
- User Prompt 2: `Based on this summary: {previous_output}, identify 3 key insights.`

**Input:** `Sales in Q1 were $1.2M, Q2 $1.5M, Q3 $1.1M, Q4 $1.8M`

**Execution:**
1. The first prompt generates a summary
2. The second prompt receives that summary and extracts insights
3. The final output contains the insights, with intermediate results preserved

## API

The backend API lives in `backend/` and is documented in [`backend/README.md`](backend/README.md). Every route except `/api/auth/*` and `/health` requires `Authorization: Bearer <jwt>`.

| Area | Routes |
|------|--------|
| Auth | `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password`, `/exchange-token`; `GET /api/auth/me` |
| Templates | `GET/POST /api/templates`, `GET/PUT/DELETE /api/templates/:id` |
| Jobs | `GET/POST /api/jobs`, `GET /api/jobs/:id`, `DELETE /api/jobs/:id` (cancels a running job, deletes a finished one) |
| Prompt assistant | `POST /api/refine/generate`, `/refine`, `/test` |
| Account | `GET/PUT/DELETE /api/user/account`, `PUT /api/user/password` |
| Health | `GET /health` |
| Inngest | `/api/inngest` (called by the Inngest server) |

## Environment Variables

The `.env.example` files are the reference. The main variables:

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `INTERNAL_API_SECRET` | Shared with the frontend for the session-to-JWT exchange |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY` | LLM provider keys. A job fails with a clear error if its provider has no key. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Password reset emails |
| `FRONTEND_URL` | Allowed CORS origin (default `http://localhost:3000`) |
| `PORT` | Server port (default `4000`) |
| `INNGEST_DEV` | `1` for the Inngest dev server, `0` otherwise |
| `INNGEST_BASE_URL` | Inngest server URL |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Keys configured on the Inngest server |

The server's own keys pay for every LLM call. There is no per-user limit yet (see `IMPLEMENTATION_PLAN.md`).

### Frontend (`app/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (`http://localhost:4000` locally) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the frontend |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth session secret and callback URL |
| `INTERNAL_API_SECRET` | Must match the backend value |
| `DATABASE_URL` | Same database as the backend |
| `RESEND_API_KEY`, `EMAIL_FROM` | Emails sent by the frontend routes |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY` | Provider keys for the frontend's own prompt-assistant routes |

Deployment variables are listed in [`COOLIFY_DEPLOYMENT.md`](COOLIFY_DEPLOYMENT.md).

## Development

### Running tests

```bash
cd backend
npm test            # node:test, covers the job processing function

cd ../app
npm run lint
```

### Database migrations

```bash
cd backend
npx prisma db push      # Apply schema changes
npx prisma studio       # Open database GUI
```

## Deployment

See [`COOLIFY_DEPLOYMENT.md`](COOLIFY_DEPLOYMENT.md) for Coolify, or use `docker-compose.coolify.yml` for a single stack (PostgreSQL, backend, frontend, landing). The Inngest server is separate and must be reachable from the backend.

## Troubleshooting

### Jobs fail immediately with a 503
- The backend cannot reach the Inngest server. Check `INNGEST_BASE_URL` and the two keys.

### Jobs stay `running` and never start
- The Inngest server does not know the function. Sync the app from its dashboard (**Apps → Sync**) with `<backend-url>/api/inngest`.

### Database errors
- Check `DATABASE_URL` in both `backend/.env` and `app/.env`.
- Reset the database (**deletes all data**): `cd backend && npx prisma db push --force-reset`

### LLM API errors
- `API key not configured for provider: ...` means the matching `*_API_KEY` is missing on the backend.
- Check rate limits on your provider. A single LLM call times out after 2 minutes.

### The frontend cannot reach the backend
- Check `NEXT_PUBLIC_API_URL`, and that `FRONTEND_URL` on the backend matches the frontend's origin (CORS).

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
