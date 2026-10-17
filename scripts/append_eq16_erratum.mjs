// scripts/append_eq16_erratum.mjs — append the run-1 supersession erratum to
// the sealed E-Q16 chain. Append-only: the ledger grows, nothing is edited.
//
// Origin: arena round 10, seat mimov26f finding F5, verified by the
// orchestrator — the in-run correction row (kind correction.EQ16) identified
// the run-1 generation in PROSE only ("run 1 rows stand beside this
// correction"); no machine-readable linkage named WHICH rows are superseded.
// A downstream auditor diffing the chain could not mechanically separate
// run-1 (harness defect: seedFn closures consumed rng at call time) from
// run-2 (post-fix, authoritative). This erratum adds that linkage.
import { linkStone } from '../experiments/_stone_link.mjs';
import { appendAndVerify } from '../experiments/_harness.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAIN = join(HERE, '..', 'receipts', 'e_q16_chain.jsonl');

const { stone } = await linkStone();
const rows = readFileSync(CHAIN, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

// Run-1 generation = FIRST occurrence of each duplicated kind: the runner
// appended run 2 after the in-run fix, so every run-kind appears in pairs
// (run-1 then run-2). The stone header, the correction row, and this erratum
// are singleton kinds and are excluded by the duplication requirement.
const seen = new Set();
const run1 = [];
rows.forEach((r, i) => {
  const k = r.kind ?? '?';
  if (k === 'stone.header' || k.startsWith('correction') || k.startsWith('erratum')) return;
  if (!seen.has(k)) { seen.add(k); run1.push(i); }
});
if (run1.length === 0) throw new Error('no duplicated kinds found — chain shape unexpected, refusing to guess');

const detFalse = rows.map((r, i) => [i, r]).filter(([, r]) => r.determinism === false).map(([i]) => i);

const erratum = {
  kind: 'erratum.EQ16_run1_supersession', experiment: 'E-Q16',
  origin: 'arena round 10 (ORCH-R10), seat mimov26f finding F5, verified by the orchestrator against this chain',
  gap: 'the correction row named the run-1 generation in prose only; no machine-readable field said which rows are superseded',
  erratum: {
    superseded_row_indexes_zero_based: run1,
    superseded_kinds: run1.map((i) => rows[i].kind),
    rows_carrying_determinism_false: detFalse,
    authoritative_rows: 'the SECOND occurrence of each duplicated kind (run 2, post-fix) plus the correction row',
    law: 'append-only: nothing was edited or removed; this row adds the linkage the correction lacked',
  },
};

const v = await appendAndVerify(stone, CHAIN, [erratum], { experiment: 'E-Q16', claim: 'measurement-wave' });
console.log(`erratum appended; run-1 rows named: ${run1.join(',')} | determinism:false rows: ${detFalse.join(',') || 'none'}`);
console.log(`chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(HERE, '..', 'experiments', 'outputs', 'e_q16_tip.txt'), `${v.tip} links=${v.links}\n`);
