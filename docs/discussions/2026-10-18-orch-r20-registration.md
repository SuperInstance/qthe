# ORCH-R20 Registration — the consumer round (a fourth language, a second live consumer)

Filed 2026-10-18, before any work, orchestrator (Z.ai, erised fleet line).
Operator's orders this round: lots of building/testing/researching/coding/
debugging; documentation, README and deployments kept current; small creative
breaks in new forms; mostly technology.

## Why these two lanes

- **The cross-impl matrix is 3/4.** JS (reference), Python (L0), C99
  (byte-exact, sealed `03cf0800…`) — Rust is absent. The fleet's sibling
  repos carry Rust ports as first-class (a2a-signal-chain, quilt-rust); the
  external review's blueprint was Rust. A fourth byte-exact port extends
  the strongest existence proof this repo owns (same kernels, same bytes,
  four runtimes) and prices the spec's portability claim one rung further.
- **The frontier doc names the trigger**: "the trigger for the hierarchical
  build: a second live consumer." There is exactly one live consumer today
  (the deployed field service). This round builds the second: **the
  docket** — a qthe-backed task-arbitration Durable Object on the running
  worker — and prices what it changes (E-Q19). If the docket lives, the
  8×64+8 hierarchical survivor (registered r18, untriggered) fires for r21.

## Lanes

- **T11-a — crossimpl/rs** (subagent, worktree `r20-rust`): Rust port of
  the kernel, byte-exact against the sealed fixtures on both planes,
  σ-as-bits (never libm — the C lane's law), conformance harness, sealed
  receipts, REGISTRATION.md, findings row, PORTING.md runtimes row.
- **T11-b — the docket (second live consumer)**: `QtheDocket` DO on the
  deployed worker — submit/claim/state/log routes; arbitration by kernel
  hit() at the claimer's anchor (Moore-8 view + wormhole resonance);
  abstain-tasks defer (rotate by i), two consecutive deferrals dead-letter
  with a receipt; saturation `min(d+1,63)` ages re-boosted tasks.
  Deployed, live-checked, `CLOUDFLARE-DEPLOYMENT.md` Addendum 4.
- **T11-b2 — E-Q19 (pre-registered before any run)**: paired arms, same
  task stream replayed (seed-pinned). Arm B = FIFO + static priority (the
  standard inbox). Arm A = the qthe docket. Loads: L1 normal (parity
  expected — honest-null-tolerant), L2 flapping (25% of tasks oscillate),
  L3 flood (one adversarial source at 50% volume). Metrics: Jain fairness,
  starvation (> W epochs unserved), p50/p99 claim→serve latency, max
  source share, dead-letter rate. Attribution arm A-off (wormholes OFF,
  exploratory, LAYER 1). Claim registered as **C10**; if it dies it dies
  with an autopsy, per house law.
- **T11-c — creative trio** (small breaks, per prescription): three forms
  verified absent from the 21,995-entry AI-Writings tree — ERRATA /
  RESUMES / SAFETY_DATA_SHEETS. Bench round before push (Seed / DeepSeek /
  MiMo, AS-SAID, amendment log `situations/creative_r20/`).
- **T11-d — the sweep**: merge T11-a, README r20 section, PORTING.md,
  PHASES-REPORT post-roadmap row, CLAIM-VERDICTS + SPEC C10 row (post
  pricing), dashboard regen, full battery (run_tests, verify_all_chains,
  probe_gate re-seal, guard, negctl at clean HEAD), live_checks extended
  with docket checks, round report.

## Predictions (falsifiable, registered before any run)

- **P1**: crossimpl/rs reaches byte-exact conformance vs the sealed
  fixtures on both planes. Expect 1–2 new AMBIGUITY.md items (base rate:
  the C port found them); zero-found will be receipted as zero-found.
- **P2**: E-Q19 L2 flapping — docket Jain ≥ 0.80 vs baseline < 0.65;
  starvation count reduced ≥ 40%.
- **P3**: E-Q19 L3 flood — max adversarial source share ≤ 30% vs baseline
  ≥ 55% (saturation aging caps the boost).
- **P4**: E-Q19 L1 normal — parity: p50 within 15% of baseline.
- **P5**: the live docket passes determinism: two independently created
  QtheDocket DOs at the same seed produce identical arbitration-log
  hashes.
- **P6**: the creative trio lands with zero form collisions (verified
  against the tree this round) and ≥ 6 bench amendments or declines.
- **P7**: round spend ≤ $0.012 (Seed design attack ~$0.005 + creative
  bench ~$0.004 + margin).
- **P8** (amendment-law base rate): at least one erratum or amendment is
  found and receipted before close (every round since r16 has ≥ 1).

## Pre-declared scope cuts (honest, not silent)

- If the docket DO threatens the green live-check state mid-round, the
  local E-Q19 pricing stands alone and the live deployment moves to r21 —
  the sealed record beats the demo.
- If the Rust toolchain cannot be installed in this sandbox, the lane
  converts to REGISTRATION-only (code delivered, conformance honestly
  marked unexecuted) — no unexecuted "PASS" claims, ever.
- Creative trio does not block technology lanes; it fills the breaks.

Budget: $0.012. Registration commit precedes all work products.
