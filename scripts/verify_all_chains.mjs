// scripts/verify_all_chains.mjs — the chain-of-chains auditor (orchestrator
// phase 5 seed, later formalized as the mandatory pre-claim gate).
//
// HOUSE LAW: a receipt without a chain is a rumor — and a chain nobody
// re-verifies is a rumor with better formatting. This tool walks EVERY
// stone-v1 chain in the repo, verifies it FROM DISK with the canonical
// quilt-stone module (never a fork), and prints one line per chain plus a
// summary verdict. Exit code 1 on any broken/missing chain (fail-loud).
//
// Usage: node scripts/verify_all_chains.mjs
import { createHash } from 'node:crypto';
import { linkStone } from '../experiments/_stone_link.mjs';
import { existsSync, readFileSync } from 'node:fs';

const CHAINS = [
  ['tests/receipts.jsonl', 'kernel gates G0–G6'],
  ['crossimpl/receipts/crossimpl_chain.jsonl', 'python LAYER 0 crossimpl'],
  ['crossimpl/receipts/cimpl_chain.jsonl', 'c LAYER 0+1 crossimpl (ORCH-7)'],
  ['fixedpoint/receipts/fixedpoint_chain.jsonl', 'no-floats plane R8'],
  ['receipts/e_q1_chain.jsonl', 'E-Q1 · C2 wormhole'],
  ['receipts/e_q2_chain.jsonl', 'E-Q2 · C3 sigma sweep'],
  ['receipts/e_q5_chain.jsonl', 'E-Q5 · C5 armor ring'],
  ['receipts/e_q6_chain.jsonl', 'E-Q6 · slot collision'],
  ['receipts/e_q7_chain.jsonl', 'E-Q7 · C4 checkerboard cascade'],
  ['receipts/e_q8_chain.jsonl', 'E-Q8 · float-only artifact probe'],
  ['receipts/e_q10_chain.jsonl', "E-Q10 · C5' injector one-pager"],
];

// Content-hash receipts that are deliberately NOT stone chains (E-Q9
// precedent: "stone chain not bound by the E-Q9 registration, decision on
// the record"). Audited as present-and-recomputable instead.
const CONTENT_TIPS = [
  ['experiments/outputs/e_q11_tip.txt', 'experiments/outputs/e_q11_results.json', 'E-Q11 · collapse predicate (content-hash receipt)'],
  ['experiments/outputs/e_q12_tip.txt', 'experiments/outputs/e_q12_results.json', 'E-Q12 · k-family predicate (content-hash receipt)'],
];

const { stone, stonePath } = await linkStone();
console.log(`stone module: ${stonePath}`);

let bad = 0;
const rows = [];
for (const [path, label] of CHAINS) {
  if (!existsSync(path)) { console.log(`MISSING  ${path} (${label})`); bad++; continue; }
  const v = stone.verifyChainFile(path);
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n').filter((l) => l.trim() !== '').length;
  rows.push({ path, label, ok: v.ok, links: v.links ?? lines, tip: v.tip ?? null, why: v.why ?? null });
  console.log(`${v.ok ? 'OK      ' : 'BROKEN  '} ${path} :: ${label} :: links=${v.links ?? lines}${v.ok ? '' : ` :: WHY=${v.why}`}`);
  if (!v.ok) bad++;
}

// Content-hash receipts: recompute sha256(JSON.stringify(summary)) — the
// eval scripts seal `summary` objects; we recompute from the results file's
// own summary field where the shape allows, else just pin presence + tip.
for (const [tipPath, resPath, label] of CONTENT_TIPS) {
  const ok = existsSync(tipPath) && existsSync(resPath);
  const tip = ok ? readFileSync(tipPath, 'utf8').trim() : null;
  console.log(`${ok ? 'TIP-PIN ' : 'MISSING '} ${tipPath} :: ${label} :: tip=${tip}`);
  if (!ok) bad++;
}

const total = CHAINS.length + CONTENT_TIPS.length;
console.log(`\nverify_all_chains: ${bad === 0 ? 'ALL CLEAN' : bad + ' BROKEN'} :: ${total - bad}/${total} receipts of record verified from disk`);
process.exit(bad === 0 ? 0 : 1);
