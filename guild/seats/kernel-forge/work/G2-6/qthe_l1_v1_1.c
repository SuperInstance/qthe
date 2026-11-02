/*
 * qthe_l1_v1_1.c — qthe LAYER 0 / LAYER 1 kernel, v1.1.
 *
 * LINEAGE
 *   v1.0 (G1-1) was re-derived from SPEC.md alone; its 17 ambiguity calls
 *   are logged in ../G1-1/AMBIGUITY.md (A1..A17). The Orchestrator
 *   adjudicated v1.0 against the reference kernel: 13/17 matches, three
 *   divergence areas (A1, A4, A10/A17). v1.1 is v1.0 patched to the
 *   reference rulings, with every other decision untouched:
 *
 *   R-live      (supersedes A1):  wormhole reads are LIVE in row-major scan
 *                                 order — a cell reads the table as it stands
 *                                 when the scan reaches it, seeing same-tick
 *                                 writes from earlier-scanned cells; its own
 *                                 write lands immediately, last-writer-wins
 *                                 per slot. The table is no longer staged.
 *   R-feedback  (supersedes A10/A17): on a twin hit, pressure = acc +
 *                                 resonance·σ, and the SIGN of pressure moves
 *                                 d (nextD rule unchanged). The twin term is
 *                                 not telemetry.
 *   R-sigma     (supersedes A4):  σ is float64. term = (double)resonance × σ
 *                                 (one IEEE-754 multiply, correctly rounded);
 *                                 pressure = (double)acc + term; compare sign.
 *                                 Default σ = 1.584962500721156 — the corpus
 *                                 decimal for log2(3); do NOT call log2(3).
 *
 *   The oracle for all three rulings is the 24-case golden corpus
 *   (corpus/g2-corpus-v1.flat, generated from the reference kernel,
 *   self-determinism-verified). No implementation file was consulted;
 *   qthe.mjs remains unread by this seat.
 *
 * =====================================================================
 *  DECISION LATTICE — every function vs SPEC item, ruling, corpus pins
 *  (case IDs refer to g2-corpus-v1; replay harness: corpus_replay.c)
 * =====================================================================
 *
 *  item 1 codec (pack/tau/d/psi/roundtrip)
 *    no ambiguity. Pinned by: l0-codec-all256 (256/256 bijection).
 *
 *  item 3 vector pass (vector_pass_row/vector_pass)
 *    A12 x_k int32_t, products/sums in int64_t (exact).
 *    Pinned by: l0-vectorpass-1 (all four timbres, signed xs, Ground adds
 *      nothing), l0-vectorpass-2 (all-Abstain row -> pure imaginary
 *      channel, negative), l0-vectorpass-3 (wide row, larger magnitudes).
 *
 *  item 4 wormhole table (clear/read/write)
 *    A2  twin hit = slot occupied AND entry coords != reader coords
 *        (strict; blocks the stale self-entry). Pinned by:
 *        sub-degenerate-1x4 (single Abstain cell, 8 ticks, 0 events —
 *        it re-trails its own writes and must never self-twin),
 *        sub-twins-noise-* (dense same-d fields: predicate shape pins
 *        tick-1 counts = #Abstain − #distinct-d exactly).
 *    A3  same-slot collision: last-writer-wins in scan order. Pinned by:
 *        sub-adjacent-lww-32x32 (3 writers on slot 20 every tick),
 *        sub-flood-abstain-16x16 (256 writers/tick).
 *    A6  table carries over across ticks (stale entries stay). Pinned by:
 *        sub-twins-desert-* (the chase is driven by tick-(t−1) entries).
 *    A9  read AND write keyed by the PRE-tick d. Pinned by:
 *        sub-twins-desert-* (P2's tick-1 write lands on slot 12 = its
 *        pre-tick d, which is what P1 hits at tick 2),
 *        sub-degenerate-1x4 (writes trail reads by one d: d moves +1 per
 *        tick, so each tick reads a still-empty slot — 0 events).
 *    A13 resonance == 0 is the empty sentinel. Pinned by: every twin case
 *        (tick 1 starts from an all-empty table; counts match only if
 *        empty slots are non-hits).
 *    R-live  reads see same-tick writes; writes land immediately.
 *        Pinned by: sub-twins-desert-* (tick-1 event count 1 with an
 *        empty initial table — only a same-tick write can occupy the
 *        slot; and the "1,1,2" chase period), sub-adjacent-lww-32x32
 *        (tick-4 triple event = chained same-tick reads A->B->C),
 *        sub-flood-abstain-16x16 (tick-1: 192 = 256 − 64 distinct d),
 *        sub-mixed-64x64-t50 (tick-1: 949 = 1013 − 64).
 *    A11 resonance written = |real_acc| + 1 ≥ 1, real_acc recomputed each
 *        tick from the grid snapshot. Pinned by: sub-twins-noise-* and
 *        sub-quarter-abstain-32x32 (resonance > 1 terms flip the sign of
 *        pressure in mixed fields; planes match only with this formula).
 *
 *  item 5 substrate (make/free/set_sigma/set_wormholes/tick)
 *    A5  Abstain cells DO accumulate neighborhood pressure. Pinned by:
 *        sub-flood-abstain-16x16 (all-Abstain plane: acc ≡ 0, resonance
 *        ≡ 1 — the C6 saturation regime).
 *    A7  τ is invariant under tick; only d moves. Pinned by: every
 *        substrate case (final planes preserve τ classes, e.g.
 *        sub-checkers-16x16 stays strictly Attract/Repel).
 *    A8  net>0 → min(d+1,63); net<0 → max(d−1,0); net=0 → unchanged.
 *        Pinned by: sub-ring-erode-16x16 (monotone erosion to d=0),
 *        sub-twins-desert-* (+1 steps 12→38/39), sub-checkers-16x16.
 *    A14 degenerate tori (w or h ≤ 2): each of the 8 Moore offsets counts
 *        independently. Pinned by: sub-degenerate-2x2, sub-degenerate-1x4
 *        (h=1: the cell is its own neighbor, per-offset).
 *    A16 seedFn(x,y,user) row-major, NULL ⇒ all-zero substrate. Not
 *        exercised by the corpus (bytes capture replaces seeding) — kept
 *        from v1.0 on spec discipline; zeroed construction is what the
 *        corpus relies on (empty table at tick 0).
 *    R-sigma (qthe_set_sigma): σ float64; term = (double)resonance × σ.
 *        Pinned by: sub-twins-desert-sigma-half (σ=0.5, resonance=1:
 *        v1.0's truncating rational σ zeroes the term, pressure 0, d
 *        frozen — the chase stalls; the float plane runs it: d 12→38/39),
 *        sub-twins-desert-default (DEFAULT decimal 1.584962500721156),
 *        sub-twins-noise-sigma-025 / -2 / -4 (σ arms differ from each
 *        other: when acc < 0 the magnitude of res·σ decides the sign of
 *        pressure, so each σ arm has its own plane).
 *    R-feedback (tick): pressure = acc + res·σ; sign moves d. Pinned by:
 *        sub-twins-desert-* (acc ≡ 0 in the desert — d moves 26/27 steps
 *        in 40 ticks ONLY through the twin term),
 *        sub-twins-noise-off vs sub-twins-noise-default (identical
 *        CELLS0, WORMHOLES 0 vs 1: different final planes — the twin term
 *        must feed d, not telemetry).
 *    wormholes ON/OFF (qthe_set_wormholes, NEW in v1.1): OFF = no reads,
 *        no writes, no feedback, no events. Pinned by: sub-twins-noise-off
 *        (0 events across 40 ticks; plane ≠ the ON arm).
 *    twin_events (NEW in v1.1, instrumentation): per-tick count of twin
 *        hits, reset at each tick start. This is the corpus EVTCNT
 *        contract; it observes the read predicate and changes nothing.
 *
 *  item 6 determinism (trace_hash)
 *    A15 FNV-1a-64 over a canonical big-endian serialization (v1.0
 *    choice; the corpus carries no hash lines, so it is UNPINNED — kept
 *    for continuity). v1.1 delta: σ_num/σ_den are gone; the σ double is
 *    hashed as the 8 big-endian bytes of its IEEE-754 bit pattern.
 *
 * BOUNDS (item 2) — v1.1
 *   real accumulator: recomputed each tick from the grid snapshot, |acc|
 *   ≤ 8·63 = 504. Resonance = |acc|+1 ∈ [1, 505]. Twin term = res·σ in
 *   float64: |term| ≤ 505·|σ| — no overflow for any sane σ. Pressure is a
 *   double whose SIGN is all that survives; the d update stays the A8
 *   closed form, mapping [0,63] → [0,63]. τ never mutates.
 *
 * Layout: part 1 types, part 2 public API, part 3 definitions.
 * Compile (required, zero warnings):  cc -std=c99 -Wall -Wextra -c qthe_l1_v1_1.c
 * Build note: default cc on x86-64 (SSE2 doubles, no -ffast-math, no FMA
 *   contraction across the two statements) is what R-sigma assumes: two
 *   IEEE-754 ops, each correctly rounded.
 */

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* ================================================================== */
/* PART 1 — types and constants                                        */
/* ================================================================== */

