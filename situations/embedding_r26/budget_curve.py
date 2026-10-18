#!/usr/bin/env python3
# situations/embedding_r26/budget_curve.py — E-Q29 lane T17-b: the
# question-budget curve, descending arm. All 255 non-empty axis subsets of
# the sealed E-Q22 noul vectors, strict top-1 family accuracy, Shapley
# per-axis importance, the occlusion cross-instrument Spearman, and the
# best-4 + full-8 LIVE confirm (arm-tagged upserts + arm-filtered queries).
# ZERO new embed calls.
import json
import math
import pathlib
import subprocess
import sys
import time
import urllib.request
import os

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
R24 = ROOT / "situations" / "embedding_r24"

AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]

corpus = json.loads((R23 / "corpus.json").read_text())
records = corpus["records"]
FAMILY = {r["id"]: r["family"] for r in records}
IDS = [r["id"] for r in records]

N = json.loads((R24 / "eval_eq22_results.json").read_text())["vectors"]["N"]
assert len(N) == 20 and all(len(v) == 8 for v in N.values())

def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

def subset_accuracy(subset):
    """Strict top-1 family accuracy on the subset projection (non-self NN)."""
    if not subset:
        return 0.0
    hits = 0
    for rid in IDS:
        v = [N[rid][i] for i in subset]
        best, best_s = None, -2.0
        for oid in IDS:
            if oid == rid:
                continue
            s = cos(v, [N[oid][i] for i in subset])
            if s > best_s:
                best_s, best = s, oid
        if FAMILY[best] == FAMILY[rid]:
            hits += 1
    return hits / 20.0

# ── the exhaustive curve (255 subsets + the definitional empty floor) ──────
acc = {}
for mask in range(1, 256):
    subset = tuple(i for i in range(8) if mask & (1 << i))
    acc[subset] = subset_accuracy(subset)
acc[()] = 0.0

best_curve, best_subset, mean_curve = {}, {}, {}
for k in range(1, 9):
    cands = [(s, a) for s, a in acc.items() if len(s) == k]
    s, a = max(cands, key=lambda t: t[1])
    best_curve[k] = a
    best_subset[k] = [AXES[i] for i in s]
    vals = [a2 for s2, a2 in acc.items() if len(s2) == k]
    mean_curve[k] = sum(vals) / len(vals)

# ── Shapley importance (exact, over all 256 subsets) ───────────────────────
FACT = [math.factorial(i) for i in range(9)]
shapley = {}
for a_i in range(8):
    val = 0.0
    for s, sv in acc.items():
        if a_i in s:
            continue
        k = len(s)
        w = FACT[k] * FACT[7 - k] / FACT[8]
        val += w * (acc[tuple(sorted(s + (a_i,)))] - sv)
    shapley[AXES[a_i]] = val
shapley_rank = [a for a, _ in sorted(shapley.items(), key=lambda t: -t[1])]

# ── the occlusion cross-instrument Spearman ────────────────────────────────
eq23 = json.loads((R24 / "eq23_results.json").read_text())
sal = eq23["saliency"]  # rid -> [span][axis]
occl_mass = []
for a_i in range(8):
    totals = []
    for rid, rows in sal.items():
        totals.append(sum(abs(row[a_i]) for row in rows))
    occl_mass.append(sum(totals) / len(totals))

def spearman(xs, ys):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and v[order[j + 1]] == v[order[i]]:
                j += 1
            avg = (i + j) / 2.0 + 1.0
            for t in range(i, j + 1):
                r[order[t]] = avg
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    mx, my = sum(rx) / 8, sum(ry) / 8
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den = math.sqrt(sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry))
    return num / den if den else 0.0

shapley_vals = [shapley[a] for a in AXES]
xinstr = round(spearman(shapley_vals, occl_mass), 4)

# ── the LIVE confirm: best-4 subset + full-8, arm-tagged ───────────────────
S4 = best_subset[4]
S8 = best_subset[8]
def project(rid, names):
    idx = [AXES.index(n) for n in names]
    return [N[rid][i] for i in idx]

def pad32(vals):
    # subset projections re-pack at positions 0..k-1; pad the remainder.
    # Arm-filtered queries compare within the arm only, so the packing is
    # self-consistent (cosine on padded == cosine on the subset).
    return [round(v, 6) for v in vals] + [0.0] * (32 - len(vals))

ndjson = HERE / "upsert_eq29.ndjson"
with ndjson.open("w") as f:
    for arm, names in (("eq29S4", S4), ("eq29S8", S8)):
        for rid in IDS:
            f.write(json.dumps({"id": f"{arm}:{rid}", "values": pad32(project(rid, names)),
                                "metadata": {"family": FAMILY[rid], "arm": arm}}) + "\n")

