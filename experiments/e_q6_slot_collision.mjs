// experiments/e_q6_slot_collision.mjs — E-Q6: THE SLOT-COLLISION COOKER
// (answers DeepSeek review finding R3: "LWW slot semantics undefined").
// Lane 34-a (field-smith). Runs on the REAL kernel (qthe.mjs) via _adapter.mjs.
//
// REGISTERED FLOOR (pre_registration_amendment_2.json, commit 8c225cb, PRE-RUN;
// erratum 0b98db8, STILL PRE-RUN): situation 12 verbatim —
//   "distinct cells that ever fire twin resonance is exactly 0 (the writer
//    never reads a DIFFERENT occupant, since it overwrites then reads its own
//    cell), so survival rate <= 0.0156 (1/64). If any distinct-cell firing is
//    observed, M4's last-writer-wins is misimplemented."
// Lane floors: EQ6-D1 determinism (byte-identical reruns or VOID => S5
// order-dependent = CONFIRMED CRITICAL for R3); EQ6-A1 semantics adjudication
// among S1 read-own-write / S2 batch-LWW / S3 live-read-row-major-LWW /
// S4 lowest-index / S5 order-dependent.
//
// ARMS: COOK (situation 12: 64x1 all-Abstain d=0, T=64, 4096 write attempts),
// TWO ({10,20}), CULLED ({5,15,25}), MIRROR ({43,53}, reflected pair —
// directionality probe), SHIFT ({11,21}, order-preserving translation control
// from the erratum), API (direct WormholeTable call-order probe — clearly NOT
// the dynamics path). Every dynamics arm runs TWICE from fresh construction.
//
// NO MOCKS: the cooker drives tick() — the kernel's ACTUAL write path
// (table.read + table.write inside the row-major cell loop). CR3 honored:
// only kernel primitives (tick, makeSubstrate, WormholeTable, mulberry32).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadKernel, makeSubstrate, tick, mulberry32, WormholeTable, kernelReport, bytePlane } from './_adapter.mjs';
import { linkStone } from './_stone_link.mjs';
import { appendAndVerify, planeHash, packByte, q, fileSha256, sha256HexStr } from './_harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'outputs');
const RECEIPTS = join(HERE, '..', 'receipts');
mkdirSync(OUT, { recursive: true });

const W = 64, H = 1, T_COOK = 64, T_PROBE = 8;
const ABSTAIN_D0 = packByte(3, 0); // 192
const WRITE_ATTEMPTS_COOK = W * T_COOK; // 4096
const CHAIN = join(RECEIPTS, 'e_q6_chain.jsonl');

const { stone, stonePath } = await linkStone();
const { kernelKind } = await loadKernel();
console.log(`[e-q6] kernel=${kernelKind} stone=${stonePath}`);
const amend2Sha = fileSha256(join(HERE, 'pre_registration_amendment_2.json'));
const erratumSha = fileSha256(join(HERE, 'pre_registration_amendment_2_erratum.json'));

// ------------------------------------------------------------- arm runner ---
function buildSub(writers /* 'all' or sorted array of x */) {
  const set = writers === 'all' ? null : new Set(writers);
  const seedFn = (x, y, i) => (set === null || set.has(x) ? ABSTAIN_D0 : 0);
  return makeSubstrate(W, H, seedFn); // fresh substrate => FRESH lazy wormhole table
}

