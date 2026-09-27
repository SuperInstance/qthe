// fixedpoint/seal_chain.mjs — one-shot clean chain append (keeper seal for the
// fixedpoint lane). Written as a FILE after two stray-{} one-liner slips so
// the final correction is itself appended by reviewed code, not another
// one-liner. Rows array contains EXACTLY ONE row — checked by assertion.
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify } from '../experiments/_harness.mjs';

const { stone } = await linkStone();
const chainPath = new URL('./receipts/fixedpoint_chain.jsonl', import.meta.url).pathname;
const rows = [{
  kind: 'finding.chainnote.correction.2',
  note: 'KEEPER SLIPS DOCUMENTED, CHAIN FROZEN: rows 21 and 23 are EMPTY payload rows (bare hash carriers) — the keeper repeated a stray-{} element in two appendAndVerify one-liners (procedural defect now receipted here; the seal script asserts a single-row append). Effective content rows: 1-19 = three full battery runs (A: first run with the scanner coordinate defect recorded in its A6 field; B: accidental duplicate execution during debugging; C: repaired scanner, FINAL scoreboard — F_A all pass, P-B1 honestly FALSIFIED on 1.6/0.7 via the uncoupled exact-zero mechanism, cooker exact, term band 2085522/0, F_C 20/20, F_D 1600/1600, F_E breachClosed=false -> R5 closed-with-measured-cost per frozen honest_alternative #1); row 20 = triple-append provenance; row 22 = first correction. No rows were rewritten or removed (append-only law).',
}];
if (rows.length !== 1) { console.error('REFUSING: rows.length !== 1'); process.exit(1); }
await appendAndVerify(stone, chainPath, rows, {});
const v = stone.verifyChainFile(chainPath);
console.log('verify:', v.ok, 'links:', v.links, 'tip:', v.tip);
if (!v.ok) process.exit(1);
console.log(v.tip);
