// scripts/_eq18_erratum.mjs — append the EQ18 double-seal erratum (append-only law).
// Cause: the r18 runner's first full invocation completed its chain seal, then
// crashed POST-seal on `tip.slice` (appendAndVerify returns a verdict object,
// not a tip string); the re-run re-sealed the identical row set. The two sealed
// sets are byte-identical (same code, deterministic task — F0 held 80/80), so
// the duplicates carry no information conflict; this row receipts the event
// and names the fix (v.tip/v.links, the E-Q17 tail pattern).
import { writeFileSync } from 'node:fs';
import { linkStone } from '../experiments/_stone_link.mjs';
import { appendAndVerify } from '../experiments/_harness.mjs';
import { fileSha256 } from '../experiments/_harness.mjs';

const CHAIN = 'receipts/e_q18_chain.jsonl';
const { stone, stonePath } = await linkStone();
const tip = await appendAndVerify(stone, CHAIN, [{
  kind: 'erratum.EQ18_double_seal',
  experiment: 'E-Q18',
  cause: 'runner crashed post-seal on tip.slice (appendAndVerify returns {ok, tip, links, ...}, not a string); the re-run appended the full row set a second time before the fix',
  evidence: 'rows 1..127 = header + set 1 (config/controls/120 runs/aggregate/verdict); rows 128..253 = set 2, byte-identical content (deterministic task, F0 80/80; identical row_hash values)',
  harm: 'none — duplicate identical rows; the chain verifies end-to-end (appendAndVerify verify-from-disk passed on the second seal)',
  fix: 'runner tail now uses v.tip/v.links (the E-Q17 pattern, e_q17_provenance_scale.mjs:374-375)',
  results_file_sha256: fileSha256('experiments/outputs/e_q18_results.json'),
}], { experiment: 'E-Q18' });
console.log('erratum appended; tip', tip.tip, 'links', tip.links);
