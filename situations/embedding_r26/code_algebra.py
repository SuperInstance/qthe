#!/usr/bin/env python3
# situations/embedding_r26/code_algebra.py — E-Q30 lane T17-c: does the
# E-Q26 family algebra survive E-Q27 quantization? Saturation arithmetic on
# the sealed ternary/4-level codes, local + LIVE arm-filtered retrieval,
# seeded permutation null. ZERO new embed calls.
import json
import math
import pathlib
import random
import urllib.request
import os

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"

corpus = json.loads((R23 / "corpus.json").read_text())
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
IDS = [r["id"] for r in corpus["records"]]
FAMS = ["N", "P", "Q", "A"]
F = {f: sorted([i for i in IDS if FAMILY[i] == f]) for f in FAMS}

# the frozen compositions — the E-Q26 selection rule, byte-identical
compositions = []
for i in range(5):
    fA, fB = FAMS[i % 4], FAMS[(i + 1) % 4]
    d = F[fA][(i // 4) + 1]
    compositions.append({"kind": "analogy", "i": i, "a": F[fA][0], "b": F[fB][0], "c": F[fB][1], "d": d})

EQ27 = json.loads((ROOT / "situations" / "embedding_r25" / "eq27_results.json").read_text())
CODES = EQ27["vectors"]  # arms: SB/ST/SQ/NB/NT/NQ -> rid -> 8 code values
ARMS = ["ST", "SQ", "NT", "NQ"]  # the registered arms: ternary + 4-level, both substrates
BOUNDS = {"ST": (-1.0, 1.0), "SQ": (-1.5, 1.5), "NT": (-1.0, 1.0), "NQ": (-1.5, 1.5)}

def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

def compose_code(arm, comp):
    va, vb, vc = CODES[arm][comp["a"]], CODES[arm][comp["b"]], CODES[arm][comp["c"]]
    lo, hi = BOUNDS[arm]
    out = []
    clips = 0
    for x, y, z in zip(va, vb, vc):
        v = x - y + z
        if v < lo:
            v = lo; clips += 1
        elif v > hi:
            v = hi; clips += 1
        out.append(v)
    return out, clips

# ── local retrieval + clipping incidence ───────────────────────────────────
local = {}
clip_total = {}
for arm in ARMS:
    hits = 0
    ctot = 0
    rows = []
    for comp in compositions:
        cv, clips = compose_code(arm, comp)
        ctot += clips
        sims = sorted(((cos(cv, CODES[arm][oid]), oid) for oid in IDS), reverse=True)
        top1 = sims[0][1]
        fam_hit = FAMILY[top1] == FAMILY[comp["d"]]
        exact = top1 == comp["d"]
        hits += 1 if fam_hit else 0
        rows.append({"comp": f"{comp['a']}-{comp['b']}+{comp['c']}->{comp['d']}", "top1": top1,
                     "family_hit": fam_hit, "exact": exact, "clips": clips,
                     "cos_top": round(sims[0][0], 4)})
    local[arm] = {"family_hits": hits, "rows": rows}
    clip_total[arm] = ctot
    print(f"[local] {arm}: family hits {hits}/5, clips {ctot}/40 coords")

# ── the seeded permutation null (computed BEFORE the live read, F4) ────────
random.seed(20261026)
null = {}
for arm in ARMS:
    draws = []
    for _ in range(1000):
        perm = IDS[:]
        random.shuffle(perm)
        pmap = dict(zip(IDS, perm))
        h = 0
        for comp in compositions:
            va, vb, vc = CODES[arm][pmap[comp["a"]]], CODES[arm][pmap[comp["b"]]], CODES[arm][pmap[comp["c"]]]
            lo, hi = BOUNDS[arm]
            cv = []
            for x, y, z in zip(va, vb, vc):
                v = x - y + z
                cv.append(lo if v < lo else (hi if v > hi else v))
            sims = sorted(((cos(cv, CODES[arm][oid]), oid) for oid in IDS), reverse=True)
            if FAMILY[sims[0][1]] == FAMILY[comp["d"]]:
                h += 1
        draws.append(h)
    draws.sort()
    null[arm] = {"mean": sum(draws) / 1000, "p95": draws[949], "sd": (sum((x - sum(draws) / 1000) ** 2 for x in draws) / 1000) ** 0.5}
    print(f"[null] {arm}: {null[arm]['mean']:.2f}+-{null[arm]['sd']:.2f} (p95 {null[arm]['p95']})")

# ── the LIVE retrieval (the receipt of record) ─────────────────────────────
CF = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
def query_topk(vec, arm, k=20):
    body = json.dumps({"vector": [round(v, 6) for v in vec] + [0.0] * 24, "topK": k,
                       "filter": {"arm": f"eq27{arm}"}}).encode()
    req = urllib.request.Request(CF, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

live = {}
for arm in ARMS:
    hits = 0
    rows = []
    for comp in compositions:
        cv, _ = compose_code(arm, comp)
        matches = query_topk(cv, arm)
        if not matches:
            rows.append({"comp": comp["d"], "error": "NO-MATCHES"})
            continue
        top1 = matches[0][0]
        fam_hit = FAMILY[top1] == FAMILY[comp["d"]]
        hits += 1 if fam_hit else 0
        rows.append({"comp": f"{comp['a']}-{comp['b']}+{comp['c']}->{comp['d']}", "top1": top1,
                     "family_hit": fam_hit, "exact": top1 == comp["d"], "score": matches[0][1]})
    live[arm] = {"family_hits": hits, "rows": rows}
    print(f"[live] eq27{arm}: family hits {hits}/5")

# ── hypotheses / claims ────────────────────────────────────────────────────
H1 = live["NT"]["family_hits"] >= 4
H2 = (live["NQ"]["family_hits"] >= live["NT"]["family_hits"]) or (live["NT"]["family_hits"] > live["NQ"]["family_hits"])  # the comparison, pre-registered both ways
H3 = all(live[a]["family_hits"] / 5 >= 0.50 for a in ("NT", "NQ"))
C26 = H1 and H3
P1 = H1
P2 = live["NQ"]["family_hits"] >= live["NT"]["family_hits"]
P3 = H3
P4 = all(clip_total[a] <= 8 for a in ARMS)
dense_null = {"mean": 1.937, "sd": 1.2795, "p95": 4}
P5 = null["NT"]["p95"] <= dense_null["p95"]

out = {
    "experiment": "E-Q30",
    "compositions_sealed": [{"kind": c["kind"], "i": c["i"], **{k: c[k] for k in ("a", "b", "c", "d")}} for c in compositions],
    "local": local, "live": live, "null": null, "clip_total": clip_total,
    "dense_reference": {"family_hits": 5, "null": dense_null},
    "hypotheses": {"H1_algebra_survives": H1, "H2_resolution_pays": H2, "H3_above_baseline": H3, "C26": C26},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4, "P5": P5},
}
(HERE / "eq30_results.json").write_text(json.dumps(out, indent=1))
print(f"\n[e-q30] live family hits: " + " ".join(f"{a}:{live[a]['family_hits']}/5" for a in ARMS))
print(f"[e-q30] H1(algebra)={H1} H2(comparison)={H2} H3(baseline)={H3} C26={C26}")
print(f"[e-q30] clips: {clip_total} | null p95 NT {null['NT']['p95']} vs dense 4")
