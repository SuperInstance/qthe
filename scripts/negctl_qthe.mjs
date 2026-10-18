// scripts/negctl_qthe.mjs — T5-c (ORCH-R14): sabotage negative controls for
// qthe's own verifiers, adopting the fleet negctl doctrine:
//
//     "A suite that cannot fail is not evidence. Sabotage a port, require the
//      suite to notice, restore. A suite that survives a sabotage is telling
//      you nothing."                       — SuperInstance/negctl README
//
// TARGETS (the three suites the orchestrator's verdicts stand on):
//   tests/run_tests.mjs          LAYER 0/1 kernel gates G0–G6
//   scripts/verify_all_chains.mjs  the chain-of-chains auditor
//   scripts/probe_gate.mjs       PG1–PG6 (stone / tip-pin / negative /
//                                determinism / bounds / verdict-recompute)
//
// PROTOCOL per sabotage (fail-closed at every step):
//   (a) baseline: every suite must be GREEN in a fresh workspace copy, else
//       the control REFUSES to run (nothing to compare against);
//   (b) ONE sabotage targeting ONE clause, applied to a TEMP COPY of the repo
//       under /tmp/negctl-qthe/ws/ — the real tree is never edited;
//   (c) the target suite must report MORE failures than its baseline
//       (DETECTED). A suite that stays green has SURVIVED the sabotage —
//       it is not evidence for that clause, and is receipted as a hole;
//   (d) restore: re-copy clean, re-run, require GREEN again.
//
// NO-OP DISEASE: every edit asserts its anchor occurs EXACTLY ONCE and that
// the file actually changed on disk — a sabotage that quietly became a no-op
// is the same disease again, and throws loudly here.
//
// Exit 0 only if EVERY sabotage was DETECTED and EVERY restore came back
// GREEN. Exit 1 otherwise, with the survivors named. A SURVIVED sabotage is
// an honest result (a hole in the suite), not a harness bug — but it fails
// the run, per the registration's falsifier.
//
// Usage: node scripts/negctl_qthe.mjs        (from the repo root)
// Receipts: situations/negctl/run_receipt.txt (append-only, verbatim output)
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const REAL_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REAL_STONE = join(dirname(REAL_ROOT), 'quilt-stone');
const TMP = '/tmp/negctl-qthe';
const SNAPSHOT = join(TMP, 'snapshot');
const WS = join(TMP, 'ws');
const RECEIPTS = join(REAL_ROOT, 'situations', 'negctl');
const RUN_TIMEOUT_MS = 240000;
// The file set the three target suites actually consume. A modification to
// any of these vs HEAD makes the baseline untrustworthy -> refuse. Anything
// else (concurrent lanes work in situations/ and docs/, file-disjoint from
// this lane) is receipted as traffic and ignored.
const CRITICAL_PREFIXES = ['qthe.mjs', 'demo/', 'tests/', 'scripts/', 'experiments/', 'receipts/', 'crossimpl/', 'fixedpoint/'];

// ── output tee (console + append-only receipt file) ────────────────────────
mkdirSync(RECEIPTS, { recursive: true });
const RECEIPT_FILE = join(RECEIPTS, 'run_receipt.txt');
writeFileSync(RECEIPT_FILE, ''); // fresh run receipt (this file is the run's own log)
function out(s = '') {
  console.log(s);
  appendFileSync(RECEIPT_FILE, s + '\n');
}
function die(msg) {
  out(`\nnegctl FAIL-CLOSED: ${msg}`);
  out('The control refuses to continue. Nothing in the real repo was modified.');
  process.exit(1);
}

// ── suite bookkeeping ───────────────────────────────────────────────────────
const SUITES = {
  run_tests: { cmd: 'tests/run_tests.mjs' },
  verify_all_chains: { cmd: 'scripts/verify_all_chains.mjs' },
  probe_gate: { cmd: 'scripts/probe_gate.mjs' },
};
function countFailures(suite, text) {
  if (suite === 'verify_all_chains') return (text.match(/^(BROKEN|MISSING|STRAY) /gm) || []).length;
  if (suite === 'probe_gate') return (text.match(/^FAIL /gm) || []).length;
  return (text.match(/^(FAIL G|CHAIN BROKEN)/gm) || []).length;
}
function failingLines(suite, text, max = 6) {
  const re = suite === 'verify_all_chains' ? /^(BROKEN|MISSING|STRAY) .*$/
    : suite === 'probe_gate' ? /^FAIL .*$/
    : /^(FAIL G.*|CHAIN BROKEN.*)$/;
  return (text.match(new RegExp(re.source, 'gm')) || []).slice(0, max);
}

