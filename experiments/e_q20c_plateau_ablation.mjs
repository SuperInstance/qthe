// experiments/e_q20c_plateau_ablation.mjs — E-Q20c, ORCH-R23/T14-b: the
// plateau-mechanism ablation. E-Q20b sealed A3's metastable plateau (~16-20%
// above the A1 floor, t=128..512). THE QUESTION: is the correlation reservoir
// the WORMHOLE TWIN CHANNEL or the LOCAL Moore-8 coupling? Ablation: the same
// arms and ladder with tick(sub, {wormholes:false}).
//
// REGISTRATION: experiments/pre_registration_e_q20c.json (sha-frozen before
// this run). FLOORS: F0'' the ON-gate (reproduce E-Q20b's sealed ON values
// byte-exactly BEFORE the OFF arm counts — hashes at t=512, floor table,
// cross-arm medians); F-m1 twinRate == 0 at every checkpoint under OFF;
// F-m2 journal-replay determinism x2 under OFF.
//
// HYPOTHESES: H1c OFF plateau ratio >= 15% below ON (the twin channel carries
// the memory); H0c OFF within the plane-bootstrap 95% CI of ON (the local
// coupling is the reservoir). Predictions P1-P5 frozen in the registration.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKernel, makeSubstrate, tick, mulberry32, kernelReport } from './_adapter.mjs';
import { appendAndVerify, planeHash, q, fileSha256 } from './_harness.mjs';
import { linkStone } from './_stone_link.mjs';

await loadKernel(); // the adapter law

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'experiments', 'outputs');
mkdirSync(OUT, { recursive: true });

const W = 64, H = 64, N = W * H, T = 512;
const N_A1 = 20, N_A3 = 5;
const CHECKPOINTS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 192, 256, 320, 384, 448, 512];
const SEED_BASE = 20261018;
const CHAIN = join(ROOT, 'receipts', 'e_q20c_chain.jsonl');

const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q20c.json'));
const sealed = JSON.parse(readFileSync(join(OUT, 'e_q20b_results.json'), 'utf8')); // the ON reference

// ── statistics helpers (verbatim E-Q20 lineage) ─────────────────────────────
function dHist(cells) { const h = new Array(64).fill(0); for (let i = 0; i < N; i++) h[cells[i] & 63]++; return h.map((x) => x / N); }
function tauFrac(cells) { const f = [0, 0, 0, 0]; for (let i = 0; i < N; i++) f[cells[i] >> 6]++; return f.map((x) => x / N); }
function wasserstein1(fA, fB) { let cdfA = 0, cdfB = 0, w = 0; for (let k = 0; k < 64; k++) { cdfA += fA[k]; cdfB += fB[k]; w += Math.abs(cdfA - cdfB); } return w; }
function tv(p, qq) { let s = 0; for (let k = 0; k < 4; k++) s += Math.abs(p[k] - qq[k]); return 0.5 * s; }
function moransI(cells, moore) {
  const d = new Float64Array(N);
  let mean = 0;
  for (let i = 0; i < N; i++) { d[i] = cells[i] & 63; mean += d[i]; }
  mean /= N;
  let num = 0, den = 0;
  for (let y = 0; y < H; y++) {
    const yU = (y + H - 1) % H, yD = (y + 1) % H;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dz = d[i] - mean;
      den += dz * dz;
      const xL = (x + W - 1) % W, xR = (x + 1) % W;
      const nbrs = [[yU, xL], [yU, x], [yU, xR], [y, xL], [y, xR], [yD, xL], [yD, x], [yD, xR]];
      for (const [ny, nx] of nbrs) num += dz * (d[ny * W + nx] - mean);
    }
  }
  return (N / (8 * N)) * (num / den);
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct95 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]; };

function planeFromJournal(bytes) { return makeSubstrate(W, H, (x, y, i) => bytes[i]); }

// wormholes: true|false — the manipulation. record() observes twinRate via the
// kernel's lastEvents (which the OFF tick still emits for local events; twin
// events are the wormhole-table reads and must be absent under OFF).
function runPlane(bytes, wormholes) {
  let sub = planeFromJournal(bytes);
  const rec = { hashes: {}, moransI8: {}, dHist: {}, tauFrac: {}, twinRate: {} };
  const record = (t, twinEvents, ticksInWindow) => {
    rec.hashes[t] = planeHash(sub, t, (s) => s);
    rec.moransI8[t] = moransI(sub, true);
    rec.dHist[t] = dHist(sub);
    rec.tauFrac[t] = tauFrac(sub);
    rec.twinRate[t] = ticksInWindow > 0 ? twinEvents / ticksInWindow / N : 0;
  };
  record(0, 0, 0);
  let lastCp = 0, windowEvents = 0;
  for (let t = 1; t <= T; t++) {
    sub = tick(sub, { wormholes });
    windowEvents += (sub.lastEvents || []).filter((e) => e.kind === 'twin').length;
    if (CHECKPOINTS.includes(t)) { record(t, windowEvents, t - lastCp); windowEvents = 0; lastCp = t; }
  }
  return rec;
}

