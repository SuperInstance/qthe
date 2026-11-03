/**
 * @qthe/core — public TypeScript surface · REVISION v0.1 (.d.ts grade)
 * ============================================================================
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * This is the contract a stranger compiles against: the deterministic 8-bit
 * cellular substrate — one byte = 2-bit timbre τ (Ground/Attract/Repel/
 * Abstain) + 6-bit amplitude d; toroidal Moore-8 synchronous tick; 64-slot
 * wormhole table; journaled, replayable, version-stamped traces. It is
 * written so a reader of THIS FILE ALONE knows what is promised, what is
 * priced, and what is not (DETERMINISM RECEIPT below). v0 (G1-2, graded A)
 * is the parent; v0.1 folds the Orchestrator's accepted rulings into binding
 * surface. Nothing here counts until it is verified in an adjudications
 * record (house law 6).
 *
 * RECEIPTS (rulings this revision embodies — ADJUDICATIONS-G1.md, 2026-11-02)
 * -------------------------------------------------------------------------
 *  Flag 1   Digest stamps are decoupled from npm semver → the stamp constants
 *           below are renamed/split (KERNEL_SCHEMA_VERSION, SPEC_VERSION vs
 *           PACKAGE_VERSION) and the rule is documented at the constants.
 *  Flag 2   Seed is collapsed into ops-at-tick-0 → SeedInit documents the
 *           single normative source + the bytes-capture ladder.
 *  Flag 3   /compat synthesizes the expando contract → typed honestly: every
 *           expando is optional because every expando EVAPORATES on a
 *           structuredClone boundary (re-probed G2-7 against kernel main:
 *           w, h, ticks, __wormholes, __scratch, lastEvents AND bytes are
 *           all undefined after clone; see _verify/probe-compat.mjs).
 *  Flag 4   seedFn journaling limitation is documented at the type level
 *           (SeedInit '{kind:"legacyFn"}' member).
 *  RC-05    Determinism claim split is VISIBLE at hash() and replayTrace()
 *           and in this header — a .d.ts reader cannot over-trust.
 *  Seat     mulberry32 seed validation DECISION (G1-2 finding: silent seed
 *  finding  aliasing) — core throws TypeError, raw kernel-exact version
 *           stays in /compat; rationale on both.
 *  Seat     σ-leak-into-permanence (CRITIQUE F1) — type-level prevention:
 *  finding  per-tick options DO NOT EXIST in core (invariant I6); setOptions
 *           is the only options surface and its lifetime is explicit.
 *
 * DETERMINISM RECEIPT (RC-05 split — binding wording; do not paraphrase, do
 * not upgrade either half without a new adjudication):
 *   tick determinism:   PRICED (corpus 12/12 + g2-corpus 24/24, four
 *                       languages, external rebuilder).
 *   op-log determinism: NOT YET PRICED (P1 exit: differential fuzzer +
 *                       multi-writer corpus — see falsification-bench).
 *
 * INTERCONNECTS (what flows between us — one line each)
 * -----------------------------------------------------
 *  OLOG-SPEC.md (G1-2)      — normative op schema, replay algorithm, hash
 *                             recipe, upgrade-honesty rule; this file types
 *                             them; where the two disagree, the SPEC wins and
 *                             this file is a bug (v0.1 amendments noted
 *                             inline: §2 field rename, §4 rule 5 retraction).
 *  CRITIQUE.md (G1-2)       — every core-vs-kernel divergence here answers a
 *                             numbered finding there (C1–C3, F1–F7), each
 *                             with a live probe receipt.
 *  ADJUDICATIONS-G1.md      — the four accepted flags + RC-05 + amendment 6
 *                             (σ plane: fixed canonical, float corpus-verbatim)
 *                             that this revision folds in.
 *  qthe.mjs (SuperInstance/qthe, 265 lines, main) — the reference kernel;
 *                             /compat mirrors it 1:1, defects included.
 *  falsification-bench (G2) — owns the differential fuzzer + multi-writer
 *                             corpus that will price op-log determinism (the
 *                             open half of the receipt above).
 *  field-lane bytePlane()   — frozen external consumer of `sub.bytes` via
 *                             @qthe/core/compat (why compat synthesizes
 *                             expandos instead of delegating; R5/R6).
 *  CODE-COMMENT-STYLE.md (G2-7) — the comment law this file's comments
 *                             follow (header receipt block, thinking markers).
 *
 * v0 → v0.1 CHANGELOG (thinking markers, per CODE-COMMENT-STYLE.md §2)
 * -------------------------------------------------------------------
 *  [2026-11-02][library-craft] Stamps split (Flag 1): KERNEL_VERSION →
 *    KERNEL_SCHEMA_VERSION; PACKAGE_VERSION added. Rule: semver governs API
 *    shape, digest stamps govern trace identity. Revisit if the guild ever
 *    publishes a monorepo where package identity and kernel identity merge.
 *  [2026-11-02][library-craft] TraceRecord/SubstrateSnapshot field
 *    `kernelVersion` → `kernelSchemaVersion`. The old name invited reading a
 *    schema stamp as an npm version at every consumption site. Envelope-only
 *    rename: digest JSON keys are unchanged, so the OLOG-SPEC §7.3 canary
 *    hash stands. Free now (nothing published), expensive forever after —
 *    that is why it happens in v0.1. Amends OLOG-SPEC §2 table.
 *  [2026-11-02][library-craft] TickOptions REMOVED; tick()/run() take no
 *    options (invariant I6). v0 allowed per-tick σ and its spec §4 rule 5
 *    leaned on "engine auto-journaling" — incoherent on inspection: a
 *    per-tick override journaled as a sticky setOptions op makes replay
 *    DIVERGE from live behavior; journaled with synthetic revert ops it
 *    doubles sweep entries and puts words in the log that were never the
 *    injector's intent (ops model injector intent, OLOG-SPEC §3). OLOG-SPEC
 *    §4 rule 5 is retracted accordingly. The kernel's per-tick opts survive
 *    kernel-exact in /compat, σ-leak included, documented. Revisit if a
 *    priced use case demands ephemeral non-journaled probing — the answer
 *    then is a SEPARATE probe API returning a throwaway substrate, never a
 *    side door into the journaled one.
 *  [2026-11-02][library-craft] mulberry32: core validates (TypeError), raw
 *    kernel-exact version in /compat — full rationale at both functions.
 *  [2026-11-02][library-craft] compat typed honestly (Flag 3): all expandos
 *    optional (they evaporate on clone — probed), full 17-export kernel
 *    mirror with @deprecated, kernel event shape typed as LegacyTwinEvent
 *    (v0 wrongly reused engine TwinEvent, which requires a `tick` field the
 *    kernel's events do not carry).
 *
 * DESIGN INVARIANTS (all enforced by the engine)
 * ----------------------------------------------
 *   I1  All state mutation is JOURNALED. Cells and the wormhole table are
 *       written only by `tick()` (the physics) or `inject()` (the op-log).
 *       `sub.cells` is exposed live for zero-copy rendering, but writing it
 *       bypasses the journal and is a caller contract violation — `hash()`
 *       will fingerprint whatever you did, and replay will disagree.
 *   I2  Everything that crosses a serialization boundary (op-log entries,
 *       snapshots, traces) is structuredClone-safe and JSON-able plain data:
 *       no functions, no expandos, no self-pointers.
 *   I3  Codec functions VALIDATE and throw on out-of-domain input. The
 *       reference kernel masked silently (pack(7,100) === pack(3,36));
 *       masking is available only in @qthe/core/compat. Silent aliasing is
 *       the enemy of determinism forensics.
 *   I4  `tick()` mutates in place and returns THIS TICK'S EVENTS — never the
 *       substrate (kills the mutate-and-return aliasing footgun; the legacy
 *       mutate-and-return contract survives in @qthe/core/compat per R6).
 *   I5  No Math.random inside the engine. `mulberry32` is caller-side and
 *       seed-checked: non-integer, negative, or ≥ 2^32 seeds throw TypeError
 *       (v0.1 decision — see mulberry32 for the rationale) instead of
 *       silently aliasing the way the kernel's `>>> 0` does.
 *   I6  (v0.1) Every dynamics parameter is JOURNALED. σ and the wormhole
 *       flag change ONLY via `setOptions` ops; `tick()` accepts no options
 *       at all. Rationale: the reference kernel's one-tick σ override leaked
 *       into permanence through the lazily-constructed table (CRITIQUE F1,
 *       receipt V5 re-confirmed G2-7: after tick({sigma:5}) then tick({}),
 *       table.sigma === 5), and ANY unjournaled dynamics input is
 *       unreplayable by construction. The type system now makes the leak
 *       inexpressible: there is no per-tick σ parameter to leak.
 */

