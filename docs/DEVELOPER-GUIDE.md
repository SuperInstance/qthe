# qthe — Developer Guide

## Code layout

| Path | What it is |
|---|---|
| `SPEC.md` | The canon: the 8-bit primitive, LAYER 0 algebra facts, LAYER 1 mechanism, LAYER 2 priced claims C1–C5, fleet additions. Read fully before touching anything. |
| `qthe.mjs` | The reference kernel (266 lines, zero deps, ESM): LAYER 0 exports (`TAU`, `PSI`, `pack`/`unpack`/`tauOf`/`dOf`, `vectorPass`), LAYER 1 (`WormholeTable`, `makeSubstrate`, `nextD`, `tick`), telemetry (`traceView`), `mulberry32` (caller-side only). Header holds interpretation receipts R1–R7. |
| `tests/run_tests.mjs` | The pre-registered gate run G0–G6 (predictions written before the first run); seals `tests/receipt.json` + `tests/receipts.jsonl` (stone-v1). Requires sibling `quilt-stone`. |
| `tests/receipt.json`, `tests/receipts.jsonl` | The sealed run of record: all_pass TRUE, G4 honest FAIL + G4-P2 post-hoc PASS, chain tip `7e66ea21…` (10 links, verified). |
| `crossimpl/` | The Python re-derivation lane (34-e): `py/qthe_layer0.py` (strict LAYER 0), `py/selftest.py` (36 assertions), `py/worker.py` + `verify_chain.py`, `conformance.mjs` (needs stone), `AMBIGUITY.md` (A1–A10 chosen pre-peek), `findings.md` (F1–F3 seams), `probe_exactness.mjs`, `artifacts/` (vectors seed 0x5EED34E, results, verdict), `receipts/crossimpl_chain.jsonl`. |
| `fixedpoint/` | The no-floats lane (34-b): `qthe_fixed.mjs` (R8 kernel: S=2^32, `DEFAULT_SIGMA_Q=6807362106`), `conformance.mjs`, `probe_divergence.mjs`, `pre_registration.json` (+ amendments), `findings.md` (the P-B1 falsification autopsy), `outputs/`, `receipts/fixedpoint_chain.jsonl` (24 rows, tip `a7f7a552…`). |
| `experiments/` | E-Q1…E-Q12: pre-registrations (`pre_registration.json` + amendments 1–3 + erratums), per-experiment scripts (`e_q1_wormhole.mjs` … `e_q12_kfamily_predicate.mjs` + evals), `outputs/` (results, tips, flip registry, raw receipts). |
| `receipts/` | Per-experiment stone-v1 chains (`e_q1_chain.jsonl` … `e_q10_chain.jsonl`). |
| `situations/` | The tavern (DeepSeek guest): `situations.jsonl`, guest_rows_r6…r9, `cache_economics_r6…r9.json`, eq9–eq12 predictions/verdicts/lever registrations, `raw_r9_keyed/`, `moth_deep_trace_verdict.md`. |
| `two_reader/` | Wave 48-b installment 2: independent reader over crab-traps chains (`reader.mjs`, `run.mjs`, `selftest.mjs` 54/54, `registration.json` sealed, `run_receipts/`, `verdict.md`). |
| `demo/` | `a2ui.mjs` (the mirror driver), `sha256.mjs` (pure-JS sha256, G0), `smoke/` (browser smoke checklist + screenshots + `verify-hud-sha.mjs`). |
| `index.html` | The A2UI live mirror (zero deps, inline styles, inline favicon). |
| `scripts/reseal-registration.mjs` | Registration reseal helper (mtime-bound seals). |
| `docs/` | Wave-69 documentation layer (this package). |

## Core concepts

Named as the code names them:

1. **The primitive** (`pack`/`unpack`). Byte = `(τ << 6) | d`; bijection over
   all 256 values (G1). `PSI = [0, 1, -1, 'i']` is the operator-character
   table — `'i'` is notation, never multiplied; the imaginary channel's
   exact integer reading is real 0 / imag +1 coefficient.
2. **vectorPass (LAYER 0 item 3).** `y_j^R = Σ_{τ=1} d·x − Σ_{τ=2} d·x`,
   `y_j^I = Σ_{τ=3} d·x`; Ground (τ=0) contributes to neither even with
   d>0. Exact integers (JS: within Number's safe horizon ±2^53 input-side;
   Python: unbounded, raises on domain violations).
3. **WormholeTable (LAYER 1 item 4).** 64 slots; slot s holds
   `{x, y, resonance}`; resonance = `|real_acc| + 1` at write time. Reads
   are LIVE in row-major tick order; writes land for subsequent readers
   (same-tick possible) and are last-writer-wins; a cell never resonates
   with its own write. `DEFAULT_SIGMA = Math.log2(3)`; every twin event is
   emitted `{kind:'twin', x, y, slot, resonance, term}` with
   `term = resonance·σ`.
