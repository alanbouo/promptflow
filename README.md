# PromptFlow

A web-based tool for configuring prompts, processing data through LLMs (batch or single), and displaying outputs with support for prompt chaining. Job processing runs through **Inngest** for durable, retryable background execution.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)
![Inngest](https://img.shields.io/badge/Inngest-jobs-blue)

## Features

- **Prompt Configuration** - Set up system prompts, user prompts with placeholders, and LLM settings
- **Prompt Chaining** - Chain multiple prompts together using `{previous_output}` placeholder
- **Batch Processing** - Process multiple data items in parallel with configurable concurrency
- **Template Management** - Save and load prompt configurations as reusable templates
- **Multiple LLM Providers** - Support for OpenAI (GPT-4, GPT-3.5) and Anthropic (Claude)
- **Data Import** - Upload CSV, JSON, or paste data directly
- **Results Export** - Download results as CSV or JSON
- **Real-time Progress** - Track job progress with live updates
- **Dark Mode** - Full dark/light theme support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  Configure prompts, upload data, display results             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   BACKEND (Hono)    │
                    │  /api/jobs          │
                    │  /api/templates     │
                    │  /api/auth, /user   │
                    └──────────┬──────────┘
                     ┌─────────┴─────────┐
                     ▼                   ▼
          ┌─────────────────┐   ┌───────────────────────┐
          │   PostgreSQL     │   │  Inngest (self-hosted) │
          │  - Templates     │   │  process-job function  │
          │  - Jobs          │   │  • Call LLM per item    │
          └─────────────────┘   │  • Chain prompts        │
                                 │  • Retries + durability │
                                 └───────────────────────┘
```

Job creation returns immediately; the `backend` service emits a `job/process.requested`
event, and the Inngest server invokes the `process-job` function (durable steps, automatic
retries per item) which writes results back to Postgres. The frontend polls `GET /api/jobs/:id`
until the job reaches a terminal status.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 + React 18 |
| **Styling** | TailwindCSS + shadcn/ui |
| **State** | Zustand |
| **Backend API** | Hono (standalone service, `backend/`) |
| **Background Jobs** | Inngest (self-hosted) |
| **Database** | PostgreSQL (via Prisma) |
| **Deployment** | Docker Compose |

## Prerequisites

- **Node.js** 18+ 
- **Docker** and **Docker Compose**
- **LLM API Keys** (OpenAI and/or Anthropic)

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd promptflow
```

### 2. Configure environment variables

**For the backend:**
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, LLM API keys, and the Inngest vars
# (INNGEST_BASE_URL, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY) pointing at
# your self-hosted Inngest server.
```

**For the Next.js app:**
```bash
cd app
cp .env.example .env
# Edit .env if needed (defaults should work for local development)
```

### 3. Set up the backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The backend listens on `http://localhost:4000`. To have the self-hosted Inngest
server invoke `process-job`, sync it from the Inngest dashboard (**Apps → Sync**)
pointing at `http://localhost:4000/api/inngest` (or the container's internal address).

### 4. Set up the Next.js application

```bash
cd app
npm install
```

### 5. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Project Structure

```
promptflow/
├── app/                        # Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── configure/      # Prompt configuration page
│   │   │   ├── input/          # Data input page
│   │   │   ├── output/         # Results page
│   │   │   └── api/            # API routes
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & helpers
│   │   └── store/              # Zustand state stores
│   └── prisma/                 # Database schema
├── n8n/
│   └── workflows/              # n8n workflow JSON files
├── docker-compose.yml          # n8n Docker configuration
└── .env.n8n                    # n8n environment variables
```

## Usage

### 1. Configure Prompts

Navigate to `/configure` to set up:
- **System Prompt** - Sets the AI's behavior and context
- **User Prompts** - One or more prompts with placeholders:
  - `{input}` - Replaced with your data item
  - `{previous_output}` - Replaced with the output from the previous prompt (for chaining)
- **LLM Settings** - Provider, model, temperature, max tokens

### 2. Input Data

Navigate to `/input` to:
- Enter a single data item for quick testing
- Upload CSV or JSON files for batch processing
- Paste data directly into the text area
- Preview how your prompts will look with the data

### 3. View Results

Navigate to `/output` to:
- Monitor job progress in real-time
- View results in a table format
- Expand rows to see full outputs and intermediate chain results
- Export results as CSV or JSON

## Prompt Chaining Example

**Configuration:**
- System Prompt: `You are an expert data analyst.`
- User Prompt 1: `Summarize this data: {input}`
- User Prompt 2: `Based on this summary: {previous_output}, identify 3 key insights.`

**Input:** `Sales in Q1 were $1.2M, Q2 $1.5M, Q3 $1.1M, Q4 $1.8M`

**Execution:**
1. First prompt generates a summary
2. Second prompt uses that summary to extract insights
3. Final output contains the insights with intermediate results preserved

## API Endpoints

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create a new template
- `GET /api/templates/[id]` - Get a specific template
- `DELETE /api/templates/[id]` - Delete a template

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create and start a new job
- `GET /api/jobs/[id]` - Get job status and results
- `POST /api/jobs/[id]/callback` - n8n callback endpoint

## Environment Variables

### n8n (`.env.n8n`)

| Variable | Description | Default |
|----------|-------------|---------|
| `N8N_USER` | n8n admin username | `admin` |
| `N8N_PASSWORD` | n8n admin password | `changeme` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |

### Next.js App (`app/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:../data/promptflow.db` |
| `N8N_WEBHOOK_URL` | n8n webhook base URL | `http://localhost:5678/webhook` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

## Development

### Running tests
```bash
cd app
npm run lint
```

### Database migrations
```bash
cd app
npx prisma db push      # Apply schema changes
npx prisma studio       # Open database GUI
```

### Testing n8n webhooks
```bash
curl -X POST http://localhost:5678/webhook/process-single \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-1",
    "systemPrompt": "You are helpful.",
    "userPrompts": ["Say hello to {input}"],
    "settings": {"provider": "openai", "model": "gpt-3.5-turbo"},
    "dataItem": "World"
  }'
```

## Troubleshooting

### n8n not starting
- Check Docker is running: `docker ps`
- View logs: `docker-compose logs n8n`
- Ensure ports 5678 is not in use

### Database errors
- Reset the database: `cd app && npx prisma db push --force-reset`
- Check `DATABASE_URL` in `.env`

### LLM API errors
- Verify API keys are correctly set in n8n credentials
- Check rate limits on your API provider
- View n8n execution logs for detailed errors

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
