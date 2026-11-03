/*
 * qthe_l1.c — qthe LAYER 0 / LAYER 1 kernel, re-derived from SPEC.md alone.
 *
 * DERIVATION DISCIPLINE
 *   Written against the spec text only. No reference was made to qthe.mjs,
 *   qthe-core/, crossimpl/, fixedpoint/ or any other implementation file.
 *   (The one permitted network fetch of SPEC.md itself was made; it matches
 *   the task paste and adds only item 7 A2UI telemetry and the LAYER 2
 *   claims table — both out of scope here, except that LAYER 2 claim C3
 *   pins down sigma as a positive bridge-scale parameter; see A4.)
 *
 *   Every point where the spec left a decision open is logged, with quote,
 *   decision and confidence, in AMBIGUITY.md (entries A1..A17, referenced
 *   from this file).
 *
 * SPEC COVERAGE
 *   item 1  codec: pack/unpack bijection, tau = bits 7..6, d = bits 5..0,
 *           Psi map {0 -> 0, 1 -> +1, 2 -> -1, 3 -> i} (split re/im pair)
 *   item 3  split-channel vector pass, exact integer arithmetic
 *   item 4  64-slot wormhole table: snapshot reads, next-tick writes
 *   item 5  makeSubstrate(w,h,seedFn) + one synchronous Moore-8 toroidal
 *           tick() from a pre-tick snapshot
 *   item 6  determinism: fixed-width types, no RNG/time/UB, zeroed
 *           construction, canonical FNV-1a-64 trace hash
 *   (item 2 bounds invariance holds by construction — see BOUNDS below.
 *    Item 7 A2UI telemetry and LAYER 2 claims: out of scope.)
 *
 * BOUNDS (item 2)
 *   real accumulator: recomputed each tick from the snapshot (A11),
 *   |acc| <= 8 neighbours * 63 = 504
 *   resonance written: |acc| + 1, always in [1, 505]
 *   twin term: resonance * sigma_num / sigma_den, |term| <= 505 * 2^31,
 *   computed in int64_t — no overflow (A4)
 *   d update: d + (d < 63) in [1, 63];  d - (d > 0) in [0, 62];  d -> d
 *   => every update rule maps d from [0,63] into [0,63]; tau never mutates.
 *
 * Layout: part 1 types, part 2 public API, part 3 definitions.
 * Compile (required, zero warnings):  cc -std=c99 -Wall -Wextra -c qthe_l1.c
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
 * allocated inline in the substrate — no runtime discovery of any kind.
 * A slot is empty iff resonance == 0 (A13); an occupied slot always holds
 * resonance = |real_acc| + 1 >= 1.
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
 * deterministic (A16).  NULL seeds an all-zero (Ground, d=0) substrate. */
typedef uint8_t (*qthe_seed_fn)(uint32_t x, uint32_t y, void *user);

typedef struct qthe_substrate {
    uint32_t w;
    uint32_t h;
    qthe_cell_t *cells;     /* current grid, row-major, index = y*w + x */
    qthe_cell_t *scratch;   /* double buffer: the next grid            */
    int32_t  *real_acc;     /* per-cell real accumulator (latest tick)  */
    int64_t  *imag_acc;     /* per-cell imaginary channel (latest tick) */
    int32_t   sigma_num;    /* sigma = sigma_num / sigma_den (A4)       */
    int32_t   sigma_den;    /* positive denominator, den > 0 always     */
    qthe_slot_t wormhole[QTHE_WORMHOLE_SLOTS];          /* live table   */
    qthe_slot_t wormhole_scratch[QTHE_WORMHOLE_SLOTS];  /* staged writes*/
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
bool qthe_set_sigma(qthe_substrate_t *s, int32_t num, int32_t den);
void qthe_tick(qthe_substrate_t *s);

/* item 6 — determinism aid */
uint64_t qthe_trace_hash(const qthe_substrate_t *s);

/* ================================================================== */
/* PART 3 — definitions                                                */
/* ================================================================== */

/* --- item 1: the byte codec --------------------------------------- */

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
 *   y_j = sum_k Psi(tau(w_jk)) * d(w_jk) * x_k  =  y_re + i * y_im
 *     y_re = sum(tau=1) d*x_k  -  sum(tau=2) d*x_k     (real channel)
 *     y_im = sum(tau=3) d*x_k                          (imaginary channel)
 *   Ground (tau=0) contributes to neither channel.
 *
 * x_k is int32_t (A12); products and sums accumulate in int64_t, exact
 * (no overflow) while k * 63 * INT32_MAX <= INT64_MAX, i.e. k <= ~6.8e7.
 * The Psi pair drives both channels with zero per-tau branches.
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
    qthe_slot_t *s = &t[slot & 0x3Fu];
    s->x = x;
    s->y = y;
    s->resonance = resonance;
}

/* --- item 5: substrate lifecycle and tick ------------------------- */

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
     * uninitialized reads, ever (item 6 hygiene). */
    qthe_substrate_t *s = calloc(1u, sizeof *s);
    if (s == NULL) {
        return NULL;
    }
    s->w = w;
    s->h = h;
    s->sigma_num = 1;                   /* sigma = 1 (unit bridge scale) */
    s->sigma_den = 1;
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
    /* Both wormhole tables are already zeroed: every slot empty. */
    return s;
}

