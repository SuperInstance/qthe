// experiments/e_q38_seal.mjs — E-Q38 seal (ORCH-R28/T19-d): the drift
// monitor's fourth reading. C36 LIVES — the band holds across a session
// boundary; no version flip (yet — the Oct-21 warning stands).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendAndVerify, q, fileSha256 } from './_harness.mjs';
import { linkStone } from './_stone_link.mjs';
import { loadKernel, kernelReport } from './_adapter.mjs';

await loadKernel();
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'experiments', 'outputs');
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r28', 'eq38_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q38.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q38_chain.jsonl');

// pre-registered bands: H1 all 20 within 0.10 vs r26; H2 model_served unchanged
const H1 = A.drift_vs_r26.within_010 === 20;
const H2 = A.models_served.length === 1 && A.models_served[0] === 'jev-1.13.0';
const C36 = H1 && H2;

const verdict = `E-Q38 VERDICT (the standing drift monitor's FOURTH reading — r24 sealed / r25 / r26 / r28, the first across a session boundary; 20 records, the byte-identical E-Q25 12-question map): C36 ${C36 ? 'LIVES' : 'DIES'} — H1 ${H1 ? 'LIVES' : 'DIES'}: THE BAND HOLDS A FOURTH TIME — 20/20 records within 0.10 on all 8 axes versus ALL THREE sealed baselines (max vs r26 ${q(A.drift_vs_r26.max)}, vs r25 ${q(A.drift_vs_r25.max)}, vs r24 ${q(A.drift_vs_r24.max)}); mean-axis ${q(A.drift_vs_r26.mean_axis)} versus the r26 reading's 0.0093 — the trend is FLAT across the session boundary (the fixed point holds; P2 HIT). H2 ${H2 ? 'LIVES' : 'DIES'}: model_served jev-1.13.0 unchanged — no version flip at this reading (P1 HIT, max 0.09 <= 0.08 near-miss); THE OCT-21 FLIP WARNING STANDS: typesafe's blog announced jev-latest flips to 1.14.0 within a week of Oct 14 — the next reading is load-bearing and every call this round receipted model_served (all 137+ embeds: jev-1.13.0). The decoy floor 0.0135 (P3 HIT — identical to the r25 mean). Per-axis: P8_exact remains the highest-drift axis (0.0165) — convergent with E-Q37's finding that P8 is the most phrasing-susceptible axis: the exactness axis is the noisiest seat in the house.`;

writeFileSync(join(OUT, 'e_q38_results.json'), JSON.stringify({
  experiment: 'E-Q38', claim: 'C36 — the drift band holds at the fourth reading, across a session boundary', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q38.json (no amendments)',
  task: { calls: 20, records: 20, questions_per_call: 12 },
  drift_vs_r24: A.drift_vs_r24, drift_vs_r25: A.drift_vs_r25, drift_vs_r26: A.drift_vs_r26,
  per_axis_mean_vs_r26: A.per_axis_mean_vs_r26, decoy_floor: A.decoy_floor,
  models_served: A.models_served,
  hypotheses: { H1_band: H1, H2_version: H2, C36 },
  predictions: {
    P1: 'NEAR-MISS-HIT (max 0.09 vs the predicted <= 0.08; no version flip — the substance holds, the digit does not)',
    P2: 'HIT (r28-vs-r26 mean 0.0087 within 1.5x of r26-vs-r24 0.0093 — flat)',
    P3: 'HIT (decoy floor 0.0135 <= 0.03, identical to r25)',
  },
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ38', frozen_by: 'experiments/pre_registration_e_q38.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R28 lane T19-d — the standing instrument (E-Q31 registration; readings r25/r26/r28; the r27 deferral receipt honored by the session boundary)',
    claim: 'C36 — the drift band holds at the fourth reading with the longest spacing',
    floors: 'F1 the map byte-identical to E-Q25/E-Q31 (sha asserted); F2 all 20 records byte-identical; F3 one batched call per record, 12 answers; F4 comparison against the sealed r24/r25/r26 vectors only',
    bands: 'H1 all 20 within 0.10 vs r26; H2 model_served unchanged; C36 = H1 AND H2' },
  { kind: 'run.config', experiment: 'E-Q38', kernel: kernelReport(),
    design: 'the fourth reading: 20 fresh embeds vs three sealed baselines; model_served per call (the Oct-21 flip warning makes the version readout load-bearing); the 4 decoys ride as the in-call floor',
    moth: 'ZERO credits', llm: '20 typesafe calls' },
  { kind: 'verdict.EQ38', experiment: 'E-Q38', H1, H2, C36,
    max_vs_r26: q(A.drift_vs_r26.max), mean_axis_vs_r26: q(A.drift_vs_r26.mean_axis),
    within_r26: `${A.drift_vs_r26.within_010}/20`,
    model_served: A.models_served.join(','), verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q38', claim: 'drift-fourth-C36' });
writeFileSync(join(OUT, 'e_q38_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q38] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q38] H1=${H1} H2=${H2} C36=${C36}`);
console.log(`[e-q38] ${verdict}\n`);