// ─────────────────────────────────────────────────────────────────────────────
// @qthe/core/errors — error taxonomy
// ─────────────────────────────────────────────────────────────────────────────

declare module "@qthe/core/errors" {
  /**
   * Stable machine-readable error codes. Never reorder; only append.
   * Note (v0.1): "E_CODEC_PRNG_SEED" is carried by {@link PrngSeedError},
   * which is a TypeError subclass, not a QtheError — see that class for why.
   */
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
   * Base class for every QtheError thrown by @qthe/core. `code` is stable
   * across releases (append-only, see QtheErrorCode); `message` is for humans
   * and is NOT part of any contract.
   */
  export class QtheError extends Error {
    readonly code: QtheErrorCode;
    constructor(code: QtheErrorCode, message: string, options?: { cause?: unknown });
  }

  /** Thrown by codec functions (pack/unpack/psi/vectorPass). */
  export class CodecError extends QtheError {}
  /** Thrown for bad substrate dimensions. */
  export class DimensionError extends QtheError {}
  /** Thrown when validating or applying an op-log entry. */
  export class OpError extends QtheError {}
  /** Thrown when a trace cannot be replayed (stamps, shape, or hash). */
  export class ReplayError extends QtheError {}
  /** Thrown when a snapshot cannot be restored. */
  export class SnapshotError extends QtheError {}

