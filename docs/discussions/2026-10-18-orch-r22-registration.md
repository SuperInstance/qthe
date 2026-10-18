# ORCH-R22 Registration — the reachable-seat round

Filed 2026-10-18, before any work, orchestrator (Z.ai), erised fleet line.
Operator's dispatch this round: the Cloudflare token (resent, now staged
env-only), the Groq key "to use with rapid and cheap models to experiment
with wide abilities in harmony with the other tools like the two
typesafe.ai models and the new things people are doing with them", and
"go as far as you can — you got a lot on your plate and a lot to learn
through experimental experience."

## Where the frontier actually is (read-the-record first)

HEAD `822b044` = origin/main (fetch-first held; the parallel incarnation
quiet). Live service `qthe-cell` ALL LIVE CHECKS PASS at build
`r20-docket1`. Scoreboard per `docs/CLAIM-VERDICTS.md`: C1/C2 LIVES,
C3/C4/C5/C9/C10/C11 DIES, C5′ STANDS; LAYER 2: C6 DIES (priced r17),
C7/C8 measured by the live checks. CI green at HEAD. Gift PRs still
open/unanswered. Standing gaps unchanged (jev-garden wiring, edge
hardware).

## Why this round (the deep think, receipted)

The r21 seat-block law left the Groq family code-delivered/live-pending:
`api.groq.com` 403s this sandbox's egress PRE-AUTH (~36 ms, authed and
unauthenticated identical). The operator's dispatch doubles down on Groq.
The unlock sitting in the drawer: **the Cloudflare account**. A Worker's
outbound `fetch` to `api.groq.com` originates from Cloudflare's edge — a
different egress than the blocked sandbox IP. Moth (also CF-fronted)
works from this seat, and `qthe-cell` already proves our CF egress
reaches CF-fronted services. So a minimal relay Worker IS the "reachable
seat" the r21 close-out registered. This prices a new LAYER 2 deployment
claim:

**C13 (candidate): the relay seat.** A zero-dependency Cloudflare Worker
(`groq-relay`) forwarding `/openai/v1/*` to `api.groq.com` with
server-side key custody restores the full Groq API surface to a
blocked-origin caller. Measured by: the two-seat canary
(`qwen/qwen3.8-27b`, `openai/gpt-oss-20b`) completing through the relay
with AS-SAID rows sealed.

Design laws: `GROQ_RELAY_TOKEN` secret required on every call (no open
proxy — fail-closed 401 otherwise); `GROQ_API_KEY` lives ONLY as a
Worker secret (the key never crosses the wire from the sandbox —
strictly stronger than the env-only doctrine's minimum); status, body
and salient headers passed through untouched; `GET /` receipts exactly
what the relay is (the house transparency law); nothing logged.

## Lanes (registered before any run)

- **T13-a THE RELAY SEAT** — build + deploy `groq-relay` (CF token,
  free tier); canary through the relay prices C13.
- **T13-b SEAT TRIALS** — the new-member law on both Groq seats through
  the relay: canary + one design-attack opinion each earns the seat.
- **T13-c THE HARMONY EXPERIMENT** — the operator's "in harmony" priced:
  the same battery to the two Groq seats AND the typesafe systemone
  seat (plus a models-list probe — what the API actually serves; receipt
  whatever it says), agreement matrix + per-family economics. One
  DeepInfra tavern seat as the control voice if needed.
- **T13-d E-Q20b BURN-IN LADDER** — t=512 replay from the sealed r21
  journal, ZERO moth credits; pre-registered extension
  (`pre_registration_e_q20b.json`): where is T*?
- **T13-e AUDIT-LOTTERY** (conditional, 5-credit cap) — commit-before-
  draw with a fresh comet root, verified on the live service; runs only
  if the moth balance receipts ≥ 5 credits after the balance probe;
  otherwise a labeled no-run receipt.
- **T13-f WATCH + DOCS** — PRs, seedbox, CI; README r22 section;
  BLOCKED-SEAT-RECEIPT amendment (the relay unblock);
  CLOUDFLARE-DEPLOYMENT gains the relay seat section.

## Budget (committed before any spend)

- LLM: **$0.05 hard cap** (Groq is the point — rapid and cheap; the
  harmony calls on typesafe + at most one DeepInfra control).
- Moth: **5 credits max** (one comet draw, T13-e only; E-Q20b is
  zero-credit by construction).
- Cloudflare: free-tier deploys (Workers subrequests are the meter;
  the relay burns one subrequest per call).

Fail-closed laws carried: any 401/403 from the relay path writes a
labeled receipt and stops the lane (no retry burn); the E-Q20b replay
must reproduce the sealed t=0/t=64 checkpoint values byte-exactly before
any new checkpoint counts (the F0' floor).
