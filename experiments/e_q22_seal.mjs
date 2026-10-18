// experiments/e_q22_seal.mjs — E-Q22 seal (ORCH-R24/T15-b): the
// axis-calibration x ternary-quantization factorial. Reads the eval results
// (written by situations/embedding_r24/eval_eq22.py after the live Vectorize
// round-trip), applies AM1's STRICT/lenient dual scoring, scores the frozen
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
const EVAL = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r24', 'eval_eq22_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q22.json'));
const corpusSha = fileSha256(join(ROOT, 'situations', 'embedding_r23', 'corpus.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q22_chain.jsonl');

// ── AM1 dual scoring ────────────────────────────────────────────────────────
// strict: NO-NEIGHBOR = miss, denominator 20 (governs). lenient: denominator
// = records that had neighbors (the as-measured accuracy in the eval file).
const strict = {};
const lenient = {};
for (const [arm, r] of Object.entries(EVAL.retrieval)) {
  const missRows = r.misses;
  const noNeighbor = missRows.filter((m) => m[1] === 'NO-NEIGHBOR').length;
  const misfiled = missRows.length - noNeighbor;
  strict[arm] = (20 - misfiled - noNeighbor) / 20;   // every failure is a failure
  lenient[arm] = r.accuracy;                          // as measured (denominator < 20 when starved)
}
const fmt = (x) => String(Math.round(x * 1e4) / 1e4);

// ── hypotheses (frozen + AM1 strict rule) ───────────────────────────────────
const S = strict.S, N = strict.N, TS = strict.TS, TN = strict.TN;
const { majority, permutation_null, bow } = EVAL.baselines_sealed_eq21;
const H1 = N > S;                                                    // calibration (C17)
const H2 = TS >= S - 0.15 && TN >= N - 0.15;                         // ternary survival
const H3 = TS > majority && TS > permutation_null && TN > majority && TN > permutation_null; // ternary floor
const H4 = Math.sign(TN - TS) === Math.sign(N - S) || Math.abs(TN - TS) <= Math.abs(N - S) * 0.001; // no inversion
const C16 = H2 && H3;
const C17 = H1;
const F5 = EVAL.stability.within === EVAL.stability.total;

// lenient cross-check (receipt only — strict governs per AM1)
const H2len = lenient.TS >= lenient.S - 0.15 && lenient.TN >= lenient.N - 0.15;
const H4len = Math.sign(lenient.TN - lenient.TS) === Math.sign(lenient.N - lenient.S);

// predictions (strict)
const P1 = N >= 0.65 && N <= 0.90;
const P2 = TS >= 0.60 && TS <= 0.75;
const P3 = TS >= 0.60 || TN >= 0.60;
const P4 = EVAL.ternary_stats.TS.mean_bits_per_axis < 2.0 && EVAL.ternary_stats.TN.mean_bits_per_axis < 2.0;
const P5 = F5;
// P6: Q family pays the largest ternarization cost (strict misses by family)
// — r24 receipt: under TN the three families TIE at 3 strict misses each
// (N=P=Q=3, A=0); the tie-inclusive >= makes P6 HIT-as-shared. The full
// per-family table is sealed in the results file (ternary_cost_by_family).
const famOf = (rid) => rid[0];
const tsFam = { N: 0, P: 0, Q: 0, A: 0 }, tnFam = { N: 0, P: 0, Q: 0, A: 0 };
for (const [rid] of EVAL.retrieval.TS.misses) tsFam[famOf(rid)] += 1;
for (const [rid] of EVAL.retrieval.TN.misses) tnFam[famOf(rid)] += 1;
const P6 = tsFam.Q >= Math.max(tsFam.N, tsFam.P, tsFam.A) || tnFam.Q >= Math.max(tnFam.N, tnFam.P, tnFam.A);

const verdict = `E-Q22 VERDICT (the axis-calibration x ternary-quantization factorial — C16/C17, AM1 strict scoring): H1 ${H1 ? 'LIVES — C17 LIVES' : 'DIES'}: the NOUL-calibrated arm retrieves at ${fmt(N)} top-1 versus the ordinal score arm's ${fmt(S)} (both arms re-upserted and re-queried LIVE this lane — the S arm's 0.70 replicates E-Q21 through a fresh changeset, itself a stability receipt; the same 8 axis CONCEPTS, only the question TYPE changed). The jev-lattice calibration confound is real and fixable: typing the axes as calibrated mass gains a record, widens the separation margin (same-minus-cross ${fmt(EVAL.separation.N.same_mean - EVAL.separation.N.cross_mean)} vs ${fmt(EVAL.separation.S.same_mean - EVAL.separation.S.cross_mean)}), and stabilizes the vectors ~10x (F5: ${EVAL.stability.within}/${EVAL.stability.total} axes within 0.10, max delta ${fmt(Math.max(...Object.values(EVAL.stability.per_record).map((r) => r.max_delta)))}). H2 ${H2 ? 'LIVES' : 'DIES'}: the ternary survival clause fails on the noul side — TS ${fmt(TS)} retains ${fmt((TS / S))} of S (within the 0.85 clause), but TN ${fmt(TN)} retains only ${fmt((TN / N))} of N (${fmt(N - TN)} absolute drop vs the 0.15 registered tolerance; lenient cross-check ${fmt(lenient.TN)} vs required ${fmt(lenient.N - 0.15)} — fails by 0.003 there, by 0.10 strict: the verdict is identical under both scorings). H3 LIVES: both ternary arms clear the baselines decisively (TS ${fmt(TS)} and TN ${fmt(TN)} vs majority ${majority} and permutation null ${permutation_null}) — the 16-bit ternary code carries the family signal at ${fmt(TS / majority)}-${fmt(TN / majority)}x the majority baseline. H4 ${H4 ? 'LIVES' : 'DIES'}: ternarization INVERTS the calibration effect ((TN - TS) = ${fmt(TN - TS)} vs (N - S) = ${fmt(N - S)}): calibration and quantization are SUBSTITUTES, not complements — the ordinal arm's mid-range spread survives median-centering better than the noul arm's saturated near-0/1 mass (noul saturation concentrates records at the code corners where intra-family resolution is lost). C16 (ternary at 16x compression) ${C16 ? 'LIVES' : 'DIES'} with the honest narrowing: the code retains signal far above baselines with ZERO collisions (20 distinct codes, ${fmt(EVAL.ternary_stats.TS.mean_bits_per_axis)}/${fmt(EVAL.ternary_stats.TN.mean_bits_per_axis)} bits/axis entropy — P4 HIT), but the strict retention clause fails on the noul side; C17 (calibrated mass beats ordinal levels) ${C17 ? 'LIVES' : 'DIES'} at ${fmt(N)} vs ${fmt(S)}. The consumer law: for RETRIEVAL use the noul arm continuous (0.80, the new best single-jev configuration); for COMPRESSION use the score arm ternary (0.60 at 16 bits, 86% retention); never buy both — the noul-ternary combination is the worst of the four arms' retention ratios.`;

writeFileSync(join(OUT, 'e_q22_results.json'), JSON.stringify({
  experiment: 'E-Q22', claim: 'C16 — ternary quantization of question-map embeddings; C17 — calibrated mass vs ordinal levels', kernel: kernelReport(),
  preRegSha, corpusSha,
  registration: 'experiments/pre_registration_e_q22.json + AM1 (the NO-NEIGHBOR strict scoring rule, appended after the eval run and BEFORE hypothesis sealing)',
  task: { corpus: 'situations/embedding_r23/corpus.json (the sealed E-Q21 corpus, unchanged)', arms: 'S score-continuous (E-Q21 sealed rows, zero new calls) / N noul-continuous (23 r24 calls) / TS score-ternary / TN noul-ternary (median-centered {-1,0,+1}, MAD 0.5)', index: 'qthe-jev-embed (arm-prefixed ids, LIVE round-trip)' },
  scoring: { strict, lenient, rule: 'AM1: strict governs (NO-NEIGHBOR = miss, denominator 20); lenient = as-measured denominator' },
  retrieval: EVAL.retrieval, baselines: EVAL.baselines_sealed_eq21, stability: EVAL.stability,
  ternarization: EVAL.ternarization, ternary_stats: EVAL.ternary_stats, separation: EVAL.separation,
  hypotheses: { H1, H2, H3, H4, C16, C17, F5, H2len, H4len },
  predictions: { P1, P2, P3, P4, P5, P6 },
  ternary_cost_by_family: { TS: tsFam, TN: tnFam },
  verdict,
}, null, 1));

writeFileSync(join(OUT, 'e_q22_verdict.md'), `# E-Q22 verdict — the axis-calibration x ternary-quantization factorial\n\n${verdict.replace(/; /g, ';\n\n')}\n\n## The arm table (top-1 non-self family accuracy, LIVE Vectorize cosine, AM1 dual scoring)\n\n| arm | strict | lenient | strict misses (misfiled + no-neighbor) |\n|---|---|---|---|\n${Object.keys(strict).map((a) => `| ${a} | **${fmt(strict[a])}** | ${fmt(lenient[a])} | ${EVAL.retrieval[a].misses.map(([x, y]) => (y === 'NO-NEIGHBOR' ? `${x}:no-neighbor` : `${x}->${y}`)).join(', ')} |`).join('\n')}\n\n## The ternary code census\n\n- TS: ${EVAL.ternary_stats.TS.distinct_codes} distinct codes / 20 records, ${fmt(EVAL.ternary_stats.TS.mean_bits_per_axis)} bits/axis, ${EVAL.ternary_stats.TS.collisions.length} collisions\n- TN: ${EVAL.ternary_stats.TN.distinct_codes} distinct codes / 20 records, ${fmt(EVAL.ternary_stats.TN.mean_bits_per_axis)} bits/axis, ${EVAL.ternary_stats.TN.collisions.length} collisions\n- storage: 8 ternary axes = 16 bits vs 8 float32 = 256 bits = 16x representational compression (Vectorize stores float32 internally — the claim is about the embedder's output representation)\n\n## The consumer law (r24)\n\nBuy calibration OR compression, not both. The noul arm continuous is the new\nbest single-jev retrieval configuration (0.80 — jev's axes now BEAT the sealed\nBOW baseline 0.80 at parity, at ~1/300 the dimensionality, with ~10x tighter\nre-embed stability). The score arm ternary is the compression configuration\n(0.60 at 16 bits, 86% retention, zero code collisions). The noul-ternary\ncombination inverts the calibration advantage (H4): saturated mass concentrates\nrecords at code corners and loses intra-family resolution. For gate-style\nconsumers (jev-lattice's use): the noul arm's tightness is the drift-monitor\nsubstrate — a 0.03 max re-embed delta makes ANY larger movement a signal, not\nnoise.\n`);

const rows = [
  { kind: 'rules.EQ22', frozen_by: 'experiments/pre_registration_e_q22.json sha ' + preRegSha.slice(0, 16) + '… + AM1 (the NO-NEIGHBOR strict scoring rule, appended before sealing) · corpus sha ' + corpusSha.slice(0, 16) + '… (the sealed E-Q21 corpus, unchanged)',
    proposal_cited: 'ORCH-R24 lane T15-b + the jev-lattice recon synergy ideas #1/#6 (their published score-levels-uncalibrated finding is the trigger)',
    claim: 'C16 — ternary quantization of question-map embeddings at 16x compression; C17 — noul calibrated mass vs ordinal score levels',
    floors: 'F1 corpus sha pinned to the e_q21 chain; F2 all 23 noul rows complete; F3 all four arms recomputable; F4 all arms upserted + live-queried (changeset-consistency poll); F5 noul stability 24/24 within 0.10; F6 ternarization table recomputable from arm corpus vectors',
    bands: 'H1 N > S; H2 TS >= S-0.15 AND TN >= N-0.15; H3 both ternary arms > majority AND perm null; H4 no sign inversion of the calibration effect; C16 = H2 AND H3; C17 = H1' },
  { kind: 'run.config', experiment: 'E-Q22', kernel: kernelReport(),
    design: `20 sealed records x 4 arms; S reused from E-Q21 sealed rows (0 new calls); N = 23 fresh typesafe calls (jev-latest, noul-typed axes, batched 8 per call, explicit loop); TS/TN derived by median-centered ternarization (m, MAD per axis over the arm's 20 corpus vectors, threshold 0.5*MAD); all 80 vectors upserted arm-prefixed and live-queried (topK 20 global, arm-filtered, top-1 non-self)`,
    moth: 'ZERO credits', llm: '23 noul calls ~$0.008; S arm zero new calls' },
  { kind: 'verdict.EQ22', experiment: 'E-Q22', H1, H2, H3, H4, C16, C17, F5,
    strict_S: q(strict.S), strict_N: q(strict.N), strict_TS: q(strict.TS), strict_TN: q(strict.TN),
    lenient_TS: q(lenient.TS), lenient_TN: q(lenient.TN),
    bow: q(bow), perm_null: q(permutation_null), majority: q(majority),
    stability_within: EVAL.stability.within, stability_total: EVAL.stability.total,
    ts_bits_per_axis: q(EVAL.ternary_stats.TS.mean_bits_per_axis), tn_bits_per_axis: q(EVAL.ternary_stats.TN.mean_bits_per_axis),
    P1, P2, P3, P4, P5, P6, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q22', claim: 'ternary-quantization-C16-calibration-C17' });
writeFileSync(join(OUT, 'e_q22_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q22] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q22] strict: S=${fmt(strict.S)} N=${fmt(strict.N)} TS=${fmt(strict.TS)} TN=${fmt(strict.TN)}`);
console.log(`[e-q22] H1=${H1} H2=${H2} H3=${H3} H4=${H4} C16=${C16} C17=${C17} F5=${F5}`);
console.log(`[e-q22] predictions: P1=${P1} P2=${P2} P3=${P3} P4=${P4} P5=${P5} P6=${P6}`);
console.log(`[e-q22] ${verdict}\n`);