  /**
   * Thrown by @qthe/core's mulberry32() when the seed is not an integer in
   * [0, 2^32) — i.e. non-integer, negative, or ≥ 2^32.
   *
   * [2026-11-02][library-craft] Deliberately a TypeError, NOT a QtheError:
   * a bad seed is an argument-domain violation, and JS convention routes
   * those to TypeError — ordinary argument-validation tooling and muscle
   * memory (`catch (e) { if (e instanceof TypeError) … }`) should catch it.
   * The stable code "E_CODEC_PRNG_SEED" rides along for programmatic
   * branching. Single-inheritance means it cannot also be a QtheError; the
   * code field keeps it inside the taxonomy. Revisit if a second
   * argument-domain error appears (then promote a shared
   * `QtheArgumentError extends TypeError` base).
   */
  export class PrngSeedError extends TypeError {
    readonly code: "E_CODEC_PRNG_SEED";
  }
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

  // ── Version stamps (Flag 1 — read this before touching any of them) ───────
  //
  // THE RULE: npm semver governs API SHAPE (what compiles against the
  // package); digest stamps govern TRACE IDENTITY (which traces hash-match
  // this kernel). They are independent tracks that meet only in release
  // notes. Package 0.4.2 may legitimately ship KERNEL_SCHEMA_VERSION "0.1.0";
  // a stamp bump is trace-breaking and therefore a semver MAJOR by policy,
  // but a semver major does NOT imply a stamp bump. Because stamps live
  // INSIDE the digest (OLOG-SPEC §7.2), any stamp change re-hashes every
  // trace in existence — loudly, by design (§8). Using package semver as a
  // stamp would re-hash the world on every patch release: that conflation
  // is precisely what Flag 1 kills.

  /**
   * npm semver of the @qthe/core package (from package.json). Governs API
   * shape ONLY. Appears in NO artifact, NO digest, NO snapshot — by law
   * (see the stamp rule above).
   */
  export const PACKAGE_VERSION: string;

  /**
   * Kernel BEHAVIOR stamp — what a trace MEANS on this build, not how the
   * package is numbered. "0.1.0" at time of writing. Bumps only under the
   * two-class rule (OLOG-SPEC §8): a release is either trace-compatible
   * (stamp may stay; canary corpus all green) or bump-and-rehash (every
   * historical hash stops matching, corpus regenerates, migration note
   * ships). Feeds the digest key "kernel" (JSON key unchanged since v0 —
   * the §7.3 canary hash depends on it).
   */
  export const KERNEL_SCHEMA_VERSION: string;

  /**
   * SPEC.md revision the kernel implements. A digest stamp (same two-class
   * rule), NOT the spec document's own editorial version unless the SPEC
   * revision changes observable trace/event behavior.
   */
  export const SPEC_VERSION: string;

  /** Op-log format major ("1"). Additive optional fields bump minor-only. */
  export const OLOG_VERSION: "1";

  /** Snapshot format version. */
  export const SNAPSHOT_VERSION: "1";

  /** Trace/hash format version; also the hash string prefix. */
  export const HASH_VERSION: "qth1";

  /** Canonical name of the digest primitive. */
  export const HASH_ALGORITHM: "sha256";

  /**
   * Default bridge scale σ = log2(3) ≈ 1.584962500721156.
   *
   * Plane note (ADJUDICATIONS-G1 amendment 6 / RC-11, COST-OF-EXACTNESS):
   * the fixed plane is canonical for products, the float plane for
   * corpus-verbatim runs, both to be version-stamped; the plane stamp is
   * NOT yet in the digest (v0.1 keeps the §7.3 canary hash stable) — the
   * plane-scoped corpus + stamp plan is owed at P2.
   */
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

  /**
   * Write one raw byte. The byte-literal path — every byte value is a legal
   * cell, so this op is total on its domain.
   */
  export interface SetByteOp extends OpBase {
    op: "setByte";
    x: number;
    y: number;
    c: Byte;
  }

  /**
   * Bulk literal write of a row-major byte block. Bounds-checked against the
   * grid (out-of-bounds → OpError, no clipping). This is ALSO the seed
   * escape hatch — see SeedInit's bytes-capture ladder.
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
   *
   * The `seed` field is validated exactly like core's mulberry32(): it must
   * be an integer in [0, 2^32) — non-integer, negative, or ≥ 2^32 throws
   * (OpError E_OP_BOUNDS here, because inside an op it is a field-domain
   * violation; the standalone function throws TypeError — see mulberry32).
   * The kernel's `>>> 0` truncation would silently alias seeds (V3/V3b/V3c).
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
   * must be an integer ≥ 0 (0 = present but inert: reads guard on it,
   * mirroring kernel R4).
   */
  export interface WhWriteOp extends OpBase {
    op: "whWrite";
    slot: number; // 0..63
    x: number;
    y: number;
    resonance: number;
  }

  /**
   * Vacate one slot (`slot` given) or the whole table (omitted; also resets
   * the cumulative write counter, mirroring kernel `clear()`). Single-slot
   * clear leaves `totalWrites` monotone.
   */
  export interface WhClearOp extends OpBase {
    op: "whClear";
    slot?: number;
  }

