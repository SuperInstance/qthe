// experiments/e_q35_seal.mjs — E-Q35 seal (ORCH-R28/T19-a): depth-2
// conditional axes. C33 DIES on premise-contamination — with the program
// effect alive (0.703 vs the 0.252 no-values control).
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r28', 'eq35_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q35.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q35_chain.jsonl');

// pre-registered bands: H1 Spearman >= 0.5; H2 within-band >= 75% of 48; H3 relation > raw on A
const H1 = A.M1_program_test.spearman_dominance_pC_R1 >= 0.5;
const H2 = A.M2_conditioning_delta.within_010 / 48 >= 0.75;
const H3 = A.M3_relation_signature.relation_seps[A.M3_relation_signature.best_A_rel].A > A.M3_relation_signature.raw_seps[A.M3_relation_signature.best_A_raw].A;
const C33 = H1 && H2;
const stabMax = Math.max(...Object.values(A.M4_stability));

const verdict = `E-Q35 VERDICT (depth-2 conditional axes — the r24 ideas battery I-3, the last unrun idea; arm C embeds stage-1 measured values in the instructions, arm N names the axes only; 6 relation questions per record over the frozen 8-record subset; AM1 implementation-time: stability read as 3 records per arm, 22 calls total): C33 ${C33 ? 'LIVES' : 'DIES'} ON PREMISE-CONTAMINATION — H1 ${H1 ? 'LIVES' : 'DIES'}: THE PROGRAM TEST PASSES with the control contrast doing the work: Spearman(stage-1 dominance, p(subordination)) = ${q(A.M1_program_test.spearman_dominance_pC_R1)} WITH the values embedded versus ${q(A.M1_program_test.spearman_dominance_pN_R1)} WITHOUT them — the verdict tracks the measured inputs only when the measurements are in the instructions; the map is programmable and the VALUES are the causal variable. H2 ${H2 ? 'LIVES' : 'DIES'}: telling the model its own measurements moved the verdicts beyond the 0.10 drift band on ${48 - A.M2_conditioning_delta.within_010}/48 paired questions (${q(1 - A.M2_conditioning_delta.within_010 / 48)} — the band required <= 25%); median delta ${q(A.M2_conditioning_delta.median)}, max ${q(A.M2_conditioning_delta.max)}; 9 verdict flips cross 0.5. THE CONTAMINATION IS STRUCTURED: R6 family-edge is the most moved (mean ${q(A.M2_conditioning_delta.per_relation_mean.R6_family_edge)}), R1 subordination the least (${q(A.M2_conditioning_delta.per_relation_mean.R1_subordination)}) — the mechanical relation resists the premise while the uncertain ones float with it (P2 HIT). H3 ${H3 ? 'LIVES' : 'DIES'}: the best relation separates the A-family at only ${q(A.M3_relation_signature.relation_seps[A.M3_relation_signature.best_A_rel].A)} versus the best raw axis ${A.M3_relation_signature.best_A_raw.split('_')[0]} at ${q(A.M3_relation_signature.raw_seps[A.M3_relation_signature.best_A_raw].A)} — the A signature is a MASS pattern, not a relation (P3 MISS). Stability max ${q(stabMax)} (band holds). THE FINDING: THE CONDITIONING CHANNEL IS REAL AND CONTAMINATING — a two-edged instrument; use it for measurement (H1), never for retrieval features (H2's leak).`;

writeFileSync(join(OUT, 'e_q35_results.json'), JSON.stringify({
  experiment: 'E-Q35', claim: 'C33 — depth-2 conditional axes: the question map as a program (dies on contamination; the program effect lives)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q35.json + AM1 (implementation-time, pre-analysis: stability as 3 records per arm, 22 calls — the superset reading)',
  task: { calls: 22, records: 8, questions_per_call: 6, arms: 'C (values) + N (names only)' },
  M1_program_test: A.M1_program_test, M2_conditioning_delta: A.M2_conditioning_delta,
  M3_relation_signature: A.M3_relation_signature, M4_stability: A.M4_stability,
  hypotheses: { H1_program: H1, H2_premise_innocence: H2, H3_relation_signature: H3, C33 },
  predictions: {
    P1: 'HIT (Spearman 0.703 in [0.5, 0.8]; relations noisy but tracking)',
    P2: 'HIT (R6 family-edge the most moved at 0.186; R1 the least at 0.045)',
    P3: 'MISS (best relation 0.172 vs best raw axis 0.720 — the A signature is mass, not relation)',
    P4: 'HIT (stability max 0.05 <= 0.10)',
    P5: 'HIT (9 verdict flips cross 0.5 — P1 family-edge and provenance flips among them)',
  },
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ35', frozen_by: 'experiments/pre_registration_e_q35.json sha ' + preRegSha.slice(0, 16) + '… + AM1 (implementation-time stability reading, pre-analysis)',
    proposal_cited: 'ORCH-R28 lane T19-a — the r24 ideas battery I-3 (depth-2 conditional axes, the last unrun idea)',
    claim: 'C33 — the question map is programmable: stage-2 verdicts track embedded stage-1 state without premise contamination',
    floors: 'F1 the six relation templates + two arm preambles frozen; F2 stage-1 values from the sealed E-Q22 file only; F3 one batched call per record per arm, 6 answers; F4 family-separation comparison vs the sealed E-Q22 profiles; F5 stability within 0.10',
    bands: 'H1 Spearman(dominance, p_C(R1)) >= 0.5; H2 |p_C - p_N| <= 0.10 on >= 75% of 48; H3 best relation > best raw axis on A; C33 = H1 AND H2' },
  { kind: 'run.config', experiment: 'E-Q35', kernel: kernelReport(),
    design: '6 relations (subordination, independence, provenance, boundary, polarity, family-edge) built per record from its sealed stage-1 profile (top/second/bottom/boundary axes); arm C preamble embeds measured values at 2 decimals, arm N names without values; jev-latest; 22 calls (8+8+6 stability)',
    moth: 'ZERO credits', llm: '22 typesafe calls' },
  { kind: 'verdict.EQ35', experiment: 'E-Q35', H1, H2, H3, C33,
    spearman_C: q(A.M1_program_test.spearman_dominance_pC_R1),
    spearman_N_control: q(A.M1_program_test.spearman_dominance_pN_R1),
    delta_within_band: `${A.M2_conditioning_delta.within_010}/48`,
    delta_median: q(A.M2_conditioning_delta.median),
    stability_max: q(stabMax), verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q35', claim: 'conditional-axes-C33' });
writeFileSync(join(OUT, 'e_q35_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q35] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q35] H1=${H1} H2=${H2} H3=${H3} C33=${C33}`);
console.log(`[e-q35] ${verdict}\n`);
