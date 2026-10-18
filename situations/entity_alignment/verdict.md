# T4-c VERDICT — entity alignment for registry/chain reconciliation (cookbook §5.3)

> ORCH-R13 lane T4-c. Frozen spec: registration
> `docs/discussions/2026-10-18-orch-r13-registration.md` :: Lane T4-c.
> Every number below is re-derivable from the sealed rows
> (`rows_part1.jsonl`, `rows_part2.jsonl`, 74 calls incl. canary, all
> jev-1.13.0, responses verbatim, parse_method declared) plus
> `inventories_reconstructed.json` / `pairs_part1.json` / `pairs_part2.json`
> (built pre-run, git-derived). Decision rule (frozen): rounded score level;
> level 1 (`related_needs_curator`) → curator queue.

## Headline numbers

| metric | part 1 (registry replay) | part 2 (cross-seat findings) |
|---|---|---|
| pairs | 43 (29 same / 14 different) | 30 (10 same / 20 different) |
| **match rate** | **42/43 = 97.7%** | **25/30 = 83.3%** |
| wrong merges (level 2 on different) | **0** | **3** |
| wrong splits (level 0 on same) | 0 | 0 |
| curator queue (level 1) | 1 (p1-021) | 2 (p2-D01, p2-D05) |

Curator queue total: **3**. Spend: **$0.002266** of the $0.03 ceiling
(74 calls: 43 + 30 + 1 canary; 53,942 input / 3,743 output tokens; mean
latency 222 ms; zero HTTP errors; resume re-run produced 73 skips, zero
duplicates).

## FALSIFIER, clause by clause (frozen, verbatim application)

1. **"match the human reconciliation on < 80% of pairs (part 1) → not
   earned"** — did NOT fire: 97.7% ≥ 80%.
2. **"if the ABV-rule (numbers in code) catches what the Score misses →
   keep it code-only"** — FIRED (see ABV-vs-Score below): the one pair the
   Score declined to decide (p1-021, score 0.94 → curator) is decided
   instantly and correctly by the code-side field comparison (path
   inequality: `tests/receipts.jsonl` vs `receipts/probe_gate_chain.jsonl`;
   the `path_match` noul agreed at 0.11). The Score added no decision that
   code did not already make on part 1.
3. **Part-2 specific: "if the battery merges (=same) ANY known-different
   pair … one wrong merge FAILS the pattern for cross-examination use even
   if the 80% headline holds"** — FIRED, ×3: p2-D02, p2-D03, p2-D06 (the
   83.3% headline is above 80% and is reported, but the wrong-merge clause
   governs).

## VERDICT: **NOT-YET — keep it code-only** for both registered applications

- **Part 1 (inventory/registry reconciliation): the frozen 80% bar passed,
  but the pattern earns nothing code does not already do.** A mechanical
  path-string-equality rule over the same verbatim entries scores
  **43/43 = 100%** (baseline computed in `metrics.json`), the Score scored
  97.7%, and the single deflection is exactly the case code decides. The
  human reconciliation is path-keyed; the battery is a slightly worse, $0.0012
  re-derivation of a comparison that belongs in code. The pattern's *claimed*
  advantage — aligning entries whose keys don't line up — never got exercised
  in part 1 because every list, even the glob-scanner, states an
  unambiguous file identity.
- **Part 2 (cross-seat finding alignment, the live tavern application):
  FAILED on the expensive-mistake direction.** 3/10 known-different pairs
  merged as `same_entity`, one of them at confidence 0.94. Per the frozen
  falsifier this kills the pattern for cross-examination use. The headline
  83.3% (25/30) is reported for the record: 10/10 known-same correctly merged,
  10/10 seeded-random correctly split, 5/10 known-different correct, 2/10
  known-different deferred to the curator (the safe direction), 3/10
  wrongly merged.

## The three wrong merges (all on same-experiment cluster boundaries)

| pair | subjects (ground truth) | score | conf | path/label nouls |
|---|---|---|---|---|
| p2-D02 | mimov F5 `eq16_erratum` vs muse F3 `eq16_seedfn` | 1.96 | **0.94** | 0.95 / 0.85 |
| p2-D03 | dsv F3 `seedfn_closure` vs nemotron F1 `eq16_seedfn` | 1.81 | 0.73 | 0.93 / 0.84 |
| p2-D06 | dsv F1 `c1_claim` vs hy4 F3 `c1_budget` | 1.62 | 0.41 | 0.96 / 0.72 |

