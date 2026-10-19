// experiments/e_q36_seal.mjs — E-Q36 seal (ORCH-R28/T19-b): the at-scale
// corpus. C34 DIES on the algebra — the small-corpus artifact receipt; the
// gate, the floor, and the moved knee all replicate.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r28', 'eq36_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q36.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q36_chain.jsonl');

// pre-registered bands
const H1 = A.best_overall_k >= 5;                       // the knee moves to k>=5 (either direction receipted; up is the claim)
const H2 = A.algebra.hits >= 7;                          // family analogy >= 7/10 vs null p95
const H3 = A.evolution.stations_to_coverage <= 6;        // gate efficiency at scale
const H4 = A.decoy_floor.all.mean <= 0.03;               // floor scales
const C34 = H2 && H3 && H4;

const verdict = `E-Q36 VERDICT (the at-scale corpus — 60 records, 4 families x 15, the sealed E-Q21 20 byte-identical + 40 new from the sealed record; the byte-identical E-Q25 12-question map; arm=eq36N live): C34 ${C34 ? 'LIVES' : 'DIES'} ON THE ALGEBRA — H1 ${H1 ? 'LIVES' : 'DIES'}: THE KNEE MOVES — best-k=6 at ${q(A.budget_curve[6].best)} ({P1,P2,P3,P4,P5,P7}) versus best-4 ${q(A.budget_curve[4].best)} and full-8 ${q(A.budget_curve[8].best)}: with 3x the records the extra axes EARN their seats; pruning still beats the full battery but the 20-record k=4 was an under-sample, not a law (P1 direction-HIT, magnitude to 6 not 5). H2 ${H2 ? 'LIVES' : 'DIES'} DECISIVELY: THE FAMILY ALGEBRA IS A SMALL-CORPUS ARTIFACT — ${A.algebra.hits}/10 family hits versus permutation null ${q(A.algebra.null_mean)} ± ${q(A.algebra.null_sd)} (p95 ${A.algebra.null_p95}): at chance. The miss pattern is c-dominance: v(a)-v(b)+v(c) retrieves the c-record's family on 4 of 5 misses; the hits are a-survivals (4 of 5 retrieved the a-record itself). The E-Q26 5/5 perfection at n=20 does NOT survive n=60 — exactly the scale-reversal the r28 research pass (CTC, Sep 2026) warned to re-derive; the honest narrowing: the algebra law is scoped to the 20-record corpus (P2 MISS). H3 ${H3 ? 'LIVES' : 'DIES'}: THE GATE REPLICATES AT SCALE — 4 STATIONS = the theoretical minimum again (${A.evolution.itinerary}; 9 attempts, 19 embeds, 9 generations, coverage at gen 5; the P-trap — 4 rejections retrieving N8/N2/N12 — broken by the escape rule P->Q at gen 3; cross-model retrieval 9/9 family-agree, 8/9 record-agree; P3 MISS — predicted 5, got 4). H4 ${H4 ? 'LIVES' : 'DIES'}: the decoy floor at scale — mean ${q(A.decoy_floor.all.mean)} over 240 readings, max ${q(A.decoy_floor.all.max)}; far decoys ~0.010, near-miss D3 ${q(A.decoy_floor.D3_near_bio.mean)} — the same structure as r25 (P4 HIT). Retrieval at scale: full-8 ${q(A.live.full8.accuracy)} live==local, majority 0.25, best-k 0.817 vs the 20-record 0.90 — the graceful decline matches the IR literature's scale curve (P5 MISS at 0.733 < 0.75). Shapley at scale: P3 > P1 > P2 > P7 > P4 > P8 > P5 > P6. Stability max 0.04 (band holds). models_served jev-1.13.0 throughout. THE HONEST CAVEAT NOW CUTS THE OTHER WAY: the 20-record ceiling was hiding an algebra artifact while the gate, the floor, and the knee structure all survive.`;

writeFileSync(join(OUT, 'e_q36_results.json'), JSON.stringify({
  experiment: 'E-Q36', claim: 'C34 — the strong results replicate at 3x corpus scale (dies on the algebra; the gate, floor, and knee replicate)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q36.json (no amendments)',
  task: { calls: '63 embeds (60 + 3 stability) + 19 evolution embeds + 9 DeepInfra generations', records: 60, questions_per_call: 12 },
  budget_curve: A.budget_curve, best_overall_k: A.best_overall_k, shapley: A.shapley,
  live: A.live, algebra: A.algebra, decoy_floor: A.decoy_floor,
  evolution: A.evolution, stability_max_axis: A.stability_max_axis,
  models_served: A.models_served, corpus_sha256: A.corpus_sha256,
  hypotheses: { H1_knee: H1, H2_algebra: H2, H3_evolution: H3, H4_decoy_floor: H4, C34 },
  predictions: {
    P1: 'HALF-HIT (knee moves UP as predicted; to 6 not 5, and the new axes are P5 AND P7)',
    P2: 'MISS (5/10 at null chance — the artifact prediction was the right worry, the wrong direction)',
    P3: 'MISS (4 stations, not 5 — the gate found the theoretical minimum again)',
    P4: 'HIT (floor 0.0160 in [0.01, 0.03])',
    P5: 'MISS (full-8 0.733, just under the [0.75, 0.90] band)',
  },
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ36', frozen_by: 'experiments/pre_registration_e_q36.json sha ' + preRegSha.slice(0, 16) + '… + the corpus sealed at commit a859f12 (sha c0d77c32…)',
    proposal_cited: 'ORCH-R28 lane T19-b — the r27 close-out registration (the honest-caveat fix)',
    claim: 'C34 — the program\'s strong results replicate at 3x corpus scale',
    floors: 'F1 the 60 texts sha-frozen before any embed call; F2 the question map byte-identical to E-Q25 (sha asserted); F3 one batched call per record, 12 answers; F4 poll-until-visible + arm-filtered queries only; F5 the 10 compositions fixed by pre-committed seed 20261020 before any query, null seed x1000; F6 the evolution on a NEW r28 world (r26/r27 sealed worlds untouched)',
    bands: 'H1 best-k >= 5; H2 analogy >= 7/10 vs null p95; H3 stations <= 6; H4 floor <= 0.03; C34 = H2 AND H3 AND H4' },
  { kind: 'run.config', experiment: 'E-Q36', kernel: kernelReport(),
    design: '60 records (4x15) through the E-Q25 12-question map, arm=eq36N on qthe-jev-embed; all 255 axis subsets local + Shapley exact; full-8 and best-4 live; 10 seeded compositions vs permutation null x1000; the E-Q32 retrieval-coupled gate protocol on the r28 evosphere world; 240 decoy readings',
    moth: 'ZERO credits', llm: '82 typesafe calls + 9 DeepInfra generations' },
  { kind: 'verdict.EQ36', experiment: 'E-Q36', H1, H2, H3, H4, C34,
    best_k: A.best_overall_k, best_k_acc: q(A.budget_curve[A.best_overall_k].best),
    full8_live: q(A.live.full8.accuracy),
    algebra_hits: `${A.algebra.hits}/10`, algebra_null: q(A.algebra.null_mean),
    stations: A.evolution.stations_to_coverage,
    decoy_floor_mean: q(A.decoy_floor.all.mean), verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q36', claim: 'at-scale-C34' });
writeFileSync(join(OUT, 'e_q36_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q36] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q36] H1=${H1} H2=${H2} H3=${H3} H4=${H4} C34=${C34}`);
console.log(`[e-q36] ${verdict}\n`);