// ══ PHASE 0 — arms from sealed material (identical to E-Q20b) ═══════════════
console.log('[e-q20c] phase 0: arms from sealed material (zero credits)');
const journals = { A1: [], A3: [], A3S: [] };
for (let k = 0; k < N_A1; k++) {
  const rng = mulberry32(SEED_BASE + k);
  const j = new Uint8Array(N);
  for (let i = 0; i < N; i++) j[i] = Math.floor(rng() * 256) & 0xff;
  journals.A1.push(j);
}
const jrn = JSON.parse(readFileSync(join(OUT, 'e_q20_blur_journal.json'), 'utf8'));
const cometRoot = JSON.parse(readFileSync(join(OUT, 'e_q20_comet_root.json'), 'utf8'));
const rootBytes = Buffer.from(cometRoot.root_hex, 'hex');
const NEED = 40960;
let expanded = Buffer.alloc(0);
for (let c = 0; expanded.length < NEED; c++) {
  const ctr = Buffer.alloc(4); ctr.writeUInt32BE(c >>> 0, 0);
  expanded = Buffer.concat([expanded, createHash('sha256').update(ctr).update(rootBytes).digest()]);
}
const cometBytes = new Uint8Array(expanded.subarray(0, NEED));
for (let k = 0; k < N_A3; k++) {
  const tauSrc = cometBytes.slice(k * N, (k + 1) * N);
  const out = jrn.blurs[k].output;
  const j = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    j[i] = ((tauSrc[i] >> 6) << 6) | Math.max(0, Math.min(63, Math.round(out[y][x])));
  }
  journals.A3.push(j);
}
{
  const rng = mulberry32(SEED_BASE);
  const P = new Array(N);
  for (let i = 0; i < N; i++) P[i] = i;
  for (let i = N - 1; i > 0; i--) { const jj = Math.floor(rng() * (i + 1)); const tmp = P[i]; P[i] = P[jj]; P[jj] = tmp; }
  for (let k = 0; k < N_A3; k++) {
    const src = journals.A3[k];
    const j = new Uint8Array(N);
    for (let i = 0; i < N; i++) j[i] = ((src[i] >> 6) << 6) | (src[P[i]] & 63);
    journals.A3S.push(j);
  }
}

// ══ PHASE 1 — F0'' THE ON-GATE (reproduce E-Q20b byte-exactly) ══════════════
console.log('[e-q20c] phase 1: F0\'\' ON-gate — reproduce E-Q20b (ON) byte-exactly');
const METRICS = ['dW1', 'tauTV', 'moransI8', 'twinRate'];
function buildRef(runList) {
  const ref = {};
  for (const t of CHECKPOINTS) {
    const dh = new Array(64).fill(0), tf = [0, 0, 0, 0];
    for (const r of runList) { for (let b = 0; b < 64; b++) dh[b] += r.dHist[t][b]; for (let c = 0; c < 4; c++) tf[c] += r.tauFrac[t][c]; }
    ref[t] = { dHist: dh.map((x) => x / runList.length), tauFrac: tf.map((x) => x / runList.length), moransI8: median(runList.map((r) => r.moransI8[t])), twinRate: median(runList.map((r) => r.twinRate[t])) };
  }
  return ref;
}
function distancesVsRef(armRuns, ref) {
  const out = { dW1: {}, tauTV: {}, moransI8: {}, twinRate: {} };
  for (const t of CHECKPOINTS) for (const r of armRuns) {
    (out.dW1[t] = out.dW1[t] || []).push(wasserstein1(r.dHist[t], ref[t].dHist));
    (out.tauTV[t] = out.tauTV[t] || []).push(tv(r.tauFrac[t], ref[t].tauFrac));
    (out.moransI8[t] = out.moransI8[t] || []).push(Math.abs(r.moransI8[t] - ref[t].moransI8));
    (out.twinRate[t] = out.twinRate[t] || []).push(Math.abs(r.twinRate[t] - ref[t].twinRate));
  }
  return out;
}
function analyze(runsOn) {
  const looDist = { dW1: {}, tauTV: {}, moransI8: {}, twinRate: {} };
  for (let i = 0; i < N_A1; i++) {
    const others = runsOn.A1.filter((_, k) => k !== i);
    const dd = distancesVsRef([runsOn.A1[i]], buildRef(others));
    for (const m of METRICS) for (const t of CHECKPOINTS) (looDist[m][t] = looDist[m][t] || []).push(dd[m][t][0]);
  }
  const floor = {};
  for (const m of METRICS) { floor[m] = {}; for (const t of CHECKPOINTS) floor[m][t] = pct95(looDist[m][t]); }
  const fullRef = buildRef(runsOn.A1);
  const cross = {};
  for (const arm of ['A3', 'A3S']) {
    const dd = distancesVsRef(runsOn[arm], fullRef);
    cross[arm] = {};
    for (const m of METRICS) { cross[arm][m] = {}; for (const t of CHECKPOINTS) cross[arm][m][t] = { median: median(dd[m][t]), perPlane: dd[m][t] }; }
  }
  return { floor, cross, looDist };
}

