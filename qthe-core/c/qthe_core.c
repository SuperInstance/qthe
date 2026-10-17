/* qthe_core.c — the qthe primitive in portable C99 (ORCH-7).
 * Byte-exact transcription of qthe.mjs (float plane) + the R8 fixed plane.
 * Interpretation receipts honored: R1 toroidal Moore-8; R2 pre-tick
 * neighbor snapshot + LIVE row-major wormhole reads; R3 Abstain cells
 * accumulate real acc and the twin term enters pressure (sign of d-motion
 * only); R4 last-writer-wins per slot, never self-resonate; tau frozen in
 * tick; sigma never from libm (bits only).
 */
#include "qthe_core.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* ── sha256 (compact, standard) ─────────────────────────────────────────── */
static const uint32_t SHA_K[64] = {
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2};

#define ROTR(x,n) (((x) >> (n)) | ((x) << (32 - (n))))

static void sha_compress(const uint8_t block[64], uint32_t h[8]) {
  uint32_t w[64];
  for (int i = 0; i < 16; i++)
    w[i] = ((uint32_t)block[i*4] << 24) | ((uint32_t)block[i*4+1] << 16) | ((uint32_t)block[i*4+2] << 8) | (uint32_t)block[i*4+3];
  for (int i = 16; i < 64; i++) {
    uint32_t s0 = ROTR(w[i-15],7) ^ ROTR(w[i-15],18) ^ (w[i-15] >> 3);
    uint32_t s1 = ROTR(w[i-2],17) ^ ROTR(w[i-2],19) ^ (w[i-2] >> 10);
    w[i] = w[i-16] + s0 + w[i-7] + s1;
  }
  uint32_t a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
  for (int i = 0; i < 64; i++) {
    uint32_t S1 = ROTR(e,6) ^ ROTR(e,11) ^ ROTR(e,25);
    uint32_t ch = (e & f) ^ ((~e) & g);
    uint32_t t1 = hh + S1 + ch + SHA_K[i] + w[i];
    uint32_t S0 = ROTR(a,2) ^ ROTR(a,13) ^ ROTR(a,22);
    uint32_t maj = (a & b) ^ (a & c) ^ (b & c);
    uint32_t t2 = S0 + maj;
    hh=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
  }
  h[0]+=a; h[1]+=b; h[2]+=c; h[3]+=d; h[4]+=e; h[5]+=f; h[6]+=g; h[7]+=hh;
}

void qthe_sha256(const uint8_t *data, size_t len, uint8_t out[32]) {
  uint32_t h[8] = {0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19};
  size_t full = len / 64;
  for (size_t b = 0; b < full; b++) sha_compress(data + b * 64, h);
  uint8_t block[64];
  size_t rem = len - full * 64;
  memcpy(block, data + full * 64, rem);
  block[rem] = 0x80;
  memset(block + rem + 1, 0, 64 - rem - 1);
  if (rem >= 56) { sha_compress(block, h); memset(block, 0, 64); }
  uint64_t bits = (uint64_t)len * 8;
  for (int i = 0; i < 8; i++) block[56 + i] = (uint8_t)(bits >> (56 - 8 * i));
  sha_compress(block, h);
  for (int i = 0; i < 8; i++) { out[i*4] = (uint8_t)(h[i] >> 24); out[i*4+1] = (uint8_t)(h[i] >> 16); out[i*4+2] = (uint8_t)(h[i] >> 8); out[i*4+3] = (uint8_t)h[i]; }
}

/* ── LAYER 0: split-channel vector pass ────────────────────────────────── */
void qthe_vector_pass(const uint8_t *weights, int rows, int cols,
                      const int64_t *xs, int64_t *re, int64_t *im) {
  for (int j = 0; j < rows; j++) {
    int64_t r = 0, m = 0;
    for (int k = 0; k < cols; k++) {
      uint8_t c = weights[(size_t)j * cols + k];
      int64_t dv = c & QTHE_D_MAX, x = xs[k];
      switch (c >> 6) {
        case 1: r += dv * x; break;   /* Attract: +d*x  */
        case 2: r -= dv * x; break;   /* Repel:   -d*x  */
        case 3: m += dv * x; break;   /* Abstain: +d*x into imaginary */
        default: break;               /* Ground: neither */
      }
    }
    re[j] = r; im[j] = m;
  }
}

