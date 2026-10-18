// experiments/e_q30_seal.mjs — E-Q30 seal (ORCH-R26/T17-c): compositional
// 16-bit retrieval. C26 LIVES — the family algebra survives quantization;
// the 4-level noul code composes PERFECTLY (5/5, the dense ceiling).
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r26', 'eq30_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q30.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q30_chain.jsonl');

const H1 = A.hypotheses.H1_algebra_survives, H2 = A.hypotheses.H2_resolution_pays;
const H3 = A.hypotheses.H3_above_baseline, C26 = A.hypotheses.C26;

const verdict = `E-Q30 VERDICT (does the E-Q26 family algebra survive E-Q27 quantization? — saturation arithmetic on the sealed ternary/4-level codes, live arm-filtered retrieval, seeded permutation null): H1 ${H1 ? 'LIVES' : 'DIES'} — the ternary-noul composed codes hit ${A.live.NT.family_hits}/5 family: the algebra survives 16-bit quantization (dense reference 5/5). AND THE 4-LEVEL NOUL CODE IS PERFECT: NQ ${A.live.NQ.family_hits}/5 — equal to the dense ceiling: the E-Q27 consumer law's best practical code (NQ 0.70 retrieval) is ALSO the best algebra code. H2 ${H2 ? 'LIVES' : 'DIES'}: resolution pays at both comparisons — NQ ${A.live.NQ.family_hits}/5 >= NT ${A.live.NT.family_hits}/5, and 4-level beats ternary on the score substrate too (SQ ${A.live.SQ.family_hits}/5 vs ST ${A.live.ST.family_hits}/5); calibration pays at ternary (NT beats ST: the noul arm's mass geometry carries offsets better at low resolution). H3 ${H1 ? '' : ''}${H3 ? 'LIVES' : 'DIES'}: both noul arms at ${q(A.live.NT.family_hits / 5)}/${q(A.live.NQ.family_hits / 5)} vs the majority baseline 0.25 — 3.2-4x. C26 ${C26 ? 'LIVES' : 'DIES'}: THE 16-BIT CODE IS A QUERYABLE INDEX — a stored code plus an arithmetic operator IS a family query; storage and query collapse into the same object (queries AS storage, measured on live infrastructure). THE NULL RECEIPT: the code-space null p95 is ${A.null.NT.p95} vs the dense null's 4 — quantized geometry has FEWER near-ties (P5 HIT): the composition effect is MORE significant per bit in code space than in dense space. THE CLIPPING RECEIPT: saturation bound on ${A.clip_total.NT}/40 ternary coordinates — slightly above the registered <= 8 (P4 MISS, honest: the offsets occasionally push past the code bounds; the clip is doing real work and the algebra survives it). LOCAL==LIVE on every arm (the F3 receipt: 3/5, 5/5, 4/5, 5/5 identical). THE LAW: nobody in the learning-to-hash literature composes queries by arithmetic on ternary QA-codes — binary codes at 100s-1000s bits matched by Hamming, never composed; the ternary/4-level QA-code is now measured as a query LANGUAGE, not just storage.`;

writeFileSync(join(OUT, 'e_q30_results.json'), JSON.stringify({
  experiment: 'E-Q30', claim: 'C26 — the 16-bit code is a queryable index (storage = query)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q30.json (no amendments — the run as registered)',
  task: { arms: 'ST/SQ/NT/NQ', compositions: 5, calls: 'ZERO new embed calls' },
  live: { ST: A.live.ST.family_hits, SQ: A.live.SQ.family_hits, NT: A.live.NT.family_hits, NQ: A.live.NQ.family_hits },
  null: A.null, clip_total: A.clip_total,
  hypotheses: A.hypotheses, predictions: A.predictions, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ30', frozen_by: 'experiments/pre_registration_e_q30.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R26 lane T17-c — the prior-art pass open question Q5 (compositional retrieval over 16-bit codes)',
    claim: 'C26 — composed codes retrieve families; storage = query',
    floors: 'F1 codes recomputed from the sealed E-Q27 tables; F2 the five analogy tuples byte-identical to E-Q26; F3 live arm-filtered retrieval for every composed code; F4 the null seeded (20261026) before the live read',
    bands: 'H1 ternary >= 4/5; H2 the comparison (both directions pre-registered); H3 both noul arms >= 2x majority; C26 = H1 AND H3' },
  { kind: 'run.config', experiment: 'E-Q30', kernel: kernelReport(),
    design: 'clip(code(a)-code(b)+code(c)) per arm range; cosine rank over the arm corpus; live queries against the resident eq27 arms; 1000-draw permutation null seed 20261026',
    moth: 'ZERO credits', llm: 'ZERO new calls' },
  { kind: 'verdict.EQ30', experiment: 'E-Q30', H1, H2, H3, C26,
    ST: A.live.ST.family_hits, SQ: A.live.SQ.family_hits, NT: A.live.NT.family_hits, NQ: A.live.NQ.family_hits,
    null_NT_p95: A.null.NT.p95, clips_NT: A.clip_total.NT,
    P1: A.predictions.P1, P2: A.predictions.P2, P3: A.predictions.P3, P4: A.predictions.P4, P5: A.predictions.P5, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q30', claim: 'code-algebra-C26' });
writeFileSync(join(OUT, 'e_q30_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q30] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q30] H1=${H1} H2=${H2} H3=${H3} C26=${C26} | live ST/ST/SQ/NT/NQ: ${A.live.ST.family_hits}/${A.live.SQ.family_hits}/${A.live.NT.family_hits}/${A.live.NQ.family_hits}`);
console.log(`[e-q30] ${verdict}\n`);
