# ORCH-R16 Round Report — the token-arrives round

Filed 2026-10-18, orchestrator (Z.ai), erised fleet line.
Registration: `2026-10-18-orch-r16-registration.md` (lanes T7-a…T7-d,
predictions P1–P7, budget $0.01 creative ceiling).

## T7-a CREATIVE-3 — three genres, maximally distant from the r15 pair

- **E22 — THE SMALLEST WORKING ANIMAL** (SIT-COM_THE_WORKING_ANIMALS,
  Season 3 Episode 2): the working animals hire a 249-line,
  zero-dependency cell with four states. Canon honored (recursive
  stage-direction cadence, buttons unpressed, page 47, the permanent
  chair, skénna); the bible's law kept (≥2 running gags, Wilde epigram,
  never explains itself). Commit `01829087d7`.
- **four-seats-at-the-tavern** (MODEL_PORTRAITS): non-fiction — this
  bench, drawn ONLY from AS-SAID receipts on disk. Hy4 the Gothic
  Archbishop of Certainty (convicts the true, defers on the false, at
  50× the price), Seed the Devil's Advocate, DeepSeek the line critic,
  MiMo the landing judge; the verdict maps each seat to its timbre.
  Commit `45569e0882`.
- **the-ternary-crew** (radio-theater shanty album): "Heave the claim,
  boys!" — the round cycle (register → run → receipt → devil → seal →
  push) as a hauling song; the twenty paid silences, the invisible twin,
  the ceiling at dusk. Commits `5798884c46` + `48992e8e73`, shelf index
  `33830574ca`, INDEX addendum `177f0568aa`.
- **Bench round BEFORE push** (the r15 ritual): 3 seats, opinions AS-SAID
  in `situations/creative_r16/opinions_r16.jsonl`; 10 amendments made
  (A1–A10, all receipted in `amendments.md`), 3 declines-on-facts stated
  (D1–D3). Spend ~$0.004 of the $0.01 ceiling.

## T7-b CLOUDFLARE LIVE (C6–C8) — the design is now a running service

Worker `https://qthe-cell.casey-digennaro.workers.dev` (build r16-fix2),
Pages `https://qthe-demo.pages.dev`. Kernel vendored byte-identical
(sha256 `ef9a3bba…3f091`, `cloudflare/PROVENANCE.txt`). Durable Object
`QtheField` (SQLite class, free tier), Vectorize `qthe-twins` (64-dim
cosine), R2 `qthe-receipts` (13 sealed chains), Pages (landing + the
byte-identical A2UI demo).

**Measured (re-runnable: `bash cloudflare/live_checks.sh`, fail-closed):**

| prediction | verdict |
|---|---|
| P2 token deploys Workers | PASS (account `049ff5e8…`, free tier) |
| P3 DO determinism over HTTP | PASS — cross-DO identical (seed 33001/50 ticks `390083a9…`; seed 777/40 `753da5a1…`); in-DO replay agrees; save/load stable. AFTER ERRATUM 1 |
| P4 Vectorize twin lookup | PASS — exact pairing, similarity 1.0, 64/64 census; FINDING: convergence is eventual (~10–20 s), DO authoritative |
| P5 R2 receipts sha-identical | PASS — `e_q1` `0ee28675…7455e`, `e_q17` `cb31dfc9…acb7d`, byte-identical. AFTER ERRATUM 2 |
| P6 Pages serves the demo | PASS — HTTP 200, byte-identical (34,961 bytes) |
| P1 ≤2 amendments per piece | **PARTIAL — PREDICTION MISMATCH**: shanty 2, sitcom 4, portrait 4. Cause: a three-genre set with an existing sitcom canon to honor; the bench found real canon violations (the epigram explained; the cold open doubled a link). The prediction under-called the amendment count; the pieces are stronger for all of them. |

**Errata found by the live checks themselves** (the falsifier law pointed
at my own deploy, both fixed + receipted in-code):
ERRATUM 1 — the state hash briefly included non-persisted per-tick events
(fingerprint: two DOs agreed while the in-DO replay "disagreed");
ERRATUM 2 — the receipt route matched only single-segment keys.
**Ops laws banked**: propagation-window (build markers before trust),
local-first wrangler (`--remote` or it didn't happen), eventual
consistency (retry with backoff).

**Claim bookkeeping** (`docs/CLAIM-VERDICTS.md`): old C7 (DO-serial
determinism at the edge) EARNED; R2 content-addressed receipts EARNED;
C6's twin sidecar LIVE as infrastructure with its pricing claim still
OPEN; C8's static mirror LIVE with the fan-out claim still OPEN.

## T7-c WATCH

Both gift PRs (gitpp-reading-room #1, jev-semantic #1) still open, zero
comments; fleet-seeds HEAD is still our r14 push. No action required.

## T7-d CLOSE-OUT (this document)

README r16 section; MODEL-LEARNINGS r16 (5 laws); deployment addendum +
claim receipts; this report; worklog merged. Verification battery re-run
by the orchestrator's own hand before push (run_tests, verify_all_chains,
probe_gate, guard). Pushed via `orchestrator/50-phases:main`.

## Standing gaps (unchanged, registered for r17+)

Subject-key battery sealed and loaded (fires when called). The old C6
pricing experiment (slot-histogram similarity → twin overlap) now has its
live substrate — price it when the fleet asks. jev-garden live wiring and
edge hardware remain the standing gaps.