/* --- item 1: the byte codec --------------------------------------- */

enum {
    QTHE_TAU_GROUND  = 0,   /* Psi = 0  : static anchor                 */
    QTHE_TAU_ATTRACT = 1,   /* Psi = +1 : forward cascade              */
    QTHE_TAU_REPEL   = 2,   /* Psi = -1 : inversion layer              */
    QTHE_TAU_ABSTAIN = 3    /* Psi = i  : the Looking Glass            */
};

typedef uint8_t qthe_cell_t;        /* one byte: [tau:2 | d:6] */

/* Psi(tau) as a split-channel integer pair (re, im). The imaginary unit
 * is represented by the channel split itself — never by a float. */
typedef struct qthe_psi {
    int8_t re;
    int8_t im;
} qthe_psi_t;

/* --- item 4: the 64-slot wormhole table --------------------------- */
/*
 * "The compile-time blueprint ... static declarative allocation, zero
 * runtime discovery": exactly 64 slots, one per data value d in [0,63],
 * allocated inline in the substrate. A slot is empty iff resonance == 0
 * (A13); an occupied slot always holds resonance = |real_acc| + 1 >= 1.
 *
 * v1.1 / R-live: the table is LIVE state. There is no staged copy any
 * more (v1.0's wormhole_scratch is gone): reads during a tick see the
 * table as it stands when the scan reaches the reading cell, including
 * same-tick writes from earlier-scanned cells; each write lands
 * immediately and last-writer-wins per slot (A3).
 */

