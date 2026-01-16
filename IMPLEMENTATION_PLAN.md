# PromptFlow Implementation Plan

## Executive Summary

PromptFlow is a web-based tool for configuring prompts, processing data through LLMs (batch or single), and displaying outputs with support for prompt chaining. **The backend is powered by n8n workflows**, providing visual workflow design, built-in LLM nodes, and robust execution. This document outlines the phased implementation approach.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14 + React 18 | App router, SSR, great DX |
| **Styling** | TailwindCSS + shadcn/ui | Modern, accessible components |
| **State** | Zustand | Lightweight, minimal boilerplate |
| **Backend API** | Next.js API Routes (thin) | Template storage, job tracking |
| **Workflow Engine** | n8n (self-hosted) | Visual workflows, LLM nodes, batch processing |
| **Database** | SQLite (local) / PostgreSQL (prod) | Simple start, scalable later |
| **ORM** | Prisma | Type-safe, migrations, multi-DB |
| **Auth** | NextAuth.js (optional) | API key protection |
| **Deployment** | Docker Compose | n8n + Next.js unified stack |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                         │
│  Configure prompts, upload data, display results                   │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│ Next.js API     │  │ n8n Webhook     │  │ n8n Webhook             │
│ /api/templates  │  │ /process-single │  │ /process-batch          │
│ (CRUD)          │  │                 │  │                         │
└────────┬────────┘  └────────┬────────┘  └────────┬────────────────┘
         │                    │                    │
         ▼                    └─────────┬──────────┘
┌─────────────────┐                     ▼
│   Database      │         ┌───────────────────────────────────────┐
│   (SQLite/PG)   │         │            n8n WORKFLOW               │
│   - Templates   │         │  ┌─────────────────────────────────┐  │
│   - Jobs        │         │  │  1. Receive config + data       │  │
└─────────────────┘         │  │  2. Loop through data items     │  │
                            │  │  3. Format prompts              │  │
                            │  │  4. Call LLM (OpenAI/Claude)    │  │
                            │  │  5. Chain outputs if needed     │  │
                            │  │  6. Return aggregated results   │  │
                            │  └─────────────────────────────────┘  │
                            └───────────────────────────────────────┘
```

---

## Project Structure

```
promptflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home/Dashboard
│   │   ├── configure/
│   │   │   └── page.tsx        # Configuration Page
│   │   ├── input/
│   │   │   └── page.tsx        # Input Page  
│   │   ├── output/
│   │   │   └── page.tsx        # Output/Results Page
│   │   ├── api/
│   │   │   ├── templates/
│   │   │   │   └── route.ts    # Save/load configs (local DB)
│   │   │   └── jobs/
│   │   │       └── [id]/
│   │   │           └── route.ts # Job status tracking
│   │   └── layout.tsx          # Root layout with sidebar
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── sidebar.tsx
│   │   ├── prompt-editor.tsx
│   │   ├── data-uploader.tsx
│   │   ├── results-table.tsx
│   │   ├── progress-bar.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── n8n-client.ts       # n8n webhook client
│   │   ├── parsers/
│   │   │   ├── csv.ts
│   │   │   └── json.ts
│   │   ├── validators.ts       # Input validation
│   │   └── db.ts               # Prisma client
│   ├── store/
│   │   ├── config-store.ts     # Prompt/settings state
│   │   ├── input-store.ts      # Data input state
│   │   └── job-store.ts        # Job/output state
│   └── types/
│       └── index.ts            # Shared TypeScript types
├── n8n/
│   └── workflows/
│       ├── process-single.json      # Single item workflow
│       ├── process-batch.json       # Batch processing workflow  
│       └── prompt-chain.json        # Reusable chaining sub-workflow
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
├── .env.example
├── docker-compose.yml          # n8n + Next.js + DB
├── Dockerfile
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Project Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure TailwindCSS + shadcn/ui
- [ ] Set up Prisma with SQLite
- [ ] Create base folder structure
- [ ] Configure ESLint/Prettier
- [ ] Create `.env.example` with required variables

### 1.2 n8n Setup
- [ ] Set up n8n via Docker (self-hosted)
- [ ] Configure n8n credentials for LLM providers (OpenAI, Anthropic)
- [ ] Create webhook endpoints for frontend communication
- [ ] Test basic n8n → LLM connectivity

