# QTHE-AS-CELL — the Quilt interface contract (ORCH-48)

> How a live Quilt sheet consumes or emits QTHE vectors with zero
> translation loss. Design doc + contract; the priced prototype is the
> follow-up (see FRONTIER-DECISION.md). Companion to docs/HULL-DOCTRINE.md.

## The contract

A Quilt cell that wants QTHE semantics holds exactly one byte of QTHE state
plus optional table access:

```ts
interface QtheCell {
  byte: uint8;                        // [τ:2][d:6] — the whole state
  tick(wormholes?: QtheTableAccess): void;  // the kernel's rule, verbatim
  channels(): { re: int, im: int };  // split-channel readout (vectorPass)
}

interface QtheTableAccess {           // the 64-slot looking glass
  read(slot: 0..63): { x, y, resonance } | null;   // live read
  write(slot: 0..63, x, y, resonance): void;       // LWW
}
```

## The four laws of embedding (each prices a loss mode)

1. **One byte, no shadow state.** If the cell keeps a parallel copy of τ or
   d "for convenience," the two will diverge under injectors and the hull is
   lost. The byte IS the state (A5 attack, determinism_attacks.mjs).
2. **The table is shared, not owned.** Cells join a substrate-level table;
   they never mint private tables mid-run (A4: shared tables are
   deterministic ONLY under a fixed call order — the sheet's tick order is
   the contract). Cross-sheet wormholes are a new claim, not a default.
3. **τ changes are injector events, never tick behavior.** Quilt hooks may
   rewrite the byte between ticks (that is the injector semantics C5′
   priced: restore-then-re-erode, deterministic); nothing inside tick()
   mutates τ. A hook that changes τ must expect the hull doctrine's
   re-verification (plane hash before/after).
4. **Translation loss is zero by construction.** In: a QTHE vector is a
   row of bytes — `vectorPass(weights, xs)` gives `{re, im}` per output in
   exact integers; no float normalization, no padding. Out: the cell emits
   its byte; the consumer hashes it. If any layer needs to "convert," it is
   not QTHE anymore — it is a fork and must re-price conformance (the C
   port's battery is the template: 19 cases, term-bit equality).

## What the sheet gets for the one byte

- Non-local signaling with no message bus (C2: the only causal path across
  Ground), at 13 B/table-write wire cost (the coordination demo).
- 47% fewer bytes to task than a two-byte ported encoding (C1, E-Q13).
- Deterministic replay: any sealed traceView (plane + table) rebuilds and
  re-ticks byte-identically (hull doctrine; A2 attack).
- Honest boundaries already priced: no provenance under congestion (E-Q14
  — separate d assignments if WHO matters), no self-repair (C5 — hooks are
  the repair mechanism), σ is a sign-only knob on Ground-separated pairs
  (C3/E-Q2).

## Why not a full cell type now

The wave-66 decomposition (substrate family, 22 parts) and jev-garden's
wave-50-b integration already exercise the byte-plane contract end-to-end.
Promoting QTHE-AS-CELL to a typed Quilt primitive adds a translation layer
whose only job would be enforcing laws 1–4 — worth it exactly when a second
live consumer appears. That trigger, not preference, opens the build.