function runDynamics(writers, T, checkpoints) {
  const sub = buildSub(writers);
  const abstainXs = [];
  for (let x = 0; x < W; x++) if (writers === 'all' || writers.includes(x)) abstainXs.push(x);
  const planeHashes = [planeHash(sub, 0, bytePlane)];
  const perTick = [];
  const eventTuples = []; // [t, x, y, slot, resonance] — integers only (term = resonance*sigma is a float: NEVER hashed)
  let totalTerm = 0;      // imaginary-channel magnitude summed across ticks (float; rides as string, never hashed)
  let prevSnap = null;

  const dStats = () => {
    let mn = 64, mx = -1, s = 0;
    for (let x = 0; x < W; x++) { const d = sub[x] & 63; if (d < mn) mn = d; if (d > mx) mx = d; s += d; }
    return { min: mn, max: mx, mean: q(s / W) };
  };
  const dTraj = [{ t: 0, ...dStats() }];

  for (let t = 1; t <= T; t++) {
    const preSnap = prevSnap; // occupant map before this tick (null on t=1 => empty table)
    sub.lastEvents = [];
    tick(sub, { wormholes: true });
    const events = (sub.lastEvents || []).map((e) => ({ x: e.x, y: e.y, slot: e.slot, resonance: e.resonance }));
    for (const e of events) { eventTuples.push([t, e.x, e.y, e.slot, e.resonance]); totalTerm += e.resonance * sub.__wormholes.sigma; }
    const table = sub.__wormholes;
    const snap = table.snapshot();
    const fireXs = events.map((e) => e.x).sort((a, b) => a - b);
    const silentXs = abstainXs.filter((x) => !fireXs.includes(x));
    // touched slots this tick: occupant (x,y) changed vs pre-tick, or newly occupied
    const touched = [];
    for (let s = 0; s < 64; s++) {
      const now = snap[s], before = preSnap ? preSnap[s] : null;
      const changed = (now === null) !== (before === null) ||
        (now !== null && before !== null && (now.x !== before.x || now.y !== before.y || now.resonance !== before.resonance));
      if (changed) touched.push(s);
    }
    perTick.push({ t, firings: events.length, firers: fireXs, silent: silentXs, slot0OccupantX: snap[0] ? snap[0].x : null, touchedSlots: touched, occupiedCount: table.occupiedCount() });
    if (checkpoints.includes(t)) { planeHashes.push(planeHash(sub, t, bytePlane)); dTraj.push({ t, ...dStats() }); }
    prevSnap = snap;
  }
  const finalSnap = sub.__wormholes.snapshot();
  const firerSet = [...new Set(eventTuples.map((e) => e[1]))].sort((a, b) => a - b);
  const perCellFires = {};
  for (const [, x] of eventTuples) perCellFires[x] = (perCellFires[x] || 0) + 1;
  return {
    T, writers: writers === 'all' ? 'all 64' : writers, totalWriteAttempts: (writers === 'all' ? W : writers.length) * T,
    totalFirings: eventTuples.length, distinctFirers: firerSet.length, firerXs: firerSet, perCellFires,
    survivalRate: q(eventTuples.length / ((writers === 'all' ? W : writers.length) * T)),
    totalImagMass: q(totalTerm), planeHashes, dTraj, perTick,
    eventSeqHash: sha256HexStr(JSON.stringify(eventTuples)),
    snapshotHash: sha256HexStr(JSON.stringify(finalSnap)),
    finalOccupied: sub.__wormholes.occupiedCount(),
  };
}

// ------------------------------------------------------------------- arms ---
const ARMS = {
  cook:   { writers: 'all', T: T_COOK, checkpoints: [0, 1, 2, 4, 8, 16, 32, 64] },
  two:    { writers: [10, 20], T: T_PROBE, checkpoints: [0, 1, 2, 4, 8] },
  culled: { writers: [5, 15, 25], T: T_PROBE, checkpoints: [0, 1, 2, 4, 8] },
  mirror: { writers: [43, 53], T: T_PROBE, checkpoints: [0, 1, 2, 4, 8] },
  shift:  { writers: [11, 21], T: T_PROBE, checkpoints: [0, 1, 2, 4, 8] },
};

