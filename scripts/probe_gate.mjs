// scripts/probe_gate.mjs — THE PROBE HARNESS GATE (roadmap phase 5, ORCH-5).
//
// MANDATORY GATE CONTRACT (effective wave 69-post): no experiment verdict in
// this repo is citable unless a probe-gate PASS row for that experiment (or
// a corpus-wide PASS) exists in receipts/probe_gate_chain.jsonl, sequenced
// with the verdict. The gate is fail-loud and append-only.
//
// Sections:
//   PG1 STONE       every stone-v1 chain in scope verifies FROM DISK
//   PG2 TIP-PIN     each experiment's outputs/<name>_tip.txt equals the
//                   recomputed chain tip (content-hash tips are pinned by
//                   presence + recompute where the shape allows)
//   PG3 NEGATIVE    tamper control: a COPY of a real chain, one byte flipped
//                   in a data field, MUST be REFUSED by verifyChainFile
//                   (a verifier that cannot say NO is decoration)
//   PG4 DETERMINISM standing witness: G3-style 1000-tick twin probe on the
//                   real kernel, run TWICE from fresh construction —
//                   byte-identical plane-hash sequence
//   PG5 BOUNDS      resource bounds of the PG4 probe: wall-clock and peak
//                   RSS within declared ceilings (10 s / 512 MB)
//   PG6 VERDICT-    soundness (Ling's r10 gap, made operational): the corpus's
//     RECOMPUTE     headline arithmetic is re-derived from the sealed results
//                   files and diffed against the curated claims table in
//                   scripts/verdict_recompute.mjs AND the sealed chain
//                   verdict rows — integrity without soundness is a rumor
//                   with a hash on it (first run caught the E-Q16
//                   contentionMonotone string-compare defect)
//
// Usage: node scripts/probe_gate.mjs            (corpus-wide gate)
//        node scripts/probe_gate.mjs e_q13      (single experiment scope)
import { linkStone } from '../experiments/_stone_link.mjs';
import { appendAndVerify, planeHash } from '../experiments/_harness.mjs';
import { loadKernel, makeSubstrate, tick, mulberry32, bytePlane } from '../experiments/_adapter.mjs';
import { STONE_CHAINS as REGISTRY, CONTENT_TIPS as TIP_REGISTRY, strayChainFiles } from './chain_registry.mjs';
import { runVerdictRecompute } from './verdict_recompute.mjs';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CHAIN = join(ROOT, 'receipts', 'probe_gate_chain.jsonl');
const scope = process.argv[2] ?? 'all';

// ORCH-R10: the chain list lives in scripts/chain_registry.mjs (the single
// source of truth). This gate once kept its own list and had drifted to 13
// of 16 chains when arena round 10's verification found it (defect #7);
// PG1 now also fails on any unregistered chain-shaped file on disk.
const STONE_CHAINS = REGISTRY.map((r) => [r.path, r.gate]);
const CONTENT_TIPS = TIP_REGISTRY.map((r) => [r.path, r.gate]);

const { stone, stonePath } = await linkStone();
const { kernelKind } = await loadKernel();
const results = { scope, stonePath, kernelKind, sections: {} };
let failed = 0;
const fail = (section, why) => { results.sections[section] = { pass: false, why }; failed++; console.log(`FAIL ${section}: ${why}`); };
const pass = (section, detail) => { results.sections[section] = { pass: true, ...detail }; console.log(`PASS ${section} :: ${JSON.stringify(detail)}`); };

// ── PG1 STONE ──────────────────────────────────────────────────────────────
{
  const inScope = STONE_CHAINS.filter(([p, n]) => scope === 'all' || p.includes(scope) || n === scope);
  const bad = [];
  let verified = 0;
  for (const [p] of inScope) {
    if (!existsSync(join(ROOT, p))) { bad.push(`${p}: missing`); continue; }
    const v = stone.verifyChainFile(join(ROOT, p));
    if (!v.ok) bad.push(`${p}: ${v.why}`); else verified++;
  }
  // ORCH-R10 defect #7 enforcement: a chain sealed without being registered
  // in scripts/chain_registry.mjs fails the gate. Corpus-level, always on.
  for (const s of strayChainFiles(ROOT)) bad.push(`STRAY ${s}: chain-shaped file not in the registry (register it in the sealing commit)`);
  if (bad.length) fail('PG1_STONE', bad.join('; '));
  else pass('PG1_STONE', { chains: inScope.length, verified });
}

// ── PG2 TIP-PIN ────────────────────────────────────────────────────────────
{
  const mismatches = [];
  for (const [p, n] of STONE_CHAINS) {
    if (scope !== 'all' && !(p.includes(scope) || n === scope)) continue;
    const tipPath = join(ROOT, 'experiments', 'outputs', `${n}_tip.txt`);
    // ORCH-R14 T5-c P3 closure (negctl): a DELETED tip file used to `continue`
    // silently — deletion evaded the pin with zero signal. e_q* chains MUST
    // have their tip file; only tests/crossimpl/fixedpoint/probe_gate are
    // exempt (their tip records live elsewhere: receipt.json / cimpl_tip /
    // chain_tip / this gate's own chain).
    if (!existsSync(tipPath)) {
      if (/^e_q\d+/.test(n)) mismatches.push(`${n}: tip file ABSENT — deletion must not evade the pin (T5-c P3)`);
      continue;
    }
    const pinned = readFileSync(tipPath, 'utf8').trim().split(' ')[0];
    const v = stone.verifyChainFile(join(ROOT, p));
    if (v.ok && v.tip && pinned && v.tip !== pinned) mismatches.push(`${n}: tip-file ${pinned.slice(0, 8)} != chain ${v.tip.slice(0, 8)}`);
  }
  for (const [tp, n] of CONTENT_TIPS) {
    if (scope !== 'all' && n !== scope) continue;
    if (!existsSync(join(ROOT, tp))) mismatches.push(`${n}: content tip file missing`);
  }
  if (mismatches.length) fail('PG2_TIP_PIN', mismatches.join('; '));
  else pass('PG2_TIP_PIN', { checked: STONE_CHAINS.length + CONTENT_TIPS.length });
}

