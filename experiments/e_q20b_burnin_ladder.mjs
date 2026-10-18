// experiments/e_q20b_burnin_ladder.mjs — E-Q20b, ORCH-R22/T13-d: the burn-in
// ladder. E-Q20 sealed T* > 64 (spatial autocorrelation is a SLOW MODE of the
// tick operator; A3's Moore-8 distance converging monotonically but still
// above the A1 LOO floor at t=64). This extension ladders the SAME sealed
// planes to t=512 — ZERO moth credits (journal replay only) — to price the
// relaxation time T*.
//
// REGISTRATION: experiments/pre_registration_e_q20b.json (sha-frozen before
// this run). The Groq seat trial (situations/groq_seats/seat_trial_r22.jsonl)
// attacked the registration; the repo's answers are baked here:
//   - F0' GATE (the convergent critical family, qwen-A1/A2 + oss-A2): the
//     re-derived A1/A3/A3S runs must reproduce E-Q20's sealed values
//     BYTE-EXACTLY at every common checkpoint (hashes at t=64, floor table,
//     crossArm medians) before any t>64 row counts. A mismatch VOIDS LOUD.
//   - FIRST-TOUCH PINNED (qwen-A5): the first checkpoint where A3's distance
//     <= 1.5x that checkpoint's floor.
//   - A3S SHUFFLE INHERITANCE (qwen-A3): ONE global fixed-seed Fisher-Yates
//     permutation (mulberry32(20261018), the E-Q9-DT idiom), verbatim from
//     E-Q20 phase 2.
//   - A2 EXCLUDED (oss-A4 declined on facts): H1 already sealed — byte
//     provenance is invisible; A2 adds no discriminating power for T*.
//   - FLOOR TRAJECTORY RECORDED (qwen-A2 accepted): the floor is published
//     at every checkpoint so wobble-vs-dynamics is answerable from the
//     artifact.
//
// ARMS: A1 PRNG n=20 (the noise-floor population), A3 QBLUR n=5 (journal),
// A3S shuffled-control n=5 (the same fixed permutation as E-Q20).
// METRICS: Moore-8 Moran's I distance (PRIMARY, the AM3 law); dW1, tauTV,
// twinRate (the washed-out controls). FLOORS: A1 LOO 95th pct nearest-rank
// at EACH checkpoint; population statistic = MEDIAN (the AM2 law).
//
// HYPOTHESES (frozen in the registration):
//   H1b  T* <= 512 (the first sticky sub-floor checkpoint exists in the ladder)
//   H2b  monotone after t=16: no excursion above 1.5x floor after first touch
//   null T* > 512 — the slow-mode law EXTENDS; C11's annotation amends only.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKernel, makeSubstrate, tick, mulberry32, kernelReport } from './_adapter.mjs';
import { appendAndVerify, planeHash, q, fileSha256 } from './_harness.mjs';
import { linkStone } from './_stone_link.mjs';

await loadKernel(); // the adapter law (the AM6 crash class, never again)

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'experiments', 'outputs');
mkdirSync(OUT, { recursive: true });

const W = 64, H = 64, N = W * H, T = 512;
const N_A1 = 20, N_A3 = 5;
const CHECKPOINTS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 192, 256, 320, 384, 448, 512];
const EQ20_CHECKPOINTS = [0, 1, 2, 4, 8, 16, 32, 64]; // the sealed ladder's checkpoints (F0' common set)
const SEED_BASE = 20261018;
const CHAIN = join(ROOT, 'receipts', 'e_q20b_chain.jsonl');

const preRegPath = join(ROOT, 'experiments', 'pre_registration_e_q20b.json');
const preRegSha = fileSha256(preRegPath);
const attackSha = fileSha256(join(ROOT, 'situations', 'groq_seats', 'seat_trial_r22.jsonl'));
const sealed = JSON.parse(readFileSync(join(OUT, 'e_q20_results.json'), 'utf8')); // the F0' reference

// ── statistics helpers (verbatim E-Q20 — the F0' gate demands it) ───────────
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
      const nbrs = moore
        ? [[yU, xL], [yU, x], [yU, xR], [y, xL], [y, xR], [yD, xL], [yD, x], [yD, xR]]
        : [[yU, x], [y, xL], [y, xR], [yD, x]];
      for (const [ny, nx] of nbrs) num += dz * (d[ny * W + nx] - mean);
    }
  }
  const s0 = (moore ? 8 : 4) * N;
  return (N / s0) * (num / den);
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct95 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]; };