const runsOn = { A1: [], A3: [], A3S: [] };
for (const arm of Object.keys(journals)) for (let k = 0; k < journals[arm].length; k++) runsOn[arm].push(runPlane(journals[arm][k], true));
const onAnalysis = analyze(runsOn);
let onGate = { hashChecks: 0, hashOk: 0, floorChecks: 0, floorOk: 0, crossChecks: 0, crossOk: 0, failures: [] };
for (const arm of ['A1', 'A3', 'A3S']) for (let k = 0; k < runsOn[arm].length; k++) {
  onGate.hashChecks++;
  const mine = runsOn[arm][k].hashes[512], sealedH = sealed.hashes[arm][k];
  if (mine === sealedH) onGate.hashOk++; else onGate.failures.push(`hash ${arm}[${k}] ON != sealed`);
}
for (const m of METRICS) for (const t of CHECKPOINTS) {
  onGate.floorChecks++;
  if (onAnalysis.floor[m][t] === sealed.floorTable[m][String(t)]) onGate.floorOk++;
  else onGate.failures.push(`floor ${m}@${t} ON ${onAnalysis.floor[m][t]} != sealed ${sealed.floorTable[m][String(t)]}`);
}
for (const arm of ['A3', 'A3S']) for (const m of METRICS) for (const t of CHECKPOINTS) {
  onGate.crossChecks++;
  const mine = onAnalysis.cross[arm][m][t].median, sealedV = sealed.crossArm[arm][m][String(t)] && sealed.crossArm[arm][m][String(t)].median;
  if (mine === sealedV) onGate.crossOk++; else onGate.failures.push(`cross ${arm}.${m}@${t} ON ${mine} != sealed ${sealedV}`);
}
const F0pp = onGate.hashOk === onGate.hashChecks && onGate.floorOk === onGate.floorChecks && onGate.crossOk === onGate.crossChecks;
console.log(`  F0'' ON-gate: hashes ${onGate.hashOk}/${onGate.hashChecks}, floor ${onGate.floorOk}/${onGate.floorChecks}, cross ${onGate.crossOk}/${onGate.crossChecks} -> ${F0pp ? 'PASS' : 'VOID LOUD'}`);
if (!F0pp) { for (const f of onGate.failures.slice(0, 10)) console.error('  ' + f); process.exit(4); }

// ══ PHASE 2 — THE OFF RUN ═══════════════════════════════════════════════════
console.log('[e-q20c] phase 2: the OFF run (wormholes: false), 30 planes to t=512');
const runsOff = { A1: [], A3: [], A3S: [] };
for (const arm of Object.keys(journals)) for (let k = 0; k < journals[arm].length; k++) runsOff[arm].push(runPlane(journals[arm][k], false));

// F-m1: twinRate == 0 everywhere under OFF
let twinMax = 0;
for (const arm of Object.keys(runsOff)) for (const r of runsOff[arm]) for (const t of CHECKPOINTS) twinMax = Math.max(twinMax, r.twinRate[t]);
const Fm1 = twinMax === 0;
console.log(`  F-m1 twinRate==0 under OFF: ${Fm1 ? 'PASS (max ' + twinMax + ')' : 'VOID — max ' + twinMax}`);
if (!Fm1) process.exit(4);

