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
