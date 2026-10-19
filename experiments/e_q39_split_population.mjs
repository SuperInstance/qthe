// experiments/e_q39_split_population.mjs — E-Q39 (ORCH-R29 lane T20-a):
// THE 8x64+8 HIERARCHICAL SURVIVOR — region-splitting WITHOUT folding,
// the design C9's autopsy named 'the untested survivor'. The folded design
// (8 regions x 8 slots, s = d&7) died with prejudice because eight cargo
// classes shared each regional slot and d-drift swept every writer through
// the whole compressed space. The survivor: 8 regions x 64 cargo-exact
// slots (s = d) + 8 global presence buckets = 520 slots. Ladder/seeds/
// floors byte-identical to E-Q18 (F-CAL vs E-Q17's sealed rows).
// Registration: experiments/pre_registration_e_q39.json (pre-run).
// qthe.mjs is NEVER touched (the adapter law).
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport, WormholeTable } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });
const CHAIN = join(RECEIPTS, 'e_q39_chain.jsonl');

const W = 64, H = 64, N = W * H;
const K = 8, THETA = 8, T = 200;
const SEEDS = [77001, 77002, 77003, 77004, 77005, 77006, 77007, 77008, 77009, 77010];
const NPOLL_LADDER = [0, 16, 32, 64, 128, 256]; // EQ18-AM2: nPoll doubling from 16 (0+256 preserve F-CAL); writer pops 16/32/48/80/144/272
const CP = [0, 50, 100, 150, 200];
const SIGMA_DEFAULT = 'kernel log2(3)';

const { stone, stonePath } = await linkStone();
const KMOD = (await loadKernel()).kernel;
const { kernelKind } = await loadKernel();
const SIGMA = KMOD.DEFAULT_SIGMA;
console.log(`[e-q39] kernel=${kernelKind} stone=${stonePath}`);
const preRegSha = fileSha256(join(HERE, 'pre_registration_e_q39.json'));

const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);

// ═══════════════════════════════════════════════════════════════════════════
// REGION MAP (compile-time, the registration's frozen partition)
// ═══════════════════════════════════════════════════════════════════════════
const regionOf = (x, y) => ((y >> 4) << 1) | (x >> 5); // 8 regions of 32x16 on 64x64

// ═══════════════════════════════════════════════════════════════════════════
// FLAT SIDE — the real kernel + E-Q14/E-Q17 instrumentation, VERBATIM
// ═══════════════════════════════════════════════════════════════════════════
function makeInstrumentedTable() {
  const t = new WormholeTable(SIGMA);
  const readsLog = [];
  const origRead = t.read.bind(t);
  t.read = (slot) => { const r = origRead(slot); readsLog.push({ slot, hit: r ? { x: r.x, y: r.y, resonance: r.resonance } : null }); return r; };
  return { table: t, readsLog };
}

// VERBATIM E-Q14 recoverProvenance (the recovery of record; F-CAL pins it).
function recoverProvenanceVerbatim(events, readsLog) {
  const used = new Array(readsLog.length).fill(false);
  const out = [];
  for (const ev of events) {
    let src = null;
    for (let i = 0; i < readsLog.length; i++) {
      if (used[i]) continue;
      const rl = readsLog[i];
      if (rl.slot === ev.slot && rl.hit && rl.hit.resonance === ev.resonance && (rl.hit.x !== ev.x || rl.hit.y !== ev.y)) { src = rl.hit; used[i] = true; break; }
    }
    out.push({ ev, occupant: src });
  }
  return out;
}

