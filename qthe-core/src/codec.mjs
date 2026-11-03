// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────────
// The checked pure algebra of the 8-bit primitive (LAYER 0), split from the
// engine so the algebra can be consumed with ZERO engine imports (embedded
// ports, WASM shims, the C99 kernel's JS twin). Checked means: out-of-domain
// input THROWS (invariant I3) — the reference kernel masked silently
// (pack(7,100) === pack(3,36)), and silent aliasing is the enemy of
// determinism forensics. The masking semantics survive only in
// @qthe/core/compat, kernel-exact by contract.
//
// ── RECEIPTS ──────────────────────────────────────────────────────────────────
//   api-surface-v0.1.d.ts "@qthe/core/codec" — implements that module 1:1.
//   SPEC.md LAYER 0 items 1-3 — the algebra itself (bijection, Ψ map,
//     split-channel vector pass) is the gifted vision, priced by the house.
//   CRITIQUE.md C2 (receipts V3/V4) — kernel masking defects that core
//     refuses to inherit; preserved only in /compat.
//   ADJUDICATIONS-G1.md amendment 6 / RC-11 — integer-exact split-channel
//     accumulation (COST-OF-EXACTNESS): no floats produced here, ever.
//
// ── INTERCONNECTS ─────────────────────────────────────────────────────────────
//   src/errors.mjs — CodecError codes E_CODEC_TAU/D/BYTE/VECTOR/HORIZON
//   src/engine.mjs — imports TAU/D_MAX semantics for tick + op application
//     (fillRect packs tau+d through pack() here)
//   src/compat.mjs — the UNCHECKED kernel twin of every function here;
//     divergences are deliberate and receipted, never drift
//   c/qthe_core.c · py/qthe_layer0.py — the C99/Python LAYER-0 twins; the
//     g2-corpus cross-checks all four implementations byte-exact
//   tests/run_tests.mjs G1/G4 — the kernel-side gates these functions mirror

import { CodecError } from './errors.mjs';

/** Timbre plane: the 2 high bits of a cell byte. @typedef {0|1|2|3} Tau */
/** Amplitude plane: the 6 low bits. Integer domain 0..63. @typedef {number} D */
/** A packed cell. Integer domain 0..255. @typedef {number} Byte */
/** Ψ map value: Ground → 0, Attract → +1, Repel → −1, Abstain → 'i'. @typedef {0|1|-1|"i"} PsiValue */

/** The four timbres, by name. Frozen: numeric values are digest-relevant. */
export const TAU = Object.freeze({ GROUND: 0, ATTRACT: 1, REPEL: 2, ABSTAIN: 3 });
/** Maximum amplitude (6-bit plane). */
export const D_MAX = 63;
/** Ψ table indexed by τ: [0, 1, -1, 'i']. */
export const PSI = Object.freeze([0, 1, -1, 'i']);

// Domain guards. [2026-11-03][library-craft] decision: non-integer AND
// out-of-range both throw (never mask, never coerce) — the kernel's `& 3` /
// `& 63` made pack(7,100) ≡ pack(3,36), i.e. two different caller intents
// silently identical, which is unreproducible-by-illusion forensics;
// revisit only if a sealed corpus is found to rely on masked writes (the
// remedy then is /compat, never removing these throws). Receipt C2/V4.
function assertTau(tau) {
  if (!Number.isInteger(tau) || tau < 0 || tau > 3) {
    throw new CodecError('E_CODEC_TAU', `tau must be an integer in 0..3, got ${tau}`);
  }
}
function assertD(d) {
  if (!Number.isInteger(d) || d < 0 || d > D_MAX) {
    throw new CodecError('E_CODEC_D', `d must be an integer in 0..${D_MAX}, got ${d}`);
  }
}
function assertByte(c) {
  if (!Number.isInteger(c) || c < 0 || c > 255) {
    throw new CodecError('E_CODEC_BYTE', `byte must be an integer in 0..255, got ${c}`);
  }
}

/**
 * The operator character of a timbre.
 * @param {Tau} tau
 * @returns {PsiValue}
 * @throws {CodecError} E_CODEC_TAU if tau is not an integer in 0..3.
 */
export function psi(tau) {
  assertTau(tau);
  return PSI[tau];
}

/**
 * Pack (τ, d) into one byte. Total bijection on the valid domain.
 * CHECKED: throws E_CODEC_TAU / E_CODEC_D on non-integer or out-of-range
 * input (the kernel's masking survives only in @qthe/core/compat).
 *
 * @param {Tau} tau
 * @param {D} d
 * @returns {Byte}
 * @example pack(TAU.ABSTAIN, 30); // => 0b11_011110 === 0xce
 */
