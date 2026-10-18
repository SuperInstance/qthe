// experiments/e_q34_seal.mjs — E-Q34 seal (ORCH-R27/T18-c): IRT strictness
// ladders. C32 DIES on monotonicity — but the separation-convergence
// (0.886) and the phrasing law are the round's receipts.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r26', 'eq34_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q34.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q34_chain.jsonl');

const H1 = A.hypotheses.H1_monotone, H2 = A.hypotheses.H2_separation, H3 = A.hypotheses.H3_convergence;
const C32 = A.hypotheses.C32;

const verdict = `E-Q34 VERDICT (IRT strictness ladders — 8 axes x 5 rungs, one 40-question batched call per record over the frozen 8-record subset, with AM1: the anchor R2 amended to byte-identical E-Q22 text after the phrasing law bit): C32 ${C32 ? 'LIVES' : 'DIES'} ON MONOTONICITY — H1 ${H1 ? 'LIVES' : 'DIES'} DECISIVELY NEGATIVE: the perfect-ladder rate is ${q(A.monotonicity.perfect_rate)} (12/64) — the noul readout does NOT treat strictness phrasings as an ordered scale; 'appears at all' / 'substantively concerns' / 'central concern' / 'two most dominant' / 'THE dominant' do not yield monotonically decreasing mass. The psychometric-scale intuition FAILS on the calibrated substrate — strictness is not a difficulty dimension here. H2 ${H2 ? 'LIVES' : 'DIES'}: family separation is positive on all 6 family-defining axes (P3_quantum 0.845 at R1 — the LOOSEST rung separates Q best; P2 0.74 and P7 0.72 at R2; P1 0.69 at R2; P4 0.51 at R2; P8 0.02 — family-blind, consistent with its low Shapley). H3 ${H3 ? 'LIVES' : 'DIES'} DECISIVELY: Spearman(family separation, E-Q29 Shapley) = ${q(A.cross_instrument_spearman_sep_shapley)} — THE CROSS-INSTRUMENT CONVERGENCE PASSES where occlusion failed (-0.02): the two instruments that AGREE are separation (does the axis split families at its best rung) and Shapley (does the axis add marginal retrieval value) — reading locality is the quantity that stands alone. THE INSTRUMENT'S CONVERGENT-VALIDITY MAP now has three nodes: separation <-> Shapley 0.886; occlusion <-> Shapley -0.02; (separation <-> occlusion untested). THE PHRASING LAW (AM1's receipt, an unplanned but well-controlled measurement): a semantically-identical but syntactically-different anchor phrasing (declarative vs interrogative) moved noul mass by up to ${q(A.phrasing_receipt.max_delta)} = 2x the version-drift band (mean ${q(A.phrasing_receipt.mean_delta)}, 12/64 deltas > 0.05) — A QUESTION MAP'S COORDINATES ARE PHRASING-SENSITIVE: replication across instruments requires BYTE-IDENTITY, and cross-battery comparisons must control sentence shape. The amended byte-identical anchor replicated at ${q(A.anchor.max_delta_r2_vs_sealed)} (within band, F2 held). P3 MISS (the best discriminating rung is R2, the map's default, not R3 — 4 of 6 axes peak at R2; P3_quantum peaks at R1); P1 MISS (predicted [0.70, 0.90], actual 0.19); P2 MISS (thresholds do not order home-later — they barely order at all); P5 HIT (the anchor).`;

writeFileSync(join(OUT, 'e_q34_results.json'), JSON.stringify({
  experiment: 'E-Q34', claim: 'C32 — strictness ladders as a psychometric instrument (dies on monotonicity; the convergence receipt lives)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q34.json + AM1 (pre_registration_amendment_e_q34_1.json, appended before dependent analysis)',
  task: { calls: '8 (amended run) + 8 (the phrasing receipt, retained)', records: 8, questions_per_call: 40 },
  monotonicity: A.monotonicity, separation: A.separation,
  cross_instrument_spearman_sep_shapley: A.cross_instrument_spearman_sep_shapley,
  phrasing_receipt: A.phrasing_receipt, anchor: A.anchor,
  hypotheses: A.hypotheses, predictions: A.predictions, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ34', frozen_by: 'experiments/pre_registration_e_q34.json sha ' + preRegSha.slice(0, 16) + '… + AM1 (the anchor phrasing law, appended before dependent analysis)',
    proposal_cited: 'ORCH-R27 lane T18-c — the r24 ideas battery I-6 (IRT psychometrics)',
    claim: 'C32 — strictness ladders turn the map into a psychometric instrument',
    floors: 'F1 the frozen 40-question battery (AM1: R2 byte-identical to E-Q22); F2 the anchor band <= 0.10 (held at 0.06 after AM1); F3 one batched call per record, 40 answers; F4 the sealed E-Q29 Shapley only',
    bands: 'H1 perfect-ladder >= 0.70; H2 separation > 0 on >= 6 axes; H3 Spearman > 0.4; C32 = H1 AND H2' },
  { kind: 'run.config', experiment: 'E-Q34', kernel: kernelReport(),
    design: '5 rungs x 8 axes x 8 records; the phrasing receipt run retained (declarative anchor) alongside the amended run (byte-identical anchor); separation = home-family mean minus others at the best rung; Spearman vs the sealed E-Q29 Shapley',
    moth: 'ZERO credits', llm: '16 typesafe calls total (8 phrasing receipt + 8 amended)' },
  { kind: 'verdict.EQ34', experiment: 'E-Q34', H1, H2, H3, C32,
    perfect_rate: q(A.monotonicity.perfect_rate),
    spearman_sep_shapley: q(A.cross_instrument_spearman_sep_shapley),
    phrasing_max: q(A.phrasing_receipt.max_delta), anchor_max: q(A.anchor.max_delta_r2_vs_sealed),
    P1: A.predictions.P1, P2: A.predictions.P2, P3: A.predictions.P3, P4: A.predictions.P4, P5: A.predictions.P5, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q34', claim: 'irt-ladders-C32' });
writeFileSync(join(OUT, 'e_q34_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q34] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q34] H1=${H1} H2=${H2} H3=${H3} C32=${C32} | monotone ${A.monotonicity.perfect_rate}, convergence ${A.cross_instrument_spearman_sep_shapley}`);
console.log(`[e-q34] ${verdict}\n`);
