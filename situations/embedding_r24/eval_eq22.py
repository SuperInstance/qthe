#!/usr/bin/env python3
# situations/embedding_r24/eval_eq22.py — E-Q22 lane T15-b: the factorial eval.
# Four arms on the SAME sealed corpus: S (score-continuous, E-Q21 sealed rows),
# N (noul-continuous, this lane's rows), TS/TN (median-centered ternary codes
# {-1,0,+1} of S/N). All four upserted to Cloudflare Vectorize (arm-prefixed
# ids) and live-queried; top-1 non-self WITHIN-ARM family accuracy per arm.
# Ternary code stats (per-axis mass, entropy, distinct codes, collisions) +
# separation stats + the storage receipt. Baselines (majority / permutation
# null / BOW) are SEALED corpus properties from E-Q21, reused as constants.
import json
import math
import pathlib
import subprocess
import sys
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
TS_ROWS = R23 / "typesafe_embed_rows_r23.jsonl"
NOUL_ROWS = HERE / "noul_embed_rows_r24.jsonl"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]

corpus = json.loads((R23 / "corpus.json").read_text())
records = corpus["records"]
FAMILY = {r["id"]: r["family"] for r in records}
IDS = [r["id"] for r in records]
MAJORITY = 0.25
PERM_NULL = 0.2122   # sealed E-Q21 (1000 draws, seed 20261019)
BOW = 0.80           # sealed E-Q21 (same texts, full vocab)

def norm_axis(score, k=4.0):
    v = float(score) / k
    return max(0.0, min(1.0, v))

def pad(vec8):
    return [round(float(v), 6) for v in vec8] + [0.0] * 24  # AM1 zero-pad

def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

# ── arm vectors ──────────────────────────────────────────────────────────────
S = {}   # score-continuous (E-Q21 sealed)
for line in TS_ROWS.read_text().splitlines():
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
if len(S) != 20:
    print(f"FAIL-CLOSED: S arm has {len(S)}/20 (E-Q21 rows drifted?)")
    sys.exit(3)

N = {}   # noul-continuous (this lane)
N_stab = {}
for line in NOUL_ROWS.read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    ans = r.get("answers_raw") or {}
    vec = []
    ok = True
    for ax in AXES:
        p = (ans.get(ax) or {}).get("noul")
        if p is None:
            ok = False
            break
        vec.append(max(0.0, min(1.0, float(p))))
    if not ok:
        print(f"WARN: {r['call_id']} missing an axis (F2 breach — will VOID if any)")
        continue
    if r["call_id"].endswith("-stab"):
        N_stab[r["record_id"]] = vec
    else:
        N[r["record_id"]] = vec
if len(N) != 20:
    print(f"FAIL-CLOSED: N arm has {len(N)}/20 (F2)")
    sys.exit(3)
if len(N_stab) != 3:
    print(f"FAIL-CLOSED: F5 stability rows {len(N_stab)}/3")
    sys.exit(3)

# F5: noul stability within 0.10 (the tighter band)
stab_within = stab_total = 0
stab_report = {}
for rid, vec2 in N_stab.items():
    deltas = [abs(a - b) for a, b in zip(N[rid], vec2)]
    stab_report[rid] = {"max_delta": max(deltas), "mean_delta": sum(deltas) / 8}
    stab_within += sum(1 for d in deltas if d <= 0.10)
    stab_total += 8

# ── ternarization (F6: medians/MADs from the arm's 20 corpus vectors ONLY) ──
def ternarize_table(vectors):
    table = []
    for i in range(8):
        xs = [vectors[rid][i] for rid in IDS]
        s = sorted(xs)
        m = (s[9] + s[10]) / 2.0
        mad = sorted(abs(x - m) for x in xs)
        mad = (mad[9] + mad[10]) / 2.0
        table.append({"m": m, "mad": mad})
    return table

def tern(x, t):
    if x > t["m"] + 0.5 * t["mad"]:
        return 1.0
    if x < t["m"] - 0.5 * t["mad"]:
        return -1.0
    return 0.0

TS_TABLE = ternarize_table(S)
TN_TABLE = ternarize_table(N)
TS = {rid: [tern(v, t) for v, t in zip(vec, TS_TABLE)] for rid, vec in S.items()}
TN = {rid: [tern(v, t) for v, t in zip(vec, TN_TABLE)] for rid, vec in N.items()}

# ternary code stats
def code_stats(T):
    codes = {}
    for rid in IDS:
        key = tuple(int(v) for v in T[rid])
        codes.setdefault(key, []).append(rid)
    mass = {ax: {"neg": 0, "zero": 0, "pos": 0} for ax in AXES}
    for rid in IDS:
        for i, ax in enumerate(AXES):
            v = T[rid][i]
            if v > 0:
                mass[ax]["pos"] += 1
            elif v < 0:
                mass[ax]["neg"] += 1
            else:
                mass[ax]["zero"] += 1
    ent_total = 0.0
    for ax in AXES:
        ps = [mass[ax][k] / 20.0 for k in ("neg", "zero", "pos") if mass[ax][k] > 0]
        ent_total += -sum(p * math.log2(p) for p in ps)
    collisions = {tuple(k): v for k, v in codes.items() if len(v) > 1}
    return {
        "distinct_codes": len(codes),
        "collisions": [{"code": list(k), "records": v} for k, v in collisions.items()],
        "per_axis_mass": mass,
        "mean_bits_per_axis": ent_total / 8,
    }

# ── upsert all four arms (F4) ────────────────────────────────────────────────
ndjson = HERE / "upsert_eq22.ndjson"
with ndjson.open("w") as f:
    for prefix, arm in (("eq22S", S), ("eq22N", N), ("eq22TS", TS), ("eq22TN", TN)):
        for rid in IDS:
            f.write(json.dumps({"id": f"{prefix}:{rid}", "values": pad(arm[rid]),
                                "metadata": {"family": FAMILY[rid], "arm": prefix}}) + "\n")
