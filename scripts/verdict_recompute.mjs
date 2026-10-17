// scripts/verdict_recompute.mjs — PG6: the VERDICT-RECOMPUTE checker (ORCH-2b).
//
// ORIGIN (Ling's r10 gap, made operational): the verification corpus proved
// INTEGRITY — hashes re-verify, tamper is refused — but no gate recomputed a
// verdict's ARITHMETIC from its sealed trace. A sealed verdict whose numbers
// no longer re-derive from the sealed data is a rumor with a hash on it.
//
// WHAT THIS DOES: recomputes the corpus's HEADLINE arithmetic from the sealed
// results files (read-only) and diffs each claim against BOTH
//   (a) the CURATED CLAIMS TABLE embedded below — claim id, source file,
//       expected value, tolerance, citation to the chain/doc that asserts it;
//   (b) the sealed VERDICT ROWS in the stone chains themselves (the receipts
//       of record), so the diff is data-vs-verdict, not data-vs-memory.
// Fail-loud everywhere: any mismatch is a FAIL line and exit 1. Tolerances are
// declared in the table and never silently stretched.
//
// FIRST RUN'S CATCH (the reason this gate exists): the E-Q16 contentionMonotone
// aggregate compared q()-stringified numbers LEXICOGRAPHICALLY ("353.57" <=
// "1387.5" is false as strings) — the sealed verdict row read "CONTENTION NOT
// MONOTONE — autopsy" while the sealed scaling data 353.57 → 1387.5 → 5874.11
// writes/slot is strictly monotone increasing. Erratum row appended to
// receipts/e_q16_chain.jsonl (append-only law), runner fixed, defect banked in
// the falsification budget. The E-Q16-contention claim below REQUIRES that
// erratum row to exist whenever the sealed aggregate disagrees with the data —
// an unreceipted discrepancy is a FAIL, not a footnote.
//
// CONSUMERS: standalone (this file) and the probe gate's PG6 section, which
// imports runVerdictRecompute — the claims table is never duplicated.
//
// Usage: node scripts/verdict_recompute.mjs     (exit 0 iff every claim PASSes)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STONE_CHAINS as REGISTRY } from './chain_registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── fail-loud readers ───────────────────────────────────────────────────────
function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch (e) {
    throw new Error(`cannot read sealed file ${rel}: ${e.message}`);
  }
}
function chainRows(rel) {
  try {
    return readFileSync(join(ROOT, rel), 'utf8').split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
  } catch (e) {
    throw new Error(`cannot read chain ${rel}: ${e.message}`);
  }
}
function lastChainRow(rel, pred, what) {
  const rows = chainRows(rel).filter(pred);
  if (rows.length === 0) throw new Error(`no ${what} row in ${rel}`);
  return rows[rows.length - 1];
}
// sealed scalars ride as q()-strings when non-integer — parse loudly
function num(v, what = 'value') {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n)) throw new Error(`${what} is not a finite number: ${JSON.stringify(v)}`);
  return n;
}
// the corpus's median convention (e_q13/e_q14/e_q16/cost_benchmark runners):
// numeric sort, UPPER middle for even counts — index floor(n/2)
function upperMedian(arr) {
  const v = [...arr].sort((a, b) => a - b);
  if (v.length === 0) throw new Error('upperMedian of empty array');
  return v[Math.floor(v.length / 2)];
}

