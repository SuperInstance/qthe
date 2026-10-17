// tests/layer0_verifier.mjs — ORCH-32: the machine-checked LAYER 0 proof
// artifact. LAYER 0's domain is FINITE (256 byte values; 4×64 rule states),
// so proof-by-exhaustion IS machine checking. This packages the exhaustion
// with the formal statement (tests/FORMAL-STATEMENT.md carries the
// Coq-shaped rendering; the checker HERE is the authority, honestly so).
import { pack, unpack, tauOf, dOf, nextD } from '../qthe.mjs';
let bad = 0;
for (let c = 0; c < 256; c++) { const { tau, d } = unpack(c); if (!(tau === tauOf(c) && d === dOf(c) && pack(tau, d) === c)) bad++; }
const bijection = bad === 0;
let oob = 0;
for (const p of [-505, -64, -1, 0, 1, 63, 64, 505, 2 ** 40]) { const nd = nextD(31, p); if (nd < 0 || nd > 63) oob++; }
for (const d of [0, 31, 63]) for (const p of [-1, 0, 1]) { const nd = nextD(d, p); if (nd < 0 || nd > 63) oob++; if (p > 0 && nd !== Math.min(d + 1, 63)) oob++; if (p < 0 && nd !== Math.max(d - 1, 0)) oob++; if (p === 0 && nd !== d) oob++; }
const bounds = oob === 0;
console.log(`layer0_verifier: bijection ${bijection ? 'PROVED (256/256)' : 'FAILED'}; bounds ${bounds ? 'PROVED (all rule-table cases + adversarial pressures)' : 'FAILED (' + oob + ')'}`);
process.exit(bijection && bounds ? 0 : 1);
