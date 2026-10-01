// experiments/e_q2_sigma_sweep.mjs — E-Q2: THE SWEEP (claim C3): is
// sigma = log2(3) the critical bridge scale? Lane 33-b (field-smith).
// Runs on the REAL kernel (qthe.mjs, commit 492333e) via _adapter.mjs.
//
// POSTURE (pre_registration.json, committed before any run): the gifted
// log2(3) "proof" is decorative — the Gaussian integral yields sigma*sqrt(2pi)
// for ANY sigma. NO favorite sigma is registered; the expected winner is
// named ONLY as "one of the swept values, decided by data".
//
// ARMS: sigma in {0.5, 1, 1.584962500721156 (log2(3)), 2, 4}, wormholes ON,
// same 20 seeds / same pair coordinates as E-Q1 (fixed task set).
//
// CLASSES (amendment 1, sealed before this run):
//   PLAIN    — E-Q1's substrates verbatim (members' real_acc == 0). Sealed
//              prediction: full tie across sigma (sign(sigma*res) > 0 for all
//              swept sigma) => "monotone-inert HERE" honest null for C3.
//   SHADOWED — each member flanked by 2 adjacent Repel(d=33) cells =>
//              real_acc = -66; twin term = 67*sigma flips the pressure sign
//              iff sigma > 66/67 ~= 0.98507. The sweep STRADDLES the
//              threshold: prediction sigma=0.5 descends, {1, log2(3), 2, 4}
//              ascend. CRITICAL BAND = [highest failing, lowest passing).
//              log2(3) is 'special' ONLY if it is the unique swept value at
//              a band edge.
//
// METRICS per arm/class: bridge rate (pairs with >= 1 twin event by T),
// median ticks-to-first-bridge + IQR, delivery ticks at theta=8, final member
// d (min/mean/max), per-arm checkpoint plane hashes, imag-mass divergence
// vs the sigma=1 arm (strings, never hashed).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, plantTwinPairs, plantWeather, seedFnFrom, packByte, q, fileSha256 } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });

const T = 200, K = 8, THETA = 8, TRIALS = 20, BASE_SEED = 33001;
const CHECKPOINTS = [0, 50, 100, 150, 200];
const SIGMAS = [0.5, 1, Math.log2(3), 2, 4];
const SIGMA_KEYS = ['0.5', '1', 'log2(3)=1.584962500721156', '2', '4'];
const CHAIN = join(RECEIPTS, 'e_q2_chain.jsonl');

const { stone, stonePath } = await linkStone();
const { kernelKind, kernel } = await loadKernel();
console.log(`[e-q2] kernel=${kernelKind} stone=${stonePath}`);
const preRegSha = existsSync(join(HERE, 'pre_registration.json')) ? fileSha256(join(HERE, 'pre_registration.json')) : null;
const amendSha = existsSync(join(HERE, 'pre_registration_amendment_1.json')) ? fileSha256(join(HERE, 'pre_registration_amendment_1.json')) : null;
const WormholeTable = kernel.WormholeTable;

// Shadowed class: 2 Repel(d=33) adjacent to each member, offsets (1,0) and
// (0,1), collision-checked loudly (they must not land on any planted cell).
function shadowSeedFn(pairs, weather) {
  const map = new Map();
  const base = seedFnFrom(pairs, weather);
  for (const p of pairs) {
    for (const m of [p.a, p.b]) {
      for (const [ox, oy] of [[1, 0], [0, 1]]) {
        const x = (m.x + ox) % 64, y = (m.y + oy) % 64; // toroidal placement [R1]
        const key = y * 4096 + x;
        if (map.has(key)) throw new Error(`E-Q2 shadow: collision at (${x},${y}) — LOUD`);
        map.set(key, packByte(2, 33));
      }
    }
  }
  return (i, x, y) => map.get(y * 4096 + x) ?? base(i, x, y);
}