// ── the curated claims table ────────────────────────────────────────────────
// Each entry: id · source (sealed file the arithmetic is recomputed from) ·
// cite (the chain row / doc that asserts the claim) · expected (with declared
// tolerance) · run() → { recomputed } or THROW on any mismatch.
const CLAIMS = [
  {
    id: 'C1/E-Q13-gain',
    source: 'experiments/outputs/e_q13_results.json',
    cite: 'receipts/e_q13_chain.jsonl · verdict.EQ13 (tip d852e6ac…) · docs/CLAIM-VERDICTS.md C1',
    expected: 'bytes-gain at completion 47.4026% (±0.01pp)',
    run() {
      const d = readJson(this.source);
      const trials = d.trials;
      if (!Array.isArray(trials) || trials.length !== 20) throw new Error(`expected 20 trials, found ${trials?.length}`);
      const gains = [];
      for (const t of trials) {
        const g = 100 * (1 - t.bytesQ / t.bytesP);
        const s = g.toFixed(4) + '%';
        if (s !== t.gainStr) throw new Error(`trial seed=${t.seed}: recomputed gain ${s} != sealed gainStr ${t.gainStr}`);
        if (Math.abs(g - 47.4026) > 0.01) throw new Error(`trial seed=${t.seed}: gain ${g.toFixed(4)}% outside 47.4026±0.01pp`);
        gains.push(s);
      }
      // the runner's verdict citation convention: gains[floor(n/2)] (unsorted middle index)
      const headline = gains[Math.floor(gains.length / 2)];
      if (Math.abs(parseFloat(headline) - 47.4026) > 0.01) throw new Error(`verdict-cited gain ${headline} outside 47.4026±0.01pp`);
      const row = lastChainRow('receipts/e_q13_chain.jsonl', (r) => r.kind === 'verdict.EQ13', 'verdict.EQ13');
      if (row.medianGainPct !== headline) throw new Error(`chain verdict medianGainPct ${row.medianGainPct} != recomputed headline ${headline}`);
      return { recomputed: `${headline} (20/20 trial gain strings round-trip; chain verdict row agrees)` };
    },
  },
  {
    id: 'C1/E-Q13-footprint',
    source: 'experiments/outputs/e_q13_results.json',
    cite: 'receipts/e_q13_chain.jsonl · verdict.EQ13 cached_port_caveat · CLAIM-VERDICTS C1 boundary (standing storage)',
    expected: 'seed-plane footprint 4096 vs 8192 B (halving exact)',
    run() {
      const d = readJson(this.source);
      const { Q_SEED, P_SEED } = d.traffic;
      if (Q_SEED !== 4096 || P_SEED !== 8192) throw new Error(`footprint ${Q_SEED} vs ${P_SEED} B, expected 4096 vs 8192`);
      if (P_SEED !== 2 * Q_SEED) throw new Error('footprint halving not exact');
      return { recomputed: `${Q_SEED} vs ${P_SEED} B seed planes (halving exact; port-identity arms)` };
    },
  },
  {
    id: 'C1/E-Q13-bytes-model',
    source: 'experiments/outputs/e_q13_results.json',
    cite: 'receipts/e_q13_chain.jsonl · per-trial rows + verdict.EQ13 (ticks-to-task identical 20/20)',
    expected: 'trials 20; completion ticks ⊆ {8,9}; bytesQ = Q_SEED+Q_PER_TICK·completionQ and bytesP = P_SEED+P_PER_TICK·completionP, 20/20',
    run() {
      const d = readJson(this.source);
      const { Q_SEED, P_SEED, Q_PER_TICK, P_PER_TICK } = d.traffic;
      if (d.task.trials !== 20 || d.trials.length !== 20) throw new Error(`trial count ${d.trials?.length} (task says ${d.task.trials}), expected 20`);
      for (const t of d.trials) {
        if (t.completionQ !== 8 && t.completionQ !== 9) throw new Error(`trial seed=${t.seed}: completionQ ${t.completionQ} outside {8,9}`);
        if (t.bytesQ !== Q_SEED + Q_PER_TICK * t.completionQ) throw new Error(`trial seed=${t.seed}: bytesQ ${t.bytesQ} != ${Q_SEED}+${Q_PER_TICK}·${t.completionQ}`);
        if (t.bytesP !== P_SEED + P_PER_TICK * t.completionP) throw new Error(`trial seed=${t.seed}: bytesP ${t.bytesP} != ${P_SEED}+${P_PER_TICK}·${t.completionP}`);
        if (t.completionQ !== t.completionP) throw new Error(`trial seed=${t.seed}: ticks-to-task diverged Q=${t.completionQ} P=${t.completionP}`);
      }
      const medComp = upperMedian(d.trials.map((t) => t.completionQ));
      if (medComp !== d.aggregates.medianCompletion) throw new Error(`median completion ${medComp} != sealed ${d.aggregates.medianCompletion}`);
      const row = lastChainRow('receipts/e_q13_chain.jsonl', (r) => r.kind === 'verdict.EQ13', 'verdict.EQ13');
      if (row.medianCompletion !== medComp) throw new Error(`chain verdict medianCompletion ${row.medianCompletion} != recomputed ${medComp}`);
      return { recomputed: `bytes re-derive from the sealed traffic model 20/20; completions {8,9}; median completion ${medComp} (chain row agrees)` };
    },
  },
  {
    id: 'C2/E-Q1-on',
    source: 'experiments/outputs/e_q1_results.json',
    cite: 'receipts/e_q1_chain.jsonl · verdict.EQ1 (tip addc22f9…) · docs/CLAIM-VERDICTS.md C2',
    expected: 'ON-arm delivered pairs 8/8 across all 20 trials',
    run() {
      const d = readJson(this.source);
      const K = d.task.K;
      if (K !== 8) throw new Error(`K=${K}, expected 8`);
      const perTrial = [];
      for (const t of d.trials) {
        if (t.on.length !== K) throw new Error(`trial seed=${t.seed}: ${t.on.length} ON pairs, expected ${K}`);
        for (const p of t.on) {
          if (p.pairDeliver !== null && p.pairDeliver !== Math.max(p.aDeliver, p.bDeliver)) {
            throw new Error(`trial seed=${t.seed} pair ${p.pairId}: pairDeliver ${p.pairDeliver} != max(aDeliver,bDeliver)`);
          }
        }
        perTrial.push(t.on.filter((p) => p.pairDeliver !== null).length);
      }
      if (!perTrial.every((x) => x === 8)) throw new Error(`ON delivery per trial [${perTrial.join(',')}], expected 8 everywhere`);
      if (JSON.stringify(perTrial) !== JSON.stringify(d.aggregates.onDelivered)) throw new Error('sealed aggregates.onDelivered != recomputed');
      const med = upperMedian(perTrial);
      const row = lastChainRow('receipts/e_q1_chain.jsonl', (r) => r.kind === 'verdict.EQ1', 'verdict.EQ1');
      if (row.onMedian !== med || med !== 8) throw new Error(`onMedian recomputed ${med}, chain row ${row.onMedian}`);
      if (row.verdict !== 'C2 LIVES') throw new Error(`chain verdict "${row.verdict}", expected "C2 LIVES"`);
      return { recomputed: `8/8 pairs delivered in 20/20 trials (per-pair rows recomputed; onMedian ${med}; chain verdict C2 LIVES)` };
    },
  },
  {
    id: 'C2/E-Q1-off',
    source: 'experiments/outputs/e_q1_results.json',
    cite: 'receipts/e_q1_chain.jsonl · verdict.EQ1 · docs/CLAIM-VERDICTS.md C2',
    expected: 'OFF-arm delivered pairs 0 in all 20 trials (0/20 arms with any delivery)',
    run() {
      const d = readJson(this.source);
      for (const t of d.trials) {
        const n = t.off.filter((p) => p.pairDeliver !== null).length;
        if (n !== 0) throw new Error(`trial seed=${t.seed}: OFF arm delivered ${n} pairs, expected 0`);
      }
      if (!d.aggregates.offDelivered.every((x) => x === 0)) throw new Error('sealed aggregates.offDelivered has a nonzero entry');
      if (d.aggregates.offAnyDelivery !== false) throw new Error('sealed offAnyDelivery is not false');
      const row = lastChainRow('receipts/e_q1_chain.jsonl', (r) => r.kind === 'verdict.EQ1', 'verdict.EQ1');
      if (row.offAnyDelivery !== false) throw new Error(`chain verdict offAnyDelivery ${row.offAnyDelivery}, expected false`);
      return { recomputed: '0 delivered pairs in 20/20 OFF trials (offAnyDelivery false; chain row agrees)' };
    },
  },
  {
    id: 'C3/E-Q2-tie',
    source: 'experiments/outputs/e_q2_results.json',
    cite: 'receipts/e_q2_chain.jsonl · verdict.EQ2 (tip 67e849a5…) · CLAIM-VERDICTS C3 (bridge-FORMATION scope, ORCH-R10)',
    expected: 'full tie across all 5 sigma arms: bridge-formation metrics invariant AND byte-plane hash sequences identical, plain + shadowed',
    run() {
      const d = readJson(this.source);
      const sigmas = d.task.sigmas;
      if (sigmas.length !== 5) throw new Error(`${sigmas.length} sigma arms, expected 5`);
      // the tie-defining metrics (bridge FORMATION — the C3 scope; delivery
      // tick is NOT a tie field: it scales ~1/sigma, sealed by E-Q16-B)
      const TIE = ['bridgeRateMedian', 'medianFirstBridge', 'iqrFirstBridge', 'ascendMembers', 'descendMembers', 'totalMembers', 'events', 'finalsMin', 'finalsMax'];
      for (const arm of ['plain', 'shadowed']) {
        const rows = d.summary[arm];
        if (rows.length !== sigmas.length) throw new Error(`${arm}: ${rows.length} summary rows, expected ${sigmas.length}`);
        for (const f of TIE) {
          const vals = new Set(rows.map((r) => JSON.stringify(r[f])));
          if (vals.size !== 1) throw new Error(`${arm}.${f} varies across sigma arms: ${[...vals].join(' vs ')}`);
        }
        const fpd = new Set(rows.map((r) => JSON.stringify(r.firstPlaneDivergenceVsSigma1)));
        if (fpd.size !== 1 || !fpd.has('null')) throw new Error(`${arm}: firstPlaneDivergenceVsSigma1 not uniformly null — the byte plane moved with sigma`);
        const hashLists = new Set(d.full[arm].map((r) => JSON.stringify(r.hashes)));
        if (hashLists.size !== 1) throw new Error(`${arm}: byte-plane hash sequences differ across sigma arms — the tie is broken`);
      }
      const winners = d.summary.plainVerdict.winners;
      if (winners.length !== sigmas.length || !sigmas.every((s) => winners.includes(s))) throw new Error(`winners [${winners.join(',')}] != all ${sigmas.length} sigmas`);
      const row = lastChainRow('receipts/e_q2_chain.jsonl', (r) => r.kind === 'verdict.EQ2', 'verdict.EQ2');
      if (JSON.stringify(row.plainWinners) !== JSON.stringify(winners)) throw new Error('chain verdict plainWinners != recomputed winners');
      if (!String(row.plain).includes('full tie')) throw new Error('chain verdict plain string does not assert the full tie');
      return {
        recomputed: `9 formation metrics + the byte-plane hash sequence identical across all 5 sigma arms (plain + shadowed); winners = all 5 sigmas`,
        note: 'formation-scoped by construction: medianDeliverTick 17/9/7/5/3 rides ~1/sigma (E-Q16-B sealed the complement)',
      };
    },
  },
  {
    id: 'E-Q14-B2delivered',
    source: 'experiments/outputs/e_q14_results.json',
    cite: 'receipts/e_q14_chain.jsonl · verdict.EQ14 (tip 6a7a2118…) · docs/BOUNDARY-MAP.md congestion row',
    expected: 'B2delivered = 80 (delivery at 256 polluters, 80/80 pair-trials full-8)',
    run() {
      const d = readJson(this.source);
      const at256 = d.familyB.filter((b) => b.nPoll === 256);
      if (at256.length !== 10) throw new Error(`${at256.length} rows at nPoll=256, expected 10`);
      const sum = at256.reduce((s, b) => s + b.delivered, 0);
      if (sum !== 80) throw new Error(`recomputed delivery at 256 = ${sum}, expected 80`);
      if (d.aggregates.B2delivered !== sum) throw new Error(`sealed B2delivered ${d.aggregates.B2delivered} != recomputed ${sum}`);
      const full8 = at256.filter((b) => b.delivered === 8).length;
      const B2 = full8 >= 8;
      if (B2 !== true || d.aggregates.B2 !== true) throw new Error(`B2 floor recomputed ${B2}, sealed ${d.aggregates.B2}`);
      const row = lastChainRow('receipts/e_q14_chain.jsonl', (r) => r.kind === 'verdict.EQ14', 'verdict.EQ14');
      if (row.B2 !== true) throw new Error(`chain verdict B2 ${row.B2}, expected true`);
      if (!String(row.verdict).includes('80/80')) throw new Error('chain verdict string does not carry the 80/80 delivery number');
      return { recomputed: `${sum}/80 pair-trials delivered at 256 polluters (${full8}/10 rows full-8; aggregate + chain verdict row agree)` };
    },
  },
  {
    id: 'E-Q14-pfMed-monotone',
    source: 'experiments/outputs/e_q14_results.json',
    cite: 'receipts/e_q14_chain.jsonl · verdict.EQ14 · docs/BOUNDARY-MAP.md congestion row',
    expected: 'pollution-fraction medians 0.9431 ≤ 0.9615 ≤ 0.9978 ≤ 1 — monotone non-decreasing across polluter counts',
    run() {
      const d = readJson(this.source);
      const meds = {};
      for (const n of [0, 16, 64, 256]) {
        const vs = d.familyB.filter((b) => b.nPoll === n && b.pollutionFraction !== null).map((b) => num(b.pollutionFraction, `pollutionFraction`));
        if (vs.length !== 10) throw new Error(`nPoll=${n}: ${vs.length} pollution rows, expected 10`);
        meds[n] = upperMedian(vs); // the sealed convention (upper middle)
        const sealed = d.aggregates.pfMed[String(n)];
        if (num(sealed, `pfMed[${n}]`) !== meds[n]) throw new Error(`pfMed[${n}]: recomputed ${meds[n]} != sealed ${sealed}`);
      }
      if (!(meds[0] <= meds[16] && meds[16] <= meds[64] && meds[64] <= meds[256])) {
        throw new Error(`pollution medians not monotone: ${meds[0]}, ${meds[16]}, ${meds[64]}, ${meds[256]}`);
      }
      const row = lastChainRow('receipts/e_q14_chain.jsonl', (r) => r.kind === 'verdict.EQ14', 'verdict.EQ14');
      if (row.B1 !== true) throw new Error(`chain verdict B1 ${row.B1}, expected true`);
      if (!String(row.verdict).includes('monotone=true')) throw new Error('chain verdict string does not carry monotone=true');
      return { recomputed: `${meds[0]} ≤ ${meds[16]} ≤ ${meds[64]} ≤ ${meds[256]} — monotone non-decreasing (medians recomputed per nPoll, exact match)` };
    },
  },
  {
    id: 'E-Q14-B3',
    source: 'experiments/outputs/e_q14_results.json',
    cite: 'receipts/e_q14_chain.jsonl · verdict.EQ14 + the B3 autopsy row · FALSIFICATION-BUDGET banked null',
    expected: 'B3 = false (zero-pollution cleanliness falsified; delivery itself held)',
    run() {
      const d = readJson(this.source);
      const zero = d.familyB.filter((b) => b.nPoll === 0);
      if (zero.length !== 10) throw new Error(`${zero.length} rows at nPoll=0, expected 10`);
      const allClean = zero.every((b) => b.pollutedEvents === 0);
      const full8 = zero.filter((b) => b.delivered === 8).length;
      const B3 = allClean && full8 >= 9;
      if (B3 !== false) throw new Error(`B3 recomputed ${B3}, expected false`);
      if (d.aggregates.B3 !== false) throw new Error(`sealed B3 ${d.aggregates.B3}, expected false`);
      const row = lastChainRow('receipts/e_q14_chain.jsonl', (r) => r.kind === 'verdict.EQ14', 'verdict.EQ14');
      if (row.B3 !== false) throw new Error(`chain verdict B3 ${row.B3}, expected false`);
      if (!String(row.verdict).includes('zero-pollution clean=false')) throw new Error('chain verdict string does not carry zero-pollution clean=false');
      const polluted = zero.filter((b) => b.pollutedEvents > 0).length;
      return { recomputed: `false (${polluted}/10 zero-pollution arms carry polluted events — convoy + saturation-rail autopsy stands; ${full8}/10 still full-8, so delivery held)` };
    },
  },
  {
    id: 'E-Q14-LOAD',
    source: 'experiments/outputs/e_q14_results.json',
    cite: 'receipts/e_q14_chain.jsonl · verdict.EQ14 family A · docs/BOUNDARY-MAP.md load-tolerance row',
    expected: 'median firers ratio = 1 at every phi (load held; re-derivable from the sealed per-tick rows)',
    run() {
      const d = readJson(this.source);
      if (d.familyA.length !== 20) throw new Error(`${d.familyA.length} familyA rows, expected 20`);
      for (const a of d.familyA) {
        if (!Array.isArray(a.perTick) || a.perTick.length !== 64) throw new Error(`familyA seed=${a.seed}: ${a.perTick?.length} per-tick rows, expected 64`);
        const m = upperMedian(a.perTick.map((p) => p.firers / a.abstains));
        if (m !== a.firersRatio) throw new Error(`familyA seed=${a.seed} phi=${a.phi}: firersRatio recomputed ${m} != sealed ${a.firersRatio}`);
      }
      for (const phi of [0.25, 0.5, 0.75, 1]) {
        const m = upperMedian(d.familyA.filter((a) => a.phi === phi).map((a) => a.firersRatio));
        if (m !== 1) throw new Error(`A2 median at phi=${phi} is ${m}, expected 1`);
        if (num(d.aggregates.A2medians[String(phi)], `A2medians[${phi}]`) !== m) throw new Error(`sealed A2medians[${phi}] != recomputed ${m}`);
      }
      const row = lastChainRow('receipts/e_q14_chain.jsonl', (r) => r.kind === 'verdict.EQ14', 'verdict.EQ14');
      if (row.A2 !== true) throw new Error(`chain verdict A2 ${row.A2}, expected true`);
      return { recomputed: 'median firers ratio = 1 at phi 0.25/0.5/0.75/1 (recomputed from 64 per-tick rows × 20 runs; LOAD-HELD)' };
    },
  },
  {
    id: 'E-Q16-locality',
    source: 'experiments/outputs/e_q16_results.json',
    cite: 'receipts/e_q16_chain.jsonl · result.C (run-2, authoritative per the run-1 supersession erratum) · BOUNDARY-MAP grid-scaling row',
    expected: 'firings/tick/cell re-derive exactly (0.0964/0.0948/0.1004); locality ratio vs 64x64 ≈ 1.000/0.983/1.041 (±0.01 each)',
    run() {
      const d = readJson(this.source);
      const DIMS = { '64x64': [64, 64], '128x128': [128, 128], '256x256': [256, 256] };
      const EXPECT_LOC = [1.000, 0.983, 1.041];
      if (d.scaling.length !== 3) throw new Error(`${d.scaling.length} scaling rows, expected 3`);
      let base = null;
      const fpts = [], locs = [];
      d.scaling.forEach((r, i) => {
        const dim = DIMS[r.grid];
        if (!dim) throw new Error(`unknown grid ${r.grid}`);
        const fpc = r.firings / (dim[0] * dim[1]);
        if (i === 0) base = fpc;
        const fpt4 = (Math.round((fpc / 50) * 10000) / 10000).toFixed(4);
        if (fpt4 !== String(r.firingsPerTickPerCell)) throw new Error(`${r.grid}: firings/tick/cell recomputed ${fpt4} != sealed ${r.firingsPerTickPerCell}`);
        const loc = Math.round((fpc / base) * 1000) / 1000;
        if (Math.abs(loc - EXPECT_LOC[i]) > 0.01) throw new Error(`${r.grid}: locality ratio ${loc} outside ${EXPECT_LOC[i]}±0.01`);
        if (String(r.localityRatioVs64) !== loc.toFixed(3) && num(r.localityRatioVs64, 'localityRatioVs64') !== loc) {
          throw new Error(`${r.grid}: localityRatioVs64 sealed ${r.localityRatioVs64} != recomputed ${loc}`);
        }
        fpts.push(fpt4); locs.push(loc.toFixed(3));
      });
      return { recomputed: `firings/tick/cell ${fpts.join('/')} (exact re-derive from firings+dims); locality vs 64x64 ${locs.join('/')} (±0.01 of 1.000/0.983/1.041)` };
    },
  },
  {
    id: 'E-Q16-occupancy',
    source: 'experiments/outputs/e_q16_results.json',
    cite: 'receipts/e_q16_chain.jsonl · result.C (run-2) · BOUNDARY-MAP grid-scaling row',
    expected: 'table occupancy constant 56/64 slots across 64x64 → 128x128 → 256x256',
    run() {
      const d = readJson(this.source);
      const occ = d.scaling.map((r) => r.occupancy);
      if (!occ.every((o) => o === 56)) throw new Error(`occupancy [${occ.join(',')}], expected 56 everywhere (64-slot table)`);
      return { recomputed: `56/64 slots occupied at ${d.scaling.map((r) => r.grid).join(', ')} — constant; the fixed 64-slot table is the capacity bound` };
    },
  },
  {
    id: 'E-Q16-contention',
    source: 'experiments/outputs/e_q16_results.json',
    cite: 'receipts/e_q16_chain.jsonl · result.C (run-2) + erratum.EQ16_contention_string_compare · BOUNDARY-MAP grid-scaling row',
    expected: 'contention strictly monotone increasing 353.6 → 1387.5 → 5874.1 writes/slot (±1); the sealed false aggregate must carry its erratum',
    run() {
      const d = readJson(this.source);
      const vals = d.scaling.map((r) => num(r.contentionWritesPerSlot, 'contentionWritesPerSlot'));
      if (!(vals[0] < vals[1] && vals[1] < vals[2])) throw new Error(`contention not strictly monotone: ${vals.join(' -> ')}`);
      const EXPECT = [353.6, 1387.5, 5874.1];
      vals.forEach((v, i) => { if (Math.abs(v - EXPECT[i]) > 1) throw new Error(`contention[${i}] ${v} outside ${EXPECT[i]}±1`); });
      // soundness proper: the sealed aggregate vs the recomputed data. The
      // run-2 result.C row (authoritative per the supersession erratum) sealed
      // contentionMonotone=false via LEXICOGRAPHIC string comparison — that
      // disagreement with the data is citable ONLY with its erratum row.
      const rows = chainRows('receipts/e_q16_chain.jsonl');
      const resultC = rows.filter((r) => r.kind === 'result.C');
      const authoritative = resultC[resultC.length - 1];
      if (authoritative.contentionMonotone !== true) {
        const erratum = rows.find((r) => r.kind === 'erratum.EQ16_contention_string_compare');
        if (!erratum) {
          throw new Error(`sealed aggregate contentionMonotone=${authoritative.contentionMonotone} contradicts the strictly monotone data [${vals.join(' < ')}] and NO erratum row exists — unreceipted soundness defect`);
        }
      }
      return {
        recomputed: `${vals[0]} < ${vals[1]} < ${vals[2]} writes/slot — strictly monotone increasing (±1 of 353.6/1387.5/5874.1)`,
        note: 'sealed aggregate contentionMonotone=false is the receipted string-compare defect (erratum row present); the DATA is the verdict',
      };
    },
  },
  {
    id: 'E-Q17-pf-scale-table',
    source: 'experiments/outputs/e_q17_results.json',
    cite: 'receipts/e_q17_chain.jsonl · result.EQ17 rows + verdict.EQ17 (tip 0d9feae2…) · docs/BOUNDARY-MAP.md provenance-at-scale row',
    expected: 'pf (E-Q14 pollutionFraction, upper-median of 10 seeds per scale x arm): clean 0.9431 -> 0.9078 -> 0.8973 at 64/128/256; density and fixed256 saturated at 1.0 at every scale; the 64x64 clean column reproduces E-Q14 family-B zero-pollution bit-exactly',
    run() {
      const d = readJson(this.source);
      const CELLS = [['64x64', 'clean'], ['64x64', 'density'], ['64x64', 'fixed256'], ['128x128', 'clean'], ['128x128', 'density'], ['128x128', 'fixed256'], ['256x256', 'clean'], ['256x256', 'density'], ['256x256', 'fixed256']];
      const meds = {};
      for (const [g, a] of CELLS) {
        // AM2 schema: each (grid, arm) cell aggregates its canonical config's 10
        // distinct seeds — the 64x64 density/fixed256 coincidence shares ONE
        // config (nPoll=256), counted once per cell, never pooled across arms.
        const cfg = (d.configs ?? []).find((c) => c.grid === g && Array.isArray(c.arms) && c.arms.includes(a));
        if (!cfg) throw new Error(`no canonical config for ${g}/${a}`);
        const rs = d.runs.filter((r) => r.grid === g && r.nPoll === cfg.nPoll);
        if (rs.length !== 10) throw new Error(`${g}/${a}: ${rs.length} runs for nPoll=${cfg.nPoll}, expected 10`);
        for (const r of rs) {
          if (r.partnerEvents + r.pollutedEvents !== r.pairEvents) throw new Error(`${g}/${a} seed=${r.seed}: partner+polluted != pairEvents (field semantics)`);
          if (r.determinism !== true) throw new Error(`${g}/${a} seed=${r.seed}: determinism false`);
        }
        meds[`${g}|${a}`] = upperMedian(rs.map((r) => num(r.pollutionFraction, 'pollutionFraction')));
        const sealed = num(d.aggregates[`${g}|${a}`].pfMed, `pfMed ${g}/${a}`);
        if (Math.abs(sealed - meds[`${g}|${a}`]) > 1e-12) throw new Error(`${g}/${a}: pfMed recomputed ${meds[`${g}|${a}`]} != sealed ${sealed}`);
      }
      // the frozen bands' anchors
      const EXPECT_CLEAN = [0.9431, 0.9078, 0.8973];
      ['64x64', '128x128', '256x256'].forEach((g, i) => {
        if (Math.abs(meds[`${g}|clean`] - EXPECT_CLEAN[i]) > 0.001) throw new Error(`${g} clean pfMed ${meds[`${g}|clean`]} outside ${EXPECT_CLEAN[i]}±0.001`);
        if (meds[`${g}|density`] !== 1) throw new Error(`${g} density pfMed ${meds[`${g}|density`]} != 1 (saturation)`);
        if (meds[`${g}|fixed256`] !== 1) throw new Error(`${g} fixed256 pfMed ${meds[`${g}|fixed256`]} != 1 (saturation)`);
      });
      // the calibration reproduction: 64x64 clean per-seed pf strings are
      // BIT-IDENTICAL to E-Q14's sealed family-B zero-pollution arm
      const e14 = readJson('experiments/outputs/e_q14_results.json');
      const e14zero = e14.familyB.filter((b) => b.nPoll === 0);
      const mine = d.runs.filter((r) => r.grid === '64x64' && r.nPoll === 0);
      if (e14zero.length !== 10 || mine.length !== 10) throw new Error('reproduction arrays not 10/10');
      e14zero.forEach((b, i) => {
        if (b.seed !== mine[i].seed) throw new Error(`seed order mismatch at ${i}`);
        if (String(b.pollutionFraction) !== String(mine[i].pollutionFraction)) throw new Error(`seed ${b.seed}: 64x64 clean pf ${mine[i].pollutionFraction} != E-Q14 sealed ${b.pollutionFraction}`);
      });
      // chain verdict row agreement (parse-before-compare, never string-compare numbers)
      const row = lastChainRow('receipts/e_q17_chain.jsonl', (r) => r.kind === 'verdict.EQ17', 'verdict.EQ17');
      for (const [map, arm] of [['pfMedClean', 'clean'], ['pfMedDensity', 'density'], ['pfMedFixed256', 'fixed256']]) {
        for (const g of ['64x64', '128x128', '256x256']) {
          if (Math.abs(num(row[map][g], `${map}[${g}]`) - meds[`${g}|${arm}`]) > 1e-12) throw new Error(`chain verdict ${map}[${g}] != recomputed ${meds[`${g}|${arm}`]}`);
        }
      }
      return { recomputed: `clean ${meds['64x64|clean']} -> ${meds['128x128|clean']} -> ${meds['256x256|clean']} (medians recomputed per cell, exact); density/fixed256 = 1 everywhere; 64x64 clean reproduces E-Q14's sealed arm bit-exactly (10/10 per-seed pf strings identical; chain verdict row agrees)` };
    },
  },
  {
    id: 'E-Q17-floors-bands',
    source: 'experiments/outputs/e_q17_results.json',
    cite: 'receipts/e_q17_chain.jsonl · verdict.EQ17 · experiments/pre_registration_e_q17.json (frozen floors + bands)',
    expected: 'delivery floor held 640/640 pair-trials; |pf(256,clean) - pf(64,clean)| = 0.0458 -> H0 falsified in the judgment band (0.02 < |Delta| <= 0.05, pollution DOWN = provenance up); FIRE band (verbatim) and MIRROR band both quiet -> hierarchical trigger does NOT fire; occupancy + determinism held',
    run() {
      const d = readJson(this.source);
      const K = d.task.K;
      if (K !== 8) throw new Error(`K=${K}, expected 8 (EQ17-AM3)`);
      if (d.runs.length !== 80) throw new Error(`${d.runs.length} runs, expected 80 (8 configs x 10 seeds)`);
      const deliveredTotal = d.runs.reduce((s, r) => s + r.delivered, 0);
      const pairTrials = d.runs.length * K;
      if (deliveredTotal !== 640 || pairTrials !== 640) throw new Error(`delivery ${deliveredTotal}/${pairTrials}, expected 640/640`);
      if (!d.runs.every((r) => r.delivered === K)) throw new Error('some run delivered < K — floor broken');
      if (d.floors.deliveryFloorOk !== true || d.floors.deliveredTotalAll !== 640) throw new Error('sealed delivery floor fields disagree');
      const cell = (g, a) => {
        const cfg = d.configs.find((c) => c.grid === g && c.arms.includes(a));
        return upperMedian(d.runs.filter((r) => r.grid === g && r.nPoll === cfg.nPoll).map((r) => num(r.pollutionFraction, 'pf')));
      };
      const delta = cell('256x256', 'clean') - cell('64x64', 'clean');
      if (Math.abs(delta - (-0.045802)) > 0.0005) throw new Error(`deltaClean recomputed ${delta}, expected -0.0458±0.0005`);
      if (Math.abs(num(d.bands.deltaCleanPf, 'deltaCleanPf') - delta) > 1e-12) throw new Error('sealed deltaCleanPf != recomputed');
      const H0 = Math.abs(delta) <= 0.02;
      const fire = { clean: cell('256x256', 'clean') < cell('64x64', 'clean') - 0.05, density: cell('256x256', 'density') < cell('64x64', 'density') - 0.05 };
      const mirror = { clean: cell('256x256', 'clean') > cell('64x64', 'clean') + 0.05, density: cell('256x256', 'density') > cell('64x64', 'density') + 0.05 };
      if (H0 !== false) throw new Error(`H0 recomputed ${H0}, expected false (|delta|=${Math.abs(delta)})`);
      if (fire.clean !== false || fire.density !== false) throw new Error('FIRE band recomputed as fired — expected quiet');
      if (mirror.clean !== false || mirror.density !== false) throw new Error('MIRROR band recomputed as fired — expected quiet');
      if (!(Math.abs(delta) > 0.02 && Math.abs(delta) <= 0.05)) throw new Error(`|delta| ${Math.abs(delta)} not in the judgment band (0.02, 0.05]`);
      if (d.floors.F0 !== true || d.floors.occupancyCapOk !== true || d.floors.pfCalFloorOk !== true) throw new Error('a sealed floor flag is not true');
      if (d.bands.triggerFires !== false || d.bands.triggerMirror !== false) throw new Error('sealed trigger flags disagree with recomputed bands');
      if (d.bands.judgmentBand.clean !== true) throw new Error('judgment band clean not true');
      const row = lastChainRow('receipts/e_q17_chain.jsonl', (r) => r.kind === 'verdict.EQ17', 'verdict.EQ17');
      if (row.H0 !== false || row.triggerFires !== false || row.triggerMirror !== false) throw new Error('chain verdict band flags disagree');
      if (row.deliveryFloorOk !== true || row.deliveredTotalAll !== 640 || row.pairTrialsAll !== 640) throw new Error('chain verdict delivery fields disagree');
      if (Math.abs(num(row.deltaCleanPf, 'chain deltaCleanPf') - delta) > 1e-12) throw new Error('chain verdict deltaCleanPf != recomputed');
      if (!String(row.verdict).includes('does NOT fire')) throw new Error('chain verdict string does not carry the trigger verdict');
      if (!String(row.verdict).includes('640/640')) throw new Error('chain verdict string does not carry the delivery number');
      return { recomputed: `delivery 640/640 (floor held); deltaClean = ${delta.toFixed(6)} -> H0 falsified INSIDE the judgment band (0.02 < |delta| <= 0.05, direction: pollution DOWN at scale); FIRE + MIRROR bands quiet -> trigger does NOT fire; F0/occupancy/calibration floors all held (chain verdict row agrees)` };
    },
  },
  {
    id: 'E-Q17-contention-population',
    source: 'experiments/outputs/e_q17_results.json',
    cite: 'receipts/e_q17_chain.jsonl · result.EQ17 telemetry fields · docs/BOUNDARY-MAP.md grid-scaling + provenance-at-scale rows',
    expected: 'table load is POPULATION-indexed, not grid-indexed: writes/slot constant across scales at constant population (clean 57.14 with 3,200 writes; fixed256 971.43 with 54,400 writes at 64/128/256) while the density arm scales 971.43 -> 3714.29 -> 14685.71 (~4x per linear doubling)',
    run() {
      const d = readJson(this.source);
      const wps = (g, a) => {
        const cfg = d.configs.find((c) => c.grid === g && c.arms.includes(a));
        const rs = d.runs.filter((r) => r.grid === g && r.nPoll === cfg.nPoll);
        if (rs.length !== 10) throw new Error(`${g}/${a}: ${rs.length} runs`);
        // per-run writes per occupied slot, the E-Q16 family-C semantics, 2dp rounding
        return upperMedian(rs.map((r) => Math.round((r.totalWrites / Math.max(r.occupancyFinal, 1)) * 100) / 100));
      };
      const writes = (g, a) => {
        const cfg = d.configs.find((c) => c.grid === g && c.arms.includes(a));
        return upperMedian(d.runs.filter((r) => r.grid === g && r.nPoll === cfg.nPoll).map((r) => r.totalWrites));
      };
      for (const g of ['64x64', '128x128', '256x256']) {
        for (const a of ['clean', 'density', 'fixed256']) {
          const sealed = num(d.aggregates[`${g}|${a}`].writesPerOccupiedSlotMed, `wps ${g}/${a}`);
          if (Math.abs(sealed - wps(g, a)) > 1e-9) throw new Error(`${g}/${a}: writes/slot recomputed ${wps(g, a)} != sealed ${sealed}`);
          if (d.aggregates[`${g}|${a}`].totalWritesMed !== writes(g, a)) throw new Error(`${g}/${a}: totalWritesMed recomputed ${writes(g, a)} != sealed`);
        }
      }
      // the separation: constant population -> constant load; density -> ~4x per doubling
      if (!(wps('64x64', 'fixed256') === wps('128x128', 'fixed256') && wps('128x128', 'fixed256') === wps('256x256', 'fixed256'))) {
        throw new Error(`fixed256 writes/slot not scale-constant: ${wps('64x64', 'fixed256')}/${wps('128x128', 'fixed256')}/${wps('256x256', 'fixed256')}`);
      }
      if (wps('64x64', 'clean') !== wps('256x256', 'clean')) throw new Error('clean writes/slot not scale-constant');
      const dd = [wps('64x64', 'density'), wps('128x128', 'density'), wps('256x256', 'density')];
      if (!(dd[0] < dd[1] && dd[1] < dd[2])) throw new Error(`density writes/slot not monotone: ${dd.join(' -> ')}`);
      const ratios = [dd[1] / dd[0], dd[2] / dd[1]];
      if (!ratios.every((r) => Math.abs(r - 4) < 0.35)) throw new Error(`density scaling not ~4x per doubling: ${ratios.join(', ')}`);
      // population x T arithmetic: clean = 16 members x 200 ticks at EVERY scale
      const implied = { '64x64': writes('64x64', 'clean'), '128x128': writes('128x128', 'clean'), '256x256': writes('256x256', 'clean') };
      if (!Object.values(implied).every((w) => w === 16 * 200)) throw new Error(`clean totalWrites ${JSON.stringify(implied)} != population x T (16 x 200 = 3200)`);
      if (writes('64x64', 'fixed256') !== 272 * 200 || writes('256x256', 'fixed256') !== 272 * 200) throw new Error('fixed256 totalWrites != 272 writers x 200 ticks');
      return { recomputed: `writes/slot: clean ${wps('64x64', 'clean')} constant (3,200 writes = 16 members x 200 ticks at every scale); fixed256 ${wps('64x64', 'fixed256')} constant (54,400 = 272 writers x 200); density ${dd.join(' -> ')} (~${ratios.map((r) => r.toFixed(2)).join('x, ')}x per doubling) — the load variable is the writer POPULATION, not the grid` };
    },
  },
  {
    id: 'FPX-cost-ratio',
    source: 'fixedpoint/outputs/cost_benchmark.json',
    cite: 'fixedpoint/receipts/fixedpoint_chain.jsonl · cost_benchmark.ORCH6 · fixedpoint/COST-OF-EXACTNESS.md',
    expected: 'fixed/float runtime ratio 0.975 (±0.01), re-derived from the sealed per-seed medians',
    run() {
      const c = readJson(this.source);
      const fms = upperMedian(c.timing.float.medians.map((m) => num(m, 'float median')));
      const xms = upperMedian(c.timing.fixed.medians.map((m) => num(m, 'fixed median')));
      if (num(c.timing.float.perRunMs, 'float perRunMs') !== fms) throw new Error(`float perRunMs ${c.timing.float.perRunMs} != upper-median of sealed medians ${fms}`);
      if (num(c.timing.fixed.perRunMs, 'fixed perRunMs') !== xms) throw new Error(`fixed perRunMs ${c.timing.fixed.perRunMs} != upper-median of sealed medians ${xms}`);
      const ratio = xms / fms;
      if (Math.abs(ratio - 0.975) > 0.01) throw new Error(`ratio ${ratio} outside 0.975±0.01`);
      if (Math.round(ratio * 1000) / 1000 !== num(c.ratioFixedOverFloat, 'ratioFixedOverFloat')) {
        throw new Error(`sealed ratio ${c.ratioFixedOverFloat} != recomputed ${Math.round(ratio * 1000) / 1000}`);
      }
      const row = lastChainRow('fixedpoint/receipts/fixedpoint_chain.jsonl', (r) => r.kind === 'cost_benchmark.ORCH6', 'cost_benchmark.ORCH6');
      if (num(row.float_median_ms, 'chain float_median_ms') !== fms || num(row.fixed_median_ms, 'chain fixed_median_ms') !== xms) {
        throw new Error('chain cost_benchmark.ORCH6 medians disagree with the sealed results file');
      }
      if (num(row.ratio_fixed_over_float, 'chain ratio') !== num(c.ratioFixedOverFloat, 'results ratio')) throw new Error('chain ratio disagrees with the results-file ratio');
      return { recomputed: `${xms}/${fms} ms = ${ratio.toFixed(5)} → ${c.ratioFixedOverFloat} (per-seed medians → per-run median → ratio; chain row cost_benchmark.ORCH6 agrees)` };
    },
  },
  {
    // ORCH-R11 coverage growth: the five claims the arena seats demanded.
    id: 'C5/E-Q5-no-self-repair',
    source: 'experiments/outputs/e_q5_results.json',
    cite: 'receipts/e_q5_chain.jsonl · verdict rows · docs/CLAIM-VERDICTS.md §C5',
    expected: 'repairTick null in every trial of both repair arms; pristine half-erosion 28, injected 25; repairedWithoutInjection false',
    run() {
      const c = readJson(this.source);
      const n = (c.aggregates.a1RepairTicks ?? []).length;
      if ((c.aggregates.a1RepairTicks ?? []).some((v) => v !== null) || (c.aggregates.a2RepairTicks ?? []).some((v) => v !== null)) throw new Error('some repairTick is not null — self-repair observed?');
      const a0 = c.aggregates.a0HalfErosion;
      const a2 = c.aggregates.a2HalfErosion;
      if (!a0.every((v) => v === 28) || !a2.every((v) => v === 25)) throw new Error(`half-erosion arrays not uniform 28/25: a0=${a0[0]} a2=${a2[0]}`);
      if (c.aggregates.repairedWithoutInjection !== false) throw new Error('repairedWithoutInjection not false');
      return { recomputed: `repairTick null ${n}/${n} per arm; halfErosion a0=${a0[0]} a2=${a2[0]}; repairedWithoutInjection=false (ring self-dissolves; C5 DIES stands)` };
    },
  },
  {
    id: 'E-Q6-total-collision-survival',
    source: 'experiments/outputs/e_q6_results.json',
    cite: 'receipts/e_q6_chain.jsonl · docs/BOUNDARY-MAP.md total-collision row',
    expected: 'cook arm: survivalRate 0.984375, distinctFirers 64 (LWW survival under total collision)',
    run() {
      const c = readJson(this.source);
      const cook = c.arms.cook;
      if (Math.abs(cook.survivalRate - 0.984375) > 1e-9) throw new Error(`cook survivalRate ${cook.survivalRate} != 0.984375`);
      if (cook.distinctFirers !== 64) throw new Error(`cook distinctFirers ${cook.distinctFirers} != 64`);
      return { recomputed: `survivalRate=${cook.survivalRate}, distinctFirers=${cook.distinctFirers}/64 (every writer heard under LWW)` };
    },
  },
  {
    id: 'C4/E-Q7-nu-firings',
    source: 'experiments/outputs/e_q7_results.json',
    cite: 'receipts/e_q7_chain.jsonl · docs/CLAIM-VERDICTS.md §C4',
    expected: 'totalFirings256 = 991 on the N and A 2/3 boards (the ON-vs-OFF nu asymmetry that did not buy terminal inversion)',
    run() {
      const c = readJson(this.source);
      const n = c.board['N_2_3'].totalFirings256;
      const a = c.board['A_2_3'].totalFirings256;
      if (n !== 991 || a !== 991) throw new Error(`totalFirings256 N=${n} A=${a} != 991/991`);
      return { recomputed: `N_2_3=${n}, A_2_3=${a} (nu channel fires, terminal inversion never arrives; C4 DIES stands)` };
    },
  },
  {
    id: 'E-Q15-reweighting-null',
    source: 'experiments/outputs/e_q15_results.json',
    cite: 'receipts/e_q15_chain.jsonl · verdict row · docs/BOUNDARY-MAP.md',
    expected: 'winRate 0, medianDelta -6 (the honest null: max-of-accepted dominates)',
    run() {
      const c = readJson(this.source);
      if (c.aggregates.winRate !== 0) throw new Error(`winRate ${c.aggregates.winRate} != 0`);
      if (c.aggregates.medianDelta !== -6) throw new Error(`medianDelta ${c.aggregates.medianDelta} != -6`);
      return { recomputed: `winRate=${c.aggregates.winRate}, medianDelta=${c.aggregates.medianDelta} (rejection sampling dominates quality-correlated oracles; the null stands)` };
    },
  },
  {
    id: 'C5p/E-Q10-injector-reproduce',
    source: 'experiments/outputs/e_q10_results.json',
    cite: 'receipts/e_q10_chain.jsonl · verdict row · docs/CLAIM-VERDICTS.md §C5-prime',
    expected: 'C5-prime as stated stands: all 9 predicates true over 17 admissible trials, falsifier NOT fired, injector restores integrity to 1.0 then re-erodes monotonically to zero with no substrate self-repair (repairTick null)',
    run() {
      const c = readJson(this.source);
      const need = ['C1','C2','C3','C4','C5','C6','C7','C8','C9'];
      for (const k of need) if (c.aggregates[k] !== true) throw new Error(`predicate ${k} not true`);
      if (c.aggregates.falsifierFired !== false) throw new Error('falsifier fired — C5-prime as stated does not stand');
      if (c.aggregates.admissible !== 17) throw new Error(`admissible ${c.aggregates.admissible} != 17`);
      for (const t of c.trials) {
        if (t.detOk !== true || t.fixedMatch !== true) throw new Error(`trial seed ${t.seed}: det/fixed match failed`);
        if (t.a1.repairTick !== null) throw new Error('self-repair observed in the no-injector arm — repairTick not null');
        if (t.a2.postInjectIntegrity !== 1) throw new Error(`trial seed ${t.seed}: injector did not restore to 1.0`);
        if (t.a2.reErosionMonotone !== true) throw new Error(`trial seed ${t.seed}: re-erosion not monotone`);
      }
      return { recomputed: `9/9 predicates true, 17/17 admissible, falsifier not fired, inject restores 1.0 + monotone re-erosion, repairTick null (C5-prime STANDS as stated)` };
    },
  },
  {
    id: 'E-Q8-sigma-inert-controls',
    source: 'experiments/outputs/e_q8_results.json',
    cite: 'receipts/e_q8_chain.jsonl · docs/BOUNDARY-MAP.md adversarial-sigma row',
    expected: 'sigma-inert controls hold at both artifact scales: control[2/3].sigmaInert and control[8/5].sigmaInert both true',
    run() {
      const c = readJson(this.source);
      const a = c.control?.['2/3']?.sigmaInert;
      const b = c.control?.['8/5']?.sigmaInert;
      if (a !== true || b !== true) throw new Error(`controls not inert: 2/3=${a}, 8/5=${b}`);
      return { recomputed: `sigmaInert 2/3=${a}, 8/5=${b} (the artifact sites' controls behave inertly — the float/fixed divergence is family-specific, not noise)` };
    },
  },
];

