// experiments/e_q40_seal.mjs — E-Q40 seal (ORCH-R30/T21-a): the
// lexical-sensitivity census. C38 DIES — and the death is the census's
// finding: the sensitivity is BROAD AND SHALLOW, not concentrated and
// echo-driven. What lives: the band-respecting majority, the identifier
// floor, shape survival, the P8_exact third-instrument convergence, and
// the anti-echo receipt (the word 'record', present in every question
// text, moves 0.02 when removed from the state).
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r30', 'eq40_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q40.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q40_chain.jsonl');

// the registered semantics (AM5 grid-quantized, all recomputed by the analysis)
const H = A.hypotheses;
const H1 = H.H1_few_words, H2 = H.H2_echo, H3 = H.H3_pos_gradient, C38 = H.C38;
const P = A.predictions;

const verdict = `E-Q40 VERDICT (the lexical-sensitivity census — 120 single-word near-synonym substitutions over the sealed E-Q21 20-record corpus, one batched 12-question call each, the byte-identical E-Q25 map, all 124 calls jev-1.13.0, the flip canary NEGATIVE): C38 ${C38 ? 'LIVES' : 'DIES'} — and the death is the round's finding: THE LEXICAL SENSITIVITY IS BROAD AND SHALLOW, NOT CONCENTRATED AND ECHO-DRIVEN. H1 ${H1 ? 'LIVES' : 'DIES'}: the rate half lives (11/120 = 9.2% breach the 0.10 band — a minority of words) but the concentration half dies (the top 20% of words carry ${q(Math.round(A.concentration.top20_share * 1000) / 10)}% of movement mass, under the registered 50% — the mass is diffuse, 2.27x uniform, not the predicted 2.5x+). H2 ${H2 ? 'LIVES' : 'DIES'} DECISIVELY: THE ECHO LAW IS FALSE — words that lexically overlap the question-map text breach at 13.0% (3/23) versus 8.2% (8/97) for non-echo words (ratio 1.58x < 2x) and the class medians are IDENTICAL at ${q(A.echo.echo_median)}; the strongest possible bridge — the word 'record', present in every one of the 12 question texts — moves ${q(0.02)} when removed from the state. THE READOUT IS NOT A KEYWORD MATCHER: it reads the record's whole lexical fabric. H3 ${H3 ? 'LIVES' : 'DIES'} at the instrument's resolution (AM5): NOUN and VERB medians are both exactly ${q(0.05)} on the API's 2-decimal grid (the first unsealed run showed a spurious 8e-17 NOUN>VERB ordering — killed, not stretched); the receipt is TWO-TIER: content words ${q(0.05)} > identifiers ${q(0.03)}. WHAT LIVES: P1 (max single-word movement ${q(A.movement.max)} = 2.5x the band — one state word alone carries T1-scale mass); P2 (P8_exact the most-moved axis at mean ${q(Math.round(A.axis_mean_movement.P8_exact * 10000) / 10000)} — the THIRD independent instrument converging on the exactness axis as the noisiest seat); P3 (decoy floor ${q(A.decoy_floor.mean)} over 480 readings — canary immunity extends to state-side word swaps); P4 (median shape Spearman ${q(Math.round(A.shape.median_spearman * 10000) / 10000)} — the profile shape survives single-word swaps better than T1's question-side rewording); P5 (IDENT the lowest median — identifiers are the floor; swapping experiment ids barely registers). P6 DIES (0/3 echo breaches landed on the word's echo axes — movement is NOT axis-targeted at the swapped word's semantic home; the breaches' argmax axes track the SUBSTITUTE's field at least as often: rebalancing->P4_alloc, check-tier->P8_exact, linkage->P1_nonlocal). The anchors: 0.02-0.03 vs the sealed r28 baseline — the drift band holds a FIFTH reading (the tightest yet). The mechanism receipt for the T1 decomposition: the question-side synonym mass was never 'a few load-bearing words' — it is the diffuse sum of many small state-side contributions, each individually mostly sub-band, with a shallow tail of 0.11-0.25 movers.`;