function runArm(seedFn, pairs, sigma) {
  let sub = makeSubstrate(64, 64, seedFn);
  const table = new WormholeTable(sigma); // explicit per-arm table, persistent
  const meter = new Float64Array(64 * 64);
  const memberIdx = [];
  for (const p of pairs) { memberIdx.push(p.a.y * 64 + p.a.x, p.b.y * 64 + p.b.x); }
  const firstExceed = new Map();
  const bridgeTick = new Array(K).fill(null);
  const hashes = [planeHash(sub, 0, bytePlane)];
  const massByTick = new Array(T).fill(0);
  let events = 0;

  for (let t = 1; t <= T; t++) {
    sub = tick(sub, { wormholes: true, table });
    for (const ev of sub.lastEvents) {
      const idx = ev.y * 64 + ev.x;
      events++;
      meter[idx] += ev.term;
      massByTick[t - 1] += ev.term;
      const pi = Math.floor(memberIdx.indexOf(idx) / 2);
      if (pi >= 0 && bridgeTick[pi] === null) bridgeTick[pi] = t;
      if (!firstExceed.has(idx) && meter[idx] >= THETA) firstExceed.set(idx, t);
    }
    if (CHECKPOINTS.includes(t)) hashes.push(planeHash(sub, t, bytePlane));
  }
  const finals = memberIdx.map((i) => sub[i] & 63);
  const planted = memberIdx.map((i, j) => (j % 2 === 0 ? pairs[j / 2].d : pairs[(j - 1) / 2].d));
  const asc = finals.filter((d, j) => d > planted[j]).length;
  const desc = finals.filter((d, j) => d < planted[j]).length;
  const delivered = pairs.filter((p, i) => {
    const ia = p.a.y * 64 + p.a.x, ib = p.b.y * 64 + p.b.x;
    return firstExceed.has(ia) && firstExceed.has(ib);
  }).length;
  const bridgeTicks = bridgeTick.filter((b) => b !== null);
  return { hashes, massByTick, events, delivered, asc, desc,
    finals, planted, bridgeTicks, firstBridge: bridgeTicks.length ? Math.min(...bridgeTicks) : null,
    deliverTicks: pairs.map((p) => {
      const ia = p.a.y * 64 + p.a.x, ib = p.b.y * 64 + p.b.x;
      const ta = firstExceed.get(ia) ?? null, tb = firstExceed.get(ib) ?? null;
      return ta !== null && tb !== null ? Math.max(ta, tb) : null;
    }) };
}

