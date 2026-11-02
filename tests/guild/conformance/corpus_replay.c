/*
 * corpus_replay.c — G2-6 battle-test harness (kernel-forge seat).
 *
 * Purpose: parse g2-corpus-v1.flat and replay every case against a qthe
 * kernel, producing a per-case PASS/FAIL conformance table. For substrate
 * FAILs it reports the first tick where per-tick event counts diverge and
 * whether the final plane diverges, so each failure can be attributed to
 * an ambiguity ruling (A1 / A4 / A10 / A17 — see DELTA-REPORT.md).
 *
 * ONE harness source, TWO build modes (chosen by run.sh):
 *
 *   default build        kernel = G1-1 qthe_l1.c, UNCHANGED (v1)
 *                        - snapshot table reads, no twin feedback, rational sigma.
 *                        - Event counting is EXTERNAL and exact: in v1 every
 *                          wormhole read hits the pre-tick table, so the number
 *                          of twin hits a tick performs is a pure predicate over
 *                          public pre-tick state (cells + wormhole table),
 *                          recomputed here before each qthe_tick().
 *                        - v1 has no wormhole ON/OFF switch. For corpus cases
 *                          with WORMHOLES 0 the event count is 0 by the arm's
 *                          contract (the reference performs no reads); v1's
 *                          table ops are plane-inert there (A17 = no feedback),
 *                          so the OFF arm still replays faithfully.
 *                        - v1 sigma is rational (A4); the corpus decimal is
 *                          approximated at 1e-8. This is provably inert in v1:
 *                          sigma reaches only the imaginary telemetry channel,
 *                          never the plane and never the event predicate.
 *
 *   -DQTHE_V11=1 build   kernel = qthe_l1_v1_1.c (v1.1 — patched to the oracle:
 *                        R-live + R-feedback + R-sigma).
 *                        - Event counting is INTERNAL: v1.1 exposes
 *                          s->twin_events, reset at each tick start.
 *                        - sigma is float64, set verbatim from the corpus
 *                          decimal (R-sigma; DEFAULT = 1.584962500721156).
 *                        - WORMHOLES 0 drives qthe_set_wormholes(s, false).
 *
 * The kernel .c is #included whole (single translation unit) so both
 * conformance tables come from the same replay code. Kernel path is
 * overridable: -DQTHE_KERNEL='"path/to/kernel.c"'.
 *
 * Corpus format (flat, line-oriented; see corpus/g2-corpus-v1.flat):
 *   CASE <id> / KIND l0-codec|l0-vectorpass|substrate
 *   l0-codec:     ROUNDTRIP <n>
 *   l0-vectorpass: ROWS <j> <k> <hex j*k bytes> / XS <k> <ints>
 *                 / EXPECTED <j> <re im pairs>
 *   substrate:    DIMS <w> <h> / TICKS <n> / SIGMA <double-decimal> [DEFAULT]
 *                 / WORMHOLES 1|0 / CELLS0 <hex> / CELLSN <hex>
 *                 / EVTCNT <n ints>
 *   END
 *
 * Compile (via run.sh): cc -std=c99 -Wall -Wextra [-DQTHE_V11=1]
 * Run: ./replay <path-to-flat-corpus>
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---- kernel selection ------------------------------------------------ */

#if defined(QTHE_V11)
#  ifndef QTHE_KERNEL
#    define QTHE_KERNEL "qthe_l1_v1_1.c"
#  endif
#  define CR_KERNEL_LABEL "qthe_l1_v1_1.c (v1.1: R-live + R-feedback + R-sigma)"
#else
#  ifndef QTHE_KERNEL
#    define QTHE_KERNEL "../G1-1/qthe_l1.c"
#  endif
#  define CR_KERNEL_LABEL "qthe_l1.c (G1-1 v1, UNCHANGED)"
#endif

#include QTHE_KERNEL

/* ---- harness types ---------------------------------------------------- */

