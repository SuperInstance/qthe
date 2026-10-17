// scripts/replay.mjs — ORCH-38: deterministic replay of a sealed trace.
// Takes a traceView JSON (the REPL's `save`, or any experiment's traceView
// dump), rebuilds the substrate, re-executes the recorded tick count, and
// verifies the plane hash at every checkpoint. A trace that cannot replay
// byte-identically is not sealed evidence — it is a rumor.
// Usage: node scripts/replay.mjs <trace.json> [extraTicks]
import { readFileSync } from 'node:fs';
import { makeSubstrate, tick } from '../experiments/_adapter.mjs';
import { planeHash } from '../experiments/_harness.mjs';
await import('../experiments/_adapter.mjs').then(async (m) => await m.loadKernel());
const path = process.argv[2];
if (!path) { console.error('usage: node scripts/replay.mjs <trace.json> [extraTicks]'); process.exit(2); }
const view = JSON.parse(readFileSync(path, 'utf8'));
const extra = Number(process.argv[3] ?? 0);
let sub = makeSubstrate(view.w, view.h, (x, y, i) => view.cells[i]);
const h0 = planeHash(sub, 0, (s) => s);
let ok = true;
for (let t = 1; t <= view.ticks + extra; t++) {
  sub = tick(sub, {});
  if (t === view.ticks) {
    const hN = planeHash(sub, view.ticks, (s) => s);
    const recorded = view.finalPlaneHash ?? null;
    console.log(`replay@${view.ticks}: plane hash ${hN.slice(0, 16)}… ${recorded ? (recorded === hN ? '== recorded ✓' : '!= recorded ✗ BROKEN') : '(no recorded hash in trace — determinism still checkable by rerun)'}`);
    if (recorded && recorded !== hN) ok = false;
  }
}
// rerun determinism witness
let sub2 = makeSubstrate(view.w, view.h, (x, y, i) => view.cells[i]);
for (let t = 1; t <= view.ticks + extra; t++) sub2 = tick(sub2, {});
const same = planeHash(sub, view.ticks + extra, (s) => s) === planeHash(sub2, view.ticks + extra, (s) => s);
console.log(`initial plane: ${h0.slice(0, 16)}… (${view.w}x${view.h}, ${view.cells.length} cells, recorded ticks ${view.ticks}${extra ? ` + ${extra} extra` : ''})`);
console.log(`fresh-rerun byte-identity: ${same ? 'HELD' : 'BROKEN'}`);
process.exit(ok && same ? 0 : 1);
