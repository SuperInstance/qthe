# ORCH-R22 Round Report — the reachable-seat round

Filed 2026-10-18, orchestrator (Z.ai), erised fleet line. Registration:
`2026-10-18-orch-r22-registration.md` (committed 9d2d0a8 BEFORE any
spend; budget $0.05 LLM + 5 moth credits + free-tier CF).

## The dispatch

The operator re-sent the Cloudflare token (now staged), doubled down on
Groq ("rapid and cheap models … in harmony with the other tools like
the two typesafe.ai models and the new things people are doing with
them"), and set the pace: "go as far as you can — you got a lot on your
plate and a lot to learn through experimental experience."

## T13-a — the relay seat + THE GEO LAW (the round's unlock)

Deployed `groq-relay` (Cloudflare Worker, ~120 lines, zero deps):
fail-closed relay-token auth (401 on mismatch, measured), server-side
Groq key custody (the key never crosses the wire from the sandbox),
pass-through honesty, `GET /` transparency receipt, observability off.
Two errata receipted in-code (the TDZ ReferenceError on the probe route;
the browser-UA law applied to the upstream fetch).

The relay still draws 403 from Groq — and the disambiguation turned
that into the round's LAW: **Groq geo-blocks HK-region traffic PRE-AUTH.**
Evidence: (a) sandbox = HK, Alibaba AS45102, authed+unauthed 403; (b)
Worker at the HKG colo (client-near placement), authed+unauthed
(`/probe/noauth`) the same 403; (c) Azure US runner unauthed → **401
`Invalid API Key`** — the auth layer REACHED. The key was never at
fault; it had never been evaluated. Smart Placement enabled on the
relay (geo-pending; the receipt stands as measured). C13 remains
candidate-open pending a relocated relay; the OPERATIVE route is the
Actions seat, which C13's spirit motivated and which works.

## T13-b — BOTH GROQ SEATS EARNED (tavern → 12 seats)

The Actions seat: `.github/workflows/groq-seat.yml` (egress receipt +
noauth probe first; canary; trial; harmony lane; artifacts home; the
only secret is the low-blast-radius GROQ_API_KEY). YAML erratum
receipted (unquoted colon-space in a step name → the dispatch 422 class).

- Canary LIVE both seats (qwen 165 ms / gpt-oss 339 ms; $0.00006).
- The design-attack trial (on the E-Q20b registration, AS-SAID):
  qwen $0.001582 — 6 attacks, the critical one being the n=20
  95th-pct floor = the 19th order statistic (tail-sensitivity); gpt-oss
  $0.000551 — 6 attacks, the critical one being the "Moran's I
  distance" conflation. The convergent critical family was ANSWERED BY
  THE F0' GATE (byte-exact reproduction pins the exact computation).
  `situations/groq_seats/SEATS-EARNED-r22.md`.
- Two seat laws banked: **per-model defaults** (gpt-oss 400s on
  `reasoning_effort=default`) and **reasoning budget** (2048 completion
  tokens all burned on reasoning → empty answer; 6144 headroom).

## T13-d — E-Q20b SEALED (zero credits): T* > 512, the metastable plateau

The burn-in ladder re-derived the sealed planes (journal + AM5
expansion; the A2 exclusion declined-on-facts as registered), passed
the F0' gate BYTE-EXACTLY (30/30 hashes, 32/32 floor values, 64/64
cross-arm medians vs E-Q20's sealed record), and laddered to t=512.

- **H1b DIES — T* > 512.** The honest null branch fired exactly as
  registered (P5, p≈0.15). The consumer law extends: burn T > 512 at
  64×64 for correlation statistics.
- **H2b DIES — re-excitations [16, 32, 64] after first touch at t=8.**
  The r21 "converging monotonically" reading was a checkpoint-sampling
  artifact. The true shape: **dip below floor at t=8 (0.0030 vs
  0.0134) → re-excite (0.0482@16) → metastable plateau at ~0.030
  (~16–20% above floor) through t=512.**
- The shuffled control A3S excurses UP (the tick operator BUILDS
  correlation from shuffled initials, 0.0687@16) and reaches the floor
  exactly at the ladder's edge (512). Marginals (dW1) wash out by t=64
  — geometry is remembered ≥8× longer than marginals.
- Chain `e_q20b` (6 links, tip `4aa12d65…`); C11's DIES stands; the
  T* annotation amended append-only (CLAIM-VERDICTS + the row pointer).
  Predictions: P5 HIT; P1/P3/P4 MISS (receipted in the verdict); P2
  unscorable, direction noted.

## T13-c — HARMONY-r22 (the operator's phrase, priced)

The same 6-statement ground-truth battery (sealed BEFORE any call;
traps on the dip-then-re-excite trajectory and the credit provenance)
across three seat families:

| seat | score | cost | latency |
|---|---|---|---|
| deepinfra/mimov26f (control) | **6/6** | $0.000433 | 46 s |
| typesafe/jev-latest (jev-1.13.0) | 5/6 (misses S5@0.35) | 2556 in/231 out | 206 ms |
| typesafe/jev-preview (jev-1.14.0) | 5/6 (misses S3@0.41) | 2556 in/231 out | 275 ms |
| groq/qwen38-27b | 4/6 | $0.000752 | 1.9 s |
| groq/gpt-oss-20b | v2 pending artifact | $0.000530 (v1) | — |

- **THE TWO TYPESAFE MODELS FOUND** (the operator's phrase decoded):
  `GET /v1/models` serves `jev-latest` (→ jev-1.13.0) and
  `jev-preview` (→ jev-1.14.0, "should be better in most ways"). Both
  ran; they disagree on exactly the trap-adjacent statements (S3, S5) —
  a complementarity signal: run both when the question is subtle.
- The criteria-keys law receipted (v1 rows sealed as the shape-erratum:
  the systemone choice map's criteria KEYS are the choices).
- The harmony finding (candidate for r23): seat families misread
  DIFFERENT statements — a cheap diverse panel covers more of the
  record than any single seat. The MiMo control (the cheapest reader
  at $0.000433) was the only perfect one — the r15 "price does not buy
  adjudication" law, now cross-family.

## T13-e — audit-lottery: NO-RUN receipt (fail-closed as registered)

The moth API has NO balance endpoint (five probes, all 404; the key is
valid — the r21 jobs list). The ≥5-credit condition is unobservable →
the lane stood down with the labeled receipt
(`situations/audit_lottery_r22_NO-RUN.md`); the commit-before-draw
design stands registered for a future round.

## The sweep + batteries

verdict_recompute +1 curated claim (C11-T* annotation; claimGate regex
extended for b-suffix ladders) → **ALL PASS 33/33, coverage 22/22
chains**; probe gate re-sealed (links=34, tip `6f0c7084…`);
verify_all_chains ALL CLEAN 41/41 (17 tips); run_tests all_pass; negctl
**28/28 DETECTED** at clean HEAD; fleet seeds re-emitted after the
dashboard-refusal law fired (registry edit → re-emit; 22 chains, 741
rows); dashboard regenerated. CI: green through the sweep commits; the
one red run (39141432793) was the pre-sweep uncovered-chain state, fixed
by the sweep (the coverage law working as designed).

## Spend (of the $0.05 LLM cap)

Groq: canary $0.00006 + trial $0.002133 + harmony v1 $0.001282 ≈
$0.0035. typesafe: 4 battery calls (2 erratum + 2 scored) — metering
per the systemone usage fields. DeepInfra control $0.000433. Total
LLM ≈ **$0.004** — 8% of the cap. Moth: **0 credits** (E-Q20b replay;
audit-lottery stood down). Cloudflare: free tier.

## Next registered (r23 candidates)

- The harmony finding priced as a claim (panel-diversity vs single-seat
  comprehension, battery expanded beyond 6 statements).
- The relay relocation check (Smart Placement) — if US-side, C13
  measures low-latency; else the Actions seat remains the house route.
- E-Q20c horizon extension OR the plateau-mechanism question (why
  ~1.2× floor: the wormhole twin channel as the correlation reservoir?).
- The gpt-oss v2 harmony row merge + the standing watch (PRs, seedbox).

## Trending receipts (the light scout, cited)

- **"Weak judges, strong panel: an ensemble approach to LLM eval"**
  (orq.ai, 2026-05) — "Mix providers, not models … Disagreement is
  data." External convergence with what HARMONY-r22 measured from the
  inside: the three families misread DIFFERENT statements; the
  disagreement pattern (typesafe 1.13.0 vs 1.14.0 splitting exactly on
  the trap-adjacent S3/S5) is signal, not noise.
- **"Correlated Errors Undermine LLM Evaluation Panels"**
  (arXiv 2605.29800) — the boundary condition for the r23 candidate
  claim: a panel helps only where errors are diverse; our battery
  measures exactly that axis (the pairwise agreement matrix).
- **Groq's agentic surface for gpt-oss** (console.groq.com docs):
  built-in browser search, code execution, remote tools + MCP — the
  "wide abilities" the operator pointed at extend beyond chat; a
  registered r23 candidate is a tool-use trial through the Actions
  seat (the client already carries the route).