// ── workspace (recreated clean per run — no cross-contamination) ───────────
// Every workspace (baseline AND per-sabotage AND restore) is copied from the
// SNAPSHOT frozen once at harness start, so concurrent-lane drift on disk
// cannot make baseline and sabotage differ by anything but the sabotage.
function freshWorkspace(label) {
  rmSync(WS, { recursive: true, force: true });
  mkdirSync(WS, { recursive: true });
  cpSync(join(SNAPSHOT, 'qthe'), join(WS, 'qthe'), { recursive: true });
  // the canonical stone, as a COPY (the suites' ../../quilt-stone resolution
  // finds it next to the workspace repo; sabotage P4 targets this copy)
  cpSync(join(SNAPSHOT, 'quilt-stone'), join(WS, 'quilt-stone'), { recursive: true });
  const ws = join(WS, 'qthe');
  if (!existsSync(join(ws, 'scripts', 'verify_all_chains.mjs'))) die(`workspace copy incomplete for ${label}`);
  return ws;
}

function runSuite(ws, suite) {
  const t0 = Date.now();
  const r = spawnSync('node', [SUITES[suite].cmd], { cwd: ws, encoding: 'utf8', timeout: RUN_TIMEOUT_MS });
  const ms = Date.now() - t0;
  if (r.error) die(`suite ${suite} could not spawn: ${r.error.message}`);
  const text = (r.stdout ?? '') + '\n' + (r.stderr ?? '');
  return { code: r.status, text, ms,
    failures: countFailures(suite, text),
    fails: failingLines(suite, text) };
}

// ── fail-closed edit primitives ─────────────────────────────────────────────
function editFile(ws, rel, find, replace) {
  const p = join(ws, rel);
  if (!existsSync(p)) die(`edit target missing: ${rel}`);
  const before = readFileSync(p, 'utf8');
  const n = before.split(find).length - 1;
  if (n !== 1) die(`edit anchor count ${n} (want exactly 1) in ${rel} :: ${JSON.stringify(find.slice(0, 80))}`);
  const after = before.replace(find, replace);
  if (after === before) die(`edit was a NO-OP in ${rel} (the disease) :: ${JSON.stringify(find.slice(0, 80))}`);
  writeFileSync(p, after, 'utf8');
  if (readFileSync(p, 'utf8') !== after) die(`edit did not land on disk in ${rel}`);
}
function readLines(ws, rel) {
  const p = join(ws, rel);
  if (!existsSync(p)) die(`line-edit target missing: ${rel}`);
  return readFileSync(p, 'utf8').split('\n').filter((l) => l.trim() !== '');
}
function writeLines(ws, rel, lines) {
  writeFileSync(join(ws, rel), lines.join('\n') + '\n', 'utf8');
}
function removeLineWith(ws, rel, anchor) {
  const lines = readLines(ws, rel);
  const hits = lines.filter((l) => l.includes(anchor));
  if (hits.length !== 1) die(`removeLine anchor count ${hits.length} (want 1) in ${rel}`);
  const kept = lines.filter((l) => !l.includes(anchor));
  if (kept.length !== lines.length - 1) die(`removeLine removed wrong count in ${rel}`);
  writeLines(ws, rel, kept);
}
function swapLinesWith(ws, rel, anchorA, anchorB) {
  const lines = readLines(ws, rel);
  const ia = lines.findIndex((l) => l.includes(anchorA));
  const ib = lines.findIndex((l) => l.includes(anchorB));
  if (ia < 0 || ib < 0) die(`swapLine anchor missing in ${rel} (ia=${ia} ib=${ib})`);
  const ca = lines.filter((l) => l.includes(anchorA)).length;
  const cb = lines.filter((l) => l.includes(anchorB)).length;
  if (ca !== 1 || cb !== 1) die(`swapLine anchor not unique in ${rel} (${ca},${cb})`);
  if (Math.abs(ia - ib) !== 1) die(`swapLines: anchors not adjacent in ${rel} (ia=${ia} ib=${ib})`);
  const before = lines.join('\n');
  [lines[ia], lines[ib]] = [lines[ib], lines[ia]];
  if (lines.join('\n') === before) die(`swapLines no-op in ${rel}`);
  writeLines(ws, rel, lines);
}
function appendLine(ws, rel, line) {
  const lines = readLines(ws, rel);
  if (lines.includes(line)) die(`appendLine: line already present in ${rel}`);
  lines.push(line);
  writeLines(ws, rel, lines);
  if (readLines(ws, rel).pop() !== line) die(`appendLine did not land in ${rel}`);
}
function rmFile(ws, rel) {
  const p = join(ws, rel);
  if (!existsSync(p)) die(`rmFile target missing: ${rel}`);
  rmSync(p);
  if (existsSync(p)) die(`rmFile failed: ${rel}`);
}
function flipTipChar(ws, rel) {
  const p = join(ws, rel);
  if (!existsSync(p)) die(`flipTip target missing: ${rel}`);
  const s = readFileSync(p, 'utf8');
  if (!/^[0-9a-f]{64}([ \t][^\n]*)?\n?$/.test(s)) die(`flipTip: ${rel} is not a 64-hex tip :: ${JSON.stringify(s.slice(0, 80))}`);
  const flipped = (s[0] === '0' ? '1' : '0') + s.slice(1);
  if (flipped === s) die(`flipTip no-op in ${rel}`);
  writeFileSync(p, flipped, 'utf8');
}
function editJson(ws, rel, mutate, desc) {
  const p = join(ws, rel);
  if (!existsSync(p)) die(`json edit target missing: ${rel}`);
  const before = readFileSync(p, 'utf8');
  const d = JSON.parse(before);
  mutate(d); // mutate() itself asserts the expected shape (die() on mismatch)
  const after = JSON.stringify(d, null, 1);
  if (after === before) die(`json edit NO-OP in ${rel} (${desc})`);
  writeFileSync(p, after, 'utf8');
  if (JSON.stringify(JSON.parse(readFileSync(p, 'utf8'))) !== JSON.stringify(d)) die(`json edit did not land in ${rel}`);
}

