# PMI Aspire — AI Receptionist (POC)

Proof-of-concept dashboard for the PMI Aspire after-hours AI receptionist. It
proves the call loop end to end using **mocked AppFolio data**: a simulated call
looks up a tenant, classifies the issue, and creates a ticket that appears live
on a projected dashboard within ~2 seconds.

No database. All state lives in memory in the running process. Zero external
services. Deploy target is Vercel.

> In-memory state survives only while the process is warm (~5 min idle on
> Vercel, then resets). Send a warmup request right before a live demo.

## Stack

- Next.js (App Router) + TypeScript
- React 19
- In-memory ring-buffer logger + in-memory ticket store

## Local run

Dev server runs on **port 6743** (chosen at scaffold time; not a common default).

```bash
npm install
npm run dev
# open http://localhost:6743
```

Production-style local run:

```bash
npm run build
npm start          # also serves on port 6743
```

## Interactive API docs (Swagger UI)

Open **http://localhost:6743/docs** for a Swagger UI page to exercise every
endpoint from the browser (pre-filled examples for all 3 call paths). The raw
OpenAPI 3.1 spec is served at `/api/openapi`.

Swagger UI assets load from a pinned CDN (no npm dependency added), so the docs
page needs internet access when it loads — the API itself does not.

## Test the endpoints (curl)

With the server running on `http://localhost:6743`, a demo operator can drive
all three call paths live and watch the dashboard react:

```bash
# 1. Look up a tenant (Path setup) — case-insensitive complex/unit match
curl "http://localhost:6743/api/lookup?complex=Aspire%20Heights&unit=3B"

# 2. Path B — URGENT ticket (pops red + uppercase on the dashboard)
curl -X POST http://localhost:6743/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":6,"issue_type":"urgent","description":"water leaking from ceiling"}'

# 3. Path C — maintenance ticket (normal, gray row)
curl -X POST http://localhost:6743/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":6,"issue_type":"maintenance","description":"dishwasher isn'\''t draining"}'
```

Helper endpoints the dashboard polls every 2s (also handy for debugging):

```bash
curl http://localhost:6743/api/logs       # in-memory log buffer (most recent first)
curl http://localhost:6743/api/tickets    # all tickets (most recent first)
```

> `tenant_id` 6 maps to a tenant in **Aspire Heights**. Run the lookup in step 1
> first if you want to confirm the exact id for a given complex/unit, or just
> use any id from 1–24.

## Deploy to Vercel

1. Push this repo to GitHub (or run `vercel` from the project root).
2. In Vercel, **New Project** → import the repo.
3. Framework preset auto-detects **Next.js**. No env vars, no build overrides
   needed — accept the defaults.
4. Deploy. The dashboard is served at the project root `/`.

Notes for demo day:
- Open the deployed URL in Chrome, projected on screen.
- Fire one warmup request (any curl above) immediately before the live call so
  the serverless function is hot.
- If state looks stale mid-demo, refresh the dashboard at the start of each path.

## API reference

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/lookup?complex=X&unit=Y` | Look up tenant (case-insensitive). 200 + record, or 404 `{ error: "not found" }`. |
| POST | `/api/tickets` | Create a ticket. Body `{ tenant_id, issue_type, description }`. 201 + ticket, or 400 on bad `tenant_id`. |
| GET  | `/api/tickets` | All tickets in memory (dashboard helper). |
| GET  | `/api/logs` | In-memory log buffer (dashboard helper). |

`issue_type` is one of `callback` | `urgent` | `maintenance`.

## Seed data

- **Complexes:** Aspire Heights, The Maple at Lakewood, Cherry Creek Commons
- **Units (each):** 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B — 24 tenants total
- Each tenant has an incrementing `tenant_id`, fake name, `(615) 555-XXXX`
  phone, and a varied `lease_end`.

## Logging behavior

A module-scoped ring buffer (cap 500) records two line types:

- **request** — method/path/query/body, logged *before* the handler runs.
- **app** — handler-level messages via a `log()` helper.

The two **functional** endpoints (`/api/lookup`, `POST /api/tickets`) are
request-logged so the call loop is visible in the feed. The two dashboard
**polling helpers** (`GET /api/logs`, `GET /api/tickets`) are intentionally
*not* request-logged — otherwise the 2-second poll would flood the feed and bury
the actual demo activity.

## Scope

This POC deliberately omits auth, real AppFolio integration, persistence, rate
limiting, alerts, caller ID, agent branching, and dispatch logic. Those belong
to Stage 1 / Stage 2 of the production build and are out of scope on purpose.
