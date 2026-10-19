// experiments/e_q41_seal.mjs — E-Q41 seal (ORCH-R30/T21-b): the
// cross-corpus transfer. C39 DIES on H1 — the quantization ladder does
// not transfer to 60 records (the ternary zero's +0.20 margin at n=20 is
// gone; point estimate inverted at -0.05, inside the tie-degeneracy
// brackets). What lives: H3 (the 4-level code is lossless in count vs
// dense at 60 records — 0.733 == 0.7333, tie-free), the perfect dense
// re-read replication (delta 0.0000), and the tie-degeneracy mechanism
// (the autopsy row): coarse codes' strict accuracies are tie-order-
// dependent; local==live iff tie-free.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r30', 'eq41_results.json'), 'utf8'));
const AUT = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r30', 'eq41_autopsy.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q41.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q41_chain.jsonl');

const H = A.hypotheses;
const H1 = H.H1_ladder, H2 = H.H2_zeros_worth, H3 = H.H3_practical_bound, C39 = H.C39;
const P = A.predictions;
const arms = A.arms;

const verdict = `E-Q41 VERDICT (the cross-corpus transfer — the E-Q27 quantization laws re-run at 60 records on the eq36N substrate's OWN sealed vectors, ZERO typesafe calls, 180 upserts + 240 arm-filtered live queries, the recipe rule-identical with n=60 percentile indices): C39 ${C39 ? 'LIVES' : 'DIES'} on H1 — THE QUANTIZATION LADDER DOES NOT TRANSFER, and the ternary zero's worth joins the family algebra as the SECOND SMALL-CORPUS ARTIFACT of the program. H1 DIES: binary ${q(Math.round(arms.binary.live * 1000) / 1000)} > ternary ${q(Math.round(arms.ternary.live * 1000) / 1000)} (the n=20 ladder was 0.40 < 0.60 < 0.70 — the first rung INVERTS at 3x scale) while quad ${q(Math.round(arms.quad.live * 1000) / 1000)} stays on top. H2 DIES (the zero's margin: ${q(Math.round(A.margins.ternary_minus_binary * 1000) / 1000)} vs the registered >= 0.10; at n=20 it was +0.20). H3 LIVES DECISIVELY: THE 4-LEVEL CODE IS NOW LOSSLESS IN COUNT — quad ${q(Math.round(arms.quad.live * 1000) / 1000)} == the same-session dense re-read ${q(Math.round(A.dense_reference.live * 10000) / 10000)} (at n=20 the 4-level sat 0.10 below dense; at 60 records the 16-bit code loses NOTHING in count, though the miss SETS reshuffle — only 2/16 shared with dense's). THE MECHANISM (the autopsy row): the coarse codes are TIE-DEGENERATE at this scale — binary has a top-1 score tie on 32/60 records (adversarial bracket [0.467, 0.733]), ternary on 15/60 ([0.533, 0.633]), quad on 0/60 (bracket degenerate at [0.733, 0.733] — convention-free); the live readings sit inside their brackets, the local-vs-live disagreements (P4 DIES) live exactly on the tie-degenerate arms and vanish on the tie-free arm — the E-Q30 local==live law refines to: LOCAL==LIVE IFF TIE-FREE AT THE OPERATING SCALE. Two candidate mechanisms for the inversion are tested and FALSIFIED in the autopsy: mean separation (ternary 0.312 BEATS binary 0.226 while losing the strict accuracy — mean separation is not the top-1 operator) and zeroed-axes load (1.9 vs 2.0 vs 1.7 — no material difference). The receipts that scale: the dense arm re-read replicated the sealed E-Q36 reading EXACTLY (0.7333, delta 0.0000, F4 PASS — the live index is a stable executor across sessions); the ternary zero-level mass 0.2125 sits in the predicted [0.15, 0.35] (n=20: 0.2375 — a distribution property, scale-stable); every arm >= 2.4x the 14/59 majority floor. PREDICTIONS: P1 HIT, P2 HIT (the perfect replication), P3 HIT, P4 MISS (the tie mechanism — the prediction assumed tie-free codes at 60 records). The operative summary for the code designer: at 16 bits/record the 4-LEVEL code is the scale-robust choice (tie-free, count-lossless, miss-set-fluid); the ternary zero is a 20-record luxury; ANY strict-accuracy claim on a coarse code must report its tie bracket or a tie-breaking convention.`;

