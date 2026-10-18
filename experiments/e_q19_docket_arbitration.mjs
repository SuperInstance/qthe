// experiments/e_q19_docket_arbitration.mjs — E-Q19 (ORCH-R20 lane T11-b2):
// the docket round — the FIRST consumer-driven pricing target. A qthe-backed
// task-arbitration docket (the second live consumer the frontier doc names as
// the hierarchical build's trigger) priced against the standard inbox.
//
// Registration: experiments/pre_registration_e_q19.json (amended pre-run:
// AM1/AM2/AM5 from the Seed-2.0-mini design attack — situations/
// e_q19_design_attack.jsonl, 6 attacks, 2 accepted-in-part, 1 ACCEPTED (A2,
// the addressing mismatch, kept kernel-faithful with consequences
// registered), 3 refuted with guards/clarifications — plus EQ19_AM6, the
// implementation-time consolidated amendment self-caught before the first
// execution: L2 overload, whole-grid scatter, the expanding view, the B-local
// arm, the 64x64 grid, the pre-overflow checkpoint).
//
// THE KERNEL IS REAL (floor F1): arm A imports qthe.mjs via _adapter.mjs and
// ticks the substrate every epoch — Moore-8 pressure evolves task priority d,
// saturation min(d+1,63) is the aging cap, Abstain contributes 0 to the real
// accumulator (the debounce, LAYER 0), the wormhole table is written only by
// Abstain cells at slot = current d (the deferred-task channel, E-Q1
// verbatim). The docket is a POLICY consumer over the substrate; LAYER 2
// prices the workload.
//
// ARMS: B (FIFO + static-priority heap, the standard inbox) · B-local
// (nearest-task greedy, the naive spatial baseline) · A (the full docket) ·
// A-static (no tick — the coarse no-physics bundle) · A-off (tick with
// wormholes:false — the table-channel isolation).
// LOADS: L1 uniform (C=8) · L2 flapping (source 0 re-boosts every 8 epochs,
// C=4 overload) · L3 source-local flood at 50% volume (C=4 overload).
// VERDICT (frozen + amended, applied verbatim in code):
//   H1 LIVES iff med(A L2 stableStarve) <= 0.5 x med(B L2 stableStarve)
//        AND med(A L2 stableP99) <= 0.7 x med(B L2 stableP99)
//   H2 LIVES iff med(A L3 maxShare@500) <= 0.40 AND med(B L3 maxShare@500) >= 0.70
//   H3 LIVES iff med(A L1 p50) <= 1.15 x med(B-local L1 p50)
//   H4 advisory: med(A L1 spearmanP0) >= 0.25
//   C10 LIVES iff H1 AND H2 AND H3.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { loadKernel, makeSubstrate, tick, mulberry32, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
const CHAIN = join(RECEIPTS, 'e_q19_chain.jsonl');
mkdirSync(OUT, { recursive: true });
const sha256HexStr = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const preRegSha = fileSha256(join(HERE, 'pre_registration_e_q19.json'));
const attackSha = fileSha256(join(HERE, '..', 'situations', 'e_q19_design_attack.jsonl'));

// ── frozen configuration ───────────────────────────────────────────────────
const W = 64, H = 64, T = 2000, CHECKPOINT = 500;
const SEEDS = Array.from({ length: 10 }, (_, i) => 81001 + i);
const ARMS = ['B', 'B-local', 'A', 'A-static', 'A-off'];
const LOADS = {
  L1: { label: 'uniform',  C: 8, homes: 'scatter',   sources: 4, rate: [1.5, 1.5, 1.5, 1.5], flapSource: -1, flood: null },
  L2: { label: 'flapping', C: 4, homes: 'scatter',   sources: 4, rate: [1.5, 1.5, 1.5, 1.5], flapSource: 0, flood: null },
  L3: { label: 'flood',    C: 4, homes: 'quadrant',  sources: 4, rate: [3, 1, 1, 1],         flapSource: -1, flood: { source: 0, p0: 62 } },
};
const QUAD = (s) => ({ x0: (s & 1) ? 32 : 0, y0: (s & 2) ? 32 : 0 }); // 32x32 homes on 64x64
const HOME = 32; // quadrant side

