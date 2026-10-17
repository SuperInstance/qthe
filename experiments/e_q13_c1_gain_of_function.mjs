// experiments/e_q13_c1_gain_of_function.mjs — E-Q13: claim C1, the LAST open
// LAYER 2 claim: "25% gain of function" from intra-cell timbre vs inter-cell
// porting. Registration: experiments/pre_registration_e_q13.json (ORCH-1,
// committed PRE-RUN at d19d933 — pricing-first law; this header restates the
// floors, the registration file is the canon).
//
// FLOORS (frozen before any run):
//   F0 DETERMINISM      — every arm run twice fresh; checkpoint plane-hash
//                         sequences byte-identical, 40/40, else VOID.
//   F1 PORT IDENTITY    — ARM-P's reconstructed packed plane equals ARM-Q's
//                         kernel plane byte-identically at checkpoints
//                         [0,50,100,150,200], 20/20; else port defect ->
//                         autopsy, VOID as a C1 pricing.
//   F2 TICKS PARITY     — completion ticks identical across arms, 20/20.
//   F3 CLAIM FLOOR      — C1 LIVES iff 3*bytesP >= 4*bytesQ in 20/20 trials
//                         (exact integer arithmetic, gain >= 25%) AND F1/F2.
//   F4 FOOTPRINT        — standing bytes 4096 (Q) vs 8192 (P): exact halving,
//                         definitional, receipted.
//
// ARM-Q: the real kernel (qthe.mjs via _adapter.mjs), wormholes ON, sigma =
// kernel default log2(3). Traffic: 10 B/cell-tick (9 reads + 1 write) +
// 4096 seeding.
// ARM-P: an INDEPENDENT two-plane port (P_tau, P_d) re-implementing the
// published rule table + live-read row-major LWW wormhole semantics inside
// this file (crossimpl-style; qthe.mjs untouched). Traffic: 19 B/cell-tick
// (18 reads + 1 write; tau-plane writes never happen in tick — the port's
// optimistic best case) + 8192 seeding. Table traffic common -> cancelled.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, seedFnFrom, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });

const T = 200, K = 8, THETA = 8, TRIALS = 20, BASE_SEED = 66001;
const W = 64, H = 64, N = W * H;
const CHECKPOINTS = [0, 50, 100, 150, 200];
const CHAIN = join(RECEIPTS, 'e_q13_chain.jsonl');
// Frozen traffic constants (registration traffic_model_frozen):
const Q_PER_TICK = N * 10, P_PER_TICK = N * 19, Q_SEED = N, P_SEED = 2 * N;

const { stone, stonePath } = await linkStone();
const KMOD = (await loadKernel()).kernel;
const { kernelKind } = await loadKernel();
const SIGMA = KMOD.DEFAULT_SIGMA; // log2(3), the kernel's own double
console.log(`[e-q13] kernel=${kernelKind} stone=${stonePath} sigma=${SIGMA}`);

const preRegSha = fileSha256(join(HERE, 'pre_registration_e_q13.json'));

// ---------------------------------------------------------------- shared ----
function buildTrial(seed) {
  const rng = mulberry32(seed);
  const pairs = plantTwinPairs(rng, K, W, H, {});
  const weather = plantWeather(rng, pairs, W, H, {});
  return { pairs, weather, seedFn: seedFnFrom(pairs, weather) };
}

function memberIndex(pairs) {
  const m = new Map();
  for (const p of pairs) {
    m.set(p.a.y * W + p.a.x, { pairId: p.pairId, member: 'a' });
    m.set(p.b.y * W + p.b.x, { pairId: p.pairId, member: 'b' });
  }
  return m;
}

// Delivery bookkeeping from an event stream (amendment-1 meter, verbatim).
function makeMeter(pairs) {
  const memberPair = memberIndex(pairs);
  const meter = new Float64Array(N);
  const firstExceed = new Map();
  const bridgeTick = new Array(K).fill(null);
  return {
    feed(events, t) {
      for (const ev of events) {
        const idx = ev.y * W + ev.x;
        const who = memberPair.get(idx);
        if (who === undefined) throw new Error(`E-Q13: twin event at non-member cell (${ev.x},${ev.y}) — LOUD`);
        meter[idx] += ev.term;
        if (bridgeTick[who.pairId] === null) bridgeTick[who.pairId] = t;
        if (!firstExceed.has(idx) && meter[idx] >= THETA) firstExceed.set(idx, t);
      }
    },
    pairDelivers() {
      return pairs.map((p) => {
        const ia = p.a.y * W + p.a.x, ib = p.b.y * W + p.b.x;
        const ta = firstExceed.has(ia) ? firstExceed.get(ia) : null;
        const tb = firstExceed.has(ib) ? firstExceed.get(ib) : null;
        return ta !== null && tb !== null ? Math.max(ta, tb) : null;
      });
    },
    bridges: () => bridgeTick,
  };
}

