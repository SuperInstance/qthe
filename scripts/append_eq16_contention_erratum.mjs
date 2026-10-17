// scripts/append_eq16_contention_erratum.mjs — append the contentionMonotone
// string-comparison erratum to the sealed E-Q16 chain. Append-only: the ledger
// grows, nothing is edited (same law as append_eq16_erratum.mjs).
//
// Origin: PG6 verdict-recompute, FIRST RUN (ORCH-2b) — ling31f's round-10
// reasoning made operational ("the gates prove integrity, not soundness"), and
// the first soundness pass found exactly the predicted class, live:
//
// DEFECT: experiments/e_q16_measurement_wave.mjs computed
//   contentionMonotone = scaleRows[0].contentionWritesPerSlot
//                        <= scaleRows[1].contentionWritesPerSlot && …
// on q()-STRINGIFIED numbers ("353.57", "1387.5", "5874.11" — the chain-safety
// convention stringifies non-integers). JS compares those LEXICOGRAPHICALLY:
// "353.57" <= "1387.5" is FALSE ('3' > '1'), so the sealed aggregate is false
// and BOTH verdict.EQ16 rows read "CONTENTION NOT MONOTONE — autopsy" — while
// the sealed scaling data IS strictly monotone increasing. The DATA rows are
// correct and stand; the AGGREGATE is the defect. The same latent class sat in
// e_q14's B1 (pfMed string compare), benign there only because the digit
// patterns happened to sort correctly; both runners now parse to numbers
// before comparing (fixed in this commit, cited here).
import { linkStone } from '../experiments/_stone_link.mjs';
import { appendAndVerify } from '../experiments/_harness.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAIN = join(HERE, '..', 'receipts', 'e_q16_chain.jsonl');
const KIND = 'erratum.EQ16_contention_string_compare';

const { stone } = await linkStone();
const rows = readFileSync(CHAIN, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

// refuse-if-not-applicable (fail-loud, never a blind append):
// (1) idempotency — this erratum must already exist? then refuse.
if (rows.some((r) => r.kind === KIND)) throw new Error(`${KIND} already exists — refusing to double-append`);
// (2) the defect state must be present — the authoritative (run-2, LAST)
//     result.C row must carry contentionMonotone:false while its OWN scaling
//     data is strictly monotone increasing as numbers.
const resultC = rows.filter((r) => r.kind === 'result.C');
const authoritative = resultC[resultC.length - 1];
if (!authoritative) throw new Error('no result.C row found — chain shape unexpected, refusing to guess');
const vals = authoritative.scaling.map((r) => parseFloat(r.contentionWritesPerSlot));
if (authoritative.contentionMonotone !== false) throw new Error(`authoritative result.C contentionMonotone is ${authoritative.contentionMonotone}, expected false (the defect state) — nothing to erratum`);
if (!(vals[0] < vals[1] && vals[1] < vals[2])) throw new Error(`scaling data ${vals.join(' -> ')} is NOT strictly monotone — the sealed aggregate may be right after all, refusing to erratum`);
const asStrings = authoritative.scaling.map((r) => String(r.contentionWritesPerSlot));
if (asStrings[0] <= asStrings[1] && asStrings[1] <= asStrings[2]) throw new Error('string comparison of the sealed values is monotone — the string-compare theory does not explain the defect, refusing to erratum');

const erratum = {
  kind: KIND, experiment: 'E-Q16',
  origin: 'PG6 verdict-recompute first run (ORCH-2b) — ling31f r10 reasoning operational: integrity ≠ soundness',
  defect: 'contentionMonotone compared q()-stringified numbers lexicographically: "353.57" <= "1387.5" is FALSE as strings (3 > 1), so the aggregate sealed false and both verdict.EQ16 rows read "CONTENTION NOT MONOTONE — autopsy" while the sealed scaling data is strictly monotone increasing',
  erratum: {
    sealed_contention_writes_per_slot: asStrings,
    recomputed_strictly_monotone_increasing: true,
    sealed_aggregate_contentionMonotone: false,
    affected_rows: 'both result.C rows (run-1 and run-2) and both verdict.EQ16 rows carry the defective aggregate; superseded by this erratum for the monotonicity question only — the scaling DATA rows are correct and stand',
    correction: 'the runner now parses to numbers before comparing (same fix applied to the latent e_q14 B1 string-compare); nothing was edited or removed (append-only law)',
  },
};

const v = await appendAndVerify(stone, CHAIN, [erratum], { experiment: 'E-Q16', claim: 'measurement-wave' });
console.log(`erratum appended :: ${KIND}`);
console.log(`data [${asStrings.join(' < ')}] strictly monotone as numbers; sealed aggregate was false via string compare`);
console.log(`chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(HERE, '..', 'experiments', 'outputs', 'e_q16_tip.txt'), `${v.tip} links=${v.links}\n`);
