# PromptFlow Implementation Plan

## Executive Summary

PromptFlow is a web-based tool for configuring prompts, processing data through LLMs (batch or single), and displaying outputs with support for prompt chaining.

**The n8n backend described in earlier versions of this plan was abandoned.** Processing now runs in a standalone Hono service (`backend/`) that calls the LLM providers directly (`backend/src/lib/llm-client.ts`) and hands jobs to a self-hosted **Inngest** server for durable, retryable execution. This document reflects the code as read on 2026-10-25 and lists what remains.

### Status legend

- **[x]** Verified in the code (backend files read on 2026-10-25).
- **[ ]** Not done, or not verified. The Next.js frontend (`app/`) was **not** inspected in this revision, so every frontend item stays unchecked until someone confirms it.

---

## Tech Stack (current)

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 14 + React 18 (`app/`) | Zustand, TailwindCSS, `react-markdown`, `next-auth` in dependencies |
| **Backend API** | Hono on Node (`backend/`, port 4000) | Routes: `/api/auth`, `/api/templates`, `/api/jobs`, `/api/user`, `/api/refine`, `/health` |
| **Background jobs** | Inngest (self-hosted) | Function `process-job`, event `job/process.requested`, synced at `/api/inngest` |
| **LLM access** | Direct `fetch` to OpenAI, Anthropic, xAI | Keys come from server environment variables |
| **Database** | PostgreSQL via Prisma 5 | JSON stored as `String` columns, not `Json` |
| **Auth** | JWT (`jose`) as `Authorization: Bearer`, passwords hashed with `bcryptjs`, reset emails via `resend` | |
| **Deployment** | Docker Compose, Coolify (`docker-compose.coolify.yml`, `COOLIFY_DEPLOYMENT.md`) | |

---

## Architecture (current)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js, app/)                  │
│  Configure prompts, upload data, display results             │
└─────────────────────────────┬───────────────────────────────┘
                              │  Bearer JWT
                              ▼
                    ┌─────────────────────┐
                    │   BACKEND (Hono)    │
                    │  /api/jobs          │
                    │  /api/templates     │
                    │  /api/refine        │
                    │  /api/auth, /user   │
                    └──────────┬──────────┘
                     ┌─────────┴─────────┐
                     ▼                   ▼
          ┌─────────────────┐   ┌───────────────────────────┐
          │   PostgreSQL     │   │  Inngest (self-hosted)     │
          │  - User          │   │  process-job               │
          │  - Template      │   │  • one step per item       │
          │  - Job           │   │  • processWithChaining()   │
          │  - ResetToken    │   │  • retries per step        │
          └─────────────────┘   └─────────────┬─────────────┘
                                              ▼
                                  OpenAI / Anthropic / xAI