// Direct-causation attribution (the pre-registered secondary flat metric):
// every Abstain cell reads exactly once per tick in row-major order, so the
// k-th read of the tick belongs to the k-th Abstain cell of the pre-tick
// snapshot. An event's (x,y) identifies its reader => its exact read.
function directOccupants(events, readsLog, snap) {
  const abstainOrder = [];
  for (let i = 0; i < N; i++) if ((snap[i] >> 6) === 3) abstainOrder.push(i);
  if (abstainOrder.length !== readsLog.length) throw new Error(`direct attribution: read count ${readsLog.length} != Abstain count ${abstainOrder.length} — LOUD`);
  const readerToRead = new Map(); // reader idx -> readsLog index
  for (let k = 0; k < abstainOrder.length; k++) readerToRead.set(abstainOrder[k], k);
  const out = [];
  for (const ev of events) {
    const k = readerToRead.get(ev.y * W + ev.x);
    if (k === undefined) throw new Error('direct attribution: event cell is not an Abstain reader — LOUD');
    const rl = readsLog[k];
    out.push({ ev, occupant: rl.hit ? { x: rl.hit.x, y: rl.hit.y, resonance: rl.hit.resonance } : null });
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPLIT SIDE — the survivor's table: 8 regions x 64 cargo-exact slots (s=d,
// NO FOLD) + 8 global presence buckets. tickS = the E-Q18 tickH transcription
// with the slot width changed (F4: only the slot width changes).
// ═══════════════════════════════════════════════════════════════════════════
class TwoLevelTable {
  constructor() {
    this.lx = []; this.ly = []; this.lr = []; this.lo = []; // 8 regions x 64 slots (s = d)
    for (let r = 0; r < 8; r++) {
      this.lx.push(new Int32Array(64).fill(-1)); this.ly.push(new Int32Array(64).fill(-1));
      this.lr.push(new Int32Array(64)); this.lo.push(new Uint8Array(64));
    }
    this.gmask = new Uint8Array(8); // 8 buckets, 8-bit region presence
    this.localWrites = 0; this.globalWrites = 0;
    this.escalations = 0; this.escalatedEvents = 0;
  }
  localRead(r, s) { return this.lo[r][s] ? { x: this.lx[r][s], y: this.ly[r][s], resonance: this.lr[r][s] } : null; }
  localWrite(r, s, x, y, res) { this.lx[r][s] = x; this.ly[r][s] = y; this.lr[r][s] = res; this.lo[r][s] = 1; this.localWrites++; }
  localOccupied() { let n = 0; for (let r = 0; r < 8; r++) for (let s = 0; s < 64; s++) n += this.lo[r][s]; return n; }
  globalOccupied() { let n = 0; for (let b = 0; b < 8; b++) n += (this.gmask[b] !== 0 ? 1 : 0); return n; }
}

class FlatShimTable {
  // The F0-T control table: one region, 64 slots, s = d, LWW live row-major —
  // EXACTLY the kernel's WormholeTable discipline (event fields kernel-shaped).
  constructor() { this.sx = new Int32Array(64).fill(-1); this.sy = new Int32Array(64).fill(-1); this.sr = new Int32Array(64); this.so = new Uint8Array(64); this.writes = 0; }
  read(x, y, d) { return this.so[d] ? { x: this.sx[d], y: this.sy[d], resonance: this.sr[d] } : null; }
  write(x, y, d, acc) { this.sx[d] = x; this.sy[d] = y; this.sr[d] = Math.abs(acc) + 1; this.so[d] = 1; this.writes++; }
}

// tickH — the transcription of qthe.mjs tick(). IDENTICAL loop structure;
// nextD imported from the real kernel; the Abstain branch calls the pluggable
// table with reader coordinates explicit. mode: 'flat' (F0-T control) or
// 'hier' (the two-level design, escalation per the registration).
function tickH(cells, mode, table) {
  const snap = cells.__scratch instanceof Uint8Array && cells.__scratch.length === N
    ? cells.__scratch : (cells.__scratch = new Uint8Array(N));
  snap.set(cells);
  const events = [];
  let escTerm = null, escRegion = null, escWX = null, escWY = null;

  if (mode === 'hier') {
    // Escalation pass FIRST, row-major cell order, reading the tick-STALE
    // tables (state as of end of tick t-1). One-shot: pending flags set by
    // last tick's local misses.
    escTerm = new Float64Array(N); escRegion = new Int8Array(N).fill(-1);
    escWX = new Int32Array(N).fill(-1); escWY = new Int32Array(N).fill(-1);
    if (cells.__pending instanceof Uint8Array && cells.__pending.length === N) {
      const pending = cells.__pending;
      const nextPending = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        if (!pending[i]) continue;
        const c = snap[i]; const tau = c >> 6, d = c & 63;
        if (tau !== 3) { continue; } // tau is frozen in-tick; vacuous guard kept
        const x = i % W, y = (i / W) | 0;
        const ownR = regionOf(x, y), s = d, b = d >> 3;
        const mask = table.gmask[b];
        for (let r = 0; r < 8; r++) {
          if (r === ownR || !(mask & (1 << r))) continue;
          const h2 = table.localRead(r, s);
          if (h2 && (h2.x !== x || h2.y !== y)) {
            escTerm[i] = h2.resonance * SIGMA; escRegion[i] = r;
            escWX[i] = h2.x; escWY[i] = h2.y;
            table.escalations++;
            break; // FIRST foreign hit in fixed region order (the frozen rule)
          }
        }
        // pending cleared either way (one-shot; a fresh miss re-arms below)
      }
      cells.__pending = nextPending; // will be filled by THIS tick's misses
    } else {
      cells.__pending = new Uint8Array(N);
    }
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
        if (mode === 'flat') {
          const hit = table.read(x, y, d);
          if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
            const term = hit.resonance * SIGMA;
            pressure = acc + term;
            events.push({ kind: 'twin', x, y, slot: d, resonance: hit.resonance, term });
          }
          table.write(x, y, d, acc);
        } else {
          const ownR = regionOf(x, y), s = d;
          const hit = table.localRead(ownR, s);
          let fired = false;
          if (hit && hit.resonance !== 0 && (hit.x !== x || hit.y !== y)) {
            const term = hit.resonance * SIGMA;
            pressure = acc + term;
            events.push({ kind: 'twin', x, y, slot: d, resonance: hit.resonance, term, level: 'local', writerRegion: ownR, wx: hit.x, wy: hit.y });
            fired = true;
          } else {
            cells.__pending[i] = 1; // local miss => arm escalation for t+1
          }
          if (!fired && escRegion[i] !== -1) {
            // the escalated hit from this tick's pre-pass (stale tables) —
            // EQ18-AM1: occupant recorded AT FIRE TIME (no post-tick read-back)
            pressure = acc + escTerm[i];
            const h2res = Math.round(escTerm[i] / SIGMA); // recover resonance exactly
            events.push({ kind: 'twin', x, y, slot: d, resonance: h2res, term: escTerm[i], level: 'escalated', writerRegion: escRegion[i], wx: escWX[i], wy: escWY[i] });
            table.escalatedEvents++;
          }
          table.localWrite(ownR, s, x, y, Math.abs(acc) + 1);
          table.gmask[d >> 3] |= (1 << ownR);
          table.globalWrites++;
        }
      }
      cells[i] = (tau << 6) | KMOD.nextD(d, pressure);
    }
  }
  cells.ticks = (cells.ticks | 0) + 1;
  cells.lastEvents = events;
  return cells;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANTING — E-Q17 runOnce order, VERBATIM (F-CAL depends on the draw stream)