const results = {};
const detRows = [];
let allDet = true;
for (const [name, cfg] of Object.entries(ARMS)) {
  const r1 = runDynamics(cfg.writers, cfg.T, cfg.checkpoints.slice(1));
  const r2 = runDynamics(cfg.writers, cfg.T, cfg.checkpoints.slice(1)); // fresh rebuild, EQ6-D1
  const det = r1.eventSeqHash === r2.eventSeqHash && r1.snapshotHash === r2.snapshotHash &&
    JSON.stringify(r1.planeHashes) === JSON.stringify(r2.planeHashes) &&
    JSON.stringify(r1.perTick.map((p) => [p.t, p.firings, p.firers, p.slot0OccupantX, p.touchedSlots])) ===
    JSON.stringify(r2.perTick.map((p) => [p.t, p.firings, p.firers, p.slot0OccupantX, p.touchedSlots]));
  if (!det) allDet = false;
  detRows.push({ kind: 'det.arm', experiment: 'E-Q6', arm: name, rerunIdentical: det, eventSeqHash: r1.eventSeqHash, snapshotHash: r1.snapshotHash });
  results[name] = { run1: r1, run2Hashes: { eventSeqHash: r2.eventSeqHash, snapshotHash: r2.snapshotHash }, determinism: det, cfg };
  console.log(`[e-q6] ${name}: firings=${r1.totalFirings}/${r1.totalWriteAttempts} distinct=${r1.distinctFirers} survival=${r1.survivalRate} t1firers=${JSON.stringify(r1.perTick[0].firers)} t1occ=${r1.perTick[0].slot0OccupantX} det=${det}`);
}

// API probe (supplementary — NOT the dynamics path): direct table, call order
function runApiProbe(order) {
  const tbl = new WormholeTable();
  for (const [x, r] of order) tbl.write(0, x, 0, r);
  return { read: tbl.read(0), totalWrites: tbl.totalWrites };
}
const apiFwd = runApiProbe([[1, 1], [2, 2], [3, 3]]);   // expect read x=3 (last call wins)
const apiRev = runApiProbe([[3, 3], [2, 2], [1, 1]]);   // expect read x=1 (last call wins)
const apiOk = apiFwd.read.x === 3 && apiRev.read.x === 1 && apiFwd.totalWrites === 3 && apiRev.totalWrites === 3;
console.log(`[e-q6] api: fwd read x=${apiFwd.read.x} rev read x=${apiRev.read.x} (LWW by call order=${apiOk})`);

// ------------------------------------------------- model adjudication (A1) ---
const cook = results.cook.run1, two = results.two.run1, culled = results.culled.run1,
  mirror = results.mirror.run1, shift = results.shift.run1;
const t1 = (r) => r.perTick[0], t2 = (r) => r.perTick[1], t3plusFirings = (r) => r.perTick.slice(2).reduce((s, p) => s + p.firings, 0);
const cookCascadeDying = cook.perTick.slice(0, 8).every((p, i, a) => i === 0 || p.firings < a[i - 1].firings);
const shiftRoleEqTwo = JSON.stringify(shift.perTick.map((p) => [p.firings, p.firers.map((x) => x - 1), p.touchedSlots])) ===
  JSON.stringify(two.perTick.map((p) => [p.firings, p.firers, p.touchedSlots]));
const lowerColumnOccupantObserved = [two, culled, mirror, shift].some((r) => t1(r).slot0OccupantX !== null && t1(r).slot0OccupantX === Math.min(...r.writers));

const consistent = {
  S1_read_own_write: cook.totalFirings === 0 && two.totalFirings === 0 && culled.totalFirings === 0 && mirror.totalFirings === 0 && shift.totalFirings === 0,
  S2_batch_LWW: cook.distinctFirers === 63 && cookCascadeDying && two.totalFirings === 1 && t1(two).firers[0] === 10 &&
    culled.totalFirings === 3 && t3plusFirings(culled) === 0 && t1(mirror).firers[0] === 43 && t1(shift).firers[0] === 11,
  S3_live_read_row_major_LWW: cook.distinctFirers === 64 && cook.totalFirings === 63 * 64 && !cookCascadeDying &&
    t1(two).firers[0] === 20 && t2(two).firers.length === 1 && t2(two).firers[0] === 10 &&
    t1(culled).firers.length === 2 && t3plusFirings(culled) >= 2 &&
    t1(mirror).firers[0] === 53 && t1(shift).firers[0] === 21 && shiftRoleEqTwo,
  S4_lowest_index_wins: lowerColumnOccupantObserved,
  S5_order_dependent: !allDet,
};
const consistentRules = Object.entries(consistent).filter(([, v]) => v).map(([k]) => k);