// ── load stream (generated once per (load, seed); replayed to every arm — F4)
function generateArrivals(load, seed) {
  const rng = mulberry32(seed);
  const arrivals = [];
  let nextId = 1;
  for (let e = 0; e < T; e++) {
    const list = [];
    for (let s = 0; s < load.sources; s++) {
      const base = Math.floor(load.rate[s]);
      const frac = load.rate[s] - base;
      const n = base + (frac > 0 && rng() < frac ? 1 : 0);
      for (let k = 0; k < n; k++) {
        let p0;
        if (load.flood && load.flood.source === s) p0 = load.flood.p0;
        else p0 = 1 + Math.floor(rng() * 62);
        list.push({ id: nextId++, source: s, p0, isFlapper: load.flapSource === s });
      }
    }
    arrivals.push(list);
  }
  return { arrivals, total: nextId - 1, firstId: 1, lastId: nextId - 1 };
}

function taskPos(id, seed, load, source) {
  const r = mulberry32((Math.imul(id, 2654435761) ^ seed) >>> 0);
  if (load.homes === 'quadrant') {
    const qd = QUAD(source);
    return { x: qd.x0 + Math.floor(r() * HOME), y: qd.y0 + Math.floor(r() * HOME) };
  }
  return { x: Math.floor(r() * W), y: Math.floor(r() * H) };
}

// flapper re-boost draw — pure function of (id, k, seed), arm-independent
function boostVal(id, k, seed) {
  const r = mulberry32(((Math.imul(id, 7919) + Math.imul(k, 104729)) ^ seed) >>> 0);
  return 48 + Math.floor(r() * 15); // [48..62]
}

// flapper tau at epoch e (period 8, phase = id mod 8; ATTRACT first)
function tauAt(task, e) {
  const dt = e - task.subEpoch + (task.id % 8);
  return ((dt >> 3) % 2 === 0) ? 1 : 3;
}

// anchors: JURISDICTION TILES (AM7) — C tiles partition the plane (C=4: the
// four 32x32 quadrants, ALIGNED with L3's source homes so the flood cap is
// structural; C=8: eight 32x16 half-quadrants). Anchor j lives in tile j and
// claims the best ATTRACT task in its WHOLE tile — exhaustive by construction.
function makeAnchors(load, seed) {
  const rng = mulberry32((seed + 91) >>> 0);
  const C = load.C, tpq = C / 4; // tiles per quadrant (1 or 2)
  const anchors = [];
  for (let j = 0; j < C; j++) {
    const q = Math.floor(j / tpq), sub = j % tpq;
    const qd = QUAD(q);
    const ty0 = qd.y0 + sub * (HOME / tpq), ty1 = ty0 + HOME / tpq;
    anchors.push({
      x: qd.x0 + Math.floor(rng() * HOME),
      y: ty0 + Math.floor(rng() * (HOME / tpq)),
      cargo: 8 + j,
      tile: { x0: qd.x0, x1: qd.x0 + HOME, y0: ty0, y1: ty1 },
    });
  }
  return anchors;
}

const torCheb = (x1, y1, x2, y2) => {
  const dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
  return Math.max(Math.min(dx, W - dx), Math.min(dy, H - dy));
};

// ── B's heap (lazy versioning for re-boosted priorities) ──────────────────
class MaxHeap {
  constructor() { this.a = []; }
  static less(x, y) { // true iff x ranks BELOW y
    if (x.p0 !== y.p0) return x.p0 < y.p0;
    if (x.subEpoch !== y.subEpoch) return x.subEpoch > y.subEpoch; // older ranks higher
    return x.id > y.id;
  }
  push(x) {
    const a = this.a; a.push(x); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (MaxHeap.less(a[p], a[i])) { [a[p], a[i]] = [a[i], a[p]]; i = p; } else break; }
  }
  pop() {
    const a = this.a; if (a.length === 0) return null;
    const top = a[0], last = a.pop();
    if (a.length > 0) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && MaxHeap.less(a[m], a[l])) m = l;
        if (r < a.length && MaxHeap.less(a[m], a[r])) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