enum {
    CR_KIND_CODEC = 0,
    CR_KIND_VECTORPASS = 1,
    CR_KIND_SUBSTRATE = 2
};

typedef struct cr_case {
    char id[128];
    int kind;
    /* l0-codec */
    long roundtrip;
    /* l0-vectorpass */
    size_t vp_j, vp_k;
    unsigned char *vp_w;      /* j*k weight bytes            */
    int32_t *vp_x;            /* k inputs                    */
    int64_t *vp_ere, *vp_eim; /* j expected outputs          */
    /* substrate */
    uint32_t w, h;
    uint32_t ticks;
    double sigma;
    int wormholes;
    unsigned char *cells0, *cellsn;
    uint32_t *evt;            /* ticks expected event counts */
    size_t evt_n;
} cr_case_t;

typedef struct cr_result {
    int pass;
    char plane[96];   /* "n/a" | "OK" | "DIFF(n cells)"            */
    char events[96];  /* "n/a" | "OK" | "tick T: mine M vs corpus C"*/
    char klass[24];   /* "" | EVENTS-ONLY | PLANE-ONLY | BOTH      */
    uint32_t *mine;   /* my per-tick event counts (substrate only) */
    size_t mine_n;
    size_t plane_diff_cells;
    size_t plane_first_idx;
    unsigned mine_byte, corpus_byte;
} cr_result_t;

/* ---- small utilities --------------------------------------------------- */

static void *cr_xmalloc(size_t n)
{
    void *p = malloc(n ? n : 1u);
    if (p == NULL) {
        fprintf(stderr, "corpus_replay: out of memory (%lu bytes)\n",
                (unsigned long)n);
        exit(2);
    }
    return p;
}

static void *cr_xcalloc(size_t n, size_t sz)
{
    void *p = calloc(n ? n : 1u, sz ? sz : 1u);
    if (p == NULL) {
        fprintf(stderr, "corpus_replay: out of memory\n");
        exit(2);
    }
    return p;
}

static int cr_hexval(int ch)
{
    if (ch >= '0' && ch <= '9') return ch - '0';
    if (ch >= 'a' && ch <= 'f') return ch - 'a' + 10;
    if (ch >= 'A' && ch <= 'F') return ch - 'A' + 10;
    return -1;
}

/* Parse `nbytes` from a hex string into a fresh buffer. Exits on error. */
static unsigned char *cr_hexbytes(const char *hex, size_t nbytes,
                                  const char *caseid, const char *field)
{
    unsigned char *out = cr_xmalloc(nbytes ? nbytes : 1u);
    if (strlen(hex) != 2u * nbytes) {
        fprintf(stderr, "corpus_replay: %s: %s hex length %lu != expected %lu\n",
                caseid, field, (unsigned long)strlen(hex),
                (unsigned long)(2u * nbytes));
        exit(2);
    }
    for (size_t i = 0; i < nbytes; i++) {
        const int hi = cr_hexval((unsigned char)hex[2u * i]);
        const int lo = cr_hexval((unsigned char)hex[2u * i + 1u]);
        if (hi < 0 || lo < 0) {
            fprintf(stderr, "corpus_replay: %s: %s: bad hex\n", caseid, field);
            exit(2);
        }
        out[i] = (unsigned char)((hi << 4) | lo);
    }
    return out;
}

/* ---- corpus parsing ---------------------------------------------------- */

#define CR_LINE_MAX 65536
#define CR_MAX_CASES 64

static char *cr_tok(char **cursor)
{
    char *s = *cursor;
    while (*s == ' ' || *s == '\t' || *s == '\r' || *s == '\n') s++;
    if (*s == '\0') { *cursor = s; return NULL; }
    char *start = s;
    while (*s != '\0' && *s != ' ' && *s != '\t' && *s != '\r' && *s != '\n') s++;
    if (*s != '\0') { *s = '\0'; s++; }
    *cursor = s;
    return start;
}