writeFileSync(join(OUT, 'e_q41_results.json'), JSON.stringify({
  experiment: 'E-Q41', claim: 'C39 — the quantization laws transfer (ladder + practical bound)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q41.json (no amendments — the run matched the registration exactly)',
  task: { typesafe_calls: 0, upserts: 180, live_queries: 240, arms: ['eq41B60', 'eq41T60', 'eq41Q60', 'eq36N re-read'], models_served: 'jev-1.13.0 (the sealed eq36 rows; zero new calls)' },
  arms: { binary: { live: arms.binary.live, local: arms.binary.local, local_equals_live: arms.binary.local_equals_live },
          ternary: { live: arms.ternary.live, local: arms.ternary.local, local_equals_live: arms.ternary.local_equals_live },
          quad: { live: arms.quad.live, local: arms.quad.local, local_equals_live: arms.quad.local_equals_live } },
  dense_reference: A.dense_reference, zero_mass: A.zero_mass, majority_floor: A.majority_floor,
  margins: A.margins, miss_counts: { binary: arms.binary.live_misses.length, ternary: arms.ternary.live_misses.length, quad: arms.quad.live_misses.length },
  mechanism_autopsy: { source: 'situations/embedding_r30/eq41_autopsy.py (zero calls — arithmetic on the sealed artifacts)',
    tie_table: AUT.tie_table, separation: AUT.separation, miss_overlaps: AUT.miss_overlaps, zeroed_axes: AUT.zeroed_axes, the_finding: AUT.the_finding },
  hypotheses: { H1_ladder: H1, H2_zeros_worth: H2, H3_practical_bound: H3, C39 },
  predictions: P,
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ41', frozen_by: 'experiments/pre_registration_e_q41.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R30 lane T21-b — the r28 close-out registration: the cross-corpus transfer question (the ternary code at 60 records)',
    claim: 'C39 — the E-Q27 quantization laws hold at 60 records on the eq36N substrate (ladder transfers AND the 4-level practical bound)',
    floors: 'F1 sealed eq36 rows only, zero typesafe calls; F2 recipe rule-identical to E-Q27 (n=60 type-2 quantile indices, no re-tuning); F3 arm-filtered live queries, poll-until-visible, NO-NEIGHBOR strict; F4 the dense re-read must replicate the sealed 0.7333 within one record (fail-loud); F5 the 14/59 majority floor stated',
    bands: 'H1 binary < ternary AND ternary < quad strictly; H2 ternary-binary >= 0.10; H3 dense-quad <= 0.15; C39 = H1 AND H3' },
  { kind: 'run.config', experiment: 'E-Q41', kernel: kernelReport(),
    design: 'quantize the 60 sealed eq36 vectors (binary/ternary/quad), upsert three arms, poll-until-visible, strict NO-NEIGHBOR arm-filtered live scoring + a fresh dense re-read of eq36N as the same-session reference',
    moth: 'ZERO credits', llm: 'ZERO typesafe calls (the E-Q26/E-Q27 zero-embed-call pattern); 180 upserts + ~240 queries on the standing CF index' },
  { kind: 'verdict.EQ41', experiment: 'E-Q41', H1, H2, H3, C39,
    binary: q(Math.round(arms.binary.live * 1000) / 1000), ternary: q(Math.round(arms.ternary.live * 1000) / 1000),
    quad: q(Math.round(arms.quad.live * 1000) / 1000), dense: q(Math.round(A.dense_reference.live * 10000) / 10000),
    zeros_margin: q(Math.round(A.margins.ternary_minus_binary * 1000) / 1000),
    practical_loss: q(Math.round(A.margins.dense_minus_quad * 10000) / 10000),
    zero_mass: q(A.zero_mass), dense_replication_delta: q(A.dense_reference.replication_delta),
    verdict },
  { kind: 'mechanism.autopsy', experiment: 'E-Q41',
    note: 'THE TIE-DEGENERACY MECHANISM: binary top-1 ties 32/60 (bracket [0.467, 0.733]); ternary 15/60 ([0.533, 0.633]); quad 0/60 (degenerate [0.733, 0.733]); local!=live exactly on the tie-degenerate arms — local==live IFF tie-free; mean-separation and zeroed-axes accounts both FALSIFIED; the 4-level code is tie-free, count-lossless (2/16 shared misses with dense), and the dense arm replicated exactly across sessions (delta 0.0000)',
    tie_table: JSON.stringify(AUT.tie_table), separation: JSON.stringify(AUT.separation) },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q41', claim: 'transfer-C39' });
writeFileSync(join(OUT, 'e_q41_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q41] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q41] H1=${H1} H2=${H2} H3=${H3} C39=${C39}`);
console.log(`[e-q41] ${verdict}\n`);