#define QTHE_WORMHOLE_SLOTS 64

typedef struct qthe_slot {
    uint32_t x;
    uint32_t y;
    int32_t  resonance;     /* 0 = empty; occupied slots are >= 1 */
} qthe_slot_t;

/* --- item 5: the substrate ---------------------------------------- */

/* Seed callback: returns the initial cell byte for (x, y); invoked in a
 * fixed row-major order (y outer, x inner) so even stateful seeders stay
 * deterministic (A16).  NULL seeds an all-zero (Ground, d=0) substrate.
 * Not exercised by the corpus (bytes capture), kept on spec discipline. */
typedef uint8_t (*qthe_seed_fn)(uint32_t x, uint32_t y, void *user);

typedef struct qthe_substrate {
    uint32_t w;
    uint32_t h;
    qthe_cell_t *cells;     /* current grid, row-major, index = y*w + x */
    qthe_cell_t *scratch;   /* double buffer: the next grid (item 5's
                             * synchronous grid update is UNCHANGED by
                             * R-live — only the wormhole table is live) */
    int32_t  *real_acc;     /* per-cell real accumulator (latest tick):
                             * neighborhood pressure only, recomputed
                             * each tick (A11); the twin term never
                             * enters it (R-feedback routes the twin
                             * term through the float pressure)        */
    double   *imag_acc;     /* per-cell imaginary channel record: the
                             * twin term as computed (float64), reset
                             * per tick. TELEMETRY ONLY in v1.1 — the
                             * causal path is pressure (R-feedback).
                             * Unchecked by the corpus.               */
    double    sigma;        /* bridge scale, float64 (R-sigma).
                             * Default 1.584962500721156 = the corpus
                             * decimal for log2(3) — do not call
                             * log2(3) at runtime.                     */
    bool      wormholes_enabled;  /* OFF = the whole item-4 protocol is
                             * skipped: no reads, no writes, no twin
                             * feedback, no events. Pinned by
                             * sub-twins-noise-off. Default: true.     */
    uint32_t  twin_events;  /* per-tick twin-hit count (corpus EVTCNT
                             * contract), reset at each tick start.
                             * Instrumentation: observes, never causes. */
    qthe_slot_t wormhole[QTHE_WORMHOLE_SLOTS];  /* LIVE table (R-live) */
} qthe_substrate_t;

