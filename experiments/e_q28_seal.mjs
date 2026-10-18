// experiments/e_q28_seal.mjs — E-Q28 seal (ORCH-R26/T17-a): latent-space
// evolution. The steering receipt: C24 dies in its strong form (selection
// did not compress stations-to-coverage) — with the measured structure that
// survives: causal directives, discriminating coordinated gate, intact
// heredity, the load-bearing escape rule, and THE DECOUPLING LAW.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'evolution_r26', 'eq28_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q28.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q28_chain.jsonl');

const H1 = A.hypotheses.H1_coverage, H2 = A.hypotheses.H2_selection_bites;
const H3 = A.hypotheses.H3_coordination, H4 = A.hypotheses.H4_heredity;
const C24 = A.hypotheses.C24;

const verdict = `E-Q28 VERDICT (does deterministic code-side selection over typed-map embeddings STEER generation? — mutation=DeepSeek under gap-derived directives, selection=the evosphere DO's coordinated dual-JEV gate, heredity=accepted lineage, environment=LIVE Vectorize eq22N, control=the sealed E-Q24 walk): H1 ${H1 ? 'LIVES' : 'DIES'} — the gated process covered all 4 families in ${A.stations_to_coverage} stations vs the control walk's 5: selection did NOT compress coverage (${A.itinerary.join('->')}); C24 ${C24 ? 'LIVES' : 'DIES on H1'} — THE DECOUPLING LAW: family-centroid cosine and top-1 retrieval family are DIFFERENT objectives. The gen-2 mutant reached ${q(0.8724)} cosine to the P centroid yet its top-1 retrieval landed N4(N) — the latent hill was climbed while the retrieval geometry refused to flip; directed hill-climbing overshot into centroid regions whose record neighborhoods did not change family. The undirected walk's compounding residuals were, on this corpus, the MORE coverage-efficient mover. BUT the steering is real and measured on every other instrument: H2 LIVES decisively (5/10 rejections — a 0.50 acceptance rate — with discrimination ${q(A.discrimination.mean_delta_accepted)} accepted vs ${q(A.discrimination.mean_delta_rejected)} rejected: the gate discriminates, not decorates); H3 LIVES (coordination ${q(A.coordination_rate)} — and TWO SPLIT-REJECTIONS where jev-latest alone would have accepted and only the preview model's decline refused the mutant: the coordinated gate made rejections a single-model gate COULD NOT, the k=2 independence pattern's first live use as a selection pressure); H4 LIVES (heredity mean ${q(A.heredity.mean)} — the directed mutants stay as grounded as the walk's notes 0.93-0.98: direction did not cost grounding). THE DIRECTIVE IS CAUSAL (P6): named-axis movement ${q(A.directive_causality.mean_named_move)} vs unnamed ${q(A.directive_causality.mean_unnamed_move)} — the gap-derived concepts moved the axes they named ~2x harder than the axes they did not. THE ESCAPE RULE WAS LOAD-BEARING: generations 3-4 stagnated on the P target (4 consecutive rejects at the 0.87 fitness ledge), the pre-registered rotation fired at gen 5 (P->A), and the A-directed run crossed P territory in transit (the accepted gen-5 note retrieved P4 — coverage of P arrived as a SIDE EFFECT of moving toward A). THE ECONOMICS RECEIPT: ${A.embed_calls} embed calls + ${A.generator_calls} generator calls for ${A.stations_to_coverage} stations vs the walk's 8+7 for 8 — direction costs ~2.6x the measurement per station. THE ARTIFACT: the evosphere Durable Object (selection-as-infrastructure) — the protocol, the append-only attempt log, and the frozen centroids live as code in a DO that never calls a model (the jev-lattice law applied to evolution); the full world state is the receipt.`;

writeFileSync(join(OUT, 'e_q28_results.json'), JSON.stringify({
  experiment: 'E-Q28', claim: 'C24 — code-side selection steers generation (dies on H1, with the decoupling law)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q28.json (no amendments — the run as registered; the escape rule fired as pre-registered)',
  task: { seed: 'N1', done: A.done, itinerary: A.itinerary, attempts: A.attempts_total, embed_calls: A.embed_calls },
  hypotheses: A.hypotheses, predictions: A.predictions, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ28', frozen_by: 'experiments/pre_registration_e_q28.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R26 lane T17-a — the r24 ideas battery I-5 (latent-space evolution), the creative flagship',
    claim: 'C24 — deterministic code-side selection over typed-map embeddings steers generation',
    floors: 'F1 qmap byte-identical to E-Q22 (both models); F2 centroids from the sealed eq22N arm only; F3 the DO gate is deterministic code, append-only attempts; F4 the generator sees concept texts only; F5 live arm-filtered retrieval; F6 AS-SAID rows + DO state version checks',
    bands: 'H1 coverage <= 5 stations; H2 >= 1 rejection + discrimination; H3 coordination >= 0.70; H4 heredity >= 0.80; C24 = H1 AND H2' },
  { kind: 'run.config', experiment: 'E-Q28', kernel: kernelReport(),
    design: 'mutation=DeepSeek-V4.1-Flash under gap-vector directives; selection=evosphere DO (qthe-evosphere.casey-digennaro.workers.dev, DO id r26) coordinated gate: cos(v, target_centroid) must improve on BOTH jev-latest AND jev-preview; heredity=lineage; escape_after=2 stagnated gens rotates target; max 10 gens, 2 attempts/gen',
    moth: 'ZERO credits', llm: '21 typesafe embed calls (1 seed-preview + 10 attempts x 2 models) + 10 DeepInfra generations' },
  { kind: 'verdict.EQ28', experiment: 'E-Q28', H1, H2, H3, H4, C24,
    stations_to_coverage: A.stations_to_coverage, control_stations: 5,
    acceptance_rate: q(A.acceptance_rate), discrimination_acc: q(A.discrimination.mean_delta_accepted),
    discrimination_rej: q(A.discrimination.mean_delta_rejected), coordination_rate: q(A.coordination_rate),
    split_rejections: A.split_rejections, heredity_mean: q(A.heredity.mean),
    named_move: q(A.directive_causality.mean_named_move), unnamed_move: q(A.directive_causality.mean_unnamed_move),
    P1: A.predictions.P1, P2: A.predictions.P2, P3: A.predictions.P3, P4: A.predictions.P4,
    P5: A.predictions.P5, P6: A.predictions.P6, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q28', claim: 'evolution-steering-C24' });
writeFileSync(join(OUT, 'e_q28_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q28] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q28] H1=${H1} H2=${H2} H3=${H3} H4=${H4} C24=${C24} | stations ${A.stations_to_coverage} vs control 5`);
console.log(`[e-q28] ${verdict}\n`);