// ═══════════════════════════════════════════════════════════════════════════
function plant(seed, nPoll) {
  const rng = mulberry32(seed);
  const pairs = plantTwinPairs(rng, K, W, H, { dMin: 8, dMax: 15 });
  const weather = plantWeather(rng, pairs, W, H, {});
  const forbidden = [];
  for (const p of pairs) { forbidden.push(p.a, p.b); }
  const ds = pairs.map((p) => p.d);
  const polluters = [];
  const taken = new Set();
  let guard = 0;
  while (polluters.length < nPoll && guard++ < 200000) {
    const x = Math.floor(rng() * W), y = Math.floor(rng() * H);
    if (forbidden.some((f) => { const dx = Math.abs(f.x - x), dy = Math.abs(f.y - y); return Math.max(Math.min(dx, W - dx), Math.min(dy, H - dy)) < 2; })) continue;
    const key = y * 4096 + x;
    if (taken.has(key)) continue;
    taken.add(key);
    polluters.push({ x, y, d: ds[Math.floor(rng() * ds.length)] });
  }
  if (polluters.length < nPoll) throw new Error('polluter placement budget exhausted — LOUD');
  const map = new Map();
  for (const p of pairs) { map.set(p.a.y * 4096 + p.a.x, packB(3, p.d)); map.set(p.b.y * 4096 + p.b.x, packB(3, p.d)); }
  for (const c of weather) map.set(c.y * 4096 + c.x, c.byte);
  for (const c of polluters) map.set(c.y * 4096 + c.x, packB(3, c.d));
  const seedFn = (x, y) => map.get(y * 4096 + x) ?? 0;
  const partnerOf = new Map();
  for (const p of pairs) { partnerOf.set(p.a.y * W + p.a.x, p.b.y * W + p.b.x); partnerOf.set(p.b.y * W + p.b.x, p.a.y * W + p.a.x); }
  return { pairs, seedFn, partnerOf, polluters };
}