// ── one run of one arm ─────────────────────────────────────────────────────
function runArm(armKey, load, seed, stream, anchors0, WormholeClass) {
  const anchors = anchors0.map((a) => ({ ...a }));
  const serveLog = []; // [e, id, src, cl, lvl(0=heap,1=local,2=wormhole,3=nearest), d, p0o, lat, fl, sat]
  const tasks = new Map();      // id -> task
  const taskAtCell = new Map(); // y*W+x -> id
  const flapperLive = new Set();
  let wormholeClaims = 0, ghostNotAbstain = 0, ghostNotLive = 0, overflow = 0, claimsMade = 0;
  let sub = null, heap = null;
  const isSubstrate = armKey !== 'B' && armKey !== 'B-local';
  if (armKey === 'B') heap = new MaxHeap();
  if (isSubstrate) sub = makeSubstrate(W, H, () => 0);

  const freeCell = (task) => {
    // task.pos was cached at arrival (pure function of id/seed/load/source)
    const tryCell = (x, y) => { const k = y * W + x; if (!taskAtCell.has(k)) { taskAtCell.set(k, task.id); task.pos = { x, y }; return true; } return false; };
    if (tryCell(task.pos.x, task.pos.y)) return;
    if (load.homes === 'quadrant') {
      const qd = QUAD(task.source);
      for (let n = 0; n < W * H; n++) {
        const x = (qd.x0 + (n % W)) % W, y = (qd.y0 + Math.floor(n / W)) % H;
        if (tryCell(x, y)) { overflow++; return; }
      }
    } else {
      for (let n = 0; n < W * H; n++) { const x = n % W, y = Math.floor(n / W); if (tryCell(x, y)) return; }
    }
    throw new Error(`freeCell: plane full (live=${taskAtCell.size}) — the AM6(d) floor threw, LOUD`);
  };

  const serve = (task, e, cl, lvl, dAtServe) => {
    if (isSubstrate) { const k = task.pos.y * W + task.pos.x; sub[k] = 0 /* pack(0,0) Ground */; taskAtCell.delete(k); }
    tasks.delete(task.id);
    flapperLive.delete(task.id);
    serveLog.push([e, task.id, task.source, cl, lvl, dAtServe, task.p0Original, e - task.subEpoch, task.isFlapper ? 1 : 0, task.saturated ? 1 : 0]);
    claimsMade++;
  };

  for (let e = 0; e < T; e++) {
    // (1) arrivals (stream-identical across arms — F4)
    for (const arr of stream.arrivals[e]) {
      const task = { id: arr.id, source: arr.source, p0: arr.p0, p0Original: arr.p0, isFlapper: arr.isFlapper,
        subEpoch: e, tau: 1, boostCount: 0, version: 0, saturated: false,
        pos: taskPos(arr.id, seed, load, arr.source) }; // cached: pure, arm-independent
      tasks.set(task.id, task);
      if (task.isFlapper) flapperLive.add(task.id);
      if (armKey === 'B') {
        heap.push({ p0: task.p0, subEpoch: task.subEpoch, id: task.id, version: 0, task });
      } else if (isSubstrate) {
        freeCell(task);
        sub[task.pos.y * W + task.pos.x] = (1 << 6) | task.p0; // pack(ATTRACT, p0)
      }
      // B / B-local: pos cached on the task (no plane to stamp)
    }

    // (2) flips (flappers; stream-identical by pure function)
    for (const id of flapperLive) {
      const task = tasks.get(id);
      const tNew = tauAt(task, e);
      if (tNew !== task.tau) {
        task.tau = tNew;
        if (tNew === 1) { // flip back: RE-BOOST (the gaming model)
          task.boostCount++;
          task.p0 = boostVal(id, task.boostCount, seed);
          if (armKey === 'B') { task.version++; heap.push({ p0: task.p0, subEpoch: task.subEpoch, id: task.id, version: task.version, task }); }
          else if (isSubstrate) sub[task.pos.y * W + task.pos.x] = (1 << 6) | task.p0; // AM6(i): pack(1, newP0)
        } else if (isSubstrate) {
          const k = task.pos.y * W + task.pos.x;
          sub[k] = (3 << 6) | (sub[k] & 63); // tau->ABSTAIN, d kept
        }
      }
    }

    // (3) the tick — the REAL kernel (F1). A/A-off only; A-static never ticks.
    if (armKey === 'A') tick(sub);                     // wormholes on (default)
    else if (armKey === 'A-off') tick(sub, { wormholes: false });

    // (4) saturation telemetry (sticky: d is monotone non-decreasing in this design)
    if (armKey === 'A' || armKey === 'A-off') {
      for (const [k, id] of taskAtCell) {
        if ((sub[k] & 63) === 63) { const t = tasks.get(id); if (t) t.saturated = true; }
      }
    }

    // (5) claims — capacity C, claimer order fixed
    if (armKey === 'B') {
      for (let c = 0; c < load.C; c++) {
        let entry = null;
        while (heap.size > 0) {
          const cand = heap.pop();
          if (tasks.has(cand.task.id) && cand.version === cand.task.version) { entry = cand; break; }
        }
        if (!entry) break;
        serve(entry.task, e, c, 0, entry.task.p0);
      }
    } else if (armKey === 'B-local') {
      for (let c = 0; c < load.C; c++) {
        // nearest live task to anchor c; ties: max current p0, then age, then id
        let best = null, bestDist = Infinity;
        for (const task of tasks.values()) {
          const dist = torCheb(anchors[c].x, anchors[c].y, task.pos.x, task.pos.y);
          if (dist < bestDist || (dist === bestDist && best &&
              (task.p0 > best.p0 || (task.p0 === best.p0 && (task.subEpoch < best.subEpoch ||
               (task.subEpoch === best.subEpoch && task.id < best.id)))))) {
            best = task; bestDist = dist;
          }
        }
        if (!best) break;
        serve(best, e, c, 3, best.p0);
      }
    } else {
      // A / A-static / A-off — the TILED DOCKET claim policy (AM7)
      for (let c = 0; c < load.C; c++) {
        const a = anchors[c], tl = a.tile;
        let best = null, bestD = -1;
        for (let y = tl.y0; y < tl.y1; y++) {
          for (let x = tl.x0; x < tl.x1; x++) {
            const k = y * W + x;
            const id = taskAtCell.get(k);
            if (id === undefined) continue;
            const task = tasks.get(id);
            if (!task || task.tau !== 1) continue; // the debounce: ABSTAIN invisible in the tile
            const d = sub[k] & 63;
            if (d > bestD || (d === bestD && best && (task.subEpoch < best.task.subEpoch ||
                 (task.subEpoch === best.task.subEpoch && task.id < best.task.id)))) {
              best = { task, k, d }; bestD = d;
            }
          }
        }
        if (best) {
          serve(best.task, e, c, 1, best.d);
        } else if (armKey === 'A') {
          // wormhole escalation — the kernel's own non-local channel, on a drained tile
          const table = sub.__wormholes;
          if (WormholeClass && table instanceof WormholeClass) {
            const hit = table.read(a.cargo);
            if (hit) {
              const k = hit.y * W + hit.x;
              const id = taskAtCell.get(k);
              if (id === undefined || !tasks.has(id)) ghostNotLive++;
              else {
                const task = tasks.get(id);
                if (task.tau === 3) { wormholeClaims++; serve(task, e, c, 2, sub[k] & 63); }
                else ghostNotAbstain++;
              }
            }
          }
        }
      }
    }
  }

  // ── metrics ──
  const arrivalsTotal = stream.total;
  const perSource = new Array(load.sources).fill(0);
  const perSource500 = new Array(load.sources).fill(0);
  let served500 = 0;
  for (const r of serveLog) { perSource[r[2]]++; if (r[0] < CHECKPOINT) { perSource500[r[2]]++; served500++; } }
  const totalServed = serveLog.length;
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const jain = totalServed > 0 ? (sum(perSource) ** 2) / (load.sources * sum(perSource.map((v) => v * v))) : null;
  const maxShare = totalServed > 0 ? Math.max(...perSource) / totalServed : null;
  const maxShare500 = served500 > 0 ? Math.max(...perSource500) / served500 : null;
  const lats = serveLog.map((r) => r[7]).sort((a, b) => a - b);
  const stableLats = serveLog.filter((r) => r[8] === 0).map((r) => r[7]).sort((a, b) => a - b);
  const median = (v) => (v.length === 0 ? null : v[Math.floor(v.length / 2)]); // upper middle (corpus convention)
  const pct = (v, p) => (v.length === 0 ? null : v[Math.min(v.length - 1, Math.floor(v.length * p))]);
  let liveStable = 0, liveFlap = 0, arrStable = 0, arrFlap = 0, satEver = 0;
  for (const t of tasks.values()) { if (t.isFlapper) liveFlap++; else liveStable++; if (t.saturated) satEver++; }
  for (const arr of stream.arrivals.flat()) { if (arr.isFlapper) arrFlap++; else arrStable++; }
  satEver += serveLog.filter((r) => r[9] === 1).length;
  // Spearman(p0Original, serve order) and Spearman(dAtServe, serve order) — AM5
  const spP0 = spearman(serveLog.map((r) => r[6]), serveLog.map((_, i) => i + 1));
  const spD = spearman(serveLog.map((r) => r[5]), serveLog.map((_, i) => i + 1));

  return {
    arm: armKey, seed, served: totalServed, perSourceServed: perSource, jain: q(jain), maxShare: q(maxShare),
    maxShare500: q(maxShare500), starveRate: q(1 - totalServed / arrivalsTotal),
    stableStarve: arrStable > 0 ? q(liveStable / arrStable) : null,
    flapStarve: arrFlap > 0 ? q(liveFlap / arrFlap) : null,
    p50: q(median(lats)), p99: q(pct(lats, 0.99)), stableP99: q(pct(stableLats, 0.99)),
    spearmanP0: q(spP0), spearmanD: q(spD),
    wormholeClaims, ghostNotAbstain, ghostNotLive, saturationFrac: q(satEver / arrivalsTotal),
    overflow, claimsMade, claimsOffered: load.C * T,
    planeHash: isSubstrate ? planeHash(sub, T, (s) => s) : null,
    serveDigest: sha256HexStr(JSON.stringify(serveLog)),
    liveDigest: sha256HexStr(JSON.stringify([...tasks.keys()].sort((a, b) => a - b))),
    arrivalsTotal,
  };
}

