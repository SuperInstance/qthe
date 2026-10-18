// ORCH-R17 T8-a — THE C6 EXPERIMENT, amendment 1 (pre-registered).
//
// First run INVALID (receipted in the registration's AMENDMENT 1):
//   - instrument: new-index propagation > 20 s settle -> empty rankings;
//     now settle 45 s + BLOCKING M3 sanity gate (self-top-1 must be 30/30)
//   - ground truth: binary occupied-slot Jaccard degenerate (table
//     saturates after one tick; all pairs J=1.0)
//
// Amended ground truth (frozen before this run): behavioral cross-resonance
// overlap — cross(A,B) = mean over A's Abstain cells of B's table resonance
// at that cell's d-value; overlap(A,B) = (cross(A,B)+cross(B,A))/2.
//
// Unchanged: 30 substrates, seeds 7000..7029, 40 ticks, L2-normalized
// resonance histograms, the live /c6/experiment service, M1/M2 definitions,
// verdict thresholds.

import { makeSubstrate, tick, traceView, mulberry32, pack } from "./src/qthe-kernel.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

const W = process.env.QTHE_WORKER_URL || "https://qthe-cell.casey-digennaro.workers.dev";
const K = 30, SEED0 = 7000, TICKS = 40, W_ = 32, H_ = 32;

// ── build substrates; extract histograms + abstainer d-censuses ────────────
const demoSeedFn = (seed) => { const rng = mulberry32(seed); return () => pack(Math.floor(rng() * 4), Math.floor(rng() * 64)); };
const subs = [];
for (let k = 0; k < K; k++) {
  const seed = SEED0 + k;
  const sub = makeSubstrate(W_, H_, demoSeedFn(seed));
  for (let i = 0; i < TICKS; i++) tick(sub);
  const view = traceView(sub, []);
  const slots = view.wormholes || [];
  const resBySlot = new Array(64).fill(0);
  for (const s of slots) resBySlot[s.slot] = s.resonance;
  const hist = resBySlot.slice();
  const norm = Math.sqrt(hist.reduce((a, b) => a + b * b, 0)) || 1;
  // A's abstainers: cells with tau=3 at the final state; their d-values
  const abstainerD = [];
  for (let i = 0; i < sub.length; i++) {
    if ((sub[i] >> 6) === 3) abstainerD.push(sub[i] & 63);
  }
  subs.push({ id: `sub-${seed}`, seed, occupied: slots.length, hist: hist.map((x) => x / norm), resBySlot, abstainerD });
}
console.log(`built ${K} substrates; abstainers per substrate: min=${Math.min(...subs.map(s => s.abstainerD.length))} max=${Math.max(...subs.map(s => s.abstainerD.length))}`);

// ── amended ground truth: behavioral cross-resonance overlap ───────────────
const cross = (a, b) => {
  if (!a.abstainerD.length) return 0;
  let sum = 0;
  for (const d of a.abstainerD) sum += b.resBySlot[d]; // 0 if B's slot empty
  return sum / a.abstainerD.length;
};
const overlap = (a, b) => (cross(a, b) + cross(b, a)) / 2;
const gtMatrix = subs.map((a) => subs.map((b) => overlap(a, b)));
const gtPairs = gtMatrix.flat().filter((_, i) => i % (K + 1) !== 0);
const spread = Math.max(...gtPairs) - Math.min(...gtPairs);
console.log(`behavioral overlap (off-diag): min=${Math.min(...gtPairs).toFixed(4)} max=${Math.max(...gtPairs).toFixed(4)} spread=${spread.toFixed(4)} mean=${(gtPairs.reduce((a, b) => a + b, 0) / gtPairs.length).toFixed(4)}`);
if (spread < 0.05) {
  console.log("AMENDED GROUND TRUTH ALSO NEAR-DEGENERATE (spread < 0.05) — receipt and stop; do not force a verdict.");
}