// ── PG3 NEGATIVE (tamper control) ──────────────────────────────────────────
{
  const src = join(ROOT, 'receipts', 'e_q13_chain.jsonl');
  if (!existsSync(src)) fail('PG3_NEGATIVE', 'no e_q13 chain to tamper-test');
  else {
    const tmp = mkdtempSync(join(tmpdir(), 'qthe-pg-'));
    const dst = join(tmp, 'tampered.jsonl');
    try {
      const lines = readFileSync(src, 'utf8').split('\n').filter((l) => l.trim() !== '');
      if (lines.length < 3) throw new Error('chain too short to tamper-test');
      // flip one character inside a mid-chain data row (not the hash field's
      // exact position — any content change must break the link hashes)
      const mid = Math.floor(lines.length / 2);
      let row = JSON.parse(lines[mid]);
      row.determinism = !(row.determinism ?? true); // flip a boolean field
      lines[mid] = JSON.stringify(row);
      writeFileSync(dst, lines.join('\n') + '\n', 'utf8');
      const v = stone.verifyChainFile(dst);
      if (v.ok) fail('PG3_NEGATIVE', 'TAMPERED CHAIN ACCEPTED — the verifier cannot say NO (critical)');
      else pass('PG3_NEGATIVE', { tampered: dst, refused: true, why: (v.why ?? '').slice(0, 80) });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
}

// ── PG4 DETERMINISM + PG5 BOUNDS ───────────────────────────────────────────
{
  const T = 1000, W = 64, H = 64;
  const packB = (tau, d) => ((tau & 3) << 6) | (d & 63);
  const probeRun = () => {
    const rng = mulberry32(424242);
    // deterministic twin probe: two Abstain cells, same d, far apart + weather
    const ax = 8, ay = 8, bx = 40, by = 40;
    const seedFn = (x, y) => {
      if (x === ax && y === ay) return packB(3, 20);
      if (x === bx && y === by) return packB(3, 20);
      if (x === 16 && y === 50) return packB(1, 40);
      if (x === 50 && y === 16) return packB(2, 30);
      return 0;
    };
    let sub = makeSubstrate(W, H, seedFn);
    const hashes = [planeHash(sub, 0, bytePlane)];
    // ORCH-R14 T5-c P5b closure (negctl): sampling was t % 100 — a period-2
    // phase-locked perturbation returns to the unperturbed byte at every
    // 100th tick and was INVISIBLE to this witness (found live by the
    // control; G3's per-tick witness caught it, PG4 alone did not). The
    // schedule is now t % 97 (odd stride: a period-2 oscillation cannot
    // phase-lock to it) plus a mandatory final checkpoint at t === T.
    for (let t = 1; t <= T; t++) { sub = tick(sub, { wormholes: true }); if (t % 97 === 0 || t === T) hashes.push(planeHash(sub, t, bytePlane)); }
    rng(); // touch the rng so the seed is part of the closure (lint-quiet)
    return hashes;
  };
  const t0 = performance.now();
  const runA = probeRun();
  const runB = probeRun();
  const elapsedMs = Math.round(performance.now() - t0);
  const rss = process.memoryUsage().rss;
  const identical = JSON.stringify(runA) === JSON.stringify(runB);
  if (!identical) fail('PG4_DETERMINISM', '1000-tick twin probe diverged across fresh reruns — VOID environment');
  else pass('PG4_DETERMINISM', { ticks: T, checkpoints: runA.length, finalHash: runA[runA.length - 1].slice(0, 16) + '…' });
  if (elapsedMs > 10000 || rss > 512 * 1024 * 1024) fail('PG5_BOUNDS', `elapsed=${elapsedMs}ms rss=${rss}`);
  else pass('PG5_BOUNDS', { elapsedMs, rssMb: Math.round(rss / 1048576), ceilings: '10000ms/512MB' });
}

// ── PG6 VERDICT-RECOMPUTE (soundness) ──────────────────────────────────────
{
  // ORCH-2b: the gates proved INTEGRITY (hashes re-verify, tamper refused),
  // never SOUNDNESS (verdicts recompute from their sealed traces). The same
  // curated claims table as the standalone checker — imported, never
  // duplicated. Detail stays integer/string-only (no floats in chains).
  const r = runVerdictRecompute();
  if (r.failed > 0) fail('PG6_VERDICT_RECOMPUTE', `${r.failed}/${r.claims.length} claims failed recomputation: ${r.failures.join('; ')}`);
  else pass('PG6_VERDICT_RECOMPUTE', { claims: r.claims.length, passed: r.passed });
}

// ── seal ───────────────────────────────────────────────────────────────────
const verdict = failed === 0 ? 'PROBE-GATE PASS' : `PROBE-GATE FAIL (${failed} sections)`;
console.log(`\n${verdict} :: scope=${scope}`);
const rows = [{ kind: 'probe_gate.run', scope, verdict, failed, sections: results.sections, stonePath, kernelKind }];
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'probe-gate', claim: 'harness-integrity' });
console.log(`probe_gate chain ok links=${v.links} tip=${v.tip}`);
process.exit(failed === 0 ? 0 : 1);