// ═══════════════════════════════════════════════════════════════════════════
// RUNNERS
// ═══════════════════════════════════════════════════════════════════════════
function runFlat(seed, nPoll) {
  const { pairs, seedFn, partnerOf, polluters } = plant(seed, nPoll);
  const { table, readsLog } = makeInstrumentedTable();
  let sub = makeSubstrate(W, H, seedFn);
  const hashes = [planeHash(sub, 0, bytePlane)];
  const abstains0 = Array.from(sub).filter((c) => (c >> 6) === 3).length;
  const meter = new Float64Array(N);
  const firstExceed = new Map();
  let pairEvents = 0, pollutedEvents = 0, partnerEvents = 0;
  let partnerDirect = 0;
  let occupancyMax = 0;
  for (let t = 1; t <= T; t++) {
    readsLog.length = 0;
    const preSnap = new Uint8Array(sub); // direct-attribution snapshot (pre-tick)
    sub = tick(sub, { wormholes: true, table });
    const events = sub.lastEvents;
    const prov = recoverProvenanceVerbatim(events, readsLog);
    const direct = directOccupants(events, readsLog, preSnap);
    for (let j = 0; j < prov.length; j++) {
      const { ev, occupant } = prov[j];
      const idx = ev.y * W + ev.x;
      if (!partnerOf.has(idx)) continue;
      meter[idx] += ev.term;
      if (!firstExceed.has(idx) && meter[idx] >= THETA) firstExceed.set(idx, t);
      pairEvents++;
      if (occupant && partnerOf.get(idx) === occupant.y * W + occupant.x) partnerEvents++;
      else pollutedEvents++;
      const docc = direct[j].occupant;
      if (docc && partnerOf.get(idx) === docc.y * W + docc.x) partnerDirect++;
    }
    if (CP.includes(t)) {
      hashes.push(planeHash(sub, t, bytePlane));
      const occ = table.occupiedCount();
      if (occ > occupancyMax) occupancyMax = occ;
      if (occ > 64) throw new Error(`flat occupancy cap violated (${occ} > 64) — LOUD`);
    }
  }
  const pairDelivers = pairs.map((p) => {
    const ia = p.a.y * W + p.a.x, ib = p.b.y * W + p.b.x;
    const ta = firstExceed.has(ia) ? firstExceed.get(ia) : null;
    const tb = firstExceed.has(ib) ? firstExceed.get(ib) : null;
    return ta !== null && tb !== null ? Math.max(ta, tb) : null;
  });
  return {
    hashes, delivered: pairDelivers.filter((t) => t !== null).length, pairDelivers,
    pairEvents, partnerEvents, pollutedEvents, partnerDirect,
    polluters: polluters.length, abstains0,
    occupancyFinal: table.occupiedCount(), occupancyMax, totalWrites: table.totalWrites,
    escalations: null,
  };
}

