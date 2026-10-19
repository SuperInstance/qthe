#!/usr/bin/env node
// experiments/e_q39_autopsy.mjs — post-seal mechanism diagnosis for the
// E-Q39 verdict text (reads no chain, writes no chain): why does the
// cargo-exact split lose provenance at clean? Count local vs escalated
// pair events, occupant identity, and the region geometry of the pairs.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, mulberry32 } from './_adapter.mjs';
import { plantTwinPairs, plantWeather } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 64, H = 64, N = W * H;
const K = 8, THETA = 8, T = 60;
const SEED = 77001;
const regionOf = (x, y) => ((y >> 4) << 1) | (x >> 5);

const KMOD = (await loadKernel()).kernel;
const SIGMA = KMOD.DEFAULT_SIGMA;
const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);

// the split table + tickS (copied minimal from the sealed harness)
class SplitTable {
  constructor() {
    this.lx = []; this.ly = []; this.lr = []; this.lo = [];
    for (let r = 0; r < 8; r++) {
      this.lx.push(new Int32Array(64).fill(-1)); this.ly.push(new Int32Array(64).fill(-1));
      this.lr.push(new Int32Array(64)); this.lo.push(new Uint8Array(64));
    }
    this.gmask = new Uint8Array(8);
  }
  localRead(r, s) { return this.lo[r][s] ? { x: this.lx[r][s], y: this.ly[r][s], resonance: this.lr[r][s] } : null; }
  localWrite(r, s, x, y, res) { this.lx[r][s] = x; this.ly[r][s] = y; this.lr[r][s] = res; this.lo[r][s] = 1; }
}

function tickS(cells, table) {
  const snap = cells.__scratch instanceof Uint8Array && cells.__scratch.length === N
    ? cells.__scratch : (cells.__scratch = new Uint8Array(N));
  snap.set(cells);
  const events = [];
  const escTerm = new Float64Array(N), escRegion = new Int8Array(N).fill(-1);
  const escWX = new Int32Array(N).fill(-1), escWY = new Int32Array(N).fill(-1);
  if (cells.__pending instanceof Uint8Array && cells.__pending.length === N && cells.__pendingSet) {
    const pending = cells.__pending;
    const nextPending = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (!pending[i]) continue;
      const c = snap[i]; const tau = c >> 6, d = c & 63;
      if (tau !== 3) continue;
      const x = i % W, y = (i / W) | 0;
      const ownR = regionOf(x, y), s = d, b = d >> 3;
      const mask = table.gmask[b];
      for (let r = 0; r < 8; r++) {
        if (r === ownR || !(mask & (1 << r))) continue;
        const h2 = table.localRead(r, s);
        if (h2 && (h2.x !== x || h2.y !== y)) {
          escTerm[i] = h2.resonance * SIGMA; escRegion[i] = r;
          escWX[i] = h2.x; escWY[i] = h2.y;
          break;
        }
      }
    }
    cells.__pending = nextPending;
  } else {
    cells.__pending = new Uint8Array(N); cells.__pendingSet = true;
  }
  for (let y = 0; y < H; y++) {
    const yUp = (y + H - 1) % H, yDn = (y + 1) % H;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const c = snap[i];
      const tau = c >> 6, d = c & 63;
      const xL = (x + W - 1) % W, xR = (x + 1) % W;
      let acc = 0;
      let nb = snap[yUp * W + xL]; if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      nb = snap[yUp * W + x];      if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      nb = snap[yUp * W + xR];     if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      nb = snap[y * W + xL];       if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      nb = snap[y * W + xR];       if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      nb = snap[yDn * W + xL];     if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      nb = snap[yDn * W + x];      if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      nb = snap[yDn * W + xR];     if ((nb >> 6) === 1) acc += nb & 63; else if ((nb >> 6) === 2) acc -= nb & 63;
      let pressure = acc;
      if (tau === 3) {
        const ownR = regionOf(x, y), s = d;
        const hit = table.localRead(ownR, s);
        let fired = false;
        if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
          pressure = acc + hit.resonance * SIGMA;
          events.push({ kind: 'twin', x, y, slot: d, level: 'local', wx: hit.x, wy: hit.y });
          fired = true;
        } else {
          cells.__pending[i] = 1;
        }
        if (!fired && escRegion[i] !== -1) {
          pressure = acc + escTerm[i];
          events.push({ kind: 'twin', x, y, slot: d, level: 'escalated', wx: escWX[i], wy: escWY[i] });
        }
        table.localWrite(ownR, s, x, y, Math.abs(acc) + 1);
        table.gmask[d >> 3] |= (1 << ownR);
      }
      cells[i] = (tau << 6) | KMOD.nextD(d, pressure);
    }
  }
  cells.lastEvents = events;
  return cells;
}

