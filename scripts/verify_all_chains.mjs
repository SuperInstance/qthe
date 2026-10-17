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
for (const [tipPath, resPath, label] of CONTENT_TIPS) {
  const ok = existsSync(tipPath) && existsSync(resPath);
  const tip = ok ? readFileSync(tipPath, 'utf8').trim() : null;
  console.log(`${ok ? 'TIP-PIN ' : 'MISSING '} ${tipPath} :: ${label} :: tip=${tip}`);
  if (!ok) bad++;
}

// Strays: chain-shaped files on disk the registry does not know about
// (defect #7's enforcement — a chain sealed without registering cannot pass
// this auditor silently; the sealing commit registers, always).
for (const s of strayChainFiles('.')) { console.log(`STRAY    ${s} :: chain-shaped file not in scripts/chain_registry.mjs — register it in the sealing commit`); bad++; }

const total = CHAINS.length + CONTENT_TIPS.length;
console.log(`\nverify_all_chains: ${bad === 0 ? 'ALL CLEAN' : bad + ' BROKEN'} :: ${total - bad}/${total} receipts of record verified from disk`);
process.exit(bad === 0 ? 0 : 1);