  /**
   * Sticky tick options. In @qthe/core this is THE options surface — the
   * only way σ or the wormhole flag ever change (invariant I6).
   *
   * LIFETIME (explicit, binding): an op at boundary `k` takes effect for
   * every tick AFTER `k` — i.e. tick `k+1` onward — and persists until
   * superseded by a later setOptions. Ticks before the first setOptions run
   * at the defaults σ = log2(3), wormholes = true. There is no per-tick
   * override in core (v0.1 removed TickOptions; the kernel's one-tick σ
   * escape hatch leaked into permanence through the lazy table constructor —
   * CRITIQUE F1, receipt V5 — and an unjournaled dynamics input is
   * unreplayable by construction). Kernel-exact per-tick opts, leak
   * included, survive only in @qthe/core/compat.
   *
   * σ sweep recipe (C3): for each arm — inject({op:"setOptions", sigma:σ_i}),
   * then run(n). Every arm is journaled and replays exactly; the sweep is a
   * set of traces, not a set of memories.
   */
  export interface SetOptionsOp extends OpBase {
    op: "setOptions";
    /** Sticky σ from the next boundary on. JCS-serialized float (§7.1). */
    sigma?: number;
    /** Sticky wormhole gate from the next boundary on (paired-arm OFF = false). */
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
   * Note: NO sigma parameter, ever. σ lives on the Substrate and changes
   * only through journaled setOptions ops (invariant I6) — the kernel's
   * table carried a constructor σ, which is how the one-tick override leaked
   * into permanence (CRITIQUE F1). A table that cannot remember a σ cannot
   * leak one.
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
     * wormhole to the origin, and a NaN resonance made twins silently never
     * fire); core throws OpError instead. Direct writes are journaled as
     * whWrite ops so replay stays exact.
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
    /** Carries KERNEL_SCHEMA_VERSION — the behavior stamp, NOT the npm
     *  package version (Flag 1; see the stamp rule at the constants). */
    kernelSchemaVersion: string;
    /** Carries SPEC_VERSION. */
    specVersion: string;
    w: number;
    h: number;
    ticks: number;
    /** Sticky σ at snapshot time (derivable from the journal; included
     *  deliberately for forensic readability — the seal shows what a
     *  stranger can eyeball without replaying). */
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
   *
   * There is NO seed field, on purpose (Flag 2): the seed IS the ops at
   * `at === 0` (see SeedInit). Two records of one fact drift apart.
   */
  export interface TraceRecord {
    formatVersion: "1";
    /** Carries KERNEL_SCHEMA_VERSION — the behavior stamp, NOT the npm
     *  package version. [2026-11-02][library-craft] renamed from
     *  `kernelVersion` in v0.1 (envelope-only; digest JSON keys unchanged,
     *  so the OLOG-SPEC §7.3 canary hash stands). Amends OLOG-SPEC §2. */
    kernelSchemaVersion: string;
    /** Carries SPEC_VERSION. */
    specVersion: string;
    ologVersion: "1";
    w: number;
    h: number;
    /** Number of ticks applied (the substrate's ticks at trace time). */
    tickCount: number;
    /** The full op-log, INCLUDING the seed ops at `at === 0` (Flag 2). */
    ops: ReadonlyArray<Op>;
    /** Final cell plane, lowercase hex, row-major (informational view). */
    cellsHex: string;
    /** Occupied wormhole slots at trace time (informational view). */
    table: ReadonlyArray<WormholeSlotView>;
    /** Events emitted by the LAST tick (informational view; replay recovers
     *  the full per-tick stream via ReplayResult.eventsByTick). */
    events: ReadonlyArray<TwinEvent>;
    /** Seal: version-stamped digest per OLOG-SPEC §7. */
    stateHash: string;
  }

  // ── Substrate ─────────────────────────────────────────────────────────────

  /**
   * Creation seed — and the SEED-CAPTURE LADDER (Flag 2, adjudicated).
   *
   * SINGLE NORMATIVE SOURCE: the seed IS the ops journaled at `at === 0`.
   * No artifact (trace, snapshot, record of any kind) carries a separate
   * seed field; two records of one fact drift apart, one record cannot
   * (OLOG-SPEC §5). Every kind below lands in the journal at at:0 as
   * exactly one op, ordered here by trace compactness — every rung is
   * byte-exact, rungs only trade bytes for re-derivability:
   *
   *   {kind:"mulberry32"} → one seedMulberry32 op — 4 numbers, re-derivable,
   *                                            the compact research default.
   *   {kind:"uniform"}    → one fillRect op      — 2 numbers, constant plane.
   *   {kind:"bytes"}      → one setBytes op      — w·h bytes, literal.
   *   {kind:"legacyFn"}   → one setBytes op      — the fn runs ONCE at
   *                                            creation; its BYTES are
   *                                            journaled (rung below).
   *
   * The ladder is the honest answer to exotic seedFns (Flag 4, documented
   * at the legacyFn member): anything a function can compute, a captured
   * byte block can replay — at the cost of w·h journal bytes. Prefer rungs
   * top-down; the bottom rung exists so that no caller ever has to choose
   * between "exact" and "journaled".
   *
   * No seed → no ops at at:0: the canonical empty substrate is all-Ground
   * d=0, and two empty-seeded substrates on the same dims are the same
   * trace input, on purpose.
   */
  export type SeedInit =
    | { kind: "bytes"; bytes: Uint8Array | readonly number[] }
    | { kind: "uniform"; tau: Tau; d: D }
    | { kind: "mulberry32"; seed: number; tauFromRng: boolean; dFromRng: boolean; tau?: Tau; d?: D }
    /**
     * Bottom rung of the seed-capture ladder — the legacy escape hatch.
     *
     * JOURNALING LIMITATION (Flag 4, stated at the type level): an
     * arbitrary seedFn CANNOT be journaled — closures are not data
     * (OLOG-SPEC INV-1). This kind trades seed compactness for exactness:
     * `fn` runs exactly ONCE, at creation; the bytes it returns are the
     * provenance; the function itself never enters any artifact. A trace
     * can therefore testify WHAT bytes made the substrate, never WHICH
     * function made them. If a record needs the function's identity, keep
     * it in your own receipt layer (name, source, digest of source) — the
     * kernel journals only what it can replay.
     *
     * Argument order is (x, y, i) — the R6 frozen cross-lane contract. The
     * kernel's own doc comment says `seedFn(i, x, y)` while its code calls
     * `fn(x, y, i)` (CRITIQUE F4; receipt V8 re-confirmed G2-7: observed
     * [[0,0,0],[1,0,1],[2,0,2]] — x varies fastest). Core pins the CODE's
     * order, because the frozen contract and the code agree and the comment
     * is the typo.
     */
    | { kind: "legacyFn"; fn: (x: number, y: number, i: number) => Byte };

