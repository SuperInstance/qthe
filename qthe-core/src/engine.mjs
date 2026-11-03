// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────────
// @qthe/core/engine: the substrate handle, the ten-op journaled op-log, the
// owned wormhole table, the tick, and the determinism tooling (canonical
// digest, trace validation, replay). Everything the reference kernel did with
// expandos and call-site options is done here with journaled state, so that
// replay = determinism, period (OLOG-SPEC house law). A file, not a set of
// functions, because the invariants bind the parts TOGETHER: the journal is
// the only write path (I1), every boundary-crossing artifact is plain data
// (I2), everything is validated (I3), tick() returns events not the substrate
// (I4), no hidden randomness (I5), every dynamics parameter is journaled
// (I6) — break one part in isolation and the others keep the lie invisible.
//
// ── RECEIPTS ──────────────────────────────────────────────────────────────────
//   api-surface-v0.1.d.ts "@qthe/core/engine" — the contract this implements;
//     where the two disagree, the SPEC wins and this file is a bug.
//   OLOG-SPEC.md — NORMATIVE: op catalog (§3), ordering (§4), seed capture
//     (§5), replay algorithm (§6), hash recipe + canary (§7), upgrade
//     honesty (§8). §4 rule 5 (per-tick opts auto-journaling) is RETRACTED
//     as of v0.1 — see the changelog in the .d.ts header.
//   qthe.mjs (kernel of record, 265 lines) — tick physics receipts R1–R4;
//     this engine replicates them byte-exact (gate C-DIFF proves it per
//     commit) with sticky options instead of call-site options.
//   CRITIQUE.md F1 (receipt V5) — the σ-leak-into-permanence bug that
//     invariant I6 exists to make inexpressible.
//   ADJUDICATIONS-G1.md — Flag 1 (stamps split), Flag 2 (seed = ops at 0),
//     RC-05 (determinism receipt split, binding wording below).
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────────────
//   src/codec.mjs — pack/TAU/D_MAX semantics for op application
//   src/errors.mjs — OpError/ReplayError/SnapshotError/DimensionError codes
//   src/canonical.mjs — canonicalJson: the §7.1 serializer the digest seals
//     through; a one-byte disagreement there is a disagreement about every
//     trace in existence
//   src/sha256.mjs — sha256Hex: opsHash + the stateHash seal
//   src/compat.mjs — the frozen kernel mirror; engine-vs-kernel behavioral
//     equality is gate C-DIFF in tests/core/run_core_tests.mjs, never assumed
//   c/qthe_core.c · py/qthe_layer0.py — cross-implementation twins; the
//     g2-corpus + canary vector (§7.3) are the shared judges
//   OLOG-SPEC §7.3 — the canary this engine must reproduce EXACTLY:
//     qth1:69d81dfc5d4b9f5b708e7524dfb0a632f1fd881d342bf85eec90bfdda95efb3a

import { DimensionError, OpError, ReplayError, SnapshotError, PrngSeedError } from './errors.mjs';
import { D_MAX, pack } from './codec.mjs';
import { sha256Hex } from './sha256.mjs';
import { canonicalJson } from './canonical.mjs';

// ── Version stamps (Flag 1 — read this before touching any of them) ──────────
//
// THE RULE: npm semver governs API SHAPE (what compiles against the package);
// digest stamps govern TRACE IDENTITY (which traces hash-match this kernel).
// They are independent tracks that meet only in release notes. Because stamps
// live INSIDE the digest (OLOG-SPEC §7.2), any stamp change re-hashes every
// trace in existence — loudly, by design (§8). Using package semver as a
// stamp would re-hash the world on every patch release: that conflation is
// precisely what Flag 1 kills.

/**
 * npm semver of the @qthe/core package (from package.json). Governs API shape
 * ONLY. Appears in NO artifact, NO digest, NO snapshot — by law.
 * [2026-11-03][library-craft] decision: hardcoded here, not imported from
 * package.json, because JSON import attributes are not portable across the
 * runtimes this package targets (Node < 20.10, some bundlers); gate C-STAMP
 * asserts the sync against package.json every run; revisit when import
 * attributes are universally available.
 */
export const PACKAGE_VERSION = '0.2.0';

/**
 * Kernel BEHAVIOR stamp — what a trace MEANS on this build, not how the
 * package is numbered. Bumps only under the two-class rule (OLOG-SPEC §8):
 * trace-compatible (stamp may stay; canary corpus all green) or
 * bump-and-rehash (every historical hash stops matching, corpus regenerates,
 * migration note ships). Feeds the digest key "kernel".
 */
export const KERNEL_SCHEMA_VERSION = '0.1.0';

/**
 * SPEC.md revision the kernel implements. A digest stamp (same two-class
 * rule), NOT the spec document's own editorial version unless the SPEC
 * revision changes observable trace/event behavior.
 */
export const SPEC_VERSION = '1.0.0';

/** Op-log format major ("1"). Additive optional fields bump minor-only. */
export const OLOG_VERSION = '1';

/** Snapshot format version. */
export const SNAPSHOT_VERSION = '1';

/** Trace/hash format version; also the hash string prefix. */
export const HASH_VERSION = 'qth1';

/** Canonical name of the digest primitive. */
export const HASH_ALGORITHM = 'sha256';

/**
 * Default bridge scale σ = log2(3) ≈ 1.584962500721156.
 *
 * Plane note (ADJUDICATIONS-G1 amendment 6 / RC-11, COST-OF-EXACTNESS): the
 * fixed plane is canonical for products, the float plane for corpus-verbatim
 * runs, both to be version-stamped; the plane stamp is NOT yet in the digest
 * (v0.1 keeps the §7.3 canary hash stable) — the plane-scoped corpus + stamp
 * plan is owed at P2.
 */
export const DEFAULT_SIGMA = Math.log2(3);

/** Wormhole table size. Slots are indexed by a cell's d-value (0..63). */
export const SLOT_COUNT = 64;

// ── Pure rule table & PRNG ───────────────────────────────────────────────────

/**
 * The data rule table (pure): net-positive pressure → d+1 (saturate 63);
 * net-negative → d−1 (floor 0); zero → unchanged. τ is never changed here.
 * Kernel-exact (gate G2 exhausts it; C-DIFF re-proves it through tick).
 * Exported for exhaustive testing, not for steering.
 *
 * @param {number} d
 * @param {number} pressure
 * @returns {number}
 */
export function nextD(d, pressure) {
  if (pressure > 0) return d < D_MAX ? d + 1 : D_MAX;
  if (pressure < 0) return d > 0 ? d - 1 : 0;
  return d;
}

/**
 * Seeded PRNG for CALLERS (seeding, probes). Never drawn inside tick().
 *
 * CHECKED (v0.1 decision): `seed` must be an integer in [0, 2^32) —
 * non-integer, negative, or ≥ 2^32 throws PrngSeedError (a TypeError
 * carrying code "E_CODEC_PRNG_SEED"). Full rationale (the silent `>>> 0`
 * aliasing wall, V3/V3b/V3c, and why the raw version stays in /compat) is
 * receipted in ADJUDICATIONS-G1 and on the errors module.
 *
 * @param {number} seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed >= 2 ** 32) {
    throw new PrngSeedError(
      `mulberry32 seed must be an integer in [0, 2^32) — got ${seed}. The kernel's >>> 0 truncation silently aliased 2^32+5 ≡ 5, -1 ≡ 2^32-1, 5.7 ≡ 5 (V3/V3b/V3c); core refuses instead (a determinism library whose seed function is non-injective on its declared domain manufactures unreproducible-by-illusion science)`,
    );
  }
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// canonicalJson is part of the engine contract (verification tool for callers)
export { canonicalJson };

// ── Internal helpers ─────────────────────────────────────────────────────────

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
const DIM_MAX = 2 ** 16;

/**
 * @param {unknown} v
 * @returns {boolean}
 */