function completionTick(pairDelivers) {
  return pairDelivers.every((t) => t !== null) ? Math.max(...pairDelivers) : null;
}

// ----------------------------------------------------------------- ARM-Q ----
function runArmQ(seedFn, pairs) {
  let sub = makeSubstrate(W, H, seedFn);
  const meter = makeMeter(pairs);
  const hashes = [planeHash(sub, 0, bytePlane)];
  let events = 0;
  for (let t = 1; t <= T; t++) {
    sub = tick(sub, { wormholes: true });
    meter.feed(sub.lastEvents, t);
    events += sub.lastEvents.length;
    if (CHECKPOINTS.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
  }
  const pairDelivers = meter.pairDelivers();
  const completion = completionTick(pairDelivers);
  const tEff = completion !== null ? completion : T; // bytes-to-task (or to-T receipt if incomplete)
  return {
    hashes, events, pairDelivers, bridgeTicks: meter.bridges(), completion,
    bytesToTask: Q_SEED + Q_PER_TICK * tEff,
    bytesAtT: Q_SEED + Q_PER_TICK * T,
    incomplete: completion === null,
  };
}

// ----------------------------------------------------------------- ARM-P ----
// The ported two-plane substrate: the SAME logical state, physically split
// across P_tau (timbre plane) and P_d (amplitude plane). The ported tick
// re-implements the published rule table; its reconstructed packed plane
// must track the kernel byte-for-byte (F1) or the port is defective.
class PortedSubstrate {
  constructor(seedFn) {
    this.tauPlane = new Uint8Array(N);
    this.dPlane = new Uint8Array(N);
    let i = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
      const c = seedFn(x, y, i) & 0xff;
      this.tauPlane[i] = c >> 6;   // the port SPLIT: timbre leaves the byte
      this.dPlane[i] = c & 63;     // the port SPLIT: amplitude leaves the byte
    }
    // the port's own wormhole table (same semantics; traffic common, cancelled)
    this.sx = new Int32Array(64).fill(-1);
    this.sy = new Int32Array(64).fill(-1);
    this.sr = new Int32Array(64);
    this.occ = new Uint8Array(64);
  }
  packed() { // reconstruct the canonical packed plane (F1 comparison)
    const out = new Uint8Array(N);
    for (let i = 0; i < N; i++) out[i] = (this.tauPlane[i] << 6) | this.dPlane[i];
    return out;
  }
  tick() { // one ported tick: 18 reads + 1 write per cell (semantic traffic)
    const tSnap = this.tauPlane.slice(); // pre-tick snapshot (excluded traffic)
    const dSnap = this.dPlane.slice();
    const events = [];
    for (let y = 0; y < H; y++) {
      const yUp = (y + H - 1) % H, yDn = (y + 1) % H;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const tau = tSnap[i], d = dSnap[i];
        const xL = (x + W - 1) % W, xR = (x + 1) % W;
        // Moore-8 gather: each neighbor costs TWO reads in the port (tau + d)
        let acc = 0;
        for (const [ny, nx] of [[yUp, xL], [yUp, x], [yUp, xR], [y, xL], [y, xR], [yDn, xL], [yDn, x], [yDn, xR]]) {
          const j = ny * W + nx, nt = tSnap[j];
          if (nt === 1) acc += dSnap[j]; else if (nt === 2) acc -= dSnap[j];
        }
        let pressure = acc;
        if (tau === 3) {
          // live read (R2): the tau-plane reader must fetch the SIBLING d to
          // index the slot — the inter-cell port C1 prices
          if (this.occ[d]) {
            const hx = this.sx[d], hy = this.sy[d], res = this.sr[d];
            if (res !== 0 && (hx !== x || hy !== y)) {
              const term = res * SIGMA;
              pressure = acc + term;
              events.push({ kind: 'twin', x, y, slot: d, resonance: res, term });
            }
          }
          this.sx[d] = x; this.sy[d] = y; this.sr[d] = Math.abs(acc) + 1; this.occ[d] = 1;
        }
        // nextD rule table (published item 5), tau frozen
        let nd = d;
        if (pressure > 0) nd = d < 63 ? d + 1 : 63;
        else if (pressure < 0) nd = d > 0 ? d - 1 : 0;
        this.dPlane[i] = nd; // ONE write; the tau plane is never written in tick
      }
    }
    return events;
  }
}

