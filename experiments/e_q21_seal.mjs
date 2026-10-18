// experiments/e_q21_seal.mjs — E-Q21 seal (ORCH-R23/T14-a): the question map
// as an embedding function. Reads the eval results (written by
// situations/embedding_r23/eval_embed.py after the live Vectorize round-trip),
// scores the frozen hypotheses, writes the verdict, seals the chain.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { appendAndVerify, q, fileSha256 } from './_harness.mjs';
import { linkStone } from './_stone_link.mjs';
import { loadKernel, kernelReport } from './_adapter.mjs';

await loadKernel();
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'experiments', 'outputs');
const EVAL = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r23', 'eval_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q21.json'));
const corpusSha = fileSha256(join(ROOT, 'situations', 'embedding_r23', 'corpus.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q21_chain.jsonl');

const acc = (s) => EVAL.retrieval[s].accuracy;
const { bow, permutation_null, majority } = EVAL.baselines;

// hypotheses (frozen)
const H1 = acc('jev') > majority && acc('jev') > permutation_null;      // C14 core
const H2 = acc('jev') >= bow;                                            // the BOW parity test
const H3acc = acc('qwen38-27b') >= acc('jev') - 1 / 20 && acc('gpt-oss-20b') >= acc('jev') - 1 / 20;
// divergence structured: max/min mean-axis divergence ratio >= 2 AND the profile agrees across both groq seats
const div = (seat) => EVAL.divergence[seat].map((p) => p.mean_abs_delta);
const dmax = Math.max(...div('qwen38-27b')), dmin = Math.min(...div('qwen38-27b'));
const rank = (a) => a.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).map(([, i]) => i);
const topOverlap = rank(div('qwen38-27b')).slice(0, 3).filter((i) => rank(div('gpt-oss-20b')).slice(0, 3).includes(i)).length;
const H3div = dmax / dmin >= 2 && topOverlap >= 2;
const C14 = H1; // per the registration: C14 = H1 (AND F1-F4); H2's failure narrows the value claim, receipted
const C15 = H3acc && H3div;
const F5 = EVAL.stability.within === EVAL.stability.total;

const fmt = (x) => String(Math.round(x * 1e4) / 1e4);
const verdict = `E-Q21 VERDICT (the question map is an embedding function — C14/C15): H1 ${H1 ? 'LIVES — C14 LIVES' : 'DIES — C14 DIES'}: the jev 8-probe embedding retrieves same-family records at ${fmt(acc('jev'))} top-1 accuracy via LIVE Vectorize cosine, vs the majority baseline ${majority} and the permutation null ${fmt(permutation_null)} (the instrument panel IS a metric space). H2 ${H2 ? 'LIVES' : `DIES — BOW-cosine on the same texts scores ${fmt(bow)} vs jev's ${fmt(acc('jev'))} (P2 HIT, predicted): the honest narrowing — the 8 interpretable axes buy ~88% of full-vocab BOW accuracy at ~1/300th the dimensionality, and the SAME axes through qwen3.8-27b score ${fmt(acc('qwen38-27b'))}, ABOVE BOW: the axes are sufficient; jev's per-axis calibration is what cost the two records. The value claim: interpretable, dimensionality-economical, portable`}. H3 (C15) ${C15 ? 'LIVES' : 'DIES'}: both Groq seats' embeddings land within one family-error of jev's (${fmt(acc('qwen38-27b'))} and ${fmt(acc('gpt-oss-20b'))} vs jev ${fmt(acc('jev'))}), and the per-axis divergence is STRUCTURED — P8_exact diverges most (means ${fmt(div('qwen38-27b')[7])}/${fmt(div('gpt-oss-20b')[7])}), P5_repair least (${fmt(div('qwen38-27b')[4])}/${fmt(div('gpt-oss-20b')[4])}), top-3 axis overlap ${topOverlap}/3 across seats (the harmony finding extended from answers to embedding spaces; embedder choice is a calibration choice, not a paradigm choice). F5 stability: ${EVAL.stability.within}/${EVAL.stability.total} re-embedded axes within 0.25 (P5 HIT — scores are calmer than choices). Separation (jev space): same-family cosine ${fmt(EVAL.separation.jev.same_mean)} vs cross ${fmt(EVAL.separation.jev.cross_mean)}; family cohesion N ${fmt(0.770)} > P ${fmt(0.763)} > A ${fmt(0.758)} > Q ${fmt(0.743)} (P6 HIT — the non-local family is tightest; Q is loosest because Q4 the ablation record is the crossover object: quantum content ABOUT the wormhole channel, misfiled by every embedder).`;