writeFileSync(join(OUT, 'e_q40_results.json'), JSON.stringify({
  experiment: 'E-Q40', claim: 'C38 — the lexical census law (concentrated, echo-driven mass)', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q40.json (amendments AM1-AM5, all pre-verdict, receipted in-file)',
  task: { calls: 125, substitutions: 120, anchors: 4, canary: 1, questions_per_call: 12, model_served: 'jev-1.13.0 (all calls)' },
  movement: A.movement, concentration: A.concentration, echo: A.echo, pos: A.pos,
  targeting: A.targeting, decoy_floor: A.decoy_floor, shape: A.shape,
  axis_mean_movement: A.axis_mean_movement, most_moved_axis: A.most_moved_axis,
  per_family_mean: A.per_family_mean, secondary_vs_r24: A.secondary_vs_r24,
  anchors: A.anchors, F4_anchor_band: A.F4_anchor_band,
  hypotheses: { H1_few_words: H1, H1_rate: H.H1_rate, H1_concentration: H.H1_concentration,
                H2_echo: H2, H2_rate: H.H2_rate, H2_count: H.H2_count,
                H3_pos_gradient: H3, C38 },
  predictions: P,
  top_movers: A.top_movers,
  verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ40', frozen_by: 'experiments/pre_registration_e_q40.json sha ' + preRegSha.slice(0, 16) + '… (AM1-AM5 pre-verdict amendments)',
    proposal_cited: 'ORCH-R30 lane T21-a — the r28 close-out registration: the lexical-sensitivity census (which content words carry the mass)',
    claim: 'C38 — state-side noul mass is carried by a concentrated minority of question-echoing content words',
    floors: 'F1 the map byte-identical to E-Q25 (sha asserted); F2 states differ only at the sampled word occurrences (inverse-exact, pre-flight caught 4 application defects AM1-AM4 before any spend); F3 one batched call per (record,word), 12 answers, model_served per call; F4 the 4 anchors within band; F5 sealed r24/r28 baselines only; F6 the word map frozen at registration',
    bands: 'H1 breach rate < 30% AND top-20% share >= 50%; H2 echo rate >= 2x non-echo AND >= 3 echo breaches; H3 strict median ordering NOUN > VERB > IDENT; C38 = H1 AND H2' },
  { kind: 'run.config', experiment: 'E-Q40', kernel: kernelReport(),
    design: 'the census: 120 single-word near-synonym substitutions (TF-IDF top-6 per record, the frozen salience rule) + 4 anchors; movement vs the sealed r28 baseline (primary) and r24 (secondary); AM5 grid quantization before every comparison',
    moth: 'ZERO credits', llm: '125 typesafe calls (120 + 4 anchors + 1 flip canary), all jev-1.13.0' },
  { kind: 'verdict.EQ40', experiment: 'E-Q40', H1, H2, H3, C38,
    breaches: `${A.movement.breaches}/120`, breach_rate: q(Math.round(A.movement.breach_rate * 1000) / 1000),
    top20_share: q(Math.round(A.concentration.top20_share * 1000) / 1000),
    echo_rate: q(Math.round(A.echo.echo_breach_rate * 1000) / 1000),
    nonecho_rate: q(Math.round(A.echo.nonecho_breach_rate * 1000) / 1000),
    max_movement: q(A.movement.max), median_movement: q(A.movement.median),
    pos_medians: JSON.stringify(A.pos.medians),
    model_served: 'jev-1.13.0', verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q40', claim: 'lexical-census-C38' });
writeFileSync(join(OUT, 'e_q40_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q40] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q40] H1=${H1} H2=${H2} H3=${H3} C38=${C38}`);
console.log(`[e-q40] ${verdict}\n`);