// ── COVERAGE (ORCH-R11: the arena-r11 consensus finding, all four seats) ──
// The curated table is a hand-maintained list — the same class as defect #7's
// chain-list drift. The coverage law ties it to the registry: EVERY registered
// chain must carry >= 1 curated claim OR an explicit exclusion with a reason.
// A newly sealed+registered experiment therefore FAILS PG6 until its headline
// arithmetic is curated (or honestly excluded) — the table's growth is
// enforced, not remembered.
const EXCLUDED = [
  { gate: 'G0-G6', reason: 'gate counts, not numeric verdict arithmetic — recomputed by re-running tests/run_tests.mjs itself (the gate is its own checker)' },
  { gate: 'crossimpl-py', reason: 'conformance verdicts are vector-equality counts re-verified by PG1 chain integrity + the crossimpl conformance runner itself' },
  { gate: 'crossimpl-c', reason: 'same class as crossimpl-py: 19/19 byte-exactness is re-derived by the C conformance runner, not by arithmetic on a results file' },
  { gate: 'probe_gate', reason: 'the gate seals its own runs; verdict-recomputing the gate with itself is circular — its integrity is PG1-PG3' },
];

function claimGate(claim) {
  const m = claim.source.match(/e_q(\d+)_results\.json/);
  if (m) return `e_q${m[1]}`;
  if (claim.source.startsWith('fixedpoint/')) return 'fixedpoint';
  return null;
}