```

`POST /api/jobs` writes the job, sets it to `running`, sends `job/process.requested`, and returns `201`. If the event cannot be sent the job is marked `failed` and the route returns `503`. The frontend polls `GET /api/jobs/:id` until the status is terminal.

---

## Data model (current)

Source: `backend/prisma/schema.prisma`.

- **User**: `id`, `email` (unique), `password` (hash), `name?`, `role` (`user` | `admin`).
- **PasswordResetToken**: `token` (unique), `expiresAt`, cascade-deleted with the user.
- **Template**: `name`, `systemPrompt`, `userPrompts` (JSON array as string), `settings` (JSON object as string), `userId`.
- **Job**: `status` (`pending` | `running` | `completed` | `failed` | `cancelled`), `config` (snapshot), `inputData` (JSON array as string), `results`, `logs`, `tokenUsage`, `startedAt`, `completedAt`, optional `templateId`.
- `Job.n8nExecutionId` is a leftover of the n8n design and is unused. It can be dropped in a migration.

---

## Prompt placeholders (current behaviour)

Verified in `backend/src/lib/llm-client.ts`:

- `{input}`: replaced by the data item. **One string per item.** `inputData` is a `string[]`; there are no named fields or CSV columns at the backend level.
- `{previous_output}`: replaced by the output of the previous step. Only meaningful in chains with two or more prompts.
- Substitution is a global regex `replace` on the user prompts only. The system prompt is not templated. Unknown `{...}` tokens are left as they are.
- With one user prompt the job makes a single LLM call. With several, each step is a separate call, the system prompt is reused, and every output except the last is stored in `intermediates`.

---

## Delivered (backend)

- [x] Hono service with CORS, request logging, health check, 404 and error handlers
- [x] Auth: register, login, forgot/reset password (Resend), JWT middleware on `templates`, `jobs`, `refine`
- [x] Templates: list, create, get, delete (per user)
- [x] Jobs: create, list (with item counts), get, cancel/delete
- [x] Inngest function `process-job`: one durable step per item, per-item error capture, job naming from template name plus a summary of the first successful output, token totals
- [x] LLM client with three providers, a 2-minute timeout per call, and a clear error when a key is missing or the provider is unsupported
- [x] Prompt chaining with `{previous_output}` and stored intermediates
- [x] Prompt assistant (`/api/refine/generate`, `/refine`, `/test`)
- [x] Fail-fast `503` when the job queue is unreachable, so jobs do not stay `running` forever
- [x] Docker/Coolify deployment files

---

## Known issues (found while reading the code)

Ordered by impact. None of these has been reproduced by running the service.

1. ~~**Cancel does not stop a job.**~~ **Fixed 2026-10-25.** `DELETE /api/jobs/:id` set `cancelled` but `process-job` never re-read the status, so it kept calling the LLM for every remaining item and `finalize-job` overwrote the status. Now each item step re-reads the status and stops before the LLM call, and `finalize-job` / `mark-job-failed` write the final status with `updateMany` guarded by `status != 'cancelled'`. Results obtained before the cancel are kept. An LLM call already in flight when the cancel arrives still completes. Covered by `backend/src/inngest/functions.test.ts` (`npm test` in `backend/`).
2. **Items run one after another.** The loop in `process-job` is sequential, `isBatch` is computed and then discarded (`void isBatch`), and no concurrency limit exists. The earlier plan promised a parallel limit of 1 to 10. A batch of 200 items takes 200 sequential calls.
3. **Replacement strings are interpreted.** `prompt.replace(/\{input\}/g, dataItem)` treats `$&`, `$1` and `$$` inside the data as replacement patterns. Data containing those sequences is silently altered. Use a replacer function: `.replace(re, () => dataItem)`. In chains, `{input}` is substituted before `{previous_output}`, so an input containing the text `{previous_output}` gets replaced by the previous output; do both in a single pass.
4. **A job is `failed` as soon as one item fails**, even when the others succeeded (`hasErrors ? 'failed' : 'completed'`). Consider a `partial` status, and a "re-run failed items" action.
5. **The server pays for every call.** API keys come from `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` and `XAI_API_KEY` on the server. There is no per-user quota, no item limit and no cost estimate. `/api/refine/*` always uses OpenAI `gpt-4o-mini`, so it fails if only another key is configured.
6. **Outdated default models.** The fallback in `POST /api/jobs` uses `claude-3-sonnet-20240229` and `gpt-4`. Update to current models and make them configurable.
7. **Provider fallback is silent.** An unsupported or missing provider is replaced by whichever key exists, without telling the user which model actually ran.

---

## Remaining work

### Phase A: Fix the engine

- [x] Make cancel effective (issue 1)
- [ ] Add a concurrency setting and process items in parallel groups inside Inngest (issue 2)
- [ ] Safe single-pass substitution (issue 3)
- [ ] Partial-failure status and re-run failed items (issue 4)
- [ ] Update default models and surface the model actually used in the results (issues 6, 7)
- [ ] Drop `n8nExecutionId`
- [ ] Unit tests for `buildPrompt` / `processWithChaining` (placeholders, `$` sequences, chains, empty output)

### Phase B: Limits and cost control

- [ ] Maximum items per job, maximum prompt length, per-user daily token budget
- [ ] Cost estimate before running, based on the template and the item count
- [ ] Decide who pays for LLM calls: the server (today) or the user with their own key. The decision drives the Promptothèque integration below.

### Phase C: Frontend (to verify, then complete)

- [ ] Confirm which of these exist in `app/`: configure page, input page (CSV/JSON/paste), output page, templates, job history, theme toggle
- [ ] Prompt preview with the first data item substituted
- [ ] Progress bar from polled job state, exports (CSV, JSON, optional intermediates)
- [ ] Mobile layout and accessibility pass

### Phase D: Integration with Promptothèque

Goal: from a prompt page on Promptothèque, one action opens it in PromptFlow, ready to run on the user's own data. The two products stay separate codebases and deployments; only the template crosses the boundary.

**Format differences** (Promptothèque source: a Markdown file with front matter, for example `content/prompts/construire-un-plan-de-compte.md`)

| | Promptothèque | PromptFlow |
|---|---|---|
| Variable syntax | `{{client}}` | `{input}`, `{previous_output}` |
| Variables | Several named ones, each with `libelle` and `exemple` | A single `{input}` string per item |
| Structure | One body: Rôle / Tâche / Contexte / Format de sortie | `systemPrompt` plus `userPrompts[]` plus `settings` |
| Sample output | After `<!-- exemple-de-sortie -->` | None |

**Mapping**

- `## Rôle` becomes `systemPrompt`. `## Tâche`, `## Contexte` and `## Format de sortie` become `userPrompts[0]`.
- Only variables declared in the front matter are converted, so literal braces in a prompt (JSON examples) are left alone.
- The sample output and the `libelle`/`exemple` metadata have no home today. Keep `exemple` to prefill the input table.

**Required engine change: named fields.** Today `{{client}}` cannot be expressed. Two options:

- **Minimal, works with the current engine:** the converter replaces the variables with one `{input}` and the user types a block of text such as `Client : … / Situation : …`. Valid, but a batch gives no structure.
- **Recommended:** allow `inputData` items to be objects. `{client}` is then replaced from the key `client`; `{input}` keeps its meaning for plain strings. CSV columns and JSON object keys map directly to variables, which is what makes batch runs useful for these prompts (the same account-plan prompt over 50 clients). Backward compatible: string items behave exactly as today. Unknown placeholders stay untouched, and the input page should warn about placeholders with no matching column.

**Tasks**

- [ ] Extend `inputData` to `(string | Record<string, string>)[]`, validate it in `POST /api/jobs`, and substitute named fields in a single pass (reuse the fix from issue 3)
- [ ] Store the variable list on the template (name, label, example) so the input page can show a form or an empty CSV header
- [ ] `POST /api/templates/import` (authenticated): accepts a Promptothèque prompt (slug or payload) and returns a template as described above
- [ ] Hand-off from Promptothèque: a link to PromptFlow that passes the prompt identifier. After sign-in, PromptFlow fetches the public prompt and creates the template. No shared login in the first version.
- [ ] Later, if usage justifies it: a shared account, so a Promptothèque paid plan unlocks PromptFlow
- [ ] Settle chain syntax: Promptothèque's multi-step chains (`etapesEnchainement` in `lib/plans.ts`) were not read for this revision. Compare them with `{previous_output}` before promising that chains transfer.

### Phase E: Deployment and operations

- [x] README rewritten for Hono + Inngest (no n8n references left in `README.md`)
- [ ] Keep `COOLIFY_DEPLOYMENT.md` and `docker-compose.coolify.yml` as the source of truth; decide whether `app/prisma` should stay a copy of `backend/prisma`
- [ ] Document required environment variables for the backend: `DATABASE_URL`, `JWT_SECRET`, the three LLM keys, `INNGEST_BASE_URL`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `FRONTEND_URL`, `PORT`
- [ ] Integration tests for `/api/jobs` (including the `503` path and cancel), and one end-to-end test of configure, run and export

---

## Prompt chaining example

**Config**

- System prompt: "You are an expert data analyst."
- User prompt 1: "Summarize this data: {input}"
- User prompt 2: "Based on this summary: {previous_output}, identify 3 key insights."
- User prompt 3: "Format these insights as bullet points: {previous_output}"

**Input item:** "Sales in Q1 were $1.2M, Q2 $1.5M, Q3 $1.1M, Q4 $1.8M"

**Execution** (`processWithChaining`)

```
Step 1: LLM(system, "Summarize this data: Sales in Q1...")        → summary
Step 2: LLM(system, "Based on this summary: <summary>, ...")       → insights
Step 3: LLM(system, "Format these insights as bullet points: ...") → final

Result: { input, intermediates: [summary, insights], finalOutput, tokenUsage, status }
```

---

## Future enhancements (post-MVP)

1. **Job history**: browse and re-run past jobs (the list endpoint already exists)
2. **Webhooks**: notify external systems on completion
3. **Scheduling**: recurring runs
4. **File inputs**: PDF, DOCX
5. **Streaming**: real-time output display
6. **Branching chains**: conditional logic between steps
7. **Public API**: tokens for programmatic use
8. **Bring your own key**: per-user provider keys, stored encrypted (depends on the Phase B decision)

---

## Risk mitigation

| Risk | Mitigation |
|------|------------|
| API costs | Item and token limits, cost estimate, per-user budget (Phase B). Today nothing limits spending. |
| Rate limits | Concurrency setting per job (Phase A); retries already handled by Inngest steps |
| Wasted spend on cancelled jobs | Cancel check before each item (issue 1) |
| Data loss | Jobs and results persist in PostgreSQL; config is snapshotted on each job |
| Key exposure | Keys are server-side environment variables and never returned to the client |
| Queue downtime | `POST /api/jobs` returns `503` and marks the job failed; Inngest resumes in-flight jobs after a crash |

---

*Document version: 3.0 (Hono + Inngest, direct LLM client)*
*Last updated: 2026-10-25*