bool qthe_set_sigma(qthe_substrate_t *s, int32_t num, int32_t den)
{
    /* sigma = num / den, an exact rational (A4). The swept regime of
     * LAYER 2 claim C3 is positive: {log2(3), 0.5, 1, 2, 4}; e.g.
     * log2(3) ~= 126797/80000. den must be positive. */
    if (s == NULL || den <= 0) {
        return false;
    }
    s->sigma_num = num;
    s->sigma_den = den;
    return true;
}

void qthe_tick(qthe_substrate_t *s)
{
    /* The eight Moore offsets, encoded as unsigned two's-complement
     * wraps (UINT32_MAX = -1, 0, +1) so the toroidal arithmetic is pure
     * unsigned mod-2^32: well-defined, branchless, and sign-conversion
     * clean. Each offset is applied independently, so on degenerate tori
     * (w or h <= 2) a physical neighbour may be counted more than once —
     * documented, deterministic (A14). */
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

    /* Stage the next-tick wormhole as a carry-over copy of the current
     * one (A1, A6): every read below hits the pre-tick table only. */
    memcpy(s->wormhole_scratch, s->wormhole, sizeof s->wormhole);

    /* Per-tick channels are recomputed from the snapshot (A10, A11). */
    memset(s->imag_acc, 0, n * sizeof s->imag_acc[0]);

    for (uint32_t y = 0; y < h; y++) {
        for (uint32_t x = 0; x < w; x++) {
            const size_t idx = (size_t)y * w + x;
            const qthe_cell_t c = s->cells[idx];    /* pre-tick snapshot */
            const uint8_t tau = qthe_tau(c);
            const uint8_t d = qthe_d(c);

            /* --- item 5: Moore-8 toroidal neighbourhood pressure -------
             * "Attract neighbors add d, Repel neighbors subtract d into
             * the cell's real accumulator" — exactly Psi(tau).re of the
             * neighbour times its d (Ground and Abstain neighbours have
             * real part 0 and contribute nothing). */
            int32_t acc = 0;
            for (int i = 0; i < 8; i++) {
                const uint32_t ny = (y + h + MOORE8_WRAP[i][1]) % h;
                const uint32_t nx = (x + w + MOORE8_WRAP[i][0]) % w;
                const qthe_cell_t nc = s->cells[(size_t)ny * w + nx];
                acc += (int32_t)qthe_psi(qthe_tau(nc)).re
                     * (int32_t)qthe_d(nc);
            }

            /* --- item 5: own-data movement (exact rule, branchless) ----
             * net>0: min(d+1, 63); net<0: toward 0, i.e. max(d-1, 0);
             * net=0: unchanged. Written as d+(d<63) / d-(d>0). (A8)    */
            uint8_t nd;
            if (acc > 0) {
                nd = (uint8_t)(d + (d < 63 ? 1 : 0));
            } else if (acc < 0) {
                nd = (uint8_t)(d - (d > 0 ? 1 : 0));
            } else {
                nd = d;
            }

            /* --- item 4: wormhole protocol for Abstain cells -----------
             * Read from the pre-tick table, keyed by the pre-tick d
             * (A9); write unconditionally into the staged table for the
             * next tick, with resonance = |real_acc| + 1 (A11).        */
            if (tau == QTHE_TAU_ABSTAIN) {
                uint32_t ox;
                uint32_t oy;
                int32_t ores;
                if (qthe_wormhole_read(s->wormhole, d, &ox, &oy, &ores)
                        && (ox != x || oy != y)) {
                    /* Twin resonance: the imaginary channel receives
                     * resonance * sigma, sigma = num/den, quotient
                     * truncated toward zero (C99) — byte-exact (A4).  */
                    const int64_t twin = ((int64_t)ores
                                        * (int64_t)s->sigma_num)
                                       / (int64_t)s->sigma_den;
                    s->imag_acc[idx] += twin;
                }
                qthe_wormhole_write(s->wormhole_scratch, d, x, y,
                                    (acc < 0 ? -acc : acc) + 1);
            }

            s->real_acc[idx] = acc;
            s->scratch[idx] = qthe_pack(tau, nd);   /* tau invariant (A7) */
        }
    }

    /* Commit: swap grids; publish the staged wormhole table. */
    {
        qthe_cell_t *tmp = s->cells;
        s->cells = s->scratch;
        s->scratch = tmp;
    }
    memcpy(s->wormhole, s->wormhole_scratch, sizeof s->wormhole);
}

/* --- item 6: determinism aid, canonical trace hash ---------------- */
/*
 * "The kernel is seed-to-hash reproducible." The spec names no algorithm
 * (A15), so this re-derivation fixes one: FNV-1a-64 over a canonical,
 * endianness-independent serialization of the feed-forward state
 * (dimensions, sigma, all cell bytes row-major, all 64 wormhole slots).
 * Per-tick accumulators are pure functions of the previous hashed state
 * and are read directly from the struct instead.
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
    h = fnv1a_u32be(h, (uint32_t)s->sigma_num);
    h = fnv1a_u32be(h, (uint32_t)s->sigma_den);

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
