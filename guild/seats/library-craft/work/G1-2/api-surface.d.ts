/**
 * @qthe/core v0 — public TypeScript surface (.d.ts grade)
 * ========================================================
 *
 * Deterministic 8-bit cellular substrate: one byte = 2-bit timbre τ
 * (Ground/Attract/Repel/Abstain) + 6-bit amplitude d; toroidal Moore-8
 * synchronous tick; 64-slot wormhole table; byte-identical traces.
 *
 * Subpath layout (tree-shakeable, zero dependencies):
 *
 *   @qthe/core/errors   — error taxonomy (tiny; safe to import anywhere)
 *   @qthe/core/codec    — pure byte/vector algebra. NO engine imports.
 *   @qthe/core/engine   — Substrate, tick, wormholes, op-log, hash, replay.
 *   @qthe/core/compat   — deprecated 1:1 aliases of the reference kernel
 *                         (qthe.mjs). Frozen behavior; see CRITIQUE.md.
 *   @qthe/core          — re-exports codec + engine + errors (NOT compat).
 *
 * DESIGN INVARIANTS (all enforced by the engine):
 *
 *   I1  All state mutation is JOURNALED. Cells and the wormhole table are
 *       written only by `tick()` (the physics) or `inject()` (the op-log).
 *       `sub.cells` is exposed live for zero-copy rendering, but writing it
 *       bypasses the journal and is a caller contract violation — `hash()`
 *       will fingerprint whatever you did, and replay will disagree.
 *   I2  Everything that crosses a serialization boundary (op-log entries,
 *       snapshots, traces) is structuredClone-safe and JSON-able plain data:
 *       no functions, no expandos, no self-pointers.
 *   I3  Codec functions VALIDATE and throw (CodecError) on out-of-domain
 *       input. The reference kernel masked silently (pack(7,100) ===
 *       pack(3,36)); masking is available only in @qthe/core/compat.
 *       Silent aliasing is the enemy of determinism forensics.
 *   I4  `tick()` mutates in place and returns THIS TICK'S EVENTS — never the
 *       substrate (kills the mutate-and-return aliasing footgun; the legacy
 *       mutate-and-return contract survives in @qthe/core/compat per R6).
 *   I5  No Math.random inside the engine. `mulberry32` is caller-side and
 *       seed-checked (a seed ≥ 2^32 throws instead of silently aliasing).
 *
 * The op-log format, the trace-hash recipe, and the upgrade-honesty rule
 * are normatively specified in OLOG-SPEC.md. This file is the typing
 * surface; where the two disagree, OLOG-SPEC.md wins and this file is a bug.
 */

// ─────────────────────────────────────────────────────────────────────────────
// @qthe/core/errors — error taxonomy
// ─────────────────────────────────────────────────────────────────────────────

declare module "@qthe/core/errors" {
  /** Stable machine-readable error codes. Never reorder; only append. */
  export type QtheErrorCode =
    | "E_CODEC_TAU"          // tau not in 0..3 (integer)
    | "E_CODEC_D"            // d not in 0..63 (integer)
    | "E_CODEC_BYTE"         // byte not in 0..255 (integer)
    | "E_CODEC_VECTOR"       // vectorPass: ragged row / bad input
    | "E_CODEC_HORIZON"      // integer input beyond ±2^53 (kernel seam F1)
    | "E_CODEC_PRNG_SEED"    // mulberry32 seed not an integer in [0, 2^32)
    | "E_DIM"                // non-positive or non-integer w/h
    | "E_OP_UNKNOWN"         // op name not in this OLOG_VERSION (fail closed)
    | "E_OP_SHAPE"           // op missing/typing a required field
    | "E_OP_BOUNDS"          // op coordinate/slot/rect outside the substrate
    | "E_OP_AT"              // op.at violates boundary rules (see OLOG §4)
    | "E_REPLAY_VERSION"     // trace/olog/hash stamp mismatch
    | "E_REPLAY_HASH"        // replay produced a different stateHash
    | "E_SNAPSHOT_VERSION"   // snapshot stamp not accepted by this kernel
    | "E_SNAPSHOT_SHAPE";    // snapshot structurally invalid

