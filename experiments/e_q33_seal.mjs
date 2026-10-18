// experiments/e_q33_seal.mjs — E-Q33 seal (ORCH-R27/T18-b): the ascending
// budget arm. C31 DIES decisively — one-shot generation collapses to
// surface shortcuts (0.25 = the majority baseline).
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r26', 'eq33_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q33.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q33_chain.jsonl');

const H1 = A.hypotheses.H1_beats_full, H2 = A.hypotheses.H2_beats_knee, C31 = A.hypotheses.C31;

const verdict = `E-Q33 VERDICT (the ascending budget arm — ONE DeepSeek call proposes a 4-question battery from 2 example records per family, our axis concepts HIDDEN; embedded over all 20, evaluated LIVE): C31 ${C31 ? 'LIVES' : 'DIES'} DECISIVELY — the generated battery retrieves at ${q(A.live_accuracy)} LIVE (${A.live_hits}/20) = THE MAJORITY BASELINE, versus the fixed knee 0.90 and the full 8-question battery 0.80. H1 ${H1 ? 'LIVES' : 'DIES'}, H2 ${H2 ? 'LIVES' : 'DIES'}. THE MECHANISM (the questions are the receipt): the generator went for SURFACE SHORTCUTS, not semantic concerns — Q1 'does the experiment name contain the letter b or end with a number after a hyphen' (a FILENAME-FORMAT probe, Shapley ${q(A.shapley.G1)} — negative, anti-informative); Q2 'does the record report a measured numerical percentage or ratio' (a format feature); Q3 'does the record explicitly state a verdict word such as LIVES or DIES' (our own verdict vocabulary — FAMILY-BLIND by construction, the E-Q29 P6_null Shapley receipt already knew this); Q4 'does the record mention a 64x64 torus, Moore-8 neighborhood, or checkerboard cascade' (domain surface mentions). THE SHORTCUT-LEARNING LAW: an untrained one-shot generator given 8 examples optimizes distinguishing FEATURES, not semantic CONCERNS — the classifier's spurious-cue failure, reproduced in question space. THE COMPLEMENTARITY RECEIPT: the generated best-2 subset reaches ${q(A.local_best_curve['2'])} (parity with the fixed best-2!) but the full generated-4 COLLAPSES to ${q(A.local_best_curve['4'])} — two surface questions carry as much as two semantic ones, but four surface questions CANCEL each other while four semantic ones (P1+P2+P3+P4) reach 0.90: THE FIXED BATTERY'S ADVANTAGE IS COMPLEMENTARITY, not per-question quality. THE CONSUMER LAW: question selection cannot be one-shot — it needs either training (QA-Emb, CQG-MBQA) or design iteration (our fixed battery's actual history across rounds); the single-shot dignity rule measured exactly what it costs. P4 HIT (the miss tables disagree completely — different question geometry, different errors: ${JSON.stringify(A.misses.slice(0, 4))}); P1 MISS honestly (predicted [0.65, 0.85], actual 0.25 — the collapse was not predicted); P2 MISS (no concept rediscovery — zero of the four questions is a semantic concern; P3's flatness prediction also misses: the curve PEAKS at 2 and collapses at 4, the anti-complementarity shape).`;

writeFileSync(join(OUT, 'e_q33_results.json'), JSON.stringify({
  experiment: 'E-Q33', claim: 'C31 — generated discriminative questions vs the fixed knee (dies: the shortcut law)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q33.json (no amendments — the single-shot dignity rule held: one parse, zero retries)',
  task: { questions: A.generated_questions, live_hits: A.live_hits, calls: '1 generator + 20 embeds' },
  live_accuracy: A.live_accuracy,
  hypotheses: A.hypotheses, predictions: A.predictions, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ33', frozen_by: 'experiments/pre_registration_e_q33.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R27 lane T18-b — Q4\'s ascending half, against the measured knee',
    claim: 'C31 — the ascending arm is competitive with the fixed contract at equal budget',
    floors: 'F1 first parseable output (zero retries — held); F2 byte-identical question shape; F3 live arm-filtered eval, poll-until-visible; F4 the sealed r26 references 0.90/0.80',
    bands: 'H1 >= 0.70; H2 >= 0.90; C31 = H1' },
  { kind: 'run.config', experiment: 'E-Q33', kernel: kernelReport(),
    design: 'one DeepSeek-V4.1-Flash generation (8 examples, 2/family, axis concepts hidden, temp 0.7, JSON array of 4); noul-typed over 20 records; arm eq33G upserted + live-queried; own-axis subset curve + Shapley',
    moth: 'ZERO credits', llm: '1 generator call + 20 typesafe embeds' },
  { kind: 'verdict.EQ33', experiment: 'E-Q33', H1, H2, C31,
    live_accuracy: q(A.live_accuracy), best2: q(A.local_best_curve['2']), best4_local: q(A.local_best_curve['4']),
    P1: A.predictions.P1, P4: A.predictions.P4, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q33', claim: 'ascending-shortcut-C31' });
writeFileSync(join(OUT, 'e_q33_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q33] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q33] H1=${H1} H2=${H2} C31=${C31} | live 0.25 = majority; the shortcut law`);
console.log(`[e-q33] ${verdict}\n`);