function runHier(seed, nPoll) {
  const { pairs, seedFn, partnerOf, polluters } = plant(seed, nPoll);
  const table = new TwoLevelTable();
  let sub = makeSubstrate(W, H, seedFn);
  const hashes = [planeHash(sub, 0, bytePlane)];
  const abstains0 = Array.from(sub).filter((c) => (c >> 6) === 3).length;
  const meter = new Float64Array(N);
  const firstExceed = new Map();
  let pairEvents = 0, pollutedEvents = 0, partnerEvents = 0;
  let writerRegionCorrect = 0, writerRegionTotal = 0;
  let twinEvents = 0;
  let localOccMax = 0, globalOccMax = 0;
  for (let t = 1; t <= T; t++) {
    sub = tickH(sub, 'hier', table);
    const events = sub.lastEvents;
    for (const ev of events) {
      twinEvents++;
      const idx = ev.y * W + ev.x;
      if (!partnerOf.has(idx)) continue;
      meter[idx] += ev.term;
      if (!firstExceed.has(idx) && meter[idx] >= THETA) firstExceed.set(idx, t);
      pairEvents++;
      // occupant attribution is DIRECT for hier (the design's structural gain;
      // EQ18-AM1: both local and escalated events carry (wx, wy) at fire time)
      const occupant = (ev.wx !== undefined && ev.wy !== undefined) ? { x: ev.wx, y: ev.wy } : null;
      if (occupant && partnerOf.get(idx) === occupant.y * W + occupant.x) {
        partnerEvents++;
        writerRegionTotal++;
        const p = pairs.find((pr) => {
          const ia = pr.a.y * W + pr.a.x, ib = pr.b.y * W + pr.b.x;
          return ia === idx || ib === idx;
        });
        const partnerIdx = partnerOf.get(idx);
        const px = partnerIdx % W, py = (partnerIdx / W) | 0;
        if (ev.writerRegion === regionOf(px, py)) writerRegionCorrect++;
      } else pollutedEvents++;
    }
    if (CP.includes(t)) {
      hashes.push(planeHash(sub, t, bytePlane));
      const lo = table.localOccupied(), go = table.globalOccupied();
      if (lo > localOccMax) localOccMax = lo;
      if (go > globalOccMax) globalOccMax = go;
      if (lo > 512) throw new Error(`split local occupancy cap violated (${lo} > 512) — LOUD`);
      if (go > 8) throw new Error(`split global occupancy cap violated (${go} > 8) — LOUD`);
    }
  }
  const pairDelivers = pairs.map((p) => {
    const ia = p.a.y * W + p.a.x, ib = p.b.y * W + p.b.x;
    const ta = firstExceed.has(ia) ? firstExceed.get(ia) : null;
    const tb = firstExceed.has(ib) ? firstExceed.get(ib) : null;
    return ta !== null && tb !== null ? Math.max(ta, tb) : null;
  });
  return {
    hashes, delivered: pairDelivers.filter((t) => t !== null).length, pairDelivers,
    pairEvents, partnerEvents, pollutedEvents,
    polluters: polluters.length, abstains0,
    occupancyFinal: table.localOccupied(), occupancyMax: localOccMax,
    globalOccupancyFinal: table.globalOccupied(), globalOccupancyMax: globalOccMax,
    totalWrites: table.localWrites, globalWrites: table.globalWrites,
    escalations: table.escalations, escalatedEvents: table.escalatedEvents, twinEvents,
    writerRegionCorrect, writerRegionTotal,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// F0-T — the transcription control (flat shim vs the real kernel)
// ═══════════════════════════════════════════════════════════════════════════
function runF0T(seed) {
  const { seedFn } = plant(seed, 0);
  const { table: itable } = makeInstrumentedTable();
  let ksub = makeSubstrate(W, H, seedFn);
  const shim = new FlatShimTable();
  let tsub = makeSubstrate(W, H, seedFn);
  const khashes = [planeHash(ksub, 0, bytePlane)], thashes = [planeHash(tsub, 0, bytePlane)];
  let eventsEqual = true;
  for (let t = 1; t <= T; t++) {
    ksub = tick(ksub, { wormholes: true, table: itable });
    tsub = tickH(tsub, 'flat', shim);
    const ke = ksub.lastEvents, te = tsub.lastEvents;
    if (ke.length !== te.length) { eventsEqual = false; break; }
    for (let j = 0; j < ke.length; j++) {
      const a = ke[j], b = te[j];
      if (a.x !== b.x || a.y !== b.y || a.slot !== b.slot || a.resonance !== b.resonance || a.term !== b.term) { eventsEqual = false; break; }
    }
    if (!eventsEqual) break;
    if (CP.includes(t)) { khashes.push(planeHash(ksub, t, bytePlane)); thashes.push(planeHash(tsub, t, bytePlane)); }
  }
  const planesEqual = khashes.length === thashes.length && khashes.every((h, i) => h === thashes[i]);
  return { planesEqual, eventsEqual, ok: planesEqual && eventsEqual };
}

// F1 — no-Abstain control: kernel OFF vs tickH hier, byte-identical planes
function runF1(seed) {
  const rng = mulberry32(seed ^ 0x5a5a);
  const map = new Map();
  let placed = 0;
  while (placed < 24) {
    const x = Math.floor(rng() * W), y = Math.floor(rng() * H);
    const key = y * 4096 + x;
    if (map.has(key)) continue;
    map.set(key, packB(1 + (placed % 2), 20 + placed)); // Attract/Repel only
    placed++;
  }
  const seedFn = (x, y) => map.get(y * 4096 + x) ?? 0;
  let ksub = makeSubstrate(W, H, seedFn);
  const table = new TwoLevelTable();
  let tsub = makeSubstrate(W, H, seedFn);
  const khashes = [planeHash(ksub, 0, bytePlane)], thashes = [planeHash(tsub, 0, bytePlane)];
  for (let t = 1; t <= T; t++) {
    ksub = tick(ksub, { wormholes: false });
    tsub = tickH(tsub, 'hier', table);
    if (CP.includes(t)) { khashes.push(planeHash(ksub, t, bytePlane)); thashes.push(planeHash(tsub, t, bytePlane)); }
  }
  return khashes.length === thashes.length && khashes.every((h, i) => h === thashes[i]);
}

// ═══════════════════════════════════════════════════════════════════════════
// H3 — the parking-lot probe (pure table addressing, no dynamics)
// ═══════════════════════════════════════════════════════════════════════════
function h3Probe() {
  const out = [];
  const D = 42; // one shared cargo (the party line)
  for (const nWriters of [16, 64, 272]) {
    // flat: all N writers, one slot
    const ft = new WormholeTable(SIGMA);
    for (let i = 0; i < nWriters; i++) ft.write(D, i % W, (i / W) | 0, 1);
    const flatOcc = ft.occupiedCount(); // 1
    const flatCont = ft.totalWrites / flatOcc;
    // hier: writers spread across the 8 regions (round-robin), same cargo
    const ht = new TwoLevelTable();
    for (let i = 0; i < nWriters; i++) {
      const r = i % 8;
      const x = (r & 1) * 32 + (i % 31), y = (r >> 1) * 16 + ((i / 31) | 0) % 15;
      ht.localWrite(r, D, x, y, 1);
      ht.gmask[D >> 3] |= (1 << r);
    }
    const hierOcc = ht.localOccupied();
    const hierCont = ht.localWrites / hierOcc;
    out.push({ nWriters, flatOccupied: flatOcc, flatContention: q(Math.round(flatCont * 100) / 100), hierLocalOccupied: hierOcc, hierLocalContention: q(Math.round(hierCont * 100) / 100), ratio: q(Math.round((hierCont / flatCont) * 1000) / 1000) });
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const num = (v) => (typeof v === 'number' ? v : parseFloat(v));

console.log('[e-q39] F0-T transcription control (flat shim vs real kernel), 10 seeds...');
let f0tOk = 0;
for (const s of SEEDS) { const r = runF0T(s); if (r.ok) f0tOk++; else console.log(`  F0-T FAIL seed=${s} planes=${r.planesEqual} events=${r.eventsEqual}`); }
console.log(`  F0-T: ${f0tOk}/10`);
if (f0tOk !== SEEDS.length) throw new Error('F0-T FAILED — transcription not byte-identical to kernel, experiment VOID (the registration\'s law)');

console.log('[e-q39] F1 no-Abstain control...');
let f1Ok = 0;
for (const s of SEEDS) { if (runF1(s)) f1Ok++; }
console.log(`  F1: ${f1Ok}/10`);
if (f1Ok !== SEEDS.length) throw new Error('F1 FAILED — hier table leaks into non-Abstain dynamics, VOID');

const rows = [];
const perCell = {}; // `${arm}|${nPoll}` -> per-seed records
for (const arm of ['flat', 'hier']) {
  for (const nPoll of NPOLL_LADDER) {
    perCell[`${arm}|${nPoll}`] = [];
    for (const seed of SEEDS) {
      const r1 = arm === 'flat' ? runFlat(seed, nPoll) : runHier(seed, nPoll);
      // F0 determinism: rerun from fresh construction, byte-identical checkpoints
      const r2 = arm === 'flat' ? runFlat(seed, nPoll) : runHier(seed, nPoll);
      const detOk = r1.hashes.length === r2.hashes.length && r1.hashes.every((h, i) => h === r2.hashes[i]);
      if (!detOk) throw new Error(`F0 determinism violated: ${arm} nPoll=${nPoll} seed=${seed} — VOID`);
      const rec = {
        arm, nPoll, seed, detOk: true,
        delivered: r1.delivered, pairDelivers: r1.pairDelivers,
        pairEvents: r1.pairEvents, partnerEvents: r1.partnerEvents, pollutedEvents: r1.pollutedEvents,
        partnerDirect: r1.partnerDirect ?? null,
        pf: r1.pairEvents > 0 ? q(r1.pollutedEvents / r1.pairEvents) : null,
        provFrac: r1.pairEvents > 0 ? q(r1.partnerEvents / r1.pairEvents) : null,
        provDirect: (r1.pairEvents > 0 && r1.partnerDirect !== undefined && r1.partnerDirect !== null) ? q(r1.partnerDirect / r1.pairEvents) : null,
        abstains0: r1.abstains0, polluters: r1.polluters,
        occupancyFinal: r1.occupancyFinal, occupancyMax: r1.occupancyMax,
        globalOccupancyFinal: r1.globalOccupancyFinal ?? null, globalOccupancyMax: r1.globalOccupancyMax ?? null,
        totalWrites: r1.totalWrites, globalWrites: r1.globalWrites ?? null,
        escalations: r1.escalations ?? null, escalatedEvents: r1.escalatedEvents ?? null, twinEvents: r1.twinEvents ?? null,
        writerRegionCorrect: r1.writerRegionCorrect ?? null, writerRegionTotal: r1.writerRegionTotal ?? null,
      };
      perCell[`${arm}|${nPoll}`].push(rec);
      rows.push({ kind: 'run', ...rec });
      console.log(`[e-q39] ${arm} nPoll=${String(nPoll).padStart(3)} seed=${seed} delivered=${r1.delivered}/${K} events=${r1.pairEvents} partner=${r1.partnerEvents} pf=${rec.pf} prov=${rec.provFrac}${rec.provDirect ? ' provDir=' + rec.provDirect : ''}${r1.escalatedEvents !== null && r1.escalatedEvents !== undefined ? ' esc=' + r1.escalatedEvents + '/' + r1.twinEvents : ''} occ=${r1.occupancyFinal}${r1.globalOccupancyFinal !== null && r1.globalOccupancyFinal !== undefined ? '+' + r1.globalOccupancyFinal : ''} writes=${r1.totalWrites}${r1.globalWrites ? '+' + r1.globalWrites : ''} det=ok`);
    }
  }
}

// F-CAL: flat 0 and 256 must reproduce E-Q17's sealed rows bit-exactly
console.log('[e-q39] F-CAL calibration vs E-Q17 sealed record...');
const eq17 = JSON.parse(readFileSync(join(OUT, 'e_q17_results.json'), 'utf8'));
let fcalOk = true; const fcalNotes = [];
for (const [nPoll, cellKey] of [[0, '64x64|clean'], [256, '64x64|density']]) {
  const sealed = eq17.aggregates[cellKey];
  const mine = perCell[`flat|${nPoll}`];
  for (let i = 0; i < SEEDS.length; i++) {
    const sSeed = sealed.seeds ? sealed.seeds[i] : SEEDS[i];
    if (String(mine[i].pf) !== String(sealed.pfSeeds[i])) { fcalOk = false; fcalNotes.push(`pf mismatch nPoll=${nPoll} seed=${SEEDS[i]}: ${mine[i].pf} vs sealed ${sealed.pfSeeds[i]}`); }
  }
  const mineEvents = mine.reduce((a, r) => a + r.pairEvents, 0);
  const minePartner = mine.reduce((a, r) => a + r.partnerEvents, 0);
  const mineDelivered = mine.reduce((a, r) => a + r.delivered, 0);
  if (mineEvents !== sealed.pairEvents) { fcalOk = false; fcalNotes.push(`pairEvents mismatch nPoll=${nPoll}: ${mineEvents} vs sealed ${sealed.pairEvents}`); }
  if (minePartner !== sealed.partnerEvents) { fcalOk = false; fcalNotes.push(`partnerEvents mismatch nPoll=${nPoll}: ${minePartner} vs sealed ${sealed.partnerEvents}`); }
  if (mineDelivered !== sealed.deliveredTotal) { fcalOk = false; fcalNotes.push(`delivered mismatch nPoll=${nPoll}: ${mineDelivered} vs sealed ${sealed.deliveredTotal}`); }
}
console.log(`  F-CAL: ${fcalOk ? 'PASS (bit-exact)' : 'FAIL'}`);
for (const n of fcalNotes) console.log(`  ${n}`);
if (!fcalOk) throw new Error('F-CAL FAILED — flat arm does not reproduce E-Q17\'s sealed rows, experiment VOID');

// H3 probe
const h3 = h3Probe();
console.log('[e-q39] H3 parking-lot probe:', JSON.stringify(h3));

// Aggregates + verdict (the frozen rules, applied verbatim)
const aggregates = {};
for (const arm of ['flat', 'hier']) {
  for (const nPoll of NPOLL_LADDER) {
    const rs = perCell[`${arm}|${nPoll}`];
    const provs = rs.map((r) => num(r.provFrac));
    const provDs = rs.map((r) => (r.provDirect !== null ? num(r.provDirect) : null));
    const delivers = rs.map((r) => r.delivered);
    const firstDelivers = rs.map((r) => Math.min(...r.pairDelivers.filter((t) => t !== null).concat([T])));
    const localOcc = rs.map((r) => r.occupancyFinal);
    const writes = rs.map((r) => r.totalWrites);
    const esc = rs.map((r) => (r.escalatedEvents !== null && r.twinEvents ? r.escalatedEvents / r.twinEvents : null));
    const wrc = rs.map((r) => (r.writerRegionTotal ? r.writerRegionCorrect / r.writerRegionTotal : null));
    aggregates[`${arm}|${nPoll}`] = {
      arm, nPoll,
      provMed: q(med(provs)),
      provDirectMed: provDs[0] !== null ? q(med(provDs.filter((x) => x !== null))) : null,
      pfMed: q(med(rs.map((r) => num(r.pf)))),
      deliveredMed: med(delivers),
      firstPairDeliveryMed: med(firstDelivers),
      writesPerOccupiedSlot: q(Math.round((writes.reduce((a, b) => a + b, 0) / rs.length / Math.max(1, med(localOcc))) * 100) / 100),
      escalatedFractionMed: esc[0] !== null ? q(Math.round(med(esc.filter((x) => x !== null)) * 10000) / 10000) : null,
      writerRegionCorrectMed: wrc[0] !== null ? q(Math.round(med(wrc.filter((x) => x !== null)) * 10000) / 10000) : null,
      pairEventsTotal: rs.reduce((a, r) => a + r.pairEvents, 0),
      partnerEventsTotal: rs.reduce((a, r) => a + r.partnerEvents, 0),
    };
  }
}

// H1_no_regression (E-Q39 PRIMARY: split provFrac (direct) >= flat provDirect - 0.02 at EVERY level)
let h1LevelsWorse = 0;
const h1Detail = [];
for (const nPoll of NPOLL_LADDER) {
  const fd = aggregates[`flat|${nPoll}`].provDirectMed !== null ? num(aggregates[`flat|${nPoll}`].provDirectMed) : null;
  const s = num(aggregates[`hier|${nPoll}`].provMed);
  const delta = fd !== null ? q(Math.round((s - fd) * 10000) / 10000) : null;
  if (fd !== null && s < fd - 0.02) h1LevelsWorse++;
  h1Detail.push({ nPoll, flatProvDirectMed: aggregates[`flat|${nPoll}`].provDirectMed, splitProvMed: aggregates[`hier|${nPoll}`].provMed, delta });
}
const h1Lives = h1LevelsWorse === 0;

// H2_delivery: 8/8 at EVERY level
let h2LevelsShort = 0;
const h2Detail = [];
for (const nPoll of NPOLL_LADDER) {
  const d = aggregates[`hier|${nPoll}`].deliveredMed;
  if (d < 8) h2LevelsShort++;
  h2Detail.push({ nPoll, splitDeliveredMed: d });
}
const h2Lives = h2LevelsShort === 0;

// H3_clean_parity: split at clean within [flat-0.02, flat+0.10]
const fClean = num(aggregates['flat|0'].provDirectMed);
const sClean = num(aggregates['hier|0'].provMed);
const h3Lives = sClean >= fClean - 0.02 && sClean <= fClean + 0.10;

// H3b telemetry (kept from E-Q18: the under-drift contention table)
const h3b = NPOLL_LADDER.map((nPoll) => ({
  nPoll,
  flat: aggregates[`flat|${nPoll}`].writesPerOccupiedSlot,
  splitLocal: aggregates[`hier|${nPoll}`].writesPerOccupiedSlot,
  ratio: q(Math.round((num(aggregates[`hier|${nPoll}`].writesPerOccupiedSlot) / Math.max(1e-9, num(aggregates[`flat|${nPoll}`].writesPerOccupiedSlot))) * 1000) / 1000),
}));

const C37 = h1Lives && h2Lives;

const verdict = {
  H1_no_regression: { lives: h1Lives, rule: 'E-Q39 PRIMARY: split provFrac (direct) >= flat provDirect - 0.02 at EVERY level (the bound the folded design breached twice)', detail: h1Detail, levelsWorse: h1LevelsWorse },
  H2_delivery: { lives: h2Lives, rule: '8/8 delivery at every level (the escalation channel is addressing-robust in both designs)', detail: h2Detail },
  H3_clean_parity: { lives: h3Lives, rule: 'split at clean within [flat-0.02, flat+0.10]', flatClean: aggregates['flat|0'].provDirectMed, splitClean: aggregates['hier|0'].provMed },
  H3b_under_drift: { rule: 'contention telemetry (writes per occupied slot)', table: h3b },
  C37: { lives: C37, rule: 'LIVES iff H1 AND H2 — region-splitting without folding restores the hierarchical design\'s viability' },
};

const results = {
  experiment: 'E-Q39',
  claim: 'the 8x64+8 hierarchical survivor (region-splitting without folding, C9\'s untested survivor)',
  kernel: { kernelKind, kernelPath: 'qthe/qthe.mjs' },
  stonePath,
  preRegSha,
  registration: 'experiments/pre_registration_e_q39.json',
  controls: { F0T: `${f0tOk}/10`, F1: `${f1Ok}/10`, FCAL: fcalOk ? 'PASS (bit-exact vs E-Q17 sealed 64x64 clean+density rows)' : 'FAIL', F0: '80/80 (asserted in-loop, LOUD on violation)' },
  task: { K, dWindow: [8, 15], thetaDel: THETA, T, seeds: SEEDS, sigma: SIGMA_DEFAULT, grid: '64x64 fixed', ladder: NPOLL_LADDER, regionMap: 'region(x,y) = ((y>>4)<<1)|(x>>5), 8 regions of 32x16' },
  aggregates,
  h3Probe: h3,
  verdict,
};
writeFileSync(join(OUT, 'e_q39_results.json'), JSON.stringify(results, null, 2));
console.log('\n[e-q39] VERDICT:', JSON.stringify(verdict, null, 1));

// ── chain append (stone-v1, verify-from-disk) ──────────────────────────────
const chainRows = [
  { kind: 'config', experiment: 'E-Q39', registration: 'experiments/pre_registration_e_q39.json', preRegSha, kernelKind, stonePath, task: results.task },
  { kind: 'control.F0T', experiment: 'E-Q39', result: `${f0tOk}/10 byte-identical (planes + per-tick event streams, flat shim vs real kernel)` },
  { kind: 'control.F1', experiment: 'E-Q39', result: `${f1Ok}/10 byte-identical (no-Abstain, kernel OFF vs tickH hier)` },
  { kind: 'control.FCAL', experiment: 'E-Q39', result: fcalOk ? 'PASS — flat 0/256 reproduce E-Q17 sealed 64x64 rows bit-exactly' : 'FAIL' },
  ...rows.map((r) => ({ kind: 'run', experiment: 'E-Q39', ...r })),
  { kind: 'aggregate', experiment: 'E-Q39', aggregates },
  { kind: 'verdict', experiment: 'E-Q39', verdict },
];
const v = await appendAndVerify(stone, CHAIN, chainRows, { experiment: 'E-Q39' });
writeFileSync(join(OUT, 'e_q39_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q39] chain sealed: ${CHAIN} tip=${v.tip.slice(0, 16)}… links=${v.links}`);
console.log('[e-q39] DONE');