let R3;
if (consistentRules.length === 1) {
  const [rule] = consistentRules;
  if (rule === 'S1_read_own_write') R3 = `RESOLVED: de-facto deterministic collision semantics = S1 READ-OWN-WRITE (a writer never hears a different same-tick occupant) — the guest's registered model CONFIRMED; EQ6-P1's 0-distinct-firers point prediction HOLDS`;
  else if (rule === 'S2_batch_LWW') R3 = `RESOLVED: de-facto deterministic collision semantics = S2 BATCH-LWW (writes land, then reads see only the final row-major occupant) — the guest's 0-firers model is falsified in form but the batch culling claim stands`;
  else if (rule === 'S3_live_read_row_major_LWW') R3 = `RESOLVED: de-facto deterministic collision semantics = S3 LIVE-READ ROW-MAJOR LWW (per cell in row-major order: read current occupant then write self; each writer audibly hears its most recent PRIOR same-tick same-slot writer, or the previous tick's occupant; occupancy is LWW by row-major order; audibility is DIRECTIONAL — reflection reverses it) — R3's 'undefined' charge REFUTED: the write order IS specified (row-major cell iteration, pinned by G3/G6 determinism), the kernel simply never hid it in prose — it is receipted in qthe.mjs R2/R4`;
  else if (rule === 'S4_lowest_index_wins') R3 = `RESOLVED: collision semantics = S4 LOWEST-INDEX-WINS (unexpected — autopsy required)`;
  else R3 = `CONFIRMED CRITICAL: reruns of equivalent configurations DIVERGE byte-wise (EQ6-D1 failed) — slot semantics genuinely order-dependent/undefined`;
} else if (consistentRules.length === 0) {
  R3 = `UNRESOLVED: no sealed rule reproduces every observation — autopsy required, observations receipted verbatim in e_q6_results.json`;
} else {
  R3 = `TIE: multiple sealed rules reproduce every observation (${consistentRules.join(', ')}) — deterministic under the kernel's fixed row-major order (EQ6-D1 passed), but the probes do not uniquely identify the rule; reported honestly per EQ6-A1`;
}

// ------------------------------------------------------- floor pricing -------
const P1_holds = cook.distinctFirers === 0;                       // guest point prediction: exactly 0 distinct firers
const P2_holds = cook.totalFirings / WRITE_ATTEMPTS_COOK <= 1 / 64; // corollary: survival <= 1/64
const P3_fired = cook.distinctFirers > 0;                          // guest falsifier: any distinct firer observed
const verdictLine = `E-Q6 VERDICT: EQ6-P1 (0 distinct firers) ${P1_holds ? 'HOLDS' : 'FALSIFIED'} (observed distinctFirers=${cook.distinctFirers}); EQ6-P2 (survival <= 1/64) ${P2_holds ? 'HOLDS' : 'FALSIFIED'} (observed survival=${cook.survivalRate}); EQ6-P3 falsifier ${P3_fired ? 'FIRED' : 'did not fire'}; determinism EQ6-D1 ${allDet ? 'PASS (all arms byte-identical across fresh reruns)' : 'VOID'}; ${R3}`;
console.log(`[e-q6] ${verdictLine}`);