  export interface CreateInit {
    /** Grid width. Positive integer ≤ 2^16. */
    w: number;
    /** Grid height. Positive integer ≤ 2^16. */
    h: number;
    /**
     * Initial state; see SeedInit for the ladder. Omitted → canonical empty
     * seed (all-Ground d=0, journaled as no ops). Whatever is given is
     * journaled at `at === 0`, so the journal is always the complete
     * provenance — single normative source (Flag 2).
     */
    seed?: SeedInit;
  }

  /**
   * A substrate handle: grid, owned wormhole table, journal, tick engine.
   *
   * Obtain via {@link Substrate.create} or {@link Substrate.restore} — never
   * `new`. The handle is a real object (not a Uint8Array with expandos): it
   * survives structuredClone boundaries via snapshot()/restore(), and its
   * `toJSON()` makes JSON.stringify produce the safe serialization by
   * default.
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
    /**
     * Sticky σ (default log2(3)). Read-only handle state: it changes ONLY
     * through journaled setOptions ops (invariant I6) — there is no setter,
     * no constructor leak path, and no per-tick override in core. The value
     * is always derivable from the journal; it is sealed into hash() for
     * forensic readability.
     */
    get sigma(): number;
    /**
     * The owned wormhole table. Writes through this handle are journaled as
     * whWrite ops (both `inject({op:"whWrite",…})` and direct
     * `table.write(...)` append to the journal), so replay stays exact.
     */
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
     * the kernel's receipts R1–R4, unchanged and trace-sealed (determinism
     * status: see the receipt block on hash()).
     *
     * Takes NO options (invariant I6, v0.1): every dynamics parameter — σ,
     * the wormhole gate — is journaled substrate state, changed only by
     * setOptions ops. [2026-11-02][library-craft] v0 accepted per-tick
     * TickOptions; removed because an unjournaled per-tick input cannot be
     * replayed and the kernel's variant of it leaked into permanence (F1).
     * The G6 paired-arm OFF arm and the C3 σ sweep are expressed as
     * journaled setOptions ops (see SetOptionsOp for the sweep recipe).
     */
    tick(): ReadonlyArray<TwinEvent>;

    /**
     * Run `count` ticks (convenience; identical to count × tick). Returns
     * the per-tick event arrays. No options — same law as tick() (I6).
     */
    run(count: number): ReadonlyArray<ReadonlyArray<TwinEvent>>;

    /** StructuredClone-safe, versioned snapshot. Round-trip law:
     *  Substrate.restore(s.snapshot()).hash() === s.hash(). */
    snapshot(): SubstrateSnapshot;

    /**
     * Version-stamped state digest: "qth1:" + 64 lowercase hex chars.
     * Recipe (normative): OLOG-SPEC §7. Covers versions, dims, ticks, σ,
     * cells, table, and an opsHash of the journal — so it seals BOTH the
     * state and its provenance.
     *
     * DETERMINISM RECEIPT (RC-05 split, ADJUDICATIONS-G1 — binding wording):
     *   tick determinism:   PRICED (corpus 12/12 + g2-corpus 24/24, four
     *                       languages, external rebuilder).
     *   op-log determinism: NOT YET PRICED (P1 exit: differential fuzzer +
     *                       multi-writer corpus — see falsification-bench).
     * What that means for THIS function: identical (cells, table, σ, ops,
     * stamps) hash identically on this build — priced. Whether replaying a
     * multi-writer op-log across independent implementations produces the
     * identical journal/ordering everywhere is the unpriced half; until the
     * falsification-bench corpus lands, treat cross-implementation op-log
     * claims as unpriced, because they are.
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
    toJSON(): TraceRecord;
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
   *
   * CHECKED (v0.1 decision): `seed` must be an integer in [0, 2^32) —
   * non-integer, negative, or ≥ 2^32 throws {@link PrngSeedError} (a
   * TypeError carrying code "E_CODEC_PRNG_SEED").
   *
   * DECISION RATIONALE (mulberry32 seed validation — G1-2 finding, folded
   * v0.1; the finding, the probe, and the ruling are all part of this
   * receipt):
   *   [2026-11-02][library-craft] WHY VALIDATE: the kernel truncates with
   *   `>>> 0`, so mulberry32(2**32+5) ≡ mulberry32(5),
   *   mulberry32(-1) ≡ mulberry32(2**32-1), and mulberry32(5.7) ≡
   *   mulberry32(5) — all SILENT, zero diagnostics (re-probed G2-07 against
   *   kernel main: V3/V3b/V3c). A determinism library whose seed function is
   *   non-injective on its declared domain manufactures unreproducible-by-
   *   illusion science: a seed sweep crossing the 2^32 boundary reports a
   *   "stability plateau" that is modulo arithmetic in a lab coat.
   *   WHY TypeError (not CodecError): the seed is an argument-domain
   *   violation — JS convention routes those to TypeError, so generic
   *   argument-checking tooling and ordinary muscle memory catch it; the
   *   stable code rides along for programmatic branching (see PrngSeedError).
   *   WHY THE RAW VERSION STAYS IN /compat: kernel-exact behavior is a
   *   frozen contract — scripts that relied on wrap (deliberately or not)
   *   keep byte-identical output; only new code gets the strict surface.
   *   REVISIT IF: a sealed corpus is found to contain wrapped seeds — the
   *   remedy is a warning-only mode in /compat, never the removal of core
   *   validation.
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

  /**
   * Hash a trace record without a substrate (verification tool). Same
   * recipe as Substrate.hash(); OLOG-SPEC §7. Determinism receipt: see the
   * binding block on Substrate.hash() — this function inherits it verbatim.
   */
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
   * is normative: OLOG-SPEC §6 (v0.1 note: with per-tick options removed
   * from core, replay applies ops at boundaries and ticks with NO options —
   * the pseudocode's per-tick `opts` parameter is gone; §4 rule 5 is
   * retracted, see the file header).
   *
   * DETERMINISM RECEIPT (RC-05 split, ADJUDICATIONS-G1 — binding wording):
   *   tick determinism:   PRICED (corpus 12/12 + g2-corpus 24/24, four
   *                       languages, external rebuilder).
   *   op-log determinism: NOT YET PRICED (P1 exit: differential fuzzer +
   *                       multi-writer corpus — see falsification-bench).
   * What that means for THIS function: single-writer logs produced and
   * replayed by THIS build are exact — that is priced. Whether INDEPENDENT
   * implementations agree on multi-writer op ordering, float serialization
   * at the seams, and validation corners is the unpriced half this function
   * CANNOT promise yet; the falsification-bench differential fuzzer and
   * multi-writer corpus are the P1 exit that will price it. Until then:
   * cross-implementation replay agreements are anecdote, not receipt.
   *
   * @param expectMatch When true (default), a hash mismatch throws
   *        ReplayError E_REPLAY_HASH instead of returning matches:false —
   *        use false when deliberately probing cross-version divergence.
   */
  export function replayTrace(trace: TraceRecord, opts?: { expectMatch?: boolean }): ReplayResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// @qthe/core/compat — the reference kernel surface, frozen and deprecated