### 1.3 Database Schema
```prisma
model Template {
  id          String   @id @default(cuid())
  name        String
  systemPrompt String
  userPrompts  Json     // Array of prompt strings
  settings    Json     // temperature, maxTokens, provider, model
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Job {
  id          String   @id @default(cuid())
  n8nExecutionId String?  // Link to n8n execution for tracking
  status      String   // pending, running, completed, failed
  templateId  String?
  config      Json     // Snapshot of config at run time
  inputData   Json     // Array of input items
  results     Json?    // Array of results
  logs        Json?    // Execution logs
  tokenUsage  Int      @default(0)
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
}
```

### 1.4 Core Layout
- [ ] Root layout with sidebar navigation
- [ ] Theme toggle (dark/light mode)
- [ ] Responsive design foundation
- [ ] Navigation: Configure → Input → Output

---

## Phase 2: Configuration Page (Week 2-3)

### 2.1 UI Components
- [ ] **System Prompt Editor**: Large textarea with placeholder hints
- [ ] **User Prompt Editor(s)**: 1-3 prompts with add/remove buttons
  - Support `{input}` placeholder for data
  - Support `{previous_output}` for chaining
- [ ] **Placeholder Validator**: Real-time warning if placeholders missing
- [ ] **Settings Panel**:
  - LLM Provider dropdown (OpenAI, Anthropic, Custom)
  - Model selector (GPT-4, GPT-3.5, Claude 3, etc.)
  - Temperature slider (0-2)
  - Max tokens input
- [ ] **Batch Options**:
  - Single/Batch toggle
  - Parallel limit input (1-10, default 5)
- [ ] **Template Management**:
  - Save current config as template
  - Load from saved templates
  - Delete templates

### 2.2 API Endpoints (Next.js - Templates Only)
- [ ] `POST /api/templates` - Save template
- [ ] `GET /api/templates` - List templates
- [ ] `GET /api/templates/[id]` - Get single template
- [ ] `DELETE /api/templates/[id]` - Delete template

### 2.3 State Management
- [ ] Zustand store for configuration state
- [ ] Persist config to localStorage
- [ ] Validation logic for required fields

---

## Phase 3: Input Page (Week 3-4)

### 3.1 UI Components
- [ ] **Single Input Mode**: Large textarea for single data item
- [ ] **Batch Input Mode**:
  - File upload dropzone (CSV, JSON)
  - Paste textarea for quick batch entry
  - Column/field selector for CSV
- [ ] **Data Preview**:
  - Table showing first 5-10 items
  - Total item count
  - Data validation status
- [ ] **Prompt Preview**: 
  - Show formatted prompt with first data item substituted
  - Real-time update as prompts change
- [ ] **Run Button**: Primary action, disabled if invalid

### 3.2 Parsers
- [ ] CSV parser with header detection
- [ ] JSON array parser
- [ ] Plain text (newline-separated) parser
- [ ] Validation and error messages

### 3.3 State Management
- [ ] Zustand store for input data
- [ ] Parsed items array
- [ ] Validation errors

---

## Phase 4: n8n Workflow Engine (Week 4-5)

### 4.1 n8n Workflow: Single Item Processing

**Workflow: `process-single.json`**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Webhook    │───▶│  Set Variables│───▶│  Loop Prompts│───▶│  LLM Node    │
│  Trigger    │    │  (parse input)│    │  (if chain)  │    │  (OpenAI/    │
└─────────────┘    └──────────────┘    └─────────────┘    │   Claude)    │
                                                          └──────┬───────┘
                                                                 │
                                              ┌──────────────────┘
                                              ▼
                                       ┌─────────────┐    ┌──────────────┐
                                       │  Aggregate  │───▶│  Respond to  │
                                       │  Results    │    │  Webhook     │
                                       └─────────────┘    └──────────────┘
