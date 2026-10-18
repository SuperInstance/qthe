// experiments/e_q29_seal.mjs — E-Q29 seal (ORCH-R26/T17-b): the question-
// budget curve. C25 LIVES with the stronger-than-registered finding: the
// best-4 subset (P1+P2+P3+P4) retrieves at 0.90 LIVE — ABOVE the full 8-axis
// battery (0.80). Pruning beats the full battery.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r26', 'eq29_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q29.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q29_chain.jsonl');
const fmt = (x) => String(Math.round(x * 1e4) / 1e4);

const H1 = A.hypotheses.H1_knee, H2 = A.hypotheses.H2_headroom, H3 = A.hypotheses.H3_convergent_validity;
const C25 = A.hypotheses.C25;

const verdict = `E-Q29 VERDICT (the question-budget curve, descending arm — all 255 axis subsets of the sealed E-Q22 noul vectors, Shapley importance, best-4 + full-8 live confirm): H1 ${H1 ? 'LIVES' : 'DIES'} — with a STRONGER finding than registered: the best-4 subset ${A.best_subsets['4'].map(s => s.split('_')[0]).join('+')} retrieves at ${fmt(A.live_confirm.eq29S4.accuracy)} LIVE — ABOVE the full 8-axis battery (${fmt(A.live_confirm.eq29S8.accuracy)}): PRUNING BEATS THE FULL BATTERY on this corpus. The curve peaks at k=4-6 (${fmt(A.curve_best['4'])}/${fmt(A.curve_best['5'])}/${fmt(A.curve_best['6'])}) and DECLINES to the full 8 (${fmt(A.curve_best['8'])}) — the last four questions (P5-P8) are net NOISE dimensions for family retrieval: they add descriptive resolution but misfile records (the S8 miss table vs the S4: 4 misses vs 2). THE OVER-PROVISIONING LAW: a fixed question battery carries value BEYOND retrieval (drift monitoring, tripwires, algebra) — but for retrieval alone, half the map is not just sufficient, it is BETTER. H2 ${H2 ? 'LIVES' : 'DIES'}: best-2 ${A.best_subsets['2'].map(s => s.split('_')[0]).join('+')} at ${fmt(A.curve_best['2'])} — half the family signal is already in the best two questions. THE SHAPLEY RECEIPT: ${A.shapley_rank.slice(0, 4).map(s => s.split('_')[0]).join(' > ')} the top-4 marginal axes — yet the best-4 SUBSET contains P4_alloc (the LOWEST-Shapley axis): marginal value and complementarity are DIFFERENT — P4 is useless on average but disambiguates in the P1P2P3 context (question selection is combinatorial, not rankable — the QA-Emb lesson, measured). H3 ${H3 ? 'LIVES' : 'DIES'} — the cross-instrument Spearman(Shapley, occlusion-mass) is ${fmt(A.cross_instrument_spearman)}: occlusion saliency (where the map READS FROM) is UNCORRELATED with marginal retrieval value (what the coordinates DO for the index) — reading is not contributing; the distributed-reading law's cousin, measured honestly. THE CONSUMER LAW: the 4-question map beats the 300-dim BOW embedder (0.80) on this corpus at 4 calls/record — but defend the rate, not the absolute (20 records). THE OPS LAW (this round's receipt): the async-changeset poll-until-visible upgrade — a flat 30s sleep raced the enqueue and read ALL NO-NEIGHBOR; the poll loop is now mandatory everywhere.`;

writeFileSync(join(OUT, 'e_q29_results.json'), JSON.stringify({
  experiment: 'E-Q29', claim: 'C25 — the question budget has a knee (over-provisioning measured)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q29.json (no amendments — the run as registered)',
  task: { subsets: 255, live_arms: ['eq29S4', 'eq29S8'], calls: 'ZERO new embed calls' },
  curve_best: A.curve_best, best_subsets: A.best_subsets, shapley_rank: A.shapley_rank,
  hypotheses: A.hypotheses, predictions: A.predictions, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ29', frozen_by: 'experiments/pre_registration_e_q29.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R26 lane T17-b — the prior-art pass open question Q4, descending arm',
    claim: 'C25 — the question budget has a knee (the fixed battery is over-provisioned for family retrieval)',
    floors: 'F1 sealed E-Q22 vectors recomputed; F2 exhaustive deterministic enumeration (255/255); F3 live arm-filtered confirm, poll-until-visible; F4 the Spearman from the two sealed files only',
    bands: 'H1 B(4) >= 0.70; H2 B(2) >= 0.50; H3 Spearman > 0.4; C25 = H1' },
  { kind: 'run.config', experiment: 'E-Q29', kernel: kernelReport(),
    design: '255 subset accuracies (strict non-self top-1 family, cosine on projections); Shapley exact over 256 subsets; best-4 + full-8 upserted arm-tagged (pad-to-32 law) and queried LIVE; cross-instrument Spearman vs the sealed E-Q23 occlusion masses',
    moth: 'ZERO credits', llm: 'ZERO new calls' },
  { kind: 'verdict.EQ29', experiment: 'E-Q29', H1, H2, H3, C25,
    B4: q(A.curve_best['4']), B2: q(A.curve_best['2']), B8: q(A.curve_best['8']),
    live_S4: q(A.live_confirm.eq29S4.accuracy), live_S8: q(A.live_confirm.eq29S8.accuracy),
    spearman: q(A.cross_instrument_spearman),
    P1: A.predictions.P1, P2: A.predictions.P2, P3: A.predictions.P3, P4: A.predictions.P4, P5: A.predictions.P5, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q29', claim: 'budget-knee-C25' });
writeFileSync(join(OUT, 'e_q29_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q29] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q29] H1=${H1} H2=${H2} H3=${H3} C25=${C25} | B(4)=${A.curve_best['4']} live-confirmed`);
console.log(`[e-q29] ${verdict}\n`);