  /**
   * Base class for every error thrown by @qthe/core. `code` is stable across
   * releases (append-only, see QtheErrorCode); `message` is for humans and is
   * NOT part of any contract.
   */
  export class QtheError extends Error {
    readonly code: QtheErrorCode;
    constructor(code: QtheErrorCode, message: string, options?: { cause?: unknown });
  }

  /** Thrown by codec functions (pack/unpack/psi/vectorPass/mulberry32). */
  export class CodecError extends QtheError {}
  /** Thrown for bad substrate dimensions. */
  export class DimensionError extends QtheError {}
  /** Thrown when validating or applying an op-log entry. */
  export class OpError extends QtheError {}
  /** Thrown when a trace cannot be replayed (stamps, shape, or hash). */
  export class ReplayError extends QtheError {}
  /** Thrown when a snapshot cannot be restored. */
  export class SnapshotError extends QtheError {}
}

// ─────────────────────────────────────────────────────────────────────────────
// @qthe/core/codec — pure algebra, checked. Zero engine imports.
// ─────────────────────────────────────────────────────────────────────────────

declare module "@qthe/core/codec" {
  import type { CodecError } from "@qthe/core/errors";

  /** Timbre plane: the 2 high bits of a cell byte. */
  export type Tau = 0 | 1 | 2 | 3;
  /** Amplitude plane: the 6 low bits. Integer domain 0..63. */
  export type D = number;
  /** A packed cell. Integer domain 0..255. Bit 7-6 = τ, bit 5-0 = d. */
  export type Byte = number;
  /** Ψ map value: Ground → 0, Attract → +1, Repel → −1, Abstain → 'i'. */
  export type PsiValue = 0 | 1 | -1 | "i";

  /** The four timbres, by name. Frozen: numeric values are digest-relevant. */
  export const TAU: Readonly<{ readonly GROUND: 0; readonly ATTRACT: 1; readonly REPEL: 2; readonly ABSTAIN: 3 }>;
  /** Maximum amplitude (6-bit plane). */
  export const D_MAX: 63;
  /** Ψ table indexed by τ: [0, 1, -1, 'i']. */
  export const PSI: readonly [0, 1, -1, "i"];

  /**
   * The operator character of a timbre.
   * @throws {CodecError} `E_CODEC_TAU` if tau is not an integer in 0..3
   *         (the kernel masked with `tau & 3`; core throws).
   */
  export function psi(tau: Tau): PsiValue;

  /**
   * Pack (τ, d) into one byte. Total bijection on the valid domain.
   *
   * CHECKED: throws `E_CODEC_TAU` / `E_CODEC_D` on non-integer or
   * out-of-range input. The reference kernel's masking semantics
   * (pack(7,100) → pack(3,36)) survive only in @qthe/core/compat.
   *
   * @example
   * pack(TAU.ABSTAIN, 30); // => 0b11_011110 === 0xce
   */
  export function pack(tau: Tau, d: D): Byte;

  /** Unpack a byte into its planes. Inverse of {@link pack} on 0..255. */
  export function unpack(c: Byte): { tau: Tau; d: D };

  /** Timbre plane of a byte. @throws {CodecError} E_CODEC_BYTE outside 0..255. */
  export function tauOf(c: Byte): Tau;

  /** Amplitude plane of a byte. @throws {CodecError} E_CODEC_BYTE outside 0..255. */
  export function dOf(c: Byte): D;

