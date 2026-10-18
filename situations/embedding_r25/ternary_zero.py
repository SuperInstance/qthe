#!/usr/bin/env python3
# situations/embedding_r25/ternary_zero.py — E-Q27 lane T16-c: does the
# ternary zero do work? Binary vs ternary vs 4-level quantization on BOTH
# sealed arms, arm-filtered live queries (the metadata-index law applied by
# construction). ZERO new embed calls.
import json
import math
import pathlib
import subprocess
import sys
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

def norm_axis(score, k=4.0):
    return max(0.0, min(1.0, float(score) / k))

S = {}
for line in (R23 / "typesafe_embed_rows_r23.jsonl").read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    if r["call_id"].endswith("-stab"):
        continue
    ans = r.get("answers_raw") or {}
    vec = []
    ok = True
    for ax in AXES:
        s = (ans.get(ax) or {}).get("score")
        if s is None:
            ok = False
            break
        vec.append(norm_axis(s))
    if ok:
        S[r["record_id"]] = vec
N = json.loads((R24 / "eval_eq22_results.json").read_text())["vectors"]["N"]
assert len(S) == 20 and len(N) == 20

def med(xs):
    s = sorted(xs)
    return (s[9] + s[10]) / 2.0

def quant_table(vectors, levels):
    table = []
    for i in range(8):
        xs = [vectors[rid][i] for rid in IDS]
        m = med(xs)
        mad = med([abs(x - m) for x in xs])
        s = sorted(xs)
        q25 = (s[4] + s[5]) / 2.0
        q75 = (s[14] + s[15]) / 2.0
        table.append({"m": m, "mad": mad, "q25": q25, "q75": q75})
    return table

def quantize(x, t, levels):
    if levels == "binary":
        return 1.0 if x > t["m"] else -1.0
    if levels == "ternary":
        if x > t["m"] + 0.5 * t["mad"]:
            return 1.0
        if x < t["m"] - 0.5 * t["mad"]:
            return -1.0
        return 0.0
    # 4-level: quartile-based {-1.5, -0.5, +0.5, +1.5}
    if x <= t["q25"]:
        return -1.5
    if x <= t["m"]:
        return -0.5
    if x <= t["q75"]:
        return 0.5
    return 1.5

ARMS = {}
for arm_name, vectors in (("S", S), ("N", N)):
    for levels in ("binary", "ternary", "quad"):
        table = quant_table(vectors, levels)
        ARMS[f"{arm_name}{levels[0].upper()}"] = {rid: [quantize(vectors[rid][i], table[i], levels) for i in range(8)] for rid in IDS}

# upsert all six arms with metadata arm tags
ndjson = HERE / "upsert_eq27.ndjson"
with ndjson.open("w") as f:
    for prefix, arm in ARMS.items():
        for rid in IDS:
            f.write(json.dumps({"id": f"eq27{prefix}:{rid}", "values": [round(v, 6) for v in arm[rid]] + [0.0] * 24,
                                "metadata": {"family": FAMILY[rid], "arm": f"eq27{prefix}"}}) + "\n")
env = {"PATH": os.environ["PATH"], "CLOUDFLARE_API_TOKEN": os.environ["CLOUDFLARE_TOKEN"],
       "CLOUDFLARE_ACCOUNT_ID": "049ff5e84ecf636b53b162cbb580aae6"}
up = subprocess.run(["npx", "wrangler", "vectorize", "upsert", "qthe-jev-embed", "--file", str(ndjson)],
                    cwd=str(ROOT / "cloudflare"), env=env, capture_output=True, text=True, timeout=300)
print("[upsert]", (up.stdout + up.stderr).strip().splitlines()[-1] if (up.stdout + up.stderr).strip() else up.returncode)
if up.returncode != 0:
    sys.exit(4)

CF = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
def query_topk(vec, arm, k=20):
    body = json.dumps({"vector": [round(v, 6) for v in vec] + [0.0] * 24, "topK": k, "filter": {"arm": arm}}).encode()
    req = urllib.request.Request(CF, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

import time
time.sleep(30)  # the async-changeset law

results = {}
for prefix, arm in ARMS.items():
    hits = 0
    misses = []
    for rid in IDS:
        matches = query_topk(arm[rid], f"eq27{prefix}")
        others = [(r2, s) for r2, s in matches if r2 != rid]
        if not others:
            misses.append((rid, "NO-NEIGHBOR"))
            continue
        if FAMILY[others[0][0]] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, others[0][0]))
    results[prefix] = {"accuracy": hits / 20, "hits": hits, "misses": misses}
    print(f"[retrieval] eq27-{prefix}: strict {hits}/20 = {hits/20:.2f} misses={len(misses)}")

# zero-level mass on ternary codes
zero_mass = {}
for prefix in ("ST", "NT"):
    zeros = sum(1 for rid in IDS for v in ARMS[prefix][rid] if v == 0.0)
    zero_mass[prefix] = zeros / 160.0
print(f"[zero-mass] ST {zero_mass['ST']:.3f} NT {zero_mass['NT']:.3f}")

out = {"experiment": "E-Q27", "arms": {k: v for k, v in results.items()},
       "zero_mass": zero_mass, "vectors": ARMS,
       "continuous_reference": {"S": 0.70, "N": 0.80}}
(HERE / "eq27_results.json").write_text(json.dumps(out, indent=1))
print("[eval] wrote eq27_results.json")
