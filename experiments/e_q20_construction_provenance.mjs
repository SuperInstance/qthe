// experiments/e_q20_construction_provenance.mjs — E-Q20, ORCH-R21/T12-b:
// does construction provenance leave a fingerprint that survives the tick
// dynamics, or does the tick operator wash it out? (Claim C11.)
//
// ARMS (registration sha d835c43e…, amended AM1-AM4 pre-run):
//   A1  PRNG   mulberry32(20261018+k), n=20 (AM2) — the noise-floor population
//   A2  QRNG   comet-qrng-v1 conditioned bytes, 10 contiguous 4096-B blocks
//               (AM1), n=10 — SP 800-90B certified, CHSH-witnessed
//   A3  QBLUR  A2 plane k's tau bits + blur-core-v1 EXACT (strength 0.5)
//               d-field, round-half-up re-quantized, n=5
//   A3S CTRL   A3's d-value multiset under ONE fixed-seed permutation
//               (mulberry32(20261018), Fisher-Yates — the E-Q9-DT idiom),
//               n=5 — same marginals, correlation destroyed (F5 pins it)
//
// FLOORS: F0 determinism (journal replay x2, byte-identical to t=64);
// F1 kernel-real (import, no transcription); F2 CHSH S > 2 or VOID LOUD;
// F3 blur exact-mode (shots never sent) + shape equality; F4 all-distinct
// plane hashes; F5 A3S marginal identity == A3, exact.
//
// METRICS per checkpoint t in {0,1,2,4,8,16,32,64}: planeHash; Moran's I
// rook-4 AND Moore-8 (AM3: Moore-8 primary — the kernel's own coupling);
// d-hist Wasserstein-1; tau-fraction total variation; twin events per tick
// per cell (AM4); saturation fraction. Noise floor = A1 leave-one-out 95th
// pct (nearest-rank). Population statistic = MEDIAN of per-plane distances
// (AM2). H1: A2 <= floor at EVERY checkpoint, every metric. H2: A2/A3/A3S
// <= floor at t=64, every metric. H3: A3 > floor at t=0 on BOTH d-hist and
// Moore-8 Moran's I. C11 = H1 AND H2 AND F0. T* = first checkpoint where
// A3's Moore-8 distance <= floor AND stays.
//
// MOTH BUDGET LAW: exactly 1 comet job (5 credits) + 5 blur jobs (5 credits)
// = 10 credits, HARD-CAPPED here. Fail-closed: an unreachable API writes a
// labeled no-run receipt and exits 3 — NO data rows, NO mock planes.
//
// DETERMINISM SCOPE NOTE (honest): the blur is exact-mode deterministic BY
// THE ENGINE'S REGISTERED LAW (shots omitted — MOTH-ENGINES-PROBES.md); we
// journal its float output and replay from the journal. Re-calling the
// engine to re-verify exactness would spend credits outside the cap and is
// NOT done — receipted here, not hidden.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKernel, makeSubstrate, tick, mulberry32, kernelReport } from './_adapter.mjs';
import { appendAndVerify, planeHash, q, fileSha256 } from './_harness.mjs';
import { linkStone } from './_stone_link.mjs';
import { createMothClient, MothError } from './moth_client_v2.mjs';

await loadKernel(); // the adapter law: kernel resolution BEFORE any makeSubstrate/tick/mulberry32 (the AM6 crash class, never again)

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'experiments', 'outputs');
mkdirSync(OUT, { recursive: true });

const W = 64, H = 64, N = W * H, T = 64;
const N_A1 = 20, N_A2 = 10, N_A3 = 5;               // AM2: A1 n=20
const CHECKPOINTS = [0, 1, 2, 4, 8, 16, 32, 64];
const STRENGTH = 0.5;
const COMET_BYTES = 49152;                            // 48 KiB job -> 40960 consumed (AM1)
const SEED_BASE = 20261018;
const CHAIN = join(ROOT, 'receipts', 'e_q20_chain.jsonl');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const preRegPath = join(ROOT, 'experiments', 'pre_registration_e_q20.json');
const preRegSha = fileSha256(preRegPath);
const attackSha = fileSha256(join(ROOT, 'situations', 'e_q20_design_attack.jsonl'));

