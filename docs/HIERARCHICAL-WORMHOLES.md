# Hierarchical wormholes (ORCH-42 — design, priced as the NEXT claim)

The sealed 64-slot table is flat: one namespace, content-addressed, LWW. A
hierarchical table adds ONE level: 8 regional tables of 8 slots each, plus a
global table of 8 region-buckets. A cell's address = (region, slot): writes
go local-first; a reader misses locally then escalates.

**What it buys (hypotheses to price, not promises):**
- H1: provenance survives regional congestion (E-Q14's boundary: flat tables
  lose WHO under drift; region tags restore it at fixed call order).
- H2: escalation latency is bounded (miss-then-escalate = +1 tick worst
  case on the S3 live-read schedule).
- H3: contention drops ~linearly with region count at fixed population.

**What it costs:** the compile-time blueprint grows (8×8+8 entries), the
write path branches, and byte-identical cross-level schedules must be pinned
(a new R-receipt). Determinism is preserved ONLY under a fixed region
iteration order — the A4 attack is the precedent.

**Registration skeleton (when triggered):** paired arms flat vs hierarchical
on the E-Q14 pollution task (provenance fraction), the E-Q1 delivery task
(latency), and the E-Q16 grid-scaling task (contention). Floors frozen
before any run; honest nulls expected on H2 (latency may be flat-inert like
sigma). NOT BUILT NOW — the roadmap's own law: close current claims before
opening the frontier. The build trigger is a second live consumer needing
provenance under load.

---

## VERDICT (ORCH-R18, E-Q18 — 2026-10-18): the 8×8+8 design is DEAD on H1

Priced on the axis E-Q17's verdict redirected to (POPULATION at fixed grid),
against the flat kernel with F-CAL bit-exact reproduction of the sealed
record. **H1 DIES with prejudice, in the opposite direction**: hier provFrac
is WORSE than flat at every population level (clean 0.0066 vs 0.0725 — 11×
worse; zero improving levels, two breaching the no-regression bound). The
mechanism: this spec's own sketch folds cargo into 3 regional bits
(s = d&7), so a regional slot serves eight cargo classes where a flat slot
is cargo-exact — and under d-drift every writer sweeps the entire
compressed space. The hierarchy traded cross-region anonymity for
cross-cargo aliasing, 8× denser, and the drift convoy flooded it.

What survived: **H2 LIVES** (escalation is free — 8/8 delivery, first-
delivery 7 == 7 at every level; the delivery channel is addressing-robust),
and **H3a LIVES without drift** (parking-lot contention ratio exactly 1/8 —
the addressing gain is real when cargo is frozen; under drift it collapses
to 0.875, the fold cancelling the split).

**The untested survivor**: region-splitting WITHOUT folding — 8 regions ×
64 cargo-exact slots + 8 buckets = a 520-slot blueprint (8.1× the flat
table). If a second live consumer ever needs WHO under load, start there,
and expect the drift convoy to erode it too (flat clean provFrac is itself
only 0.07 — the ceiling is low for everyone).

Receipts: `experiments/outputs/e_q18_verdict.md` (the full autopsy) ·
`receipts/e_q18_chain.jsonl` tip `fe059a2e…` (254 links) ·
`docs/CLAIM-VERDICTS.md` §C9 · `docs/BOUNDARY-MAP.md` hierarchical row.