4. **The tick (LAYER 1 item 5).** Synchronous, double-buffered (pre-tick
   snapshot), Moore-8 toroidal; real accumulator over Attract (+d) /
   Repel (−d) neighbors; data rule `nextD` (net-positive → min(d+1, 63),
   net-negative → toward 0, zero → unchanged); τ frozen inside tick.
   Mutates in place AND returns the substrate (R6 frozen contract).
5. **Interpretation receipts R1–R7.** Every SPEC-silent choice made
   explicit: R1 toroidal edges; R2 live wormhole reads vs synchronous grid;
   R3 Abstain cells accumulate real_acc and the twin term enters through
   the pressure (sigma empirically potent); R4 LWW slots + own-write guard;
   R5 named expandos on the Uint8Array (`w, h, ticks, __wormholes, bytes`);
   R6 the frozen cross-lane contract (`seedFn(x, y, i)`, mutate-and-return);
   R7 traceView records wormhole STATE not the flag (empty table ≡ OFF).
6. **Stone-v1 receipts.** Gates, experiments, and cross-impl runs seal
   parameters + observed numbers + trace hashes into append-only chains
   (`sealChain`/`verifyChainFile` from quilt-stone). Honest FAILs stay;
   re-runs rewrite identical bytes (no wall-clock in receipts).

## How to extend

### Add a pre-registered gate (the house pattern)

1. Write the gate into `tests/run_tests.mjs`'s header comment FIRST: id,
   prediction with exact numbers, and what would falsify it.
2. Implement the check below the header using the existing `gate(id, name,
   predicted, pass, observed)` harness. Use fixtures derived from
   deterministic seeds (`mulberry32`) or hand-frozen literals.
3. Run with the stone sibling present. Your gate's row joins the chain;
   if it fails and the failure is a PREDICTION error, do NOT rewrite the
   gate — add a post-hoc gate (the G4/G4-P2 pattern) and link it
   (`postHocPass`, `postHocOf`, `isPostHocFor`).
4. Commit the receipt (receipt.json + receipts.jsonl) with the code.

### Extend the kernel without breaking the pins

Every change to `qthe.mjs` must keep: the G1 bijection, the G2 exhaustion
(2304 nextD cases, 3840 tick cells, τ frozen), the G3 determinism contract
(no `Math.random` — the static scan strips comments and counts hits), the
G5 pinned twin schedule, and the G6 paired-arm separation. Change an
interpretation receipt (R1–R7) and you must re-derive the affected
pre-registered fixtures — the header says so explicitly. Bump and re-seal
rather than silently diverge.

### Port LAYER 0 to another language

Copy the discipline of `crossimpl/`, not just the code: (1) read SPEC.md
only; (2) write every SPEC-silent choice into your own AMBIGUITY file with
your chosen reading BEFORE opening the kernel; (3) pass a self-test with
hand-computed cases pre-run; (4) freeze the battery (seed `0x5EED34E`
= 99537742 is the cross-impl precedent); (5) compare at the serialization
level (canonical JSON text byte-equality, not parsed-object equality);
(6) include negative controls, including a "lying implementation" control
(NC2: corrupt the source, prove the harness catches it). Then record your
divergences as classified findings (the F1–F3 pattern: SPEC-ambiguity,
not bugs, outside the specified surface).

### Add an experiment to the E-Q series