function planeFromJournal(bytes) { return makeSubstrate(W, H, (x, y, i) => bytes[i]); }

function runPlane(bytes) {
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
    sub = tick(sub);
    windowEvents += (sub.lastEvents || []).filter((e) => e.kind === 'twin').length;
    if (CHECKPOINTS.includes(t)) { record(t, windowEvents, t - lastCp); windowEvents = 0; lastCp = t; }
  }
  return rec;
}

// ══ PHASE 0 — construct arms from sealed material (zero credits) ════════════
console.log('[e-q20b] phase 0: constructing arms from sealed material');
const journals = { A1: [], A3: [], A3S: [] };

for (let k = 0; k < N_A1; k++) {                      // A1: PRNG (the E-Q20 recipe)
  const rng = mulberry32(SEED_BASE + k);
  const j = new Uint8Array(N);
  for (let i = 0; i < N; i++) j[i] = Math.floor(rng() * 256) & 0xff;
  journals.A1.push(j);
}
const jrn = JSON.parse(readFileSync(join(OUT, 'e_q20_blur_journal.json'), 'utf8')); // the 5 sealed blur grids
if (jrn.blurs.length !== N_A3) { console.error(`[e-q20b] FAIL-CLOSED: journal has ${jrn.blurs.length} blurs, expected ${N_A3}`); process.exit(3); }
const a2SeedTau = sealed ? null : null; // tau source for A3 is E-Q20's A2 planes — re-derived below from the comet root (free, hash expansion only)
const cometRoot = JSON.parse(readFileSync(join(OUT, 'e_q20_comet_root.json'), 'utf8'));
if (!cometRoot.bell_witness || !(cometRoot.bell_witness.S > 2)) { console.error('[e-q20b] FAIL-CLOSED: F2 bell witness missing/S<=2 in the sealed root receipt'); process.exit(3); }
const rootBytes = Buffer.from(cometRoot.root_hex, 'hex');
const NEED = 40960;
let expanded = Buffer.alloc(0);
for (let c = 0; expanded.length < NEED; c++) {
  const ctr = Buffer.alloc(4); ctr.writeUInt32BE(c >>> 0, 0);
  expanded = Buffer.concat([expanded, createHash('sha256').update(ctr).update(rootBytes).digest()]);
}
const cometBytes = new Uint8Array(expanded.subarray(0, NEED)); // the AM5 expansion — deterministic, 0 credits