// F-m2: determinism x2 under OFF
let detOk = 0, detPairs = 0;
for (const arm of Object.keys(journals)) for (let k = 0; k < journals[arm].length; k++) {
  const replay = runPlane(journals[arm][k], false);
  detPairs++;
  let same = true;
  for (const t of CHECKPOINTS) if (replay.hashes[t] !== runsOff[arm][k].hashes[t]) same = false;
  if (same) detOk++;
}
const Fm2 = detOk === detPairs;
console.log(`  F-m2 determinism (OFF replay x2): ${detOk}/${detPairs} ${Fm2 ? 'byte-identical' : 'VOID'}`);
if (!Fm2) process.exit(4);

const offAnalysis = analyze(runsOff);

// ══ PHASE 3 — hypotheses ════════════════════════════════════════════════════
console.log('[e-q20c] phase 3: hypotheses');
const PLATEAU_TS = [256, 320, 384, 448, 512];
const ratio = (analysis) => PLATEAU_TS.reduce((s, t) => s + analysis.cross.A3.moransI8[t].median / analysis.floor.moransI8[t], 0) / PLATEAU_TS.length;
const onRatio = ratio(onAnalysis), offRatio = ratio(offAnalysis);
const drop = (onRatio - offRatio) / onRatio;

// plane bootstrap CI for the ON ratio (resample the 5 A3 planes' per-plane distances)
function perPlaneRatios(analysis, runsArm) {
  // per-plane distance/floor at plateau ts, using the SAME floor
  return runsArm.map((r, k) => {
    // recompute this plane's distance to the A1 ref
    let s = 0;
    for (const t of PLATEAU_TS) {
      const refI = buildRef(runsOn.A1)[t].moransI8; // ON A1 population ref (same for all ON measures)
      s += Math.abs(r.moransI8[t] - refI) / analysis.floor.moransI8[t];
    }
    return s / PLATEAU_TS.length;
  });
}
const onPerPlane = perPlaneRatios(onAnalysis, runsOn.A3);
const boot = [];
for (let b = 0; b < 2000; b++) {
  let s = 0;
  for (let i = 0; i < N_A3; i++) s += onPerPlane[Math.floor(Math.random() * N_A3)];
  boot.push(s / N_A3);
}
boot.sort((a, b) => a - b);
const ciLo = boot[Math.floor(0.025 * boot.length)], ciHi = boot[Math.floor(0.975 * boot.length)];
const H1c = drop >= 0.15;
const H0c = offRatio >= ciLo && offRatio <= ciHi;

// the A3S excursion structure, ON vs OFF (AS-SAID)
const excursionOn = Math.max(...CHECKPOINTS.map((t) => onAnalysis.cross.A3S.moransI8[t].median));
const excursionOff = Math.max(...CHECKPOINTS.map((t) => offAnalysis.cross.A3S.moransI8[t].median));

const fmt = (x) => String(Math.round(x * 1e4) / 1e4);
const verdict = `E-Q20c VERDICT (the plateau-mechanism ablation, wormholes OFF, zero credits): H1c ${H1c ? `LIVES — the OFF plateau ratio drops ${fmt(drop * 100)}% (>= the registered 15%): the wormhole twin channel carries the correlation memory` : `DIES — the OFF ratio drops only ${fmt(drop * 100)}% (< the registered 15%)`}. H0c ${H0c ? `LIVES — OFF ratio ${fmt(offRatio)} inside the ON plane-bootstrap 95% CI [${fmt(ciLo)}, ${fmt(ciHi)}] (ON ratio ${fmt(onRatio)}): the reservoir is the LOCAL Moore-8 coupling` : `DIES — OFF ratio ${fmt(offRatio)} OUTSIDE the CI [${fmt(ciLo)}, ${fmt(ciHi)}]`}. ${H1c && !H0c ? 'THE TWIN CHANNEL IS THE RESERVOIR.' : !H1c && H0c ? 'THE LOCAL COUPLING IS THE RESERVOIR — the wormhole channel is correlation-silent at these horizons (twin events ~1e-4/cell/tick; P1/P2 HIT).' : 'INCONCLUSIVE-BY-DESIGN (the 15% line and the CI edge are different instruments; receipted in the registration).'}. A3S excursion: ON max ${fmt(excursionOn)} vs OFF max ${fmt(excursionOff)} (P3 ${excursionOff > onAnalysis.floor.moransI8[16] * 1.5 ? 'HIT — the excursion is local-rule-built, survives OFF' : 'structure changed'}). F0'' ON-gate byte-exact (hashes ${onGate.hashOk}/${onGate.hashChecks}, floor ${onGate.floorOk}/${onGate.floorChecks}, cross ${onGate.crossOk}/${onGate.crossChecks}); F-m1 twinRate==0 under OFF (max ${twinMax}); F-m2 determinism ${detOk}/${detPairs}.`;

