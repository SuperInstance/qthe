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
];

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
  log('');
  log(`verdict-recompute: ${passed === results.length ? 'ALL PASS' : 'FAIL'} :: ${passed}/${results.length} claims recomputed from the sealed record${failures.length ? ` :: failed: ${failures.join(', ')}` : ''}`);
  return { claims: results, passed, failed: results.length - passed, failures };
}

// standalone entry (the probe gate imports runVerdictRecompute instead)
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const r = runVerdictRecompute();
  process.exit(r.failed === 0 ? 0 : 1);
}