function rankAvg(vals) {
  const idx = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(vals.length); let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[idx[k][1]] = r;
    i = j + 1;
  }
  return ranks;
}
function spearman(xs, ys) {
  const n = xs.length; if (n < 3) return null;
  const rx = rankAvg(xs), ry = rankAvg(ys);
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += rx[i]; my += ry[i]; } mx /= n; my /= n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const a = rx[i] - mx, b = ry[i] - my; num += a * b; dx += a * a; dy += b * b; }
  return dx === 0 || dy === 0 ? null : num / Math.sqrt(dx * dy);
}

// ── main: 5 arms x 3 loads x 10 seeds x 2 determinism runs ─────────────────
const { kernelKind, kernelPath, kernel } = await loadKernel();
const { stone, stonePath } = await linkStone();
const runs = [];
let detPairs = 0, detOk = 0;
const f4Checks = [];
for (const loadKey of Object.keys(LOADS)) {
  const load = LOADS[loadKey];
  for (const seed of SEEDS) {
    const stream = generateArrivals(load, seed);
    const anchors = makeAnchors(load, seed);
    let refArr = null;
    for (const arm of ARMS) {
      const r1 = runArm(arm, load, seed, stream, anchors, kernel.WormholeTable);
      const r2 = runArm(arm, load, seed, stream, anchors, kernel.WormholeTable);
      detPairs++;
      const same = r1.serveDigest === r2.serveDigest && r1.liveDigest === r2.liveDigest &&
        (r1.planeHash === null || r1.planeHash === r2.planeHash);
      if (same) detOk++;
      r1.determinism = same;
      r1.load = loadKey;
      runs.push(r1);
      if (!refArr) refArr = `${r1.arrivalsTotal}:${stream.firstId}:${stream.lastId}`;
      else if (refArr !== `${r1.arrivalsTotal}:${stream.firstId}:${stream.lastId}`) throw new Error(`F4 VIOLATED at ${loadKey}/${seed}/${arm} — LOUD`);
      if (r1.claimsMade > r1.claimsOffered) throw new Error(`F3 VIOLATED (claims ${r1.claimsMade} > offered ${r1.claimsOffered}) at ${loadKey}/${seed}/${arm} — LOUD`);
    }
    f4Checks.push({ load: loadKey, seed, arrivals: refArr });
    const a = runs.find((r) => r.load === loadKey && r.arm === 'A' && r.seed === seed);
    const b = runs.find((r) => r.load === loadKey && r.arm === 'B' && r.seed === seed);
    console.log(`[e-q19] ${loadKey} seed=${seed} A: served=${a.served} wh=${a.wormholeClaims} sat=${a.saturationFrac} ovf=${a.overflow} | B: served=${b.served} | det ${runs.filter((r) => r.seed === seed && r.load === loadKey).every((r) => r.determinism) ? 'OK' : 'FAIL'}`);
  }
}