static long cr_atol_pos(const char *s, const char *caseid, const char *field)
{
    char *end = NULL;
    const long v = strtol(s, &end, 10);
    if (end == NULL || *end != '\0' || v < 0) {
        fprintf(stderr, "corpus_replay: %s: bad %s value '%s'\n",
                caseid, field, s);
        exit(2);
    }
    return v;
}

static void cr_free_case(cr_case_t *c)
{
    free(c->vp_w); free(c->vp_x); free(c->vp_ere); free(c->vp_eim);
    free(c->cells0); free(c->cellsn); free(c->evt);
    memset(c, 0, sizeof *c);
}

static size_t cr_parse_corpus(const char *path, cr_case_t *cases,
                              size_t max_cases, char *corpus_name,
                              size_t name_sz, char *kernel_tag,
                              size_t tag_sz)
{
    FILE *f = fopen(path, "r");
    if (f == NULL) {
        fprintf(stderr, "corpus_replay: cannot open corpus '%s'\n", path);
        exit(2);
    }

    char line[CR_LINE_MAX];
    cr_case_t *cur = NULL;
    size_t ncases = 0;

    while (fgets(line, sizeof line, f) != NULL) {
        char *cursor = line;
        char *kw = cr_tok(&cursor);
        if (kw == NULL) continue;

        if (strcmp(kw, "CORPUS") == 0) {
            char *v = cr_tok(&cursor);
            if (v == NULL) { fprintf(stderr, "bad CORPUS line\n"); exit(2); }
            snprintf(corpus_name, name_sz, "%s", v);
        } else if (strcmp(kw, "KERNEL") == 0) {
            char *v = cr_tok(&cursor);
            if (v == NULL) { fprintf(stderr, "bad KERNEL line\n"); exit(2); }
            snprintf(kernel_tag, tag_sz, "%s", v);
        } else if (strcmp(kw, "CASE") == 0) {
            if (ncases >= max_cases) {
                fprintf(stderr, "corpus_replay: too many cases\n");
                exit(2);
            }
            cur = &cases[ncases++];
            memset(cur, 0, sizeof *cur);
            char *v = cr_tok(&cursor);
            if (v == NULL) { fprintf(stderr, "CASE without id\n"); exit(2); }
            snprintf(cur->id, sizeof cur->id, "%s", v);
        } else if (strcmp(kw, "KIND") == 0) {
            char *v = cr_tok(&cursor);
            if (cur == NULL || v == NULL) { fprintf(stderr, "bad KIND\n"); exit(2); }
            if (strcmp(v, "l0-codec") == 0) cur->kind = CR_KIND_CODEC;
            else if (strcmp(v, "l0-vectorpass") == 0) cur->kind = CR_KIND_VECTORPASS;
            else if (strcmp(v, "substrate") == 0) cur->kind = CR_KIND_SUBSTRATE;
            else { fprintf(stderr, "unknown KIND '%s'\n", v); exit(2); }
        } else if (strcmp(kw, "ROUNDTRIP") == 0) {
            char *v = cr_tok(&cursor);
            if (cur == NULL || v == NULL) { fprintf(stderr, "bad ROUNDTRIP\n"); exit(2); }
            cur->roundtrip = cr_atol_pos(v, cur->id, "ROUNDTRIP");
        } else if (strcmp(kw, "ROWS") == 0) {
            char *vj = cr_tok(&cursor);
            char *vk = cr_tok(&cursor);
            char *hex = cr_tok(&cursor);
            if (cur == NULL || vj == NULL || vk == NULL || hex == NULL) {
                fprintf(stderr, "%s: bad ROWS\n", cur ? cur->id : "?"); exit(2);
            }
            cur->vp_j = (size_t)cr_atol_pos(vj, cur->id, "ROWS j");
            cur->vp_k = (size_t)cr_atol_pos(vk, cur->id, "ROWS k");
            cur->vp_w = cr_hexbytes(hex, cur->vp_j * cur->vp_k, cur->id, "ROWS");
        } else if (strcmp(kw, "XS") == 0) {
            char *vn = cr_tok(&cursor);
            if (cur == NULL || vn == NULL) { fprintf(stderr, "bad XS\n"); exit(2); }
            const size_t k = (size_t)cr_atol_pos(vn, cur->id, "XS n");
            cur->vp_x = cr_xmalloc(k * sizeof(int32_t));
            for (size_t i = 0; i < k; i++) {
                char *v = cr_tok(&cursor);
                if (v == NULL) { fprintf(stderr, "%s: XS short\n", cur->id); exit(2); }
                cur->vp_x[i] = (int32_t)strtol(v, NULL, 10);
            }
        } else if (strcmp(kw, "EXPECTED") == 0) {
            char *vn = cr_tok(&cursor);
            if (cur == NULL || vn == NULL) { fprintf(stderr, "bad EXPECTED\n"); exit(2); }
            const size_t j = (size_t)cr_atol_pos(vn, cur->id, "EXPECTED n");
            cur->vp_ere = cr_xmalloc(j * sizeof(int64_t));
            cur->vp_eim = cr_xmalloc(j * sizeof(int64_t));
            for (size_t i = 0; i < j; i++) {
                char *vr = cr_tok(&cursor);
                char *vi = cr_tok(&cursor);
                if (vr == NULL || vi == NULL) {
                    fprintf(stderr, "%s: EXPECTED short\n", cur->id); exit(2);
                }
                cur->vp_ere[i] = strtoll(vr, NULL, 10);
                cur->vp_eim[i] = strtoll(vi, NULL, 10);
            }
        } else if (strcmp(kw, "DIMS") == 0) {
            char *vw = cr_tok(&cursor);
            char *vh = cr_tok(&cursor);
            if (cur == NULL || vw == NULL || vh == NULL) { fprintf(stderr, "bad DIMS\n"); exit(2); }
            cur->w = (uint32_t)cr_atol_pos(vw, cur->id, "DIMS w");
            cur->h = (uint32_t)cr_atol_pos(vh, cur->id, "DIMS h");
        } else if (strcmp(kw, "TICKS") == 0) {
            char *v = cr_tok(&cursor);
            if (cur == NULL || v == NULL) { fprintf(stderr, "bad TICKS\n"); exit(2); }
            cur->ticks = (uint32_t)cr_atol_pos(v, cur->id, "TICKS");
        } else if (strcmp(kw, "SIGMA") == 0) {
            char *v = cr_tok(&cursor);
            if (cur == NULL || v == NULL) { fprintf(stderr, "bad SIGMA\n"); exit(2); }
            cur->sigma = strtod(v, NULL);  /* exact corpus decimal (R-sigma) */
        } else if (strcmp(kw, "WORMHOLES") == 0) {
            char *v = cr_tok(&cursor);
            if (cur == NULL || v == NULL) { fprintf(stderr, "bad WORMHOLES\n"); exit(2); }
            cur->wormholes = (int)cr_atol_pos(v, cur->id, "WORMHOLES");
        } else if (strcmp(kw, "CELLS0") == 0 || strcmp(kw, "CELLSN") == 0) {
            char *hex = cr_tok(&cursor);
            if (cur == NULL || hex == NULL) { fprintf(stderr, "bad CELLS line\n"); exit(2); }
            const size_t n = (size_t)cur->w * (size_t)cur->h;
            unsigned char *buf = cr_hexbytes(hex, n, cur->id, kw);
            if (kw[5] == '0') cur->cells0 = buf; else cur->cellsn = buf;
        } else if (strcmp(kw, "EVTCNT") == 0) {
            if (cur == NULL) { fprintf(stderr, "bad EVTCNT\n"); exit(2); }
            cur->evt = cr_xcalloc(cur->ticks, sizeof(uint32_t));
            size_t i = 0;
            char *v;
            while ((v = cr_tok(&cursor)) != NULL) {
                if (i >= (size_t)cur->ticks) {
                    fprintf(stderr, "%s: EVTCNT overflow\n", cur->id); exit(2);
                }
                cur->evt[i++] = (uint32_t)cr_atol_pos(v, cur->id, "EVTCNT");
            }
            cur->evt_n = i;
        } else if (strcmp(kw, "END") == 0) {
            cur = NULL;
        } else {
            fprintf(stderr, "corpus_replay: unknown keyword '%s'\n", kw);
            exit(2);
        }
    }
    fclose(f);
    return ncases;
}