function median(a) { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function iqr(a) { const s = [...a].sort((x, y) => x - y); const q1 = s[Math.floor(0.25 * (s.length - 1))], q3 = s[Math.floor(0.75 * (s.length - 1))]; return q3 - q1; }

// ------------------------------------------------------------------- runs ---
const results = { plain: [], shadowed: [] };
for (const cls of ['plain', 'shadowed']) {
  for (let si = 0; si < SIGMAS.length; si++) {
    const sigma = SIGMAS[si];
    const arms = [];
    for (let i = 0; i < TRIALS; i++) {
      const seed = BASE_SEED + i;
      const { pairs, weather, seedFn } = (() => {
        const rng = mulberry32(seed);
        const pairs0 = plantTwinPairs(rng, K, 64, 64, {});
        const weather0 = plantWeather(rng, pairs0, 64, 64, {});
        return { pairs: pairs0, weather: weather0, seedFn: seedFnFrom(pairs0, weather0) };
      })();
      const fn = cls === 'shadowed' ? shadowSeedFn(pairs, weather) : seedFn;
      const run = runArm(fn, pairs, sigma);
      const rerun = runArm(fn, pairs, sigma);
      const detOk = JSON.stringify(run.hashes) === JSON.stringify(rerun.hashes);
      arms.push({ seed, detOk, ...run });
    }
    const allDet = arms.every((a) => a.detOk);
    if (!allDet) throw new Error(`E-Q2 ${cls} sigma=${sigma}: determinism FAILED — VOID (F0 law)`);
    const bridgeRatePerTrial = arms.map((a) => a.bridgeTicks.length / K);
    const allBridgeTicks = arms.flatMap((a) => a.bridgeTicks);
    const delTicks = arms.flatMap((a) => a.deliverTicks).filter((x) => x !== null);
    results[cls].push({
      sigmaKey: SIGMA_KEYS[si], sigma: String(sigma),
      bridgeRateMedian: q(median(bridgeRatePerTrial)),
      medianFirstBridge: allBridgeTicks.length ? q(median(allBridgeTicks)) : null,
      iqrFirstBridge: allBridgeTicks.length ? q(iqr(allBridgeTicks)) : null,
      medianDeliverTick: delTicks.length ? q(median(delTicks)) : null,
      ascendMembers: arms.reduce((s, a) => s + a.asc, 0), descendMembers: arms.reduce((s, a) => s + a.desc, 0),
      totalMembers: 2 * K * TRIALS, events: arms.reduce((s, a) => s + a.events, 0),
      hashes: arms[0].hashes, massByTick: arms[0].massByTick.map(q),
      finalsMin: Math.min(...arms.flatMap((a) => a.finals)), finalsMax: Math.max(...arms.flatMap((a) => a.finals)),
      trials: arms,
    });
    console.log(`[e-q2] ${cls} sigma=${SIGMA_KEYS[si]} bridge=${median(bridgeRatePerTrial)} firstBridge=${allBridgeTicks.length ? median(allBridgeTicks) : '-'} ascend=${results[cls][si].ascendMembers}/${results[cls][si].totalMembers} det=ok`);
  }
}

// ------------------------------------------------- divergence vs sigma=1 ---
for (const cls of ['plain', 'shadowed']) {
  const ref = results[cls][1]; // sigma = 1 arm
  for (const r of results[cls]) {
    let div = 0;
    for (let t = 0; t < T; t++) div += Math.abs(r.massByTick[t] - ref.massByTick[t]);
    r.imagMassDivergenceVsSigma1 = String(div);
    const refH = ref.hashes;
    r.firstPlaneDivergenceVsSigma1 = r.hashes.findIndex((h, i) => h !== refH[i]) >= 0 ? CHECKPOINTS[r.hashes.findIndex((h, i) => h !== refH[i])] : null;
  }
}

// ------------------------------------------------------------ verdicts ---
function verdictFor(cls) {
  const rs = results[cls];
  const best = Math.max(...rs.map((r) => Number(r.bridgeRateMedian)));
  let cands = rs.filter((r) => Number(r.bridgeRateMedian) === best);
  if (cands.length > 1) {
    const vals = cands.map((r) => (r.medianFirstBridge === null ? Infinity : r.medianFirstBridge));
    const mb = Math.min(...vals);
    cands = cands.filter((r, i) => vals[i] === mb);
  }
  if (cands.length > 1) {
    const vals = cands.map((r) => (r.iqrFirstBridge === null ? Infinity : r.iqrFirstBridge));
    const mi = Math.min(...vals);
    cands = cands.filter((r, i) => vals[i] === mi);
  }
  if (cands.length === rs.length) {
    return { verdict: 'NO CRITICAL SCALE: full tie across all swept sigma on this class — sigma monotone-inert HERE (honest null for C3 on this class)', winners: cands.map((c) => c.sigmaKey) };
  }
  return { verdict: 'winner by sealed rule', winners: cands.map((c) => c.sigmaKey) };
}

const shadowPass = (r) => r.ascendMembers > r.descendMembers;
const failing = results.shadowed.filter((r) => !shadowPass(r));
const passing = results.shadowed.filter((r) => shadowPass(r));
const hiFail = failing.length ? Math.max(...failing.map((r) => Number(r.sigma))) : null;
const loPass = passing.length ? Math.min(...passing.map((r) => Number(r.sigma))) : null;
const band = failing.length && passing.length ? `[${hiFail}, ${loPass})` : (passing.length === SIGMAS.length ? 'none: all swept sigma pass' : 'none: all swept sigma fail');
const log2_3_at_edge = (loPass === Math.log2(3) && failing.length > 0) || (hiFail === Math.log2(3) && passing.length > 0);
const shadowVerdict = `critical band = ${band}; log2(3) at a band edge: ${log2_3_at_edge ? 'YES (unique-edge test must still hold)' : 'NO — the gift\'s number is not singled out by the data'}`;

console.log(`[e-q2] plain: ${verdictFor('plain').verdict} winners=${verdictFor('plain').winners}`);
console.log(`[e-q2] shadowed: ascend band=${band} | ${shadowVerdict}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q2_results.json'), JSON.stringify({
  experiment: 'E-Q2', claim: 'C3', kernel: kernelReport(), stonePath, preRegSha, amendSha,
  task: { w: 64, h: 64, K, T, theta_del: THETA, trials: TRIALS, baseSeed: BASE_SEED, sigmas: SIGMA_KEYS },
  summary: {
    plain: results.plain.map(({ trials, massByTick, hashes, ...rest }) => rest),
    shadowed: results.shadowed.map(({ trials, massByTick, hashes, ...rest }) => rest),
    plainVerdict: verdictFor('plain'), shadowedBand: band, shadowedVerdict: shadowVerdict,
  },
  full: results,
}, null, 1));

// ---------------------------------------------------------------- receipts ---
const rows = [
  { kind: 'rules.EQ2', frozen_by: 'pre_registration.json + pre_registration_amendment_1.json (both committed before runs)', pre_reg_sha256: preRegSha, amend_sha256: amendSha,
    posture: 'no favorite sigma; gift proof decorative; sealed verdict rules per class; shadowed-class flip threshold 66/67 predicted between sigma 0.5 and 1' },
  { kind: 'run.config', experiment: 'E-Q2', kernel: kernelReport(), stone_linked: stonePath,
    task: 'fixed task set = E-Q1 seeds 33001..33020; classes plain + shadowed (2x Repel d=33 per member, real_acc=-66); sigma arms 0.5/1/log2(3)/2/4; T=200' },
];
for (const cls of ['plain', 'shadowed']) {
  for (const r of results[cls]) {
    rows.push({ kind: 'result.arm', experiment: 'E-Q2', cls, sigmaKey: r.sigmaKey,
      bridgeRateMedian: r.bridgeRateMedian, medianFirstBridge: r.medianFirstBridge, iqrFirstBridge: r.iqrFirstBridge,
      medianDeliverTick: r.medianDeliverTick, ascendMembers: r.ascendMembers, descendMembers: r.descendMembers, totalMembers: r.totalMembers,
      events: r.events, finalsMin: r.finalsMin, finalsMax: r.finalsMax,
      imagMassDivergenceVsSigma1: r.imagMassDivergenceVsSigma1, firstPlaneDivergenceVsSigma1: r.firstPlaneDivergenceVsSigma1,
      detOk: r.trials.every((t) => t.detOk) });
  }
}
rows.push({ kind: 'verdict.EQ2', experiment: 'E-Q2',
  plain: verdictFor('plain').verdict, plainWinners: verdictFor('plain').winners,
  shadowedBand: band, shadowed: shadowVerdict, log2_3_at_band_edge: log2_3_at_edge });

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q2', claim: 'C3' });
console.log(`[e-q2] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q2_tip.txt'), `${v.tip} links=${v.links}\n`);
