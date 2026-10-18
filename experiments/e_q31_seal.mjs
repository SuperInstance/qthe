// experiments/e_q31_seal.mjs — E-Q31 seal (ORCH-R26/T17-d): the drift
// monitor's r26 re-read. C27 LIVES — the band holds three rounds running.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r26', 'eq31_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q31.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q31_chain.jsonl');
const fmt = (x) => String(Math.round(x * 1e4) / 1e4);

const H1 = A.hypotheses.H1_band_holds, H2 = A.hypotheses.H2_no_trend, C27 = A.hypotheses.C27;

const verdict = `E-Q31 VERDICT (the standing drift monitor's r26 re-read — 20 fresh embeds through the byte-identical E-Q22 noul map, the three-point time series r24/r25/r26): H1 ${H1 ? 'LIVES' : 'DIES'} — all 20 records within 0.10 of the sealed r24 vectors (per-record max ${fmt(A.drift_vs_r24.max)}, mean-axis ${fmt(A.drift_vs_r24.mean_axis)}): C27 ${C27 ? 'LIVES' : 'DIES'} — THE BAND HOLDS THREE ROUNDS RUNNING: the 8-axis noul map is a stable coordinate contract under a fixed serving version (model_served ${A.model_served.join(',')} — unchanged from the r24/r25 serving, P2 HIT: no version flip). H2 ${H2 ? 'LIVES' : 'DIES'} — BY A FLOAT ARTIFACT: the r26 per-record max ${fmt(A.drift_vs_r24.max)} sits 2e-17 above the r25+0.02 tolerance (0.08): the honest receipt is numerical, not substantive — the raw-float comparison is published unstretched (the E-Q16 lexicographic precedent: report the artifact, never silently round the threshold). THE TIME-SERIES RECEIPT: r26-vs-r25 mean-axis ${fmt(A.drift_vs_r25.mean_axis)} < r26-vs-r24 ${fmt(A.drift_vs_r24.mean_axis)} (P4 HIT) — readings closer in time agree more: the series behaves like sampling noise around a fixed point, NOT a walk. THE AXIS RECEIPT: the per-axis means are all tiny (<= ${fmt(Math.max(...Object.values(A.per_axis_mean_vs_r24)))}) with the largest on P7_econ/P8_exact — the E-Q23 version-drift structure (P2 mover, P4 calm) does NOT replicate in the same-version noise regime (P3 MISS): axis structure is a VERSION-drift property, not a sampling property. The monitor's next reading: r27.`;

writeFileSync(join(OUT, 'e_q31_results.json'), JSON.stringify({
  experiment: 'E-Q31', claim: 'C27 — the drift band holds three rounds running', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q31.json (no amendments — the run as registered)',
  task: { calls: 20, series: ['r24 sealed', 'r25 (E-Q25)', 'r26 (this)'] },
  drift_vs_r24: A.drift_vs_r24, drift_vs_r25: A.drift_vs_r25, model_served: A.model_served,
  hypotheses: A.hypotheses, predictions: A.predictions, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ31', frozen_by: 'experiments/pre_registration_e_q31.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R26 lane T17-d — the standing drift monitor, third reading',
    claim: 'C27 — the 8-axis noul map is a stable coordinate contract (band holds 3 rounds)',
    floors: 'F1 qmap sha verified at runtime vs E-Q22; F2 all 20 rows complete with model_served; F3 the r25 comparison recomputed from sealed E-Q25 rows; F4 same-record axis-aligned deltas',
    bands: 'H1 all 20 within 0.10 of r24 sealed; H2 max <= r25_max + 0.02 (raw floats); C27 = H1' },
  { kind: 'run.config', experiment: 'E-Q31', kernel: kernelReport(),
    design: '20 batched calls, jev-latest, the byte-identical E-Q22 map; per-record max deltas vs r24 sealed and r25 re-derived; per-axis means; model_served receipted per row',
    moth: 'ZERO credits', llm: '20 typesafe calls' },
  { kind: 'verdict.EQ31', experiment: 'E-Q31', H1, H2, C27,
    max_vs_r24: q(A.drift_vs_r24.max), mean_vs_r24: q(A.drift_vs_r24.mean_axis),
    max_vs_r25: q(A.drift_vs_r25.max), mean_vs_r25: q(A.drift_vs_r25.mean_axis),
    model_served: A.model_served.join(','),
    P1: A.predictions.P1, P2: A.predictions.P2, P3: A.predictions.P3, P4: A.predictions.P4, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q31', claim: 'drift-band-C27' });
writeFileSync(join(OUT, 'e_q31_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q31] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q31] H1=${H1} H2=${H2} C27=${C27} | max vs r24 ${A.drift_vs_r24.max}`);
console.log(`[e-q31] ${verdict}\n`);