// ── the sabotage menu (one clause per sabotage) ─────────────────────────────
// predict: what code-reading says SHOULD happen; a mismatch is receipted
// loudly (the most interesting outcome a control can produce).
const REGISTRY_EQ13_LINE = "  { path: 'receipts/e_q13_chain.jsonl', gate: 'e_q13', label: 'E-Q13 · C1 gain of function', pin: 'e_q13_C1' },\n";
const SABOTAGES = [
  // ── verify_all_chains ─────────────────────────────────────────────────────
  {
    id: 'V1-chain-row-payload-corrupt', suite: 'verify_all_chains',
    clause: 'stone verification from disk — a payload byte flipped in a NON-hash field of a registered chain must break the link hashes (BROKEN)',
    what: 'receipts/e_q13_chain.jsonl: middle result.trial row seed 66010 -> 66011 (one digit, non-hash field)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'receipts/e_q13_chain.jsonl', '"seed":66010,', '"seed":66011,'),
  },
  {
    id: 'V2-middle-link-deleted', suite: 'verify_all_chains',
    clause: 'link continuity — deleting a middle row must break the prev-hash chain at the next row',
    what: 'receipts/e_q13_chain.jsonl: delete the middle result.trial row (seed 66010)',
    predict: 'DETECTED',
    apply: (ws) => removeLineWith(ws, 'receipts/e_q13_chain.jsonl', '"seed":66010,'),
  },
  {
    id: 'V3-forged-row-appended', suite: 'verify_all_chains',
    clause: 'seal authenticity — an appended row with a fabricated row_hash must be refused',
    what: 'receipts/e_q13_chain.jsonl: append a forged result.trial row (seed 99999, row_hash all zeros)',
    predict: 'DETECTED',
    apply: (ws) => appendLine(ws, 'receipts/e_q13_chain.jsonl',
      '{"kind":"result.trial","experiment":"E-Q13","seed":99999,"completionQ":9,"completionP":9,"bytesQ":1,"bytesP":2,"gainPct":"50.0000%","forgedBy":"negctl-T5c","row_hash":"0000000000000000000000000000000000000000000000000000000000000000"}'),
  },
  {
    id: 'V4-rows-reordered', suite: 'verify_all_chains',
    clause: 'row ordering — swapping two adjacent middle rows must break the implicit prev-hash linkage',
    what: 'receipts/e_q13_chain.jsonl: swap the seed-66010 and seed-66011 rows',
    predict: 'DETECTED',
    apply: (ws) => swapLinesWith(ws, 'receipts/e_q13_chain.jsonl', '"seed":66010,', '"seed":66011,'),
  },
  {
    id: 'V5-chain-file-deleted', suite: 'verify_all_chains',
    clause: 'registered chain existence — a registered chain file missing from disk must report MISSING',
    what: 'delete receipts/e_q13_chain.jsonl',
    predict: 'DETECTED',
    apply: (ws) => rmFile(ws, 'receipts/e_q13_chain.jsonl'),
  },
  {
    id: 'V6-content-tip-flipped', suite: 'verify_all_chains',
    clause: 'TIP-PIN for content-hash receipts — the auditor\'s own comment promises "recompute sha256(JSON.stringify(summary)) ... else just pin presence + tip"; flip the CONTENT of a content tip',
    what: 'experiments/outputs/e_q11_tip.txt: flip the first hex char of the pinned 64-hex content hash',
    predict: 'SURVIVED (presence-only pin — the promised recompute was never implemented)',
    apply: (ws) => flipTipChar(ws, 'experiments/outputs/e_q11_tip.txt'),
  },
  {
    id: 'V7-registry-entry-removed', suite: 'verify_all_chains',
    clause: 'registry completeness / stray enforcement (ORCH-R10 defect #7) — a chain file on disk that the registry no longer lists must fail as STRAY',
    what: 'scripts/chain_registry.mjs: remove the e_q13 entry (file stays on disk)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'scripts/chain_registry.mjs', REGISTRY_EQ13_LINE, ''),
  },
  {
    id: 'V8-stone-tip-flipped', suite: 'verify_all_chains',
    clause: 'tip agreement for stone chains (the registration menu\'s "flip a stored tip") — verify_all_chains never reads <gate>_tip.txt files',
    what: 'experiments/outputs/e_q1_tip.txt: flip the first hex char of the pinned chain tip',
    predict: 'SURVIVED (stone-tip agreement is probe_gate PG2\'s clause, not this suite\'s — receipted as a scope fact)',
    apply: (ws) => flipTipChar(ws, 'experiments/outputs/e_q1_tip.txt'),
  },
  // ── probe_gate ────────────────────────────────────────────────────────────
  {
    id: 'P1-chain-tampered-PG1', suite: 'probe_gate',
    clause: 'PG1 STONE — every registered stone chain verifies from disk; a tampered payload must be refused',
    what: 'receipts/e_q7_chain.jsonl: rename arm "float:C_7_10" -> "float:C_7_11" on a middle det.arm row (non-hash field)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'receipts/e_q7_chain.jsonl', '"arm":"float:C_7_10"', '"arm":"float:C_7_11"'),
  },
  {
    id: 'P2-stone-tip-flipped', suite: 'probe_gate',
    clause: 'PG2 TIP-PIN — experiments/outputs/<gate>_tip.txt must equal the recomputed chain tip',
    what: 'experiments/outputs/e_q1_tip.txt: flip the first hex char of the pinned tip',
    predict: 'DETECTED',
    apply: (ws) => flipTipChar(ws, 'experiments/outputs/e_q1_tip.txt'),
  },
  {
    id: 'P3-stone-tip-deleted', suite: 'probe_gate',
    clause: 'PG2 TIP-PIN, presence half — a DELETED stone-chain tip file evades the pin entirely (PG2 `continue`s on absent files)',
    what: 'delete experiments/outputs/e_q1_tip.txt',
    predict: 'SURVIVED (the `if (!existsSync(tipPath)) continue;` hole)',
    apply: (ws) => rmFile(ws, 'experiments/outputs/e_q1_tip.txt'),
  },
  {
    id: 'P4-verifier-lobotomized', suite: 'probe_gate',
    clause: 'PG3 NEGATIVE — a verifier that cannot say NO is decoration; a tampered chain MUST be refused (here: the stone module copy itself is lobotomized)',
    what: 'ws quilt-stone/stone.mjs copy: verifyChainFile always returns ok:true (tip from the stored last row_hash, so PG2 stays quiet)',
    predict: 'DETECTED',
    apply: (ws) => editFile(dirname(ws), 'quilt-stone/stone.mjs',
      'return verifyChain(readJsonl(path), opts);',
      "{ const __rows = readJsonl(path); return { ok: true, firstBadIndex: null, at: null, why: null, alg: 'stone-v1', genesis: 'STONE-GENESIS-1', links: __rows.length, tip: __rows.length ? (__rows[__rows.length - 1].row_hash ?? null) : null, path, rows: __rows.length }; }"),
  },
  {
    id: 'P5-kernel-nondeterministic', suite: 'probe_gate',
    clause: 'PG4 DETERMINISM — the 1000-tick twin probe must diverge when the kernel drifts on its second fresh construction (step perturbation: one cell flips once and stays flipped)',
    what: 'qthe.mjs copy: module-global tick counter LATCHES a one-time cell-0 flip at local tick 400, but ONLY on runs after the first 1000 global ticks (the second 1000-tick construction drifts permanently)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs',
      'const n = w * h;',
      'const n = w * h;\n  globalThis.__negctl_ticks = (globalThis.__negctl_ticks | 0) + 1;\n  if (cells.ticks >= 400 && globalThis.__negctl_ticks > 1000 && !globalThis.__negctl_latched) { globalThis.__negctl_latched = true; cells[0] = (cells[0] ^ 1) & 0xff; }'),
  },
  {
    id: 'P5b-kernel-oscillation-aliased', suite: 'probe_gate',
    clause: 'PG4 DETERMINISM, sampling coverage — PG4 hashes the plane only every 100 ticks; a perturbation that returns to the unperturbed byte at each sampled tick is invisible to the sampled witness (found LIVE by this control: the first draft of P5 oscillated and survived; kept as its own receipt)',
    what: 'qthe.mjs copy: cell 0 XORs every tick from local tick 400 on second-construction runs — a period-2 oscillation phase-locked to PG4\'s t%100 sampling grid (the same kernel IS caught by run_tests G3\'s per-tick trace comparison — see R5)',
    predict: 'SURVIVED (the t%100 sampling grid hole; per-tick witness G3 catches it)',
    apply: (ws) => editFile(ws, 'qthe.mjs',
      'const n = w * h;',
      'const n = w * h;\n  globalThis.__negctl_ticks = (globalThis.__negctl_ticks | 0) + 1;\n  if (cells.ticks >= 400 && globalThis.__negctl_ticks > 1000) cells[0] = (cells[0] ^ 1) & 0xff;'),
  },
  {
    id: 'P6-kernel-slowed', suite: 'probe_gate',
    clause: 'PG5 BOUNDS — the PG4 probe\'s wall-clock must stay under the declared 10 s ceiling',
    what: 'qthe.mjs copy: makeSubstrate busy-waits 6.5 s per construction (PG4 constructs twice -> ~13 s > 10 s; PG4\'s twin comparison itself stays identical)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs',
      'const cells = new Uint8Array(w * h);',
      'const __negctl_t0 = Date.now(); while (Date.now() - __negctl_t0 < 6500) {}\n  const cells = new Uint8Array(w * h);'),
  },
  {
    id: 'P7-registry-entry-removed', suite: 'probe_gate',
    clause: 'PG1 strays (defect #7 enforcement) — an unregistered chain-shaped file on disk must fail the gate',
    what: 'scripts/chain_registry.mjs copy: remove the e_q13 entry (file stays on disk)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'scripts/chain_registry.mjs', REGISTRY_EQ13_LINE, ''),
  },
  {
    id: 'P8-claim-source-remapped', suite: 'probe_gate',
    clause: 'PG6 claim-to-chain mapping — a curated claim must read the results file of the chain it cites',
    what: 'scripts/verdict_recompute.mjs copy: claim C1/E-Q13-gain source remapped e_q13_results.json -> e_q14_results.json (foreign data; e_q13 loses one claim)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'scripts/verdict_recompute.mjs',
      "id: 'C1/E-Q13-gain',\n    source: 'experiments/outputs/e_q13_results.json',",
      "id: 'C1/E-Q13-gain',\n    source: 'experiments/outputs/e_q14_results.json',"),
  },
  {
    id: 'P9-verdict-row-mutated', suite: 'probe_gate',
    clause: 'PG6 data-vs-verdict-row agreement — a sealed verdict row\'s arithmetic field must match the recomputed headline (also trips PG1: hash integrity — overlapping detection, receipted)',
    what: 'receipts/e_q13_chain.jsonl: verdict.EQ13 row medianGainPct "47.4026%" -> "47.5026%"',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'receipts/e_q13_chain.jsonl', '"medianGainPct":"47.4026%"', '"medianGainPct":"47.5026%"'),
  },
  {
    id: 'P10-results-arithmetic-mutated', suite: 'probe_gate',
    clause: 'PG6 data-vs-claims recomputation — the sealed RESULTS file is not hash-chained; PG6 is the only checker of its arithmetic (the discriminating probe)',
    what: 'experiments/outputs/e_q13_results.json: trials[0].gainStr "47.3988%" -> "47.4988%"',
    predict: 'DETECTED',
    apply: (ws) => editJson(ws, 'experiments/outputs/e_q13_results.json', (d) => {
      if (!Array.isArray(d.trials) || d.trials.length !== 20) die('P10: unexpected e_q13 trials shape');
      const t = d.trials[0];
      if (t.seed !== 66001 || t.gainStr !== '47.3988%') die(`P10: trial[0] unexpected: ${JSON.stringify({ seed: t.seed, gainStr: t.gainStr })}`);
      t.gainStr = '47.4988%';
    }, 'trials[0].gainStr flip'),
  },
  // ── run_tests (LAYER 0) ───────────────────────────────────────────────────
  {
    id: 'R1-fixture-literal-flipped', suite: 'run_tests',
    clause: 'pre-registered literal comparison (G4-P2) — the suite must actually compare kernel output against the pre-registered expected literals (a flipped literal must FAIL, proving the gate is not vacuous)',
    what: 'tests/run_tests.mjs copy: G4-P2 expected row1 literal re:35 -> re:34 (a plausible wrong hand-arithmetic)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'tests/run_tests.mjs', '{ re: 35, im: 8 }', '{ re: 34, im: 8 }'),
  },
  {
    id: 'R2-gate-block-removed', suite: 'run_tests',
    clause: 'gate coverage — the suite rewrites its own receipt chain (tests/receipts.jsonl) with whatever gates ran; is a REMOVED gate noticed?',
    what: 'tests/run_tests.mjs copy: delete the entire G1 (pack/unpack bijection) gate block',
    predict: 'DETECTED (amended at the ORCH-R14 closure: the gate-set pin now fails the run loudly on a removed gate via exit-code regression; the ORIGINAL pre-closure prediction SURVIVED stands receipted in situations/negctl/run_receipt.txt v1)',
    apply: (ws) => {
      const rel = 'tests/run_tests.mjs';
      const p = join(ws, rel);
      const src = readFileSync(p, 'utf8');
      const a = '// ── G1: pack/unpack bijection';
      const b = '// ── G2: bounds invariance by exhaustion';
      const ia = src.indexOf(a); const ib = src.indexOf(b);
      if (ia < 0 || ib < 0 || ib <= ia) die(`R2: gate markers not found/ordered in ${rel} (ia=${ia} ib=${ib})`);
      if (src.indexOf(a, ia + 1) !== -1 || src.indexOf(b, ib + 1) !== -1) die(`R2: gate markers not unique in ${rel}`);
      const removed = src.slice(ia, ib);
      if (!removed.includes('G1') || !removed.includes('pack')) die('R2: removed block does not look like the G1 gate');
      const after = src.slice(0, ia) + src.slice(ib);
      if (after === src) die('R2: block removal was a no-op');
      writeFileSync(p, after, 'utf8');
      if (readFileSync(p, 'utf8') !== after) die('R2: block removal did not land');
    },
  },
  {
    id: 'R3-kernel-psi-mutated', suite: 'run_tests',
    clause: 'G1 — Psi map pinned as [0, 1, -1, \'i\'] (kernel-side sabotage: the SUITE must catch a wrong kernel)',
    what: 'qthe.mjs copy: PSI[2] -1 -> 1 (Repel loses its sign)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs', "export const PSI = [0, 1, -1, 'i'];", "export const PSI = [0, 1, 1, 'i'];"),
  },
  {
    id: 'R4-kernel-nextD-bounds-broken', suite: 'run_tests',
    clause: 'G2 — bounds invariance by exhaustion: every nextD(d, p) result must lie in [0,63] (isolated: the sabotage fires only at the decimal pressure -1.585, which tick dynamics cannot produce — log2(3) is irrational)',
    what: 'qthe.mjs copy: nextD returns 64 (out of bounds) when pressure === -1.585',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs',
      'export function nextD(d, pressure) {',
      'export function nextD(d, pressure) {\n  if (pressure === -1.585) return 64; // negctl-T5c sabotage: bounds broken at a G2-only pressure'),
  },
  {
    id: 'R5-kernel-nondeterministic', suite: 'run_tests',
    clause: 'G3 — determinism seed-to-hash: same seed must give byte-identical 1000-tick traces across fresh constructions',
    what: 'qthe.mjs copy: module-global tick counter XORs cell 0 every tick from local tick 400 onward, only on runs after the first 1000 global ticks (G3\'s A2 drifts away from A1 at EVERY tick; G5/G6 tick < 400 so stay exact)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs',
      'const n = w * h;',
      'const n = w * h;\n  globalThis.__negctl_ticks = (globalThis.__negctl_ticks | 0) + 1;\n  if (cells.ticks >= 400 && globalThis.__negctl_ticks > 1000) cells[0] = (cells[0] ^ 1) & 0xff;'),
  },
  {
    id: 'R6-kernel-vectorPass-sign-flip', suite: 'run_tests',
    clause: 'G4/G4-P2 — split-channel exactness vs hand-computed literals (kernel-side: Repel must subtract)',
    what: 'qthe.mjs copy: vectorPass case 2 (Repel) re -= dv * x -> re += dv * x',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs', 'case 2: re -= dv * x; break;', 'case 2: re += dv * x; break;'),
  },
  {
    id: 'R7-kernel-wormhole-resonance-broken', suite: 'run_tests',
    clause: 'G5 — pinned twin-resonance schedule: written resonance must be |real_acc|+1, term === log2(3), totalWrites === 12',
    what: 'qthe.mjs copy: table.write resonance Math.abs(acc) + 1 -> Math.abs(acc) + 2',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs', 'table.write(d, x, y, Math.abs(acc) + 1);', 'table.write(d, x, y, Math.abs(acc) + 2);'),
  },
  {
    id: 'R8-kernel-wormhole-flag-leak', suite: 'run_tests',
    clause: 'G6-S2 (R7 law) — the wormhole flag must not leak into non-Abstain dynamics (no Abstain cells -> ON and OFF arms byte-identical)',
    what: 'qthe.mjs copy: non-Abstain cells feel a +0.001 pressure nudge when wormholes are OFF (Abstain cells and ON arms untouched, so G5 stays exact)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'qthe.mjs',
      'cells[i] = (tau << 6) | nextD(d, pressure);',
      'cells[i] = (tau << 6) | nextD(d, tau === 3 || wormholes ? pressure : pressure + 0.001);'),
  },
  {
    id: 'R9-demo-sha256-broken', suite: 'run_tests',
    clause: 'G0 — demo-sha256 cross-substrate agreement: the pure-JS digest must match the published vectors and stone\'s node:crypto sha256Hex',
    what: 'demo/sha256.mjs copy: first SHA-256 round constant 0x428a2f98 -> 0x428a2f99 (every digest changes)',
    predict: 'DETECTED',
    apply: (ws) => editFile(ws, 'demo/sha256.mjs', '0x428a2f98, 0x71374491', '0x428a2f99, 0x71374491'),
  },
];

