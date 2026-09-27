// fixedpoint/qthe_fixed.mjs — THE QTHE INTEGER FIXED-POINT KERNEL (zero
// dependencies, ESM, EVERY internal value an exact integer).
//
// Task 34-b (kernel-smith). This is the direct answer to the DeepSeek guest
// review finding R5 (situations/guest_rows.jsonl, call 5-R5-resonance-sigma-
// sweep, severity CRITICAL): "resonance*sigma with sigma=log2(3) irrational
// ... directly falsifies A3's 'exact integer arithmetic ... no floats' — the
// no-floats plane is broken the moment any Abstain cell fires." R5's own
// fix (b): "quantize sigma to an integer bridge scale (e.g. sigma_q =
// round(log2(3)*2^16) with fixed-point accumulation and a DECLARED ROUNDING
// RULE), making the whole kernel exact-integer again." This file implements
// exactly that, with S = 2^32, and the law is declared here:
//
// ── REPRESENTATION LAW (R8 — the no-floats plane) ──────────────────────────
//   SCALE      S = 2^32. The bridge scale sigma lives in Q(n,32): the
//              kernel-state quantity is the integer sigma_q = sigma · S.
//   ROUNDING   round-half-toward-+Infinity (ECMAScript Math.round, which the
//              spec defines exactly — half cases go UP; no platform freedom).
//              sigmaToFixed(real) = Math.round(real · 2^32). The multiply by
//              2^32 is an exponent shift (exact in IEEE-754), so sigmaToFixed
//              is a pure function of the caller's double, identical on every
//              conformant platform. This quantizer is the ONLY door a float
//              may enter the kernel through, and it is boundary-only: it runs
//              when a CALLER passes a real sigma (opts.sigma / fromReal), and
//              NEVER inside tick() on the default path.
//   DEFAULT    DEFAULT_SIGMA_Q = 6807362106 — baked as an INTEGER LITERAL.
//              Derivation 1 (real irrational, 60-digit decimal):
//                log2(3) = 1.5849625007211561814537389439478165087598144076
//                          9248106045575...
//                ·2^32    = 6807362105.9837422146520505011774...  -> round
//                           half-up -> 6807362106.
//              Derivation 2 (double path, cross-check):
//                Math.round(Math.log2(3) * 2**32) === 6807362106. Same integer.
//              The DEFAULT plane therefore never evaluates log2(3) at runtime:
//              no Math.log2 call exists in this file at all.
//   OVERFLOW   Policy: refuse loudly, never silently wrap.
//              - sigma domain: [0, 1024). sigma_q domain: [0, 2^42).
//                Violation -> RangeError at the door.
//              - All tick-time intermediates are mathematical integers with
//                proven bounds: acc ∈ [-504, 504] (Moore-8 × d ≤ 63) so
//                acc·S < 2^41; resonance r = |acc|+1 ≤ 505; term = r·sigma_q
//                ≤ 505·2^42 < 2^51 (sigma < 1024); pressure = acc·S + term
//                < 2^52. Every integer < 2^53 is represented EXACTLY by an
//                IEEE-754 double and every +, -, × on such integers returns
//                the exact integer result — so the Number carrier never
//                rounds on this plane. (conformance.mjs proves this
//                empirically per run with a BigInt-carried shadow tick: byte
//                equality Number-carrier vs BigInt-carrier.)
//              - table.write() refuses |resonance| > 2^20 (kernel-reachable
//                max is 505; the guard exists so an injected resonance can
//                never push term past 2^53 silently).
//   SIGN LAW   tick() consumes pressure ONLY through its sign (nextD). The
//              fixed plane's sign decision equals the float kernel's
//              sign(acc + r·sigma) wherever the TRUE pressure is farther
//              than r·2^-33 from 0. For the default sigma (log2(3) ≈ 1.585
//              > 1) the coupling r = |acc|+1 makes |pressure| ≥ sigma ≈ 1.585
//              at EVERY twin hit — orders of magnitude above the r·2^-33
//              quantization band — so the planes agree on every reachable
//              state. Pre-registered exact exception (the sigma=2/3 cooker,
//              see fixedpoint/pre_registration.json): at acc=-2 the float
//              kernel computes -2 + 3·(2/3) === 0 EXACTLY (3·double(2/3)
//              rounds to 2.0) -> hold, while the fixed plane computes
//              -2·S + 3·2863311531 = +1 -> ascend. One S-unit of divergence,
//              engineered, honest, and the ONLY sign disagreement in the
//              entire coupled (acc, sigma) sweep domain.
//   TERM UNIT  Twin events carry term = resonance · sigma_q in S-UNITS (an
//              integer). The float kernel carries resonance · sigma (a
//              float). This is the one deliberate representation difference:
//              for exactly-representable sigma (0.5, 1, 2, 4 — powers of
//              two) term_q/S === term_float exactly; for others |term_q -
//              term_float·S| ≤ r (the a priori quantization band).
//
// BEHAVIOR CONTRACT vs qthe.mjs (parity by construction):
//   Interpretation receipts R1-R7 of qthe.mjs carry over verbatim (toroidal
//   Moore-8, pre-tick snapshot + live wormhole reads, LWW slot writes,
//   self-write guard, substrate expandos, seedFn(x,y,i) x-first, traceView
//   records wormhole STATE). LAYER 0 (pack/unpack/psi/vectorPass), nextD,
//   makeSubstrate and mulberry32 are byte-identical code to qthe.mjs — the
//   float kernel was ALREADY exact-integer there (that is exactly why R5
//   singles out the sigma path as THE breach). mulberry32 stays a CALLER-side
//   helper by contract (its [0,1) output never enters tick(); it is
//   integer-quantized at the makeSubstrate boundary by `& 0xff`).
//
// Stone law: a receipt without a chain is a rumor. This kernel is sealed by
// fixedpoint/receipts/ (stone-v1) with the pre-registered conformance battery
// fixedpoint/conformance.mjs; floors frozen in fixedpoint/pre_registration.json
// BEFORE any run (git history is the witness).