// ─────────────────────────────────────────────────────────────────────────────

declare module "@qthe/core/compat" {
  import type { TraceRecord } from "@qthe/core/engine";

  /**
   * The reference-kernel surface (qthe.mjs @ main), frozen 1:1 and
   * deprecated. Every export preserves kernel behavior EXACTLY — including
   * the defects listed below — because kernel-exact behavior is a frozen
   * cross-lane contract (R6: research scripts, and the field lane's
   * bytePlane() reading `sub.bytes`, must not silently break). Only new
   * code gets the strict @qthe/core surface.
   *
   * DEFECTS PRESERVED DELIBERATELY (each with its CRITIQUE.md receipt —
   * do not "fix" these here; fixing them is what @qthe/core is for):
   *   - every expando (w, h, ticks, __wormholes, __scratch, bytes,
   *     lastEvents) EVAPORATES on structuredClone()/postMessage — the bytes
   *     survive, the metadata does not, and tick() then throws an error
   *     that blames you (C1/V1; re-probed G2-07: `bytes` is dropped too).
   *   - JSON.stringify(substrate) throws (circular via the `bytes`
   *     self-pointer) (C1/V2).
   *   - pack masks (pack(7,100) === pack(3,36)); psi masks (tau & 3);
   *     makeSubstrate masks seedFn output (& 0xff) (C2/V4).
   *   - mulberry32 truncates seeds via `>>> 0`: 2**32+5 ≡ 5, -1 ≡ 2**32-1,
   *     5.7 ≡ 5 — all silent (C2/V3; the raw version lives HERE on purpose,
   *     see the mulberry32 decision rationale in @qthe/core/engine).
   *   - WormholeTable.write coerces x/y/resonance through Int32Array:
   *     NaN → 0 retargets a twin to the origin; a NaN resonance becomes 0,
   *     which the read guard then rejects — a twin that should fire
   *     silently never exists (C2/V6).
   *   - tick(sub, {sigma:X}) on a substrate with no table yet creates the
   *     table with constructor σ = X and PERSISTS it; later option-less
   *     ticks run at σ = X while the doc comment promises "for this tick"
   *     (F1/V5, re-confirmed G2-07: table.sigma === 5 after
   *     tick({sigma:5}); tick({})).
   *   - lastEvents is a single overwritten slot — events over time are
   *     silently wrong, not absent (F3).
   *   - seedFn's doc comment in the kernel says (i, x, y); the code calls
   *     (x, y, i) (F4/V8). This typing follows the code, which follows R6.
   *
   * TYPED HONESTLY (Flag 3): this module does not pretend the legacy
   * substrate is a safe object. Every expando on LegacySubstrate is
   * OPTIONAL because the values that actually flow through these functions
   * include post-clone substrates, on which every expando is undefined.
   * The friction is the warning. The expando surface is SYNTHESIZED on a
   * real Uint8Array view over the engine's plane (not delegated to the
   * handle) precisely so frozen external readers of `sub.bytes` keep
   * working.
   *
   * Migration map (every export below is @deprecated):
   *   makeSubstrate(w,h,fn)  → Substrate.create({w, h, seed: {kind:"legacyFn", fn}})
   *   tick(sub, opts)        → sub.tick()                    (no opts; I6)
   *   σ changes              → inject({op:"setOptions", sigma})
   *   traceView(sub)         → sub.trace()
   *   pack/unpack/psi/etc.   → @qthe/core/codec              (checked; throws)
   *   mulberry32             → @qthe/core/engine mulberry32  (checked; throws)
   *   WormholeTable          → sub.wormholes                 (owned, σ-free)
   */

