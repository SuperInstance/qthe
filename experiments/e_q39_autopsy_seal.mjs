// experiments/e_q39_autopsy_seal.mjs — append the mechanism row to the sealed
// e_q39 chain (append-only; the verdict row stands unchanged) + curate the
// outputs' mechanism section. The autopsy: ALL pairs straddle regions;
// local events 0% partner (weather occupants); escalated 13.4% partner
// (better than flat's 7.25% live-read, but only 22% of event volume).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendAndVerify, q } from './_harness.mjs';
import { linkStone } from './_stone_link.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CHAIN = join(ROOT, 'receipts', 'e_q39_chain.jsonl');
const OUT = join(ROOT, 'experiments', 'outputs');

const res = JSON.parse(readFileSync(join(OUT, 'e_q39_results.json'), 'utf8'));
res.mechanism_autopsy = {
  source: 'experiments/e_q39_autopsy.mjs (post-seal diagnosis, seed 77001, t=1..60, clean)',
  geometry: 'ALL 8 twin pairs STRADDLE regions (members >= 24 apart toroidal-Chebyshev vs regions of 32x16 — the geometry forces it at this grid)',
  events: 'pair-cell events: local 544, escalated 157 (the local channel is 77.6% of the event volume)',
  attribution: 'local events 0.0% partner (same-region weather-Abstain occupants — the partner writes a FOREIGN region); escalated events 13.4% partner (the one-shot stale escalation beats flat\'s 7.25% live-read partner rate but carries only a fifth of the volume)',
  the_finding: 'THE REGION IS THE KILLER, NOT THE FOLD: the cargo-exact slot (s=d) fixes the escalation channel the fold collapsed (fold escalated-partner 0.0% at drift; split 13.4% at clean) but cannot fix the local channel, which reads same-region weather noise for every straddled pair in BOTH designs. The C9 autopsy attributed the hierarchical death to cross-cargo aliasing (d&7); E-Q39 falsifies that attribution as the ROOT cause — the fold was a complication, the regional partition itself (vs straddled-pair geometry + the stale one-shot escalation) is the disease. Region-splitting at ANY slot width loses to flat at provenance because flat\'s live-read gives every reader direct same-tick access to the partner\'s write.',
  scalars: { split_clean_prov: '0.0087', fold_clean_prov: '0.0066 (E-Q18 sealed)', flat_clean_provDirect: '0.0725 (E-Q17 sealed, F-CAL reproduced)' },
};
res.hypotheses_with_predictions = {
  H1_no_regression: { lives: false, levelsWorse: 2, breaches: 'clean -0.064, nPoll16 -0.038 (bound -0.02)' },
  H2_delivery: { lives: true, detail: '8/8 at every level — the escalation channel is addressing-robust in both designs' },
  H3_clean_parity: { lives: false, detail: 'split clean 0.0087 vs flat 0.0725 — outside [flat-0.02, flat+0.10]' },
  C37: { lives: false, rule: 'LIVES iff H1 AND H2 — DIES on H1 (two levels breach the no-regression bound)' },
  predictions: {
    P1: 'MISS (split is BELOW flat at 3 levels — the tracking prediction assumed the fold was the failure mode)',
    P2: 'HIT (escalated fraction 0.15 at clean vs the fold\'s 0.0% collapse — the cargo-exact slot does fix escalation)',
    P3: 'HIT (writes per occupied slot 14.5 vs flat 114.3 at nPoll=16 — the 512-slot namespace absorbs population; ratio 0.127)',
    P4: 'CHECK-DELIVERED (8/8 everywhere; first-delivery medians in aggregates)',
    P5: 'MISS (no level with split ahead by > 0.05)',
  },
};
writeFileSync(join(OUT, 'e_q39_results.json'), JSON.stringify(res, null, 2));

const rows = [
  { kind: 'mechanism.autopsy', experiment: 'E-Q39',
    note: 'post-seal diagnosis (seed 77001, t=1..60, clean): ALL pairs straddle regions; local 544 events 0.0% partner; escalated 157 events 13.4% partner; THE REGION IS THE KILLER NOT THE FOLD — the cargo-exact slot fixes the escalation the fold collapsed but the local channel reads same-region weather noise for straddled pairs in both designs; the C9 cross-cargo-aliasing attribution falsified as the ROOT cause',
    split_clean: '0.0087', fold_clean: '0.0066', flat_clean_direct: '0.0725' },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q39' });
writeFileSync(join(OUT, 'e_q39_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q39] autopsy row appended: links=${v.links} tip=${v.tip.slice(0, 16)}…`);