function coverageReport() {
  const coveredBy = new Map();
  for (const c of CLAIMS) {
    const g = claimGate(c);
    if (g) coveredBy.set(g, (coveredBy.get(g) ?? 0) + 1);
  }
  const uncovered = [];
  for (const r of REGISTRY) {
    if (coveredBy.has(r.gate)) continue;
    if (EXCLUDED.some((e) => e.gate === r.gate)) continue;
    uncovered.push(r.gate);
  }
  return { covered: [...coveredBy.entries()], excluded: EXCLUDED.length, uncovered };
}

// ── runner ──────────────────────────────────────────────────────────────────
// Prints one PASS/FAIL line per claim (recomputed vs expected), then a
// summary. Returns { claims, passed, failed, failures } for the probe gate's
// PG6 section (which seals only integer/string details — no floats in chains).
export function runVerdictRecompute({ log = console.log } = {}) {
  const results = [];
  for (const claim of CLAIMS) {
    let outcome;
    try {
      outcome = claim.run();
    } catch (e) {
      outcome = { recomputed: `MISMATCH — ${e.message}`, failed: true };
    }
    const pass = outcome.failed !== true;
    results.push({ id: claim.id, pass, recomputed: outcome.recomputed, expected: claim.expected, source: claim.source, cite: claim.cite });
    log(`${pass ? 'PASS' : 'FAIL'} ${claim.id} :: recomputed=${outcome.recomputed} :: expected=${claim.expected}${outcome.note ? ` :: note: ${outcome.note}` : ''}`);
  }
  const passed = results.filter((r) => r.pass).length;
  const failures = results.filter((r) => !r.pass).map((r) => r.id);
  const cov = coverageReport();
  const covFail = cov.uncovered.length > 0;
  log('');
  log(`coverage: ${cov.covered.length} chains with curated claims (${cov.covered.map(([g, n]) => `${g}:${n}`).join(', ')}), ${cov.excluded} explicitly excluded (${EXCLUDED.map((e) => e.gate).join(', ')}), ${cov.uncovered.length} UNCOVERED${cov.uncovered.length ? ` :: ${cov.uncovered.join(', ')} — curate the headline arithmetic or add an honest exclusion (the table grows with every new experiment; ORCH-R11 law)` : ''}`);
  log(`verdict-recompute: ${passed === results.length && !covFail ? 'ALL PASS' : 'FAIL'} :: ${passed}/${results.length} claims recomputed from the sealed record :: coverage ${REGISTRY.length - cov.uncovered.length}/${REGISTRY.length} chains${failures.length ? ` :: failed: ${failures.join(', ')}` : ''}`);
  return { claims: results, passed, failed: results.length - passed + (covFail ? 1 : 0), failures: covFail ? [...failures, `uncovered-chains:${cov.uncovered.join(',')}`] : failures, coverage: cov };
}

// standalone entry (the probe gate imports runVerdictRecompute instead)
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const r = runVerdictRecompute();
  process.exit(r.failed === 0 ? 0 : 1);
}