/* ---- v1 external event counting --------------------------------------- */
#if !defined(QTHE_V11)
/*
 * EXACT mirror of the G1-1 kernel's per-tick twin-read predicate, evaluated
 * over public pre-tick state. In G1-1 every wormhole read of a tick hits the
 * pre-tick table (snapshot semantics, A1), the read is keyed by the pre-tick
 * d (A9), and a twin hit is "slot occupied AND entry coords != own coords"
 * (A2, A13). Therefore this predicate, computed just before qthe_tick(),
 * counts exactly the twin hits that tick performs. It reimplements NOTHING
 * dynamic: cells and table are read as they stand.
 */
static uint32_t cr_count_events_v1(const qthe_substrate_t *s)
{
    uint32_t n = 0;
    for (uint32_t y = 0; y < s->h; y++) {
        for (uint32_t x = 0; x < s->w; x++) {
            const uint8_t c = s->cells[(size_t)y * (size_t)s->w + x];
            if (qthe_tau(c) != QTHE_TAU_ABSTAIN) {
                continue;
            }
            uint32_t ox = 0u, oy = 0u;
            int32_t ores = 0;
            if (qthe_wormhole_read(s->wormhole, qthe_d(c), &ox, &oy, &ores)
                    && (ox != x || oy != y)) {
                n++;
            }
        }
    }
    return n;
}
#endif /* !QTHE_V11 */

