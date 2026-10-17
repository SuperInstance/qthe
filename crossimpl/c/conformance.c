/* conformance.c — ORCH-7: run the fixture battery against the C port and
 * compare byte-for-byte with the JS reference kernels' recorded hashes,
 * event tuples, and term BIT PATTERNS (float) / term_q integers (fixed).
 * Exit code = number of failed cases (fail-loud). */
#include "qthe_core.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PLANE_BYTES (64 * 64)
#define MAX_EVENTS (1 << 20)
#define LINE_MAX_ (2 * MAX_PLANE_BYTES + 64)

static int failures = 0, total = 0;

static int hexval(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  return -1;
}

static int hex_to_bytes(const char *hex, uint8_t *out, size_t n) {
  for (size_t i = 0; i < n; i++) {
    int hi = hexval(hex[2 * i]), lo = hexval(hex[2 * i + 1]);
    if (hi < 0 || lo < 0) return -1;
    out[i] = (uint8_t)((hi << 4) | lo);
  }
  return 0;
}

static void double_to_hex(double d, char *out16) {
  uint64_t u; memcpy(&u, &d, 8);
  for (int i = 0; i < 16; i++) {
    int nib = (int)((u >> (60 - 4 * i)) & 0xF);
    out16[i] = (char)(nib < 10 ? '0' + nib : 'a' + nib - 10);
  }
  out16[16] = 0;
}

static double hex_to_double(const char *hex16) {
  uint64_t u = 0;
  for (int i = 0; i < 16; i++) u = (u << 4) | (uint64_t)hexval(hex16[i]);
  double d; memcpy(&d, &u, 8);
  return d;
}

static void run_vector_case(const char *id, int rows, int cols, const char *whex, const char *xline, const char *outline) {
  uint8_t *w = malloc((size_t)rows * cols);
  int64_t *xs = malloc(sizeof(int64_t) * (size_t)cols), *re = malloc(sizeof(int64_t) * (size_t)rows), *im = malloc(sizeof(int64_t) * (size_t)rows);
  if (hex_to_bytes(whex, w, (size_t)rows * cols) != 0) { printf("VEC %s FAIL bad-hex\n", id); failures++; goto done; }
  {
    const char *p = xline; int k = 0;
    while (*p && k < cols) { xs[k++] = strtoll(p, (char **)&p, 10); while (*p == ' ' || *p == ',') p++; }
    if (k != cols) { printf("VEC %s FAIL xs-count\n", id); failures++; goto done; }
  }
  qthe_vector_pass(w, rows, cols, xs, re, im);
  /* parse expected */
  char expect[4096];
  const char *bar = strchr(outline, '|');
  strncpy(expect, outline, (size_t)(bar - outline)); expect[bar - outline] = 0;
  const char *p = expect; int ok = 1;
  for (int j = 0; j < rows; j++) { int64_t v = strtoll(p, (char **)&p, 10); if (v != re[j]) ok = 0; while (*p == ' ' || *p == ',') p++; }
  p = bar + 1;
  for (int j = 0; j < rows; j++) { int64_t v = strtoll(p, (char **)&p, 10); if (v != im[j]) ok = 0; while (*p == ' ' || *p == ',') p++; }
  total++;
  if (ok) printf("VEC %s PASS\n", id); else { printf("VEC %s FAIL re/im mismatch\n", id); failures++; }
done:
  free(w); free(xs); free(re); free(im);
}

