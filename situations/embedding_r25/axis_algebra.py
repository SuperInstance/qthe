#!/usr/bin/env python3
# situations/embedding_r25/axis_algebra.py — E-Q26 lane T16-b: analogy
# arithmetic over the sealed E-Q22 noul vectors. Emits the frozen
# compositions, live-queries each (arm-filtered eq22N), computes the
# permutation null (label shuffles, in code), writes eq26_results.json.
import json
import math
import pathlib
import random
import urllib.request
import os

HERE = pathlib.Path(__file__).resolve().parent
R24 = HERE.parent / "embedding_r24"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
FAMS = ["N", "P", "Q", "A"]

EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N = EQ22["vectors"]["N"]
corpus = json.loads((HERE.parent / "embedding_r23" / "corpus.json").read_text())
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
IDS = [r["id"] for r in corpus["records"]]
F = {f: sorted([i for i in IDS if FAMILY[i] == f]) for f in FAMS}

# the frozen compositions (registered rule + AM1 pre-run amendment)
compositions = []
for i in range(5):
    fA, fB = FAMS[i % 4], FAMS[(i + 1) % 4]
    d = F[fA][(i // 4) + 1]
    compositions.append({"kind": "analogy", "i": i, "a": F[fA][0], "b": F[fB][0], "c": F[fB][1], "d": d})
for i in range(5):
    if i < 4:
        a, d = F[FAMS[i % 4]][0], F[FAMS[(i + 2) % 4]][0]
        b, c = F[FAMS[(i + 1) % 4]][0], F[FAMS[(i + 3) % 4]][0]
    else:
        a, d = F[FAMS[0]][1], F[FAMS[2]][1]
        b, c = F[FAMS[1]][1], F[FAMS[3]][1]
    compositions.append({"kind": "translation", "i": i, "a": a, "b": b, "c": c, "d": d})

def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

def compose(comp):
    va, vb, vc = N[comp["a"]], N[comp["b"]], N[comp["c"]]
    return [x - y + z for x, y, z in zip(va, vb, vc)]

CF = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
def query_topk(vec, k=20):
    body = json.dumps({"vector": [round(v, 6) for v in vec] + [0.0] * 24, "topK": k, "filter": {"arm": "eq22N"}}).encode()
    req = urllib.request.Request(CF, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

live = {}
for comp in compositions:
    cv = compose(comp)
    matches = query_topk(cv)
    key = f"{comp['kind']}_{comp['i']}"
    rank_d = next((i for i, (rid, _) in enumerate(matches) if rid == comp["d"]), None)
    live[key] = {
        "tuple": {k: comp[k] for k in ("a", "b", "c", "d")},
        "top1": matches[0][0] if matches else None,
        "hit": bool(matches) and matches[0][0] == comp["d"],
        "rank_d": rank_d,
        "cos_comp_d": round(cos(cv, N[comp["d"]]), 4),
        "top5": [rid for rid, _ in matches[:5]],
    }
    print(f"  {key}: {comp['a']}-{comp['b']}+{comp['c']} -> target {comp['d']}: top1={live[key]['top1']} rank_d={rank_d} cos={live[key]['cos_comp_d']}")

# F4: permutation null — vector-assignment shuffles, 1000 draws, seed 20261019
random.seed(20261019)
null_a, null_t, null_af = [], [], []
for _ in range(1000):
    perm = IDS[:]
    random.shuffle(perm)
    pmap = dict(zip(IDS, perm))
    a_h = t_h = a_f = 0
    for comp in compositions:
        va, vb, vc = N[pmap[comp["a"]]], N[pmap[comp["b"]]], N[pmap[comp["c"]]]
        cv = [x - y + z for x, y, z in zip(va, vb, vc)]
        sims = sorted(((cos(cv, N[pmap[oid]]), oid) for oid in IDS), reverse=True)
        top1 = sims[0][1]
        if top1 == comp["d"]:
            if comp["kind"] == "analogy":
                a_h += 1
            else:
                t_h += 1
        if comp["kind"] == "analogy" and FAMILY[top1] == FAMILY[comp["d"]]:
            a_f += 1
    null_a.append(a_h)
    null_t.append(t_h)
    null_af.append(a_f)

real_a = sum(1 for k, v in live.items() if k.startswith("analogy") and v["hit"])
real_af = sum(1 for k, v in live.items() if k.startswith("analogy") and FAMILY[v["top1"]] == FAMILY[v["tuple"]["d"]])
real_t = sum(1 for k, v in live.items() if k.startswith("translation") and v["hit"])
mean_na = sum(null_a) / 1000
sd_na = (sum((x - mean_na) ** 2 for x in null_a) / 1000) ** 0.5
mean_nt = sum(null_t) / 1000
mean_naf = sum(null_af) / 1000
sd_naf = (sum((x - mean_naf) ** 2 for x in null_af) / 1000) ** 0.5
ranks = [v["rank_d"] for v in live.values() if v["rank_d"] is not None]
mean_rank = sum(ranks) / len(ranks)

autopsy = []
for comp in compositions[:5]:
    cv = compose(comp)
    autopsy.append({"comp": f"{comp['a']}-{comp['b']}+{comp['c']}->{comp['d']}",
                    **{AXES[i]: round(cv[i] - N[comp["d"]][i], 3) for i in range(8)}})

out = {
    "experiment": "E-Q26",
    "compositions_sealed": [{"kind": c["kind"], "i": c["i"], **{k: c[k] for k in ("a", "b", "c", "d")}} for c in compositions],
    "live": live,
    "real_hits": {"analogy": real_a, "translation": real_t},
    "null": {"analogy_mean": mean_na, "analogy_sd": sd_na, "translation_mean": mean_nt,
             "analogy_p95": sorted(null_a)[949], "translation_p95": sorted(null_t)[949],
             "analogy_family_mean": mean_naf, "analogy_family_sd": sd_naf,
             "analogy_family_p95": sorted(null_af)[949]},
    "real_family_hits": {"analogy": real_af},
    "mean_rank_d": mean_rank,
    "axis_autopsy_analogy": autopsy,
}
(HERE / "eq26_results.json").write_text(json.dumps(out, indent=1))
print(f"\n[e-q26] analogy {real_a}/5 vs null {mean_na:.2f}+-{sd_na:.2f} (p95 {sorted(null_a)[949]})")
print(f"[e-q26] translation {real_t}/5 vs null {mean_nt:.2f} (p95 {sorted(null_t)[949]})")
print(f"[e-q26] analogy FAMILY-level hits {real_af}/5 vs null {mean_naf:.2f}+-{sd_naf:.2f} (p95 {sorted(null_af)[949]})")
print(f"[e-q26] mean rank(d) = {mean_rank:.1f} of 20")
