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
import { STONE_CHAINS as REGISTRY, CONTENT_TIPS as TIP_REGISTRY, strayChainFiles } from './chain_registry.mjs';

// ORCH-R10: the chain list lives in ONE place — scripts/chain_registry.mjs.
// This auditor once kept its own hand-maintained list and had drifted to
// 11 of 16 chains when arena round 10's verification found it (falsification
// budget defect #7). The registry is the source; strays fail loudly below.
const CHAINS = REGISTRY.map((r) => [r.path, r.label]);
const CONTENT_TIPS = TIP_REGISTRY.map((r) => [r.path, `experiments/outputs/${r.gate}_results.json`, r.label]);

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
// ORCH-R14 T5-c V6 closure (negctl): the recompute is now IMPLEMENTED — a
// flipped tip CONTENT fails here, not only a missing file. Mint shape:
// e_q11/e_q12_eval.mjs write tip = sha256(JSON.stringify(summary)) where
// summary IS the entire results-file object (written pretty, hashed compact).
for (const [tipPath, resPath, label] of CONTENT_TIPS) {
  const ok = existsSync(tipPath) && existsSync(resPath);
  const tip = ok ? readFileSync(tipPath, 'utf8').trim() : null;
  let recomputed = null;
  if (ok) {
    try { recomputed = createHash('sha256').update(JSON.stringify(JSON.parse(readFileSync(resPath, 'utf8')))).digest('hex'); }
    catch { recomputed = null; }
  }
  const agree = ok && tip !== null && tip === recomputed;
  console.log(`${agree ? 'TIP-PIN ' : 'BROKEN  '} ${tipPath} :: ${label} :: tip=${tip} :: recomputed=${recomputed}`);
  if (!agree) bad++;
}

// ORCH-R14 T5-c V8 closure (negctl): tip-file AGREEMENT for stone chains.
// Before this clause, verify_all_chains never read <gate>_tip.txt at all —
// a flipped stored tip was invisible to THIS auditor (PG2 caught it, but
// the auditor's own scope said "tip" without checking it). The map below is
// EXPLICIT (fail-closed: no convention-guessing) — chains without a tip
// file stay unpinned here and that scope fact is receipted in negctl.md.
const STONE_TIP_FILES = {
  'receipts/e_q1_chain.jsonl': 'experiments/outputs/e_q1_tip.txt',
  'receipts/e_q2_chain.jsonl': 'experiments/outputs/e_q2_tip.txt',
  'receipts/e_q5_chain.jsonl': 'experiments/outputs/e_q5_tip.txt',
  'receipts/e_q6_chain.jsonl': 'experiments/outputs/e_q6_tip.txt',
  'receipts/e_q7_chain.jsonl': 'experiments/outputs/e_q7_tip.txt',
  'receipts/e_q8_chain.jsonl': 'experiments/outputs/e_q8_tip.txt',
  'receipts/e_q10_chain.jsonl': 'experiments/outputs/e_q10_tip.txt',
  'receipts/e_q13_chain.jsonl': 'experiments/outputs/e_q13_tip.txt',
  'receipts/e_q14_chain.jsonl': 'experiments/outputs/e_q14_tip.txt',
  'receipts/e_q15_chain.jsonl': 'experiments/outputs/e_q15_tip.txt',
  'receipts/e_q16_chain.jsonl': 'experiments/outputs/e_q16_tip.txt',
  'receipts/e_q17_chain.jsonl': 'experiments/outputs/e_q17_tip.txt',
  'receipts/e_q19_chain.jsonl': 'experiments/outputs/e_q19_tip.txt',
  'crossimpl/receipts/cimpl_chain.jsonl': 'crossimpl/receipts/cimpl_tip.txt',
  'crossimpl/receipts/rs_chain.jsonl': 'crossimpl/receipts/rs_tip.txt',
  'fixedpoint/receipts/fixedpoint_chain.jsonl': 'fixedpoint/receipts/chain_tip.txt',
};
for (const [chainPath, tipPath] of Object.entries(STONE_TIP_FILES)) {
  const row = rows.find((r) => r.path === chainPath);
  if (!row || !row.ok) continue; // broken chains already counted above
  if (!existsSync(tipPath)) { console.log(`BROKEN   ${tipPath} :: pinned tip file ABSENT for ${chainPath}`); bad++; continue; }
  const pinned = readFileSync(tipPath, 'utf8').trim().split(' ')[0];
  if (row.tip && pinned !== row.tip) { console.log(`BROKEN   ${tipPath} :: tip-file ${pinned.slice(0, 8)} != chain tip ${row.tip.slice(0, 8)} (${chainPath})`); bad++; }
  else console.log(`TIP-AGREE ${tipPath} == ${chainPath} :: tip=${pinned}`);
}

// Strays: chain-shaped files on disk the registry does not know about
// (defect #7's enforcement — a chain sealed without registering cannot pass
// this auditor silently; the sealing commit registers, always).
for (const s of strayChainFiles('.')) { console.log(`STRAY    ${s} :: chain-shaped file not in scripts/chain_registry.mjs — register it in the sealing commit`); bad++; }

const total = CHAINS.length + CONTENT_TIPS.length + Object.keys(STONE_TIP_FILES).length;
console.log(`\nverify_all_chains: ${bad === 0 ? 'ALL CLEAN' : bad + ' BROKEN'} :: ${total - bad}/${total} receipts of record verified from disk (incl. ${Object.keys(STONE_TIP_FILES).length} tip-file agreements)`);
process.exit(bad === 0 ? 0 : 1);