// ----------------------------------------------------------------- outputs ---
writeFileSync(join(OUT, 'e_q6_results.json'), JSON.stringify({
  experiment: 'E-Q6', claim: 'R3 (M4 LWW slot semantics)', kernel: kernelReport(), stonePath,
  amendment2Sha: amend2Sha, erratumSha,
  registeredFloor: 'situation 12 verbatim: distinct cells that ever fire twin resonance is exactly 0 ... survival rate <= 0.0156 (1/64). If any distinct-cell firing is observed, M4\'s last-writer-wins is misimplemented.',
  arms: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, {
    cfg: v.cfg, determinism: v.determinism, run2Hashes: v.run2Hashes, ...v.run1,
  }])),
  apiProbe: { fwd: apiFwd, rev: apiRev, lwwByCallOrder: apiOk },
  adjudication: { consistent, consistentRules, shiftRoleEqTwo, cookCascadeDying, lowerColumnOccupantObserved },
  aggregates: { P1_holds, P2_holds, P3_fired, allDet, R3, verdictLine },
}, null, 1));

// ---------------------------------------------------------------- receipts ---
const rows = [
  { kind: 'rules.EQ6', frozen_by: 'pre_registration_amendment_2.json (8c225cb) + pre_registration_amendment_2_erratum.json (0b98db8), both committed BEFORE any run', amend2_sha256: amend2Sha, erratum_sha256: erratumSha,
    floor_verbatim: "situation 12: 'distinct cells that ever fire twin resonance is exactly 0 (the writer never reads a DIFFERENT occupant, since it overwrites then reads its own cell), so survival rate <= 0.0156 (1/64). If any distinct-cell firing is observed, M4's last-writer-wins is misimplemented.'",
    lane_floors: 'EQ6-D1 byte-identical fresh reruns (plane-hash seq + event-seq hash + snapshot hash) else VOID=order-dependent; EQ6-A1 adjudicate S1 read-own-write / S2 batch-LWW / S3 live-read-row-major-LWW / S4 lowest-index / S5 order-dependent' },
  { kind: 'run.config', experiment: 'E-Q6', kernel: kernelReport(), stone_linked: stonePath,
    task: 'slot-collision cooker: 64x1 all-Abstain d=0 (byte 192) T=64 seed 1337 (inert — tick draws no randomness) + probes TWO{10,20} CULLED{5,15,25} MIRROR{43,53} SHIFT{11,21} T=8; REAL kernel write path (tick(): table.read + table.write in row-major cell loop), no mocks, CR3 honored; guest resonance(x)=x+1 deviation receipted pre-run (kernel computes |real_acc|+1 = 1 here)' },
  ...detRows,
];
for (const [name, r] of Object.entries(results)) {
  const run = r.run1;
  rows.push({ kind: 'result.arm', experiment: 'E-Q6', arm: name, writers: run.writers, T: run.T, totalFirings: run.totalFirings, totalWriteAttempts: run.totalWriteAttempts,
    distinctFirers: run.distinctFirers, firerXs: run.firerXs, survivalRate: run.survivalRate, totalImagMass: run.totalImagMass,
    t1Firers: run.perTick[0].firers, t1Slot0OccupantX: run.perTick[0].slot0OccupantX,
    t2Firers: run.perTick[1] ? run.perTick[1].firers : null,
    t3plusFirings: name === 'cook' ? null : run.perTick.slice(2).reduce((s, p) => s + p.firings, 0),
    first8TickFirings: run.perTick.slice(0, 8).map((p) => p.firings),
    eventSeqHash: run.eventSeqHash, snapshotHash: run.snapshotHash, finalPlaneHash: run.planeHashes[run.planeHashes.length - 1], determinism: r.determinism });
}
rows.push({ kind: 'result.api', experiment: 'E-Q6', note: 'supplementary API-level probe (direct WormholeTable, NOT the dynamics path)', fwdRead: apiFwd.read, revRead: apiRev.read, lwwByCallOrder: apiOk });
rows.push({ kind: 'verdict.EQ6', experiment: 'E-Q6', P1_holds, P2_holds, P3_fired, allDet, consistentRules, R3, verdictLine });
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q6', claim: 'R3' });
console.log(`[e-q6] chain ok links=${v.links} tip=${v.tip}`);
writeFileSync(join(OUT, 'e_q6_tip.txt'), `${v.tip} links=${v.links}\n`);
