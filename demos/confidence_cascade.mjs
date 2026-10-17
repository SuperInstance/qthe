// demos/confidence_cascade.mjs — ORCH-14: a deterministic CONFIDENCE
// CASCADE built on the split channels (roadmap phase 14). The primitive:
//   · evidence enters as Attract(+d·x) / Repel(−d·x) weights — the REAL
//     channel carries signed support;
//   · Abstain(3) weights carry +d·x into the IMAGINARY channel — evidence
//     the model declines to sign, i.e. uncertainty mass;
//   · a decision FIRES when re ≥ θ (enough signed support) AND im ≤ φ
//     (uncertainty under control); abstain-heavy decisions stay OPEN;
//   · fired decisions GROUND their evidence (tau 1|2 -> 0, d kept): decided
//     questions stop voting — the cascade. Deterministic: integers only,
//     no floats, no randomness; every round is a vectorPass + a rule.
// No claim is made here (the split channels are LAYER 0 facts; the cascade
// is an application). Baseline priced honestly beside it: a sign-only
// threshold (the "softmax-free linear probe") that cannot see im at all.
import { pack, vectorPass, TAU } from '../qthe.mjs';

// A decision problem: 6 questions, 8 evidence items each (integer x in [-9,9]).
// Weights are QTHE bytes: tau = the evidence's stance toward the question.
const QUESTIONS = ['route-A', 'route-B', 'battery', 'surface', 'handoff', 'report'];
const EVIDENCE_STANCE = [ // per question: stance of evidence item k (1=for, 2=against, 3=abstain, 0=irrelevant)
  [1, 1, 3, 2, 1, 0, 3, 1],   // route-A: strong-for with two abstains
  [2, 3, 0, 2, 2, 1, 0, 2],   // route-B: leaning-against
  [1, 1, 1, 2, 0, 3, 0, 0],   // battery: for, mild abstain
  [3, 3, 3, 3, 3, 3, 3, 3],   // surface: ALL abstain (sensor dark) — must stay open
  [1, 0, 0, 0, 2, 0, 0, 1],   // handoff: thin evidence
  [0, 0, 0, 0, 0, 0, 0, 1],   // report: nearly empty
];
const D_WEIGHT = [5, 4, 6, 3, 5, 4, 6, 5]; // evidence reliability as amplitude d
const XS = [7, -3, 5, 6, -2, 4, 8, -6];    // evidence values (signed integers)

function cascade(theta, phi, rounds) {
  const stance = EVIDENCE_STANCE.map((row) => [...row]);
  const history = [];
  for (let r = 0; r < rounds; r++) {
    const weights = stance.map((row) => row.map((tau, k) => pack(tau, D_WEIGHT[k])));
    const out = vectorPass(weights, XS);
    const fired = [];
    for (let j = 0; j < out.length; j++) {
      const { re, im } = out[j];
      if (re >= theta && im <= phi) fired.push(j);
    }
    history.push({ round: r, channels: out.map((o) => ({ re: o.re, im: o.im })), fired });
    for (const j of fired) for (let k = 0; k < stance[j].length; k++) {
      if (stance[j][k] === TAU.ATTRACT || stance[j][k] === TAU.REPEL) stance[j][k] = TAU.GROUND; // decided: stop voting
    }
    if (fired.length === 0) break;
  }
  return history;
}

// thresholds read off round-0 channels for DEMONSTRATION (a real deployment
// pre-registers them before any evidence is seen — that discipline is the point)
const hist = cascade(15, 20, 5);
console.log('── CONFIDENCE CASCADE · split-channel decisions (theta=15, phi=20 — read off round-0, demo-not-claim) ──');
for (const h of hist) {
  console.log(`round ${h.round}: ` + h.channels.map((c, j) =>
    `${QUESTIONS[j]}[re ${String(c.re).padStart(3)} im ${String(c.im).padStart(3)}]`).join(' '));
  console.log(`  fired: ${h.fired.length ? h.fired.map((j) => QUESTIONS[j]).join(', ') : '(none — cascade settled)'}`);
}
const open = QUESTIONS.filter((q, j) => !hist.some((h) => h.fired.includes(j)));
console.log(`\nsettled: ${QUESTIONS.filter((q, j) => hist.some((h) => h.fired.includes(j))).join(', ') || 'none'}`);
console.log(`stayed open (honest): ${open.join(', ')}`);
console.log('note: "surface" (all-Abstain evidence) rides the imaginary channel — re 0 / im 95: no signed support, ALL uncertainty;');

// Baseline: sign-only threshold (cannot see im)
const weightsOnce = EVIDENCE_STANCE.map((row) => row.map((tau, k) => pack(tau, D_WEIGHT[k])));
const out1 = vectorPass(weightsOnce, XS);
const baselineFired = out1.map((o, j) => ({ q: QUESTIONS[j], re: o.re, im: o.im }))
  .filter((o) => o.re >= 20).map((o) => o.q);
console.log(`\nbaseline (sign-only threshold, no im): fires ${baselineFired.join(', ') || 'nothing'} — it cannot distinguish "strong support, low uncertainty" from "support riding on abstention"`);
console.log('the cascade differences: (1) uncertainty is a first-class gate (im <= phi), (2) decided evidence grounds out, so later rounds re-price only what remains — deterministic, integer-exact, fully auditable per round.');
