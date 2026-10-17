// tests/determinism_attacks.mjs — ORCH-20: the negative-control suite that
// DELIBERATELY tries to break determinism and documents every failure mode.
// Each attack asserts the EXPECTED outcome; a surprise is a kernel defect
// finding (fail-loud, receipted in the output). This suite makes the
// determinism law adversarial instead of aspirational.
import { makeSubstrate, tick, pack, traceView, WormholeTable, mulberry32 } from '../qthe.mjs';
import { createHash } from 'node:crypto';
const sha = (s) => createHash('sha256').update(Buffer.from(s)).digest('hex');
const planeHash = (sub, t) => sha(`${sub.w}x${sub.h}@t=${t}:` + Buffer.from(sub).toString('hex'));
let fail = 0, attacks = 0;
const attack = (name, pass, detail) => { attacks++; console.log(`${pass ? 'HELD ' : 'BROKE'} ${name} :: ${detail}`); if (!pass) fail++; };
const twins = () => makeSubstrate(16, 16, (x, y) => ((x === 3 && y === 3) || (x === 12 && y === 12)) ? pack(3, 20) : 0);

// A1: expandos stripped — a plain Uint8Array is NOT a substrate; tick must refuse loudly
try {
  const raw = new Uint8Array(256); raw.w = undefined;
  tick(raw, {});
  attack('A1 expando-stripped substrate refused', false, 'tick() accepted a non-substrate — silent corruption path');
} catch (e) {
  attack('A1 expando-stripped substrate refused', /not a substrate/.test(e.message), `threw: ${e.message}`);
}

// A2: FULL-HULL round-trip — the hull is plane + table (the doctrine);
// restoring only the bytes is deliberately shown to DIVERGE (the table is
// live state), then restoring the table too is shown to reproduce exactly.
{
  const a = twins();
  for (let t = 0; t < 20; t++) tick(a, {});
  const view = traceView(a);
  // (i) bytes-only rebuild: reproduces the plane bytes...
  const bytesOnly = makeSubstrate(view.w, view.h, (x, y, i) => view.cells[i]);
  const bytesSame = planeHash(bytesOnly, 20) === planeHash(a, 20);
  // ...but DIVERGES under further ticks when the twins' slot went live
  for (let t = 0; t < 20; t++) tick(bytesOnly, {});
  const c = twins();
  for (let t = 0; t < 40; t++) tick(c, {});
  const planeOnlyDiverges = planeHash(bytesOnly, 40) !== planeHash(c, 40);
  // (ii) full-hull rebuild: plane + table restored from the view
  const full = makeSubstrate(view.w, view.h, (x, y, i) => view.cells[i]);
  if (view.wormholes) {
    const t = new WormholeTable();
    for (const s of view.wormholes) if (s) t.write(s.slot, s.x, s.y, s.resonance);
    for (let k = 0; k < 20; k++) tick(full, { table: t });
  } else for (let k = 0; k < 20; k++) tick(full, {});
  attack('A2 full-hull round-trip (plane + table)', bytesSame && planeOnlyDiverges && planeHash(full, 40) === planeHash(c, 40),
    `bytes reproduce; plane-only round-trip diverges (table is live state — the doctrine's point); full-hull round-trip == fresh@40 (${planeHash(c, 40).slice(0, 10)}…)`);
}

// A3: opts must not leak state between calls; and per the kernel's own R3
// receipt (confirmed by E-Q2), sigma enters dynamics ONLY through pressure
// SIGN — on the twins class (acc=0) differing sigmas are evolution-INERT,
// which is a STRONGER determinism statement than mere reproducibility.
{
  const a = twins(), b = twins();
  const opts = { sigma: 2 };
  tick(a, opts); tick(b, opts);
  opts.sigma = 0.5; // mutate the CALLER's object after both used it
  const h1a = planeHash(a, 1), h1b = planeHash(b, 1);
  tick(a, { sigma: 2 }); tick(b, {}); // now genuinely different sigma paths
  attack('A3 opts mutation does not retroact (and sigma is sign-only)', h1a === h1b && planeHash(a, 2) === planeHash(b, 2),
    't=1 identical under shared-then-mutated opts; t=2 identical under DIFFERENT sigmas — R3 pure-gain semantics at unit level, no hidden state');
}

// A4: one shared table across two substrates — fixed interleaved order stays deterministic
{
  const run = () => {
    const a = twins(), b = makeSubstrate(16, 16, (x, y) => (x === 8 && y === 8) ? pack(3, 20) : 0);
    const shared = new WormholeTable();
    for (let t = 0; t < 10; t++) { tick(a, { table: shared }); tick(b, { table: shared }); }
    return [planeHash(a, 10), planeHash(b, 10)];
  };
  const r1 = run(), r2 = run();
  attack('A4 shared-table interleaving deterministic', JSON.stringify(r1) === JSON.stringify(r2),
    `cross-talk is real (shared slots) but call order fixes it: ${r1[0].slice(0, 8)}…/${r1[1].slice(0, 8)}… reproduce`);
}

// A5: same bytes via a different seedFn path -> identical evolution (bytes are the state)
{
  const viaLiteral = makeSubstrate(8, 8, (x, y) => (x === 2 && y === 2) ? pack(3, 9) : 0);
  const plane = Array.from(viaLiteral);
  const viaCopy = makeSubstrate(8, 8, (x, y, i) => plane[i]);
  for (let t = 0; t < 15; t++) { tick(viaLiteral, {}); tick(viaCopy, {}); }
  attack('A5 byte-plane is the whole state (seedFn origin irrelevant)', planeHash(viaLiteral, 15) === planeHash(viaCopy, 15),
    'two construction paths, one evolution');
}

// A6: mulberry32 seed exhaustion — 1M draws, same seed twice, identical streams
{
  const s = (seed) => { const r = mulberry32(seed); const out = []; for (let i = 0; i < 1_000_000; i++) out.push(r()); return sha(out.join(',')); };
  attack('A6 mulberry32 stream stability (1M draws)', s(31337) === s(31337), 'same seed -> identical 1M-draw stream hash');
}

console.log(fail === 0 ? `\ndeterminism_attacks: ${attacks}/${attacks} HELD — the law survives its own attackers` : `\ndeterminism_attacks: ${fail} BROKE — defect findings, see above`);
process.exit(fail === 0 ? 0 : 1);
