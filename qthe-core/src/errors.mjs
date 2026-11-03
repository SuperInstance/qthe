// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────────
// The error taxonomy for every @qthe/core module: one stable machine-readable
// `code` per failure class, so callers branch on behavior instead of parsing
// message strings. A file (not inline constants per module) because the codes
// are a FROZEN public contract — "never reorder; only append" (the .d.ts law)
// — and a single table is the only place that law can be enforced by reading.
//
// ── RECEIPTS ──────────────────────────────────────────────────────────────────
//   api-surface-v0.1.d.ts "@qthe/core/errors" — this file implements that
//     module 1:1; the code list there is normative.
//   ADJUDICATIONS-G1.md (2026-11-02) — PrngSeedError as TypeError (not
//     QtheError): argument-domain violations route to TypeError by JS
//     convention; the stable code rides along for programmatic branching.
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────────────
//   src/codec.mjs — throws CodecError (E_CODEC_*) on out-of-domain input
//   src/engine.mjs — throws OpError/ReplayError/SnapshotError/DimensionError;
//     imports PrngSeedError for the checked mulberry32
//   tests/core/run_core_tests.mjs — gate C-HOSTILE asserts exact codes, so a
//     code rename here fails CI, not a stranger's production deploy

/**
 * Stable machine-readable error codes. Never reorder; only append.
 * ("E_CODEC_PRNG_SEED" is carried by PrngSeedError, a TypeError subclass.)
 * @typedef {("E_CODEC_TAU"|"E_CODEC_D"|"E_CODEC_BYTE"|"E_CODEC_VECTOR"|"E_CODEC_HORIZON"|"E_CODEC_PRNG_SEED"|"E_DIM"|"E_OP_UNKNOWN"|"E_OP_SHAPE"|"E_OP_BOUNDS"|"E_OP_AT"|"E_REPLAY_VERSION"|"E_REPLAY_HASH"|"E_SNAPSHOT_VERSION"|"E_SNAPSHOT_SHAPE")} QtheErrorCode
 */

/**
 * Base class for every QtheError thrown by @qthe/core. `code` is stable
 * across releases (append-only); `message` is for humans and is NOT part of
 * any contract.
 */
export class QtheError extends Error {
  /**
   * @param {QtheErrorCode} code
   * @param {string} message
   * @param {{ cause?: unknown }} [options]
   */
  constructor(code, message, options) {
    super(message, options);
    this.name = 'QtheError';
    this.code = code;
  }
}

/** Thrown by codec functions (pack/unpack/psi/vectorPass). */
export class CodecError extends QtheError {
  constructor(code, message, options) { super(code, message, options); this.name = 'CodecError'; }
}
/** Thrown for bad substrate dimensions. */
export class DimensionError extends QtheError {
  constructor(code, message, options) { super(code, message, options); this.name = 'DimensionError'; }
}
/** Thrown when validating or applying an op-log entry. */
export class OpError extends QtheError {
  constructor(code, message, options) { super(code, message, options); this.name = 'OpError'; }
}
/** Thrown when a trace cannot be replayed (stamps, shape, or hash). */
export class ReplayError extends QtheError {
  constructor(code, message, options) { super(code, message, options); this.name = 'ReplayError'; }
}
/** Thrown when a snapshot cannot be restored. */
export class SnapshotError extends QtheError {
  constructor(code, message, options) { super(code, message, options); this.name = 'SnapshotError'; }
}

/**
 * Thrown by @qthe/core's mulberry32() when the seed is not an integer in
 * [0, 2^32) — i.e. non-integer, negative, or ≥ 2^32.
 *
 * [2026-11-03][library-craft] decision: TypeError, not QtheError, because a
 * bad seed is an argument-domain violation and JS convention routes those to
 * TypeError — ordinary argument-validation tooling and muscle memory
 * (`catch (e) { if (e instanceof TypeError) … }`) must catch it; single
 * inheritance forbids also extending QtheError, so the stable code
 * "E_CODEC_PRNG_SEED" rides along for programmatic branching; revisit if a
 * second argument-domain error appears (then promote a shared
 * QtheArgumentError extends TypeError base). Receipt: ADJUDICATIONS-G1
 * (mulberry32 seed validation ruling, folded v0.1).
 */
export class PrngSeedError extends TypeError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'PrngSeedError';
    this.code = 'E_CODEC_PRNG_SEED';
  }
}
