// experiments/_adapter.mjs — kernel resolution + interface normalization for
// lane 33-b (field-smith). COORDINATION LAW: core-smith owns qthe.mjs; this
// lane NEVER edits it. If the real kernel's interface differs from the SPEC.md
// LAYER 0/1 contract assumed at registration (experiments/pre_registration.json),
// THIS file is what gets adapted, loudly, and the adaptation is receipted.
//
// CONTRACT (frozen at registration):
//   makeSubstrate(w, h, seedFn)     seedFn(x, y) -> byte 0..255
//   tick(substrate, opts)           opts.wormholes: boolean; sigma via table/opts
//   mulberry32(seed)                seeded RNG helper
//   WormholeTable                   64-slot table, sigma parameter
//
// Priority: real kernel ../qthe.mjs (if present on disk) -> TEST-ONLY
// experiments/_ref_kernel.mjs (clearly marked, used only while the real kernel
// has not landed; every receipt must record kernelKind).
//
// ADAPTED TO THE LANDED KERNEL (commit 492333e, interpretation receipts R1-R5):
//  - substrate IS a Uint8Array with named props (w, h, ticks, __wormholes) [R5]
//  - tick() returns the NEXT substrate (fresh Uint8Array) — callers reassign
//  - seedFn signature is (i, x, y)
//  - NO persistent per-cell imaginary accumulator exists in the kernel: twin
//    hits are emitted as events {kind:'twin', x, y, slot, resonance, term}.
//    The harness builds the cumulative imaginary meter FROM THE EVENT STREAM
//    (see pre_registration_amendment_1.json — receipted before runs).
//  - _ref_kernel.mjs was NEVER BUILT: the real kernel landed during
//    registration. The TEST-ONLY fallback is dead code that stays unwritten.
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REAL = join(HERE, '..', 'qthe.mjs');
const REF = join(HERE, '_ref_kernel.mjs');

let kernel = null;
let kernelKind = null;
let kernelPath = null;

export async function loadKernel() {
  if (kernel) return { kernelKind, kernelPath, kernel };
  let realExists = false;
  try { statSync(REAL); realExists = true; } catch { realExists = false; }
  if (realExists) {
    const m = await import(REAL); // import failure = kernel bug -> LOUD, no silent fallback
    for (const fn of ['makeSubstrate', 'tick', 'mulberry32', 'WormholeTable']) {
      if (m[fn] === undefined) {
        throw new Error(`_adapter: real kernel ${REAL} lacks contract export '${fn}' — ADAPT _adapter.mjs (never edit qthe.mjs)`);
      }
    }
    kernel = m; kernelKind = 'real'; kernelPath = REAL;
  } else {
    const m = await import(REF);
    kernel = m; kernelKind = 'ref(TEST-ONLY)'; kernelPath = REF;
  }
  return { kernelKind, kernelPath, kernel };
}

// --- byte-plane readback (probe chain; returns Uint8Array or throws ADAPT) ---
export function bytePlane(sub) {
  if (sub instanceof Uint8Array) return sub; // real kernel [R5]
  if (sub.bytes instanceof Uint8Array) return sub.bytes;
  if (sub.buffer instanceof Uint8Array) return sub.buffer;
  if (Array.isArray(sub.cells) && typeof sub.cells[0] === 'number') return Uint8Array.from(sub.cells);
  if (Array.isArray(sub.cells) && sub.cells[0] && typeof sub.cells[0] === 'object') {
    const out = new Uint8Array(sub.cells.length);
    for (let i = 0; i < sub.cells.length; i++) {
      const c = sub.cells[i];
      out[i] = typeof c.c === 'number' ? c.c : (c.byte !== undefined ? c.byte : (c.tau << 6) | c.d);
    }
    return out;
  }
  if (typeof kernel.getByte === 'function') {
    const out = new Uint8Array(sub.w * sub.h);
    for (let y = 0; y < sub.h; y++) for (let x = 0; x < sub.w; x++) out[y * sub.w + x] = kernel.getByte(sub, x, y);
    return out;
  }
  throw new Error('_adapter.bytePlane: no readback path for this kernel — ADAPT _adapter.mjs');
}

// --- imaginary-accumulator readback (floats; NEVER hashed, receipts only) ---
// Returns Float64Array-ish (index y*w+x) or null if the kernel exposes none.
export function imagAcc(sub) {
  if (sub.imag && typeof sub.imag.length === 'number') return sub.imag;
  if (Array.isArray(sub.cells) && sub.cells[0] && typeof sub.cells[0] === 'object' && 'imag' in sub.cells[0]) {
    const out = new Float64Array(sub.cells.length);
    for (let i = 0; i < sub.cells.length; i++) out[i] = Number(sub.cells[i].imag || 0);
    return out;
  }
  if (typeof kernel.getImag === 'function') {
    const out = new Float64Array(sub.w * sub.h);
    for (let i = 0; i < out.length; i++) out[i] = kernel.getImag(sub, i);
    return out;
  }
  return null;
}

// --- mid-run mutation (injector arm, E-Q5 A2) — null if unsupported ---
export function setCell(sub, x, y, byte) {
  if (sub instanceof Uint8Array) { sub[y * sub.w + x] = byte & 0xff; return true; } // real kernel [R5]
  if (sub.bytes instanceof Uint8Array) { sub.bytes[y * sub.w + x] = byte; return true; }
  if (Array.isArray(sub.cells) && typeof sub.cells[0] === 'number') { sub.cells[y * sub.w + x] = byte; return true; }
  if (Array.isArray(sub.cells) && sub.cells[0] && typeof sub.cells[0] === 'object') {
    const c = sub.cells[y * sub.w + x];
    c.c = byte; c.tau = byte >> 6; c.d = byte & 0x3f; return true;
  }
  if (typeof kernel.setByte === 'function') { kernel.setByte(sub, x, y, byte); return true; }
  return null;
}

// --- contract re-exports (call loadKernel() first) ---
export function makeSubstrate(w, h, seedFn) { return kernel.makeSubstrate(w, h, seedFn); }
export function tick(sub, opts) { return kernel.tick(sub, opts); }
export function mulberry32(seed) { return kernel.mulberry32(seed); }
export function WormholeTable(sigma) { return new kernel.WormholeTable(sigma); }

export function kernelReport() { return { kernelKind, kernelPath: kernelPath.split('/').slice(-2).join('/') }; }