  /**
   * The kernel's event shape — kind, position, slot, resonance, term.
   * NOTE: the kernel's events carry NO `tick` field (v0 typed them as the
   * engine's TwinEvent, which requires one — that was dishonest typing;
   * fixed v0.1). Core's TwinEvent is this shape plus a 1-based `tick`.
   */
  export interface LegacyTwinEvent {
    kind: "twin";
    x: number;
    y: number;
    slot: number;
    resonance: number;
    term: number;
  }

  /**
   * The kernel's WormholeTable — constructor takes σ, which is HOW the
   * one-tick σ override leaked into permanence (F1): the lazy
   * `new WormholeTable(opts.sigma)` in tick() outlived the call that
   * justified it. Preserved here kernel-exact, leak included. `write`
   * validates ONLY the slot (RangeError); x/y/resonance coerce silently
   * through the Int32Array backing (receipt V6).
   */
  export class LegacyWormholeTable {
    /** Bridge scale captured at construction — the F1 leak vector. */
    sigma: number;
    constructor(sigma?: number);
    /** @throws {RangeError} if slot is outside 0..63 (the kernel's only validation). */
    write(slot: number, x: number, y: number, resonance: number): void;
    read(slot: number): { x: number; y: number; resonance: number } | null;
    occupiedCount(): number;
    totalWrites: number;
    clear(): LegacyWormholeTable;
    /** All 64 slots, occupied or null, in slot order (NOT the engine's
     *  occupied-only view — kernel-exact). */
    snapshot(): ReadonlyArray<{ slot: number; x: number; y: number; resonance: number } | null>;
  }

  /**
   * Legacy expando-carrying substrate: a Uint8Array with state hung on as
   * named properties. Every expando is OPTIONAL — present after
   * makeSubstrate(), UNDEFINED after any structuredClone()/postMessage
   * boundary (the clone keeps the bytes and drops ALL expandos, `bytes`
   * included — re-probed G2-07). Reading `sub.w` off a substrate you did
   * not build yourself means handling `number | undefined`; that is not
   * noise, that is the type system telling you the truth about this API.
   */
  export type LegacySubstrate = Uint8Array & {
    /** Grid width. Present after makeSubstrate(); undefined post-clone. */
    w?: number;
    /** Grid height. Present after makeSubstrate(); undefined post-clone. */
    h?: number;
    /** Tick counter (starts 0). Present after makeSubstrate(); undefined
     *  post-clone. */
    ticks?: number;
    /** Lazy persistent table (undefined until the first wormholes-enabled
     *  tick). Undefined post-clone — the whole mechanism evaporates. */
    __wormholes?: LegacyWormholeTable;
    /** Scratch double-buffer (undefined until first tick). Internal. */
    __scratch?: Uint8Array;
    /** Self-pointer to the array itself: the frozen field-lane bytePlane()
     *  contract (R5/R6). Circular for JSON.stringify (V2); dropped by
     *  structuredClone like every other expando. */
    bytes?: Uint8Array;
    /** Single overwritten slot — last tick's events only (F3). Undefined
     *  before the first tick and post-clone. */
    lastEvents?: ReadonlyArray<LegacyTwinEvent>;
  };

  /**
   * @deprecated Use Substrate.create({w, h, seed:{kind:"legacyFn", fn}}).
   * Kernel-exact. seedFn is called as fn(x, y, i) — the R6 frozen order
   * (the kernel's doc comment claiming (i, x, y) is the typo, F4/V8) — and
   * its output is masked with & 0xff (a d=64 typo is indistinguishable
   * from d=0 in every subsequent byte; C2/V4).
   */
  export function makeSubstrate(
    w: number,
    h: number,
    seedFn: (x: number, y: number, i: number) => number,
  ): LegacySubstrate;