env = dict(os.environ)
env["CLOUDFLARE_API_TOKEN"] = os.environ["CLOUDFLARE_TOKEN"]
env["CLOUDFLARE_ACCOUNT_ID"] = "049ff5e84ecf636b53b162cbb580aae6"
up = subprocess.run(["npx", "wrangler", "vectorize", "upsert", "qthe-jev-embed", "--file", str(ndjson)],
                    cwd=str(ROOT / "cloudflare"), env=env, capture_output=True, text=True, timeout=300)
print("[upsert]", (up.stdout + up.stderr).strip().splitlines()[-1] if (up.stdout + up.stderr).strip() else up.returncode)
if up.returncode != 0:
    sys.exit(4)

CF = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
def query_topk(vec, arm, k=20):
    body = json.dumps({"vector": pad32(vec), "topK": k, "filter": {"arm": arm}}).encode()
    req = urllib.request.Request(CF, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

# the async-changeset law, poll-until-visible form (this round's receipt:
# a flat 30s sleep raced the enqueue and read ALL NO-NEIGHBOR — the r24
# law upgraded to an explicit poll loop)
def arm_probe(arm):
    try:
        return len(query_topk([1.0] * 4 if arm == "eq29S4" else [1.0] * 8, arm))
    except Exception:
        return 0

for arm in ("eq29S4", "eq29S8"):
    visible = 0
    for _ in range(40):  # up to 200s
        visible = arm_probe(arm)
        if visible >= 19:
            break
        time.sleep(5)
    print(f"[poll] {arm}: {visible} vectors visible")

live = {}
for arm, names in (("eq29S4", S4), ("eq29S8", S8)):
    hits = 0
    misses = []
    for rid in IDS:
        matches = query_topk(project(rid, names), arm)
        others = [(r2, s) for r2, s in matches if r2 != rid]
        if not others:
            misses.append((rid, "NO-NEIGHBOR"))
            continue
        if FAMILY[others[0][0]] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, others[0][0]))
    live[arm] = {"axes": names, "accuracy": hits / 20, "hits": hits, "misses": misses,
                 "local_accuracy": best_curve[4] if arm == "eq29S4" else best_curve[8]}
    print(f"[live] {arm} ({'+'.join(n.split('_')[0] for n in names)}): strict {hits}/20 = {hits/20:.2f} (local {live[arm]['local_accuracy']:.2f})")

# ── hypotheses / claims ────────────────────────────────────────────────────
H1 = best_curve[4] >= 0.70
H2 = best_curve[2] >= 0.50
H3 = xinstr > 0.4
C25 = H1
P1 = 0.50 <= best_curve[2] <= 0.70
P2 = H1 and set(["P1_nonlocal", "P2_localrule", "P3_quantum", "P7_econ"]).issubset(set(shapley_rank[:4]))
P3 = (best_curve[8] - best_curve[5]) <= 0.05
P4 = 0.4 <= xinstr <= 0.8
P5 = set(shapley_rank[6:]) <= {"P6_null", "P5_repair"}

out = {
    "experiment": "E-Q29",
    "curve_best": {str(k): best_curve[k] for k in range(1, 9)},
    "curve_mean": {str(k): round(mean_curve[k], 4) for k in range(1, 9)},
    "best_subsets": {str(k): best_subset[k] for k in range(1, 9)},
    "shapley": {a: round(shapley[a], 5) for a in AXES},
    "shapley_rank": shapley_rank,
    "occlusion_mass": {AXES[i]: round(occl_mass[i], 5) for i in range(8)},
    "cross_instrument_spearman": xinstr,
    "live_confirm": live,
    "hypotheses": {"H1_knee": H1, "H2_headroom": H2, "H3_convergent_validity": H3, "C25": C25},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4, "P5": P5},
}
(HERE / "eq29_results.json").write_text(json.dumps(out, indent=1))
print(f"\n[e-q29] best curve: " + " ".join(f"{k}:{best_curve[k]:.2f}" for k in range(1, 9)))
print(f"[e-q29] mean curve: " + " ".join(f"{k}:{mean_curve[k]:.2f}" for k in range(1, 9)))
print(f"[e-q29] shapley rank: {shapley_rank}")
print(f"[e-q29] cross-instrument Spearman(shapley, occlusion-mass) = {xinstr}")
print(f"[e-q29] H1(knee)={H1} H2(headroom)={H2} H3(validity)={H3} C25={C25}")