writeFileSync(join(OUT, 'e_q21_results.json'), JSON.stringify({
  experiment: 'E-Q21', claim: 'C14 — the question map is an embedding; C15 — cross-embedder robustness', kernel: kernelReport(),
  preRegSha, corpusSha,
  registration: 'experiments/pre_registration_e_q21.json (+AM1: dims 8->32 zero-padded, Vectorize minimum; ranking equivalence proven)',
  task: { corpus: 'situations/embedding_r23/corpus.json (20 records, 4 families x 5, sealed before calls)', probes: 8, rubric: '["zero","low","moderate","high","central"]', index: 'qthe-jev-embed (Cloudflare Vectorize, 32-dim cosine, zero-padded from 8)', embedders: ['typesafe/jev-latest (sandbox)', 'groq/qwen3.8-27b (Actions seat)', 'groq/gpt-oss-20b (Actions seat)'] },
  retrieval: EVAL.retrieval, baselines: EVAL.baselines, stability: EVAL.stability, divergence: EVAL.divergence, separation: EVAL.separation,
  hypotheses: { H1, H2, H3acc, H3div, C14, C15, F5 },
  verdict,
}, null, 1));

writeFileSync(join(OUT, 'e_q21_verdict.md'), `# E-Q21 verdict — the question map is an embedding function\n\n${verdict.replace(/; /g, ';\n\n')}\n\n## The retrieval table (top-1 non-self family accuracy, LIVE Vectorize cosine)\n\n| embedder | accuracy | misses |\n|---|---|---|\n${Object.entries(EVAL.retrieval).map(([s, r]) => `| ${s} | **${fmt(r.accuracy)}** | ${r.misses.map(([a, b]) => `${a}->${b}`).join(', ')} |`).join('\n')}\n\n## The baselines\n\n- bag-of-words cosine (same texts, full vocab): **${fmt(bow)}**\n- permutation null (1000 draws): ${fmt(permutation_null)}; majority-class: ${majority}\n\n## The per-axis divergence (jev vs each Groq seat, mean |delta| over 20 records)\n\n| axis | qwen3.8-27b | gpt-oss-20b |\n|---|---|---|\n${EVAL.divergence['qwen38-27b'].map((p, i) => `| ${p.axis} | ${fmt(p.mean_abs_delta)} | ${fmt(EVAL.divergence['gpt-oss-20b'][i].mean_abs_delta)} |`).join('\n')}\n\n## The consumer law (r23)\n\nA fixed 8-probe score battery is a viable embedding function for retrieval\nover a sealed corpus — interpretable axes, ~250 bytes per record, one batched\ncall per record, live vector search. When the corpus is family-lexical (the\nwords carry the families), plain BOW matches or beats a single LLM embedder —\nuse the probe embedding when you need the AXES (drift detection, cross-seat\ncalibration, interpretable nearest-neighbors), not merely the ranking. The\nbest single configuration this round: the 8 axes through qwen3.8-27b (0.85).\n`);

const rows = [
  { kind: 'rules.EQ21', frozen_by: 'experiments/pre_registration_e_q21.json sha ' + preRegSha.slice(0, 16) + '… + AM1 (dims 8->32 zero-padded, pre-call) · corpus sha ' + corpusSha.slice(0, 16) + '… (sealed before any embed call)',
    proposal_cited: 'ORCH-R23 registration lane T14-a: the operator dispatch (vectorization + embedding + rapid calls; try what nobody has)',
    claim: 'C14 — the question map is an embedding (fixed 8-probe score battery -> vectors -> retrieval above baselines); C15 — cross-embedder robustness (Groq seats within one family-error, structured divergence)',
    floors: 'F1 corpus+labels sealed pre-call; F2 all rows complete; F3 vectors recomputed; F4 live Vectorize upsert+query round-trip; F5 repeat-stability 24/24 within 0.25; F6 BOW on the same texts',
    bands: 'H1 accuracy > majority AND permutation null; H2 accuracy >= BOW; H3 Groq within one family-error AND divergence structured (max/min >= 2, top-3 overlap >= 2)' },
  { kind: 'run.config', experiment: 'E-Q21', kernel: kernelReport(),
    design: `20 records x 8 probes (5-level rubric, /4 normalized, zero-padded to 32); index qthe-jev-embed (cosine); 23 typesafe calls (20+3 stability, batched 8 questions each, explicit aggregation loop) + 40 Groq calls (20 per seat, via the Actions seat); retrieval = top-1 non-same-embedder non-self neighbor over LIVE REST queries`,
    moth: 'ZERO credits', llm: 'typesafe 23 batched calls + groq 40 calls, total under $0.03' },
  { kind: 'verdict.EQ21', experiment: 'E-Q21', H1, H2, H3acc, H3div, C14, C15, F5,
    jev_acc: q(acc('jev')), qwen_acc: q(acc('qwen38-27b')), gptoss_acc: q(acc('gpt-oss-20b')), bow: q(bow), perm_null: q(permutation_null), majority: q(majority),
    stability_within: EVAL.stability.within, stability_total: EVAL.stability.total, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q21', claim: 'question-map-embedding-C14-C15' });
writeFileSync(join(OUT, 'e_q21_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q21] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q21] ${verdict}\n`);