env = {
    "PATH": __import__("os").environ["PATH"],
    "CLOUDFLARE_API_TOKEN": __import__("os").environ["CLOUDFLARE_TOKEN"],
    "CLOUDFLARE_ACCOUNT_ID": "049ff5e84ecf636b53b162cbb580aae6",
}
up = subprocess.run(
    ["npx", "wrangler", "vectorize", "upsert", "qthe-jev-embed", "--file", str(ndjson)],
    cwd=str(ROOT / "cloudflare"), env=env, capture_output=True, text=True, timeout=300)
print("[upsert]", (up.stdout + up.stderr).strip().splitlines()[-1] if (up.stdout + up.stderr).strip() else up.returncode)
if up.returncode != 0:
    print(up.stdout[-800:], up.stderr[-800:])
    sys.exit(4)

# ── live queries (F4 round-trip; REST per the wrangler --vector bug receipt) ─
def query_topk(vec, k=20):
    body = json.dumps({"vector": pad(vec), "topK": k}).encode()
    req = urllib.request.Request(
        "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query",
        data=body, method="POST")
    req.add_header("Authorization", "Bearer " + env["CLOUDFLARE_API_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    if not d.get("success"):
        return None
    return (d.get("result") or {}).get("matches", [])

def accuracy_via_vectorize(prefix, arm):
    hits, misses, total = 0, [], 0
    for rid in IDS:
        res = query_topk(arm[rid])
        if res is None:
            sys.exit(5)
        same_arm = [m for m in res if str(m.get("id", "")).startswith(prefix + ":")]
        others = [m for m in same_arm if m["id"] != f"{prefix}:{rid}"]
        if not others:
            misses.append((rid, "NO-NEIGHBOR"))
            continue
        total += 1
        top = others[0]
        if FAMILY[top["id"].split(":")[1]] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, top["id"].split(":")[1]))
    return hits / total, misses

ARMS = {"S": ("eq22S", S), "N": ("eq22N", N), "TS": ("eq22TS", TS), "TN": ("eq22TN", TN)}

# Vectorize upserts are ASYNC ("enqueued for upsertion", mutation changeset):
# the r24 receipt — queries fired within seconds of the enqueue see only the
# OLD vectors (r23 prefixes) and the arm-filtered neighbor set comes back
# empty (the first eval run's ZeroDivision). Poll until the new arm vectors
# are query-visible, then proceed.
import time as _time

def _arm_visible(prefix, arm):
    res = query_topk(arm["N1"], k=20)
    if res is None:
        return False
    return any(str(m.get("id", "")).startswith(prefix + ":") for m in res)

print("[consistency] waiting for the upsert changeset to become query-visible…")
for attempt in range(12):
    visible = all(_arm_visible(p, a) for p, a in ARMS.values())
    if visible:
        print(f"[consistency] all four arms query-visible after {attempt} polls")
        break
    _time.sleep(10)
else:
    print("FAIL-CLOSED: arm vectors never became query-visible (F4)")
    sys.exit(6)

retrieval = {}
for name, (prefix, arm) in ARMS.items():
    acc, misses = accuracy_via_vectorize(prefix, arm)
    retrieval[name] = {"accuracy": acc, "misses": misses}
    print(f"[retrieval] {name}: top-1 non-self family accuracy {acc:.2f} ({int(acc*20)}/20); misses: {misses}")

# local cosine sanity + separation per arm
def pair_hist(arm):
    same, cross = [], []
    for i, a in enumerate(IDS):
        for b in IDS[i + 1:]:
            c = cos(arm[a], arm[b])
            (same if FAMILY[a] == FAMILY[b] else cross).append(c)
    return {"same_mean": sum(same) / len(same), "cross_mean": sum(cross) / len(cross),
            "same_min": min(same), "cross_max": max(cross)}

separation = {name: pair_hist(arm) for name, (_, arm) in ARMS.items()}
for name, sep in separation.items():
    print(f"[separation] {name}: same={sep['same_mean']:.3f} cross={sep['cross_mean']:.3f}")

tern_stats = {"TS": code_stats(TS), "TN": code_stats(TN)}
for name, st in tern_stats.items():
    print(f"[ternary] {name}: {st['distinct_codes']} distinct codes, {st['mean_bits_per_axis']:.2f} bits/axis, {len(st['collisions'])} collisions")

out = {
    "experiment": "E-Q22",
    "arms": {"S": "score-continuous (E-Q21 sealed rows)", "N": "noul-continuous (r24 rows)",
             "TS": "score-ternary", "TN": "noul-ternary"},
    "retrieval": retrieval,
    "baselines_sealed_eq21": {"majority": MAJORITY, "permutation_null": PERM_NULL, "bow": BOW},
    "stability": {"within": stab_within, "total": stab_total, "band": 0.10, "per_record": stab_report},
    "ternarization": {"TS_table": TS_TABLE, "TN_table": TN_TABLE,
                      "rule": "+1 if x > m+0.5*MAD; -1 if x < m-0.5*MAD; else 0 (m/MAD per axis over the arm's 20 corpus vectors)"},
    "ternary_stats": tern_stats,
    "separation": separation,
    "vectors": {"S": S, "N": N, "TS": TS, "TN": TN},
    "usage_note": "23 noul calls this lane (~200-270ms each); S arm zero new calls (sealed E-Q21 rows); storage receipt: 8 ternary axes = 16 bits vs 8 float32 = 256 bits = 16x representational compression",
}
(HERE / "eval_eq22_results.json").write_text(json.dumps(out, indent=1))
print("[eval] wrote eval_eq22_results.json")