// ── LAYER 0 · the primitive (verbatim from qthe.mjs — already exact) ───────

export const TAU = { GROUND: 0, ATTRACT: 1, REPEL: 2, ABSTAIN: 3 };
export const D_MAX = 63;

// Ψ map (SPEC LAYER 0): {0:0, 1:+1, 2:-1, 3:'i'} — the operator character.
export const PSI = [0, 1, -1, 'i'];
export function psi(tau) { return PSI[tau & 3]; }

// pack/unpack bijection: bit 7-6 = tau, bit 5-0 = d. Exact onto {0..255}.
export function pack(tau, d) { return (((tau & 3) << 6) | (d & D_MAX)) & 0xff; }
export function unpack(c) { return { tau: (c >> 6) & 3, d: c & D_MAX }; }
export function tauOf(c) { return (c >> 6) & 3; }
export function dOf(c) { return c & D_MAX; }

// LAYER 0 item 3 — split-channel vector pass, EXACT integers, no floats.
// Identical code to qthe.mjs vectorPass (it was already integer-exact).
export function vectorPass(weights, xs) {
  const out = [];
  for (let j = 0; j < weights.length; j++) {
    const row = weights[j];
    let re = 0, im = 0;
    for (let k = 0; k < row.length; k++) {
      const c = row[k] & 0xff;
      const dv = c & D_MAX, x = xs[k];
      switch (c >> 6) {
        case 1: re += dv * x; break;   // Attract: +d·x into the real channel
        case 2: re -= dv * x; break;   // Repel:   -d·x into the real channel
        case 3: im += dv * x; break;   // Abstain: +d·x into the imaginary channel
        default: /* Ground: neither channel */ break;
      }
    }
    out.push({ re, im });
  }
  return out;
}

// ── LAYER 1 · the fixed-point bridge scale (R8) ────────────────────────────

export const SCALE = 2 ** 32;                 // S: fixed-point denominator
export const MAX_SIGMA_REAL = 1024;           // sigma domain [0, 1024)
export const MAX_SIGMA_Q = 1024 * SCALE;      // sigma_q domain [0, 2^42)
export const RESONANCE_MAX = 2 ** 20;         // write() refuses beyond this

// Baked integer literal — derivations in the header. NO Math.log2 anywhere.
export const DEFAULT_SIGMA_Q = 6807362106;    // round(log2(3) · 2^32)
export const DEFAULT_SIGMA_REAL = 'log2(3)';  // receipt-safe tag, never a float

// The ONE float door (boundary-only, never called inside tick()).
// Math.round: half-toward-+Infinity, exact per ECMAScript spec.
// real·2^32: exponent shift, exact in IEEE-754. Deterministic cross-platform.
export function sigmaToFixed(sigma) {
  if (typeof sigma !== 'number' || !Number.isFinite(sigma) || sigma < 0 || sigma >= MAX_SIGMA_REAL) {
    throw new RangeError('sigma out of fixed-point domain [0, 1024): ' + sigma);
  }
  return Math.round(sigma * SCALE);
}

// Outbound diagnostic door (floats OUTSIDE the kernel state only): the real
// value a fixed-point sigma_q stands for. Never used inside tick().
export function sigmaFromFixed(sigmaQ) {
  if (!Number.isInteger(sigmaQ) || sigmaQ < 0 || sigmaQ >= MAX_SIGMA_Q) {
    throw new RangeError('sigma_q out of domain [0, 2^42): ' + sigmaQ);
  }
  return sigmaQ / SCALE;
}

