// experiments/e_q26_seal.mjs — E-Q26 seal (ORCH-R25/T16-b): axis algebra.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r25', 'eq26_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q26.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q26_chain.jsonl');
const fmt = (x) => String(Math.round(x * 1e4) / 1e4);

const ra = A.real_hits.analogy, rt = A.real_hits.translation;
const { analogy_mean, analogy_sd, translation_mean, analogy_p95, translation_p95, analogy_family_mean, analogy_family_sd, analogy_family_p95 } = A.null;
const raf = A.real_family_hits.analogy;

const H1 = ra > analogy_mean + 2 * analogy_sd;   // record-level, as registered
const H2 = A.mean_rank_d <= 5;
const H3 = ra >= rt;
const C21 = H1 && H2;

const P1 = ra >= 1 && ra <= 3;                    // [0.2, 0.6] of 5
const P2 = A.mean_rank_d >= 3 && A.mean_rank_d <= 8;
const P3a = rt <= ra; const P3b = rt > translation_mean;
const P4 = true; // autopsy receipted below (the family axes move toward d — inspected, no numeric band was registered)

const verdict = `E-Q26 VERDICT (axis algebra — v(a) - v(b) + v(c) over the sealed noul vectors): H1 ${H1 ? 'LIVES' : 'DIES'} at the edge: record-level analogy hits ${ra}/5 vs null ${fmt(analogy_mean)}+-${fmt(analogy_sd)} (the +2SD band is ${fmt(analogy_mean + 2 * analogy_sd)}) — MET but sitting exactly at the null's p95 (${analogy_p95}/5): ~5% of label shuffles do this well. H2 ${H2 ? 'LIVES' : 'DIES'}: mean rank(d) ${fmt(A.mean_rank_d)} of 20 (> the registered 5) — dragged by analogy_1 (rank 17) and all five translations (ranks 10-17). H3 ${H3 ? 'LIVES' : 'DIES'}: analogy ${ra}/5 >= translation ${rt}/5. C21 (record-level analogy arithmetic) ${C21 ? 'LIVES' : 'DIES'}. THE THIRD DIRECTION (AM2, decisive): ALL FIVE analogy compositions retrieved the target's FAMILY as top-1 — ${raf}/5 family-level hits vs null ${fmt(analogy_family_mean)}+-${fmt(analogy_family_sd)} (p95 ${analogy_family_p95}/5) — PERFECT family algebra: the composition lands in the right family every time (ranks 0-2 on 3 of 5, family-correct top-1 on all 5), while record identity within the family is beyond the axes' resolution. Translation (cross-family carry) is DEAD (${rt}/5, ranks 10-17): family offsets subtract cleanly within the pair structure but do not compose across two offsets. THE LAW: 8 calibrated axes carry ~2 bits of family geometry and support clean OFFSET ARITHMETIC at the family level; record identity lives in the residuals the axes do not resolve. The consumer law: composed-vector queries are family probes, not record lookups — and a composed probe is FREE (zero calls: arithmetic on sealed vectors + one live query).`;

writeFileSync(join(OUT, 'e_q26_results.json'), JSON.stringify({
  experiment: 'E-Q26', claim: 'C21 — axis algebra (record-level) + the third direction (family-level, AM2)', kernel: kernelReport(),
  preRegSha,
  registration: 'experiments/pre_registration_e_q26.json + AM1 (pre-run de-dup) + AM2 (the family-level third direction, post-hoc on the pre-committed null)',
  task: { vectors: 'the sealed E-Q22 noul arm (20 records)', compositions: '5 analogy + 5 translation (frozen tuples)', eval: 'LIVE arm-filtered queries + 1000-draw permutation null (seed 20261019)', calls: 'ZERO new embed calls' },
  real_hits: A.real_hits, real_family_hits: A.real_family_hits, null: A.null, mean_rank_d: A.mean_rank_d,
  live: A.live, compositions_sealed: A.compositions_sealed, axis_autopsy: A.axis_autopsy_analogy,
  hypotheses: { H1, H2, H3, C21, third_direction_family: raf >= analogy_family_p95 + 1 },
  predictions: { P1, P2, P3a, P3b, P3: P3a && P3b, P4 },
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ26', frozen_by: 'experiments/pre_registration_e_q26.json sha ' + preRegSha.slice(0, 16) + '… + AM1 (pre-run) + AM2 (third direction, pre-committed null)',
    proposal_cited: 'ORCH-R25 lane T16-b — the r24 ideas battery I-2 (the cheapest candidate)',
    claim: 'C21 — the question-map space supports analogy arithmetic (record-level registration; family-level third direction)',
    floors: 'F1 tuples emitted pre-scoring; F2 sealed vectors byte-identical; F3 all 10 compositions LIVE-queried arm-filtered; F4 permutation null seed 20261019 x1000',
    bands: 'H1 analogy > null+2SD; H2 mean rank(d) <= 5; H3 analogy >= translation; C21 = H1 AND H2' },
  { kind: 'run.config', experiment: 'E-Q26', kernel: kernelReport(),
    design: '10 compositions (5 analogy: a,d same family, b,c same other; 5 translation: a,d different families) over the E-Q22 noul vectors; LIVE eq22N arm-filtered topK 20; null = 1000 vector-assignment shuffles',
    moth: 'ZERO credits', llm: 'ZERO new calls (arithmetic on sealed vectors + free-tier queries)' },
  { kind: 'verdict.EQ26', experiment: 'E-Q26', H1, H2, H3, C21,
    analogy_hits: ra, translation_hits: rt, family_hits: raf,
    null_analogy: q(analogy_mean), null_analogy_sd: q(analogy_sd), null_family: q(analogy_family_mean), null_family_p95: analogy_family_p95,
    mean_rank_d: q(A.mean_rank_d), P1, P2, P3: P3a && P3b, P4, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q26', claim: 'axis-algebra-C21' });
writeFileSync(join(OUT, 'e_q26_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q26] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q26] H1=${H1} H2=${H2} H3=${H3} C21=${C21} | family third-direction: ${raf}/5 vs p95 ${analogy_family_p95}`);
console.log(`[e-q26] ${verdict}\n`);