function runArmP(seedFn, pairs) {
  const port = new PortedSubstrate(seedFn);
  const meter = makeMeter(pairs);
  const shim = { w: W, h: H };
  const hashPort = (t) => planeHash(shim, t, () => port.packed());
  const hashes = [hashPort(0)];
  let events = 0;
  for (let t = 1; t <= T; t++) {
    const ev = port.tick();
    meter.feed(ev, t);
    events += ev.length;
    if (CHECKPOINTS.includes(t)) hashes.push(hashPort(t));
  }
  const pairDelivers = meter.pairDelivers();
  const completion = completionTick(pairDelivers);
  const tEff = completion !== null ? completion : T;
  return {
    hashes, events, pairDelivers, bridgeTicks: meter.bridges(), completion,
    bytesToTask: P_SEED + P_PER_TICK * tEff,
    bytesAtT: P_SEED + P_PER_TICK * T,
    incomplete: completion === null,
  };
}

// ---------------------------------------------------------------- trials ----
const trials = [];
for (let i = 0; i < TRIALS; i++) {
  const seed = BASE_SEED + i;
  const { seedFn, pairs } = buildTrial(seed);

  const q1 = runArmQ(seedFn, pairs), q2 = runArmQ(seedFn, pairs);
  const p1 = runArmP(seedFn, pairs), p2 = runArmP(seedFn, pairs);
  const detOk = JSON.stringify(q1.hashes) === JSON.stringify(q2.hashes)
    && JSON.stringify(p1.hashes) === JSON.stringify(p2.hashes);
  const f1 = JSON.stringify(q1.hashes) === JSON.stringify(p1.hashes); // port identity
  const f2 = q1.completion === p1.completion;                          // ticks parity
  // F3 in exact integer arithmetic: gain >= 25%  <=>  3*P >= 4*Q
  const f3 = 3 * p1.bytesToTask >= 4 * q1.bytesToTask;
  const gainStr = (100 * (1 - q1.bytesToTask / p1.bytesToTask)).toFixed(4) + '%';

  trials.push({ seed, detOk, f1, f2, f3, gainStr,
    completionQ: q1.completion, completionP: p1.completion,
    bytesQ: q1.bytesToTask, bytesP: p1.bytesToTask,
    eventsQ: q1.events, eventsP: p1.events,
    pairDeliversQ: q1.pairDelivers.map(q), bridgesQ: q1.bridgeTicks.map(q),
    incomplete: q1.incomplete || p1.incomplete,
    finalHashQ: q1.hashes[q1.hashes.length - 1], finalHashP: p1.hashes[p1.hashes.length - 1] });
  console.log(`[e-q13] trial ${i + 1}/${TRIALS} seed=${seed} completion=${q1.completion}/${p1.completion} bytes=${q1.bytesToTask}/${p1.bytesToTask} gain=${gainStr} det=${detOk} F1=${f1} F2=${f2} F3=${f3}`);
}

// ------------------------------------------------------------ aggregates ----
const allDet = trials.every((t) => t.detOk);
const allF1 = trials.every((t) => t.f1);
const allF2 = trials.every((t) => t.f2);
const allF3 = trials.every((t) => t.f3);
const allComplete = trials.every((t) => !t.incomplete);
const completions = trials.map((t) => t.completionQ);
const medianCompletion = (() => { const s = [...completions].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; })();
const gains = trials.map((t) => t.gainStr);