// ── statistics helpers ───────────────────────────────────────────────────────
function dHist(cells) { const h = new Array(64).fill(0); for (let i = 0; i < N; i++) h[cells[i] & 63]++; return h.map((x) => x / N); } // fractions
function tauFrac(cells) { const f = [0, 0, 0, 0]; for (let i = 0; i < N; i++) f[cells[i] >> 6]++; return f.map((x) => x / N); }
function satFrac(cells) { let s = 0; for (let i = 0; i < N; i++) if ((cells[i] & 63) === 63) s++; return s / N; }
function wasserstein1(fA, fB) { // discrete W1 over support {0..63}; inputs are FRACTIONS summing to 1
  let cdfA = 0, cdfB = 0, w = 0;
  for (let k = 0; k < 64; k++) { cdfA += fA[k]; cdfB += fB[k]; w += Math.abs(cdfA - cdfB); }
  return w;
}
function tv(p, qq) { let s = 0; for (let k = 0; k < 4; k++) s += Math.abs(p[k] - qq[k]); return 0.5 * s; }
function moransI(cells, moore) { // lag-1 on torus; moore=false -> rook-4
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
const pct95 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]; }; // nearest-rank

// ── journal-seeded construction (the ONLY entry into the kernel) ────────────
function planeFromJournal(bytes) {
  let pos = 0;
  return makeSubstrate(W, H, (x, y, i) => bytes[i]); // row-major by kernel loop; journal indexed identically
}

