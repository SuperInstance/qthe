# Marine/edge workload (ORCH-27)

Shape: N sensor nodes on a vessel/fleet, each holding a qthe plane region.
Local physics (Attract/Repel) = neighboring-node state fusion; Abstain
beacons = fleet-wide channels (d = the channel id, 64 available); the
wormhole table = the ONLY cross-region channel — matching a real constraint:
hull segmentation where radios talk rarely and locally.

Mapping (all mechanisms priced in the sealed record):
- **Channel signaling**: producer/consumer on shared d (coordination demo
  workload 2): first signal 1 tick, 13 B/write, OFF = causally isolated.
- **Rendezvous/consensus**: candidate-slot agreement (workload 1): t=61
  with adaptation; OFF = NEVER.
- **Congestion rule** (E-Q14 autopsy): separate d assignments per
  conversation if WHO matters (proximity + drift collide on shared slots —
  the convoy/saturation-rail finding); congestion is harmless for
  signal-only use.
- **Noise robustness** (E-Q14 C): ±1 injectors leave the cascade regime
  unchanged — sea-state perturbation metaphor, receipted.
- **No self-healing** (C5): damage requires an injector (a repair hook) —
  design the repair as an explicit, deterministic hook, never expect the
  substrate to grow it.

Energy story: see RESOURCE-PROFILE.md (13 B/write vs plane broadcast).
Deployment artifact: crossimpl/c (byte-exact) + esp32_demo.c.