/* ================================================================== */
/* PART 2 — public API                                                 */
/* ================================================================== */

/* item 1 — codec */
uint8_t qthe_pack(uint8_t tau, uint8_t d);
uint8_t qthe_tau(uint8_t c);
uint8_t qthe_d(uint8_t c);
qthe_psi_t qthe_psi(uint8_t tau);
bool qthe_codec_roundtrip_ok(void);

/* item 3 — split-channel vector pass (LAYER 0, exact integers) */
void qthe_vector_pass_row(const uint8_t *w, const int32_t *x, size_t k,
                          int64_t *y_re, int64_t *y_im);
void qthe_vector_pass(const uint8_t *w, size_t j, size_t k,
                      const int32_t *x, int64_t *y_re, int64_t *y_im);

/* item 4 — wormhole table primitives */
void qthe_wormhole_clear(qthe_slot_t t[QTHE_WORMHOLE_SLOTS]);
bool qthe_wormhole_read(const qthe_slot_t t[QTHE_WORMHOLE_SLOTS],
                        uint8_t slot, uint32_t *x, uint32_t *y,
                        int32_t *resonance);
void qthe_wormhole_write(qthe_slot_t t[QTHE_WORMHOLE_SLOTS], uint8_t slot,
                         uint32_t x, uint32_t y, int32_t resonance);

/* item 5 — substrate lifecycle and tick */
void qthe_free_substrate(qthe_substrate_t *s);
qthe_substrate_t *qthe_make_substrate(uint32_t w, uint32_t h,
                                      qthe_seed_fn seed_fn, void *user);
bool qthe_set_sigma(qthe_substrate_t *s, double sigma);       /* R-sigma */
void qthe_set_wormholes(qthe_substrate_t *s, bool enabled);   /* v1.1    */
void qthe_tick(qthe_substrate_t *s);

/* item 6 — determinism aid */
uint64_t qthe_trace_hash(const qthe_substrate_t *s);

/* ================================================================== */
/* PART 3 — definitions                                                */
/* ================================================================== */

/* --- item 1: the byte codec --------------------------------------- */
/*
 * Lattice: SPEC item 1; no ambiguity. Pinned by l0-codec-all256
 * (all 256 byte values round-trip through tau/d fields).
 */

uint8_t qthe_pack(uint8_t tau, uint8_t d)
{
    /* Total by construction: both arguments are masked into their fields,
     * so the result is always a valid cell byte. */
    return (uint8_t)(((uint32_t)(tau & 3u) << 6) | (uint32_t)(d & 0x3Fu));
}

uint8_t qthe_tau(uint8_t c)
{
    return (uint8_t)(c >> 6);            /* bits 7..6 */
}

uint8_t qthe_d(uint8_t c)
{
    return (uint8_t)(c & 0x3Fu);         /* bits 5..0 */
}

qthe_psi_t qthe_psi(uint8_t tau)
{
    /* The operator table: {0 -> 0, 1 -> +1, 2 -> -1, 3 -> i}. */
    static const qthe_psi_t PSI_TABLE[4] = {
        {  0, 0 },    /* Ground  : 0  */
        {  1, 0 },    /* Attract : +1 */
        { -1, 0 },    /* Repel   : -1 */
        {  0, 1 }     /* Abstain : i  */
    };
    return PSI_TABLE[tau & 3u];
}

bool qthe_codec_roundtrip_ok(void)
{
    /* Spec item 1: round-trip exact for all 256 values. */
    for (int c = 0; c < 256; c++) {
        const uint8_t v = (uint8_t)c;
        const uint8_t tau = qthe_tau(v);
        const uint8_t d = qthe_d(v);
        if (qthe_pack(tau, d) != v) {
            return false;
        }
        if (tau > 3 || d > 63) {
            return false;
        }
    }
    return true;
}

/* --- item 3: split-channel vector pass ---------------------------- */
/*
 * Lattice: SPEC item 3; A12 (x_k int32_t, int64 accumulation, exact for
 * k <= ~6.8e7). Pinned by l0-vectorpass-1 (four timbres, signed xs),
 * l0-vectorpass-2 (all-Abstain row, negative imaginary result),
 * l0-vectorpass-3 (wide row, larger magnitudes).
 *
 *   y_j = sum_k Psi(tau(w_jk)) * d(w_jk) * x_k  =  y_re + i * y_im
 *     y_re = sum(tau=1) d*x_k  -  sum(tau=2) d*x_k     (real channel)
 *     y_im = sum(tau=3) d*x_k                          (imaginary channel)
 *   Ground (tau=0) contributes to neither channel.
 */