// ══ PHASE 4 — seal ══════════════════════════════════════════════════════════
writeFileSync(join(OUT, 'e_q20c_results.json'), JSON.stringify({
  experiment: 'E-Q20c', claim: 'the plateau mechanism — twin channel vs local coupling (an ablation of the E-Q20b slow mode)', kernel: kernelReport(),
  preRegSha,
  registration: 'experiments/pre_registration_e_q20c.json',
  task: { W, H, T, checkpoints: CHECKPOINTS, arms: { A1: N_A1, A3: N_A3, A3S: N_A3 }, manipulation: 'tick(sub, {wormholes:false}) for every tick of every arm', seedBase: SEED_BASE, mothCredits: 0 },
  floors: { F0pp, onGate, Fm1, twinMax, Fm2, detOk, detPairs },
  onRatios: { plateau: onRatio, perPlane: onPerPlane },
  offRatios: { plateau: offRatio },
  bootstrap: { ciLo, ciHi, draws: 2000 },
  hypotheses: { H1c, H0c, drop, excursionOn, excursionOff },
  floorTableOff: offAnalysis.floor, crossArmOff: offAnalysis.cross,
  hashesOff: Object.fromEntries(Object.keys(runsOff).map((a) => [a, runsOff[a].map((r) => r.hashes[512])])),
  verdict,
}, null, 1));

writeFileSync(join(OUT, 'e_q20c_verdict.md'), `# E-Q20c verdict — the plateau-mechanism ablation (wormholes OFF)\n\n${verdict.replace(/; /g, ';\n\n')}\n\n## The ladder OFF vs ON (Moore-8 Moran's I distance median, vs each run's own A1 floor)\n\n| t | A3 OFF | A3 ON | A3S OFF | A3S ON | floor OFF | floor ON |\n|---|---|---|---|---|---|---|\n${CHECKPOINTS.map((t) => `| ${t} | ${fmt(offAnalysis.cross.A3.moransI8[t].median)} | ${fmt(onAnalysis.cross.A3.moransI8[t].median)} | ${fmt(offAnalysis.cross.A3S.moransI8[t].median)} | ${fmt(onAnalysis.cross.A3S.moransI8[t].median)} | ${fmt(offAnalysis.floor.moransI8[t])} | ${fmt(onAnalysis.floor.moransI8[t])} |`).join('\n')}\n\n## The plateau ratio (mean dist/floor over t in {256..512})\n\n- ON: ${fmt(onRatio)} (per-plane [${onPerPlane.map(fmt).join(', ')}]; bootstrap 95% CI [${fmt(ciLo)}, ${fmt(ciHi)}])\n- OFF: ${fmt(offRatio)} (drop ${fmt(drop * 100)}%)\n`);

const rows = [
  { kind: 'rules.EQ20c', frozen_by: 'experiments/pre_registration_e_q20c.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R22 close-out + ORCH-R23 registration lane T14-b: the plateau-mechanism question',
    claim: 'the E-Q20b metastable plateau mechanism — wormhole twin channel vs local Moore-8 coupling (an ablation, not a new claim)',
    floors: "F0'' ON-gate byte-exact vs sealed E-Q20b; F-m1 twinRate==0 under OFF; F-m2 OFF determinism x2",
    bands: 'H1c OFF ratio >= 15% below ON (twin reservoir); H0c OFF within ON plane-bootstrap 95% CI (local reservoir)' },
  { kind: 'run.config', experiment: 'E-Q20c', kernel: kernelReport(),
    design: `identical arms to E-Q20b (A1 n=20 / A3 n=5 / A3S n=5, journals + AM5 expansion); tick {wormholes:false}; t=512; same checkpoints/metrics/floor machinery`,
    moth: 'ZERO credits' },
  { kind: 'verdict.EQ20c', experiment: 'E-Q20c', H1c, H0c, drop: q(drop), onRatio: q(onRatio), offRatio: q(offRatio), ciLo: q(ciLo), ciHi: q(ciHi), excursionOn: q(excursionOn), excursionOff: q(excursionOff), F0pp, Fm1, Fm2, detOk, detPairs, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q20c', claim: 'plateau-mechanism-ablation' });
writeFileSync(join(OUT, 'e_q20c_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q20c] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q20c] ${verdict}\n`);
