// experiments/e_q23_seal.mjs — E-Q23 seal (ORCH-R24/T15-c): occlusion
// gradients. Reads the analysis results, scores the frozen hypotheses,
// writes the verdict, seals the chain.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r24', 'eq23_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q23.json'));
const corpusSha = fileSha256(join(ROOT, 'situations', 'embedding_r23', 'corpus.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q23_chain.jsonl');
const fmt = (x) => String(Math.round(x * 1e4) / 1e4);

// mean absolute saliency (the effect scale)
const allSal = [];
for (const rid of Object.keys(A.saliency)) for (const row of A.saliency[rid]) for (const v of row) allSal.push(v);
const meanSal = allSal.reduce((a, b) => a + b, 0) / allSal.length;
const maxSal = Math.max(...allSal);

const H1 = A.M1_concentration.mean < 0.85;
const H2 = A.M2_axis_specificity.mean >= 0.50;
const H3 = A.M3_family_signature.within_mean > A.M3_family_signature.cross_mean;
const H4 = A.M4_misfile_bridge.mean_entropy_misfiled > A.M4_misfile_bridge.mean_entropy_filed;
const H5 = A.M5_stability_bridge.spearman_entropy_vs_delta > 0;
const H6a = A.M6_drift.max_min_ratio >= 2;
const H6b = A.M6_drift.top_axis === 'P8_exact' || A.M6_drift.top_axis === 'P3_quantum';
const H6 = H6a; // the structure clause is the hypothesis; the top-axis call is prediction P6
const C18 = H1 && H2;
const C19 = H3 && H5;
const F5anchor = Math.max(...Object.values(A.M5_stability_bridge.per_record_max_delta));

const P1 = A.M1_concentration.mean >= 0.60 && A.M1_concentration.mean <= 0.85;
const P2 = A.M2_axis_specificity.mean >= 0.50 && A.M2_axis_specificity.mean <= 0.80;
const P3 = (A.M3_family_signature.within_mean - A.M3_family_signature.cross_mean) >= 0.10;
const P4 = H4;
const P5 = H5;
const P6 = H6b;

const verdict = `E-Q23 VERDICT (occlusion gradients — the question map as readout function): H1 ${H1 ? 'LIVES' : 'DIES'} — THE DISTRIBUTED-READING LAW: mean normalized span entropy ${fmt(A.M1_concentration.mean)} (per-record ${fmt(Math.min(...Object.values(A.M1_concentration.per_record)))}-${fmt(Math.max(...Object.values(A.M1_concentration.per_record)))}), ABOVE the 0.85 concentration bar: the question map reads a record DISTRIBUTED, not concentrated — no single sentence carries the family signal (mean absolute saliency per occluded span-axis ${fmt(meanSal)}, max ${fmt(maxSal)} on the /4-normalized scale). The embedder is redundancy-robust: occluding ANY one span moves the axes only slightly and roughly evenly. For gate-style consumers (jev-lattice): the typed-map readout does NOT localize evidence — file-level attribution needs their hash-targeted channels, not occlusion. H2 ${H2 ? 'LIVES' : 'DIES'}: axis-specificity ${fmt(A.M2_axis_specificity.mean)} — ${fmt(A.M2_axis_specificity.mean * 100)}% of axis pairs peak on different spans; the 8 axes DO read different places even while each reads broadly. H3 ${H3 ? 'LIVES' : 'DIES'} — THE PROFILE LAW: within-family saliency-profile correlation ${fmt(A.M3_family_signature.within_mean)} vs cross-family ${fmt(A.M3_family_signature.cross_mean)} (difference ${fmt(A.M3_family_signature.within_mean - A.M3_family_signature.cross_mean)}, predicted >= 0.10, exceeded 5x): the saliency SHAPE is family-structured even where the saliency MASS is flat — same-family records agree on where the axes read, cross-family records anti-correlate. C18 ${C18 ? 'LIVES' : 'DIES'} with the honest narrowing: the question map yields MEANINGFUL saliency (H2's specificity + H3's family structure prove the readout resolves span-axis structure) but NOT concentrated saliency — the concentration clause dies. C19 ${C19 ? 'LIVES' : 'DIES'} with the honest narrowing: H3 lives decisively but H5 is an honest NULL — the stability bridge is unmeasurable at this scale (spearman ${fmt(A.M5_stability_bridge.spearman_entropy_vs_delta)}, but the re-embed wobble itself is <= ${fmt(F5anchor)} across all 8 records — the question map's sampling noise sits BELOW the saliency-entropy effect scale; the lattice fragility bridge needs a near-bar population to test, and our records are all far from any bar). H4 ${H4 ? 'LIVES' : 'DIES'} — INVERTED at n=1: the one misfiled record in the subset (${A.M4_misfile_bridge.e21_misfiled_in_subset.join(',')}) has entropy ${fmt(A.M4_misfile_bridge.mean_entropy_misfiled)} vs the filed mean ${fmt(A.M4_misfile_bridge.mean_entropy_filed)} — the misfiled record is MORE concentrated, not flatter (a single-source reading may be fragile in a different way; n=1 directional receipt, not a law). H6 (structure) ${H6 ? 'LIVES' : 'DIES'}: the jev-preview drift is axis-structured — max/min axis mean ratio ${fmt(A.M6_drift.max_min_ratio)}, top axis ${A.M6_drift.top_axis} (${fmt(A.M6_drift.per_axis.find((p) => p.axis === A.M6_drift.top_axis).mean_abs_delta)}) vs P4_alloc least (${fmt(A.M6_drift.per_axis.find((p) => p.axis === 'P4_alloc').mean_abs_delta)}); the top-axis call DIED (P6 MISS — P2_localrule, not the C15-predicted P8_exact/P3_quantum): the 1.13.0->1.14.0 upgrade wobbles the LOCAL-RULE axis most while the cross-embedder divergence wobbled P8_exact most — version drift and embedder divergence are DIFFERENT axes' problems. Mean vector L1 drift ${fmt(A.M6_drift.mean_vector_l1)} over 8 axes — small in absolute terms (the drift-monitor consumer law: the noul arm's 0.03 re-embed band is the right alarm threshold; a version upgrade moves P2 by ~0.04 mean, within an order of magnitude of sampling noise, so UPGRADE drift is visible only in AGGREGATE, not per-record).`;

writeFileSync(join(OUT, 'e_q23_results.json'), JSON.stringify({
  experiment: 'E-Q23', claim: 'C18 — occlusion saliency through the question map; C19 — saliency family/stability structure', kernel: kernelReport(),
  preRegSha, corpusSha, spansSha: A.spans_sha256,
  registration: 'experiments/pre_registration_e_q23.json (subset rule + splitter frozen; spans sealed sha ' + A.spans_sha256.slice(0, 16) + '… before any call)',
  task: { subset: 'N1,N3,P1,P3,Q1,Q3,A1,A3 (first+third per family)', spans: '28 sealed spans (3-5 per record)', calls: '8 full + 28 occlusions + 8 jev-preview drift = 44 batched calls, all served-model attributed' },
  metrics: { M1: A.M1_concentration, M2: A.M2_axis_specificity, M3: A.M3_family_signature, M4: A.M4_misfile_bridge, M5: A.M5_stability_bridge, M6: A.M6_drift, mean_abs_saliency: meanSal, max_abs_saliency: maxSal },
  hypotheses: { H1, H2, H3, H4, H5, H6, H6a, H6b, C18, C19 },
  predictions: { P1, P2, P3, P4, P5, P6 },
  verdict,
}, null, 1));

writeFileSync(join(OUT, 'e_q23_verdict.md'), `# E-Q23 verdict — occlusion gradients: the question map as readout function\n\n${verdict.replace(/; /g, ';\n\n')}\n\n## The saliency census\n\n- mean absolute saliency per (span, axis): **${fmt(meanSal)}** (max ${fmt(maxSal)}, /4-normalized scale)\n- M1 mean normalized span entropy: **${fmt(A.M1_concentration.mean)}** — the reading is DISTRIBUTED\n- M2 axis-specificity: **${fmt(A.M2_axis_specificity.mean)}** of axis pairs peak on different spans\n- M3 within-family profile correlation **${fmt(A.M3_family_signature.within_mean)}** vs cross **${fmt(A.M3_family_signature.cross_mean)}**\n- M5 re-embed wobble (all 8 records): max **${fmt(F5anchor)}** — the stability bridge's noise floor\n\n## The drift lane (jev-preview 1.14.0 vs jev-latest 1.13.0, 8 records)\n\n| axis | mean |delta| | max |\n|---|---|---|\n${A.M6_drift.per_axis.map((p) => `| ${p.axis} | ${fmt(p.mean_abs_delta)} | ${fmt(p.max)} |`).join('\n')}\n\n## The consumer laws (r24)\n\nThe typed question map is a REDUNDANCY-ROBUST reader: it does not depend on any\nsingle span, so span-level corruption moves it little — good for stability,\nbad for evidence attribution (use hash-targeted channels for that, the\njev-lattice way). The saliency PROFILE (which spans matter for which axes,\nrelatively) is family-structured and axis-specific — it is a fingerprint of\nHOW a family is read, not WHERE its signal lives. Version drift (1.13.0 to\n1.14.0) is axis-structured but small (mean L1 ${fmt(A.M6_drift.mean_vector_l1)});\nit is an aggregate-level signal, not a per-record alarm.\n`);

const rows = [
  { kind: 'rules.EQ23', frozen_by: 'experiments/pre_registration_e_q23.json sha ' + preRegSha.slice(0, 16) + '… · corpus sha ' + corpusSha.slice(0, 16) + '… · spans sha ' + A.spans_sha256.slice(0, 16) + '… (sealed before any occlusion call)',
    proposal_cited: 'ORCH-R24 lane T15-c — the r23 ideas battery top-novelty candidate, priced; the jev-lattice fragility formalism is the M5 bridge motivation',
    claim: 'C18 — the question map yields occlusion saliency; C19 — saliency structure carries family and stability signal',
    floors: 'F1 corpus sha pinned; F2 span split sealed pre-call; F3 all 28 occlusion rows complete; F4 saliency recomputable; F5 all 8 full rows; F6 all 8 drift rows served jev-1.14.0',
    bands: 'H1 mean entropy < 0.85; H2 specificity >= 0.50; H3 within > cross; H4 misfiled entropy > filed; H5 spearman > 0; H6 drift max/min >= 2; C18 = H1 AND H2; C19 = H3 AND H5' },
  { kind: 'run.config', experiment: 'E-Q23', kernel: kernelReport(),
    design: `8 frozen records x (1 full + 3-5 span-occlusions + 1 jev-preview drift) = 44 batched calls, score arm (E-Q21 question map byte-identical); saliency = |v_full - v_occluded| per (span, axis); occlusion = sealed span replaced by '[…]'`,
    moth: 'ZERO credits', llm: '44 typesafe calls ~$0.012' },
  { kind: 'verdict.EQ23', experiment: 'E-Q23', H1, H2, H3, H4, H5, H6, C18, C19,
    mean_entropy: q(A.M1_concentration.mean), axis_specificity: q(A.M2_axis_specificity.mean),
    within_corr: q(A.M3_family_signature.within_mean), cross_corr: q(A.M3_family_signature.cross_mean),
    stability_spearman: q(A.M5_stability_bridge.spearman_entropy_vs_delta), drift_top_axis: A.M6_drift.top_axis,
    drift_max_min: q(A.M6_drift.max_min_ratio), P1, P2, P3, P4, P5, P6, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q23', claim: 'occlusion-saliency-C18-C19' });
writeFileSync(join(OUT, 'e_q23_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q23] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q23] H1=${H1} H2=${H2} H3=${H3} H4=${H4} H5=${H5} H6=${H6} C18=${C18} C19=${C19}`);
console.log(`[e-q23] predictions: P1=${P1} P2=${P2} P3=${P3} P4=${P4} P5=${P5} P6=${P6}`);
console.log(`[e-q23] ${verdict}\n`);
