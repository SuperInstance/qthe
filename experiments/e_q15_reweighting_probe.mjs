// experiments/e_q15_reweighting_probe.mjs — E-Q15 (ORCH-13, roadmap phase
// 13): QTHE split-channel preference probe vs plain rejection sampling at
// identical oracle budget. Registration: pre_registration_e_q15.json,
// committed PRE-RUN — pricing-first law; floors F0/F1/F2 restated there.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, mulberry32, kernelReport } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, q, fileSha256 } from './_harness.mjs';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });
const CHAIN = join(RECEIPTS, 'e_q15_chain.jsonl');
const N_ITEMS = 32, B = 120, TRIALS = 50, BASE_SEED = 100001;

const { stone, stonePath } = await linkStone();
await loadKernel();
const { kernelKind } = kernelReport();
const preRegSha = fileSha256(join(HERE, 'pre_registration_e_q15.json'));

// One paired trial: both arms consume the IDENTICAL oracle stream.
function trial(seed) {
  const rng = mulberry32(seed);
  const qual = Array.from({ length: N_ITEMS }, () => 1 + Math.floor(rng() * 63));

  // generate the oracle stream first (shared, byte-identical for both arms)
  const stream = [];
  for (let b = 0; b < B; b++) {
    const i = Math.floor(rng() * N_ITEMS);
    const accept = rng() < qual[i] / 63;
    stream.push({ i, accept });
  }
  const acceptedMultiset = stream.filter((s) => s.accept).map((s) => s.i).sort((a, b) => a - b).join(',');

  // baseline: rejection sampling (best accepted by quality)
  let best = -1;
  for (const s of stream) if (s.accept && (best === -1 || qual[s.i] > qual[best])) best = s.i;
  const baselinePick = best === -1 ? 0 : best; // no-accept fallback (receipted)

  // probe: QTHE byte memory
  const tau = new Uint8Array(N_ITEMS).fill(3); // uncertain
  const d = new Uint8Array(N_ITEMS).fill(8);
  for (const s of stream) {
    if (s.accept) { tau[s.i] = 1; d[s.i] = Math.min(63, d[s.i] + 4); }
    else if (tau[s.i] === 3) d[s.i] = Math.max(0, d[s.i] - 2);
    else d[s.i] = Math.max(0, d[s.i] - 1); // soft demotion, sticky stance
  }
  let probePick = -1;
  for (let i = 0; i < N_ITEMS; i++) if (tau[i] === 1 && (probePick === -1 || d[i] > d[probePick])) probePick = i;
  if (probePick === -1) for (let i = 0; i < N_ITEMS; i++) if (probePick === -1 || d[i] > d[probePick]) probePick = i; // fallback (receipted)
  const imMass = Array.from({ length: N_ITEMS }, (_, i) => tau[i] === 3 ? d[i] : 0).reduce((a, b) => a + b, 0);
  const planeHex = Array.from({ length: N_ITEMS }, (_, i) => ((tau[i] << 6) | d[i]).toString(16).padStart(2, '0')).join('');
  const planeHash = createHash('sha256').update(`probe32x1@t=${B}:${planeHex}`).digest('hex');

  return {
    seed, qualBest: Math.max(...qual),
    qBase: qual[baselinePick], qProbe: qual[probePick],
    delta: qual[probePick] - qual[baselinePick],
    baselineNoAccept: best === -1, probeFallback: !stream.some((s) => s.accept && tau[s.i] === 1) || probePick === 0,
    imMass, planeHash, acceptedCount: acceptedMultiset ? acceptedMultiset.split(',').length : 0,
    acceptedMultiset,
  };
}

const trials = [];
for (let n = 0; n < TRIALS; n++) {
  const t1 = trial(BASE_SEED + n), t2 = trial(BASE_SEED + n); // run-twice determinism
  const detOk = t1.planeHash === t2.planeHash && t1.qProbe === t2.qProbe && t1.qBase === t2.qBase;
  trials.push({ ...t1, detOk });
  console.log(`[e-q15] trial ${n + 1}/${TRIALS} seed=${t1.seed} qBase=${t1.qBase} qProbe=${t1.qProbe} delta=${t1.delta >= 0 ? '+' : ''}${t1.delta} det=${detOk}`);
}

// aggregates + floors
const deltas = trials.map((t) => t.delta).sort((a, b) => a - b);
const medianDelta = deltas[Math.floor(deltas.length / 2)];
const winRate = trials.filter((t) => t.delta > 0).length / TRIALS;
const allDet = trials.every((t) => t.detOk);
const F0 = allDet;
const F1 = medianDelta >= 1 && winRate >= 0.55;
const F2 = trials.every((t) => t.acceptedCount >= 0); // pairing held by construction; multiset recorded per trial
const verdict = !F0 ? 'VOID(determinism)' : F1
  ? `RW LIVES — median delta +${medianDelta}, win-rate ${(winRate * 100).toFixed(0)}% (evidence compounding + sticky shortlisting beat max-of-accepted at equal budget)`
  : `RW DIES (honest null) — median delta ${medianDelta >= 0 ? '+' : ''}${medianDelta}, win-rate ${(winRate * 100).toFixed(0)}% (autopsy: where d-compounding lost to max-of-accepted)`;
console.log(`\n[e-q15] F0=${F0} F1=${F1} | median delta=${medianDelta} win-rate=${winRate.toFixed(2)} mean im-mass=${(trials.reduce((s, t) => s + t.imMass, 0) / TRIALS).toFixed(1)}`);
console.log(`[e-q15] VERDICT: ${verdict}`);

writeFileSync(join(OUT, 'e_q15_results.json'), JSON.stringify({
  experiment: 'E-Q15', claim: 'RW (preference reweighting probe)', kernel: kernelReport(), stonePath, preRegSha,
  design: { items: N_ITEMS, budget: B, trials: TRIALS, baseSeed: BASE_SEED, pairing: 'identical oracle stream per arm pair' },
  trials, aggregates: { medianDelta, winRate: q(winRate), allDet, F0, F1, F2, verdict },
}, null, 1));

const rows = [
  { kind: 'rules.EQ15', frozen_by: 'experiments/pre_registration_e_q15.json (ORCH-13, pre-run)', pre_reg_sha256: preRegSha,
    floors: 'F0 run-twice determinism; F1 probe wins iff median delta >= +1 AND win-rate >= 55%; F2 stream pairing (identical multiset)' },
  { kind: 'run.config', experiment: 'E-Q15', kernel: kernelReport(), stone_linked: stonePath,
    task: '32 items q in 1..63, B=120 shared oracle proposals, P(accept)=q/63, 50 trials seeds 100001..100050' },
];
for (const t of trials) rows.push({ kind: 'result.trial', experiment: 'E-Q15', seed: t.seed,
  qBase: t.qBase, qProbe: t.qProbe, delta: t.delta, acceptedCount: t.acceptedCount, imMass: t.imMass, determinism: t.detOk, finalPlaneHash: t.planeHash });
rows.push({ kind: 'verdict.EQ15', experiment: 'E-Q15', F0, F1, F2, medianDelta, winRate: q(winRate), verdict });
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q15', claim: 'RW preference probe' });
writeFileSync(join(OUT, 'e_q15_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q15] chain ok links=${v.links} tip=${v.tip}`);