// The kernel's coupled twin pressure in S-units: acc·S + (|acc|+1)·sigma_q.
// Exported so audits recompute the kernel's ACTUAL arithmetic, not a copy.
export function twinPressureQ(acc, sigmaQ) {
  return acc * SCALE + (Math.abs(acc) + 1) * sigmaQ;
}

// ── LAYER 1 · item 4 — the 64-slot wormhole table (integer sigma_q) ────────

export const SLOT_COUNT = 64;

// Same table mechanics as qthe.mjs (R2 live reads, R4 LWW writes, G3/G6
// snapshot shape). The ONLY change: the constructor takes sigma_q in S-units
// (an integer) — a real sigma goes through WormholeTable.fromReal(), the
// declared boundary door. sigma >= 1024 -> RangeError (overflow policy).
export class WormholeTable {
  constructor(sigmaQ = DEFAULT_SIGMA_Q) {
    if (!Number.isInteger(sigmaQ) || sigmaQ < 0 || sigmaQ >= MAX_SIGMA_Q) {
      throw new RangeError('sigma_q out of fixed-point domain [0, 2^42): ' + sigmaQ);
    }
    this.sigmaQ = sigmaQ;
    this.sx = new Int32Array(SLOT_COUNT).fill(-1);
    this.sy = new Int32Array(SLOT_COUNT).fill(-1);
    this.sr = new Int32Array(SLOT_COUNT);          // resonance = |real_acc|+1
    this.occupied = new Uint8Array(SLOT_COUNT);
    this.totalWrites = 0;                          // cumulative, deterministic
  }
  static fromReal(sigma) { return new WormholeTable(sigmaToFixed(sigma)); }
  clear() {
    this.sx.fill(-1); this.sy.fill(-1); this.sr.fill(0);
    this.occupied.fill(0); this.totalWrites = 0;
    return this;
  }
  read(slot) {
    if (!(slot >= 0 && slot < SLOT_COUNT) || !this.occupied[slot]) return null;
    return { x: this.sx[slot], y: this.sy[slot], resonance: this.sr[slot] };
  }
  write(slot, x, y, resonance) {
    if (!(slot >= 0 && slot < SLOT_COUNT)) throw new RangeError('wormhole slot out of range: ' + slot);
    if (!Number.isInteger(resonance) || Math.abs(resonance) > RESONANCE_MAX) {
      throw new RangeError('resonance out of fixed-point domain [-2^20, 2^20]: ' + resonance);
    }
    this.sx[slot] = x; this.sy[slot] = y;
    this.sr[slot] = resonance; this.occupied[slot] = 1;
    this.totalWrites++;
  }
  occupiedCount() {
    let n = 0;
    for (let i = 0; i < SLOT_COUNT; i++) n += this.occupied[i];
    return n;
  }
  // Deterministic JSON-able view for traces (G3/G6 seal this). Same shape as
  // the float kernel's snapshot: sigma_q does NOT enter it.
  snapshot() {
    const slots = new Array(SLOT_COUNT).fill(null);
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (this.occupied[i]) slots[i] = { slot: i, x: this.sx[i], y: this.sy[i], resonance: this.sr[i] };
    }
    return slots;
  }
}

// ── LAYER 1 · item 5 — substrate + Moore-8 tick (verbatim mechanics) ───────

// Uint8Array of packed cells, row-major, w*h. seedFn(x, y, i) -> byte
// (R6: x-first; usually built on mulberry32 — a seeded CALLER-side generator).
export function makeSubstrate(w, h, seedFn) {
  if (!Number.isInteger(w) || w < 1 || !Number.isInteger(h) || h < 1) {
    throw new RangeError('substrate dimensions must be positive integers');
  }
  const cells = new Uint8Array(w * h);
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i++) cells[i] = seedFn(x, y, i) & 0xff;
  }
  cells.w = w; cells.h = h; cells.ticks = 0; cells.__wormholes = undefined;
  cells.bytes = cells;   // frozen field-lane bytePlane() contract (R6)
  return cells;
}

// THE rule table (item 5), pure and exported so gates can exhaust it.
// Identical to qthe.mjs: pressure sign is the ONLY thing consumed.
export function nextD(d, pressure) {
  if (pressure > 0) return d < D_MAX ? d + 1 : D_MAX;
  if (pressure < 0) return d > 0 ? d - 1 : 0;
  return d;
}

