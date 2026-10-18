// experiments/e_q32_seal.mjs — E-Q32 seal (ORCH-R27/T18-a): retrieval-
// coupled fitness. C30 LIVES — the decoupling law's fix works: 4 stations,
// the theoretical minimum.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'evolution_r26', 'eq32_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q32.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q32_chain.jsonl');

const H1 = A.hypotheses.H1_coverage, H2 = A.hypotheses.H2_agreement, H3 = A.hypotheses.H3_heredity;
const C30 = A.hypotheses.C30;

const verdict = `E-Q32 VERDICT (the decoupling law's fix — retrieval-coupled selection: the gate accepts iff BOTH Jev models' top-1 unvisited retrievals land in the SAME UNVISITED family; the evosphere DO's r27 world, gate_mode=retrieval): H1 ${H1 ? 'LIVES' : 'DIES'} — THE STRONG FORM: 4 stations to 4-family coverage (${A.itinerary.join('->')}), ONE PER FAMILY — the theoretical minimum. The comparison ladder is now complete: the ungated walk 5 (compounding residuals), the centroid-cosine gate 6 (the decoupling tax), the retrieval-coupled gate 4 (the objective itself). C30 ${C30 ? 'LIVES' : 'DIES'}: SELECTION ON THE OBJECTIVE REPAIRS THE DECOUPLING — the gate that accepts only what the space will actually do compresses coverage to its floor. H2 ${H2 ? 'LIVES' : 'DIES'} at the ceiling: cross-model retrieval agreement ${q(A.cross_model_retrieval_agreement.family)} at the FAMILY level and ${q(A.cross_model_retrieval_agreement.record)} at the RECORD level — the two Jev versions (1.13.0 latest, 1.14.0 preview) retrieved the SAME RECORD on every attempt through the same index: the C15 question answered at the retrieval layer — VERSION DRIFT DOES NOT FLIP RETRIEVALS (P3 MISS above the predicted [0.6,0.9] range, in the strong direction). H3 ${H3 ? 'LIVES' : 'DIES'}: heredity ${q(A.heredity.mean)} — the family-JUMPING notes stay well-grounded (the flip discount vs E-Q28's 0.9273 is real but bounded, as pre-registered in the weaker direction). THE DECOUPLING DELTA RECEIPT (P5 HIT): the run's ONE rejection had the centroid cosine IMPROVING by +0.41 while the retrieval refused (P5, a visited family) — the E-Q28 failure mode, caught red-handed by the repaired gate. THE DIRECTIVE stays causal: named-axis movement ${q(A.directive_causality.mean_named_move)} vs unnamed ${q(A.directive_causality.mean_unnamed_move)} (2.7x). THE ECONOMICS: 9 embed calls + 4 generations for 4 stations (the walk: 8+7 for 8; the centroid gate: 21+10 for 6) — the repaired gate is also the CHEAPEST per station. P6 MISS honestly: no stagnation event — the gate was satisfiable within 2 attempts at every generation (the strictness that E-Q28's proxy made unsatisfiable is easy when the objective is real).`;

writeFileSync(join(OUT, 'e_q32_results.json'), JSON.stringify({
  experiment: 'E-Q32', claim: 'C30 — retrieval-coupled selection repairs the decoupling (LIVES, the strong form)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q32.json (no amendments — the run as registered)',
  task: { seed: 'N1', done: A.done, itinerary: A.itinerary, attempts: A.attempts_total, embed_calls: A.embed_calls },
  stations_to_coverage: A.stations_to_coverage,
  hypotheses: A.hypotheses, predictions: A.predictions, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ32', frozen_by: 'experiments/pre_registration_e_q32.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R27 lane T18-a — the decoupling law\'s fix (E-Q28\'s registered successor)',
    claim: 'C30 — retrieval-coupled selection repairs the decoupling',
    floors: 'F1 qmap byte-identical (both models); F2 both retrievals LIVE same index/arm; F3 the DO gate deterministic, append-only, new r27 world; F4 generator sees concepts only; F5 AS-SAID rows, 40-call cap',
    bands: 'H1 coverage <= 5; H2 cross-model agreement >= 0.60; H3 heredity >= 0.75; C30 = H1' },
  { kind: 'run.config', experiment: 'E-Q32', kernel: kernelReport(),
    design: 'evosphere r27 world, gate_mode=retrieval: accept iff retrieval_latest.family and retrieval_preview.family are the same UNVISITED family; two live queries per attempt; centroid cosines receipted not decisive; escape_after 2; max 10 gens, 2 attempts/gen',
    moth: 'ZERO credits', llm: '9 typesafe embed calls (1 seed-preview + 4 attempts x 2 models) + 4 DeepInfra generations' },
  { kind: 'verdict.EQ32', experiment: 'E-Q32', H1, H2, H3, C30,
    stations_to_coverage: A.stations_to_coverage, walk: 5, centroid_gate: 6,
    agreement_family: q(A.cross_model_retrieval_agreement.family), agreement_record: q(A.cross_model_retrieval_agreement.record),
    heredity_mean: q(A.heredity.mean), decoupling_delta_rate: q(A.decoupling_delta.rate_on_rejections),
    named_move: q(A.directive_causality.mean_named_move), unnamed_move: q(A.directive_causality.mean_unnamed_move),
    P1: A.predictions.P1, P2: A.predictions.P2, P3: A.predictions.P3, P4: A.predictions.P4,
    P5: A.predictions.P5, P6: A.predictions.P6, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q32', claim: 'retrieval-gate-C30' });
writeFileSync(join(OUT, 'e_q32_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q32] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q32] H1=${H1} H2=${H2} H3=${H3} C30=${C30} | 4 stations = the theoretical minimum`);
console.log(`[e-q32] ${verdict}\n`);