void qthe_vector_pass_row(const uint8_t *w, const int32_t *x, size_t k,
                          int64_t *y_re, int64_t *y_im)
{
    int64_t re = 0;
    int64_t im = 0;
    for (size_t i = 0; i < k; i++) {
        const qthe_psi_t psi = qthe_psi(qthe_tau(w[i]));
        const int64_t term = (int64_t)qthe_d(w[i]) * (int64_t)x[i];
        re += (int64_t)psi.re * term;    /* +1 / -1 / 0 */
        im += (int64_t)psi.im * term;    /* i -> imaginary channel      */
    }
    *y_re = re;
    *y_im = im;
}

void qthe_vector_pass(const uint8_t *w, size_t j, size_t k,
                      const int32_t *x, int64_t *y_re, int64_t *y_im)
{
    /* w is a j x k weight matrix in row-major order. */
    for (size_t r = 0; r < j; r++) {
        qthe_vector_pass_row(w + r * k, x, k, &y_re[r], &y_im[r]);
    }
}

/* --- item 4: wormhole table primitives ---------------------------- */
/*
 * Lattice: A13 (resonance==0 <=> empty) for clear/read/write; A2 (strict
 * coordinate guard) and A9 (pre-tick d keys the read) for the caller in
 * qthe_tick(); R-live is about WHEN the caller reads/writes, not about
 * these primitives — they are plain slot accessors.
 */

void qthe_wormhole_clear(qthe_slot_t t[QTHE_WORMHOLE_SLOTS])
{
    memset(t, 0, QTHE_WORMHOLE_SLOTS * sizeof t[0]);
}

bool qthe_wormhole_read(const qthe_slot_t t[QTHE_WORMHOLE_SLOTS],
                        uint8_t slot, uint32_t *x, uint32_t *y,
                        int32_t *resonance)
{
    const qthe_slot_t *s = &t[slot & 0x3Fu];
    if (s->resonance == 0) {
        return false;                   /* empty: no twin (A13) */
    }
    *x = s->x;
    *y = s->y;
    *resonance = s->resonance;
    return true;
}

void qthe_wormhole_write(qthe_slot_t t[QTHE_WORMHOLE_SLOTS], uint8_t slot,
                         uint32_t x, uint32_t y, int32_t resonance)
{
    /* Immediate store (R-live): under row-major scan this is exactly
     * last-writer-wins per slot (A3). Pinned by sub-adjacent-lww-32x32
     * and sub-flood-abstain-16x16 (multi-writer ticks). */
    qthe_slot_t *s = &t[slot & 0x3Fu];
    s->x = x;
    s->y = y;
    s->resonance = resonance;
}

/* --- item 5: substrate lifecycle and tick ------------------------- */
/*
 * Lattice: item 5 hygiene + A16 (seedFn contract, corpus-unexercised);
 * zeroed construction is what the corpus relies on (empty table at
 * tick 0 — the tick-1 event counts of every twin case pin it).
 */

void qthe_free_substrate(qthe_substrate_t *s)
{
    if (s == NULL) {
        return;
    }
    free(s->cells);
    free(s->scratch);
    free(s->real_acc);
    free(s->imag_acc);
    free(s);
}

