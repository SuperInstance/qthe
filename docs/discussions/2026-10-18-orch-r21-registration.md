# ORCH-R21 Registration — the quantum-construction round

Filed 2026-10-18, before any work, orchestrator (Z.ai), erised fleet line.
Operator's dispatch this round: experiment with the Moth key ("see if your
tools can be enhanced"), scout the other SuperInstance projects that used
Moth, scout the cutting edge, use Groq's rapid models in harmony with the
typesafe.ai tooling, keep documentation/README/deployments current, mostly
technology with small creative breaks.

## Where the frontier actually is (read-the-record first)

This workspace synced f99fe5c → c6a1ddd (R16–R20 were sealed and pushed by
the parallel incarnation; their round reports are the record). State at
registration: 50-phase roadmap CLOSED; post-roadmap table open; live
service `qthe-cell.casey-digennaro.workers.dev` ALL LIVE CHECKS PASS at
build `r20-docket1` (re-verified by the orchestrator's own run this
session, including the docket P-D handle `77d865d0…`); scoreboard 8 claims
priced (3 LIVES / 5 DIES / 1 STANDS); CI green at HEAD; gift PRs still
open/unanswered; battery loaded; standing gaps unchanged (jev-garden
wiring, edge hardware).

## Why this round (the deep think, receipted)

The F0 determinism law means quantum entropy can only enter qthe at
**construction time** — `makeSubstrate(w, h, seedFn)` takes a byte source,
and that is the entire attack surface a quantum house gets without
touching the kernel. The r7/r9-era Moth work used `graph-v1` emu sampling
(balance 0.55 raw — von Neumann debias mandatory, receipted E-D3/E-Q9-DT).
The engine catalog today is richer (fleet doc `AI-Writings/situations/arch/
MOTH-ENGINES.md`, 32 engines, read this session; the account's own job
history shows a fleet sibling running `comet-qrng-v1` on Oct 16):

- **`comet-qrng-v1`** (5 credits): Born-rule bytes with an **SP 800-90B
  min-entropy certificate, Toeplitz extractor and CHSH witness** — a
  *certified* source, not a debiased one. The audit-lottery lab ran it
  live (125 conditioned bytes, S = 2.80, emu/aer).
- **`blur-core-v1`** (1 credit): quantum blur over any N-D grid of
  non-negative numbers; **omit `shots` for the exact result** — a
  deterministic, genuinely quantum-computed operator. The d-field (6-bit
  amplitudes, 0–63) is exactly such a grid.

So the round's question is the one the QCA-scrambling literature asks
(PRB 107.144306, perturb-and-listen): **does construction provenance leave
a fingerprint that survives the tick dynamics, or does the tick operator
wash it out?** qthe's answer prices a new claim:

**C11 (candidate): the tick operator is a construction-provenance
blindfold.** Initial planes built from (a) PRNG, (b) SP-800-90B-certified
quantum randomness, and (c) quantum-blur-conditioned geometry become
statistically indistinguishable across all observed metrics within the
PRNG noise floor by tick 64 — while each plane remains individually
byte-deterministic. Falsifier: ANY metric where a cross-source distance
stays above the A1 leave-one-out noise floor at t = 64, or any determinism
replay disagreement, or the QRNG certificate arriving without a CHSH
witness S > 2 (classical bound).

The scientifically sharp control is **A3S** (shuffled): same marginal
d-value histogram as the blurred plane, spatial correlation destroyed by a
fixed-seed deterministic permutation (the E-Q9-DT shuffle idiom — the
permutation key is NOT derived from the stream). A3 vs A3S separates
"the blur shifted the marginals" from "the blur's correlation structure
carries signal" — the Moran's I trajectory per arm is the instrument.

## Lanes

- **T12-a — moth_client v2** (tools enhanced, per dispatch): the client
  gains the fleet's hard-won laws — browser User-Agent (Cloudflare 1010),
  `comet-qrng` wrapper with derive-sizing (8 B/float + 8 B/int + slack),
  retry-on-empty ("conditioned bytes ran out"), bell-witness + provenance
  passthrough; `blur-core` wrapper with exact-mode default; `qpixl`,
  `coin-toss`, `otoc-echo` wrappers; offline fixture replay test (zero
  credits); key doctrine unchanged (env-only, never in a row). Versioned
  as `experiments/moth_client_v2.mjs`; v1 stands (E-Q9-DT history).
