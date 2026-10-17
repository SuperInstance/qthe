# The qthe adoption kit

> For the engineer deciding whether to run this substrate in your system.
> Task ORCH-D (roadmap phases 44, 45, 49). Every number below is sealed and
> cited; nothing here is a promise about future work. Companions:
> `docs/TECHNICAL-NOTE.md` (the primitive, formally), `docs/BOUNDARY-MAP.md`
> (where it wins and loses, with receipts).

## What you get

**`qthe-core/`** — the standalone primitive, zero dependencies beyond each
language's stdlib (`qthe-core/README.md`, `qthe-core/PROVENANCE.txt`):

| path | plane | what |
|------|-------|------|
| `kernel/qthe.mjs` | float (σ = log₂(3) double) | the reference kernel: LAYER 0 algebra (pack/unpack, split-channel `vectorPass`) + LAYER 1 mechanism (64-slot wormhole table, `tick`, `traceView`); 266 lines, ESM, no deps |
| `kernel/qthe_fixed.mjs` | fixed (σ_q int64, S = 2³²) | the no-floats plane (R8): byte-identical to the float kernel on swept σ, more faithful on adversarial rationals |
| `c/qthe_core.{h,c}` | both | the C99 port — byte-exact vs both JS kernels on a 19-case battery (hashes, event tuples, IEEE754 term bits); one `cc -O2 -std=c99` line, no libm |
| `py/qthe_layer0.py` | LAYER 0 | the strict Python re-derivation (raises on domain violations) |

Every file is a byte-exact copy of the canonical source; `PROVENANCE.txt`
pins the sha256s; rebuild with `node scripts/build_qthe_core.mjs`.

**The demos** (reference transcripts, mechanisms not claims):
`demos/agent-coordination.mjs` (rendezvous; non-local alignment without a
message bus, with honest OFF arms), `demos/confidence_cascade.mjs`
(uncertainty-gated decisions on the split channels),
`public-demo.html` (the whole substrate + live sha256 HUD in one portable
file, zero network/server/build), `index.html` + `demo/` (the A2UI mirror).