/* ---- per-kind replay ---------------------------------------------------- */

static void cr_replay_codec(const cr_case_t *cs, cr_result_t *r)
{
    const bool ok = qthe_codec_roundtrip_ok();
    snprintf(r->plane, sizeof r->plane, "n/a");
    snprintf(r->events, sizeof r->events, "n/a");
    r->pass = (ok && cs->roundtrip == 256) ? 1 : 0;
}

static void cr_replay_vectorpass(const cr_case_t *cs, cr_result_t *r)
{
    int64_t *yre = cr_xmalloc(cs->vp_j * sizeof(int64_t));
    int64_t *yim = cr_xmalloc(cs->vp_j * sizeof(int64_t));

    qthe_vector_pass(cs->vp_w, cs->vp_j, cs->vp_k, cs->vp_x, yre, yim);

    r->pass = 1;
    for (size_t i = 0; i < cs->vp_j; i++) {
        if (yre[i] != cs->vp_ere[i] || yim[i] != cs->vp_eim[i]) {
            r->pass = 0;
        }
    }
    snprintf(r->plane, sizeof r->plane, "n/a");
    snprintf(r->events, sizeof r->events, "n/a");
    free(yre);
    free(yim);
}

static void cr_replay_substrate(const cr_case_t *cs, cr_result_t *r)
{
    qthe_substrate_t *s = qthe_make_substrate(cs->w, cs->h, NULL, NULL);
    if (s == NULL) {
        snprintf(r->plane, sizeof r->plane, "make_substrate FAILED");
        snprintf(r->events, sizeof r->events, "n/a");
        r->pass = 0;
        return;
    }
    memcpy(s->cells, cs->cells0, (size_t)cs->w * (size_t)cs->h);

#if defined(QTHE_V11)
    /* v1.1: float64 sigma verbatim from the corpus decimal (R-sigma);
     * real wormhole ON/OFF switch for the paired OFF arm. */
    (void)qthe_set_sigma(s, cs->sigma);
    qthe_set_wormholes(s, cs->wormholes != 0);
#else
    /* v1: rational sigma (A4), nearest 1e-8 approximation. Provably inert
     * for plane and events in v1: sigma reaches only the imaginary telemetry
     * channel (A17 = no feedback), and the event predicate never reads it. */
    {
        const double scaled = cs->sigma * 1.0e8;
        double rounded = (scaled >= 0.0) ? scaled + 0.5 : scaled - 0.5;
        if (rounded > 2147483647.0) rounded = 2147483647.0;
        if (rounded < -2147483648.0) rounded = -2147483648.0;
        (void)qthe_set_sigma(s, (int32_t)rounded, 100000000);
    }
#endif

    r->mine = cr_xcalloc(cs->ticks, sizeof(uint32_t));
    r->mine_n = cs->ticks;

    long first_div = -1;
    long mine_at = 0, corpus_at = 0;

    for (uint32_t t = 0; t < cs->ticks; t++) {
#if defined(QTHE_V11)
        qthe_tick(s);
        r->mine[t] = s->twin_events;
#else
        /* Count twin hits the tick is about to perform (pre-tick state).
         * WORMHOLES 0: v1 has no switch; the OFF arm performs no reads by
         * contract and v1's table ops cannot move the plane (no feedback). */
        r->mine[t] = (cs->wormholes != 0) ? cr_count_events_v1(s) : 0u;
        qthe_tick(s);
#endif
        if (first_div < 0 && t < cs->evt_n && r->mine[t] != cs->evt[t]) {
            first_div = (long)t + 1;           /* 1-based tick number */
            mine_at = (long)r->mine[t];
            corpus_at = (long)cs->evt[t];
        }
    }

    /* Final plane comparison (byte-exact). */
    const size_t n = (size_t)cs->w * (size_t)cs->h;
    size_t ndiff = 0;
    size_t first_idx = n;
    unsigned mine_byte = 0, corpus_byte = 0;
    for (size_t i = 0; i < n; i++) {
        if (s->cells[i] != cs->cellsn[i]) {
            if (ndiff == 0) {
                first_idx = i;
                mine_byte = s->cells[i];
                corpus_byte = cs->cellsn[i];
            }
            ndiff++;
        }
    }

    const int plane_ok = (ndiff == 0);
    const int evt_ok = (first_div < 0);

    snprintf(r->plane, sizeof r->plane, "%s",
             plane_ok ? "OK" : "DIFF");
    r->plane_diff_cells = ndiff;
    r->plane_first_idx = first_idx;
    r->mine_byte = mine_byte;
    r->corpus_byte = corpus_byte;

    if (evt_ok) {
        snprintf(r->events, sizeof r->events, "OK");
    } else {
        snprintf(r->events, sizeof r->events, "tick %ld: mine %ld vs corpus %ld",
                 first_div, mine_at, corpus_at);
    }

    if (plane_ok && evt_ok) {
        r->pass = 1;
        snprintf(r->klass, sizeof r->klass, "%s", "");
    } else if (!plane_ok && evt_ok) {
        snprintf(r->klass, sizeof r->klass, "%s", "PLANE-ONLY");
    } else if (plane_ok && !evt_ok) {
        snprintf(r->klass, sizeof r->klass, "%s", "EVENTS-ONLY");
    } else {
        snprintf(r->klass, sizeof r->klass, "%s", "BOTH");
    }

    qthe_free_substrate(s);
}