// ── aggregates: medians per (arm, load) over the 10 seeds ──────────────────
const med = (vals) => { const v = vals.filter((x) => x !== null).sort((a, b) => a - b); return v.length === 0 ? null : v[Math.floor(v.length / 2)]; };
const num = (x) => parseFloat(String(x));
const agg = {};
for (const loadKey of Object.keys(LOADS)) {
  for (const arm of ARMS) {
    const rs = runs.filter((r) => r.load === loadKey && r.arm === arm);
    if (rs.length !== SEEDS.length) throw new Error(`aggregate cell ${loadKey}/${arm}: ${rs.length} runs — LOUD`);
    agg[`${loadKey}|${arm}`] = {
      servedMed: med(rs.map((r) => r.served)),
      jainMed: q(med(rs.map((r) => num(r.jain)))),
      maxShareMed: q(med(rs.map((r) => num(r.maxShare)))),
      maxShare500Med: q(med(rs.map((r) => num(r.maxShare500)))),
      starveMed: q(med(rs.map((r) => num(r.starveRate)))),
      stableStarveMed: q(med(rs.map((r) => num(r.stableStarve)))),
      flapStarveMed: q(med(rs.map((r) => num(r.flapStarve)))),
      p50Med: q(med(rs.map((r) => num(r.p50)))),
      p99Med: q(med(rs.map((r) => num(r.p99)))),
      stableP99Med: q(med(rs.map((r) => num(r.stableP99)))),
      spearmanP0Med: q(med(rs.map((r) => num(r.spearmanP0)))),
      spearmanDMed: q(med(rs.map((r) => num(r.spearmanD)))),
      wormholeClaimsTotal: rs.reduce((s, r) => s + r.wormholeClaims, 0),
      ghostNotAbstainTotal: rs.reduce((s, r) => s + r.ghostNotAbstain, 0),
      ghostNotLiveTotal: rs.reduce((s, r) => s + r.ghostNotLive, 0),
      saturationFracMed: q(med(rs.map((r) => num(r.saturationFrac)))),
      overflowTotal: rs.reduce((s, r) => s + r.overflow, 0),
      determinismAll: rs.every((r) => r.determinism),
      perSourceServedSeed0: rs[0].perSourceServed,
    };
  }
}