function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const p = Object.getPrototypeOf(v);
  return p === Object.prototype || p === null;
}

/**
 * Deep copy of an already-validated op (or op array). Post-validation every
 * value is JSON-able (INV-1), so the JSON round-trip is exact — and it
 * deliberately cannot smuggle functions, expandos, or typed arrays through.
 * @param {any} op
 */
function cloneOp(op) {
  return JSON.parse(JSON.stringify(op));
}

function assertDims(w, h) {
  for (const [name, v] of [['w', w], ['h', h]]) {
    if (!Number.isInteger(v) || v < 1 || v > DIM_MAX) {
      throw new DimensionError('E_DIM', `substrate ${name} must be a positive integer ≤ 2^16, got ${v}`);
    }
  }
}

// ── Op validation (OLOG-SPEC §3 — uniform and hostile to ambiguity) ─────────

const OP_NAMES = new Set([
  'setTau', 'setD', 'setCell', 'setByte', 'setBytes', 'fillRect',
  'seedMulberry32', 'whWrite', 'whClear', 'setOptions',
]);

/**
 * Fail-closed unknown-field check.
 * [2026-11-03][library-craft] decision: reject unknown fields on known ops
 * (E_OP_SHAPE), not ignore them — an ignored field still changes opsHash, so
 * two implementations that ignore differently would hash the same log
 * differently, which is the exact failure INV-4 exists to prevent; the
 * sanctioned path for new optional fields is an ologVersion minor bump
 * (§2); revisit if a v1.1 log must pass a v1 kernel (answer then: envelope
 * version gate, never silent tolerance).
 * @param {Record<string, unknown>} op
 * @param {Set<string>} allowed
 */
function vKnown(op, allowed) {
  for (const k of Object.keys(op)) {
    if (k !== 'op' && k !== 'at' && !allowed.has(k)) {
      throw new OpError('E_OP_SHAPE', `${op.op}: unknown field '${k}' — fail closed (INV-4); new optional fields ride an ologVersion minor bump`);
    }
  }
}

/** Required integer field: presence + integer typing (SHAPE) + range (BOUNDS). */
function vInt(op, name, min, max) {
  if (!Object.hasOwn(op, name)) {
    throw new OpError('E_OP_SHAPE', `${op.op}: missing required field '${name}'`);
  }
  const v = op[name];
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    throw new OpError('E_OP_SHAPE', `${op.op}.${name} must be an integer, got ${v}`);
  }
  if (v < min || v > max) {
    throw new OpError('E_OP_BOUNDS', `${op.op}.${name} must be in [${min}..${max}], got ${v}`);
  }
  return v;
}

/** Optional integer field (present-but-undefined is rejected, not defaulted). */
function vOptInt(op, name, min, max) {
  if (!Object.hasOwn(op, name)) return undefined;
  if (op[name] === undefined) {
    throw new OpError('E_OP_SHAPE', `${op.op}.${name} is present but undefined — omit the field instead (journal ops are plain data, INV-1)`);
  }
  return vInt(op, name, min, max);
}

/** Required boolean field. */
function vBool(op, name) {
  if (!Object.hasOwn(op, name)) {
    throw new OpError('E_OP_SHAPE', `${op.op}: missing required field '${name}'`);
  }
  if (typeof op[name] !== 'boolean') {
    throw new OpError('E_OP_SHAPE', `${op.op}.${name} must be a boolean, got ${op[name]}`);
  }
}

/**
 * Validate one op's fields against a WxH grid (NOT its `at` — that is
 * contextual: inject checks it against the live tick count, replay against
 * monotonicity + tickCount).
 * @param {unknown} op
 * @param {number} W
 * @param {number} H
 */
function validateOpFields(op, W, H) {
  if (!isPlainObject(op)) {
    throw new OpError('E_OP_SHAPE', `op must be a plain object, got ${op === null ? 'null' : typeof op}`);
  }
  const name = op.op;
  if (typeof name !== 'string' || !OP_NAMES.has(name)) {
    throw new OpError('E_OP_UNKNOWN', `unknown op '${String(name)}' — this kernel implements OLOG_VERSION ${OLOG_VERSION}; fail closed (INV-4)`);
  }
  switch (name) {
    case 'setTau': {
      vKnown(op, new Set(['x', 'y', 'tau']));
      vInt(op, 'x', 0, W - 1);
      vInt(op, 'y', 0, H - 1);
      vInt(op, 'tau', 0, 3);
      break;
    }
    case 'setD': {
      vKnown(op, new Set(['x', 'y', 'd']));
      vInt(op, 'x', 0, W - 1);
      vInt(op, 'y', 0, H - 1);
      vInt(op, 'd', 0, D_MAX);
      break;
    }
    case 'setCell': {
      vKnown(op, new Set(['x', 'y', 'tau', 'd']));
      vInt(op, 'x', 0, W - 1);
      vInt(op, 'y', 0, H - 1);
      const hasTau = Object.hasOwn(op, 'tau');
      const hasD = Object.hasOwn(op, 'd');
      if (!hasTau && !hasD) {
        throw new OpError('E_OP_SHAPE', `setCell: at least one of 'tau'/'d' is required`);
      }
      if (hasTau) vOptInt(op, 'tau', 0, 3);
      if (hasD) vOptInt(op, 'd', 0, D_MAX);
      break;
    }
    case 'setByte': {
      vKnown(op, new Set(['x', 'y', 'c']));
      vInt(op, 'x', 0, W - 1);
      vInt(op, 'y', 0, H - 1);
      vInt(op, 'c', 0, 255);
      break;
    }
    case 'setBytes': {
      vKnown(op, new Set(['x', 'y', 'w', 'bytes']));
      const x = vInt(op, 'x', 0, W - 1);
      const y = vInt(op, 'y', 0, H - 1);
      const bw = vInt(op, 'w', 1, W);
      if (!Object.hasOwn(op, 'bytes')) {
        throw new OpError('E_OP_SHAPE', `setBytes: missing required field 'bytes'`);
      }
      const bytes = op.bytes;
      if (!Array.isArray(bytes)) {
        throw new OpError('E_OP_SHAPE', `setBytes.bytes must be an array of bytes, got ${typeof bytes}`);
      }
      if (bytes.length % bw !== 0) {
        throw new OpError('E_OP_SHAPE', `setBytes: bytes.length ${bytes.length} is not a multiple of row stride w=${bw}`);
      }
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (typeof b !== 'number' || !Number.isInteger(b) || b < 0 || b > 255) {
          throw new OpError('E_OP_BOUNDS', `setBytes.bytes[${i}] must be an integer in 0..255, got ${b}`);
        }
      }
      const bh = bytes.length / bw;
      if (x + bw > W || y + bh > H) {
        throw new OpError('E_OP_BOUNDS', `setBytes block ${bw}x${bh} at (${x},${y}) does not fit the ${W}x${H} grid — out-of-bounds blocks throw, never clip (§3.5)`);
      }
      break;
    }
    case 'fillRect': {
      vKnown(op, new Set(['x', 'y', 'w', 'h', 'tau', 'd', 'byte']));
      const x = vInt(op, 'x', 0, W - 1);
      const y = vInt(op, 'y', 0, H - 1);
      const rw = vInt(op, 'w', 1, W);
      const rh = vInt(op, 'h', 1, H);
      if (x + rw > W || y + rh > H) {
        throw new OpError('E_OP_BOUNDS', `fillRect ${rw}x${rh} at (${x},${y}) does not fit the ${W}x${H} grid — out-of-bounds rects throw, never clip (§3.6)`);
      }
      const hasByte = Object.hasOwn(op, 'byte');
      const hasTau = Object.hasOwn(op, 'tau');
      const hasD = Object.hasOwn(op, 'd');
      if (hasByte && (hasTau || hasD)) {
        throw new OpError('E_OP_SHAPE', `fillRect: 'byte' XOR ('tau' AND 'd') — both given`);
      }
      if (!hasByte && !(hasTau && hasD)) {
        throw new OpError('E_OP_SHAPE', `fillRect: 'byte' XOR ('tau' AND 'd') — exactly one form required`);
      }
      if (hasByte) vInt(op, 'byte', 0, 255);
      if (hasTau) vOptInt(op, 'tau', 0, 3);
      if (hasD) vOptInt(op, 'd', 0, D_MAX);
      break;
    }
    case 'seedMulberry32': {
      vKnown(op, new Set(['seed', 'tauFromRng', 'dFromRng', 'tau', 'd']));
      vInt(op, 'seed', 0, 2 ** 32 - 1);
      vBool(op, 'tauFromRng');
      vBool(op, 'dFromRng');
      vOptInt(op, 'tau', 0, 3);
      vOptInt(op, 'd', 0, D_MAX);
      break;
    }
    case 'whWrite': {
      vKnown(op, new Set(['slot', 'x', 'y', 'resonance']));
      vInt(op, 'slot', 0, SLOT_COUNT - 1);
      vInt(op, 'x', 0, W - 1);
      vInt(op, 'y', 0, H - 1);
      vInt(op, 'resonance', 0, Number.MAX_SAFE_INTEGER);
      break;
    }
    case 'whClear': {
      vKnown(op, new Set(['slot']));
      vOptInt(op, 'slot', 0, SLOT_COUNT - 1);
      break;
    }
    case 'setOptions': {
      vKnown(op, new Set(['sigma', 'wormholes']));
      if (Object.hasOwn(op, 'sigma')) {
        const s = op.sigma;
        if (typeof s !== 'number' || !Number.isFinite(s)) {
          throw new OpError('E_OP_SHAPE', `setOptions.sigma must be a finite number, got ${s}`);
        }
      }
      if (Object.hasOwn(op, 'wormholes')) {
        if (typeof op.wormholes !== 'boolean') {
          throw new OpError('E_OP_SHAPE', `setOptions.wormholes must be a boolean, got ${op.wormholes}`);
        }
      }
      // [2026-11-03][library-craft] decision: a setOptions with NEITHER
      // field is a legal journaled no-op (the spec's §3.10 fields are both
      // optional, and unlike setCell there is no "at least one" rule); it
      // costs one journal entry and changes nothing; revisit only if the
      // fuzzer shows it obscuring real intent in multi-writer logs.
      break;
    }
    default:
      // Unreachable post-OP_NAMES check; kept fail-closed anyway (INV-4).
      throw new OpError('E_OP_UNKNOWN', `unknown op '${String(name)}'`);
  }
}