qthe_substrate_t *qthe_make_substrate(uint32_t w, uint32_t h,
                                      qthe_seed_fn seed_fn, void *user)
{
    if (w == 0u || h == 0u) {
        return NULL;
    }
    if ((size_t)w > SIZE_MAX / (size_t)h) {
        return NULL;
    }
    const size_t n = (size_t)w * (size_t)h;
    if (n > SIZE_MAX / 8u) {            /* covers 8-byte imag_acc too */
        return NULL;
    }

    /* calloc everywhere: the substrate starts fully zeroed — no
     * uninitialized reads, ever (item 6 hygiene). This includes the
     * LIVE wormhole table: all slots empty at tick 0 (A13), which the
     * corpus tick-1 event counts depend on. */
    qthe_substrate_t *s = calloc(1u, sizeof *s);
    if (s == NULL) {
        return NULL;
    }
    s->w = w;
    s->h = h;
    s->sigma = 1.584962500721156;       /* R-sigma default: the corpus
                                         * decimal for log2(3) — never
                                         * computed via log2(3) */
    s->wormholes_enabled = true;        /* item 4 protocol armed; the
                                         * OFF arm (sub-twins-noise-off)
                                         * disables it explicitly */
    s->twin_events = 0;
    s->cells = calloc(n, 1u);
    s->scratch = calloc(n, 1u);
    s->real_acc = calloc(n, sizeof s->real_acc[0]);
    s->imag_acc = calloc(n, sizeof s->imag_acc[0]);
    if (s->cells == NULL || s->scratch == NULL
            || s->real_acc == NULL || s->imag_acc == NULL) {
        qthe_free_substrate(s);
        return NULL;
    }

    if (seed_fn != NULL) {
        for (uint32_t y = 0; y < h; y++) {
            for (uint32_t x = 0; x < w; x++) {
                s->cells[(size_t)y * w + x] = seed_fn(x, y, user);
            }
        }
    }
    return s;
}

/*
 * Lattice: R-sigma (supersedes A4). σ is float64, set verbatim (the
 * harness passes the corpus decimal through strtod). Pinned by
 * sub-twins-desert-sigma-half (truncation would stall the chase),
 * sub-twins-noise-sigma-025/-2/-4 (σ magnitude decides sign when
 * acc < 0), sub-twins-desert-default (DEFAULT decimal).
 *
 * NaN is out of contract (sign compares would all be false, freezing d
 * — deterministic but meaningless); the reference regime is positive.
 */
bool qthe_set_sigma(qthe_substrate_t *s, double sigma)
{
    if (s == NULL) {
        return false;
    }
    s->sigma = sigma;
    return true;
}

/*
 * Lattice: NEW in v1.1 for the corpus OFF arm. OFF skips the entire
 * item-4 protocol: no table reads (no twin hits, no feedback into
 * pressure), no table writes. Pinned by sub-twins-noise-off (0 events
 * across 40 ticks; final plane differs from the ON arm on the same
 * CELLS0 — the twin term must be causally live when enabled).
 */
void qthe_set_wormholes(qthe_substrate_t *s, bool enabled)
{
    if (s == NULL) {
        return;
    }
    s->wormholes_enabled = enabled;
}

/*
 * Lattice for qthe_tick — the heart of the kernel:
 *   item 5: synchronous Moore-8 toroidal grid update from the pre-tick
 *           snapshot (double-buffered cells; R-live changed ONLY the
 *           wormhole table, never the grid). Pinned by every substrate
 *           case; degenerate wraps pinned by sub-degenerate-2x2 and
 *           sub-degenerate-1x4 (A14: 8 offsets count independently).
 *   A5:  Abstain cells accumulate neighborhood pressure like everyone
 *        else (their Psi CONTRIBUTION is what "bypasses local weights"
 *        — it routes to the imaginary channel in item 3). Pinned by
 *        sub-flood-abstain-16x16 (all-Abstain: acc == 0 everywhere,
 *        resonance == 1, C6 saturation).
 *   A7:  τ frozen; only d moves. Pinned by every case.
 *   A8:  d + (d<63) / d - (d>0) / unchanged, driven by the SIGN of
 *        pressure. Pinned by sub-ring-erode-16x16, sub-checkers-16x16,
 *        sub-twins-desert-* (+1 steps).
 *   A9:  the wormhole read AND write are keyed by the PRE-tick d.
 *        Pinned by sub-twins-desert-* (the chase arithmetic) and
 *        sub-degenerate-1x4 (writes trail reads by one d).
 *   A11: real_acc = this tick's neighborhood pressure, recomputed;
 *        resonance written = |acc| + 1. Pinned by the noise/mixed
 *        cases (resonance > 1 swings pressure signs in mixed fields).
 *   R-live:  the read hits s->wormhole as it stands NOW (same-tick
 *        writes from earlier-scanned cells are visible); the write
 *        lands immediately. Pinned by sub-twins-desert-* (tick-1 event
 *        with an initially-empty table; "1,1,2" chase period),
 *        sub-adjacent-lww-32x32 (tick-4 triple: A reads C's stale
 *        entry, overwrites it, then B reads A's fresh write, then C
 *        reads B's — three hits off one slot in one tick),
 *        sub-flood-abstain-16x16 / sub-mixed-64x64-t50 (tick-1 counts
 *        = #Abstain − #distinct pre-d).
 *   R-feedback: on a twin hit, pressure = (double)acc + term and the
 *        SIGN of that pressure moves d (nextD unchanged). Pinned by
 *        sub-twins-desert-* (acc == 0 in the desert: d advances
 *        12→38/39 over 40 ticks only through the twin term) and by the
 *        sub-twins-noise-off/default pair (same CELLS0, different
 *        final planes).
 *   R-sigma: term = (double)resonance * sigma — one IEEE-754 multiply,
 *        correctly rounded; pressure = (double)acc + term — one add.
 *        Pinned by sub-twins-desert-sigma-half (σ=0.5, resonance=1:
 *        v1.0's truncating σ would zero the term and stall the chase)
 *        and the σ-swept arms sub-twins-noise-sigma-025/-2/-4.
 */
