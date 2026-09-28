#!/usr/bin/env node
// two_reader/run.mjs — lane 48-b OFFICIAL RUNNER (installment 2).
//
// Runs the sealed two-reader over all three registered crab-traps chains
// TWICE (P3 byte-identical receipts), then receipts P1/P3/P5.
// Stdlib-only Node. No API spend (MOTH_KEY unused; everything deterministic).
//
// Outputs into two_reader/run_receipts/:
//   run1-<chain>.json, run2-<chain>.json  (raw reader receipts)
//   p3-compare.json                       (run1 vs run2 normalized byte-compare)
//   official-run-receipt.json             (summary: P1 tips, P3, P5 scan)

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const QTHE_ROOT = resolve(HERE, '..');
const MY_PROJECT = resolve(QTHE_ROOT, '..');
const CRAB = process.env.CRAB_TRAPS_PATH || join(MY_PROJECT, 'crab-traps');
const FLEET = process.env.FLEET_SEEDS_PATH || join(MY_PROJECT, 'fleet-seeds');
const PINS = join(HERE, 'registration.json');
const READER = join(HERE, 'reader.mjs');
const OUTDIR = join(HERE, 'run_receipts');
const MOTH_FIXTURE = join(FLEET, 'tools', 'fixtures', 'moth-42b-raw-bits-2caa822b-7c46-4f65-a0c9-152c46272e19.txt');

const RUN_AT = new Date().toISOString();
mkdirSync(OUTDIR, { recursive: true });

const pins = JSON.parse(readFileSync(PINS, 'utf8'));
const chains = pins.registration.chains.map((c) => c.id);

const sha = (b) => createHash('sha256').update(b).digest('hex');

function runReader(tag, chainId) {
  const out = join(OUTDIR, `${tag}-${chainId}.json`);
  const argv = ['node', READER, '--repo', CRAB, '--pins', PINS, '--chain', chainId, '--out', out];
  if (chainId === 'crab45c') argv.push('--moth-fixture', MOTH_FIXTURE);
  const r = spawnSync(argv[0], argv.slice(1), { encoding: 'utf8' });
  return { exit: r.status, out, stdout: r.stdout, stderr: r.stderr };
}

const runs = { run1: {}, run2: {} };
let p1_fail = null;
for (const tag of ['run1', 'run2']) {
  for (const c of chains) {
    const r = runReader(tag, c);
    runs[tag][c] = r;
    const rec = r.exit === 0 ? JSON.parse(readFileSync(r.out, 'utf8')) : null;
    const ok = r.exit === 0 && rec && rec.ok === true;
    if (!ok && !p1_fail) p1_fail = { tag, chain: c, exit: r.exit, stderr: (r.stderr || '').slice(0, 400), first_failure: rec ? rec.first_failure : null };
  }
}

// P3: byte-identical receipts across the two runs, after normalizing the
// single declared wall-clock field (receipt.run_at) to a fixed value.
const norm = (raw) => sha(Buffer.from(raw.toString('utf8').replace(/"run_at"\s*:\s*"[^"]*"/, '"run_at": "NORMALIZED"'), 'utf8'));
const p3 = {};
let p3_pass = true;
for (const c of chains) {
  const a = readFileSync(runs.run1[c].out);
  const b = readFileSync(runs.run2[c].out);
  const ha = norm(a), hb = norm(b);
  const rawEqual = a.equals(b);
  const normEqual = ha === hb;
  const rawDiffSpots = [];
  if (!rawEqual && normEqual) {
    const al = a.toString('utf8').split('\n'), bl = b.toString('utf8').split('\n');
    for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) rawDiffSpots.push(i + 1);
  }
  p3[c] = { run1_sha256: sha(a), run2_sha256: sha(b), raw_byte_equal: rawEqual, normalized_equal: normEqual, differing_lines: rawDiffSpots };
  if (!normEqual) p3_pass = false;
}

// P5: static independence scan of the reader module.
const readerSrc = readFileSync(READER, 'utf8');
const imports = [...readerSrc.matchAll(/import\s+[^'"]*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const badImports = imports.filter((s) => !(s.startsWith('node:') || s.startsWith('./') || s.startsWith('../')));
const badRefs = [];
for (const pat of ['two-reader-walker', 'second-reader', 'walkers.mjs', 'stone-v1.mjs', 'verifyChain', 'sealChain']) {
  if (readerSrc.includes(pat)) badRefs.push(pat);
}
const p5_pass = badImports.length === 0 && badRefs.length === 0;

const tips = {};
for (const c of chains) {
  const rec = JSON.parse(readFileSync(runs.run1[c].out, 'utf8'));
  tips[c] = { computed: rec.chain.tip, expect: rec.chain.expect_tip, rows_walked: rec.chain.rows_walked, rows_registered: rec.chain.rows_registered, optional_bindings: rec.chain.optional_bindings };
}

const receipt = {
  tool: 'qthe two_reader/run.mjs (official runner, installment 2)',
  lane: 'wave 48 lane 48-b',
  run_at: RUN_AT,
  repo_under_verification: CRAB,
  pins_sealed: true,
  api_spend_usd: 0,
  moth_key_used: false,
  chains,
  p1: { all_ok: !p1_fail, first_failure: p1_fail, tips },
  p3: { method: 'sha256 of receipt bytes after normalizing receipt.run_at to a fixed value; raw byte-equality also recorded (run_at is the ONLY expected difference)', pass: p3_pass, detail: p3 },
  p5: { method: 'static import scan of two_reader/reader.mjs + forbidden-symbol scan (no installment-1 walker, fleet walker, or stone module references)', pass: p5_pass, imports_found: imports, bad_imports: badImports, forbidden_symbols_found: badRefs },
  ok: !p1_fail && p3_pass && p5_pass,
};
writeFileSync(join(OUTDIR, 'official-run-receipt.json'), JSON.stringify(receipt, null, 1) + '\n');
process.stdout.write(JSON.stringify(receipt, null, 1) + '\n');
process.exit(receipt.ok ? 0 : 1);