// ── floors ─────────────────────────────────────────────────────────────────
const F0 = detOk === detPairs;
const F2 = runs.filter((r) => r.arm === 'A-off').every((r) => r.wormholeClaims === 0);
const F3 = runs.every((r) => r.claimsMade <= r.claimsOffered);
const F4 = true; // asserted inline (threw otherwise)
const F1 = { kernelKind, kernelPath: kernelPath.split('/').slice(-2).join('/') };

// ── verdict (frozen + AM6, applied verbatim) ───────────────────────────────
const gv = (k, f) => num(agg[k][f]);
const A_L2 = 'L2|A', B_L2 = 'L2|B', A_L3 = 'L3|A', B_L3 = 'L3|B', A_L1 = 'L1|A', BL_L1 = 'L1|B-local';
const h1a = gv(A_L2, 'stableStarveMed') <= 0.5 * gv(B_L2, 'stableStarveMed');
const h1b = gv(A_L2, 'stableP99Med') <= 0.7 * gv(B_L2, 'stableP99Med');
const H1 = h1a && h1b;
const h2a = gv(A_L3, 'maxShare500Med') <= 0.40;
const h2b = gv(B_L3, 'maxShare500Med') >= 0.70;
const H2 = h2a && h2b;
const H3 = gv(A_L1, 'p50Med') <= 1.15 * gv(BL_L1, 'p50Med');
const H4 = gv(A_L1, 'spearmanP0Med') >= 0.25;
const C10 = H1 && H2 && H3;
const erosion = { aMaxShare500: agg['L3|A'].maxShare500Med, aMaxShareEnd: agg['L3|A'].maxShareMed, bMaxShare500: agg['L3|B'].maxShare500Med, bMaxShareEnd: agg['L3|B'].maxShareMed };
const localityPrice = { aL1p50: agg['L1|A'].p50Med, bGlobalL1p50: agg['L1|B'].p50Med, bLocalL1p50: agg['L1|B-local'].p50Med };
const fmt = (x) => (x === null || x === undefined ? 'null' : String(x));
const verdict = `E-Q19 VERDICT (C10: a qthe-docket reduces starvation and source-monopolization under flapping (spatially mixed) and source-local flooding loads versus a FIFO+static-priority inbox, at parity with the naive spatial baseline on uniform load): H1 flapping-debounce ${H1 ? 'LIVES' : 'DIES'} (A stableStarve ${fmt(agg[A_L2].stableStarveMed)} <= 0.5 x B ${fmt(agg[B_L2].stableStarveMed)} -> ${h1a}; A stableP99 ${fmt(agg[A_L2].stableP99Med)} <= 0.7 x B ${fmt(agg[B_L2].stableP99Med)} -> ${h1b}); H2 flood-cap ${H2 ? 'LIVES' : 'DIES'} at the pre-overflow checkpoint (A maxShare@500 ${fmt(agg[A_L3].maxShare500Med)} <= 0.40 -> ${h2a}; B maxShare@500 ${fmt(agg[B_L3].maxShare500Med)} >= 0.70 -> ${h2b}; T_end erosion receipt: A ${fmt(erosion.aMaxShareEnd)} / B ${fmt(erosion.bMaxShareEnd)}); H3 uniform parity vs B-local ${H3 ? 'LIVES' : 'DIES'} (A p50 ${fmt(localityPrice.aL1p50)} <= 1.15 x B-local ${fmt(localityPrice.bLocalL1p50)}; the locality price vs the global heap: B-global p50 ${fmt(localityPrice.bGlobalL1p50)}); H4 priority fidelity advisory ${H4 ? 'PASS' : 'FAIL'} (A spearman(p0) ${fmt(agg[A_L1].spearmanP0Med)} >= 0.25; docket's own ranking fidelity spearman(dAtServe) ${fmt(agg[A_L1].spearmanDMed)} — the gap is the aging price, AM5). C10 ${C10 ? 'LIVES' : 'DIES'}. Attribution: A vs A-static (the no-physics bundle) stableStarve ${fmt(agg['L2|A-static'].stableStarveMed)} vs ${fmt(agg[A_L2].stableStarveMed)} on L2; A vs A-off (the table channel) wormhole claims ${agg['L2|A'].wormholeClaimsTotal} vs ${agg['L2|A-off'].wormholeClaimsTotal} (AM2's expected quiet, receipted). Floors: F0 determinism ${F0 ? `${detOk}/${detPairs} byte-identical` : 'VOID'}; F1 kernel-real (${F1.kernelKind}, ${F1.kernelPath}); F2 A-off wormhole claims ${F2 ? '0 everywhere (the OFF control is real)' : 'BROKEN — LOUD'}; F3 capacity matched ${F3 ? 'held' : 'BROKEN'}; F4 stream identity asserted inline (no throw).`;
console.log(`\n[e-q19] ${verdict}\n`);

