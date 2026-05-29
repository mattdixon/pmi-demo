# PMI Aspire — AI Receptionist (POC)

Proof-of-concept dashboard for the PMI Aspire after-hours AI receptionist. It
proves the call loop end to end using **mocked AppFolio data**: a simulated call
looks up a tenant, classifies the issue, and creates a ticket that appears live
on a projected dashboard within ~2 seconds.

No relational database / no schema. State (logs + tickets) lives in **Upstash
Redis** so it stays consistent across Vercel's serverless instances. Deploy
target is Vercel.

> **Why Redis?** On Vercel each request can run in a *different* serverless
> instance, and module memory isn't shared between them — so a ticket created on
> one instance wouldn't show up when the dashboard polls another. A shared store
> fixes that (and also survives cold starts). If no Redis credentials are
> present (e.g. local dev), the app automatically falls back to in-memory state,
> which is fine locally because there's a single process.

## Stack

- Next.js (App Router) + TypeScript
- React 19
- Upstash Redis for shared log + ticket state (in-memory fallback when unconfigured)

## Redis setup (Upstash)

Required only for Vercel (or any multi-instance host). For purely local runs you
can skip this — the app falls back to in-memory.

1. In the **Vercel dashboard → Storage → Upstash (Redis)**, create a database
   (free tier is fine). Connect it to this project.
2. Vercel injects the credentials as env vars automatically. The app reads
   either naming scheme:
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, or
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN`
3. To exercise the Redis path locally, put the same two vars in `.env.local`:
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

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

Check **http://localhost:6743/api/health** (or `/api/health` on the deployed URL)
to confirm the shared Redis store is actually connected.

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
3. Framework preset auto-detects **Next.js** (also pinned via `vercel.json`).
4. **Provision Upstash Redis** and connect it to the project (see _Redis setup_
   above) so state is shared across instances. Without it, tickets created on one
   instance won't appear on the dashboard polling another.
5. Deploy. The dashboard is served at the project root `/`.

Notes for demo day:
- Open the deployed URL in Chrome, projected on screen.
- Fire one warmup request (any curl below) immediately before the live call so
  the serverless function is hot.
- State now persists in Redis, so it survives cold starts and is consistent
  across instances — no need to refresh between paths.

## API reference

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/lookup?complex=X&unit=Y` | Look up tenant (case-insensitive). 200 + record, or 404 `{ error: "not found" }`. |
| POST | `/api/tickets` | Create a ticket. Body `{ tenant_id, issue_type, description }`. 201 + ticket, or 400 on bad `tenant_id`. |
| GET  | `/api/tickets` | All tickets in memory (dashboard helper). |
| GET  | `/api/logs` | Log buffer (dashboard helper). |
| GET  | `/api/health` | Reports whether the shared Redis store is connected. `store: "redis"` + `connected: true` = good; `in-memory (fallback)` = state is per-instance. |

`issue_type` is one of `callback` | `urgent` | `maintenance`.

## Seed data

- **Complexes:** Aspire Heights, The Maple at Lakewood, Cherry Creek Commons
- **Units (each):** 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B — 24 tenants total
- Each tenant has an incrementing `tenant_id`, fake name, `(615) 555-XXXX`
  phone, and a varied `lease_end`.

## Logging behavior

A ring buffer (cap 500), backed by a Redis list (or module memory when Redis is
unconfigured), records two line types:

- **request** — method/path/query/body, logged *before* the handler runs.
- **app** — handler-level messages via a `log()` helper.

The two **functional** endpoints (`/api/lookup`, `POST /api/tickets`) are
request-logged so the call loop is visible in the feed. The two dashboard
**polling helpers** (`GET /api/logs`, `GET /api/tickets`) are intentionally
*not* request-logged — otherwise the 2-second poll would flood the feed and bury
the actual demo activity.

## Scope

This POC deliberately omits auth, real AppFolio integration, rate limiting,
alerts, caller ID, agent branching, and dispatch logic. Those belong to Stage 1 /
Stage 2 of the production build and are out of scope on purpose.

> Note: the PRD listed "no database / zero external services." We added Upstash
> Redis purely to keep the live dashboard consistent across Vercel's serverless
> instances — without shared state the demo's core visual (ticket appears within
> 2s) is unreliable. It's a thin key/value store for logs + tickets, not a
> relational schema, and the app still falls back to in-memory when it's absent.
