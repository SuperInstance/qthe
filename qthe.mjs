// qthe/qthe.mjs — THE QTHE REFERENCE KERNEL (zero dependencies, ESM,
// integer-exact where the spec says exact).
//
// The primitive: one byte, two planes — 6 bits of spatial amplitude `d`,
// 2 bits of timbre `tau` {Ground, Attract, Repel, Abstain}. Data is geometry,
// control is physics. Source: SPEC.md (the gifted vision, priced by the
// house); this file implements LAYER 0 (algebra facts, exhaustively tested
// by tests/run_tests.mjs) and LAYER 1 (mechanism, determinism-checked).
//
// DETERMINISM CONTRACT: no Math.random anywhere in the kernel. mulberry32()
// lives here as a SEEDED generator for CALLERS (substrate seeding, probes);
// tick() never draws from it. Same substrate + same opts -> byte-identical
// state, always (proof by exhaustion of runs: tests G3).
//
// INTERPRETATION RECEIPTS (choices the SPEC leaves open, made explicit —
// each is priced, not LARPed; change one and the tests' pre-registered
// fixtures must be re-derived):
//   R1  Edges are TOROIDAL (Moore-8 wraps). Every cell has exactly 8
//       neighbors, so the update rule is one uniform table — no special case.
//   R2  Neighbors are read from the PRE-tick grid (synchronous update,
//       double-buffered). The wormhole table, however, is read LIVE in
//       row-major cell order: a cell that writes slot s before a same-tick
//       reader reaches it is heard the same tick. SPEC says the write lands
//       "for the next tick"; live reads make equal-d twins mutually resonate
//       from their second co-tick on (G5 pins the exact schedule), which is
//       the mechanism claim C2 prices. Order is fixed => deterministic.
//   R3  Abstain cells (tau=3) still accumulate real_acc from their
//       neighborhood (their resonance = |real_acc| + 1 needs it), and on a
//       twin hit the imaginary term resonance*sigma is ADDED to the pressure
//       whose sign moves d. The data rule table (item 5) is untouched — the
//       imaginary channel enters through the only degree of freedom the byte
//       has (tau is frozen inside tick, d is bounded). This makes sigma
//       EMPIRICALLY POTENT: with sigma=log2(3)~1.585 a lone twin (resonance
//       1) flips exactly one unit of net-negative pressure; the C3 sigma
//       sweep is a real dynamics sweep, not decoration.
//   R4  Wormhole WRITES collide last-writer-wins per slot (64 slots, one
//       occupant each), but live reads (R2) keep same-slot twins mutually
//       audible. A cell never resonates with its OWN write (guard:
//       different (x,y) AND resonance != 0).
//   R5  makeSubstrate/tick carry the grid dimensions, tick counter, the
//       persistent wormhole table and a self-readback shim as named
//       properties on the Uint8Array (w, h, ticks, __wormholes, bytes).
//       `bytes` points at the substrate itself: the field lane's frozen
//       bytePlane() contract reads sub.bytes. Serialize state with
//       traceView(), not JSON.stringify (the expandos stay out of it).
//   R6  CROSS-LANE CONTRACT (frozen by lane 33-b's pre_registration.json
//       BEFORE this kernel landed — the newcomer fits the earlier record):
//       seedFn(x, y, i) — x first, index optional third; tick(sub, opts)
//       MUTATES the substrate in place AND returns it (callers may reassign
//       or not). Neighbors always come from the pre-tick snapshot, so
//       in-place update stays synchronous-exact.
//
// Stone law: a receipt without a chain is a rumor. Tests seal G1-G6 into
// tests/receipts.jsonl (stone-v1) with observed numbers; honest FAILs stay.

// ── LAYER 0 · the primitive ────────────────────────────────────────────────

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

// LAYER 0 item 3 — split-channel vector pass, EXACT integers, no floats:
//   y_j^R = Σ_{tau=1} d·x_k  −  Σ_{tau=2} d·x_k
//   y_j^I = Σ_{tau=3} d·x_k
// Ground (tau=0) contributes to neither channel even when d>0. weights is an
// array of rows; each row is an array of packed QTHE bytes w_jk; xs are the
// integer inputs. Returns [{re, im}] per output channel j.
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

// ── LAYER 1 · item 4 — the 64-slot wormhole table ──────────────────────────