**The tools** (`experiments/outputs/fleet_seeds_entry.json` tooling list):
`scripts/repl.mjs` (drive substrates by hand; save/load round-trips that
receipt their own byte-identity), `scripts/replay.mjs` (rebuild a sealed
trace, re-tick, verify the plane hash at every checkpoint — "a trace that
cannot replay byte-identically is not sealed evidence"), `scripts/probe_gate.mjs`
(mandatory gate PG1–PG5), `scripts/verify_all_chains.mjs` (verify all 13
receipt chains from disk), `scripts/falsification_budget.mjs` (the ledger of
banked nulls and caught defects).

## Three workloads, with the metrics that priced them

### 1. Non-local signaling without a message bus

Two agents separated by Ground have no causal path through local physics —
Ground contributes to neither channel (SPEC LAYER 0 item 3). The wormhole
table is the only channel across it.

**Success metrics (sealed):**
- Ticks-to-signal **1** — bridging occurs at tick 1; delivery completes by
  ticks 8–9 (E-Q1, `docs/CLAIM-VERDICTS.md` §C2).
- Wire cost **13 B per table-write** vs a full-plane broadcast of W·H B
  *every tick* (2,304 B/tick on the demo's 48×48 board) — the naive-bus
  strawman is priced honestly in the demo (`demos/agent-coordination.mjs`).
- The OFF arm **NEVER delivers**: 8/8 planted twin pairs delivered with the
  table ON vs 0/20 OFF (E-Q1, chain `addc22f9…`, 25 links); the demo prints
  the same honest negative live ("sensor causally isolated by Ground").

### 2. Memory-constrained encoding

The byte packs operator and operand into one memory transaction; a two-plane
port of the same rule table pays 18 reads + 1 write per cell per tick where
the packed byte pays 9 + 1.

**Success metrics (sealed, E-Q13, chain `d852e6ac…`, 25 links):**
- **47.40% bytes-to-task gain** (331,776 vs 630,784 bytes at completion tick
  8; 20/20 trials) with ticks-to-task identical 20/20.
- **2× state footprint reduction**: 4,096 vs 8,192 standing bytes on 64×64.
- Port-identity held: the two-plane port tracked the kernel byte-identically
  at checkpoints [0, 50, 100, 150, 200] in 20/20 trials — the gain is pure
  information density, not a dynamics change.
- Boundary: a cached port (τ-plane held resident) reaches per-tick parity
  (10 vs 10) at the price of 4,096 standing bytes and a frozen-τ assumption
  (`docs/CLAIM-VERDICTS.md` §C1).

### 3. Deterministic confidence cascades

Evidence enters as Attract (+d·x) / Repel (−d·x) weights — signed support in
the real channel; Abstain weights carry +d·x into the imaginary channel —
uncertainty mass the model declines to sign. A decision fires when re ≥ θ
AND im ≤ φ; fired decisions ground their evidence (τ 1|2 → 0, d kept), so
later rounds re-price only what remains (`demos/confidence_cascade.mjs`).

**Success metrics (mechanism-level, LAYER 0 facts + the demo):**
- Uncertainty-gated decisions: an all-Abstain question rides re 0 / im 95 and
  stays open; a sign-only threshold baseline cannot distinguish
  strong-support-low-uncertainty from support-riding-on-abstention.
- Integer-exact: every round is a `vectorPass` + a rule — no floats, no
  randomness, no normalization layer.
- Per-round auditability: the channel pair (re, im) is the complete decision
  record for each round; the demo's own note stands — thresholds must be
  pre-registered before evidence is seen, not read off round-0 as the demo
  does for illustration.

## The integration contract (summary)

From `docs/QTHE-AS-CELL.md` — four laws of embedding, each pricing a loss
mode:

1. **One byte, no shadow state.** The byte IS the state; a parallel copy of
   τ or d will diverge under injectors and the hull is lost.
2. **The table is shared, not owned.** Cells join a substrate-level 64-slot
   table; shared tables are deterministic ONLY under a fixed call order —
   the sheet's tick order is the contract.
3. **τ changes are injector events, never tick behavior.** Hooks may rewrite
   the byte between ticks (C5′ injector semantics: restore-then-re-erode,
   deterministic); nothing inside `tick()` mutates τ. A τ-changing hook owes
   a plane-hash re-verification before/after.
4. **Translation loss is zero by construction.** In: a QTHE vector is a row
   of bytes, `vectorPass` gives `{re, im}` in exact integers — no float
   normalization, no padding. Out: the cell emits its byte; the consumer
   hashes it. If any layer needs to "convert," it is a fork and must
   re-price conformance (the C port's 19-case battery is the template).

## Success metrics for adopters — measure these on YOUR substrate

- **Determinism re-run.** Build the same substrate twice from the same
  carried bytes and compare plane hashes (`sha256("<w>x<h>@t=<t>:<hex>")`,
  `experiments/_harness.mjs`). The precedent: F_C 20/20 fresh-build reruns
  byte-identical (`fixedpoint/findings.md`); `scripts/replay.mjs` does this
  on any sealed trace.
- **Plane-hash checkpoints.** Hash at fixed ticks, not just at the end — the
  corpus seals per-tick (G3 1000/1000) and checkpointed comparisons
  ([0, 50, 100, 150, 200] in E-Q13).
- **Paired ON/OFF arms.** Never measure a lever unpaired: E-Q1's 8/8 vs 0/20
  is the template — same substrate, same seeds, table ON vs OFF.
- **Your own geometry's coupled-family check.** The workload-coverage lesson
  is receipted in `fixedpoint/COST-OF-EXACTNESS.md`: the twin-delivery class
  *cannot* produce the coupled (reader acc = −2, writer r = 3) configuration
  — its weather cells sit ≥ 10 away, so pair members have acc = 0 — and its
  coupled-2/3 check was vacuously clean (firstDivergenceTick null in
  `fixedpoint/outputs/cost_benchmark.json`), while P-B3-style random
  substrates diverged 8/8 (ticks 2–19, `cost_benchmark_addendum.json`).
  Downstream consumers choosing a plane must test on their own substrate
  geometry, not assume the twin-delivery result transfers.

## The honest blockers

1. **NO LICENSE YET — the single blocking issue for external adoption.** The
   source repo carries no license file at extraction time; treat qthe-core as
   **source-available, all rights reserved**. One commit (add LICENSE)
   unblocks all downstream adoption; MIT-0/MIT/Apache-2.0/BSD-2 are all
   compatible with the zero-dependency posture
   (`qthe-core/LICENSE-NOTE.md`).
2. **Hardware measurements pending.** The C99 port is code-delivered and
   byte-exact, and ESP32/Jetson-class hardware is the stated deployment
   target — but no physical device run exists in this environment; receipted
   as code-delivered, hardware-pending (`demos/agent-coordination.mjs`
   verdict line).
3. **Fleet-coupled features.** Chain sealing uses the fleet's canonical
   `quilt-stone` module — linked, never forked; the standalone core ships
   hashing (via your stdlib) but not chain sealing (`qthe-core/README.md`).
   Receipt-chain tooling needs the `quilt-stone` sibling cloned beside qthe
   (`docs/DAY-1.md` step 0). The kernel, mirror, and REPL do not.

## Decision tree

**Use qthe if you need:**
- non-local alignment across an inert medium with no message bus, no routing
  table, no per-pair state (C2: 8/8 vs 0/20);
- memory-constrained encoding where a second byte per cell hurts (C1:
  47.40%, footprint halved, dynamics identical);
- byte-exact determinism and cross-language byte-exactness (python 10,272/
  10,272; C 19/19 both planes, σ as bit patterns never libm);
- integer-only arithmetic (the R8 fixed plane: 0.975× runtime, σ an exact
  integer knob) or audit trails where terms compare under `===`;
- a propagation wave you can replay exactly (the E-Q7 cascade is real,
  deterministic, fast-spreading — as a propagation primitive, not a phase
  transition).

**Don't use qthe if you need:**
- provenance (WHO signaled) under slot congestion — the table is
  content-addressed; delivery survives, attribution does not (E-Q14 B);
- self-repair — there is no repair term; hooks/injectors are the repair
  mechanism and re-erosion is deterministic (C5/C5′);
- threshold-triggered phase transitions or a critical σ scale — both are
  dead and priced (C4, C3);
- the float plane under adversarial rational σ — the exact-zero families are
  where float holds cells its own scale says should move; use the fixed
  plane there (E-Q8, `fixedpoint/findings.md`);
- a sealed scaling number for grids beyond the corpus's boards (largest
  sealed: 128×64) with the fixed 64-slot table — pending the E-Q17 scaling
  run; unmeasured regimes are never extrapolated (`docs/BOUNDARY-MAP.md`).

The first move either way is `docs/DAY-1.md`: ten minutes, every command
verified on a clean clone, ending at a sealed receipt you checked yourself.
