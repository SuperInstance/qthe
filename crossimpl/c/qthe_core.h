/* qthe_core.h — the qthe primitive in portable C99 (ORCH-7, roadmap phase 7).
 * Byte-exact port of qthe.mjs (LAYER 0 + LAYER 1, float plane) with an
 * integer sigma_q mode for the no-floats plane (R8). Zero dependencies
 * beyond libc. See crossimpl/c/REGISTRATION.md for the conformance contract.
 *
 * LAYER 0: one byte, two planes — tau = c>>6 {0 Ground,1 Attract,2 Repel,
 * 3 Abstain}, d = c&63. Split channels: re = sum(attract d*x) - sum(repel
 * d*x); im = sum(abstain d*x); Ground contributes to neither.
 * LAYER 1: toroidal Moore-8 (R1), pre-tick neighbor snapshot (R2), live
 * row-major LWW wormhole reads (R2/R4), tau frozen in tick, nextD rule
 * table, seeded mulberry32 for CALLERS only.
 */
#ifndef QTHE_CORE_H
#define QTHE_CORE_H

#include <stdint.h>
#include <stddef.h>

#define QTHE_D_MAX 63
#define QTHE_SLOT_COUNT 64

/* Exact reference doubles (bit patterns from the JS reference kernel):
 *   log2(3) = 0x3FF95C01A39FBD68, 2/3 = 0x3FE5555555555555.
 * Never call libm log2(): sigma travels as BITS so every platform agrees. */
static const uint64_t QTHE_SIGMA_LOG2_3_BITS = 0x3FF95C01A39FBD68ULL;

typedef struct {
  int32_t sx[QTHE_SLOT_COUNT], sy[QTHE_SLOT_COUNT];
  int32_t sr[QTHE_SLOT_COUNT];
  uint8_t occupied[QTHE_SLOT_COUNT];
  uint64_t total_writes;
  double sigma;            /* float plane */
  uint64_t sigma_q;        /* fixed plane (R8); used when use_fixed */
  int use_fixed;
} qthe_wormhole;

typedef struct {
  int32_t w, h;
  int64_t ticks;
  uint8_t *cells;          /* w*h packed bytes, row-major */
  qthe_wormhole *wh;       /* lazy-owned table (may be NULL until first tick) */
  uint8_t *scratch;        /* pre-tick snapshot buffer (internal) */
} qthe_substrate;

typedef struct {
  int32_t tick, x, y, slot, resonance;
  double term;             /* float plane term (resonance*sigma) */
  uint64_t term_q;         /* fixed plane term (resonance*sigma_q) */
} qthe_event;

/* ── LAYER 0 ────────────────────────────────────────────────────────────── */
static inline uint8_t qthe_pack(int tau, int d) { return (uint8_t)(((tau & 3) << 6) | (d & QTHE_D_MAX)); }
static inline int    qthe_tau_of(uint8_t c)     { return (c >> 6) & 3; }
static inline int    qthe_d_of(uint8_t c)       { return c & QTHE_D_MAX; }

/* Split-channel vector pass: exact int64 arithmetic (JS uses integer-exact
 * doubles; int64 is exact for all battery sizes). weights is rows*cols
 * packed bytes; xs are inputs. re/im out per row. */
void qthe_vector_pass(const uint8_t *weights, int rows, int cols,
                      const int64_t *xs, int64_t *re, int64_t *im);

/* ── LAYER 1 ────────────────────────────────────────────────────────────── */
qthe_wormhole *qthe_wh_make(double sigma);
qthe_wormhole *qthe_wh_make_fixed(uint64_t sigma_q);
void           qthe_wh_clear(qthe_wormhole *t);

qthe_substrate *qthe_make_substrate(int w, int h, const uint8_t *init_plane);
void            qthe_free_substrate(qthe_substrate *s);

/* One synchronous Moore-8 tick (mutates in place, like the JS kernel).
 * opts: wormholes=0 -> the table is never touched (paired OFF arm).
 * sigma_ptr != NULL -> override sigma this tick (float plane).
 * events (may be NULL): caller-supplied buffer, cap; returns event count. */
int  qthe_tick(qthe_substrate *s, int wormholes, const double *sigma_ptr,
               qthe_event *events, int cap);

/* Fixed-plane tick: sigma_q as integer (R8). Pass 0 to use the table's. */
int  qthe_tick_fixed(qthe_substrate *s, int wormholes, uint64_t sigma_q,
                     qthe_event *events, int cap);

/* Seeded PRNG for CALLERS (never used inside tick). Exact mulberry32. */
typedef struct { uint32_t state; } qthe_rng;
static inline void     qthe_rng_seed(qthe_rng *r, uint32_t seed) { r->state = seed; }
uint32_t qthe_rng_next(qthe_rng *r);                 /* raw 32-bit */
static inline double   qthe_rng_double(qthe_rng *r)  { return (double)qthe_rng_next(r) / 4294967296.0; }

/* Canonical plane hash (matches experiments/_harness.mjs planeHash):
 * sha256 over "WxH@t=T:<lowercase hex of the byte plane>". hex_out must be
 * >= 65 bytes. Returns 0 on success. */
int qthe_plane_hash(const qthe_substrate *s, int64_t t_override, char *hex_out);

/* Raw sha256 (needed by the hash; exposed for KATs). */
void qthe_sha256(const uint8_t *data, size_t len, uint8_t out[32]);

#endif /* QTHE_CORE_H */