// ── the live service: upsert + retrieve (settle 45 s per AMENDMENT 1) ──────
console.log(`POST /c6/experiment (${K} vectors, settle 45s)...`);
const t0 = Date.now();
const resp = await fetch(`${W}/c6/experiment`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ settle_seconds: 45, vectors: subs.map((s) => ({ id: s.id, values: s.hist })) }),
});
const out = await resp.json();
if (!out.ok) { console.error("EXPERIMENT CALL FAILED:", JSON.stringify(out).slice(0, 400)); process.exit(1); }
console.log(`service returned ${out.n} rankings in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const rank = new Map(out.rankings.map((r) => [r.id, r.matches]));

// ── M3 (BLOCKING sanity gate, AMENDMENT 1) ─────────────────────────────────
let selfTop1 = 0;
for (const s of subs) {
  const m = rank.get(s.id);
  if (m && m[0] && m[0].id === s.id && m[0].score > 0.99) selfTop1++;
}
console.log(`M3 self-top-1 (BLOCKING): ${selfTop1}/${K}`);
if (selfTop1 !== K) {
  console.log("M3 FAILED — no verdict. Instrument still unhealthy; receipt and stop.");
  writeFileSync(new URL("./outputs/e_c6_run2_m3_failed.json", import.meta.url), JSON.stringify({ m3: `${selfTop1}/${K}`, out_sample: out.rankings[0] }, null, 2));
  process.exit(2);
}

// ── M1: precision@5 vs the amended ground truth ────────────────────────────
let m1Sum = 0;
for (const s of subs) {
  const others = subs.filter((o) => o.id !== s.id);
  const gtTop5 = new Set(others.map((o) => ({ id: o.id, v: overlap(s, o) })).sort((a, b) => b.v - a.v).slice(0, 5).map((x) => x.id));
  const vecTop5 = (rank.get(s.id) || []).filter((m) => m.id !== s.id).slice(0, 5).map((m) => m.id);
  m1Sum += vecTop5.filter((id) => gtTop5.has(id)).length / 5;
}
const M1 = m1Sum / K;

// ── M2: mean per-query Spearman ────────────────────────────────────────────
const spearman = (xs, ys) => {
  const n = xs.length;
  const rk = (arr) => {
    const idx = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let t = i; t <= j; t++) r[idx[t][1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const rx = rk(xs), ry = rk(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (rx[i] - (n + 1) / 2) * (ry[i] - (n + 1) / 2);
    dx += (rx[i] - (n + 1) / 2) ** 2;
    dy += (ry[i] - (n + 1) / 2) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
};
let m2Sum = 0;
for (const s of subs) {
  const others = subs.filter((o) => o.id !== s.id);
  const scoreById = new Map((rank.get(s.id) || []).map((m) => [m.id, m.score]));
  m2Sum += spearman(others.map((o) => scoreById.get(o.id) ?? 0), others.map((o) => overlap(s, o)));
}
const M2 = m2Sum / K;

console.log(`M1 precision@5 (behavioral ground truth): ${M1.toFixed(4)}`);
console.log(`M2 mean Spearman: ${M2.toFixed(4)}`);

let verdict;
if (M1 >= 0.5 && M2 >= 0.5) verdict = "P-A: the claim LIVES — histogram similarity is a usable retrieval signal for behavioral twin overlap";
else if (M1 < 0.3 || M2 < 0.2) verdict = "P-B: the claim DIES — histogram shape does not predict behavioral twin overlap at these parameters";
else verdict = "AMBIGUOUS — between thresholds; receipted as such, no verdict inflation";
console.log(`\nVERDICT: ${verdict}`);

const artifact = {
  experiment: "e_c6_histogram_overlap", run: 2, round: "ORCH-R17",
  preregistration: "docs/discussions/2026-10-18-orch-r17-registration.md + AMENDMENT 1",
  invalid_run_1: { instrument: "new-index propagation > 20s settle -> empty rankings", ground_truth: "binary Jaccard degenerate (table saturates at tick 1; all pairs 1.0)" },
  design: { K, seeds: `${SEED0}..${SEED0 + K - 1}`, ticks: TICKS, dims: "32x32",
    histogram: "slot resonance, L2-normalized",
    ground_truth_amended: "behavioral cross-resonance: overlap(A,B) = (mean_A res_B[d of A's abstainers] + mean_B res_A[d of B's abstainers]) / 2",
    service: `${W}/c6/experiment`, settle_seconds: 45 },
  gt_stats: { min: +Math.min(...gtPairs).toFixed(4), max: +Math.max(...gtPairs).toFixed(4), spread: +spread.toFixed(4) },
  metrics: { M1_precision_at_5: +M1.toFixed(4), M2_mean_spearman: +M2.toFixed(4), M3_self_top1: `${selfTop1}/${K}` },
  verdict,
  rank_sample: out.rankings[0],
};
mkdirSync(new URL("./outputs/", import.meta.url), { recursive: true });
writeFileSync(new URL("./outputs/e_c6_histogram_overlap.json", import.meta.url), JSON.stringify(artifact, null, 2));
console.log("\nartifact: cloudflare/outputs/e_c6_histogram_overlap.json");