/* ── LAYER 1: wormhole table ───────────────────────────────────────────── */
qthe_wormhole *qthe_wh_make(double sigma) {
  qthe_wormhole *t = (qthe_wormhole *)calloc(1, sizeof(qthe_wormhole));
  if (!t) return NULL;
  for (int i = 0; i < QTHE_SLOT_COUNT; i++) { t->sx[i] = -1; t->sy[i] = -1; }
  t->sigma = sigma; t->use_fixed = 0;
  return t;
}

qthe_wormhole *qthe_wh_make_fixed(uint64_t sigma_q) {
  qthe_wormhole *t = qthe_wh_make(0.0);
  if (!t) return NULL;
  t->sigma_q = sigma_q; t->use_fixed = 1;
  return t;
}

void qthe_wh_clear(qthe_wormhole *t) {
  for (int i = 0; i < QTHE_SLOT_COUNT; i++) { t->sx[i] = -1; t->sy[i] = -1; t->sr[i] = 0; t->occupied[i] = 0; }
  t->total_writes = 0;
}

/* ── LAYER 1: substrate ────────────────────────────────────────────────── */
qthe_substrate *qthe_make_substrate(int w, int h, const uint8_t *init_plane) {
  if (w < 1 || h < 1) return NULL;
  qthe_substrate *s = (qthe_substrate *)calloc(1, sizeof(qthe_substrate));
  if (!s) return NULL;
  s->w = w; s->h = h; s->ticks = 0;
  s->cells = (uint8_t *)malloc((size_t)w * h);
  s->scratch = (uint8_t *)malloc((size_t)w * h);
  if (!s->cells || !s->scratch) { free(s->cells); free(s->scratch); free(s); return NULL; }
  if (init_plane) memcpy(s->cells, init_plane, (size_t)w * h);
  else memset(s->cells, 0, (size_t)w * h);
  return s;
}

void qthe_free_substrate(qthe_substrate *s) {
  if (!s) return;
  free(s->cells); free(s->scratch); free(s->wh); free(s);
}

/* ── LAYER 1: the tick ─────────────────────────────────────────────────── */
static inline int next_d(int d, double pressure) {
  if (pressure > 0) return d < QTHE_D_MAX ? d + 1 : QTHE_D_MAX;
  if (pressure < 0) return d > 0 ? d - 1 : 0;
  return d;
}
static inline int next_d_q(int d, int64_t pressure) {
  if (pressure > 0) return d < QTHE_D_MAX ? d + 1 : QTHE_D_MAX;
  if (pressure < 0) return d > 0 ? d - 1 : 0;
  return d;
}