void qthe_tick(qthe_substrate_t *s)
{
    /* The eight Moore offsets, encoded as unsigned two's-complement
     * wraps (UINT32_MAX = -1, 0, +1) so the toroidal arithmetic is pure
     * unsigned mod-2^32: well-defined, branchless, and sign-conversion
     * clean. Each offset is applied independently, so on degenerate tori
     * (w or h <= 2) a physical neighbour may be counted more than once —
     * documented, deterministic (A14; pinned by the degenerate cases). */
    static const uint32_t MOORE8_WRAP[8][2] = {
        { UINT32_MAX, UINT32_MAX }, { 0u, UINT32_MAX }, { 1u, UINT32_MAX },
        { UINT32_MAX, 0u },                            { 1u, 0u },
        { UINT32_MAX, 1u },        { 0u, 1u },         { 1u, 1u }
    };

    if (s == NULL) {
        return;
    }

    const uint32_t w = s->w;
    const uint32_t h = s->h;
    const size_t n = (size_t)w * (size_t)h;

    /* Per-tick channels are recomputed (A10/A11: reset, twins only —
     * v1.1 keeps the imaginary record as telemetry; causality goes
     * through pressure per R-feedback). */
    s->twin_events = 0;     /* EVTCNT contract: reset at tick start */
    memset(s->imag_acc, 0, n * sizeof s->imag_acc[0]);

    /* R-live: NO table staging. Reads below hit s->wormhole as it
     * stands; writes land in it immediately (last-writer-wins per
     * slot, in row-major scan order). The GRID stays double-buffered
     * (item 5's synchronous update is untouched). */

    for (uint32_t y = 0; y < h; y++) {
        for (uint32_t x = 0; x < w; x++) {
            const size_t idx = (size_t)y * w + x;
            const qthe_cell_t c = s->cells[idx];    /* pre-tick snapshot */
            const uint8_t tau = qthe_tau(c);
            const uint8_t d = qthe_d(c);            /* pre-tick d (A9)  */

            /* --- item 5: Moore-8 toroidal neighbourhood pressure -------
             * "Attract neighbors add d, Repel neighbors subtract d into
             * the cell's real accumulator" — exactly Psi(tau).re of the
             * neighbour times its d (Ground and Abstain neighbours have
             * real part 0 and contribute nothing). Abstain cells also
             * accumulate (A5). */
            int32_t acc = 0;
            for (int i = 0; i < 8; i++) {
                const uint32_t ny = (y + h + MOORE8_WRAP[i][1]) % h;
                const uint32_t nx = (x + w + MOORE8_WRAP[i][0]) % w;
                const qthe_cell_t nc = s->cells[(size_t)ny * w + nx];
                acc += (int32_t)qthe_psi(qthe_tau(nc)).re
                     * (int32_t)qthe_d(nc);
            }

            /* --- item 4 + R-live + R-feedback + R-sigma: the wormhole
             * protocol for Abstain cells. Read the LIVE table at the
             * pre-tick d; on a twin hit the term enters pressure; then
             * write own entry to the LIVE table immediately (LWW). */
            double pressure = (double)acc;          /* R-sigma compare   */
            if (tau == QTHE_TAU_ABSTAIN && s->wormholes_enabled) {
                uint32_t ox;
                uint32_t oy;
                int32_t ores;
                if (qthe_wormhole_read(s->wormhole, d, &ox, &oy, &ores)
                        && (ox != x || oy != y)) {
                    /* Twin hit (A2 strict guard, A13 occupancy). */
                    s->twin_events++;
                    const double term = (double)ores * s->sigma;
                    pressure = (double)acc + term;  /* R-feedback */
                    s->imag_acc[idx] += term;       /* telemetry record */
                }
                /* Resonance = |real_acc| + 1 (A11): the neighborhood
                 * accumulator, NOT the pressure — the twin term never
                 * enters real_acc. Write is keyed by pre-tick d (A9)
                 * and lands immediately (R-live, A3 LWW, A6 carry). */
                qthe_wormhole_write(s->wormhole, d, x, y,
                                    (acc < 0 ? -acc : acc) + 1);
            }

            /* --- item 5: own-data movement (A8, unchanged rule) -------
             * net>0: min(d+1, 63); net<0: toward 0, i.e. max(d-1, 0);
             * net=0: unchanged. v1.1: "net" is the SIGN of pressure
             * (R-feedback): pure neighborhood sign for non-twin cells,
             * acc + resonance*sigma for twin-hitting Abstain cells. */
            uint8_t nd;
            if (pressure > 0.0) {
                nd = (uint8_t)(d + (d < 63 ? 1 : 0));
            } else if (pressure < 0.0) {
                nd = (uint8_t)(d - (d > 0 ? 1 : 0));
            } else {
                nd = d;
            }

            s->real_acc[idx] = acc;
            s->scratch[idx] = qthe_pack(tau, nd);   /* tau invariant (A7) */
        }
    }

    /* Commit the grid swap. Nothing to publish for the wormhole table:
     * it has been live all along (R-live). */
    {
        qthe_cell_t *tmp = s->cells;
        s->cells = s->scratch;
        s->scratch = tmp;
    }
}

