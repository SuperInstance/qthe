# Resource profile (ORCH-16/35 — local proxy, honestly receipted)

Measured on the orchestration machine (x86_64, Node 24, cc -O2). NO physical
ESP32/Jetson exists in this environment — hardware numbers are PENDING; the
methodology below is what to run on-device.

## Measured here (local proxy)

- Kernel tick cost: 64×64 plane, 400 ticks ≈ 19.6 ms → **~0.75 µs per
  cell-tick** (float) / parity for fixed (0.975×, COST-OF-EXACTNESS).
- Memory: state = W·H bytes + 732 B table + scratch W·H. 64×64 = 8.9 KB
  total working set. Node RSS ceiling in probe gate PG5: 65 MB (the process,
  not the substrate; the substrate is 8.9 KB).
- Traffic (semantic, E-Q13 model): 10 B/cell-tick float plane; standing
  footprint 1 B/cell (vs 2 B/cell ported — the C1 result).
- Long-horizon: T=100,000 on 16×16 ran in seconds; event rate constant
  after warm-up (E-Q16 A2) — no drift, no leaks by construction (no
  allocation inside tick; scratch is reused).

## On-device method (run these, seal the numbers)

1. qthe-core/c on ESP32: tick a 32×32 plane 10,000 ticks; measure
   cycles/tick (esp_timer), heap before/after (must be flat), flash size of
   the object.
2. The wire-cost table from demos/agent-coordination.mjs is the energy
   story: 13 B/table-write vs full-plane broadcast.
3. Determinism witness on-device: PG4's 1000-tick probe, hash vs the
   reference — byte-identical or the port is defective (the C conformance
   battery already proves the semantics; this proves the toolchain).