// plant (verbatim order)
const rng = mulberry32(SEED);
const pairs = plantTwinPairs(rng, K, W, H, { dMin: 8, dMax: 15 });
const weather = plantWeather(rng, pairs, W, H, {});
const map = new Map();
for (const p of pairs) { map.set(p.a.y * 4096 + p.a.x, packB(3, p.d)); map.set(p.b.y * 4096 + p.b.x, packB(3, p.d)); }
for (const c of weather) map.set(c.y * 4096 + c.x, c.byte);
const seedFn = (x, y) => map.get(y * 4096 + x) ?? 0;
const partnerOf = new Map();
for (const p of pairs) { partnerOf.set(p.a.y * W + p.a.x, p.b.y * W + p.b.x); partnerOf.set(p.b.y * W + p.b.x, p.a.y * W + p.a.x); }

// the pairs' region geometry
console.log('[geometry] pairs and their regions:');
for (const p of pairs) {
  const ra = regionOf(p.a.x, p.a.y), rb = regionOf(p.b.x, p.b.y);
  console.log(`  pair d=${p.d}: a=(${p.a.x},${p.a.y}) r${ra}  b=(${p.b.x},${p.b.y}) r${rb}  ${ra === rb ? 'SAME-REGION' : 'STRADDLED'}`);
}

let sub = makeSubstrate(W, H, seedFn);
const table = new SplitTable();
let pairLocal = 0, pairEsc = 0, partnerLocal = 0, partnerEsc = 0, pairLocalSelfRegion = 0;
let firstEventsByLevel = { local: 0, escalated: 0 };
for (let t = 1; t <= T; t++) {
  sub = tickS(sub, table);
  for (const ev of sub.lastEvents) {
    const idx = ev.y * W + ev.x;
    if (!partnerOf.has(idx)) continue;
    const isPartner = partnerOf.get(idx) === ev.wy * W + ev.wx;
    if (ev.level === 'local') { pairLocal++; if (isPartner) partnerLocal++; }
    else { pairEsc++; if (isPartner) partnerEsc++; }
  }
  if (t <= 10) firstEventsByLevel.local += sub.lastEvents.filter((e) => e.level === 'local').length;
  if (t <= 10) firstEventsByLevel.escalated += sub.lastEvents.filter((e) => e.level === 'escalated').length;
}
console.log(`[events t=1..${T}] pair-cell events: local=${pairLocal} escalated=${pairEsc}`);
console.log(`[attribution] partner: local=${partnerLocal} (${(100 * partnerLocal / Math.max(1, pairLocal)).toFixed(1)}% of local) escalated=${partnerEsc} (${(100 * partnerEsc / Math.max(1, pairEsc)).toFixed(1)}% of escalated)`);
console.log(`[first 10 ticks] all events: local=${firstEventsByLevel.local} escalated=${firstEventsByLevel.escalated}`);
console.log(`[verdict input] pairEvents=${pairLocal + pairEsc} partnerEvents=${partnerLocal + partnerEsc} provFrac=${((partnerLocal + partnerEsc) / (pairLocal + pairEsc)).toFixed(4)}`);
