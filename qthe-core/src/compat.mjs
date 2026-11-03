// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────────
// @qthe/core/compat: the reference-kernel surface (kernel/qthe.mjs @ main),
// frozen 1:1 and deprecated. Re-exporting the kernel FILE (not reimplementing
// it) is the whole trick — a mirror by construction cannot drift, and the
// frozen cross-lane contract (R6: research scripts and the field lane's
// bytePlane() reading sub.bytes) keeps byte-identical behavior, defects
// included. Only new code gets the strict @qthe/core surface.
//
// ── RECEIPTS ──────────────────────────────────────────────────────────────────
//   api-surface-v0.1.d.ts "@qthe/core/compat" — the contract (typed honestly,
//     Flag 3: every expando optional because every expando evaporates on a
//     structuredClone boundary — re-probed G2-7).
//   ADJUDICATIONS-G1.md flag 3 — compat synthesizes the expando contract
//     instead of delegating, so frozen external readers keep working.
//   CRITIQUE.md C1/C2/F1/F3/F4 (receipts V1–V8) — the defect inventory
//     preserved below, deliberately.
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────────────
//   kernel/qthe.mjs — THE implementation; this file adds only JSDoc and the
//     LegacyWormholeTable alias; a behavior difference between the two is
//     this file's bug, and gate C-COMPAT asserts export identity
//   src/index.mjs — deliberately does NOT re-export compat: it is opt-in by
//     path, never the default import (the .d.ts root law)
//   src/engine.mjs — the strict surface; behavioral equality with this
//     module is gate C-DIFF (per-tick opts and expando state differ by
//     design; the PHYSICS must not)
//   tests/run_tests.mjs G0–G6 — the kernel gates this mirror inherits for free
//
// DEFECTS PRESERVED DELIBERATELY (each with its CRITIQUE.md receipt —
// do not "fix" these here; fixing them is what @qthe/core is for):
//   - every expando (w, h, ticks, __wormholes, __scratch, bytes, lastEvents)
//     EVAPORATES on structuredClone()/postMessage (C1/V1; re-probed G2-07:
//     `bytes` is dropped too).
//   - JSON.stringify(substrate) throws (circular via the `bytes`
//     self-pointer) (C1/V2).
//   - pack masks (pack(7,100) === pack(3,36)); psi masks (tau & 3);
//     makeSubstrate masks seedFn output (& 0xff) (C2/V4).
//   - mulberry32 truncates seeds via `>>> 0`: 2**32+5 ≡ 5, -1 ≡ 2**32-1,
//     5.7 ≡ 5 — all silent (C2/V3; the checked version lives in the engine).
//   - WormholeTable.write coerces x/y/resonance through Int32Array:
//     NaN → 0 retargets a twin to the origin; a NaN resonance becomes 0,
//     which the read guard then rejects — a twin that should fire silently
//     never exists (C2/V6).
//   - tick(sub, {sigma:X}) on a substrate with no table yet creates the
//     table with constructor σ = X and PERSISTS it; later option-less ticks
//     run at σ = X while the doc comment promises "for this tick" (F1/V5).
//   - lastEvents is a single overwritten slot — events over time are
//     silently wrong, not absent (F3).
//   - seedFn's doc comment in the kernel says (i, x, y); the code calls
//     (x, y, i) (F4/V8). This typing follows the code, which follows R6.
//
// Migration map (every export below is @deprecated):
//   makeSubstrate(w,h,fn)  → Substrate.create({w, h, seed: {kind:"legacyFn", fn}})
//   tick(sub, opts)        → sub.tick()                    (no opts; I6)
//   σ changes              → inject({op:"setOptions", sigma})
//   traceView(sub)         → sub.trace()
//   pack/unpack/psi/etc.   → @qthe/core/codec              (checked; throws)
//   mulberry32             → @qthe/core/engine mulberry32  (checked; throws)
//   WormholeTable          → sub.wormholes                 (owned, σ-free)

// The kernel, 1:1. No wrappers, no shims — the aliasing below is identity.
export {
  TAU,
  D_MAX,
  PSI,
  psi,
  pack,
  unpack,
  tauOf,
  dOf,
  vectorPass,
  SLOT_COUNT,
  DEFAULT_SIGMA,
  makeSubstrate,
  tick,
  traceView,
  nextD,
  mulberry32,
  WormholeTable,
  WormholeTable as LegacyWormholeTable,
} from '../kernel/qthe.mjs';

/**
 * The kernel's event shape — kind, position, slot, resonance, term.
 * NOTE: the kernel's events carry NO `tick` field (v0 typed them as the
 * engine's TwinEvent, which requires one — dishonest typing, fixed v0.1).
 * Core's TwinEvent is this shape plus a 1-based `tick`.
 * @typedef {{ kind: "twin"; x: number; y: number; slot: number; resonance: number; term: number }} LegacyTwinEvent
 */

/**
 * Legacy expando-carrying substrate: a Uint8Array with state hung on as
 * named properties. Every field below is OPTIONAL — present after
 * makeSubstrate(), UNDEFINED after any structuredClone()/postMessage
 * boundary (the clone keeps the bytes and drops ALL expandos). Reading
 * `sub.w` off a substrate you did not build yourself means handling
 * `number | undefined`; that is not noise, that is the type system telling
 * you the truth about this API.
 * @typedef {Uint8Array & {
 *   w?: number; h?: number; ticks?: number;
 *   __wormholes?: LegacyWormholeTable;
 *   __scratch?: Uint8Array;
 *   bytes?: Uint8Array;
 *   lastEvents?: ReadonlyArray<LegacyTwinEvent>;
 * }} LegacySubstrate
 */

/** TraceRecord is re-exported for type-only migration of trace consumers. */
// (types ride the package's .d.ts; nothing to do at runtime)
export {};
