// fixedpoint/cost_benchmark_addendum.mjs — ORCH-6 supplement: the coupled-2/3
// re-verification inside cost_benchmark.mjs used the twin-delivery workload,
// which never produces the coupled (reader acc=-2, writer r=3) configuration
// (weather cells sit >= 10 away; pair members have acc == 0). The original
// F_B P-B3 verified the 2/3 divergence on RANDOM substrates (8/8, ticks 3-17).
// This addendum mirrors P-B3's design on this machine and appends the
// supplementary row (append-only; the null-tick row stands as sealed).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as FLOAT from '../experiments/_adapter.mjs';
import * as FIXED from './qthe_fixed.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, q } from '../experiments/_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHAIN = join(HERE, 'receipts', 'fixedpoint_chain.jsonl');
await FLOAT.loadKernel();
const { stone } = await linkStone();

// P-B3-style random substrate: 24x16, seeded random bytes, T=20, sigma 2/3
const W = 24, H = 16, T = 20;
const results = [];
for (const seed of [34001, 34002, 34003, 34004, 34005, 34006, 34007, 34008]) {
  const rng = FLOAT.mulberry32(seed);
  const seedFn = () => Math.floor(rng() * 256);
  let sf = FLOAT.makeSubstrate(W, H, seedFn);
  let sq = FIXED.makeSubstrate(W, H, () => 0);
  // rebuild the fixed substrate from the SAME initial plane (deterministic)
  {
    const init = Uint8Array.from(sf);
    sq = FIXED.makeSubstrate(W, H, (x, y, i) => init[i]);
  }
  let firstDiv = null;
  for (let t = 1; t <= T && firstDiv === null; t++) {
    sf = FLOAT.tick(sf, { sigma: 2 / 3 });
    sq = FIXED.tick(sq, { sigmaQ: 2863311531 });
    if (planeHash(sf, t, FLOAT.bytePlane) !== planeHash(sq, t, () => sq)) firstDiv = t;
  }
  results.push({ seed, firstDiv: q(firstDiv) });
  console.log(`[cost+] seed=${seed} firstDivergenceTick=${firstDiv}`);
}
const diverged = results.filter((r) => r.firstDiv !== null).length;
writeFileSync(join(HERE, 'outputs', 'cost_benchmark_addendum.json'), JSON.stringify({ addendum: 'coupled-2/3 on P-B3-style random substrates', results, divergedOf: `${diverged}/8` }, null, 1));

const rows = [{ kind: 'cost_benchmark.ORCH6.supplement',
  why: 'the twin-delivery workload cannot produce the coupled (acc=-2, r=3) configuration (weather >= 10 away, members acc == 0), so its coupled-2/3 check was vacuously null — workload-coverage note, not a kernel finding',
  design: 'P-B3 style: 24x16 seeded random substrates, 8 seeds, T=20, float sigma 2/3 vs fixed sigmaQ 2863311531',
  diverged: `${diverged}/8`, firstTicks: results.map((r) => r.firstDiv),
  verdict: diverged > 0 ? 'coupled-2/3 divergence REPRODUCED on this machine (P-B3 record stands)' : 'NO divergence on random substrates either — escalates to autopsy against the sealed P-B3 record' }];
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'fixedpoint', claim: 'R8' });
console.log(`[cost+] chain ok links=${v.links} tip=${v.tip}`);