/**
 * Validate a full journaled op-log: every op valid (§3) + `at` present,
 * integer, in [0, maxAt], and monotonic non-decreasing (§4 rules 2–3).
 * @param {unknown} ops
 * @param {number} W
 * @param {number} H
 * @param {number} maxAt
 */
function validateOpsList(ops, W, H, maxAt) {
  if (!Array.isArray(ops)) {
    throw new OpError('E_OP_SHAPE', `ops must be an array, got ${typeof ops}`);
  }
  let prev = -1;
  for (let idx = 0; idx < ops.length; idx++) {
    const op = ops[idx];
    validateOpFields(op, W, H);
    if (!Object.hasOwn(op, 'at')) {
      throw new OpError('E_OP_SHAPE', `ops[${idx}]: missing required field 'at' (journaled logs carry it; live inject() fills it in)`);
    }
    const at = op.at;
    if (typeof at !== 'number' || !Number.isInteger(at)) {
      throw new OpError('E_OP_SHAPE', `ops[${idx}].at must be an integer, got ${at}`);
    }
    if (at < 0) {
      throw new OpError('E_OP_AT', `ops[${idx}].at must be ≥ 0, got ${at}`);
    }
    if (at < prev) {
      throw new OpError('E_OP_AT', `ops[${idx}].at=${at} breaks monotonicity (previous boundary ${prev}) — a journal is append-only by construction (§4 rule 2)`);
    }
    if (at > maxAt) {
      throw new OpError('E_OP_AT', `ops[${idx}].at=${at} exceeds tickCount ${maxAt} — at must be in [0, tickCount] (§4 rule 3)`);
    }
    prev = at;
  }
}

/**
 * Derive the sticky dynamics (σ, wormhole gate) a journal implies: defaults
 * until the first setOptions, then last-writer-wins per field, including
 * post-run ops (§4 rule 3). Single source for snapshot consistency checks
 * and hashTrace.
 * @param {ReadonlyArray<Record<string, unknown>>} ops
 */
function deriveSticky(ops) {
  let sigma = DEFAULT_SIGMA;
  let wormholes = true;
  for (const op of ops) {
    if (op.op === 'setOptions') {
      if (Object.hasOwn(op, 'sigma')) sigma = op.sigma;
      if (Object.hasOwn(op, 'wormholes')) wormholes = op.wormholes;
    }
  }
  return { sigma, wormholes };
}

// ── Wormhole table (owned; NO sigma parameter, ever) ─────────────────────────

const TABLE_TOKEN = Symbol('qthe.wormholeTable');

/**
 * The 64-slot wormhole table. One instance is OWNED by each Substrate (tick
 * options no longer accept an external table — sharing one table across
 * substrates was a cross-substrate coupling footgun; use snapshot()/restore()
 * to move table state).
 *
 * Note: NO sigma parameter, ever. σ lives on the Substrate and changes only
 * through journaled setOptions ops (invariant I6) — the kernel's table
 * carried a constructor σ, which is how the one-tick override leaked into
 * permanence (CRITIQUE F1). A table that cannot remember a σ cannot leak one.
 */
export class WormholeTable {
  /** @type {Substrate} */ #owner;
  #sx = new Int32Array(SLOT_COUNT).fill(-1);
  #sy = new Int32Array(SLOT_COUNT).fill(-1);
  #sr = new Int32Array(SLOT_COUNT);
  #occupied = new Uint8Array(SLOT_COUNT);
  #totalWrites = 0;

  /**
   * @internal Tables are created by the engine; not user-constructible.
   * [2026-11-03][library-craft] decision: token-guarded constructor (the
   * closest JS gets to the contract's `private constructor()`); the
   * underscore-prefixed methods below are the engine's internal friendship
   * surface — JS has no module-friend private fields, and WeakMaps would
   * hide the hot physics path behind a hash lookup per access; revisit if
   * the language grows true friend access.
   * @param {symbol} token
   * @param {Substrate} owner
   */
  constructor(token, owner) {
    if (token !== TABLE_TOKEN) {
      throw new TypeError('WormholeTable is created by the engine — use substrate.wormholes');
    }
    this.#owner = owner;
  }