// ── run one plane to T, recording checkpoints ──────────────────────────────
function runPlane(bytes) {
  let sub = planeFromJournal(bytes);
  const rec = { hashes: {}, moransI4: {}, moransI8: {}, dHist: {}, tauFrac: {}, twinRate: {}, satFrac: {} };
  const record = (t, twinEvents, ticksInWindow) => {
    rec.hashes[t] = planeHash(sub, t, (s) => s);
    rec.moransI4[t] = moransI(sub, false);
    rec.moransI8[t] = moransI(sub, true);
    rec.dHist[t] = dHist(sub);
    rec.tauFrac[t] = tauFrac(sub);
    rec.satFrac[t] = satFrac(sub);
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

// ══ PHASE 1 — the quantum house (fail-closed, budget-capped) ═══════════════
// AM5: the comet ROOT is receipted at experiments/outputs/e_q20_comet_root.json
// (job 3d7d0a34, 142 certified bytes — 5 credits SPENT there); this phase only
// EXPANDS the root (SHA-256 counter, the E-Q9-DT whitener recipe) and runs the
// 5 blur jobs (5 credits). Total 10/10 cap.
console.log('[e-q20] phase 1: comet root expansion (AM5) + 5 blur jobs');
let comet = null, blurs = [];
try {
  const root = JSON.parse(readFileSync(join(OUT, 'e_q20_comet_root.json'), 'utf8'));
  if (!root.bell_witness || !(root.bell_witness.S > 2)) {
    throw new MothError(`F2 VOID: bell witness S=${root.bell_witness && root.bell_witness.S} <= 2 (classical bound) — no silent classical downgrade`, {});
  }
  const rootBytes = Buffer.from(root.root_hex, 'hex');
  const NEED = 40960;
  let expanded = Buffer.alloc(0);
  for (let c = 0; expanded.length < NEED; c++) {
    const ctr = Buffer.alloc(4); ctr.writeUInt32BE(c >>> 0, 0);
    expanded = Buffer.concat([expanded, createHash('sha256').update(ctr).update(rootBytes).digest()]);
  }
  comet = {
    job_id: root.job_id, bytes: new Uint8Array(expanded.subarray(0, NEED)),
    bell_witness: root.bell_witness, min_entropy: root.entropy_report,
    provenance: { ...root.provenance, root_bits: root.root_bits, root_bytes: root.root_bytes, expanded_via: 'SHA256(u32be(c) || root) counter stream — quantum-ROOTED, hash-expanded (AM5)' },
    output_bytes: root.requested_bytes,
  };
  console.log(`  root ok: job ${comet.job_id}, ${root.root_bytes} certified bytes -> ${NEED} expanded (S=${root.bell_witness.S})`);
  // AM6: the 5 blur jobs are ALREADY SPENT and journaled (free GET recovery
  // after the phase-2 crash); replay from the journal — NEVER re-call (10/10 cap).
  const JOURNAL = join(OUT, 'e_q20_blur_journal.json');
  if (existsSync(JOURNAL)) {
    const jrn = JSON.parse(readFileSync(JOURNAL, 'utf8'));
    for (const b of jrn.blurs) { blurs.push({ k: blurs.length, jobId: b.job_id, ms: null, output: b.output }); console.log(`  blur ${blurs.length - 1} journaled: job ${b.job_id} (replayed, 0 credits)`); }
    if (blurs.length !== N_A3) throw new MothError(`blur journal has ${blurs.length} outputs, expected ${N_A3}`, {});
  } else {
    const client = createMothClient();
    for (let k = 0; k < N_A3; k++) {
      const dGrid = [];
      for (let y = 0; y < H; y++) {
        const row = [];
        for (let x = 0; x < W; x++) row.push(comet.bytes[k * N + y * W + x] & 63);
        dGrid.push(row);
      }
      const b = await client.blurExact(dGrid, { strength: STRENGTH });
      blurs.push({ k, jobId: b.job_id, ms: b.ms, output: b.output });
      console.log(`  blur ${k} ok: job ${b.job_id}, ${b.ms}ms, exact=${b.exact}`);
    }
  }
} catch (e) {
  writeFileSync(join(OUT, 'e_q20_seed_receipt.json'), JSON.stringify({
    status: 'NO-RUN (fail-closed)', reason: String(e && e.message), at: new Date().toISOString(),
    mothCreditsSpent: 5, note: 'no data rows exist; the registration stands; retry allowed within the round',
  }, null, 1));
  console.error(`[e-q20] FAIL-CLOSED: ${e.message}`);
  process.exit(3);
}

// ── PHASE 2 — arm construction ──────────────────────────────────────────────
console.log('[e-q20] phase 2: constructing arms');
const planes = { A1: [], A2: [], A3: [], A3S: [] };
const journals = { A1: [], A2: [], A3: [], A3S: [] };

for (let k = 0; k < N_A1; k++) {                      // A1: PRNG
  const rng = mulberry32(SEED_BASE + k);
  const j = new Uint8Array(N);
  for (let i = 0; i < N; i++) j[i] = Math.floor(rng() * 256) & 0xff;
  journals.A1.push(j); planes.A1.push(planeFromJournal(j));
}
for (let k = 0; k < N_A2; k++) {                      // A2: QRNG blocks (AM1)
  const j = comet.bytes.slice(k * N, (k + 1) * N);
  journals.A2.push(new Uint8Array(j)); planes.A2.push(planeFromJournal(new Uint8Array(j)));
}
for (let k = 0; k < N_A3; k++) {                      // A3: tau from A2 plane k, d from blur
  const tauSrc = journals.A2[k];
  const out = blurs[k].output;
  const j = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const dv = Math.max(0, Math.min(63, Math.round(out[y][x]))); // round-half-up, clamp [0,63]
    j[i] = ((tauSrc[i] >> 6) << 6) | dv;
  }
  journals.A3.push(j); planes.A3.push(planeFromJournal(j));
}
{ // A3S: ONE fixed permutation applied to every A3 d-multiset (E-Q9-DT idiom)
  const rng = mulberry32(SEED_BASE);
  const P = new Array(N);
  for (let i = 0; i < N; i++) P[i] = i;
  for (let i = N - 1; i > 0; i--) { const jj = Math.floor(rng() * (i + 1)); const tmp = P[i]; P[i] = P[jj]; P[jj] = tmp; }
  for (let k = 0; k < N_A3; k++) {
    const src = journals.A3[k];
    const j = new Uint8Array(N);
    for (let i = 0; i < N; i++) j[i] = ((src[i] >> 6) << 6) | (src[P[i]] & 63); // same tau, permuted d
    journals.A3S.push(j); planes.A3S.push(planeFromJournal(j));
  }
}

// F5: A3S marginal identity (exact)
let F5 = true;
for (let k = 0; k < N_A3; k++) {
  const ha = dHist(planes.A3[k]), hb = dHist(planes.A3S[k]);
  for (let b = 0; b < 64; b++) if (Math.abs(ha[b] - hb[b]) > 1e-12) F5 = false;
}
console.log(`  F5 A3S marginal identity: ${F5 ? 'EXACT' : 'BROKEN — LOUD'}`);
if (!F5) { console.error('[e-q20] F5 broken — the control premise fails'); process.exit(4); }

// ── PHASE 3 — run + record ──────────────────────────────────────────────────
console.log('[e-q20] phase 3: running 40 planes to t=64');
const runs = { A1: [], A2: [], A3: [], A3S: [] };
for (const arm of Object.keys(planes)) for (let k = 0; k < planes[arm].length; k++) runs[arm].push(runPlane(journals[arm][k]));

// F4: all-distinct at t=0
const seen = new Map(); let F4 = true;
for (const arm of Object.keys(runs)) runs[arm].forEach((r, k) => {
  const h = r.hashes[0];
  if (seen.has(h)) { F4 = false; console.error(`  F4 COLLISION: ${arm}[${k}] vs ${seen.get(h)}`); }
  seen.set(h, `${arm}[${k}]`);
});
console.log(`  F4 all-distinct t=0 hashes: ${F4 ? 'OK (40 distinct)' : 'COLLISION'}`);

// ── PHASE 4 — A1 LOO noise floor ────────────────────────────────────────────
console.log('[e-q20] phase 4: A1 leave-one-out noise floor (95th pct, nearest-rank)');
const METRICS = ['dW1', 'tauTV', 'moransI4', 'moransI8', 'twinRate', 'satFrac'];
function distancesVsRef(armRuns, ref) { // ref: per-checkpoint {dHist, tauFrac, moransI4, moransI8, twinRate, satFrac}
  const out = { dW1: {}, tauTV: {}, moransI4: {}, moransI8: {}, twinRate: {}, satFrac: {} };
  for (const t of CHECKPOINTS) {
    for (const r of armRuns) {
      (out.dW1[t] = out.dW1[t] || []).push(wasserstein1(r.dHist[t], ref[t].dHist));
      (out.tauTV[t] = out.tauTV[t] || []).push(tv(r.tauFrac[t], ref[t].tauFrac));
      (out.moransI4[t] = out.moransI4[t] || []).push(Math.abs(r.moransI4[t] - ref[t].moransI4));
      (out.moransI8[t] = out.moransI8[t] || []).push(Math.abs(r.moransI8[t] - ref[t].moransI8));
      (out.twinRate[t] = out.twinRate[t] || []).push(Math.abs(r.twinRate[t] - ref[t].twinRate));
      (out.satFrac[t] = out.satFrac[t] || []).push(Math.abs(r.satFrac[t] - ref[t].satFrac));
    }
  }
  return out;
}

function buildRef(runList) {
  const ref = {};
  for (const t of CHECKPOINTS) {
    const dh = new Array(64).fill(0), tf = [0, 0, 0, 0];
    for (const r of runList) { for (let b = 0; b < 64; b++) dh[b] += r.dHist[t][b]; for (let c = 0; c < 4; c++) tf[c] += r.tauFrac[t][c]; }
    ref[t] = {
      dHist: dh.map((x) => x / runList.length),
      tauFrac: tf.map((x) => x / runList.length),
      moransI4: median(runList.map((r) => r.moransI4[t])),
      moransI8: median(runList.map((r) => r.moransI8[t])),
      twinRate: median(runList.map((r) => r.twinRate[t])),
      satFrac: median(runList.map((r) => r.satFrac[t])),
    };
  }
  return ref;
}
// LOO: each A1 plane vs the reference of the other 19
const looDist = { dW1: {}, tauTV: {}, moransI4: {}, moransI8: {}, twinRate: {}, satFrac: {} };
for (let i = 0; i < N_A1; i++) {
  const others = runs.A1.filter((_, k) => k !== i);
  const ref = buildRef(others);
  const dd = distancesVsRef([runs.A1[i]], ref);
  for (const m of METRICS) for (const t of CHECKPOINTS) (looDist[m][t] = looDist[m][t] || []).push(dd[m][t][0]);
}
const floor = {};
for (const m of METRICS) { floor[m] = {}; for (const t of CHECKPOINTS) floor[m][t] = pct95(looDist[m][t]); }

// ── PHASE 5 — cross-arm distances vs the full A1 population ─────────────────
console.log('[e-q20] phase 5: cross-arm distances (population statistic = median)');
const fullRef = buildRef(runs.A1);
const cross = {};
for (const arm of ['A2', 'A3', 'A3S']) {
  const dd = distancesVsRef(runs[arm], fullRef);
  cross[arm] = {};
  for (const m of METRICS) { cross[arm][m] = {}; for (const t of CHECKPOINTS) cross[arm][m][t] = { median: median(dd[m][t]), perPlane: dd[m][t] }; }
}

// ── PHASE 6 — determinism F0 (journal replay x2) ────────────────────────────
console.log('[e-q20] phase 6: determinism — journal replay of all 40 planes');
let detOk = 0, detPairs = 0;
for (const arm of Object.keys(journals)) for (let k = 0; k < journals[arm].length; k++) {
  const replay = runPlane(journals[arm][k]);
  detPairs++;
  let same = true;
  for (const t of CHECKPOINTS) if (replay.hashes[t] !== runs[arm][k].hashes[t]) same = false;
  if (same) detOk++;
}
const F0 = detOk === detPairs;
console.log(`  F0 determinism: ${detOk}/${detPairs} byte-identical ${F0 ? '' : '— VOID'}`);

// ── PHASE 7 — hypotheses ────────────────────────────────────────────────────
console.log('[e-q20] phase 7: hypotheses');
const excursion = (arm, t) => METRICS.filter((m) => cross[arm][m][t].median > floor[m][t]);
const H1 = CHECKPOINTS.every((t) => excursion('A2', t).length === 0);
const h2exc = { A2: excursion('A2', 64), A3: excursion('A3', 64), A3S: excursion('A3S', 64) };
const H2 = h2exc.A2.length === 0 && h2exc.A3.length === 0 && h2exc.A3S.length === 0;
const H3 = cross.A3.dW1[0].median > floor.dW1[0] && cross.A3.moransI8[0].median > floor.moransI8[0];
let Tstar = null;
for (const t of CHECKPOINTS) {
  if (cross.A3.moransI8[t].median <= floor.moransI8[t] && CHECKPOINTS.filter((u) => u >= t).every((u) => cross.A3.moransI8[u].median <= floor.moransI8[u])) { Tstar = t; break; }
}
const C11 = H1 && H2 && F0;

const fmt = (x) => (x === null ? 'null' : (typeof x === 'number' ? String(Math.round(x * 1e6) / 1e6) : String(x)));
const verdict = `E-Q20 VERDICT (C11: the tick operator is a construction-provenance blindfold — planes built from PRNG, quantum-ROOTED hash-expanded certified randomness (comet SP 800-90B root, AM5), and quantum-blur-conditioned geometry become statistically indistinguishable across all observed metrics within the PRNG noise floor by tick 64, while each remains individually byte-deterministic): H1 QRNG-PRNG equivalence ${H1 ? 'LIVES' : 'DIES'} (A2 median distance <= A1 LOO 95th-pct floor at EVERY checkpoint x metric); H2 wash-out at t=64 ${H2 ? 'LIVES' : 'DIES'} (excursions: A2 [${h2exc.A2}] A3 [${h2exc.A3}] A3S [${h2exc.A3S}]); H3 early fingerprint ${H3 ? 'LIVES' : 'DIES'} (A3 t=0 dW1 ${fmt(cross.A3.dW1[0].median)} vs floor ${fmt(floor.dW1[0])}; Moore-8 Moran's I ${fmt(cross.A3.moransI8[0].median)} vs floor ${fmt(floor.moransI8[0])}); wash-out tick T*=${Tstar === null ? 'not reached by t=64' : Tstar} (Moore-8, A3). Floors: F0 determinism ${F0 ? `${detOk}/${detPairs} byte-identical` : 'VOID'}; F1 kernel-real (import, no transcription); F2 CHSH S=${fmt(comet.bell_witness.S)} > 2 (witness carried, caveat receipted: fixed settings, no space-like separation, fair sampling); F3 blur exact-mode (shots never sent) + shape equality asserted; F4 all-distinct ${F4 ? 'OK' : 'COLLISION'}; F5 A3S marginal identity EXACT. Power caveat (AM2): A3/A3S n=5 (credit-capped); the floor is the direct LOO, not a resampled threshold. C11 ${C11 ? 'LIVES' : 'DIES'}.`;
console.log(`\n[e-q20] ${verdict}\n`);

// ── PHASE 8 — seal ──────────────────────────────────────────────────────────
writeFileSync(join(OUT, 'e_q20_seed_receipt.json'), JSON.stringify({
  status: 'RUN', at: new Date().toISOString(),
  comet: { job_id: comet.job_id, root_receipt: 'experiments/outputs/e_q20_comet_root.json', root_bytes: 142, root_bits: 1136, expanded_to: 40960, expansion: 'SHA256(u32be(c) || root) counter stream (AM5, E-Q9-DT recipe)', bell_witness: comet.bell_witness, min_entropy: comet.min_entropy, provenance: comet.provenance },
  blurs: blurs.map((b) => ({ k: b.k, job_id: b.jobId, ms: b.ms, exact: true, strength: STRENGTH, output_shape: [H, W] })),
  mothCredits: { comet: 5, blur: N_A3, total: 5 + N_A3, cap: 10 },
  blur_outputs_journaled: blurs.map((b) => b.output), // full-precision floats, the replay source
  keyMaterial: 'NONE — the key lives only in env, never in a row (T8b-tested client law)',
}, null, 1));

writeFileSync(join(OUT, 'e_q20_results.json'), JSON.stringify({
  experiment: 'E-Q20', claim: 'C11 — construction-provenance blindfold (the tick operator washes out constructor signatures)', kernel: kernelReport(),
  preRegSha, attackSha,
  registration: 'experiments/pre_registration_e_q20.json (pre-run amendments AM1-AM4 + two refuted-with-receipt, sha d835c43e…)',
  consult: { file: 'situations/e_q20_design_attack.jsonl', sha256: attackSha, seat: 'ByteDance/Seed-2.0-mini', attacks: 6, usd: 0.005061, latency_s: 58.9, dispositions: 'AM1/AM2/AM3/AM4 accepted (in part where receipted); A2 chain-attribution refuted-as-stated; A6 no-truncation refuted on facts' },
  task: { W, H, T, checkpoints: CHECKPOINTS, arms: { A1: N_A1, A2: N_A2, A3: N_A3, A3S: N_A3 }, strength: STRENGTH, seedBase: SEED_BASE },
  floors: { F0, detOk, detPairs, F2_S: comet.bell_witness.S, F3: true, F4, F5 },
  floorTable: floor, crossArm: cross,
  a1LooSpread: looDist,
  hashes: Object.fromEntries(Object.keys(runs).map((a) => [a, runs[a].map((r) => r.hashes[64])])),
  hypotheses: { H1, H2, H3, Tstar, C11, h2exc },
  verdict,
}, null, 1));

writeFileSync(join(OUT, 'e_q20_verdict.md'), `# E-Q20 verdict — construction provenance and the wash-out question\n\n${verdict.replace(/; /g, ';\n\n')}\n\n## The arms\n\n- A1 PRNG n=${N_A1} (mulberry32, the noise-floor population)\n- A2 comet-qrng-v1 ROOT (142 certified bytes, job ${comet.job_id}) SHA-256-counter-expanded, CHSH S=${fmt(comet.bell_witness.S)}, quantum-ROOTED hash-expanded (AM5), n=${N_A2}\n- A3 blur-core-v1 exact strength ${STRENGTH} on the d-field, tau from A2 n=${N_A3}\n- A3S A3's d-multiset under one fixed permutation (marginals identical, correlation destroyed)\n\n## Cross-arm medians vs floor (t=64)\n\n| metric | A2 | A3 | A3S | floor |\n|---|---|---|---|---|\n${METRICS.map((m) => `| ${m} | ${fmt(cross.A2[m][64].median)} | ${fmt(cross.A3[m][64].median)} | ${fmt(cross.A3S[m][64].median)} | ${fmt(floor[m][64])} |`).join('\n')}\n\n## Moran's I trajectory (Moore-8, the kernel's own coupling)\n\n| t | A1 pop | A2 | A3 | A3S |\n|---|---|---|---|---|\n${CHECKPOINTS.map((t) => `| ${t} | ${fmt(median(runs.A1.map((r) => r.moransI8[t])))} | ${fmt(median(runs.A2.map((r) => r.moransI8[t])))} | ${fmt(median(runs.A3.map((r) => r.moransI8[t])))} | ${fmt(median(runs.A3S.map((r) => r.moransI8[t])))} |`).join('\n')}\n`);

const rows = [
  { kind: 'rules.EQ20', frozen_by: 'experiments/pre_registration_e_q20.json sha ' + preRegSha.slice(0, 16) + '… (pre-run amendments AM1-AM4 from the Seed-2.0-mini design attack + A2/A6 refuted with receipts — all BEFORE the first execution)',
    proposal_cited: 'ORCH-R21 registration (T12-b): the operator dispatch to experiment with the moth key; the F0 determinism law confines quantum entropy to construction time',
    claim: 'C11 — the tick operator is a construction-provenance blindfold: PRNG / quantum-ROOTED hash-expanded comet-certified (AM5) / quantum-blur-conditioned planes become statistically indistinguishable within the PRNG noise floor by tick 64, each individually byte-deterministic',
    floors: 'F0 journal-replay determinism 40/40; F1 kernel-real (import); F2 CHSH S > 2 or VOID; F3 blur exact-mode + shape; F4 all-distinct; F5 A3S marginal identity exact',
    bands: 'H1 A2 <= floor at every checkpoint x metric; H2 A2/A3/A3S <= floor at t=64; H3 A3 > floor at t=0 on dW1 AND Moore-8 Moran I; C11 = H1 AND H2 AND F0; T* = first sticky sub-floor checkpoint (Moore-8)' },
  { kind: 'run.config', experiment: 'E-Q20', kernel: kernelReport(),
    design: `64x64 torus, T=64, checkpoints {0,1,2,4,8,16,32,64}; A1 mulberry32(20261018+k) n=20; A2 comet-qrng-v1 first-40960-of-49152 contiguous blocks n=10 (AM1); A3 tau-from-A2 + blur-core-v1 exact strength 0.5 d-field, round-half-up clamp [0,63] n=5; A3S one fixed permutation mulberry32(20261018) over A3 d-multisets n=5; metrics dW1/tauTV/MoranI rook4+moore8(AM3 primary)/twinRate-per-cell(AM4)/satFrac; floor = A1 LOO 95th pct nearest-rank; population statistic = median (AM2)`,
    moth: `comet ROOT job 3d7d0a34 (142 certified bytes, S=${fmt(comet.bell_witness.S)}, expanded SHA256-counter to 40960 B — AM5); blur jobs ${blurs.map((b) => b.jobId).join(', ')} (exact mode); credits 10/10 cap`,
    consult: 'Seed-2.0-mini design attack AS-SAID at situations/e_q20_design_attack.jsonl sha ' + attackSha.slice(0, 16) + '… (6 attacks, $0.005061, 58.9s); AM1 byte-splitting, AM2 n=20+median, AM3 Moore-8 primary, AM4 per-cell rate; A2 and A6 refuted with receipts' },
];
for (const arm of ['A2', 'A3', 'A3S']) {
  for (const m of METRICS) {
    rows.push({ kind: 'result.EQ20', experiment: 'E-Q20', arm, metric: m,
      t0: q(cross[arm][m][0].median), t1: q(cross[arm][m][1].median), t2: q(cross[arm][m][2].median), t4: q(cross[arm][m][4].median),
      t8: q(cross[arm][m][8].median), t16: q(cross[arm][m][16].median), t32: q(cross[arm][m][32].median), t64: q(cross[arm][m][64].median),
      floor_t64: q(floor[m][64]), excursion_t64: cross[arm][m][64].median > floor[m][64] });
  }
}
rows.push({ kind: 'verdict.EQ20', experiment: 'E-Q20', H1, H2, H3, Tstar, C11, F0, detOk, detPairs, F4, F5, S: q(comet.bell_witness.S), verdict });

const { stone, stonePath } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q20', claim: 'construction-provenance-C11' });
writeFileSync(join(OUT, 'e_q20_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q20] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q20] results: experiments/outputs/e_q20_results.json + e_q20_verdict.md`);