Write `experiments/pre_registration_*.json` (claims with probabilities +
falsifiers) before writing the evaluator; make the evaluator import the
sealed machinery of prior experiments rather than forking it (E-Q12
imports E-Q11's predicate; 0 fork drift); hard-pin every consumed artifact
by sha256; seal results + tip into `receipts/e_qN_chain.jsonl`; write the
verdict md with predictions-vs-results, Brier, and honest limits. See
`situations/eq12_verdict.md` for the current gold standard.

## Testing

```bash
node tests/run_tests.mjs               # the gate run (needs ../../quilt-stone)
python3 crossimpl/py/selftest.py       # stone-free: 36 assertions
node two_reader/selftest.mjs           # stone-free: 54/54 negative controls
node crossimpl/conformance.mjs         # needs stone
```

Green means: exit 0 with `all_pass: true` — G0 sha256 agreement, G1
bijection 256/256, G2 exhaustion 2304/2304 + 3840/3840, G3 determinism
(1000-tick trace identity + zero `Math.random` hits on comment-stripped
source), G4 by-letter FAIL with G4-P2 post-hoc PASS (counted via
`postHocPass`), G5 pinned schedule, G6 paired-arm separation. The chain
must re-verify from disk (`CHAIN BROKEN` exits 1). The sealed run of
record lives in `tests/receipt.json` even where stone is not installed.

## Conventions

- **Rules before results.** Pre-register predictions; never edit a
  registered gate; keep honest FAILs in the chain beside their post-hoc
  corrections.
- **Determinism or it didn't happen.** No wall-clock in receipts; re-runs
  rewrite identical bytes; any non-reproducible run is void.
- **Kernel purity.** No randomness, no I/O, no Math.log2 in the fixed
  kernel; `mulberry32` is caller-side. The kernel stays zero-dependency
  ESM.
- **Interpretation receipts.** Every choice SPEC.md leaves open becomes an
  R-number with rationale in the kernel header — priced, not LARPed.
- **Claims ride on chains.** stone-v1 everywhere; tips are the citations.

## Gotchas for editors

- Editing `qthe.mjs` changes its sha256, which is pinned in
  `tests/receipt.json` (`ef9a3bba…`) and in every downstream registration —
  a kernel edit is a new lineage and needs its own gate run.
- Do not "fix" G4 or delete its FAIL row; the preserved erratum is the
  honesty pattern other lanes copy.
- `traceView` excludes the Uint8Array expandos deliberately; "fixing" it
  to serialize more breaks every sealed trace hash (G3/G6 fixtures).
- The fixed-point kernel (`fixedpoint/qthe_fixed.mjs`) is a sibling, not a
  replacement: it is trace-identical on swept sigmas but deliberately
  differs on adversarial rational sigmas (P-B1 falsification) — do not
  merge the two kernels without re-pricing the whole fixedpoint run.
- `two_reader/registration.json` carries a masked-self-sha + mtime seal;
  moving files can trip the seal (S6 refuses mutated pin tables) — use
  `scripts/reseal-registration.mjs` knowingly.
- The tavern lanes in `situations/` contain raw guest payloads keyed for
  provenance; they are sealed artifacts, not prompts to re-send.

## Mandatory probe gate (wave 69-post, ORCH-5)

Every experiment verdict in this repo now requires a **probe-gate PASS row**
in `receipts/probe_gate_chain.jsonl` sequenced with (or before citing) the
verdict. Run it corpus-wide or scoped:

```bash
node scripts/probe_gate.mjs          # all chains + standing witness
node scripts/probe_gate.mjs e_q13    # one experiment's scope
```

Sections and what they protect:

| section | protects against | method |
|---------|------------------|--------|
| PG1 STONE | silent chain rot + unregistered seals | every registry chain re-verified from disk; chain-shaped files not in `chain_registry.mjs` are refused (ORCH-R10) |
| PG2 TIP-PIN | tip-file drift | `outputs/<name>_tip.txt` recomputed vs chain tip |
| PG3 NEGATIVE | a verifier that cannot say NO | tamper a COPY (flip one boolean in a mid-chain row) — `verifyChainFile` must refuse |
| PG4 DETERMINISM | environment regressions | standing 1000-tick twin probe, run twice, byte-identical |
| PG5 BOUNDS | runaway experiments | wall-clock + RSS ceilings on the standing probe (10 s / 512 MB) |
| PG6 VERDICT-RECOMPUTE (registered, not yet built) | integrity without soundness | re-derive a sealed verdict's arithmetic from its sealed trace and diff (origin: ling31f's uncontracted arena-R10 reasoning) |

The gate is fail-loud (exit 1) and appends its own sealed row per run —
`scripts/verify_all_chains.mjs` audits the full chain-of-chains including
the gate's own chain.

**Chain registration law (ORCH-R10 refinement, now enforced):** the commit
that seals a chain registers it — same commit, always — by adding one entry
to `scripts/chain_registry.mjs`, the single source of truth consumed by
verify_all_chains, probe_gate, emit_fleet_seeds, falsification_budget, and
the dashboard builder. PG1 fails on any chain-shaped file on disk that the
registry does not know: an unregistered seal can no longer pass silently.
This law was prose-only until arena round 10's verification found
chain-registry drift (defect #7: the E-Q15/E-Q16 run commits sealed chains
without registering; the auditors had drifted to 11–15 of 16 chains —
registration is addition, never subtraction).

**PG6 (registered next extension):** the gates prove INTEGRITY (hashes
re-verify, tamper refused), not SOUNDNESS (verdicts recompute from their
sealed traces). PG6 will re-derive a verdict's arithmetic from the sealed
trace hash and diff it against the sealed verdict string. Origin: ling31f's
uncontracted round-10 reasoning — the auditor that failed the output
contract supplied the gate's next arm; both facts stand in the ledger.