  /**
   * Occupant of a slot, or null if empty.
   * @param {number} slot
   */
  read(slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) {
      throw new OpError('E_OP_BOUNDS', `wormhole slot must be an integer in 0..${SLOT_COUNT - 1}, got ${slot}`);
    }
    if (!this.#occupied[slot]) return null;
    return { slot, x: this.#sx[slot], y: this.#sy[slot], resonance: this.#sr[slot] };
  }

  /**
   * Occupy a slot (last-writer-wins). Validated: slot 0..63, integer
   * in-grid coordinates, integer resonance ≥ 0. The kernel accepted anything
   * and silently coerced via Int32Array (NaN → 0 retargeted a wormhole to
   * the origin, and a NaN resonance made twins silently never fire); core
   * throws OpError instead. Direct writes are journaled as whWrite ops on
   * the owner so replay stays exact.
   * @param {number} slot @param {number} x @param {number} y @param {number} resonance
   */
  write(slot, x, y, resonance) {
    this.#owner._journalWhWrite(slot, x, y, resonance);
  }

  /** Number of occupied slots. */
  occupiedCount() {
    let n = 0;
    for (let i = 0; i < SLOT_COUNT; i++) n += this.#occupied[i];
    return n;
  }

  /** Cumulative write count (telemetry only; not digest-relevant). */
  get totalWrites() {
    return this.#totalWrites;
  }

  /** Occupied slots in slot order. Deterministic; JSON-able. */
  slots() {
    return this._slotViews();
  }

  /** Deep, structuredClone-safe state (slots + totalWrites). */
  snapshot() {
    return { slots: this._slotViews(), totalWrites: this.#totalWrites };
  }

  /**
   * Vacate the whole table and reset totalWrites — journaled as a whClear
   * op (mirrors kernel clear()).
   */
  clear() {
    this.#owner._journalWhClear();
  }

  // ── engine-internal friendship surface (see the constructor marker) ──────

  /** @internal Physics-path read: slot is a cell's d-value, in-domain by construction. */
  _rawRead(slot) {
    if (!this.#occupied[slot]) return null;
    return { x: this.#sx[slot], y: this.#sy[slot], resonance: this.#sr[slot] };
  }

  /** @internal Physics-path write (tick's own resonance bookkeeping; NOT journaled — it is re-derived by replay). */
  _rawWrite(slot, x, y, resonance) {
    this.#sx[slot] = x;
    this.#sy[slot] = y;
    this.#sr[slot] = resonance;
    this.#occupied[slot] = 1;
    this.#totalWrites++;
  }

  /** @internal Op-path clear: one slot (totalWrites stays monotone) or all (totalWrites resets, mirroring kernel clear()). */
  _rawClear(slot) {
    if (slot === undefined) {
      this.#sx.fill(-1); this.#sy.fill(-1); this.#sr.fill(0);
      this.#occupied.fill(0);
      this.#totalWrites = 0;
    } else {
      this.#sx[slot] = -1; this.#sy[slot] = -1; this.#sr[slot] = 0;
      this.#occupied[slot] = 0;
    }
  }

  /** @internal Digest tuples [[slot,x,y,resonance],…] — occupied, slot order (§7.2). */
  _tuples() {
    const out = [];
    for (let s = 0; s < SLOT_COUNT; s++) {
      if (this.#occupied[s]) out.push([s, this.#sx[s], this.#sy[s], this.#sr[s]]);
    }
    return out;
  }

  /** @internal Occupied-slot views for snapshot()/trace() (fresh objects each call). */
  _slotViews() {
    const out = [];
    for (let s = 0; s < SLOT_COUNT; s++) {
      if (this.#occupied[s]) out.push({ slot: s, x: this.#sx[s], y: this.#sy[s], resonance: this.#sr[s] });
    }
    return out;
  }

  /** @internal Restore state from validated snapshot views. */
  _setState(views, totalWrites) {
    this.#sx.fill(-1); this.#sy.fill(-1); this.#sr.fill(0); this.#occupied.fill(0);
    for (const v of views) {
      this.#sx[v.slot] = v.x; this.#sy[v.slot] = v.y; this.#sr[v.slot] = v.resonance;
      this.#occupied[v.slot] = 1;
    }
    this.#totalWrites = totalWrites;
  }
}

// ── Seed capture ladder (Flag 2 — the seed IS the ops at at === 0) ───────────

/**
 * @typedef {(
 *   | { kind: "bytes"; bytes: Uint8Array | readonly number[] }
 *   | { kind: "uniform"; tau: number; d: number }
 *   | { kind: "mulberry32"; seed: number; tauFromRng: boolean; dFromRng: boolean; tau?: number; d?: number }
 *   | { kind: "legacyFn"; fn: (x: number, y: number, i: number) => number }
 * )} SeedInit
 */

/**
 * Convert a SeedInit to the ops journaled at at:0. Every rung is byte-exact;
 * rungs only trade bytes for re-derivability (§5):
 *   mulberry32 → seedMulberry32 (4 numbers, re-derivable)
 *   uniform    → fillRect       (2 numbers, constant plane)
 *   bytes      → setBytes       (w·h bytes, literal)
 *   legacyFn   → setBytes       (fn runs ONCE at creation; its BYTES are the provenance)
 * @param {SeedInit|undefined} seed
 * @param {number} W
 * @param {number} H
 * @returns {Record<string, unknown>[]}
 */
function seedToOps(seed, W, H) {
  if (seed === undefined) return [];
  if (!isPlainObject(seed)) {
    throw new OpError('E_OP_SHAPE', `seed must be a SeedInit object, got ${seed === null ? 'null' : typeof seed}`);
  }
  switch (seed.kind) {
    case 'bytes': {
      const raw = seed.bytes;
      if (!(raw instanceof Uint8Array) && !Array.isArray(raw)) {
        throw new OpError('E_OP_SHAPE', `seed.bytes must be a Uint8Array or an array of bytes, got ${typeof raw}`);
      }
      if (raw.length !== W * H) {
        throw new OpError('E_OP_SHAPE', `seed.bytes length ${raw.length} ≠ w*h = ${W * H} for a ${W}x${H} grid`);
      }
      const op = { op: 'setBytes', at: 0, x: 0, y: 0, w: W, bytes: Array.from(raw) };
      validateOpFields(op, W, H); // byte-domain + fit checks, op-flavored errors
      return [op];
    }
    case 'uniform': {
      const op = { op: 'fillRect', at: 0, x: 0, y: 0, w: W, h: H, tau: seed.tau, d: seed.d };
      validateOpFields(op, W, H); // rejects bad tau/d with op-flavored errors
      return [op];
    }
    case 'mulberry32': {
      const op = { op: 'seedMulberry32', at: 0, seed: seed.seed, tauFromRng: seed.tauFromRng, dFromRng: seed.dFromRng };
      if (Object.hasOwn(seed, 'tau')) op.tau = seed.tau;
      if (Object.hasOwn(seed, 'd')) op.d = seed.d;
      validateOpFields(op, W, H);
      return [op];
    }
    case 'legacyFn': {
      if (typeof seed.fn !== 'function') {
        throw new OpError('E_OP_SHAPE', `seed.fn must be a function (x, y, i) => byte`);
      }
      // Argument order is (x, y, i) — the R6 frozen cross-lane contract (the
      // kernel's own doc comment says (i, x, y) while its code calls
      // fn(x, y, i); CRITIQUE F4, receipt V8: the code is the contract).
      // The fn runs exactly ONCE, at creation; its bytes are journaled and
      // the function itself never enters any artifact (Flag 4: a trace can
      // testify WHAT bytes made the substrate, never WHICH function did).
      const bytes = new Array(W * H);
      let i = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++, i++) {
          const b = seed.fn(x, y, i);
          if (typeof b !== 'number' || !Number.isInteger(b) || b < 0 || b > 255) {
            throw new OpError('E_OP_BOUNDS', `seed.fn(x=${x}, y=${y}, i=${i}) returned ${b} — outside the byte domain 0..255. The kernel masked with & 0xff (C2/V4); core refuses (I3)`);
          }
          bytes[i] = b;
        }
      }
      return [{ op: 'setBytes', at: 0, x: 0, y: 0, w: W, bytes }];
    }
    default:
      throw new OpError('E_OP_SHAPE', `unknown seed kind '${String(seed.kind)}' — expected bytes | uniform | mulberry32 | legacyFn`);
  }
}

// ── Substrate ─────────────────────────────────────────────────────────────────

const CREATE_TOKEN = Symbol('qthe.substrate.create');

/**
 * A substrate handle: grid, owned wormhole table, journal, tick engine.
 * Obtain via Substrate.create() or Substrate.restore() — never `new`. The
 * handle is a real object (not a Uint8Array with expandos): it survives
 * serialization boundaries via snapshot()/restore(), and its toJSON() makes
 * JSON.stringify produce the safe serialization by default.
 */
export class Substrate {
  #w;
  #h;
  #ticks = 0;
  #sigma = DEFAULT_SIGMA;
  #wormholesEnabled = true;
  #cells;
  #scratch;
  /** @type {Record<string, unknown>[]} */ #journal = [];
  #lastEvents = Object.freeze([]);
  #table;

  /**
   * @internal token-guarded (the contract's `private constructor()`).
   * @param {symbol} token @param {number} w @param {number} h
   */
  constructor(token, w, h) {
    if (token !== CREATE_TOKEN) {
      throw new TypeError('Substrate is not constructible — use Substrate.create() or Substrate.restore()');
    }
    this.#w = w;
    this.#h = h;
    this.#cells = new Uint8Array(w * h);
    this.#scratch = new Uint8Array(w * h);
    this.#table = new WormholeTable(TABLE_TOKEN, this);
  }

  /**
   * Create a substrate from a seed spec. Journaled at at:0.
   * @param {{ w: number; h: number; seed?: SeedInit }} init
   * @returns {Substrate}
   */
  static create(init) {
    if (!isPlainObject(init)) {
      throw new DimensionError('E_DIM', `create() expects an init object {w, h, seed?}, got ${init === null ? 'null' : typeof init}`);
    }
    assertDims(init.w, init.h);
    const seedOps = seedToOps(init.seed, init.w, init.h);
    const sub = new Substrate(CREATE_TOKEN, init.w, init.h);
    if (seedOps.length) sub.#journalAndApply(seedOps);
    return sub;
  }

  /**
   * Restore from a snapshot (alias: `restore`).
   * @throws {SnapshotError} E_SNAPSHOT_VERSION if the stamps are not accepted
   *         by this kernel; E_SNAPSHOT_SHAPE if structurally invalid.
   * @param {{ v: string; kernelSchemaVersion: string; specVersion: string; w: number; h: number; ticks: number; sigma: number; cells: Uint8Array; table: unknown; totalWrites: number; ops: unknown }} snap
   * @returns {Substrate}
   */
  static fromSnapshot(snap) {
    if (!isPlainObject(snap)) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot must be a plain object, got ${snap === null ? 'null' : typeof snap}`);
    }
    if (snap.v !== SNAPSHOT_VERSION) {
      throw new SnapshotError('E_SNAPSHOT_VERSION', `snapshot version '${String(snap.v)}' is not accepted by this kernel (expects '${SNAPSHOT_VERSION}')`);
    }
    if (snap.kernelSchemaVersion !== KERNEL_SCHEMA_VERSION || snap.specVersion !== SPEC_VERSION) {
      throw new SnapshotError('E_SNAPSHOT_VERSION', `snapshot stamps kernel=${String(snap.kernelSchemaVersion)}/spec=${String(snap.specVersion)} are not accepted here (kernel=${KERNEL_SCHEMA_VERSION}/spec=${SPEC_VERSION}) — stamps live inside the digest (§7.2), so a stamp gap is a hard stop, never a guess`);
    }
    if (!Number.isInteger(snap.w) || snap.w < 1 || snap.w > DIM_MAX ||
        !Number.isInteger(snap.h) || snap.h < 1 || snap.h > DIM_MAX) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot dims must be positive integers ≤ 2^16, got ${snap.w}x${snap.h}`);
    }
    if (!Number.isInteger(snap.ticks) || snap.ticks < 0) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.ticks must be a non-negative integer, got ${snap.ticks}`);
    }
    if (typeof snap.sigma !== 'number' || !Number.isFinite(snap.sigma)) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.sigma must be a finite number, got ${snap.sigma}`);
    }
    if (!(snap.cells instanceof Uint8Array) || snap.cells.length !== snap.w * snap.h) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.cells must be a Uint8Array of length w*h = ${snap.w * snap.h}`);
    }
    if (!Number.isInteger(snap.totalWrites) || snap.totalWrites < 0) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.totalWrites must be a non-negative integer, got ${snap.totalWrites}`);
    }
    // table views: plain objects, valid domains, in-grid, unique slots
    if (!Array.isArray(snap.table)) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.table must be an array of slot views`);
    }
    const seenSlots = new Set();
    for (let i = 0; i < snap.table.length; i++) {
      const v = snap.table[i];
      if (!isPlainObject(v)) {
        throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.table[${i}] must be a plain object`);
      }
      if (!Number.isInteger(v.slot) || v.slot < 0 || v.slot >= SLOT_COUNT) {
        throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.table[${i}].slot must be an integer in 0..${SLOT_COUNT - 1}, got ${v.slot}`);
      }
      if (seenSlots.has(v.slot)) {
        throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.table[${i}]: duplicate slot ${v.slot}`);
      }
      seenSlots.add(v.slot);
      if (!Number.isInteger(v.x) || v.x < 0 || v.x >= snap.w || !Number.isInteger(v.y) || v.y < 0 || v.y >= snap.h) {
        throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.table[${i}] coordinates (${v.x},${v.y}) must be integers inside the ${snap.w}x${snap.h} grid`);
      }
      if (!Number.isInteger(v.resonance) || v.resonance < 0) {
        throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.table[${i}].resonance must be an integer ≥ 0, got ${v.resonance}`);
      }
    }
    // ops: full §3 + §4 validation (monotonicity + range against snap.ticks)
    validateOpsList(snap.ops, snap.w, snap.h, snap.ticks);
    // consistency: the snapshot's σ must equal what its journal implies —
    // a snapshot that disagrees with its own provenance is corrupt by
    // definition, not "informational".
    const sticky = deriveSticky(/** @type {any} */ (snap.ops));
    if (sticky.sigma !== snap.sigma) {
      throw new SnapshotError('E_SNAPSHOT_SHAPE', `snapshot.sigma (${snap.sigma}) disagrees with the journal-derived σ (${sticky.sigma}) — the snapshot lies about derivable state`);
    }
    const sub = new Substrate(CREATE_TOKEN, snap.w, snap.h);
    sub.#cells.set(snap.cells);
    sub.#ticks = snap.ticks;
    sub.#sigma = snap.sigma;
    sub.#wormholesEnabled = sticky.wormholes;
    sub.#table._setState(snap.table, snap.totalWrites);
    sub.#journal = /** @type {any} */ (snap.ops).map(cloneOp);
    return sub;
  }

  /** Alias of Substrate.fromSnapshot. */
  static restore(snap) {
    return Substrate.fromSnapshot(snap);
  }

  get w() { return this.#w; }
  get h() { return this.#h; }
  /** Completed tick count. */
  get ticks() { return this.#ticks; }
  /**
   * Sticky σ (default log2(3)). Read-only handle state: it changes ONLY
   * through journaled setOptions ops (invariant I6) — no setter, no
   * constructor leak path, no per-tick override in core. Always derivable
   * from the journal; sealed into hash() for forensic readability.
   */
  get sigma() { return this.#sigma; }
  /**
   * The owned wormhole table. Writes through this handle are journaled as
   * whWrite ops (both inject({op:"whWrite",…}) and direct table.write(…)
   * append to the journal), so replay stays exact.
   */
  get wormholes() { return this.#table; }
  /**
   * The live cell plane, row-major, w*h bytes. Zero-copy for renderers.
   * WRITING it bypasses the journal: replay will disagree with your own
   * hash. Use inject() for all writes (invariant I1).
   */
  get cells() { return this.#cells; }
  /** Defensive copy of the plane. */
  copyCells() { return this.#cells.slice(); }
  /**
   * @param {number} x @param {number} y
   * @throws {RangeError} on out-of-grid coordinates (index access, not an op).
   */
  getByte(x, y) {
    if (!Number.isInteger(x) || x < 0 || x >= this.#w || !Number.isInteger(y) || y < 0 || y >= this.#h) {
      throw new RangeError(`getByte: (${x},${y}) is outside the ${this.#w}x${this.#h} grid`);
    }
    return this.#cells[y * this.#w + x];
  }
  /**
   * @param {number} x @param {number} y
   * @throws {RangeError} on out-of-grid coordinates.
   */
  getCell(x, y) {
    const c = this.getByte(x, y);
    return { tau: (c >> 6) & 3, d: c & D_MAX };
  }

  /** Events of the most recent tick (fresh array; never undefined). */
  get events() { return this.#lastEvents.slice(); }
  /** The journal (the op-log of everything that happened). Append-only. */
  get ops() { return this.#journal.map(cloneOp); }

  /**
   * Apply ops at the current tick boundary. Entries are validated, then
   * journaled with `at` filled in (= current ticks) if omitted. `at` values
   * other than the current tick count throw E_OP_AT (history is
   * append-only; you cannot retro-inject or pre-queue through this API —
   * construct a full op-log and replay it instead).
   *
   * [2026-11-03][library-craft] decision: the batch is validated ENTIRELY
   * before anything is journaled or applied (atomicity) — a half-applied
   * batch with a thrown error and no journal of what happened is the worst
   * possible failure shape for a determinism library; revisit only if a
   * priced use case demands streaming application (it cannot, by §4).
   * @param {unknown} ops
   * @returns {this}
   */
  inject(ops) {
    const batch = Array.isArray(ops) ? ops : [ops];
    if (batch.length === 0) return this;
    const normalized = [];
    for (const op of batch) {
      validateOpFields(op, this.#w, this.#h);
      let at;
      if (Object.hasOwn(/** @type {any} */ (op), 'at')) {
        at = /** @type {any} */ (op).at;
        if (typeof at !== 'number' || !Number.isInteger(at)) {
          throw new OpError('E_OP_SHAPE', `${/** @type {any} */ (op).op}.at must be an integer, got ${at}`);
        }
        if (at < 0) {
          throw new OpError('E_OP_AT', `op.at must be ≥ 0, got ${at}`);
        }
        if (at !== this.#ticks) {
          throw new OpError('E_OP_AT', `live injection refuses at=${at} on a substrate at ticks=${this.#ticks} — retro-injection and pre-queueing are not allowed (§4 rule 4); build a full op-log and replayTrace() it`);
        }
      } else {
        at = this.#ticks;
      }
      normalized.push({ .../** @type {any} */ (op), at });
    }
    this.#journalAndApply(normalized);
    return this;
  }

  /**
   * One synchronous toroidal Moore-8 tick. Mutates in place; returns THIS
   * TICK'S EVENTS (not the substrate — invariant I4). Tick semantics are
   * the kernel's receipts R1–R4, unchanged and trace-sealed (determinism
   * status: see the receipt block on hash()).
   *
   * Takes NO options (invariant I6, v0.1): every dynamics parameter — σ,
   * the wormhole gate — is journaled substrate state, changed only by
   * setOptions ops. The σ sweep (C3) and the G6 paired-arm OFF are
   * journaled setOptions ops (see SetOptionsOp in the .d.ts for the recipe).
   *
   * @returns {ReadonlyArray<import("./engine.mjs").TwinEvent>}
   */
  tick() {
    const W = this.#w, H = this.#h, cells = this.#cells;
    const snap = this.#scratch;
    snap.set(cells); // pre-tick neighbor snapshot (R2: synchronous update)
    const sigma = this.#sigma;
    const wormholes = this.#wormholesEnabled;
    const table = this.#table;
    const events = [];
    const tickNumber = this.#ticks + 1; // events carry the 1-based tick (contract)

    for (let y = 0; y < H; y++) {
      const yUp = (y + H - 1) % H, yDn = (y + 1) % H;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const c = snap[i];
        const tau = c >> 6, d = c & D_MAX;

        // real accumulator over Moore-8 (pre-tick grid, R2): Attract +d, Repel -d
        const xL = (x + W - 1) % W, xR = (x + 1) % W;
        let acc = 0;
        let nb = snap[yUp * W + xL]; if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
        nb = snap[yUp * W + x];      if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
        nb = snap[yUp * W + xR];     if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
        nb = snap[y * W + xL];       if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
        nb = snap[y * W + xR];       if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
        nb = snap[yDn * W + xL];     if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
        nb = snap[yDn * W + x];      if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
        nb = snap[yDn * W + xR];     if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;

        let pressure = acc;
        if (tau === 3 && wormholes) {
          const hit = table._rawRead(d); // live read (R2)
          if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
            const term = hit.resonance * sigma; // twin resonance, item 4
            pressure = acc + term;             // imaginary pressure (R3)
            events.push(Object.freeze({ kind: 'twin', x, y, slot: d, resonance: hit.resonance, term, tick: tickNumber }));
          }
          table._rawWrite(d, x, y, Math.abs(acc) + 1); // write for the next tick
        }
        cells[i] = (tau << 6) | nextD(d, pressure); // in place; tau frozen (R3/R4)
      }
    }
    this.#ticks = tickNumber;
    this.#lastEvents = Object.freeze(events); // internal record; caller got its own copy
    return events.slice();
  }

  /**
   * Run `count` ticks (convenience; identical to count × tick). Returns the
   * per-tick event arrays. No options — same law as tick() (I6).
   * @param {number} count
   */
  run(count) {
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      throw new TypeError(`run() count must be a non-negative integer, got ${count}`);
    }
    const out = [];
    for (let t = 0; t < count; t++) out.push(this.tick());
    return out;
  }

  /**
   * StructuredClone-safe, versioned snapshot. Round-trip law (tested, gate
   * C-RTRIP): Substrate.restore(s.snapshot()).hash() === s.hash().
   */
  snapshot() {
    return {
      v: SNAPSHOT_VERSION,
      kernelSchemaVersion: KERNEL_SCHEMA_VERSION,
      specVersion: SPEC_VERSION,
      w: this.#w,
      h: this.#h,
      ticks: this.#ticks,
      // σ included deliberately for forensic readability — the seal shows
      // what a stranger can eyeball without replaying; it is VERIFIED
      // against the journal on restore, so it cannot lie.
      sigma: this.#sigma,
      cells: this.#cells.slice(),
      table: this.#table._slotViews(),
      totalWrites: this.#table.totalWrites,
      ops: this.#journal.map(cloneOp),
    };
  }

  /**
   * Version-stamped state digest: "qth1:" + 64 lowercase hex chars.
   * Recipe (normative): OLOG-SPEC §7. Covers versions, dims, ticks, σ,
   * cells, table, and an opsHash of the journal — so it seals BOTH the
   * state and its provenance.
   *
   * DETERMINISM RECEIPT (RC-05 split — binding wording; do not paraphrase,
   * do not upgrade either half without a new adjudication):
   *   tick determinism:   PRICED (corpus 12/12 + g2-corpus 24/24, four
   *                       languages, external rebuilder).
   *   op-log determinism: NOT YET PRICED (P1 exit: differential fuzzer +
   *                       multi-writer corpus — see falsification-bench).
   * What that means for THIS function: identical (cells, table, σ, ops,
   * stamps) hash identically on this build — priced. Whether replaying a
   * multi-writer op-log across independent implementations produces the
   * identical journal/ordering everywhere is the unpriced half; until the
   * falsification-bench corpus lands, treat cross-implementation op-log
   * claims as unpriced, because they are.
   */
  hash() {
    return HASH_VERSION + ':' + sha256Hex(canonicalJson(this.#digestInput()));
  }

  /** The artifact of record (view + provenance + seal). */
  trace() {
    return {
      formatVersion: '1',
      kernelSchemaVersion: KERNEL_SCHEMA_VERSION,
      specVersion: SPEC_VERSION,
      ologVersion: OLOG_VERSION,
      w: this.#w,
      h: this.#h,
      tickCount: this.#ticks,
      ops: this.#journal.map(cloneOp),
      cellsHex: this.#cellsHex(),
      table: this.#table._slotViews(),
      events: this.#lastEvents.map((e) => ({ ...e })),
      stateHash: this.hash(),
    };
  }

  /**
   * Safe default serialization: JSON.stringify(substrate) yields the
   * TraceRecord (minus this method). The documented footgun of the reference
   * kernel (circular via the `bytes` self-pointer) becomes a safe default
   * path. structuredClone(substrate) still drops nothing — but snapshot()
   * is the sanctioned crossing; use it.
   */
  toJSON() {
    return this.trace();
  }

  // ── engine internals ─────────────────────────────────────────────────────

  /** @internal Journal then apply an array of ALREADY-validated ops (with at filled). */
  #journalAndApply(ops) {
    for (const op of ops) this.#journal.push(cloneOp(op));
    for (const op of ops) this.#applyOp(op);
  }

  /** @internal Apply one validated op. No validation here — callers validated. */
  #applyOp(op) {
    const cells = this.#cells, W = this.#w, H = this.#h;
    switch (op.op) {
      case 'setTau': {
        const i = op.y * W + op.x;
        cells[i] = (op.tau << 6) | (cells[i] & D_MAX);
        break;
      }
      case 'setD': {
        const i = op.y * W + op.x;
        cells[i] = (cells[i] & 0xc0) | op.d;
        break;
      }
      case 'setCell': {
        const i = op.y * W + op.x;
        const cur = cells[i];
        const tau = Object.hasOwn(op, 'tau') ? op.tau : (cur >> 6);
        const d = Object.hasOwn(op, 'd') ? op.d : (cur & D_MAX);
        cells[i] = (tau << 6) | d;
        break;
      }
      case 'setByte': {
        cells[op.y * W + op.x] = op.c;
        break;
      }
      case 'setBytes': {
        const bh = op.bytes.length / op.w;
        for (let r = 0; r < bh; r++) {
          const rowStart = (op.y + r) * W + op.x;
          for (let c = 0; c < op.w; c++) cells[rowStart + c] = op.bytes[r * op.w + c];
        }
        break;
      }
      case 'fillRect': {
        const c = Object.hasOwn(op, 'byte') ? op.byte : pack(op.tau, op.d);
        for (let r = 0; r < op.h; r++) {
          const rowStart = (op.y + r) * W + op.x;
          for (let cc = 0; cc < op.w; cc++) cells[rowStart + cc] = c;
        }
        break;
      }
      case 'seedMulberry32': {
        // §3.7 recipe, pinned: one stream, row-major, τ drawn first, then d;
        // undrawn fields take the op's constants (defaults 0/0).
        const rng = mulberry32(op.seed);
        let i = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++, i++) {
            const tau = op.tauFromRng ? Math.floor(rng() * 4) : (Object.hasOwn(op, 'tau') ? op.tau : 0);
            const d = op.dFromRng ? Math.floor(rng() * 64) : (Object.hasOwn(op, 'd') ? op.d : 0);
            cells[i] = (tau << 6) | d;
          }
        }
        break;
      }
      case 'whWrite':
        this.#table._rawWrite(op.slot, op.x, op.y, op.resonance);
        break;
      case 'whClear':
        this.#table._rawClear(Object.hasOwn(op, 'slot') ? op.slot : undefined);
        break;
      case 'setOptions':
        if (Object.hasOwn(op, 'sigma')) this.#sigma = op.sigma;
        if (Object.hasOwn(op, 'wormholes')) this.#wormholesEnabled = op.wormholes;
        break;
      default:
        // Unreachable post-validation; kept fail-closed (INV-4).
        throw new OpError('E_OP_UNKNOWN', `unknown op '${String(op.op)}'`);
    }
  }

  /** @internal The §7.2 digest input. Key order is canonicalJson's job. */
  #digestInput() {
    return {
      v: { kernel: KERNEL_SCHEMA_VERSION, spec: SPEC_VERSION, olog: OLOG_VERSION, hash: HASH_VERSION },
      w: this.#w,
      h: this.#h,
      ticks: this.#ticks,
      sigma: this.#sigma,
      cellsHex: this.#cellsHex(),
      table: this.#table._tuples(),
      opsHash: sha256Hex(canonicalJson(this.#journal)),
    };
  }

  /** @internal Lowercase hex of the cell plane, row-major. */
  #cellsHex() {
    const cells = this.#cells;
    let s = '';
    for (let i = 0; i < cells.length; i++) s += HEX[cells[i]];
    return s;
  }

  /** @internal Journaling path for table.write() — routes through inject so validation + journaling are single-sourced. */
  _journalWhWrite(slot, x, y, resonance) {
    this.inject({ op: 'whWrite', at: this.#ticks, slot, x, y, resonance });
  }

  /** @internal Journaling path for table.clear(). */
  _journalWhClear() {
    this.inject({ op: 'whClear', at: this.#ticks });
  }
}

// ── Determinism tooling ───────────────────────────────────────────────────────

/**
 * @typedef {{ kind: "twin"; x: number; y: number; slot: number; resonance: number; term: number; tick: number }} TwinEvent
 * @typedef {{ slot: number; x: number; y: number; resonance: number }} WormholeSlotView
 * @typedef {{
 *   v: string; kernelSchemaVersion: string; specVersion: string; w: number; h: number;
 *   ticks: number; sigma: number; cells: Uint8Array; table: WormholeSlotView[];
 *   totalWrites: number; ops: Record<string, unknown>[];
 * }} SubstrateSnapshot
 * @typedef {{
 *   formatVersion: string; kernelSchemaVersion: string; specVersion: string; ologVersion: string;
 *   w: number; h: number; tickCount: number; ops: Record<string, unknown>[];
 *   cellsHex: string; table: WormholeSlotView[]; events: TwinEvent[]; stateHash: string;
 * }} TraceRecord
 */

/**
 * Hash a trace record without a substrate (verification tool). Same recipe
 * as Substrate.hash(); OLOG-SPEC §7. Determinism receipt: see the binding
 * block on Substrate.hash() — this function inherits it verbatim.
 *
 * Note the split of labor: hashTrace checks the seal against the trace's
 * VIEWS (cellsHex etc.) without running physics; replayTrace checks it
 * against the PHYSICS. An honest trace passes both; a tampered view dies at
 * hashTrace; a tampered op-log dies at replay.
 *
 * @param {unknown} trace
 * @returns {string}
 */
export function hashTrace(trace) {
  const t = validateTrace(trace);
  const { sigma } = deriveSticky(t.ops);
  return HASH_VERSION + ':' + sha256Hex(canonicalJson({
    v: { kernel: KERNEL_SCHEMA_VERSION, spec: SPEC_VERSION, olog: OLOG_VERSION, hash: HASH_VERSION },
    w: t.w,
    h: t.h,
    ticks: t.tickCount,
    sigma,
    cellsHex: t.cellsHex,
    table: t.table.map((s) => [s.slot, s.x, s.y, s.resonance]),
    opsHash: sha256Hex(canonicalJson(t.ops)),
  }));
}

const HEX_ONLY = /^[0-9a-f]+$/;
const HASH_SHAPE = /^qth1:[0-9a-f]{64}$/;

/**
 * Parse and validate untrusted trace JSON (from disk, a Worker, a peer).
 *
 * Error mapping (the taxonomy has no envelope-shape code, so this is the
 * documented ruling): stamp problems AND envelope-shape problems (bad
 * cellsHex, bad table views, bad events, bad stateHash shape) throw
 * ReplayError E_REPLAY_VERSION — "this is not a valid v1 trace"; bad dims
 * throw DimensionError E_DIM (same as create); bad ops throw E_OP_*.
 * E_REPLAY_HASH never fires here (hashing happens after replay).
 * Unknown TOP-LEVEL fields are tolerated: the envelope is governed by
 * formatVersion and the digest covers D's fixed fields only — additive
 * envelope fields are the §2 additive class.
 *
 * @param {unknown} value
 * @returns {TraceRecord} a FRESH normalized record (never the caller's object)
 */
export function validateTrace(value) {
  if (!isPlainObject(value)) {
    throw new ReplayError('E_REPLAY_VERSION', `trace must be a plain object, got ${value === null ? 'null' : typeof value}`);
  }
  if (value.formatVersion !== '1') {
    throw new ReplayError('E_REPLAY_VERSION', `trace.formatVersion '${String(value.formatVersion)}' is not '1'`);
  }
  if (value.kernelSchemaVersion !== KERNEL_SCHEMA_VERSION) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.kernelSchemaVersion '${String(value.kernelSchemaVersion)}' ≠ '${KERNEL_SCHEMA_VERSION}' — stamps live inside the digest (§7.2); a stamp gap is a hard stop, never a guess`);
  }
  if (value.specVersion !== SPEC_VERSION) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.specVersion '${String(value.specVersion)}' ≠ '${SPEC_VERSION}'`);
  }
  const ologMajor = typeof value.ologVersion === 'string' ? value.ologVersion.split('.')[0] : '';
  if (ologMajor !== OLOG_VERSION) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.ologVersion '${String(value.ologVersion)}' is not OLOG major '${OLOG_VERSION}' (cross-major logs are refused, §2)`);
  }
  if (!Number.isInteger(value.w) || value.w < 1 || value.w > DIM_MAX ||
      !Number.isInteger(value.h) || value.h < 1 || value.h > DIM_MAX) {
    throw new DimensionError('E_DIM', `trace dims must be positive integers ≤ 2^16, got ${value.w}x${value.h}`);
  }
  if (!Number.isInteger(value.tickCount) || value.tickCount < 0) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.tickCount must be a non-negative integer, got ${value.tickCount}`);
  }
  validateOpsList(value.ops, value.w, value.h, value.tickCount);
  if (typeof value.cellsHex !== 'string' || value.cellsHex.length !== 2 * value.w * value.h || !HEX_ONLY.test(value.cellsHex)) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.cellsHex must be ${2 * value.w * value.h} lowercase hex chars, got ${typeof value.cellsHex === 'string' ? `length ${value.cellsHex.length}` : typeof value.cellsHex}`);
  }
  if (!Array.isArray(value.table)) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.table must be an array of slot views`);
  }
  const seen = new Set();
  for (let i = 0; i < value.table.length; i++) {
    const v = value.table[i];
    if (!isPlainObject(v) ||
        !Number.isInteger(v.slot) || v.slot < 0 || v.slot >= SLOT_COUNT ||
        !Number.isInteger(v.x) || v.x < 0 || v.x >= value.w ||
        !Number.isInteger(v.y) || v.y < 0 || v.y >= value.h ||
        !Number.isInteger(v.resonance) || v.resonance < 0 || seen.has(v.slot)) {
      throw new ReplayError('E_REPLAY_VERSION', `trace.table[${i}] is not a valid in-grid unique slot view`);
    }
    seen.add(v.slot);
  }
  if (!Array.isArray(value.events)) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.events must be an array`);
  }
  for (let i = 0; i < value.events.length; i++) {
    const e = value.events[i];
    if (!isPlainObject(e) || e.kind !== 'twin' ||
        !Number.isInteger(e.x) || e.x < 0 || e.x >= value.w ||
        !Number.isInteger(e.y) || e.y < 0 || e.y >= value.h ||
        !Number.isInteger(e.slot) || e.slot < 0 || e.slot >= SLOT_COUNT ||
        !Number.isInteger(e.resonance) || e.resonance < 1 ||
        typeof e.term !== 'number' || !Number.isFinite(e.term) ||
        !Number.isInteger(e.tick) || e.tick < 1 || e.tick > value.tickCount) {
      throw new ReplayError('E_REPLAY_VERSION', `trace.events[${i}] is not a valid twin event`);
    }
  }
  if (typeof value.stateHash !== 'string' || !HASH_SHAPE.test(value.stateHash)) {
    throw new ReplayError('E_REPLAY_VERSION', `trace.stateHash must match qth1:<64 lowercase hex>, got ${String(value.stateHash)}`);
  }
  // Fresh normalized record — never hand back the untrusted object.
  return {
    formatVersion: '1',
    kernelSchemaVersion: KERNEL_SCHEMA_VERSION,
    specVersion: SPEC_VERSION,
    ologVersion: OLOG_VERSION,
    w: value.w,
    h: value.h,
    tickCount: value.tickCount,
    ops: /** @type {any} */ (value.ops).map(cloneOp),
    cellsHex: value.cellsHex,
    table: value.table.map((v) => ({ slot: v.slot, x: v.x, y: v.y, resonance: v.resonance })),
    events: value.events.map((e) => ({ kind: 'twin', x: e.x, y: e.y, slot: e.slot, resonance: e.resonance, term: e.term, tick: e.tick })),
    stateHash: value.stateHash,
  };
}

/**
 * @typedef {{
 *   substrate: Substrate;
 *   hash: string;
 *   matches: boolean;
 *   eventsByTick: ReadonlyArray<ReadonlyArray<TwinEvent>>;
 * }} ReplayResult
 */

/**
 * Replay = determinism, period. Re-creates the substrate from the trace's
 * op-log and tick count, runs it forward, and compares hashes. Algorithm is
 * normative: OLOG-SPEC §6 (v0.1: with per-tick options removed from core,
 * replay applies ops at boundaries and ticks with NO options — the
 * pseudocode's per-tick `opts` parameter is gone; §4 rule 5 is retracted).
 *
 * DETERMINISM RECEIPT (RC-05 split — binding wording; do not paraphrase,
 * do not upgrade either half without a new adjudication):
 *   tick determinism:   PRICED (corpus 12/12 + g2-corpus 24/24, four
 *                       languages, external rebuilder).
 *   op-log determinism: NOT YET PRICED (P1 exit: differential fuzzer +
 *                       multi-writer corpus — see falsification-bench).
 * What that means for THIS function: single-writer logs produced and
 * replayed by THIS build are exact — that is priced. Whether INDEPENDENT
 * implementations agree on multi-writer op ordering, float serialization
 * at the seams, and validation corners is the unpriced half this function
 * CANNOT promise yet; the falsification-bench differential fuzzer and
 * multi-writer corpus are the P1 exit that will price it. Until then:
 * cross-implementation replay agreements are anecdote, not receipt.
 *
 * @param {unknown} trace
 * @param {{ expectMatch?: boolean }} [opts] When true (default), a hash
 *        mismatch throws ReplayError E_REPLAY_HASH instead of returning
 *        matches:false — use false when deliberately probing cross-version
 *        divergence.
 * @returns {ReplayResult}
 */
export function replayTrace(trace, opts = {}) {
  const expectMatch = opts.expectMatch !== false;
  const t = validateTrace(trace);
  // §6: rebuild from the record. The empty seed is the whole point — the
  // seed IS the ops at at:0 (Flag 2), so replay needs nothing else.
  const sub = Substrate.create({ w: t.w, h: t.h });
  const eventsByTick = [];
  let i = 0;
  for (let tck = 0; tck < t.tickCount; tck++) {
    const batch = [];
    while (i < t.ops.length && t.ops[i].at === tck) batch.push(t.ops[i++]);
    if (batch.length) sub.inject(batch); // at === tck === sub.ticks — the live-injection law holds by construction
    eventsByTick.push(sub.tick());
  }
  if (i < t.ops.length) {
    sub.inject(t.ops.slice(i)); // post-run ops at at === tickCount (§4 rule 3)
  }
  const hash = sub.hash();
  const matches = hash === t.stateHash;
  if (expectMatch && !matches) {
    throw new ReplayError('E_REPLAY_HASH', `replay produced a different stateHash — expected ${t.stateHash}, got ${hash} (§6 seal step; expectMatch:false probes divergence deliberately)`);
  }
  return { substrate: sub, hash, matches, eventsByTick };
}