```

**Webhook Input Payload:**
```json
{
  "jobId": "abc123",
  "systemPrompt": "You are an expert analyst.",
  "userPrompts": [
    "Summarize: {input}",
    "Extract insights from: {previous_output}"
  ],
  "settings": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000
  },
  "dataItem": "Sales data for Q1..."
}
```

**Webhook Response:**
```json
{
  "jobId": "abc123",
  "input": "Sales data for Q1...",
  "intermediates": ["Summary output..."],
  "finalOutput": "Key insights: ...",
  "tokenUsage": { "prompt": 150, "completion": 200 },
  "status": "success"
}
```

### 4.2 n8n Workflow: Batch Processing

**Workflow: `process-batch.json`**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│  Webhook    │───▶│  Split Items │───▶│  SplitInBatches │
│  Trigger    │    │  to Array    │    │  (concurrency)  │
└─────────────┘    └──────────────┘    └────────┬────────┘
                                                │
                   ┌────────────────────────────┘
                   ▼
            ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
            │  Execute    │───▶│  LLM Chain  │───▶│  Merge       │
            │  Sub-workflow│    │  (per item) │    │  Results     │
            └─────────────┘    └─────────────┘    └──────┬───────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │  Callback to │
                                                  │  Next.js API │
                                                  └──────────────┘
```

**Batch Webhook Input:**
```json
{
  "jobId": "batch-456",
  "systemPrompt": "...",
  "userPrompts": ["..."],
  "settings": { ... },
  "dataItems": ["item1", "item2", "item3"],
  "batchSize": 5,
  "callbackUrl": "http://nextjs:3000/api/jobs/batch-456/callback"
}
```

### 4.3 n8n Workflow Implementation Tasks
- [ ] Create webhook trigger node with authentication
- [ ] Build prompt formatting using n8n expressions: `{{ $json.userPrompt.replace('{input}', $json.dataItem) }}`
- [ ] Configure OpenAI node with dynamic credentials
- [ ] Configure Anthropic node (Claude) as alternative
- [ ] Implement prompt chaining via Loop node
- [ ] Add SplitInBatches for concurrency control
- [ ] Build error handling with retry logic (n8n built-in)
- [ ] Create callback HTTP node to update Next.js job status
- [ ] Export workflows as JSON for version control