static void run_substrate_case(const char *id, int w, int h, int T, int is_fixed, int wormholes,
                               const char *sigma_kind, const char *sigma_hex,
                               const uint8_t *init_plane, const char *hash_expect,
                               const int *ev_t, const int *ev_x, const int *ev_y,
                               const int *ev_slot, const int *ev_res, const char (*ev_term)[32],
                               int n_events_expected) {
  (void)ev_t; /* tick order is implied by emission order; kept for signature clarity */
  qthe_substrate *s = qthe_make_substrate(w, h, init_plane);
  if (!s) { printf("CASE %s FAIL alloc\n", id); failures++; return; }
  qthe_event *events = malloc(sizeof(qthe_event) * MAX_EVENTS);
  int nev = 0, ok = 1;
  double sigma_d = 0.0;
  uint64_t sigma_q = 0;
  if (strcmp(sigma_kind, "bits") == 0) sigma_d = hex_to_double(sigma_hex);
  if (strcmp(sigma_kind, "q") == 0) sigma_q = strtoull(sigma_hex, NULL, 16);
  for (int t = 1; t <= T && ok; t++) {
    int n = is_fixed ? qthe_tick_fixed(s, wormholes, sigma_q, events + nev, MAX_EVENTS - nev)
                     : qthe_tick(s, wormholes, sigma_kind[0] == 'b' ? &sigma_d : NULL, events + nev, MAX_EVENTS - nev);
    if (n < 0) { ok = 0; break; }
    for (int i = 0; i < n; i++) events[nev + i].tick = t;
    nev += n;
  }
  if (nev != n_events_expected) { ok = 0; }
  for (int i = 0; ok && i < nev && i < n_events_expected; i++) {
    if (events[i].x != ev_x[i] || events[i].y != ev_y[i] || events[i].slot != ev_slot[i] || events[i].resonance != ev_res[i]) { ok = 0; break; }
    if (is_fixed) {
      char buf[32]; snprintf(buf, sizeof buf, "%llu", (unsigned long long)events[i].term_q);
      if (strcmp(buf, ev_term[i]) != 0) { ok = 0; break; }
    } else {
      char buf[32]; double_to_hex(events[i].term, buf);
      if (strcmp(buf, ev_term[i]) != 0) { ok = 0; break; }
    }
  }
  char hash[65];
  if (qthe_plane_hash(s, T, hash) != 0) ok = 0;
  else if (strcmp(hash, hash_expect) != 0) ok = 0;
  total++;
  if (ok) printf("CASE %s PASS\n", id);
  else { printf("CASE %s FAIL (events %d/%d, hash %s)\n", id, nev, n_events_expected, hash); failures++; }
  free(events); qthe_free_substrate(s);
}

int main(int argc, char **argv) {
  if (argc < 2) { fprintf(stderr, "usage: %s fixtures.txt\n", argv[0]); return 2; }
  FILE *f = fopen(argv[1], "r");
  if (!f) { perror("fopen"); return 2; }
  static char line[LINE_MAX_];
  if (!fgets(line, sizeof line, f) || strncmp(line, "QTHEFIX", 7) != 0) { fprintf(stderr, "bad magic\n"); return 2; }

  static uint8_t plane[MAX_PLANE_BYTES];
  static int ev_t[MAX_EVENTS], ev_x[MAX_EVENTS], ev_y[MAX_EVENTS], ev_slot[MAX_EVENTS], ev_res[MAX_EVENTS];
  static char ev_term[MAX_EVENTS][32];

  while (fgets(line, sizeof line, f)) {
    if (line[0] == '\n' || line[0] == '#') continue;
    if (strncmp(line, "VEC ", 4) == 0) {
      char id[64]; int rows, cols;
      sscanf(line, "VEC %63s %d %d", id, &rows, &cols);
      char whex[LINE_MAX_], xline[8192], outline[8192];
      if (!fgets(whex, sizeof whex, f) || !fgets(xline, sizeof xline, f) || !fgets(outline, sizeof outline, f)) break;
      /* strip newlines */
      whex[strcspn(whex, "\n")] = 0; xline[strcspn(xline, "\n")] = 0; outline[strcspn(outline, "\n")] = 0;
      run_vector_case(id, rows, cols, whex + 2, xline + 2, outline + 4);
    } else if (strncmp(line, "CASE ", 5) == 0) {
      char id[64], mode[16], skind[16], shex[32];
      int w, h, T, wh;
      int n = sscanf(line, "CASE %63s %d %d %d %15s %d %15s %31s", id, &w, &h, &T, mode, &wh, skind, shex);
      if (n < 8) { printf("CASE ? FAIL parse (%d fields)\n", n); failures++; continue; }
      char pline[LINE_MAX_];
      if (!fgets(pline, sizeof pline, f)) break;
      pline[strcspn(pline, "\n")] = 0;
      if (strncmp(pline, "PLANE ", 6) != 0 || hex_to_bytes(pline + 6, plane, (size_t)w * h) != 0) { printf("CASE %s FAIL plane\n", id); failures++; continue; }
      int n_ev = 0;
      if (!fgets(line, sizeof line, f)) break;
      sscanf(line, "EVENTS %d", &n_ev);
      for (int i = 0; i < n_ev; i++) {
        if (!fgets(line, sizeof line, f)) break;
        sscanf(line, "E %d %d %d %d %d %31s", &ev_t[i], &ev_x[i], &ev_y[i], &ev_slot[i], &ev_res[i], ev_term[i]);
      }
      char hash_expect[65] = "";
      if (!fgets(line, sizeof line, f)) break;
      sscanf(line, "HASH %64s", hash_expect);
      if (!fgets(line, sizeof line, f)) break; /* END */
      run_substrate_case(id, w, h, T, strcmp(mode, "fixed") == 0, wh, skind, shex,
                         plane, hash_expect, ev_t, ev_x, ev_y, ev_slot, ev_res, ev_term, n_ev);
    }
  }
  fclose(f);
  printf("\nconformance: %d/%d cases PASS, %d FAIL\n", total - failures, total, failures);
  return failures;
}
