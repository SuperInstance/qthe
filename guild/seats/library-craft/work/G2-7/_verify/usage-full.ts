// _verify/usage-full.ts — exercises every module of api-surface-v0.1.d.ts the
// way a migrant caller would: codec, stamps, all ten ops, seed ladder, the
// v0.1 decisions (I6 no-options tick, PrngSeedError as TypeError, honest
// compat optionality), snapshot/trace/replay round-trips, and the error
// taxonomy. Must compile --strict with zero errors.
declare function structuredClone<T>(value: T): T;

import {
  pack, unpack, psi, tauOf, dOf, vectorPass,
  TAU, D_MAX, PSI,
  type Tau, type Byte, type PsiValue,
} from "@qthe/core/codec";
import {
  Substrate, nextD, mulberry32, canonicalJson, hashTrace, validateTrace, replayTrace,
  KERNEL_SCHEMA_VERSION, SPEC_VERSION, PACKAGE_VERSION, OLOG_VERSION,
  SNAPSHOT_VERSION, HASH_VERSION, HASH_ALGORITHM, DEFAULT_SIGMA, SLOT_COUNT,
  type Op, type SetOptionsOp, type SeedMulberry32Op, type WhWriteOp,
  type TraceRecord, type TwinEvent, type SubstrateSnapshot,
} from "@qthe/core/engine";
import {
  QtheError, CodecError, PrngSeedError,
  type QtheErrorCode,
} from "@qthe/core/errors";
import {
  makeSubstrate, tick as legacyTick, traceView, pack as legacyPack,
  mulberry32 as legacyMulberry32, WormholeTable as LegacyTableAlias,
  psi as legacyPsiFn, vectorPass as legacyVectorPass,
  type LegacySubstrate, type LegacyTwinEvent, type LegacyWormholeTable,
} from "@qthe/core/compat";

// ── codec ────────────────────────────────────────────────────────────────────
const b: Byte = pack(TAU.ABSTAIN, 30);
const planes = unpack(0xce);
const t: Tau = planes.tau;
const psiVal: PsiValue = psi(1);
const t2: Tau = tauOf(b);
const d2 = dOf(b);
if (D_MAX !== 63 || PSI[3] !== "i") throw new Error("codec constants");
try { pack(7 as Tau, 100); } catch (e) { if (!(e instanceof CodecError)) throw e; }
const vp = vectorPass([[0xce, 0x80], new Uint8Array([0x40, 0xbf])], [3, -4]);
if (vp[0].re !== vp[0].re) throw new Error("vp");

// ── stamps (Flag 1): three independent tracks, one rule ─────────────────────
const semver: string = PACKAGE_VERSION;            // npm track: API shape
const schema: string = KERNEL_SCHEMA_VERSION;      // digest track: trace identity
const spec: string = SPEC_VERSION;                 // digest track
const olog: "1" = OLOG_VERSION;
const snapv: "1" = SNAPSHOT_VERSION;
const hashv: "qth1" = HASH_VERSION;
const algo: "sha256" = HASH_ALGORITHM;
const sigma0: number = DEFAULT_SIGMA;
if (SLOT_COUNT !== 64) throw new Error("slots");

// ── lifecycle: the four seed-ladder rungs ────────────────────────────────────
const sBytes = Substrate.create({ w: 4, h: 4, seed: { kind: "bytes", bytes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] } });
const sUniform = Substrate.create({ w: 4, h: 4, seed: { kind: "uniform", tau: 3, d: 30 } });
const sPrng = Substrate.create({ w: 4, h: 4, seed: { kind: "mulberry32", seed: 7, tauFromRng: true, dFromRng: true, tau: 0, d: 0 } });
const sLegacy = Substrate.create({ w: 3, h: 3, seed: { kind: "legacyFn", fn: (x, y, i) => pack(((x + y) & 3) as Tau, (x * 5 + y * 3) & 63) } });
const sEmpty = Substrate.create({ w: 4, h: 4 }); // canonical empty: no ops at at:0