const F0 = allDet, F1 = allF1, F2 = allF2, F3 = allF3 && F1 && F2, F4 = true; // 4096 vs 8192 exact by construction, receipted
const founderPct = 25;
const medianGainNum = parseFloat(gains[Math.floor(gains.length / 2)]);
const magnitude = medianGainNum > founderPct ? 'understated' : medianGainNum < founderPct ? 'overstated' : 'matched';
let verdict;
if (!F0) verdict = 'VOID(determinism)';
else if (!F1) verdict = 'PORT-DEFECTIVE(autopsy) — C1 unpriced until the port is repaired and re-registered';
else if (!F2) verdict = 'TICKS-DIVERGED(autopsy) — port changed dynamics';
else verdict = `C1 ${F3 ? 'LIVES' : 'DIES (honest null)'} — bytes-gain at completion ${gains[Math.floor(gains.length / 2)]}% vs the founder's 25% ${magnitude}; ticks-to-task identical 20/20; port model faithful 20/20; footprint halving exact; cached-port caveat receipted`;

console.log(`[e-q13] F0=${F0} F1=${F1} F2=${F2} F3=${F3} | median completion=${medianCompletion} | median gain=${gains[Math.floor(gains.length / 2)]}`);
console.log(`[e-q13] VERDICT: ${verdict}`);

// --------------------------------------------------------------- outputs ----
writeFileSync(join(OUT, 'e_q13_results.json'), JSON.stringify({
  experiment: 'E-Q13', claim: 'C1', kernel: kernelReport(), stonePath, preRegSha,
  task: { w: W, h: H, K, T, theta_del: THETA, trials: TRIALS, baseSeed: BASE_SEED, sigma: 'log2(3) kernel default' },
  traffic: { Q_PER_TICK, P_PER_TICK, Q_SEED, P_SEED, model: 'registration traffic_model_frozen (semantic bytes; table cancelled; double-buffer excluded; tau-plane writes never in tick)' },
  trials, aggregates: { allDet, allF1, allF2, allF3, allComplete, medianCompletion, gains,
    verdict, F0, F1, F2, F3, F4, founderPct, magnitude },
}, null, 1));

// --------------------------------------------------------------- receipts ---
const rows = [
  { kind: 'rules.EQ13', frozen_by: 'experiments/pre_registration_e_q13.json (ORCH-1, committed pre-run at d19d933)', pre_reg_sha256: preRegSha,
    floors: 'F0 determinism 40/40; F1 port-dynamics identity 20/20; F2 ticks parity 20/20; F3 C1 LIVES iff 3P>=4Q in 20/20 and F1/F2; F4 footprint 4096 vs 8192 exact',
    traffic: 'Q 10 B/cell-tick + 4096 seed; P 19 B/cell-tick + 8192 seed; table cancelled; double-buffer excluded; tau writes never in tick (port best case)' },
  { kind: 'run.config', experiment: 'E-Q13', kernel: kernelReport(), stone_linked: stonePath,
    task: 'E-Q1 twin-delivery class, fresh seeds 66001..66020, K=8, T=200, theta=8, sigma log2(3)',
    armP: 'independent two-plane port (tauPlane/dPlane) re-implementing published L1 rules; reconstructed packed plane compared to kernel plane at [0,50,100,150,200]' },
];
for (const t of trials) {
  rows.push({ kind: 'result.trial', experiment: 'E-Q13', seed: t.seed,
    completionQ: q(t.completionQ), completionP: q(t.completionP),
    bytesQ: t.bytesQ, bytesP: t.bytesP, gainPct: t.gainStr,
    f3_integer: t.f3, portIdentity: t.f1, ticksParity: t.f2, determinism: t.detOk,
    eventsQ: t.eventsQ, eventsP: t.eventsP, incomplete: t.incomplete,
    finalPlaneHashQ: t.finalHashQ });
}
rows.push({ kind: 'result.determinism', experiment: 'E-Q13', rerunRuns: 4 * TRIALS, mismatches: allDet ? 0 : trials.filter((t) => !t.detOk).length });
rows.push({ kind: 'verdict.EQ13', experiment: 'E-Q13', F0, F1, F2, F3, F4,
  medianCompletion: q(medianCompletion), medianGainPct: gains[Math.floor(gains.length / 2)],
  founderPct, magnitude, verdict,
  cached_port_caveat: 'per-tick parity possible ONLY with the tau plane resident (4096 B standing SRAM); the 1-byte encoding removes the timbre coupling from the memory system entirely' });

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q13', claim: 'C1' });
console.log(`[e-q13] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q13_tip.txt'), `${v.tip} links=${v.links}\n`);
