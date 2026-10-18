# BLOCKED-SEAT RECEIPT — Groq from the orchestrator's sandbox

Last probed: 2026-10-18T09:30:18.591Z (this round: ORCH-R21/T12-c; probes at registration and at canary).

## The evidence

- `GET/POST https://api.groq.com/openai/v1/*` returns **HTTP 403 Forbidden** with body `{"error":{"message":"Forbidden"}}` in **~36 ms** — authed AND unauthenticated IDENTICALLY (an unauthenticated call to a live auth layer returns 401; a 403 that ignores credentials is a pre-auth block).
- Browser User-Agent (the Moth Cloudflare-1010 fix) does NOT help.
- **api.mothquantum.com — also Cloudflare-fronted — works from this same seat** (live jobs this round). Not a blanket CF block; an IP-range block specific to Groq's edge.
- The operator-supplied key is structurally valid (gsk_…, correct length) and staged env-only; no evidence of key fault.

## The law (banked r21)

**The seat-block law: receipt the environment, don't burn retries.** A blocked seat is code-delivered/live-pending — the client (groq_client.mjs), the canary, and the seat-trial harness ship ready; the moment a reachable seat exists (different egress, a proxy, or the operator running the scripts), the seats join the tavern with zero code changes. This mirrors the repo's standing HW-PENDING pattern (ESP32 demos, edge profiles).

## What runs when unblocked

- `node situations/groq_seats/canary.mjs` — both seats, AS-SAID rows.
- `node situations/groq_seats/seat_trial.mjs` — the design-attack trial (the new-member law: canary + one outside-the-box opinion earns the seat).