// ── ops: all ten, and the journaled-options law (I6) ─────────────────────────
const ops: ReadonlyArray<Op> = [
  { op: "setTau", at: 0, x: 1, y: 1, tau: 3 },
  { op: "setD", at: 0, x: 1, y: 1, d: 30 },
  { op: "setCell", at: 0, x: 2, y: 2, tau: 1, d: 10 },
  { op: "setByte", at: 0, x: 0, y: 0, c: 0xce },
  { op: "setBytes", at: 0, x: 0, y: 1, w: 2, bytes: [1, 2] },
  { op: "fillRect", at: 0, x: 0, y: 0, w: 2, h: 2, byte: 0x33 },
  { op: "seedMulberry32", at: 0, seed: 99, tauFromRng: true, dFromRng: false, tau: 3, d: 9 },
  { op: "whWrite", at: 0, slot: 9, x: 0, y: 3, resonance: 9 },
  { op: "whClear", at: 0, slot: 9 },
  { op: "setOptions", at: 0, sigma: 2.5, wormholes: true },
];
const sub = Substrate.create({ w: 8, h: 8, seed: { kind: "uniform", tau: 3, d: 30 } });
sub.inject(ops);
const whOp: WhWriteOp = { op: "whWrite", at: 0, slot: 30, x: 1, y: 1, resonance: 4 };
sub.inject(whOp); // single op; `at` filled with current ticks when omitted

// v0.1: tick()/run() take NO options — the σ sweep is journaled (I6).
const evTick: ReadonlyArray<TwinEvent> = sub.tick();
const evRun: ReadonlyArray<ReadonlyArray<TwinEvent>> = sub.run(3);
const sweepArm = (s: Substrate, sigma: number, n: number) => {
  const op: SetOptionsOp = { op: "setOptions", at: s.ticks, sigma };
  s.inject(op);
  return s.run(n);
};
sweepArm(sub, 5, 2);

// sticky σ is readable, not writable; changes only via setOptions
const sticky: number = sub.sigma;
if (sticky === DEFAULT_SIGMA) { /* fine */ }

// ── wormhole table (owned, σ-free, validated) ────────────────────────────────
const table = sub.wormholes;
const occ = table.read(30);
if (occ) { const r: number = occ.resonance; if (r < 0) throw new Error("r"); }
table.write(30, 2, 2, 4);
if (table.totalWrites < 0 || table.occupiedCount() < 0) throw new Error("table");
const tableSnap = table.snapshot();
const slotsView = table.slots();
table.clear();

// ── views, snapshot round-trip, trace/replay ─────────────────────────────────
const cells: Uint8Array = sub.cells;
const copy: Uint8Array = sub.copyCells();
const oneByte: Byte = sub.getByte(0, 0);
const cell = sub.getCell(1, 1);
const lastEvents: ReadonlyArray<TwinEvent> = sub.events;
const journal: ReadonlyArray<Op> = sub.ops;
const dims = { w: sub.w, h: sub.h, ticks: sub.ticks };

const snap: SubstrateSnapshot = sub.snapshot();
const kernelStampOnSnap: string = snap.kernelSchemaVersion; // Flag 1 rename
const sigmaOnSnap: number = snap.sigma;
const sub2 = Substrate.fromSnapshot(structuredClone(snap));
if (sub2.hash() !== sub.hash()) throw new Error("round-trip");

const trace: TraceRecord = sub.trace();
const stampOnTrace: string = trace.kernelSchemaVersion; // Flag 1 rename
const json: string = JSON.stringify(sub); // safe default serialization
const cj: string = canonicalJson({ b: 1, a: [1, 2, 3] });
const h1: string = sub.hash();
const h2: string = hashTrace(trace);
const validated: TraceRecord = validateTrace(JSON.parse(json));
const replay = replayTrace(trace, { expectMatch: false });
if (!replay.matches) throw new Error("replay");
const replayedEvents: ReadonlyArray<ReadonlyArray<TwinEvent>> = replay.eventsByTick;
try { replayTrace(trace); } catch (e) { if (!(e instanceof QtheError)) throw e; }