static int tick_impl(qthe_substrate *s, int wormholes, const double *sigma_ptr,
                     uint64_t sigma_q_override, int use_fixed,
                     qthe_event *events, int cap) {
  const int w = s->w, h = s->h;
  const size_t n = (size_t)w * h;
  qthe_wormhole *table = s->wh;
  if (wormholes && !table) {
    double sig = sigma_ptr ? *sigma_ptr : 0.0;
    if (!sigma_ptr) {
      /* lazy default: log2(3) from exact bits */
      uint64_t bits = QTHE_SIGMA_LOG2_3_BITS;
      double dv; memcpy(&dv, &bits, 8);
      sig = dv;
    }
    table = use_fixed ? qthe_wh_make_fixed(sigma_q_override ? sigma_q_override : 6807362106ULL /* log2(3)*2^32 rounded */)
                      : qthe_wh_make(sig);
    if (!table) return -1;
    s->wh = table;
  }
  double sigma_f = 0.0;
  if (table) {
    if (sigma_ptr) sigma_f = *sigma_ptr;
    else if (!use_fixed) sigma_f = table->sigma;
  }
  uint64_t sigma_q = sigma_q_override ? sigma_q_override : (table ? table->sigma_q : 0);

  memcpy(s->scratch, s->cells, n);   /* pre-tick neighbor snapshot (R2) */
  const uint8_t *snap = s->scratch;
  int nev = 0;

  for (int y = 0; y < h; y++) {
    const int y_up = (y + h - 1) % h, y_dn = (y + 1) % h;
    for (int x = 0; x < w; x++) {
      const size_t i = (size_t)y * w + x;
      const uint8_t c = snap[i];
      const int tau = c >> 6, d = c & QTHE_D_MAX;
      const int x_l = (x + w - 1) % w, x_r = (x + 1) % w;
      int64_t acc = 0;
      const int nb[8][2] = {{y_up,x_l},{y_up,x},{y_up,x_r},{y,x_l},{y,x_r},{y_dn,x_l},{y_dn,x},{y_dn,x_r}};
      for (int k = 0; k < 8; k++) {
        const uint8_t nc = snap[(size_t)nb[k][0] * w + nb[k][1]];
        const int nt = nc >> 6;
        if (nt == 1) acc += (nc & QTHE_D_MAX);
        else if (nt == 2) acc -= (nc & QTHE_D_MAX);
      }
      if (use_fixed) {
        int64_t pressure = acc;
        if (tau == 3 && wormholes && table) {
          if (table->occupied[d]) {
            int32_t hx = table->sx[d], hy = table->sy[d], res = table->sr[d];
            if (res != 0 && (hx != x || hy != y)) {
              uint64_t term = (uint64_t)res * sigma_q;
              /* R8 scaled domain: pressure = acc*S + term (qthe_fixed.mjs:308) */
              pressure = acc * 4294967296LL + (int64_t)term;
              if (events && nev < cap) { events[nev].tick = (int32_t)s->ticks + 1; events[nev].x = x; events[nev].y = y; events[nev].slot = d; events[nev].resonance = res; events[nev].term = 0.0; events[nev].term_q = term; nev++; }
            }
          }
          table->sx[d] = x; table->sy[d] = y; table->sr[d] = (int32_t)(acc < 0 ? -acc : acc) + 1;
          table->occupied[d] = 1; table->total_writes++;
        }
        s->cells[i] = (uint8_t)((tau << 6) | next_d_q(d, pressure));
      } else {
        double pressure = (double)acc;
        if (tau == 3 && wormholes && table) {
          if (table->occupied[d]) {
            int32_t hx = table->sx[d], hy = table->sy[d], res = table->sr[d];
            if (res != 0 && (hx != x || hy != y)) {
              double term = (double)res * sigma_f;   /* twin resonance (R3) */
              pressure = (double)acc + term;
              if (events && nev < cap) { events[nev].tick = (int32_t)s->ticks + 1; events[nev].x = x; events[nev].y = y; events[nev].slot = d; events[nev].resonance = res; events[nev].term = term; events[nev].term_q = 0; nev++; }
            }
          }
          table->sx[d] = x; table->sy[d] = y; table->sr[d] = (int32_t)(acc < 0 ? -acc : acc) + 1;
          table->occupied[d] = 1; table->total_writes++;
        }
        s->cells[i] = (uint8_t)((tau << 6) | next_d(d, pressure));
      }
    }
  }
  s->ticks++;
  return nev;
}

int qthe_tick(qthe_substrate *s, int wormholes, const double *sigma_ptr,
              qthe_event *events, int cap) {
  return tick_impl(s, wormholes, sigma_ptr, 0, 0, events, cap);
}

int qthe_tick_fixed(qthe_substrate *s, int wormholes, uint64_t sigma_q,
                    qthe_event *events, int cap) {
  return tick_impl(s, wormholes, NULL, sigma_q, 1, events, cap);
}

/* ── mulberry32 (callers only; exact uint32 semantics) ─────────────────── */
uint32_t qthe_rng_next(qthe_rng *r) {
  uint32_t a = r->state + 0x6d2b79f5u;
  r->state = a;
  uint32_t t = a;
  t = (t ^ (t >> 15)) * (t | 1u);
  t ^= t + (t ^ (t >> 7)) * (t | 61u);
  return (t ^ (t >> 14));
}

/* ── canonical plane hash ──────────────────────────────────────────────── */
int qthe_plane_hash(const qthe_substrate *s, int64_t t_override, char *hex_out) {
  const size_t n = (size_t)s->w * s->h;
  size_t need = 32 + 2 * n + 1;
  char *buf = (char *)malloc(need);
  if (!buf) return -1;
  int off = snprintf(buf, need, "%dx%d@t=%lld:", s->w, s->h, (long long)(t_override >= 0 ? t_override : s->ticks));
  static const char HEXD[] = "0123456789abcdef";
  for (size_t i = 0; i < n; i++) { buf[off + 2*i] = HEXD[s->cells[i] >> 4]; buf[off + 2*i + 1] = HEXD[s->cells[i] & 15]; }
  buf[off + 2*n] = 0;
  uint8_t digest[32];
  qthe_sha256((const uint8_t *)buf, (size_t)off + 2 * n, digest);
  free(buf);
  for (int i = 0; i < 32; i++) snprintf(hex_out + 2*i, 3, "%02x", digest[i]);
  return 0;
}