// One synchronous Moore-8 tick (toroidal, R1). MUTATES in place, returns the
// substrate (R6). opts:
//   wormholes : true (default) — Abstain cells read/write the table
//               false — the table is never touched (paired-arm OFF arm)
//   table     : a persistent WormholeTable; default = the substrate's own
//               lazy table (cells.__wormholes), created on first use with
//               the BAKED DEFAULT_SIGMA_Q (no float touched)
//   sigmaQ    : override the bridge scale for this tick, in S-UNITS (integer)
//   sigma     : a REAL sigma (e.g. 0.5 from a sweep) — quantized at this
//               boundary door by sigmaToFixed (the one declared float door).
//               Precedence: sigmaQ wins over sigma.
// Returns the SAME substrate, advanced one tick. Twin events:
//   { kind:'twin', x, y, slot, resonance, term }  (term = resonance·sigma_q,
//   an INTEGER in S-units — the float kernel's term·S up to the R8 band).
export function tick(cells, opts = {}) {
  const w = cells.w, h = cells.h;
  if (!(w > 0 && h > 0)) throw new Error('not a substrate — use makeSubstrate()');
  const wormholes = opts.wormholes !== false;
  let table = opts.table !== undefined ? opts.table : cells.__wormholes;
  if (wormholes && !(table instanceof WormholeTable)) {
    table = (opts.sigmaQ !== undefined) ? new WormholeTable(opts.sigmaQ)
          : (opts.sigma !== undefined ? new WormholeTable(sigmaToFixed(opts.sigma))
          : new WormholeTable(DEFAULT_SIGMA_Q));   // lazy persistent default, baked integer
  }
  // sigma_q resolution (mirrors the float kernel's sigma resolution order):
  const sigmaQ = opts.sigmaQ !== undefined ? opts.sigmaQ
    : (opts.sigma !== undefined ? sigmaToFixed(opts.sigma)
    : (table ? table.sigmaQ : DEFAULT_SIGMA_Q));
  if (!Number.isInteger(sigmaQ) || sigmaQ < 0 || sigmaQ >= MAX_SIGMA_Q) {
    throw new RangeError('sigma_q out of fixed-point domain [0, 2^42): ' + sigmaQ);
  }
  const n = w * h;
  const snap = cells.__scratch instanceof Uint8Array && cells.__scratch.length === n
    ? cells.__scratch : (cells.__scratch = new Uint8Array(n));
  snap.set(cells);                                  // pre-tick neighbor snapshot
  const events = [];

  for (let y = 0; y < h; y++) {
    const yUp = (y + h - 1) % h, yDn = (y + 1) % h;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = snap[i];
      const tau = c >> 6, d = c & D_MAX;

      // real accumulator over Moore-8 (pre-tick grid, R2): Attract +d, Repel -d
      const xL = (x + w - 1) % w, xR = (x + 1) % w;
      let acc = 0;
      let nb = snap[yUp * w + xL]; if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
      nb = snap[yUp * w + x];      if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
      nb = snap[yUp * w + xR];     if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
      nb = snap[y * w + xL];       if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
      nb = snap[y * w + xR];       if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
      nb = snap[yDn * w + xL];     if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
      nb = snap[yDn * w + x];      if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;
      nb = snap[yDn * w + xR];     if ((nb >> 6) === 1) acc += nb & D_MAX; else if ((nb >> 6) === 2) acc -= nb & D_MAX;

      let pressure = acc;
      if (tau === 3 && wormholes) {
        const hit = table.read(d);                    // live read (R2)
        if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
          const term = hit.resonance * sigmaQ;        // twin resonance, item 4 — INTEGER (S-units)
          pressure = acc * SCALE + term;              // imaginary pressure (R3), scaled domain
          events.push({ kind: 'twin', x, y, slot: d, resonance: hit.resonance, term });
        }
        table.write(d, x, y, Math.abs(acc) + 1);      // write for the next tick
      }
      cells[i] = (tau << 6) | nextD(d, pressure);   // in place (R6); tau frozen
    }
  }
  cells.ticks = (cells.ticks | 0) + 1;
  cells.__wormholes = wormholes ? table : cells.__wormholes;
  cells.lastEvents = events;
  return cells;
}

// ── telemetry (verbatim shape; the fixed kernel's own table class) ─────────

export function traceView(cells, events) {
  const table = cells.__wormholes instanceof WormholeTable ? cells.__wormholes : null;
  return {
    w: cells.w, h: cells.h, ticks: cells.ticks | 0,
    cells: Array.from(cells),
    wormholes: table && table.occupiedCount() > 0 ? table.snapshot() : null,
    events: events !== undefined ? events : (cells.lastEvents || []),
  };
}

// mulberry32 — SEEDED PRNG for callers (substrate seeding, probes, demo
// patterns). NEVER called inside tick(); the kernel's determinism does not
// depend on it. VERBATIM from qthe.mjs (behavior parity): its [0,1) output is
// caller-side only and is integer-quantized at the makeSubstrate boundary
// (`& 0xff`) — it never enters the kernel's state arithmetic.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