// ── PRNG decision: core throws TypeError; compat stays raw ───────────────────
try {
  mulberry32(2 ** 32 + 5);
} catch (e) {
  if (!(e instanceof PrngSeedError)) throw e;
  if (!(e instanceof TypeError)) throw new Error("must be a TypeError (v0.1 decision)");
  const code: "E_CODEC_PRNG_SEED" = e.code;
  if (code !== "E_CODEC_PRNG_SEED") throw new Error("code");
}
try { mulberry32(-1); } catch (e) { if (!(e instanceof TypeError)) throw e; }
try { mulberry32(5.7); } catch (e) { if (!(e instanceof TypeError)) throw e; }
const rng = mulberry32(5);
const draw: number = rng();

// ── rule table ───────────────────────────────────────────────────────────────
const dNext: number = nextD(30, -1);
if (nextD(0, -5) !== 0 || nextD(63, 5) !== 63) throw new Error("nextD clamps");

// ── compat: the frozen mirror, typed honestly (Flag 3) ───────────────────────
const legacy: LegacySubstrate = makeSubstrate(4, 4, (x, y, i) => legacyPack((x + y) & 3, (x * 5) & 63));
const legacyW: number | undefined = legacy.w; // optional: the clone receipt
const legacySelf: Uint8Array | undefined = legacy.bytes; // frozen field-lane contract
const legacyTable: LegacyWormholeTable | undefined = legacy.__wormholes;
const table2: LegacyTableAlias = new LegacyTableAlias(5); // constructor σ = the F1 leak vector
const sigmaLeakVector: number = table2.sigma;
const stepped = legacyTick(legacy, { sigma: 5, table: table2 });
if (stepped !== legacy) { /* R6: mutate-and-return, same object */ }
const legacyEvents: ReadonlyArray<LegacyTwinEvent> | undefined = legacy.lastEvents;
const view = traceView(legacy);
const viewW: number | undefined = view.w; // undefined post-clone, honestly typed
const viewWh = view.wormholes; // slots[] | null (R7)
if (viewWh !== null && viewWh.length > 0) { const s0 = viewWh[0]; if (s0.slot < 0) throw new Error("slot"); }
const viewTicks: number = view.ticks;

// the clone receipt, as a type-level fact:
const cloned: LegacySubstrate = structuredClone(legacy);
const clonedW: number | undefined = cloned.w;        // undefined (probed V1)
const clonedBytes: Uint8Array | undefined = cloned.bytes; // undefined too (G2-7 re-probe)
try { legacyTick(cloned); } catch (e) { if (!(e instanceof Error)) throw e; }

const rawRng = legacyMulberry32(2 ** 32 + 5); // silently aliases to seed 5 — kernel-exact
const rawDraw: number = rawRng();
const legacyPsi: number | string = legacyPsiFn(7); // masks: psi(7) === psi(3)
const legacyVp = legacyVectorPass([[300, -1]], [2]); // masks 300→44 silently, kernel-exact

// ── error taxonomy ───────────────────────────────────────────────────────────
const code: QtheErrorCode = "E_REPLAY_HASH";
const err = new QtheError(code, "x");
if (err.code !== "E_REPLAY_HASH") throw new Error("code");
try { Substrate.create({ w: 0, h: 4 }); } catch (e) { if (!(e instanceof QtheError)) throw e; }
try { sub.inject({ op: "nonsense" as never, at: 0 }); } catch (e) { if (!(e instanceof QtheError)) throw e; }

// stamps never feed artifacts they don't belong in: exercise the type fact
const noPackageVersionInSnapshots: SubstrateSnapshot["kernelSchemaVersion"] = KERNEL_SCHEMA_VERSION;