- **T12-b — E-Q20** (the killer experiment, pre-registered in
  `experiments/pre_registration_e_q20.json` before any run): arms A1
  (mulberry32 PRNG, n=10) · A2 (comet conditioned bytes, n=10, ONE job,
  48 KiB) · A3 (A2's τ-field + blur-core-exact d-field at strength 0.5,
  n=5, five 1-credit jobs) · A3S (A3 marginals, fixed-seed shuffle, n=5,
  0 credits). Checkpoints t ∈ {0,1,2,4,8,16,32,64}. Metrics in code:
  d-histogram Wasserstein-1, τ-fraction total variation, Moran's I
  (rook-4 lag-1, torus), twin-event rate, saturation fraction; noise
  floor = A1 leave-one-out 95th percentile ("no threshold you had to
  fit"); determinism = every plane replayed ×2 byte-identical. Fallback
  pre-registered: if blur-core rejects the 64×64 shape, ALL arms drop to
  32×32 (receipted as an amendment BEFORE any data row).
- **T12-c — Groq seats** (code-delivered, live-pending): client +
  canary + seat-trial scripts emitting the tavern's AS-SAID row schema,
  ready for `qwen/qwen3.8-27b` and `openai/gpt-oss-20b` the moment a
  reachable seat exists. **Blocked-seat receipt, this session**: api.groq.
  com returns HTTP 403 in ~36 ms pre-auth (authed AND no-auth identical;
  browser User-Agent does not help; Moth — also Cloudflare-fronted —
  works, so this is an IP-range block on this seat, not a key fault).
  The key is staged env-only; no retry burn (the seat-block law).
- **T12-d — the sweep**: README r21 section; SPEC LAYER 2 +C11; CLAIM-
  VERDICTS + BOUNDARY-MAP rows post-pricing; PHASES-REPORT post-roadmap
  row r21; MODEL-LEARNINGS r21 (the seat-block law; comet/blur seat
  notes); KNOWLEDGE-MAP gains the audit-lottery cross-reference (the
  fleet's certified-cascade pattern — commit-before-draw — registered as
  an r22 candidate for the live service, not built this round); round
  report; full battery (run_tests, verify_all_chains, probe_gate
  re-seal, guard, negctl at clean HEAD); live checks re-run; push.
- **T12-e — watch**: gift PRs (open, unanswered — receipted); seedbox;
  CI green at HEAD (already receipted this session).
- **T12-f — creative break** (ONE small piece, new form, only if the
  technical lanes close clean; per the operator's prescription).

## Ceilings and push law

LLM ceiling **$0.02** (one Seed-2.0-mini design attack on the E-Q20
registration, ~$0.005 expected). Moth ceiling **10 credits** (1× comet
@5 + 5× blur @1), hard-capped in the runner, fail-closed to labeled mock
if the API is unreachable (a mock never pretends to be quantum — the
E-X5 doctrine). Wall-clock ceiling 20 min for the run. Push every
milestone with the **fetch-first protocol**: fetch origin/main before
every push; if it moved, re-sync and re-verify before pushing (the
parallel-incarnation collision guard, receipted this session).

## Predictions (falsifiable, registered before any run)

- **P1**: A2 ≡ A1 within the noise floor at EVERY checkpoint (p 0.9) —
  the certified source changes nothing detectable.
- **P2**: A3 fingerprint detectable above floor at t = 0 on histogram and
  Moran's I (p 0.95 — blur smooths and rescales).
- **P3**: A3 washed out to floor by t = 64 (p 0.7 — the honest
  uncertainty; wormhole non-locality should scramble spatial correlation
  fast, but this is exactly what we do not know).
- **P4**: determinism replays 100% byte-identical, all arms (p 0.99).
- **P5**: comet emu job carries CHSH S > 2 (p 0.8; audit-lottery's live
  prior S = 2.80; Aer ideal ≈ 2√2).
- **P6**: 1–2 amendments filed before any data row (base rate).
- **P7**: Groq remains 403-blocked from this seat all round (p 0.95) —
  the seats ship code-delivered, live-pending.

Escalation rule: stop-receipt-re-register on any ceiling breach.
