# PMI Aspire AI Receptionist — POC PRD (Stage 0)

**Date:** 2026-05-29
**Owner:** Matt Dixon (build) + Andrew Hathaway (client relationship)
**Status:** Draft for Andrew review
**Related docs:**
- `/projects/pmi-aspire-ai-receptionist/2026-05-28-retell-build-plan.md` (full product roadmap, Stages 1+2)
- `/projects/pmi-aspire-ai-receptionist/2026-05-29-poc-build-prompt.md` (implementation spec for this PRD)

---

## 1. Why this exists

PMI Aspire will not commit budget for the real Skywalk + AppFolio integration without first seeing the AI receptionist work end to end. This POC proves the call loop using mocked AppFolio data so PMI can see a live call create a ticket in real time.

**Business outcome:** PMI Aspire agrees to fund the production build (Stage 1 + Stage 2 of the 5/28 build plan) after watching this demo.

## 2. Who's in the room

| Role | Person | What they care about |
|---|---|---|
| Builder | Matt | Ship the POC in a weekend, no scope creep |
| Account owner | Andrew | The demo lands cleanly, no surprises |
| Customer decision maker | PMI Aspire ownership | After hours calls don't get lost, urgent issues get triaged, tenants feel heard |
| Caller (simulated) | Andrew on the demo call | Plays a tenant for each of the 3 paths |

## 3. The 3 call paths to demo

Every call comes in after hours. The AI greets, asks complex name, asks unit number, looks up the tenant, asks the issue, classifies it, and creates a ticket.

| Path | Tenant says | AI classifies as | Ticket appears as |
|---|---|---|---|
| A | "I need someone to call me back about my lease" | `callback` | Normal, yellow |
| B | "Water is leaking into my apartment" | `urgent` | **URGENT, red, all caps** |
| C | "My dishwasher isn't draining" | `maintenance` | Normal, gray |

## 4. Scope (what we build)

### In scope
- Web app deployed to Vercel (TypeScript, Next.js App Router)
- All state in memory, no database
- 2 functional API endpoints: `GET /api/lookup`, `POST /api/tickets`
- 2 helper API endpoints for the dashboard: `GET /api/logs`, `GET /api/tickets`
- Seed data: 3 apartment complexes, 8 units each (24 tenants total)
- Live dashboard at `/` showing request log (web server style) AND ticket table, both polling every 2 seconds
- Urgent tickets pop visually (red, uppercase)
- Random dev port chosen at scaffold time per global preference
- README with local run, deploy, and curl-based test instructions

### Out of scope (intentionally, to be defended)
- Authentication / API keys
- Real AppFolio integration (the entire point of the POC is to defer this)
- Persistence across cold starts
- Rate limiting
- SMS/Slack alerts to maintenance on call
- Caller ID lookup
- Multi tenant agent branching (owner / HOA / leasing)
- Vendor routing / dispatch logic
- Cascading escalation

All of the above live in Stage 1 and Stage 2 of the 5/28 build plan and only get built when PMI commits.

## 5. Success criteria (what "good" looks like on demo day)

1. Andrew dials the Retell phone number from his cell while PMI watches the dashboard projected on a screen
2. Andrew runs all 3 paths in sequence (callback, urgent, maintenance)
3. For each call, within 2 seconds of the ticket creation:
   - A new row appears in the ticket table
   - Urgent rows flash red and uppercase
   - The full request + response log scrolls past in the top section so PMI sees the system "thinking"
4. PMI Aspire says some version of "OK, what would it take to actually build this against our AppFolio?"

If that last sentence happens, the POC won the meeting.

## 6. Demo day operations

- Dashboard open in Chrome, projected
- Send one warmup request before the live call so the Vercel function is hot (in memory state survives ~5 min of inactivity, then resets)
- Have the 3 test prompts written on paper so Andrew doesn't fumble the scripts on the call
- Matt available on Telegram during the demo as silent backup if anything goes sideways

## 7. Open questions for Andrew

1. **Tenant names in seed data.** Should they be obviously fake (Pat Reynolds, Sam Carter) or feel realistic for PMI's actual portfolio? Lean toward obviously fake to avoid confusion if PMI recognizes a name.
2. **Complex names.** Currently using "Aspire Heights, The Maple at Lakewood, Cherry Creek Commons" as placeholders. Want me to use names closer to PMI's actual properties (with permission), or keep generic?
3. **Demo phone number.** Use a Retell-issued number for the demo, or do we want PMI's actual after-hours line forwarded for full realism? Recommend starting with Retell number to reduce setup risk.
4. **Backup plan if Vercel hiccups during demo.** Run a local dev server on Matt's laptop as a hot spare? (yes, recommend)

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Vercel cold start eats the first call | Medium | Warmup request immediately before live demo |
| Retell agent mis-categorizes urgent as maintenance | Low | Tune system prompt + tool descriptions to bias toward urgent on safety words (water, fire, gas, smoke, smell) |
| PMI asks "can it actually do X" mid demo and Matt's not on the call | Medium | Andrew has a one-pager of "yes / no / planned" answers prepared from this PRD |
| In memory state resets mid demo | Low | If demo runs long, refresh dashboard at the start of each path to avoid stale state confusion |

---

**Approval flow:** Matt drafts → Andrew reviews and red-lines → finalize before any build work starts. Andrew is the deciding voice on what gets shown to PMI.
