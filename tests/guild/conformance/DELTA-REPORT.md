# DELTA-REPORT — G2-6 battle test · kernel-forge seat

**Task.** Replay the 24-case golden corpus (`g2-corpus-v1`, generated from the
reference kernel, self-determinism-verified) against (1) the G1-1 kernel
UNCHANGED, then (2) the same kernel patched to the settled rulings
**R-live** (kills A1), **R-feedback** (kills A10/A17), **R-sigma** (kills
A4). The corpus was the only window into the reference; no implementation
file (`qthe.mjs` et al.) was fetched or read at any point.

**Artifacts.** `corpus_replay.c` (one harness, two build modes) ·
`qthe_l1_v1_1.c` (patched kernel, decision-lattice headers) · `run.sh`
(builds both under the compile law, prints both tables, re-verifies under
ASan/UBSan, checks run-to-run determinism). G1-1 `qthe_l1.c` is included
from its own directory, byte-unchanged
(sha256 `fca1a590…d5f2d547`, printed by `run.sh` on every run).

---

## 1. Before / after conformance

| kernel | total | l0 (codec+vectorpass) | substrate | verdict |
|---|---|---|---|---|
| **v1** — G1-1 `qthe_l1.c`, unchanged | **10/24** | 4/4 | 6/20 | 14 twin-active substrate FAILs |
| **v1.1** — R-live + R-feedback + R-sigma | **24/24** | 4/4 | 20/20 | full conformance, first run, zero iteration |

Verification receipts (reproduced by `./run.sh`):
- compile law `cc -std=c99 -Wall -Wextra -c` on both kernels: zero warnings;
- ASan + UBSan on both harness modes: clean, outputs identical to plain builds;
- determinism: every binary run twice, byte-identical output.

### Act 1 table — the 14 divergent cases (v1), all first diverging at **tick 1** on events

| case | evt @t1 mine→corpus | final plane (v1) | class | rulings |
|---|---|---|---|---|
| sub-twins-desert-sigma-half | 0 → 1 | DIFF 2 cells (`cc` frozen vs `e6`) | BOTH | **A1 + A17 + A4** |
| sub-twins-desert-default | 0 → 1 | DIFF 2 cells | BOTH | **A1 + A17** |
| sub-twins-noise-default | 0 → 181 | DIFF 167 cells | BOTH | **A1 + A17** (A4 in-field) |
| sub-twins-noise-sigma-025 | 0 → 181 | DIFF 80 cells | BOTH | **A1 + A17 + A4** |
| sub-twins-noise-sigma-2 | 0 → 181 | DIFF 168 cells | BOTH | **A1 + A17** (σ=2 exact in rational too) |
| sub-twins-noise-sigma-4 | 0 → 181 | DIFF 168 cells | BOTH | **A1 + A17** (σ=4 exact in rational too) |
| sub-adjacent-lww-32x32 | 0 → 2 | DIFF 3 cells | BOTH | **A1** (A3 confirmed) |
| sub-noise-8x8-t1 | 0 → 1 | **OK** | **EVENTS-ONLY** | **A1** (purest pin) |
| sub-noise-8x8-t8 | 0 → 1 | DIFF 7 cells | BOTH | **A1 + A17** |
| sub-noise-13x7-t40 | 0 → 4 | DIFF 13 cells | BOTH | **A1 + A17** |
| sub-noise-32x32-t40 | 0 → 204 | DIFF 180 cells | BOTH | **A1 + A17** |
| sub-mixed-64x64-t50 | 0 → 949 | DIFF 682 cells | BOTH | **A1 + A17** |
| sub-flood-abstain-16x16 | 0 → 192 | DIFF 251 cells | BOTH | **A1 + A17** (A5 confirmed) |
| sub-quarter-abstain-32x32 | 0 → 219 | DIFF 150 cells | BOTH | **A1 + A17** |

The 6 substrate passes in Act 1 are exactly the non-twin cases:
`sub-twins-noise-off` (OFF arm — see §3), `sub-checkers-16x16`,
`sub-ring-erode-16x16`, `sub-all-ground-8x8` (no Abstain cells → the
wormhole protocol is never entered), `sub-degenerate-2x2`,
`sub-degenerate-1x4` (A14 wrap regime; the single Abstain cell can never
self-twin — A2/A9 confirmed). All 13 adjudicated-matching ambiguity
decisions (A2, A3, A5–A9, A11–A14, A16) survived corpus contact without
a single edit.