for (let k = 0; k < N_A3; k++) {                      // A3: tau from comet-expanded A2 plane k, d from the sealed blur grids
  const tauSrc = cometBytes.slice(k * N, (k + 1) * N);
  const out = jrn.blurs[k].output;
  const j = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const dv = Math.max(0, Math.min(63, Math.round(out[y][x])));
    j[i] = ((tauSrc[i] >> 6) << 6) | dv;
  }
  journals.A3.push(j);
}
{ // A3S: the ONE fixed global permutation (E-Q20 verbatim)
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
console.log(`  arms: A1 ${journals.A1.length} + A3 ${journals.A3.length} + A3S ${journals.A3S.length} (A2 excluded, registered)`);

// ══ PHASE 1 — run to t=512 ══════════════════════════════════════════════════
console.log('[e-q20b] phase 1: running 30 planes to t=512 (zero credits)');
const runs = { A1: [], A3: [], A3S: [] };
for (const arm of Object.keys(journals)) for (let k = 0; k < journals[arm].length; k++) runs[arm].push(runPlane(journals[arm][k]));
console.log('  30 planes done');

// ══ PHASE 2 — F0' GATE (byte-exact vs the sealed E-Q20 values) ══════════════
console.log('[e-q20b] phase 2: F0\' gate — byte-exact reproduction of the sealed t<=64 values');
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
// LOO floor at every checkpoint
const looDist = { dW1: {}, tauTV: {}, moransI8: {}, twinRate: {} };
for (let i = 0; i < N_A1; i++) {
  const others = runs.A1.filter((_, k) => k !== i);
  const ref = buildRef(others);
  const dd = distancesVsRef([runs.A1[i]], ref);
  for (const m of METRICS) for (const t of CHECKPOINTS) (looDist[m][t] = looDist[m][t] || []).push(dd[m][t][0]);
}
const floor = {};
for (const m of METRICS) { floor[m] = {}; for (const t of CHECKPOINTS) floor[m][t] = pct95(looDist[m][t]); }

// cross-arm distances vs the full A1 population
const fullRef = buildRef(runs.A1);
const cross = {};
for (const arm of ['A3', 'A3S']) {
  const dd = distancesVsRef(runs[arm], fullRef);
  cross[arm] = {};
  for (const m of METRICS) { cross[arm][m] = {}; for (const t of CHECKPOINTS) cross[arm][m][t] = { median: median(dd[m][t]), perPlane: dd[m][t] }; }
}

// the gate checks (all must be EXACT)
let gate = { hashChecks: 0, hashOk: 0, floorChecks: 0, floorOk: 0, crossChecks: 0, crossOk: 0, failures: [] };
for (const arm of ['A1', 'A3', 'A3S']) for (let k = 0; k < runs[arm].length; k++) {
  gate.hashChecks++;
  const mine = runs[arm][k].hashes[64], sealedH = sealed.hashes[arm][k];
  if (mine === sealedH) gate.hashOk++; else gate.failures.push(`hash ${arm}[${k}] ${mine.slice(0, 12)}… != sealed ${String(sealedH).slice(0, 12)}…`);
}
for (const m of METRICS) for (const t of EQ20_CHECKPOINTS) {
  gate.floorChecks++;
  if (floor[m][t] === sealed.floorTable[m][String(t)]) gate.floorOk++;
  else gate.failures.push(`floor ${m}@${t}: ${floor[m][t]} != sealed ${sealed.floorTable[m][String(t)]}`);
}
for (const arm of ['A3', 'A3S']) for (const m of METRICS) for (const t of EQ20_CHECKPOINTS) {
  gate.crossChecks++;
  const mine = cross[arm][m][t].median, sealedV = sealed.crossArm[arm][m][String(t)] && sealed.crossArm[arm][m][String(t)].median;
  if (mine === sealedV) gate.crossOk++;
  else gate.failures.push(`cross ${arm}.${m}@${t}: ${mine} != sealed ${sealedV}`);
}
const F0p = gate.hashOk === gate.hashChecks && gate.floorOk === gate.floorChecks && gate.crossOk === gate.crossChecks;
console.log(`  F0' gate: hashes ${gate.hashOk}/${gate.hashChecks}, floor ${gate.floorOk}/${gate.floorChecks}, cross ${gate.crossOk}/${gate.crossChecks} -> ${F0p ? 'PASS (byte-exact)' : 'VOID LOUD'}`);
if (!F0p) {
  writeFileSync(join(OUT, 'e_q20b_results.json'), JSON.stringify({ status: 'VOID-LOUD (F0\' mismatch)', gate, at: new Date().toISOString() }, null, 1));
  for (const f of gate.failures.slice(0, 20)) console.error('  ' + f);
  process.exit(4);
}

// ══ PHASE 3 — hypotheses ════════════════════════════════════════════════════
console.log('[e-q20b] phase 3: hypotheses');
const dist = (arm, t) => cross[arm].moransI8[t].median;
const fl = (t) => floor.moransI8[t];
// H1b: the first sticky sub-floor checkpoint (E-Q20's T* definition carried verbatim, extended to 512)
let Tstar = null;
for (const t of CHECKPOINTS) {
  if (dist('A3', t) <= fl(t) && CHECKPOINTS.filter((u) => u > t).every((u) => dist('A3', u) <= fl(u))) { Tstar = t; break; }
}
const H1b = Tstar !== null;
// H2b: first touch = first checkpoint where dist <= 1.5x floor (PINNED, the qwen-A5 answer); no excursion above 1.5x floor afterward
let firstTouch = null;
for (const t of CHECKPOINTS) if (dist('A3', t) <= 1.5 * fl(t)) { firstTouch = t; break; }
let h2bViolations = [];
if (firstTouch !== null) for (const t of CHECKPOINTS.filter((u) => u > firstTouch)) if (dist('A3', t) > 1.5 * fl(t)) h2bViolations.push(t);
const H2b = firstTouch !== null && h2bViolations.length === 0;
// P2: A3S crosses no later than A3
let TstarS = null;
for (const t of CHECKPOINTS) {
  if (cross.A3S.moransI8[t].median <= fl(t) && CHECKPOINTS.filter((u) => u > t).every((u) => cross.A3S.moransI8[u].median <= fl(u))) { TstarS = t; break; }
}
// P3: controls at/below floor at every t >= 8
const controlViolations = [];
for (const arm of ['A3', 'A3S']) for (const m of ['dW1', 'tauTV', 'twinRate']) for (const t of CHECKPOINTS.filter((u) => u >= 8)) {
  if (cross[arm][m][t].median > floor[m][t]) controlViolations.push(`${arm}.${m}@${t}`);
}
// monotonicity check (reported AS-SAID)
let monoViolations = [];
for (let i = 2; i < CHECKPOINTS.length; i++) { // after t=16 (index of 16 is 5)
  const t = CHECKPOINTS[i];
  if (dist('A3', t) > dist('A3', CHECKPOINTS[i - 1]) + 1e-12) monoViolations.push(`${CHECKPOINTS[i - 1]}->${t}`);
}

const fmt = (x) => (x === null ? 'null' : String(Math.round(x * 1e6) / 1e6));
const verdict = `E-Q20b VERDICT (the burn-in ladder, zero credits — where is T*?): H1b ${H1b ? `LIVES — T* = ${Tstar}` : 'DIES — T* > 512 (the slow-mode law EXTENDS; the honest null branch fired, p~0.15 as registered)'} (A3 Moore-8 distance median vs A1 LOO 95th-pct floor, sticky crossing). H2b ${H2b ? 'LIVES' : `DIES (re-excitations above 1.5x floor after first touch @${firstTouch}: [${h2bViolations.join(', ')}])`}. Controls (the washed-out family) ${controlViolations.length === 0 ? 'at/below floor at every t >= 8 (P3 HIT)' : `EXCURSIONS: ${controlViolations.slice(0, 8).join('; ')}`}. A3S sticky crossing: ${TstarS === null ? 'not reached by t=512' : TstarS} (P2 ${TstarS !== null && Tstar !== null ? (TstarS <= Tstar ? 'HIT — the shuffled twin relaxes no slower' : 'MISS — the blur geometry relaxes faster than its shuffle') : 'unscorable'}). Monotonicity (AS-SAID): ${monoViolations.length === 0 ? 'nonincreasing at every checkpoint after t=16' : `violations [${monoViolations.join(', ')}]`}. F0' gate: byte-exact reproduction of E-Q20's sealed t<=64 values (hashes ${gate.hashOk}/${gate.hashChecks}, floor ${gate.floorOk}/${gate.floorChecks}, cross ${gate.crossOk}/${gate.crossChecks}). C11's sealed DIES verdict is NOT reopened; its T* annotation ${H1b ? `amends to T* = ${Tstar} (append-only)` : 'extends to T* > 512 (append-only)'}.`;

// ══ PHASE 4 — seal ══════════════════════════════════════════════════════════
writeFileSync(join(OUT, 'e_q20b_results.json'), JSON.stringify({
  experiment: 'E-Q20b', claim: 'C11 annotation extension — the relaxation time T* (the slow mode of the tick operator)', kernel: kernelReport(),
  preRegSha, attackSha,
  registration: 'experiments/pre_registration_e_q20b.json (the Groq seat-trial answers baked: F0\' gate, first-touch pinned, A3S inheritance stated, A2 exclusion declined-on-facts, floor trajectory recorded)',
  consult: { file: 'situations/groq_seats/seat_trial_r22.jsonl', sha256: attackSha, seats: ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b'], attacks: 12, usd: 0.002133, route: 'the Actions seat (Azure US egress) — the geo law receipted in BLOCKED-SEAT-RECEIPT.md' },
  task: { W, H, T, checkpoints: CHECKPOINTS, arms: { A1: N_A1, A3: N_A3, A3S: N_A3 }, a2: 'EXCLUDED (registered: H1 already sealed — byte provenance invisible; no discriminating power for T*)', seedBase: SEED_BASE, mothCredits: 0 },
  floors: { F0p, gate },
  floorTable: floor, crossArm: cross,
  a1LooSpread: looDist,
  hashes: Object.fromEntries(Object.keys(runs).map((a) => [a, runs[a].map((r) => r.hashes[512])])),
  hypotheses: { H1b, H2b, Tstar, TstarS, firstTouch, h2bViolations, controlViolations, monoViolations },
  verdict,
}, null, 1));

writeFileSync(join(OUT, 'e_q20b_verdict.md'), `# E-Q20b verdict — the burn-in ladder (where is T*?)\n\n${verdict.replace(/; /g, ';\n\n')}\n\n## The ladder (Moore-8 Moran's I distance, median, vs the A1 LOO floor)\n\n| t | A3 | A3S | floor |\n|---|---|---|---|\n${CHECKPOINTS.map((t) => `| ${t} | ${fmt(cross.A3.moransI8[t].median)} | ${fmt(cross.A3S.moransI8[t].median)} | ${fmt(floor.moransI8[t])} |`).join('\n')}\n\n## The controls (the washed-out family, AS-SAID)\n\n| t | dW1 A3 | dW1 floor | tauTV A3 | tauTV floor | twinRate A3 | twinRate floor |\n|---|---|---|---|---|---|---|\n${CHECKPOINTS.map((t) => `| ${t} | ${fmt(cross.A3.dW1[t].median)} | ${fmt(floor.dW1[t])} | ${fmt(cross.A3.tauTV[t].median)} | ${fmt(floor.tauTV[t])} | ${fmt(cross.A3.twinRate[t].median)} | ${fmt(floor.twinRate[t])} |`).join('\n')}\n\n## The F0' gate\n\n- hashes at t=64: ${gate.hashOk}/${gate.hashChecks} byte-identical to E-Q20's sealed values\n- floor table at every common checkpoint: ${gate.floorOk}/${gate.floorChecks}\n- cross-arm medians at every common checkpoint: ${gate.crossOk}/${gate.crossChecks}\n`);

const rows = [
  { kind: 'rules.EQ20b', frozen_by: 'experiments/pre_registration_e_q20b.json sha ' + preRegSha.slice(0, 16) + '… (the Groq seat-trial answers baked BEFORE the run: F0\' gate, first-touch pinned, A3S inheritance, A2 exclusion declined-on-facts, floor trajectory recorded)',
    proposal_cited: 'ORCH-R21 close-out registration: E-Q20b burn-in ladder (t=512 from journals, zero credits); ORCH-R22 registration lane T13-d',
    claim: 'C11 annotation extension — the relaxation time T* of the spatial-correlation slow mode (C11 itself stays DIES, sealed r21; only the T* annotation may amend, append-only)',
    floors: 'F0\' byte-exact reproduction of E-Q20 sealed t<=64 values (hashes + floor table + cross-arm medians); determinism by the same journal-replay law',
    bands: 'H1b T* <= 512 (first sticky sub-floor checkpoint); H2b monotone after t=16 with no re-excitation above 1.5x floor after first touch; honest null T* > 512' },
  { kind: 'run.config', experiment: 'E-Q20b', kernel: kernelReport(),
    design: `64x64 torus, T=512, checkpoints {0,1,2,4,8,16,32,64,128,192,256,320,384,448,512}; A1 mulberry32(20261018+k) n=20; A3 tau-from-comet-expanded + sealed blur grids n=5; A3S the ONE fixed permutation n=5; A2 EXCLUDED (registered); metrics Moore-8 Moran I distance (primary) + dW1/tauTV/twinRate (controls); floor = A1 LOO 95th pct nearest-rank at EACH checkpoint; population statistic = median`,
    moth: 'ZERO credits (journal replay only — the sealed blur grids + the AM5 comet-root expansion, both deterministic)',
    consult: 'Groq seat trial AS-SAID at situations/groq_seats/seat_trial_r22.jsonl sha ' + attackSha.slice(0, 16) + '… (12 attacks across both seats, $0.002133, via the Actions seat)' },
];
for (const arm of ['A3', 'A3S']) {
  rows.push({ kind: 'result.EQ20b', experiment: 'E-Q20b', arm, metric: 'moransI8',
    ...Object.fromEntries(CHECKPOINTS.map((t) => [`t${t}`, q(cross[arm].moransI8[t].median)])),
    ...Object.fromEntries(CHECKPOINTS.map((t) => [`floor_t${t}`, q(floor.moransI8[t])])),
    sticky_crossing: arm === 'A3' ? Tstar : TstarS });
}
rows.push({ kind: 'verdict.EQ20b', experiment: 'E-Q20b', H1b, H2b, Tstar, TstarS, firstTouch, F0p, gate: { hashOk: gate.hashOk, hashChecks: gate.hashChecks, floorOk: gate.floorOk, floorChecks: gate.floorChecks, crossOk: gate.crossOk, crossChecks: gate.crossChecks }, controlViolations: controlViolations.length, monoViolations: monoViolations.length, verdict });

const { stone, stonePath } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q20b', claim: 'relaxation-time-Tstar-annotation' });
writeFileSync(join(OUT, 'e_q20b_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q20b] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q20b] ${verdict}\n`);
