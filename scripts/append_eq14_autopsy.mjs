// scripts/append_eq14_autopsy.mjs — append the B3 autopsy row to the sealed
// E-Q14 chain (append-only ledger; the honest FAIL stays standing, the
// explanation lands beside the body, per house law).
import { linkStone } from '../experiments/_stone_link.mjs';
import { appendAndVerify, fileSha256 } from '../experiments/_harness.mjs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAIN = join(HERE, '..', 'receipts', 'e_q14_chain.jsonl');

const { stone } = await linkStone();
const autopsySha = fileSha256(join(HERE, '..', 'experiments', 'e_q14_b3_autopsy.mjs'));

const rows = [
  { kind: 'autopsy.EQ14_B3', experiment: 'E-Q14',
    fired_floor: 'B3 (zero-pollution cleanliness): pollution fraction == 0 at nPoll=0 — FALSIFIED (observed ~0.94 median)',
    false_assumption: 'B3 encoded the assumption that pair slots are PRIVATE under zero pollution. The run falsified it.',
    mechanism: '(1) instrumentation verified correct: at t=1 all 8 pair events are PARTNER events (the sequential slot+resonance provenance matching works). (2) the 16 members form a CLIMBING CONVOY on adjacent d-tracks — planting assigns consecutive d 8..15, members climb ~1/tick with a one-tick role phase offset (row-major later member hears the same-tick write and climbs first), so cross-pair slot sharing begins at t=2 and partner events decay 6/tick -> 1/tick as the convoy compresses. (3) from t~55 ALL members saturate at d=63: slot 63 becomes a permanent shared party line; partner events = 0 for the remainder of the run (E-Q1 finalsMin=finalsMax=63 corroborates). (4) consequence: the wormhole table is CONTENT-addressed, not identity-addressed — any occupant with resonance != 0 fires the reader.',
    boundary_map_entry: 'DELIVERY is congestion-ROBUST (B2 held: 80/80 pair-trials delivered 8/8 at 256 polluters; any positive term delivers). PROVENANCE is congestion-FRAGILE (zero-pollution pollution fraction 0.94 from convoy compression + saturation rail). Downstream rule: if a consumer needs WHO, d must be assigned with separation margins and drift control (64 slots, 16 members at +-1/tick WILL collide); if a consumer needs only SIGNAL, congestion is harmless.',
    probe_artifact: 'experiments/e_q14_b3_autopsy.mjs', probe_sha256: autopsySha,
    honest_status: 'B3 FAIL stands; the finding upgrades the boundary map; no floor was edited post-run' },
];

const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q14', claim: 'adversarial-probe-family' });
console.log(`autopsy appended; chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(HERE, '..', 'experiments', 'outputs', 'e_q14_tip.txt'), `${v.tip} links=${v.links}\n`);