// ── pre-flight: freeze a clean snapshot; refuse if the SUITE-CONSUMED tree is dirty ──
let HEAD = '';
{
  const head = spawnSync('git', ['-C', REAL_ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  const status = spawnSync('git', ['-C', REAL_ROOT, 'status', '--porcelain'], { encoding: 'utf8' });
  if (head.status !== 0 || status.status !== 0) die('git pre-flight failed (read-only git is required)');
  HEAD = head.stdout.trim();
  const lines = (status.stdout ?? '').split('\n').filter((l) => l.trim() !== '');
  const untracked = lines.filter((l) => l.startsWith('??'));
  const modified = lines.filter((l) => !l.startsWith('??'));
  const critical = modified.filter((l) => {
    const path = l.slice(3).trim();
    return CRITICAL_PREFIXES.some((p) => path === p || path.startsWith(p));
  });
  if (critical.length) die(`suite-consumed files are modified vs HEAD — baseline would be untrustworthy: ${JSON.stringify(critical)}`);
  // freeze the snapshot ONCE (repo minus .git minus pycache)
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(SNAPSHOT, { recursive: true });
  cpSync(REAL_ROOT, join(SNAPSHOT, 'qthe'), {
    recursive: true,
    filter: (src) => {
      const rel = src.slice(REAL_ROOT.length);
      if (rel === '/.git' || rel.startsWith('/.git/')) return false;
      if (rel === '/situations/__pycache__' || rel.startsWith('/situations/__pycache__/')) return false;
      return true;
    },
  });
  cpSync(REAL_STONE, join(SNAPSHOT, 'quilt-stone'), { recursive: true });
  out(`negctl_qthe — T5-c sabotage negative controls (ORCH-R14)`);
  out(`repo: ${REAL_ROOT} @ ${HEAD.slice(0, 12)}`);
  out(`pre-flight: zero modifications to suite-consumed files (qthe.mjs, demo/, tests/, scripts/, experiments/, receipts/, crossimpl/, fixedpoint/);`);
  out(`  git status traffic receipted: ${modified.length} modified + ${untracked.length} untracked path(s), all OUTSIDE the consumed set`);
  out(`  (concurrent lanes T5-a/T5-b work in situations/ + docs/ — file-disjoint; the snapshot below is frozen so drift cannot contaminate the control)`);
  out(`snapshot: ${SNAPSHOT} (frozen once; every workspace below is copied from it)`);
  out(`workspace: ${WS} (recreated clean per run; real files never edited)`);
  out(`doctrine: a suite that cannot fail is not evidence — sabotage, require the suite to notice, restore.`);
}

// ── (a) baseline: refuse to run unless every suite is GREEN ─────────────────
out(`\n${'═'.repeat(78)}\nBASELINE (fresh workspace; all three suites must be GREEN or the control refuses)\n${'═'.repeat(78)}`);
const BASE = {};
{
  const ws = freshWorkspace('baseline');
  for (const suite of Object.keys(SUITES)) {
    const r = runSuite(ws, suite);
    BASE[suite] = { code: r.code, failures: r.failures };
    out(`\n--- baseline ${suite} :: exit=${r.code} failures=${r.failures} (${r.ms} ms) ---`);
    out(r.text.trimEnd());
    if (r.code !== 0) die(`baseline is NOT GREEN for ${suite} (exit ${r.code}) — nothing to compare against; refusing to run`);
    if (suite === 'run_tests' && r.failures !== 1) die(`run_tests baseline expected exactly the 1 registered G4 letter-fail, found ${r.failures}`);
    if (suite !== 'run_tests' && r.failures !== 0) die(`${suite} baseline expected 0 failures, found ${r.failures}`);
  }
}
out(`\nbaseline receipted GREEN: run_tests (G4 letter-fail by design, post-hoc vindicated), verify_all_chains ALL CLEAN, probe_gate PROBE-GATE PASS.`);

// ── (b-d) one sabotage per clause ───────────────────────────────────────────
out(`\n${'═'.repeat(78)}\nSABOTAGES (one clause each: apply to a temp copy -> require MORE failures than baseline -> re-copy clean -> require GREEN)\n${'═'.repeat(78)}`);
const results = [];
for (const sab of SABOTAGES) {
  out(`\n── ${sab.id} :: suite=${sab.suite}`);
  out(`   clause: ${sab.clause}`);
  out(`   sabotage: ${sab.what}`);
  out(`   predicted: ${sab.predict}`);
  const base = BASE[sab.suite];
  let applied = false;
  try {
    const ws = freshWorkspace(sab.id);
    sab.apply(ws); // every primitive dies loudly on a no-op / stale anchor
    applied = true;
    const r = runSuite(ws, sab.suite);
    // ORCH-R14 closure-proof amendment (receipted): detection = MORE failure
    // lines than baseline (the original rule) OR an exit-code regression
    // 0 -> nonzero. The gate-set pin (T5-c R2 closure) fails the RUN loudly
    // without emitting a new gate FAIL line — exit 0->1 IS the suite noticing.
    const detected = (r.failures > base.failures && r.code !== 0) || (base.code === 0 && r.code !== 0 && r.failures === base.failures && r.fails.length === base.fails.length);
    const verdict = detected ? 'DETECTED' : 'SURVIVED';
    out(`   sabotaged run: exit=${r.code} failures=${r.failures} (baseline ${base.failures}, ${r.ms} ms) -> ${verdict}`);
    if (r.fails.length) { out('   failing lines:'); for (const f of r.fails) out(`     ${f}`); }
    if (!detected && r.code === 0) out(`   !! the suite stayed GREEN under this sabotage — it is not evidence for the clause above`);
    if (r.failures > base.failures && r.code === 0) out(`   !! ANOMALY: more failures but exit 0`);
    // (d) restore: re-copy clean, re-run, require green
    const ws2 = freshWorkspace(`${sab.id} [restore]`);
    const rr = runSuite(ws2, sab.suite);
    const restored = rr.code === 0 && rr.failures === base.failures;
    out(`   restore (clean re-copy): exit=${rr.code} failures=${rr.failures} (${rr.ms} ms) -> ${restored ? 'GREEN' : 'NOT GREEN'}`);
    if (!restored) die(`restore failed for ${sab.id} — the workspace protocol is contaminated (exit=${rr.code} failures=${rr.failures})`);
    const surprise = !sab.predict.startsWith(verdict);
    if (surprise) out(`   !! PREDICTION MISMATCH: code-reading said ${sab.predict}, the run says ${verdict} — receipted`);
    results.push({ ...sab, verdict, exit: r.code, failures: r.failures, surprise });
  } catch (e) {
    out(`   HARNESS FAILURE during ${sab.id}: ${e.message}`);
    out(`   (a failed apply/run is fail-closed: a stale anchor is the no-op disease — the control aborts)`);
    results.push({ ...sab, verdict: 'HARNESS-FAILURE', exit: null, failures: null, surprise: true });
    die(`sabotage ${sab.id} could not be applied/run cleanly; aborting`);
  }
}

// ── summary ─────────────────────────────────────────────────────────────────
out(`\n${'═'.repeat(78)}\nSUMMARY\n${'═'.repeat(78)}`);
const bySuite = {};
for (const r of results) {
  bySuite[r.suite] ??= { total: 0, detected: 0, survived: 0 };
  bySuite[r.suite].total++;
  if (r.verdict === 'DETECTED') bySuite[r.suite].detected++; else bySuite[r.suite].survived++;
}
out(`  suite                 sabotages  detected  survived`);
for (const [s, c] of Object.entries(bySuite)) out(`  ${s.padEnd(22)}${String(c.total).padStart(6)}${String(c.detected).padStart(10)}${String(c.survived).padStart(10)}`);
const tot = { total: results.length, detected: results.filter((r) => r.verdict === 'DETECTED').length };
out(`  ${'TOTAL'.padEnd(22)}${String(tot.total).padStart(6)}${String(tot.detected).padStart(10)}${String(tot.total - tot.detected).padStart(10)}`);
out('');
for (const r of results) out(`  ${r.verdict.padEnd(9)} ${r.id.padEnd(34)} (${r.suite})${r.surprise ? '  [PREDICTION MISMATCH]' : ''}`);
const survivors = results.filter((r) => r.verdict !== 'DETECTED');
if (survivors.length) {
  out(`\nSURVIVED SABOTAGES (the honest headline — these suites are NOT evidence for these clauses):`);
  for (const s of survivors) out(`  - ${s.id} (${s.suite}) :: ${s.clause}`);
} else {
  out(`\nall sabotages detected; suites restored`);
}
out(`\nreceipt: situations/negctl/run_receipt.txt (this verbatim log) + situations/negctl/negctl.md (the table + hole analysis)`);
out(`real repo tree untouched (workspace-only sabotage; verify with: git -C ${REAL_ROOT} status --short)`);
process.exit(tot.detected === tot.total ? 0 : 1);