export function pack(tau, d) {
  assertTau(tau);
  assertD(d);
  return (tau << 6) | d;
}

/**
 * Unpack a byte into its planes. Inverse of pack() on 0..255.
 * @param {Byte} c
 * @returns {{ tau: Tau, d: D }}
 */
export function unpack(c) {
  assertByte(c);
  return { tau: (c >> 6) & 3, d: c & D_MAX };
}

/**
 * Timbre plane of a byte.
 * @param {Byte} c
 * @returns {Tau}
 * @throws {CodecError} E_CODEC_BYTE outside 0..255.
 */
export function tauOf(c) {
  assertByte(c);
  return (c >> 6) & 3;
}

/**
 * Amplitude plane of a byte.
 * @param {Byte} c
 * @returns {D}
 * @throws {CodecError} E_CODEC_BYTE outside 0..255.
 */
export function dOf(c) {
  assertByte(c);
  return c & D_MAX;
}

// The exact accumulation horizon: integers are exact in JS while |n| ≤ 2^53.
const HORIZON = 2 ** 53;

/**
 * Integer-exact split-channel vector pass (SPEC LAYER 0 item 3):
 *
 *   y_j^Re = Σ_{τ=1} d·x_k − Σ_{τ=2} d·x_k
 *   y_j^Im = Σ_{τ=3} d·x_k
 *
 * Ground (τ=0) contributes to neither channel. No floats are produced;
 * results are exact while |Re|,|Im| ≤ 2^53 — validated inputs may still
 * overflow the accumulator; the caller owns magnitudes, the library owns the
 * algebra (ADJUDICATIONS-G1 amendment 6 / COST-OF-EXACTNESS).
 *
 * CHECKED (deliberate divergence from the kernel, aligning with the Python
 * cross-impl seam F2 — the kernel rounds silently, core refuses loudly):
 *   - every weight must be an integer 0..255 → E_CODEC_BYTE
 *   - every row length must equal xs.length (ragged rows rejected instead
 *     of producing NaN) → E_CODEC_VECTOR
 *   - every x must be an integer within ±2^53 → E_CODEC_HORIZON
 *
 * @param {ReadonlyArray<Uint8Array|readonly Byte[]>} weights rows of packed QTHE bytes, w[j][k]
 * @param {readonly number[]|Int32Array} xs integer inputs, one per column k
 * @returns {Array<{re: number, im: number}>}
 */
export function vectorPass(weights, xs) {
  if (!Array.isArray(weights)) {
    throw new CodecError('E_CODEC_VECTOR', `weights must be an array of rows, got ${typeof weights}`);
  }
  const hasXs = Array.isArray(xs) || xs instanceof Int32Array;
  if (!hasXs) {
    throw new CodecError('E_CODEC_VECTOR', `xs must be an array or Int32Array, got ${typeof xs}`);
  }
  const nCols = xs.length;
  const out = [];
  for (let j = 0; j < weights.length; j++) {
    const row = weights[j];
    if (!Array.isArray(row) && !(row instanceof Uint8Array)) {
      throw new CodecError('E_CODEC_VECTOR', `weights[${j}] must be an array or Uint8Array, got ${typeof row}`);
    }
    if (row.length !== nCols) {
      throw new CodecError('E_CODEC_VECTOR', `weights[${j}] is ragged: length ${row.length} ≠ xs.length ${nCols}`);
    }
    let re = 0, im = 0;
    for (let k = 0; k < nCols; k++) {
      const c = row[k];
      if (!Number.isInteger(c) || c < 0 || c > 255) {
        throw new CodecError('E_CODEC_BYTE', `weights[${j}][${k}] must be an integer in 0..255, got ${c}`);
      }
      const x = xs[k];
      if (!Number.isInteger(x) || Math.abs(x) > HORIZON) {
        throw new CodecError('E_CODEC_HORIZON', `xs[${k}] must be an integer within ±2^53, got ${x}`);
      }
      const dv = c & D_MAX;
      switch (c >> 6) {
        case 1: re += dv * x; break;   // Attract: +d·x into the real channel
        case 2: re -= dv * x; break;   // Repel:   −d·x into the real channel
        case 3: im += dv * x; break;   // Abstain: +d·x into the imaginary channel
        default: /* Ground: neither channel */ break;
      }
    }
    out.push({ re, im });
  }
  return out;
}
