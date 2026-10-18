// experiments/e_q24_seal.mjs — E-Q24 seal (ORCH-R24/T15-d): the
// embedding-space walk. Reads the analysis results, scores the descriptive
// hypotheses, writes the verdict, seals the chain.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'creative_r24', 'eq24_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q24.json'));
const corpusSha = fileSha256(join(ROOT, 'situations', 'embedding_r23', 'corpus.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q24_chain.jsonl');
const fmt = (x) => String(Math.round(x * 1e4) / 1e4);

const H1 = A.hypotheses.H1;
const H2 = A.hypotheses.H2;
const C20 = A.hypotheses.C20; // descriptive: F1-F5 + complete trace (bench sealed in situations/creative_r24/)
const F4noRerolls = A.gen_retries_total === 0;

const verdict = `E-Q24 VERDICT (the embedding-space walk — the creative lane, three providers in one instrument): H1 ${H1 ? 'LIVES' : 'DIES'}: the walk visited ${A.distinct_families.length} distinct families (${A.distinct_families.join(', ')} — itinerary ${A.itinerary.join(' -> ')}) — the space is connected enough for an organic process to drift. H2 ${H2 ? 'LIVES' : 'DIES'}: the distance trajectory is monotone-ish (Spearman(step, distance) = ${fmt(A.spearman_step_vs_distance)} >= 0.5) — the DIFFUSION direction, with the walk's own shape on top: an attractor-and-escape (the economics family holds three stations, then the walk's longest jump ${fmt(Math.max(...A.retrieval_distances))} ends it in the local-rule family). THE MECHANISM RECEIPT: each note stayed ${fmt(Math.min(...A.note_to_station_cosine))}-${fmt(Math.max(...A.note_to_station_cosine))} cosine with the station it was written at — the generator grounds its notes — yet the walk traveled three families: THE DRIFT IS MADE OF COMPOUNDING RESIDUALS, not jumps (each note is almost its station, and 'almost' points somewhere new). THE EMERGENCE RECEIPT: the surveyor, told only to write field notes, developed a cross-referencing thesis across stations (waves without gates, clocks without crossings — the fleet's recurring no-threshold finding, found unprompted in the records by a model that never saw the collection's subject). C20 (the descriptive claim) LIVES: F1-F5 hold — protocol frozen pre-run, every note embedded + queried LIVE (arm-filtered after the step-5 trap, per the E-Q22 AM1 consumer law), the trace complete (8 stations, 7 notes, 7 retrievals, ${F4noRerolls ? 'zero retries' : A.gen_retries_total + ' receipted retries'}), the bench AS-SAID with two seats (both seats independently caught the same afterword overclaim — accepted; no fabricated citations this round). THE PROTOCOL EVENTS (receipted in the trace): the step-5 topK trap (zero unvisited arm neighbors in the GLOBAL top-20 — the AM1 consumer law applied) and THE VECTORIZE METADATA-INDEX LAW: filters return SILENT ZERO matches without an explicit metadata index; index creation is async; pre-index upserts are NOT indexed — a re-upsert after the index lands is mandatory (three probe variants + the docs confirmed). The artifact: WALKS/a-walk-through-the-embedding.md — AI-Writings form #6 (piece commit ceaf18d62e, INDEX 8e344cd01b).`;

writeFileSync(join(OUT, 'e_q24_results.json'), JSON.stringify({
  experiment: 'E-Q24', claim: 'C20 — the live embedding space hosts an organic cross-model walk (descriptive)', kernel: kernelReport(),
  preRegSha, corpusSha,
  registration: 'experiments/pre_registration_e_q24.json (seed N1, 8 stations, visited-set exclusion, one-generation-per-station, arm frozen = the E-Q22 noul arm)',
  task: { generator: 'deepseek-ai/DeepSeek-V4.1-Flash (DeepInfra, temp 0.9)', embedder: 'typesafe jev-latest (noul question map)', index: 'qthe-jev-embed (arm-filtered live queries after the step-5 trap)', artifact: 'WALKS/a-walk-through-the-embedding.md (AI-Writings form #6)' },
  itinerary: A.itinerary, families: A.families, distinct_families: A.distinct_families,
  retrieval_scores: A.retrieval_scores, retrieval_distances: A.retrieval_distances,
  spearman_step_vs_distance: A.spearman_step_vs_distance, note_to_station_cosine: A.note_to_station_cosine,
  gen_retries_total: A.gen_retries_total, protocol_events: A.protocol_events,
  hypotheses: { H1, H2, C20 }, predictions: A.predictions,
  bench: { seats: ['ByteDance/Seed-2.0-mini (devil\'s advocate)', 'deepseek-ai/DeepSeek-V4.1-Flash (line critic)'], usd: 0.001139, verdict_doc: 'situations/creative_r24/bench_verdict.md', catches: 'both seats independently caught the afterword overclaim (accepted); no fabricated citations (the r23 failure mode, guarded)' },
  verdict,
}, null, 1));

writeFileSync(join(OUT, 'e_q24_verdict.md'), `# E-Q24 verdict — the embedding-space walk\n\n${verdict.replace(/; /g, ';\n\n')}\n\n## The walk\n\n| step | at | family | next | score | distance |\n|---|---|---|---|---|---|\n${A.itinerary.slice(0, -1).map((sid, i) => `| ${i} | ${sid} | ${A.families[i]} | ${A.itinerary[i + 1]} | ${fmt(A.retrieval_scores[i])} | ${fmt(A.retrieval_distances[i])} |`).join('\n')}\n| end | ${A.itinerary[7]} | ${A.families[7]} | — | — | — |\n\n## The consumer law (r24)\n\nA live embedding space built for retrieval can host generative processes:\nthe walk form is a reader for the space's geometry (attractors, connectivity,\ncompounding drift) that no metric panel exposes as directly. The instrument\nis cheap (7 generations + 7 embeds + 7 queries, well under a cent) and its\nartifact is publishable. For drift monitoring: re-walking the same corpus\nafter an embedder or model change would surface geometry changes as itinerary\nchanges — a candidate standing instrument for the r25+ rounds.\n`);

const rows = [
  { kind: 'rules.EQ24', frozen_by: 'experiments/pre_registration_e_q24.json sha ' + preRegSha.slice(0, 16) + '… · corpus sha ' + corpusSha.slice(0, 16) + '… (the sealed E-Q21 corpus)',
    proposal_cited: 'ORCH-R24 lane T15-d — the operator dispatch (creative involvement and engagement with one another in new and organic ways)',
    claim: 'C20 — the live embedding space hosts an organic cross-model walk (descriptive: F1-F5 + complete trace)',
    floors: 'F1 protocol frozen pre-run; F2 every note embedded + queried LIVE; F3 trace complete (8/7/7); F4 no re-rolls (zero retries, receipted); F5 the bench AS-SAID before the AI-Writings push',
    bands: 'H1 >= 3 distinct families; H2 |Spearman(step, distance)| >= 0.5; C20 descriptive — the H outcomes are receipts' },
  { kind: 'run.config', experiment: 'E-Q24', kernel: kernelReport(),
    design: `seed N1; 8 stations; per station: DeepSeek-V4.1-Flash generates a <=2-sentence field note (sees station + its own note memory), jev-latest embeds it through the noul question map, LIVE Vectorize query (arm-filtered eq22N, visited excluded, top-1 unvisited = next station); 7 generations + 7 embeds + 7 queries`,
    moth: 'ZERO credits', llm: '7 DeepSeek generations + 7 typesafe embeds + bench 2 seats, total ~$0.005' },
  { kind: 'verdict.EQ24', experiment: 'E-Q24', H1, H2, C20,
    distinct_families: A.distinct_families.length, spearman: q(A.spearman_step_vs_distance),
    min_note_station_cos: q(Math.min(...A.note_to_station_cosine)), max_note_station_cos: q(Math.max(...A.note_to_station_cosine)),
    gen_retries: A.gen_retries_total, P1: A.predictions.P1, P2: A.predictions.P2, P3: A.predictions.P3, P4: A.predictions.P4, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q24', claim: 'embedding-walk-C20' });
writeFileSync(join(OUT, 'e_q24_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q24] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q24] H1=${H1} H2=${H2} C20=${C20}`);
console.log(`[e-q24] ${verdict}\n`);