  /**
   * Integer-exact split-channel vector pass (SPEC LAYER 0 item 3):
   *
   *   y_j^Re = Σ_{τ=1} d·x_k − Σ_{τ=2} d·x_k
   *   y_j^Im = Σ_{τ=3} d·x_k
   *
   * Ground (τ=0) contributes to neither channel. No floats are produced;
   * results are exact while |Re|,|Im| ≤ 2^53 (the accumulation horizon —
   * validated inputs may still overflow the accumulator; the caller owns
   * magnitudes, the library owns the algebra).
   *
   * CHECKED (divergence from the kernel is deliberate, aligning with the
   * Python cross-impl seam F2):
   *   - every weight must be an integer 0..255 → `E_CODEC_BYTE`
   *   - every row length must equal xs.length (ragged rows rejected
   *     instead of producing NaN) → `E_CODEC_VECTOR`
   *   - every x must be an integer within ±2^53 → `E_CODEC_HORIZON`
   *     (the kernel rounds silently; core refuses loudly)
   *
   * @param weights rows of packed QTHE bytes, w[j][k]
   * @param xs      integer inputs, one per column k
   */
  export function vectorPass(
    weights: ReadonlyArray<Uint8Array | readonly Byte[]>,
    xs: readonly number[] | Int32Array,
  ): Array<{ re: number; im: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// @qthe/core/engine — substrate, tick, wormholes, op-log, hash, replay
// ─────────────────────────────────────────────────────────────────────────────

declare module "@qthe/core/engine" {
  import type { Byte, D, Tau } from "@qthe/core/codec";

  // ── Version stamps ────────────────────────────────────────────────────────
  //
  // These are DIGEST STAMPS, not npm semver (see OLOG-SPEC §8): they feed the
  // trace hash and may only change on trace-breaking releases. The package's
  // own semver moves independently and MUST NOT be used for stamping.

  /** Kernel digest stamp — "0.1.0" at time of writing. Bump = traces re-hash. */
  export const KERNEL_VERSION: string;
  /** SPEC.md revision the kernel implements. */
  export const SPEC_VERSION: string;
  /** Op-log format major ("1"). Additive optional fields bump minor-only. */
  export const OLOG_VERSION: "1";
  /** Snapshot format version. */
  export const SNAPSHOT_VERSION: "1";
  /** Trace/hash format version; also the hash string prefix. */
  export const HASH_VERSION: "qth1";
  /** Canonical name of the digest primitive. */
  export const HASH_ALGORITHM: "sha256";
  /** Default bridge scale σ = log2(3) ≈ 1.584962500721156. */
  export const DEFAULT_SIGMA: number;
  /** Wormhole table size. Slots are indexed by a cell's d-value (0..63). */
  export const SLOT_COUNT: 64;

  // ── Ops (the op-log) ──────────────────────────────────────────────────────
  //
  // Every mutation a caller can perform on a substrate is one of ten ops.
  // All ops are plain JSON objects (structuredClone-safe). The `at` field is
  // the tick boundary at which the op applies: "when substrate.ticks === at",
  // i.e. after `at` completed ticks, before tick `at + 1`. Normative schema,
  // validation rules, and ordering semantics: OLOG-SPEC §3–§4.

  /** Fields shared by every op. */
  export interface OpBase {
    /** Op discriminator. */
    op: string;
    /**
     * Tick boundary: apply when `substrate.ticks === at`. Required in
     * journaled logs. `inject()` accepts it omitted (fills in the current
     * tick count) but persists the filled value.
     */
    at: number;
  }

  /** Set one cell's timbre. Timbre is frozen inside tick; this is the injector. */
  export interface SetTauOp extends OpBase {
    op: "setTau";
    x: number;
    y: number;
    tau: Tau;
  }

  /** Set one cell's amplitude. */
  export interface SetDOp extends OpBase {
    op: "setD";
    x: number;
    y: number;
    d: D;
  }

  /** Set a cell's τ and/or d in one op (at least one of the two required). */
  export interface SetCellOp extends OpBase {
    op: "setCell";
    x: number;
    y: number;
    tau?: Tau;
    d?: D;
  }

  /** Write one raw byte. The only op that can construct "impossible" states
   *  (none exist — every byte is legal — but this is the byte-literal path). */
  export interface SetByteOp extends OpBase {
    op: "setByte";
    x: number;
    y: number;
    c: Byte;
  }

  /**
   * Bulk literal write of a row-major byte block. Bounds-checked against the
   * grid (out-of-bounds → OpError, no clipping). This is ALSO the seed escape
   * hatch: an arbitrary legacy seedFn(x,y,i) is run once at creation and its
   * output journaled as this op (functions are not serializable; bytes are).
   */
  export interface SetBytesOp extends OpBase {
    op: "setBytes";
    x: number;
    y: number;
    /** Row stride of `bytes` (width of the block, not of the grid). */
    w: number;
    bytes: readonly Byte[];
  }

  /**
   * Fill an axis-aligned rectangle with a constant cell. Either `byte` XOR
   * (`tau` AND `d`) must be given. Out-of-bounds rectangles are rejected,
   * never clipped.
   */
  export interface FillRectOp extends OpBase {
    op: "fillRect";
    x: number;
    y: number;
    w: number;
    h: number;
    tau?: Tau;
    d?: D;
    byte?: Byte;
  }

  /**
   * Re-derivable random seed. Deterministic recipe (OLOG-SPEC §3.7): one
   * mulberry32 stream, cells visited row-major; per cell, draw τ first
   * (floor(rng()*4)) if `tauFromRng`, then d (floor(rng()*64)) if `dFromRng`;
   * undrawn fields take the op's constant `tau`/`d`. Overwrites EVERY cell.
   */
  export interface SeedMulberry32Op extends OpBase {
    op: "seedMulberry32";
    /** Integer in [0, 2^32). Out-of-range throws — never truncated. */
    seed: number;
    tauFromRng: boolean;
    dFromRng: boolean;
    /** Constant τ when `tauFromRng` is false. Default 0 (GROUND). */
    tau?: Tau;
    /** Constant d when `dFromRng` is false. Default 0. */
    d?: D;
  }

  /**
   * Manually occupy a wormhole slot (setup for twin schedules, e.g. G5).
   * Coordinates are validated to be inside THIS substrate's grid; resonance
   * must be an integer ≥ 0 (0 = present but inert: reads guard on it).
   */
  export interface WhWriteOp extends OpBase {
    op: "whWrite";
    slot: number; // 0..63
    x: number;
    y: number;
    resonance: number;
  }

  /** Vacate one slot (`slot` given) or the whole table (omitted; also resets
   *  the cumulative write counter, mirroring kernel `clear()`). */
  export interface WhClearOp extends OpBase {
    op: "whClear";
    slot?: number;
  }

  /**
   * Sticky tick options, effective for every tick AFTER this boundary.
   * This is the ONLY way sigma or the wormhole flag persist across ticks —
   * per-tick overrides in TickOptions never leak (this op exists because the
   * reference kernel's lazy table constructor silently made a one-tick σ
   * override permanent; see CRITIQUE.md F1).
   */
  export interface SetOptionsOp extends OpBase {
    op: "setOptions";
    sigma?: number;
    wormholes?: boolean;
  }

  /** The op union. Discriminate on `op`; unknown names fail closed (OpError). */
  export type Op =
    | SetTauOp
    | SetDOp
    | SetCellOp
    | SetByteOp
    | SetBytesOp
    | FillRectOp
    | SeedMulberry32Op
    | WhWriteOp
    | WhClearOp
    | SetOptionsOp;

  // ── Events (first-class) ──────────────────────────────────────────────────

  /**
   * A twin-resonance event: an Abstain cell hit an occupied wormhole slot
   * (its own d-value), from a writer other than itself, with nonzero
   * resonance. The imaginary term `resonance * σ` was added to its pressure.
   * `tick` is the 1-based number of the tick that emitted it (the substrate's
   * ticks count immediately after that tick).
   */
  export interface TwinEvent {
    readonly kind: "twin";
    readonly x: number;
    readonly y: number;
    readonly slot: number;
    readonly resonance: number;
    readonly term: number;
    readonly tick: number;
  }

  // ── Wormhole table ────────────────────────────────────────────────────────

  /** Occupied-slot view used by snapshots and traces. */
  export interface WormholeSlotView {
    slot: number;
    x: number;
    y: number;
    resonance: number;
  }

  /**
   * The 64-slot wormhole table. One instance is OWNED by each Substrate
   * (tick options no longer accept an external table — sharing one table
   * across substrates was a cross-substrate coupling footgun; use
   * snapshot()/restore() to move table state).
   *
   * Note: NO sigma parameter. σ lives on the Substrate (see SetOptionsOp).
   */
  export class WormholeTable {
    /** @internal Tables are created by the engine; not user-constructible. */
    private constructor();
    /** Occupant of a slot, or null if empty. Slot must be 0..63. */
    read(slot: number): WormholeSlotView | null;
    /**
     * Occupy a slot (last-writer-wins). Validated: slot 0..63, integer
     * in-grid coordinates, integer resonance ≥ 0. The kernel accepted
     * anything and silently coerced via Int32Array (NaN → 0 retargeted a
     * wormhole to the origin); core throws OpError instead.
     */
    write(slot: number, x: number, y: number, resonance: number): void;
    /** Number of occupied slots. */
    occupiedCount(): number;
    /** Cumulative write count (telemetry only; not digest-relevant). */
    get totalWrites(): number;
    /** Occupied slots in slot order. Deterministic; JSON-able. */
    slots(): ReadonlyArray<WormholeSlotView>;
    /** Deep, structuredClone-safe state (slots + totalWrites). */
    snapshot(): { slots: ReadonlyArray<WormholeSlotView>; totalWrites: number };
    clear(): void;
  }

  // ── Snapshots & traces ────────────────────────────────────────────────────

  /**
   * A complete, structuredClone-safe, versioned image of a substrate:
   * cells, table, journal, σ, tick count, and stamps. Restoring yields a
   * substrate whose `hash()` equals the original's (round-trip law, tested).
   */
  export interface SubstrateSnapshot {
    v: "1";
    kernelVersion: string;
    specVersion: string;
    w: number;
    h: number;
    ticks: number;
    sigma: number;
    cells: Uint8Array;
    table: ReadonlyArray<WormholeSlotView>;
    totalWrites: number;
    ops: ReadonlyArray<Op>;
  }

  /**
   * The artifact of record. Self-contained: view (for HUDs), provenance
   * (op-log), and seal (stateHash). Everything is re-derivable by replay.
   * Deterministic: no timestamps, no host paths, no random ids — hashing a
   * trace twice gives the same string on the same kernel.
   */
  export interface TraceRecord {
    formatVersion: "1";
    kernelVersion: string;
    specVersion: string;
    ologVersion: "1";
    w: number;
    h: number;
    /** Number of ticks applied (the substrate's ticks at trace time). */
    tickCount: number;
    /** The full op-log, including seed ops at `at === 0`. */
    ops: ReadonlyArray<Op>;
    /** Final cell plane, lowercase hex, row-major (informational view). */
    cellsHex: string;
    /** Occupied wormhole slots at trace time (informational view). */
    table: ReadonlyArray<WormholeSlotView>;
    /** Events emitted by the LAST tick (informational view). */
    events: ReadonlyArray<TwinEvent>;
    /** Seal: version-stamped digest per OLOG-SPEC §7. */
    stateHash: string;
  }

  // ── Substrate ─────────────────────────────────────────────────────────────

  /** Creation seed. See OLOG-SPEC §5 for the seed-capture rules. */
  export type SeedInit =
    | { kind: "bytes"; bytes: Uint8Array | readonly number[] }
    | { kind: "uniform"; tau: Tau; d: D }
    | { kind: "mulberry32"; seed: number; tauFromRng: boolean; dFromRng: boolean; tau?: Tau; d?: D }
    /**
     * Legacy escape hatch: an arbitrary seedFn, called R6-style as
     * fn(x, y, i), run ONCE at creation; the resulting bytes are journaled
     * as a setBytes op (the function itself is not serializable — the bytes
     * are the provenance). Deterministic replay is preserved; seed
     * compactness is not.
     */
    | { kind: "legacyFn"; fn: (x: number, y: number, i: number) => Byte };

  export interface CreateInit {
    /** Grid width. Positive integer ≤ 2^16. */
    w: number;
    /** Grid height. Positive integer ≤ 2^16. */
    h: number;
    /**
     * Initial state. Omitted → all-Ground d=0 (the canonical empty seed;
     * journaled as no ops). Whatever is given is journaled at `at === 0`,
     * so the journal is always the complete provenance.
     */
    seed?: SeedInit;
  }

  /** Options for a single tick. Sticky values come from the substrate
   *  (see SetOptionsOp); nothing here persists past the call. */
  export interface TickOptions {
    /** Default true. false = the wormhole table is neither read nor written
     *  this tick (paired-arm OFF arm, kernel gate G6). */
    wormholes?: boolean;
    /**
     * σ for THIS tick only. Never persists (kernel bug fixed — see
     * CRITIQUE.md F1). To persist, inject a setOptions op.
     */
    sigma?: number;
  }

  /**
   * A substrate handle: grid, owned wormhole table, journal, tick engine.
   *
   * Obtain via {@link Substrate.create} or {@link Substrate.restore} — never
   * `new`. The handle is a real object (not a Uint8Array with expandos): it
   * survives structuredClone boundaries via snapshot()/restore(), and its
   * `toJSON()` makes JSON.stringify produce the safe serialization by default.
   */
  export class Substrate {
    private constructor();

    /** Create a substrate from a seed spec. Journaled at at:0. */
    static create(init: CreateInit): Substrate;

    /**
     * Restore from a snapshot (alias: `restore`).
     * @throws {import("@qthe/core/errors").SnapshotError}
     *         E_SNAPSHOT_VERSION if the stamps are not accepted by this
     *         kernel; E_SNAPSHOT_SHAPE if structurally invalid.
     */
    static fromSnapshot(snap: SubstrateSnapshot): Substrate;
    /** Alias of {@link Substrate.fromSnapshot}. */
    static restore(snap: SubstrateSnapshot): Substrate;

    get w(): number;
    get h(): number;
    /** Completed tick count. */
    get ticks(): number;
    /** Sticky σ (default log2(3)). Changing it outside setOptions is
     *  unjournaled — use inject({op:'setOptions', sigma}) to change it
     *  traceably. */
    get sigma(): number;
    /** The owned wormhole table (read/write; writes via whWrite ops are
     *  journaled, direct table.write is journaled too — both append to the
     *  journal so replay stays exact). */
    get wormholes(): WormholeTable;

    /**
     * The live cell plane, row-major, w*h bytes. Zero-copy for renderers.
     * WRITING it bypasses the journal: replay will disagree with your own
     * hash. Use inject() for all writes. See invariant I1.
     */
    get cells(): Uint8Array;
    /** Defensive copy of the plane. */
    copyCells(): Uint8Array;
    getByte(x: number, y: number): Byte;
    getCell(x: number, y: number): { tau: Tau; d: D };

    /** Events of the most recent tick (fresh array; never undefined). */
    get events(): ReadonlyArray<TwinEvent>;
    /** The journal (the op-log of everything that happened). Append-only. */
    get ops(): ReadonlyArray<Op>;

    /**
     * Apply ops at the current tick boundary. Entries are validated, then
     * journaled with `at` filled in (= current ticks) if omitted. `at`
     * values other than the current tick count throw E_OP_AT (history is
     * append-only; you cannot retro-inject or pre-queue through this API —
     * construct a full op-log and replay it instead).
     * @throws {import("@qthe/core/errors").OpError} on any invalid op.
     */
    inject(ops: Op | ReadonlyArray<Op>): this;

    /**
     * One synchronous toroidal Moore-8 tick. Mutates in place; returns THIS
     * TICK'S EVENTS (not the substrate — invariant I4). Tick semantics are
     * the kernel's R1–R4, unchanged and trace-sealed.
     */
    tick(opts?: TickOptions): ReadonlyArray<TwinEvent>;

    /** Run `count` ticks (convenience; identical to count × tick). Returns
     *  the per-tick event arrays. */
    run(count: number, opts?: TickOptions): ReadonlyArray<ReadonlyArray<TwinEvent>>;

    /** StructuredClone-safe, versioned snapshot. Round-trip law:
     *  Substrate.restore(s.snapshot()).hash() === s.hash(). */
    snapshot(): SubstrateSnapshot;

    /**
     * Version-stamped state digest: "qth1:" + 64 lowercase hex chars.
     * Recipe (normative): OLOG-SPEC §7. Covers versions, dims, ticks, σ,
     * cells, table, and an opsHash of the journal — so it seals BOTH the
     * state and its provenance.
     */
    hash(): string;

    /** The artifact of record (view + provenance + seal). */
    trace(): TraceRecord;

    /**
     * Safe default serialization: JSON.stringify(substrate) yields the
     * TraceRecord (minus this method). The documented footgun of the
     * reference kernel (circular via the `bytes` self-pointer) becomes a
     * safe default path. structuredClone(substrate) still drops nothing —
     * but snapshot() is the sanctioned crossing; use it.
     */
    toJSON(): Omit<TraceRecord, never>;
  }

  // ── Pure rule table & PRNG ────────────────────────────────────────────────

  /**
   * The data rule table (pure): net-positive pressure → d+1 (saturate 63);
   * net-negative → d−1 (floor 0); zero → unchanged. τ is never changed here.
   * Exported for exhaustive testing (kernel gate G2), not for steering.
   */
  export function nextD(d: D, pressure: number): D;

  /**
   * Seeded PRNG for CALLERS (seeding, probes). Never drawn inside tick().
   * CHECKED: seed must be an integer in [0, 2^32) — the kernel's `>>> 0`
   * silently aliased mulberry32(2^32 + k) to mulberry32(k); core throws
   * E_CODEC_PRNG_SEED instead.
   */
  export function mulberry32(seed: number): () => number;

  // ── Determinism tooling ───────────────────────────────────────────────────

  /**
   * Canonical JSON per OLOG-SPEC §7.1 (RFC 8785 / JCS subset): recursively
   * key-sorted (UTF-16 code units), no insignificant whitespace, numbers via
   * ECMAScript Number::toString, and NOTHING else — no undefined, functions,
   * symbols, or non-finite numbers (throws). Integers are exact within ±2^53.
   */
  export function canonicalJson(value: unknown): string;

  /** Hash a trace record without a substrate (verification tool). Same
   *  recipe as Substrate.hash(); OLOG-SPEC §7. */
  export function hashTrace(trace: TraceRecord): string;

  /**
   * Parse and validate untrusted trace JSON (from disk, a Worker, a peer).
   * @throws {import("@qthe/core/errors").ReplayError} E_REPLAY_VERSION on
   *         stamp mismatch; E_OP_* on invalid ops; E_REPLAY_HASH never
   *         (hashing happens after replay).
   */
  export function validateTrace(value: unknown): TraceRecord;

  export interface ReplayResult {
    substrate: Substrate;
    /** Hash of the replayed end state (equals substrate.hash()). */
    hash: string;
    /** True iff hash === trace.stateHash. */
    matches: boolean;
    /** Events of every replayed tick, index 0 = tick 1 (for event-stream
     *  equality checks under the trace-compatibility rule, OLOG §8). */
    eventsByTick: ReadonlyArray<ReadonlyArray<TwinEvent>>;
  }

  /**
   * Replay = determinism, period. Re-creates the substrate from the trace's
   * op-log and tick count, runs it forward, and compares hashes. Algorithm
   * is normative: OLOG-SPEC §6.
   *
   * @param expectMatch When true (default), a hash mismatch throws
   *        ReplayError E_REPLAY_HASH instead of returning matches:false —
   *        use false when deliberately probing cross-version divergence.
   */
  export function replayTrace(trace: TraceRecord, opts?: { expectMatch?: boolean }): ReplayResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// @qthe/core/compat — deprecated 1:1 aliases of the reference kernel (qthe.mjs)
// ─────────────────────────────────────────────────────────────────────────────

declare module "@qthe/core/compat" {
  import type { TraceRecord } from "@qthe/core/engine";

  /**
   * The reference-kernel surface, frozen. Every export preserves qthe.mjs
   * behavior EXACTLY — including the masked codec, the truncating mulberry32,
   * the expando substrate, and tick()'s mutate-AND-return contract (R6 is a
   * frozen cross-lane contract; research scripts must not silently break).
   *
   * Known defects preserved deliberately (see CRITIQUE.md): expandos are
   * dropped by structuredClone; JSON.stringify(substrate) throws (circular);
   * pack masks; mulberry32 truncates seeds; a one-tick σ override leaks into
   * the lazy table's constructor σ.
   *
   * Migration map:
   *   makeSubstrate(w,h,fn) → Substrate.create({w, h, seed: {kind:'legacyFn', fn}})
   *   tick(sub, opts)       → sub.tick(opts)           (returns events, not sub)
   *   traceView(sub)        → sub.trace()
   *   pack/unpack/psi/etc.  → @qthe/core/codec         (checked; throws)
   */

  /**
   * Legacy expando-carrying substrate type. The expandos (w, h, ticks,
   * __wormholes, bytes, __scratch, lastEvents) are synthesized on a REAL
   * Uint8Array view over the engine's plane, so frozen external contracts
   * (e.g. the field lane's bytePlane() reading sub.bytes) keep working.
   */
  export type LegacySubstrate = Uint8Array & {
    w: number;
    h: number;
    ticks: number;
    __wormholes: import("@qthe/core/engine").WormholeTable | undefined;
    /** Self-pointer (circular for JSON.stringify — by design, unchanged). */
    bytes: Uint8Array;
    lastEvents: ReadonlyArray<import("@qthe/core/engine").TwinEvent>;
  };

  /** @deprecated Use Substrate.create. Behavior identical to qthe.mjs. */
  export function makeSubstrate(
    w: number,
    h: number,
    seedFn: (x: number, y: number, i: number) => number,
  ): LegacySubstrate;

  /**
   * @deprecated Use sub.tick(opts). STILL mutates in place AND returns the
   * same substrate (R6 frozen contract). opts.table is still honored
   * (external mutable table), sigma still leaks into a lazily created
   * table's constructor — kernel-exact.
   */
  export function tick(
    cells: LegacySubstrate,
    opts?: { wormholes?: boolean; table?: import("@qthe/core/engine").WormholeTable; sigma?: number },
  ): LegacySubstrate;

  /** @deprecated Use sub.trace(). Kernel-exact view. */
  export function traceView(
    cells: LegacySubstrate,
    events?: ReadonlyArray<import("@qthe/core/engine").TwinEvent>,
  ): { w: number; h: number; ticks: number; cells: number[]; wormholes: unknown; events: unknown };

  /** @deprecated Kernel-exact masking codec (pack(7,100) === pack(3,36)). */
  export function pack(tau: number, d: number): number;
  /** @deprecated Kernel-exact. */
  export function unpack(c: number): { tau: number; d: number };
  /** @deprecated Kernel-exact truncating PRNG (mulberry32(2^32+k) ≡ mulberry32(k)). */
  export function mulberry32(seed: number): () => number;

  /** TraceRecord is re-exported for type-only migration of trace consumers. */
  export type { TraceRecord };
}

// ─────────────────────────────────────────────────────────────────────────────
// @qthe/core — root (re-exports; compat is opt-in by path, never default)
// ─────────────────────────────────────────────────────────────────────────────

declare module "@qthe/core" {
  export * from "@qthe/core/codec";
  export * from "@qthe/core/engine";
  export * from "@qthe/core/errors";
}
