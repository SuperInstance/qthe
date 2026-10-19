// experiments/e_q37_seal.mjs — E-Q37 seal (ORCH-R28/T19-c): the
// phrasing-sensitivity curve. C35 DIES on the movement rate — with the
// inverted finding: the phrasing law is LEXICAL, not structural.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r28', 'eq37_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q37.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q37_chain.jsonl');

// pre-registered bands: H1 some treatment > 0.10 on >= 25% of pairs; H2 median shape >= 0.8; H3 susceptibility rank corr >= 0.6 for >= 2 pairs
const maxRate = Math.max(...Object.values(A.M1_movement).map(m => m.pct_over_band));
const H1 = maxRate >= 0.25;
const H2 = Math.min(...['T1','T2','T3'].map(t => A.M2_shape[t].median)) >= 0.8;
const corrVals = Object.values(A.M3_susceptibility_rank_corr);
const H3 = corrVals.filter(c => c >= 0.6).length >= 2;
const C35 = H1 && H2;

const verdict = `E-Q37 VERDICT (the phrasing-sensitivity curve — 4 treatments x the frozen 8-record subset, question-side only; T0 anchor / T1 synonym-swap / T2 syntactic-reorder / T3 role-reframe; the 4 decoys byte-identical in every call): C35 ${C35 ? 'LIVES' : 'DIES'} ON THE MOVEMENT RATE — H1 ${H1 ? 'LIVES' : 'DIES'}: no treatment crossed the 0.10 band on a quarter of pairs — T1 (synonym) is the biggest mover at ${q(A.M1_movement.T1.pct_over_band)} (median ${q(A.M1_movement.T1.median)}, max ${q(A.M1_movement.T1.max)}), T2 (reorder) ${q(A.M1_movement.T2.pct_over_band)}, T3 (reframe) ${q(A.M1_movement.T3.pct_over_band)} — but the DECOMPOSITION is the finding: THE PHRASING LAW IS LEXICAL, NOT STRUCTURAL — synonym swaps move calibrated mass (16% over band, max 0.32) while clause reordering and auditor reframing barely move it (2-3%); the readout is WORD-sensitive, not FRAME-sensitive (P1 INVERTED — predicted T3 max / T1 min, measured the reverse). H2 ${H2 ? 'LIVES' : 'DIES'} DECISIVELY: the profile SHAPE survives everything — median Spearman(profile_T, profile_T0) = ${q(A.M2_shape.T1.median)} / ${q(A.M2_shape.T2.median)} / ${q(A.M2_shape.T3.median)} (P3 HIT for T1 at 0.961 >= 0.9; T2/T3 above 0.97). H3 ${H3 ? 'LIVES' : 'DIES'} AT THE TWO-PAIR BAND: only the structural pair converges — the rank correlation between T2 and T3 susceptibility profiles is ${q(A.M3_susceptibility_rank_corr['T2-T3'])}, but T1's lexical profile differs (${q(A.M3_susceptibility_rank_corr['T1-T2'])}/${q(A.M3_susceptibility_rank_corr['T1-T3'])}): susceptibility is a stable axis property WITHIN the structural-transform family only; the lexical treatment carries its own susceptibility pattern (one pair of three cleared the 0.6 band — the pre-registration demanded two). P8_exact is the MOST phrasing-susceptible axis under all three treatments (the exactness axis is the least exact under paraphrase; P5 MISS — predicted P6_null). The decoy floor stayed dead under ALL treatments (means 0.0128-0.0138, max 0.05 — P4 HIT): injection-resistance and paraphrase-immunity are different properties and the canaries have both. THE CONSUMER LAW: replication requires byte-identity, but the SHAPE survives paraphrase — cross-phrasing comparisons may compare profiles, never masses.`;

writeFileSync(join(OUT, 'e_q37_results.json'), JSON.stringify({
  experiment: 'E-Q37', claim: 'C35 — phrasing variance is bounded and structured (dies on the rate; the lexical/structural decomposition lives)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q37.json (no amendments)',
  task: { calls: 32, records: 8, questions_per_call: 12, treatments: 'T0 anchor, T1 synonym, T2 reorder, T3 reframe' },
  anchor: A.anchor, M1_movement: A.M1_movement, M2_shape: A.M2_shape,
  M3_susceptibility: A.M3_susceptibility, M3_susceptibility_rank_corr: A.M3_susceptibility_rank_corr,
  M4_family_effect: A.M4_family_effect, M5_decoy_floor: A.M5_decoy_floor,
  hypotheses: { H1_movement: H1, H2_shape: H2, H3_susceptibility: H3, C35 },
  predictions: {
    P1: 'INVERTED-MISS (T1 synonym moves the most at 16%, T3 reframe among the least at 3% — predicted the reverse)',
    P2: 'PARTIAL (mid-mass axes float most within T1; not measured as a registered band — the per-axis table is the receipt)',
    P3: 'HIT (T1 shape 0.961; T2/T3 above 0.97 — all above the 0.9/0.7-0.9 bands)',
    P4: 'HIT (decoy floor <= 0.05 under all treatments)',
    P5: 'MISS (P8_exact is the most susceptible, not P6_null)',
  },
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ37', frozen_by: 'experiments/pre_registration_e_q37.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R28 lane T19-c — the r27 close-out registration (the E-Q34 AM1 receipt at scale)',
    claim: 'C35 — phrasing variance is bounded and structured: mass moves beyond the band but the shape survives',
    floors: 'F1 the four treatment templates frozen; F2 record texts byte-identical across treatments; F3 one batched call per record per treatment, 12 answers; F4 the T0 anchor within 0.10 of sealed on >= 7/8; F5 movement vs the IN-RUN T0 anchor',
    bands: 'H1 some treatment > 0.10 on >= 25% of pairs; H2 median shape Spearman >= 0.8; H3 susceptibility rank corr >= 0.6 for >= 2 treatment pairs; C35 = H1 AND H2' },
  { kind: 'run.config', experiment: 'E-Q37', kernel: kernelReport(),
    design: 'T1 synonym-swap (substantively concern->meaningfully engage; Judge whether->Assess whether; about this concern->on this matter); T2 syntactic-reorder (same words, clauses flipped); T3 role-reframe (auditor framing); decoys byte-identical in all calls; jev-latest',
    moth: 'ZERO credits', llm: '32 typesafe calls' },
  { kind: 'verdict.EQ37', experiment: 'E-Q37', H1, H2, H3, C35,
    T1_over_band: q(A.M1_movement.T1.pct_over_band),
    T1_max: q(A.M1_movement.T1.max),
    shape_T1_median: q(A.M2_shape.T1.median),
    susc_T2T3: q(A.M3_susceptibility_rank_corr['T2-T3']),
    anchor_within: `${A.anchor.within_010}/8`, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q37', claim: 'phrasing-curve-C35' });
writeFileSync(join(OUT, 'e_q37_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q37] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q37] H1=${H1} H2=${H2} H3=${H3} C35=${C35}`);
console.log(`[e-q37] ${verdict}\n`);