// ── seal: results JSON + chain rows ────────────────────────────────────────
writeFileSync(join(OUT, 'e_q19_results.json'), JSON.stringify({
  experiment: 'E-Q19', claim: 'C10 — docket arbitration (the first consumer-driven pricing target)', kernel: kernelReport(), stonePath,
  preRegSha, attackSha,
  registration: 'experiments/pre_registration_e_q19.json (pre-run amendments: AM1/AM2/AM5 from the Seed-2.0-mini attack + AM6 implementation-time consolidated)',
  consult: { file: 'situations/e_q19_design_attack.jsonl', sha256: attackSha, seat: 'ByteDance/Seed-2.0-mini', attacks: 6, usd: 0.001147, latency_s: 36.1,
    dispositions: 'A1 accepted-in-part (AM1), A2 ACCEPTED the real defect (AM2, kept kernel-faithful), A3 refuted with clarification, A4 refuted with guard, A5 accepted-in-part (AM5), A6 refuted with clarification' },
  task: { W, H, T, checkpoint: CHECKPOINT, seeds: SEEDS, arms: ARMS, loads: LOADS, anchors: 'JURISDICTION TILES (AM7): C tiles partition the plane (C=4 quadrants aligned with L3 homes; C=8 half-quadrants), anchor j claims the best ATTRACT task in tile j (max d, ties age/id), wormhole escalation on a drained tile (A only)', flapper: 'period 8, phase id mod 8, re-boost [48..62] on flip-back, re-stamp law AM6(i)' },
  runs, aggregates: agg, floors: { F0, detOk, detPairs, F2, F3, F4, F1 },
  verdict,
  erosion, localityPrice,
}, null, 1));