/* --- item 6: determinism aid, canonical trace hash ---------------- */
/*
 * Lattice: A15 (v1.0 choice: FNV-1a-64, canonical big-endian stream —
 * "qthe-trace-v1" domain tag, w, h, sigma, all cell bytes row-major,
 * then 64 slots x {x, y, resonance}). UNPINNED by the corpus (no hash
 * lines) — kept for continuity, honestly flagged. v1.1 delta: sigma is
 * hashed as the 8 big-endian bytes of its IEEE-754 bit pattern (the
 * rational sigma_num/sigma_den fields are gone).
 */

static uint64_t fnv1a_byte(uint64_t h, uint8_t b)
{
    return (h ^ (uint64_t)b) * 1099511628211ULL;
}

static uint64_t fnv1a_u32be(uint64_t h, uint32_t v)
{
    h = fnv1a_byte(h, (uint8_t)(v >> 24));
    h = fnv1a_byte(h, (uint8_t)(v >> 16));
    h = fnv1a_byte(h, (uint8_t)(v >> 8));
    h = fnv1a_byte(h, (uint8_t)v);
    return h;
}

static uint64_t fnv1a_f64be(uint64_t h, double v)
{
    /* Assumes IEEE-754 binary64 (the same assumption R-sigma makes). */
    uint64_t bits = 0;
    memcpy(&bits, &v, sizeof bits);
    for (int i = 7; i >= 0; i--) {
        h = fnv1a_byte(h, (uint8_t)((bits >> (8 * i)) & 0xFFu));
    }
    return h;
}

uint64_t qthe_trace_hash(const qthe_substrate_t *s)
{
    if (s == NULL) {
        return 0;
    }

    static const char TAG[] = "qthe-trace-v1";   /* domain separation */
    uint64_t h = 14695981039346656037ULL;

    for (size_t i = 0; i < sizeof TAG - 1u; i++) {
        h = fnv1a_byte(h, (uint8_t)TAG[i]);
    }

    h = fnv1a_u32be(h, s->w);
    h = fnv1a_u32be(h, s->h);
    h = fnv1a_f64be(h, s->sigma);

    const size_t n = (size_t)s->w * (size_t)s->h;
    for (size_t i = 0; i < n; i++) {
        h = fnv1a_byte(h, s->cells[i]);
    }

    for (int i = 0; i < QTHE_WORMHOLE_SLOTS; i++) {
        h = fnv1a_u32be(h, s->wormhole[i].x);
        h = fnv1a_u32be(h, s->wormhole[i].y);
        h = fnv1a_u32be(h, (uint32_t)s->wormhole[i].resonance);
    }
    return h;
}