All three sit on subject boundaries that the pre-run ground-truth receipts
(`pairs_part2.json` :: `subject_map_receipts`) explicitly flagged as
fine-grained judgment calls: the E-Q16 three-way split (erratum-linkage gap
[verdict #4] / contamination-sweep closure [#5] / the seedFn event itself)
and the C1 split (footprint-vs-capability scoring vs tau-plane byte budget
[verdict #6 names only the latter]). The falsifier is applied as frozen —
ground truth was sealed before any call — but the honest reading is: **the
battery collapses "same experiment, related findings" into "same issue"
exactly where the human record is finest-grained.** Two compounding facts:

- The per-field nouls did not dissent anywhere: across all 73 pairs, the
  `path_match`/`label_match` booleans agreed with the Score's side **146/146**
  times. A bad-true noul max-gate (the §4.1 cascade trick) would have caught
  NONE of the three wrong merges.
- A confidence gate (< 0.5 → curator) would have caught only p2-D06 (0.41);
  p2-D02 is a 0.94-confidence wrong merge. No cheap patch catches all three —
  this prices **not-yet**, not one-tweak-from-earned.

The middle level did work twice on the sharp pairs: p2-D01 (qwen's invented
cache-eviction mechanism vs mimov's verified E-Q14 floor failure — the
round's priced hallucination pair) landed exactly at score 1.00 → curator,
and p2-D05 (C3 gifted-proof vs C3 formation-scope) at 0.68 → curator. Both
were known-different; deflection is the safe direction, and the battery's
best moments. It is the *clusters* that kill it.

## ABV-vs-Score (code-side number comparison vs the model's decision)

- **ABV caught nothing the Score got wrong** — the Score was wrong on zero
  part-1 pairs and ABV had nothing to rescue.
- **Where the numbers differ, the Score was right and a numbers-rule would
  be wrong**: the only same-entity pairs whose row counts differ do so
  because the fix commit *itself* appended rows — e_q16 (scanner 18 rows at
  `74bc4b5^` vs registry 19 at `74bc4b5`, the erratum) and probe_gate (4 vs
  6, the gate re-seal). The Score merged both correctly (1.97 / 1.99); any
  "rows differ → different entity" heuristic would have split them. Row
  counts are evidence, never identity — the ABV rule as written (compare in
  code, decide elsewhere) is the correct division of labor and this
  experiment sealed a live demonstration of WHY.
- **Where the Score declined, code decided**: p1-021 (above). Mechanical
  baselines on part 1: path-equality 43/43 decided (100%); rows-equality
  11/11 where both lists stated rows (32/43 abstain — probe_gate's gate list
  and the registry state no row counts at all; the honest-null structure of
  the drift itself).

## Row-count receipts (what each pre-fix list actually counted)

Reconstructed byte-honestly at `74bc4b5^` (parent = 92f7c68, read-only
`git show` / `git ls-tree`; full provenance in
`inventories_reconstructed.json`):

| list | chains | rows (at `74bc4b5^`) | missed vs registry |
|---|---|---|---|
| A `verify_all_chains.mjs` | 11 (+2 tips) | 213 | e_q13, e_q14, e_q15, e_q16, probe_gate |
| B `probe_gate.mjs` | 13 (+2 tips) | (states none) | e_q15, e_q16, its own chain |
| C `emit_fleet_seeds.mjs` | 14 | 312 | e_q15, e_q16, e_q11/e_q12 tips |
| D `falsification_budget.mjs` (glob) | 15 | 374 | gates (`tests/receipts.jsonl`), tips |
| R `chain_registry.mjs` @ 74bc4b5 | 16 (+2 tips) | 387 at fix (384 at parent) | — |

The registration's ORCH-C-era numbers (fleet-seeds 14/305, scanner 13/295 —
worklog lines 354–355) are TRUE snapshots of the ORCH-C moment, receipted as
such; at the pre-fix commit the same tools count 14/312 and 15/374.
`PHASES-REPORT` at the parent commit claimed "14 chains, 400+ rows" against
a disk truth of 16 chains / 384 rows (387 at fix).

## Supersessions, caveats, honest nulls

- The registration's part-1 design named three inventories (fleet-seeds /
  scanner-glob / registry); the lane brief superseded it with FOUR pre-fix
  lists at `74bc4b5^` — followed; the 305/295 numbers live in the ORCH-C
  worklog, not in the pre-fix scripts themselves (they are runtime counts;
  receipted above at both moments).
- All 10 seeded-random part-2 pairs landed different-subject (seed =
  sha256 of the sorted 20 explicit pair-ids = `dce3a9ff…`, 662-candidate
  universe, zero undecidable exclusions). Plausible, not designed: 44 of
  662 candidates are same-subject. Receipted in `pairs_part2.json`.
- Ground-truth judgment calls were receipted BEFORE any call (subject map
  with per-subject receipts). All three wrong merges sit on flagged
  boundaries — the falsifier was applied as frozen regardless.
- Honest null: 32/43 part-1 pairs abstain on the rows-equality baseline
  (two of the five lists state no row counts) — the drift's own information
  poverty, sealed as found.
- Output tokens priced $0 per the lane brief; if output were priced at
  input rates the lane would still be ~$0.0023 ÷ ceiling $0.03.

## What would re-register this pattern (for a future round)

A cross-examination battery needs a *subject key* the way the registry
reconciliation had a path key: e.g. findings tagged with the artifact +
claim they contest BEFORE pairing (code-side), the Score then only judging
same-subject vs same-issue — i.e., move one more field from the model to
code, per the §0 law. The three-level shape itself is sound (2 correct
curator deflections, zero wrong splits anywhere in 73 pairs); the failure
is asking it to invent the subject key on the fly.