export const SLOT_COUNT = 64;
export const DEFAULT_SIGMA = Math.log2(3); // the bridged scale, swept by C3

// Exactly 64 slots. Slot s is empty or {x, y, resonance} — the compile-time
// blueprint: static allocation, zero runtime discovery (the GraphQL insight,
// receipted in SPEC.md). sigma is a parameter (default log2(3)).
export class WormholeTable {
  constructor(sigma = DEFAULT_SIGMA) {
    this.sigma = sigma;
    this.sx = new Int32Array(SLOT_COUNT).fill(-1);
    this.sy = new Int32Array(SLOT_COUNT).fill(-1);
    this.sr = new Int32Array(SLOT_COUNT);          // resonance = |real_acc|+1
    this.occupied = new Uint8Array(SLOT_COUNT);
    this.totalWrites = 0;                          // cumulative, deterministic
  }
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
    this.sx[slot] = x; this.sy[slot] = y;
    this.sr[slot] = resonance; this.occupied[slot] = 1;
    this.totalWrites++;
  }
  occupiedCount() {
    let n = 0;
    for (let i = 0; i < SLOT_COUNT; i++) n += this.occupied[i];
    return n;
  }
  // Deterministic JSON-able view for traces (G3/G6 seal this).
  snapshot() {
    const slots = new Array(SLOT_COUNT).fill(null);
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (this.occupied[i]) slots[i] = { slot: i, x: this.sx[i], y: this.sy[i], resonance: this.sr[i] };
    }
    return slots;
  }
}

// ── LAYER 1 · item 5 — substrate + Moore-8 tick ────────────────────────────

// Uint8Array of packed cells, row-major, w*h. seedFn(i, x, y) -> byte
// (usually built on mulberry32 — a seeded CALLER-side generator).
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

// THE rule table (item 5), pure and exported so G2 can exhaust it:
// net-positive pressure -> d toward saturation min(d+1, 63); net-negative
// -> toward 0; zero -> unchanged. tau NEVER changes here (R3/R4: timbre is
// written only by injectors, never by tick — this keeps C2 paired arms clean).
export function nextD(d, pressure) {
  if (pressure > 0) return d < D_MAX ? d + 1 : D_MAX;
  if (pressure < 0) return d > 0 ? d - 1 : 0;
  return d;
}

// One synchronous Moore-8 tick (toroidal, R1). MUTATES the substrate in
// place and returns it (R6, the field lane's frozen contract); neighbors are
// read from a pre-tick snapshot so the update stays synchronous-exact. opts:
//   wormholes : true (default) — Abstain cells read/write the table
//               false — the table is never touched (paired-arm OFF arm, G6)
//   table     : a persistent WormholeTable; default = the substrate's own
//               lazy table (cells.__wormholes), created on first use
//   sigma     : override the bridge scale for this tick (C3 sweeps)
// Returns the SAME substrate, advanced one tick (dims/ticks/table ride along). Wormhole twin hits are emitted as events:
//   { kind:'twin', x, y, slot, resonance, term }  (term = resonance * sigma)
export function tick(cells, opts = {}) {
  const w = cells.w, h = cells.h;
  if (!(w > 0 && h > 0)) throw new Error('not a substrate — use makeSubstrate()');
  const wormholes = opts.wormholes !== false;
  let table = opts.table !== undefined ? opts.table : cells.__wormholes;
  if (wormholes && !(table instanceof WormholeTable)) {
    table = new WormholeTable(opts.sigma);          // lazy persistent default
  }
  const sigma = opts.sigma !== undefined ? opts.sigma : (table ? table.sigma : DEFAULT_SIGMA);
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
          const term = hit.resonance * sigma;         // twin resonance, item 4
          pressure = acc + term;                      // imaginary pressure (R3)
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

// ── telemetry & seeded randomness (callers only, never tick) ───────────────

// Canonical JSON-able view of substrate + table + this tick's events — the
// thing G3/G6 hash and the A2UI HUD displays. Cells are copied by value; the
// expandos (w/h/ticks/bytes/__scratch/__) never enter the view.
// R7 (found by gate G6 run 1 — the flag leaked into traces): the view records
// wormhole STATE, not the flag — an EMPTY table is trace-equivalent to
// wormholes disabled. Without Abstain cells the paired arms are byte-equal.
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
// depend on it. Returns a function in [0, 1).
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