**Plane-vs-events ordering.** Every FAIL is events-first at tick 1 (the
corpus exposes per-tick events but only the FINAL plane, so "which came
first" is observable only as: events diverge at t1, final plane also
differs — except `sub-noise-8x8-t1`, where the plane never diverges).

---

## 2. Case → ruling map (one-line mechanisms)

- **A1 (snapshot vs live reads)** — *the tick-1 signature*. The table
  starts empty, so snapshot semantics give **0 events at tick 1 always**;
  live reads give `#Abstain − #distinct(pre-d)` (first same-d scanner
  writes the slot, every later same-d scanner hits it). All 20 substrate
  cases satisfy this closed form exactly (181=243−62, 204=268−64,
  949=1013−64, 192=256−64, 219=282−63, 2=3−1, 1=2−1, 4=21−17, 1=14−13).
  This alone accounts for every events column above. **A1 also fully
  explains `sub-noise-8x8-t1`**: its single hit (cell (6,3), d=59, Moore
  acc=−36) had |acc| dominate the twin term (−36+1·1.585 < 0), so both
  models moved d the same way — events diverge, plane doesn't. The purest
  A1-only failure in the corpus.
- **A17/R-feedback (twin term moves d)** — *the plane signature*. In the
  desert cases acc ≡ 0, so d can only advance through the twin term:
  corpus final bytes `e6`/`e7` (d=38/39 from 12) are unreachable without
  feedback (v1 freezes at `cc`). In mixed fields the feedback flips the
  d-sign of any Abstain cell where |acc| < resonance·σ — hence the
  80–682-cell plane diffs. The ON/OFF pair (`sub-twins-noise-off` vs
  `-default`, identical CELLS0, different final planes) is the corpus's
  direct proof that the term is causal, not telemetry.
- **A4/R-sigma (float64, sign survives)** — *the σ-edge*. At σ=0.5 with
  resonance=1 (desert-sigma-half), v1's truncating rational σ yields
  term=0 → pressure 0 → d frozen: the chase stalls even if you patch in
  feedback. The float plane (term=+0.5 → d+1) runs it. σ=2/σ=4 are
  exactly representable as rationals, so those arms' v1 failures are
  pure A1+A17 (their corpus planes still differ pairwise from each other
  because σ's magnitude decides sign when acc<0 — visible only once
  feedback exists). σ=0.25 bites at acc=0, resonance≤3; DEFAULT σ bites
  at acc=−1, resonance=1 (rational −1+1=0 "unchanged" vs float
  −1+1.585>0 "up") — present in the noise fields, though A1+A17 already
  explain those cases' v1 failures.

---

## 3. What the chase pattern taught me about live-read semantics

Hand-solving three corpus cases (`desert-*`, `adjacent-lww`) BEFORE
writing v1.1 pinned the entire mechanism; the implementation then passed
24/24 on its first run. The lessons:

1. **Live reads = read-then-write per cell, in row-major scan order, on
   one shared table.** Not "reads live, writes staged", not "write then
   read" (that would make every Abstain cell read its own fresh entry and
   kill all events). The desert chase period — EVTCNT `1,1,2` repeating —
   decomposes as: split slots → only the stale-entry reader fires (1);
   re-merge → the earlier scanner hits the later's stale entry, then the
   later scanner hits the earlier's SAME-TICK write (2).
2. **LWW + pre-tick-d writes create a baton.** When twins share d, the
   last same-d writer owns the slot; each tick the other cell reads that
   stale ownership and fires. The write keying by PRE-tick d (A9) is
   load-bearing: post-d keying breaks the period (hand-checked — the
   chase collapses to all-1s). The adjacent case (3 cells, one slot,
   `2,2,2,3` period) is the same baton with three runners.
3. **Tick-1 is the A1 fingerprint** (§2) — with an initially-empty table,
   tick-1 events are a closed-form function of CELLS0 alone. It detected
   the divergence in every twin-active case; nothing else needed ticks
   >1 to distinguish snapshot from live.