/* ---- main: table printing ---------------------------------------------- */

static void cr_print_head6(const uint32_t *a, size_t n)
{
    printf("[");
    for (size_t i = 0; i < n && i < 6; i++) {
        printf("%s%u", i ? "," : "", a[i]);
    }
    if (n > 6) printf(",...");
    printf("]");
}

int main(int argc, char **argv)
{
    const char *path = (argc > 1) ? argv[1]
                    : "../../../../corpus/g2-corpus-v1.flat";

    cr_case_t *cases = cr_xcalloc(CR_MAX_CASES, sizeof(cr_case_t));
    cr_result_t *results = cr_xcalloc(CR_MAX_CASES, sizeof(cr_result_t));
    char corpus_name[128] = "(?)";
    char kernel_tag[128] = "(?)";

    const size_t ncases = cr_parse_corpus(path, cases, CR_MAX_CASES,
                                          corpus_name, sizeof corpus_name,
                                          kernel_tag, sizeof kernel_tag);

    printf("=====================================================================\n");
    printf(" corpus %s (kernel %s)\n", corpus_name, kernel_tag);
    printf(" replay against: %s\n", CR_KERNEL_LABEL);
    printf("=====================================================================\n");
    printf(" %-30s %-11s %-12s %-26s %s\n",
           "case", "kind", "plane", "events", "verdict");
    printf(" -----------------------------------------------------------------\n");

    size_t npass = 0, nfail = 0;
    size_t npass_l0 = 0, nl0 = 0, npass_sub = 0, nsub = 0;

    for (size_t i = 0; i < ncases; i++) {
        const cr_case_t *cs = &cases[i];
        cr_result_t *r = &results[i];

        switch (cs->kind) {
        case CR_KIND_CODEC:       cr_replay_codec(cs, r); break;
        case CR_KIND_VECTORPASS:  cr_replay_vectorpass(cs, r); break;
        case CR_KIND_SUBSTRATE:   cr_replay_substrate(cs, r); break;
        default:                  r->pass = 0; break;
        }

        const char *kindstr = (cs->kind == CR_KIND_CODEC) ? "codec"
                            : (cs->kind == CR_KIND_VECTORPASS) ? "vectorpass"
                            : "substrate";
        printf(" %-30s %-11s %-12s %-26s %s%s%s%s\n",
               cs->id, kindstr, r->plane, r->events,
               r->pass ? "PASS" : "FAIL",
               r->klass[0] ? " (" : "", r->klass, r->klass[0] ? ")" : "");

        if (cs->kind != CR_KIND_SUBSTRATE) {
            nl0++;
            npass_l0 += (r->pass != 0);
        } else {
            nsub++;
            npass_sub += (r->pass != 0);
        }
        npass += (r->pass != 0);
        nfail += (r->pass == 0);
    }

    printf(" -----------------------------------------------------------------\n");
    printf(" CONFORMANCE: %lu/%lu PASS", (unsigned long)npass,
           (unsigned long)ncases);
    if (ncases > 0) {
        printf("  (l0: %lu/%lu, substrate: %lu/%lu)",
               (unsigned long)npass_l0, (unsigned long)nl0,
               (unsigned long)npass_sub, (unsigned long)nsub);
    }
    printf("\n");

    if (nfail > 0) {
        printf("\n divergence detail (substrate FAILs only):\n");
        for (size_t i = 0; i < ncases; i++) {
            const cr_case_t *cs = &cases[i];
            cr_result_t *r = &results[i];
            if (cs->kind != CR_KIND_SUBSTRATE || r->pass != 0) {
                continue;
            }
            printf("  %s:\n", cs->id);
            printf("    evt mine    ");
            cr_print_head6(r->mine, r->mine_n);
            printf("\n    evt corpus  ");
            cr_print_head6(cs->evt, cs->evt_n);
            printf("\n    first event divergence: %s\n", r->events);
            printf("    final plane: %s (%lu cells differ",
                   r->plane, (unsigned long)r->plane_diff_cells);
            if (r->plane_diff_cells > 0) {
                printf("; first at idx %lu: mine %02x corpus %02x",
                       (unsigned long)r->plane_first_idx,
                       r->mine_byte, r->corpus_byte);
            }
            printf(")\n");
        }
    }

    for (size_t i = 0; i < ncases; i++) {
        cr_free_case(&cases[i]);
        free(results[i].mine);
    }
    free(cases);
    free(results);
    return 0;
}