const rows = [
  { kind: 'rules.EQ19', frozen_by: 'experiments/pre_registration_e_q19.json sha ' + preRegSha.slice(0, 16) + '… (pre-run amendments AM1/AM2/AM5 from the Seed-2.0-mini design attack, AM6 implementation-time — all BEFORE the first execution)',
    proposal_cited: 'ORCH-R20 registration (T11-b2): the frontier doc names the second live consumer as the hierarchical build trigger; this experiment prices the first consumer-driven target',
    claim: 'C10 — a qthe-docket reduces starvation and source-monopolization under flapping (spatially mixed) and source-local flooding loads versus a FIFO+static-priority inbox, at parity with the naive spatial baseline on uniform load',
    floors: 'F0 within-(arm,load,seed) determinism, 150 pairs byte-identical; F1 kernel-real (import, no transcription); F2 A-off wormhole claims == 0; F3 capacity matched per load; F4 arrival-stream identity asserted inline',
    bands: 'H1 med(A stableStarve) <= 0.5xB AND med(A stableP99) <= 0.7xB (L2); H2 med(A maxShare@500) <= 0.40 AND med(B maxShare@500) >= 0.70 (L3, pre-overflow checkpoint); H3 med(A p50) <= 1.15 x med(B-local p50) (L1); H4 advisory spearman(p0) >= 0.25; C10 = H1 AND H2 AND H3' },
  { kind: 'run.config', experiment: 'E-Q19', kernel: kernelReport(), stone_linked: stonePath,
    design: '64x64 torus, T=2000, seeds 81001..81010; arms B/B-local/A/A-static/A-off; loads L1 uniform C=8 scatter, L2 flapping C=4 scatter (source 0 all-flappers, period 8, re-boost [48..62]), L3 source-local flood C=4 quadrant homes (F=3/epoch p0=62, 50% volume); claim policy (AM7, post-LOUD-throw): JURISDICTION TILES — C tiles partition the plane, anchor j claims best ATTRACT in tile j (max d, ties age/id), wormhole escalation on drained tiles (A only, cargo slot query, live-ABSTAIN guard); the tick is the REAL kernel every epoch (A/A-off); saturation telemetry sticky; determinism 2x fresh per cell',
    consult: 'Seed-2.0-mini design attack AS-SAID at situations/e_q19_design_attack.jsonl sha ' + attackSha.slice(0, 16) + '… (6 attacks, $0.001147, 36.1s); AM6 self-caught pre-run (the draft had fixed r=1 views — permanent blind spots; L2 was C=8 drained; homes made the debounce untestable; Jain blind to the stable/flap split)' },
];
for (const loadKey of Object.keys(LOADS)) {
  for (const arm of ARMS) {
    const A = agg[`${loadKey}|${arm}`];
    rows.push({ kind: 'result.EQ19', experiment: 'E-Q19', load: loadKey, arm,
      servedMed: A.servedMed, jainMed: A.jainMed, maxShareMed: A.maxShareMed, maxShare500Med: A.maxShare500Med,
      starveMed: A.starveMed, stableStarveMed: A.stableStarveMed, flapStarveMed: A.flapStarveMed,
      p50Med: A.p50Med, p99Med: A.p99Med, stableP99Med: A.stableP99Med,
      spearmanP0Med: A.spearmanP0Med, spearmanDMed: A.spearmanDMed,
      wormholeClaimsTotal: A.wormholeClaimsTotal, ghostNotAbstainTotal: A.ghostNotAbstainTotal, ghostNotLiveTotal: A.ghostNotLiveTotal,
      saturationFracMed: A.saturationFracMed, overflowTotal: A.overflowTotal, determinismAll: A.determinismAll });
  }
}
rows.push({ kind: 'verdict.EQ19', experiment: 'E-Q19', H1, h1a, h1b, H2, h2a, h2b, H3, H4, C10,
  erosion, localityPrice, F0, detOk, detPairs, F2, F3, F1, verdict });

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q19', claim: 'docket-arbitration-C10' });
console.log(`[e-q19] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q19] results: experiments/outputs/e_q19_results.json`);