  /**
   * @deprecated Use sub.tick() — which takes NO options (core invariant I6).
   * STILL mutates in place AND returns the same substrate (R6 frozen
   * contract: `const b = tick(a)` gives `b === a`, two names one object).
   *
   * Kernel-exact opts, defects included:
   *   - `table`: an external persistent table (cross-substrate coupling).
   *   - `sigma`: "for this tick" per the kernel's comment — EXCEPT on a
   *     substrate whose table doesn't exist yet, where the lazy
   *     constructor captures σ into persistent table state and every later
   *     option-less tick runs at it (F1/V5). This is the exact bug core's
   *     I6 exists to prevent; it is preserved here because compat is the
   *     frozen mirror, not the fix.
   *   - `wormholes: false`: paired-arm OFF arm (G6); the table is neither
   *     read nor written that tick.
   * @throws {Error} "not a substrate — use makeSubstrate()" when handed a
   *         post-clone substrate (the error blames you for a transfer the
   *         API itself broke; C1/V1/F6 — preserved kernel-exact).
   */
  export function tick(
    cells: LegacySubstrate,
    opts?: { wormholes?: boolean; table?: LegacyWormholeTable; sigma?: number },
  ): LegacySubstrate;

  /**
   * @deprecated Use sub.trace(). Kernel-exact JSON-able view; the expandos
   * never enter it (which is why traceView, not JSON.stringify, was the
   * kernel's sanctioned serialization). `wormholes` is null when the table
   * is absent or empty — R7: an empty table is trace-equivalent to
   * wormholes disabled. w/h/ticks are read off the expandos, so on a
   * post-clone substrate they are undefined here too — honestly typed.
   */
  export function traceView(
    cells: LegacySubstrate,
    events?: ReadonlyArray<LegacyTwinEvent>,
  ): {
    w?: number;
    h?: number;
    ticks: number;
    cells: number[];
    wormholes: ReadonlyArray<{ slot: number; x: number; y: number; resonance: number }> | null;
    events: ReadonlyArray<LegacyTwinEvent>;
  };

  /** @deprecated Timbres by name; numeric values are digest-relevant. Kernel-exact. */
  export const TAU: Readonly<{ GROUND: 0; ATTRACT: 1; REPEL: 2; ABSTAIN: 3 }>;
  /** @deprecated Kernel-exact D_MAX = 63. */
  export const D_MAX: 63;
  /** @deprecated Kernel-exact Ψ table [0, 1, -1, 'i']. */
  export const PSI: readonly [0, 1, -1, "i"];

  /** @deprecated Use @qthe/core/codec psi() (throws on bad τ). Kernel-exact
   *  MASKING: psi(7) === psi(3) via `tau & 3`; returns number | string
   *  honestly. */
  export function psi(tau: number): number | string;

  /** @deprecated Use @qthe/core/codec pack() (throws). Kernel-exact MASKING:
   *  pack(7,100) === pack(3,36) === 228 (V4). */
  export function pack(tau: number, d: number): number;

  /** @deprecated Use @qthe/core/codec unpack(). Kernel-exact. */
  export function unpack(c: number): { tau: number; d: number };

  /** @deprecated Use @qthe/core/codec tauOf(). Kernel-exact masking. */
  export function tauOf(c: number): number;

  /** @deprecated Use @qthe/core/codec dOf(). Kernel-exact masking. */
  export function dOf(c: number): number;

  /**
   * @deprecated Use @qthe/core/codec vectorPass() (checked: ragged rows,
   *  non-integer/oversized inputs throw). Kernel-exact: weights masked with
   *  & 0xff, xs consumed positionally — a short xs produces NaN channels
   *  silently, and integers beyond ±2^53 round before LAYER 0 sees them
   *  (cross-impl seam F1/F7).
   */
  export function vectorPass(
    weights: Array<Array<number>>,
    xs: Array<number>,
  ): Array<{ re: number; im: number }>;

  /** @deprecated Kernel-exact slot count (64). */
  export const SLOT_COUNT: 64;
  /** @deprecated Kernel-exact default σ = log2(3). */
  export const DEFAULT_SIGMA: number;

  /**
   * @deprecated Use sub.wormholes (owned, σ-free, validated). The kernel
   * class, aliased as LegacyWormholeTable — constructor σ is the F1 leak
   * vector; see that class.
   */
  export { LegacyWormholeTable as WormholeTable };

  /** @deprecated Use @qthe/core/engine nextD(). Kernel-exact rule table. */
  export function nextD(d: number, pressure: number): number;

  /**
   * @deprecated Use @qthe/core/engine mulberry32() (validated: TypeError on
   * non-integer, negative, or ≥ 2^32 seeds). This is the RAW kernel-exact
   * version, kept deliberately: `>>> 0` truncation silently aliases
   * mulberry32(2**32+5) ≡ mulberry32(5), mulberry32(-1) ≡
   * mulberry32(2**32-1), mulberry32(5.7) ≡ mulberry32(5) (V3/V3b/V3c). It
   * exists so scripts that relied on wrap keep byte-identical output while
   * new code gets the strict surface — see the full decision rationale on
   * @qthe/core/engine's mulberry32.
   */
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