4. **Counts heal; bytes don't.** After tick 1, v1's per-tick event counts
   drift close to the corpus (e.g. `234,242,240…` vs `181,241,242…`;
   flood: v1 settles at a frozen 192/tick while the corpus saturates
   192→252→256) while the planes keep diverging. Event-count-only
   conformance would under-detect exactly the regime the corpus cares
   about — the dual check (final bytes + per-tick counts) is
   load-bearing, not belt-and-suspenders.
5. **Only the sign of pressure survives.** All five σ arms run the
   identical desert chase (term>0 vs acc=0); they differ only in mixed
   fields where |acc| < res·σ. R-sigma's "compare sign" is the whole
   causal story — the float never needs to be exact, only correctly
   rounded through one multiply and one add.
6. **The OFF arm pass in Act 1 is itself evidence.** v1 has no wormhole
   switch, yet `sub-twins-noise-off` passes: v1's table ops are
   plane-inert precisely BECAUSE it lacks feedback. The paired arm
   passing/failing on the same CELLS0 is the A17 divergence seen from the
   other side. (The harness emulates the missing switch by counting 0
   events for WORMHOLES 0 — documented in `corpus_replay.c`; v1.1 has a
   real switch, `qthe_set_wormholes`.)

**Post-patch predictions vs actual:** matched. Before implementing, I
predicted from the corpus alone: desert chase `1,1,2`×13+1 with final
d=38/39 (`e6`/`e7`), adjacent `2,2,2,3`×5 with all three cells at d=35
(`e3`), and tick-1 counts `#Abstain−#distinct-d` for all 20 cases. All
confirmed; v1.1 compiled once and passed 24/24 with no parameter fitting.

---

## 4. Honest notes — what remains uncertain or unpinned

- **`qthe_trace_hash` (A15) is unpinned.** The corpus carries no hash
  lines, so my FNV-1a-64 serialization (v1.0 invention) is unverified
  against the reference's stone-v1 chain. v1.1 delta: σ is hashed as the
  8 big-endian bytes of its IEEE-754 pattern (the rational fields are
  gone). Still my choice, still flagged.
- **The imaginary channel (A10) is unobservable.** The corpus checks
  plane bytes and event counts only. v1.1 keeps a per-tick-reset
  `double` record of the twin term as telemetry; whether the reference
  retains any channel concept is unknowable from the oracle (causally
  irrelevant once R-feedback routes the term through pressure).
- **Event-counter semantics**: per-tick counts are consistent with a
  per-tick reset; an accumulate-and-differ reference would produce the
  same corpus. Unresolvable from EVTCNT alone; my counter is
  instrumentation (observes the read predicate, causes nothing).
- **Negative σ** never appears in the corpus; the sign-compare code is
  total but that regime is untested territory.
- **DEFAULT σ**: v1.1 hardcodes the corpus decimal `1.584962500721156`
  per R-sigma and never calls `log2(3)`. I did not (and need not) verify
  it equals `Math.log2(3)`'s double — the corpus decimal is the normative
  serialization.
- **Platform dependence**: R-sigma assumes plain IEEE-754 doubles — one
  multiply, one add, each correctly rounded (x86-64 SSE2, no
  `-ffast-math`, no FMA contraction). x87 32-bit builds or aggressive FP
  flags could round differently and break byte-conformance. Worth a
  float-serialization canary in the P2 corpus plan (flagged to
  standards-warden as a SPEC v1.0 fold item).
- **Act-1 harness emulations** (both provably inert, documented in
  `corpus_replay.c`): the rational-σ approximation at 1e-8 for v1 (σ
  reaches only v1's telemetry channel — never plane, never the event
  predicate), and the WORMHOLES-0 event suppression (v1 cannot disable
  the table, but with no feedback its table ops cannot move the plane).

---

## 5. Reproduce

```
cd seats/kernel-forge/work/G2-6
./run.sh            # builds everything, prints both conformance tables,
                    # re-verifies ASan/UBSan + run-to-run determinism,
                    # prints kernel sha256 receipts
```

Expected: v1 table 10/24 (14 twin-active FAILs, all events-first at
tick 1), v1.1 table 24/24, sanitizers clean, determinism PASS.