### 4.4 n8n Client (Frontend)
```typescript
// src/lib/n8n-client.ts
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function processSingle(payload: SingleProcessPayload) {
  const response = await fetch(`${N8N_WEBHOOK_URL}/process-single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function processBatch(payload: BatchProcessPayload) {
  // Fire-and-forget; n8n will callback when done
  await fetch(`${N8N_WEBHOOK_URL}/process-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

### 4.5 Job Tracking API (Next.js)
- [ ] `POST /api/jobs` - Create job record, trigger n8n
- [ ] `GET /api/jobs/[id]` - Get job status/results
- [ ] `POST /api/jobs/[id]/callback` - n8n callback to update job
- [ ] `DELETE /api/jobs/[id]` - Cancel job (calls n8n execution cancel API)

### 4.6 Error Handling (n8n)
- [ ] Configure retry on failure (3 attempts, exponential backoff)
- [ ] Error workflow for logging failures
- [ ] Per-item error capture (continue on error)
- [ ] Timeout configuration for LLM calls

---

## Phase 5: Output Page (Week 5-6)

### 5.1 UI Components
- [ ] **Results Table**:
  - Columns: Index, Input (truncated), Output (truncated), Status
  - Expandable rows for full content
  - Chain intermediates in nested view
  - Sortable/filterable
- [ ] **Progress Indicator**:
  - Progress bar during processing
  - Items completed / total
  - Estimated time remaining
- [ ] **Summary Stats**:
  - Total tokens used
  - Total runtime
  - Success/failure counts
- [ ] **Logs Panel**:
  - Collapsible log viewer
  - Filter by level (info, warn, error)
  - Timestamp + message
- [ ] **Actions**:
  - Download CSV button
  - Download JSON button
  - Re-run all / Re-run failed
  - Edit & retry single item

### 5.2 Real-time Updates
- [ ] Polling or SSE for job progress
- [ ] Optimistic UI updates
- [ ] Toast notifications for completion/errors

### 5.3 Export
- [ ] CSV export with all columns
- [ ] JSON export with full structure
- [ ] Optional: include intermediates

---

## Phase 6: Polish & Security (Week 6-7)

### 6.1 API Key Management
- [ ] Secure storage in environment variables
- [ ] UI to set keys (stored encrypted in DB or localStorage)
- [ ] Key validation on save
- [ ] Never expose keys to client

### 6.2 Input Validation
- [ ] Max data items limit (configurable)
- [ ] Max prompt length validation
- [ ] Sanitize inputs to prevent injection

### 6.3 UI Polish
- [ ] Loading states everywhere
- [ ] Empty states with guidance
- [ ] Keyboard shortcuts
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (ARIA labels, focus management)

### 6.4 Error UX
- [ ] User-friendly error messages
- [ ] Retry suggestions
- [ ] Help tooltips

---

## Phase 7: Deployment (Week 7-8)

### 7.1 Docker Setup

```dockerfile
# Dockerfile (Next.js frontend)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Next.js Frontend
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/data/promptflow.db
      - N8N_WEBHOOK_URL=http://n8n:5678/webhook
    volumes:
      - ./data:/app/data
    depends_on:
      - n8n

  # n8n Workflow Engine
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-changeme}
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://n8n:5678/
      - GENERIC_TIMEZONE=UTC
      # LLM API Keys
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n/workflows:/home/node/workflows
    restart: unless-stopped

  # Optional: PostgreSQL for production
  # postgres:
  #   image: postgres:15-alpine
  #   environment:
  #     - POSTGRES_USER=promptflow
  #     - POSTGRES_PASSWORD=${DB_PASSWORD}
  #     - POSTGRES_DB=promptflow
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  # postgres_data:
```

### 7.2 Documentation
- [ ] README with setup instructions
- [ ] Environment variables documentation
- [ ] API documentation (optional)

### 7.3 Testing
- [ ] Unit tests for processors
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (Playwright)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE (Next.js)                     │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  CONFIGURE      │     INPUT       │          OUTPUT             │
│  ─────────      │     ─────       │          ──────             │
│  System Prompt  │  Upload/Paste   │  Results Table              │
│  User Prompts   │  Data Preview   │  Progress Bar               │
│  LLM Settings   │  Run Button     │  Logs & Stats               │
│  Templates      │                 │  Export & Retry             │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         ▼                 ▼                       ▲
┌─────────────────────────────────────────────────────────────────┐
│                      ZUSTAND STATE STORES                        │
│  config-store.ts    input-store.ts    job-store.ts              │
└─────────────────────────────────────────────────────────────────┘
         │                 │                       ▲
         ▼                 ▼                       │
┌─────────────────┐  ┌────────────────────────────────────────────┐
│ Next.js API     │  │              n8n WEBHOOKS                  │
│ /api/templates  │  │  POST /webhook/process-single              │
│ /api/jobs       │  │  POST /webhook/process-batch               │
└────────┬────────┘  └───────────────────┬────────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐  ┌────────────────────────────────────────────┐
│   Database      │  │              n8n WORKFLOW ENGINE           │
│   (SQLite/PG)   │  │  ┌──────────────────────────────────────┐  │
│   - Templates   │  │  │  For each data item:                 │  │
│   - Jobs        │  │  │  1. Format prompt: {input} → data    │  │
└─────────────────┘  │  │  2. Call LLM node (OpenAI/Claude)    │  │
         ▲           │  │  3. If chaining:                     │  │
         │           │  │     - Store output                   │  │
         │           │  │     - Format next: {previous_output} │  │
         │           │  │     - Loop until done                │  │
         │           │  │  4. Return results                   │  │
         │           │  └──────────────────────────────────────┘  │
         │           │                                            │
         │           │  Batch: SplitInBatches node (concurrency)  │
         │           │  Retry: Built-in error handling            │
         │           └─────────────────┬──────────────────────────┘
         │                             │
         │  ┌──────────────────────────┘
         │  │ Callback: POST /api/jobs/[id]/callback
         │  ▼
         └─────────────────────────────────────────────────────────
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LLM PROVIDERS (via n8n)                      │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐                 │
│  │  OpenAI  │  │  Anthropic   │  │  HTTP Req  │                 │
│  │  Node    │  │  Node        │  │  (Custom)  │                 │
│  └──────────┘  └──────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prompt Chaining Example

**Config:**
- System Prompt: "You are an expert data analyst."
- User Prompt 1: "Summarize this data: {input}"
- User Prompt 2: "Based on this summary: {previous_output}, identify 3 key insights."
- User Prompt 3: "Format these insights as bullet points: {previous_output}"

**Input Data Item:** "Sales in Q1 were $1.2M, Q2 $1.5M, Q3 $1.1M, Q4 $1.8M"

**Execution Flow:**
```
Step 1: LLM(system, "Summarize this data: Sales in Q1...")
        → Output: "Annual sales totaled $5.6M with Q4 being strongest..."

Step 2: LLM(system, "Based on this summary: Annual sales totaled..., identify 3 key insights.")
        → Output: "1. Strong Q4 performance, 2. Q3 dip needs investigation..."

Step 3: LLM(system, "Format these insights as bullet points: 1. Strong Q4...")
        → Output: "• Strong Q4 performance\n• Q3 dip needs investigation..."

Final Result: {
  input: "Sales in Q1...",
  intermediates: [step1_output, step2_output],
  finalOutput: "• Strong Q4 performance..."
}
```

---

## Milestones & Timeline

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| 1-2 | Foundation | Project setup, DB schema, base layout |
| 2-3 | Configuration | Config page fully functional, templates |
| 3-4 | Input | Data upload, parsing, preview |
| 4-5 | Engine | LLM integration, chaining, batch processing |
| 5-6 | Output | Results display, export, logs |
| 6-7 | Polish | Security, validation, UX refinement |
| 7-8 | Deploy | Docker, docs, testing |

---

## Future Enhancements (Post-MVP)

1. **Authentication**: Multi-user support with NextAuth
2. **Job History**: Browse and re-run past jobs
3. **Webhooks**: Notify external systems on completion
4. **Scheduling**: Cron-based recurring runs
5. **File Inputs**: PDF, DOCX parsing
6. **Streaming**: Real-time output display
7. **Cost Estimation**: Show estimated cost before running
8. **Prompt Library**: Shared prompt templates
9. **Branching Chains**: Conditional logic in prompts
10. **API Access**: REST API for programmatic use

---

## Getting Started (Quick Reference)

```bash
# 1. Clone and install
git clone <repo>
cd promptflow
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys:
#   OPENAI_API_KEY=sk-...
#   ANTHROPIC_API_KEY=sk-ant-...
#   N8N_USER=admin
#   N8N_PASSWORD=your-secure-password

# 3. Start n8n and database
docker-compose up -d n8n

# 4. Initialize database
npx prisma generate
npx prisma db push

# 5. Import n8n workflows
# Open http://localhost:5678
# Import workflows from n8n/workflows/*.json
# Configure LLM credentials in n8n

# 6. Run Next.js development server
npm run dev

# 7. Open http://localhost:3000
```

---

## n8n Workflow Setup Guide

### Initial n8n Configuration
1. Access n8n at `http://localhost:5678`
2. Create credentials:
   - **OpenAI**: Settings → Credentials → Add → OpenAI API
   - **Anthropic**: Settings → Credentials → Add → HTTP Header Auth (for Claude)
3. Import workflows from `n8n/workflows/` directory
4. Activate webhook triggers

### Workflow Testing
```bash
# Test single item processing
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

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Rate limits | n8n SplitInBatches node with configurable concurrency |
| API costs | Token counting in n8n, cost estimation, limits |
| Data loss | Auto-save configs, job persistence in DB |
| Security | API keys in n8n credentials (encrypted), never exposed to client |
| n8n downtime | Health checks, Docker restart policy, logging |
| Complexity | n8n visual workflows simplify debugging |

---

---

## n8n vs Custom Backend Comparison

| Aspect | n8n Backend | Custom Node.js Backend |
|--------|-------------|------------------------|
| **Setup time** | Fast (pre-built nodes) | Slower (code from scratch) |
| **LLM integration** | Built-in OpenAI, Anthropic nodes | Manual SDK integration |
| **Batch processing** | SplitInBatches node | Custom p-limit implementation |
| **Error handling** | Built-in retry, error workflows | Manual try/catch, queues |
| **Visual debugging** | Workflow canvas, execution history | Console logs, debugger |
| **Extensibility** | Add nodes, custom functions | Full code control |
| **Maintenance** | Low (n8n updates) | Higher (dependency updates) |
| **Performance** | Good for most use cases | Can optimize hot paths |

**Recommendation**: n8n is ideal for PromptFlow because:
- Visual workflow design matches the prompt chaining concept
- Built-in LLM nodes reduce integration code
- SplitInBatches handles batch processing elegantly
- Execution history aids debugging
- Easy to extend with new LLM providers

---

*Document Version: 2.0 (n8n Backend)*  
*Last Updated: 2024-12-29*
