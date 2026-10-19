#!/usr/bin/env python3
# situations/embedding_r28/eq36_analysis.py — E-Q36 lane T19-b: upsert arm=eq36N,
# poll-until-visible (the async-changeset law), then the at-scale battery:
# M1 majority baseline / M2 full-8 / M3 the 255-subset budget curve + Shapley /
# M4 knee-vs-Shapley / M5 the 10 fresh family-algebra compositions vs the
# pre-committed permutation null / M7 the 240-reading decoy floor.
import hashlib, itertools, json, os, pathlib, random, statistics, subprocess, sys, time, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CF = "https://api.cloudflare.com/client/v4/accounts/049ff5e84ecf636b53b162cbb580aae6/vectorize/v2/indexes/qthe-jev-embed/query"
ARM = "eq36N"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
DECOYS = ["D1_far_marine", "D2_far_painting", "D3_near_bio", "D4_near_price"]
NULL_SEED = 20261020

corpus = json.loads((HERE / "corpus_at_scale.json").read_text())
records = corpus["records"]
FAMILY = {r["id"]: r["family"] for r in records}
IDS = [r["id"] for r in records]
FAMS = ["N", "P", "Q", "A"]

# the sealed rows -> vectors
rows = [json.loads(l) for l in (HERE / "eq36_rows_r28.jsonl").read_text().splitlines() if l.strip()]
base = {r["record_id"]: r for r in rows if not r["call_id"].endswith("-stab")}
stab = {r["record_id"]: r for r in rows if r["call_id"].endswith("-stab")}
assert len(base) == 60, f"expected 60 sealed base rows, got {len(base)}"
models_served = sorted({r["model_served"] for r in rows})

def vec_of(row):
    ans = row.get("answers_raw") or {}
    out = {}
    for ax in AXES + DECOYS:
        p = (ans.get(ax) or {}).get("noul")
        out[ax] = max(0.0, min(1.0, float(p))) if p is not None else None
    return out

V = {rid: vec_of(row) for rid, row in base.items()}
missing = [rid for rid in IDS if any(V[rid][ax] is None for ax in AXES)]
assert not missing, f"missing answers: {missing}"

# F5 stability receipt
stab_report = {}
for rid, row in stab.items():
    v2 = vec_of(row)
    stab_report[rid] = max(abs(V[rid][ax] - v2[ax]) for ax in AXES)

def pad32(vals):
    v = [round(x, 6) for x in vals]
    return v + [0.0] * (32 - len(v))

# ---- upsert (arm=eq36N) ----
ndjson = HERE / "upsert_eq36.ndjson"
with ndjson.open("w") as f:
    for rid in IDS:
        f.write(json.dumps({"id": f"eq36N:{rid}", "values": pad32([V[rid][ax] for ax in AXES]),
                            "metadata": {"family": FAMILY[rid], "arm": ARM}}) + "\n")
env = {"PATH": os.environ["PATH"], "CLOUDFLARE_API_TOKEN": os.environ["CLOUDFLARE_TOKEN"],
       "CLOUDFLARE_ACCOUNT_ID": "049ff5e84ecf636b53b162cbb580aae6"}
up = subprocess.run(["npx", "wrangler", "vectorize", "upsert", "qthe-jev-embed", "--file", str(ndjson)],
                    cwd=str(ROOT / "cloudflare"), env=env, capture_output=True, text=True, timeout=600)
print("[upsert]", (up.stdout + up.stderr).strip().splitlines()[-1] if (up.stdout + up.stderr).strip() else up.returncode)
if up.returncode != 0:
    sys.exit(4)

def query_topk(vec, arm, k=60):
    body = json.dumps({"vector": pad32(vec), "topK": k, "filter": {"arm": arm}}).encode()
    req = urllib.request.Request(CF, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + os.environ["CLOUDFLARE_TOKEN"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode())
    return [(m["id"].split(":", 1)[1], m["score"]) for m in (d.get("result") or {}).get("matches", [])]

# poll-until-visible (the E-Q29 ops law)
visible = 0
for _ in range(60):  # up to 300s
    try:
        visible = len(query_topk([1.0] * 8, ARM))
    except Exception:
        visible = 0
    if visible >= 60:
        break
    time.sleep(5)
print(f"[poll] {ARM}: {visible}/60 vectors visible")
assert visible >= 60, "poll-until-visible FAILED"

# smoke query (F4): 5 records
for rid in ["N1", "P7", "Q12", "A3", "N15"]:
    m = query_topk([V[rid][ax] for ax in AXES], ARM, k=5)
    print(f"[smoke] {rid} -> top1 {m[0][0] if m else 'NONE'} ({FAMILY.get(m[0][0], '?') if m else '-'})")

# ---- M1/M3: the 255-subset budget curve (local) + Shapley ----
def cos(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return dot / (na * nb) if na and nb else 0.0

def subset_retrieval_local(subset):
    """strict NO-NEIGHBOR rule: top-1 cosine neighbor excluding self, family match"""
    hits = 0
    misses = []
    for rid in IDS:
        q = [V[rid][ax] for ax in subset]
        best, best_s = None, -2.0
        for rid2 in IDS:
            if rid2 == rid:
                continue
            s = cos(q, [V[rid2][ax] for ax in subset])
            if s > best_s:
                best_s, best = s, rid2
        if FAMILY[best] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, best))
    return hits / 60.0, misses

curve = {}
for k in range(1, 9):
    accs = []
    for subset in itertools.combinations(AXES, k):
        acc, _ = subset_retrieval_local(subset)
        accs.append((acc, subset))
    accs.sort(key=lambda t: (-t[0], t[1]))
    curve[k] = {"best": accs[0][0], "best_subset": list(accs[0][1]), "mean": statistics.mean(a for a, _ in accs)}
    print(f"[curve] k={k}: best {accs[0][0]:.3f} {accs[0][1]}  mean {curve[k]['mean']:.3f}")

best_overall = max(((k, curve[k]["best"]) for k in range(1, 9)), key=lambda t: t[1])
print(f"[curve] BEST-OVERALL k={best_overall[0]} at {best_overall[1]:.3f}")

# Shapley (exact over the 255 subsets, efficiency characteristic = retrieval accuracy)
def shapley():
    cache = {}
    for k in range(1, 9):
        for subset in itertools.combinations(AXES, k):
            acc, _ = subset_retrieval_local(subset)
            cache[subset] = acc
    sh = {ax: 0.0 for ax in AXES}
    n = 8
    import math
    for subset, acc in cache.items():
        S = len(subset)
        w = math.factorial(S - 1) * math.factorial(n - S) / math.factorial(n)
        for ax in subset:
            sh[ax] += w * acc
        for ax in AXES:
            if ax not in subset:
                # marginal contributions computed directly
                pass
    # exact: sh[ax] = sum over subsets NOT containing ax of w * (v(S+ax) - v(S))
    sh = {ax: 0.0 for ax in AXES}
    for subset, acc in cache.items():
        S = len(subset)
        for ax in AXES:
            if ax in subset:
                continue
            bigger = tuple(sorted(subset + (ax,)))
            w = math.factorial(S) * math.factorial(n - S - 1) / math.factorial(n)
            sh[ax] += w * (cache[bigger] - acc)
    return sh

sh = shapley()
print("[shapley]", {k.split("_")[0]: round(v, 4) for k, v in sorted(sh.items(), key=lambda t: -t[1])})

# ---- live confirmations: full-8, best-4 (and best-k if != 4) ----
live = {}
def live_arm(names):
    hits = 0
    misses = []
    for rid in IDS:
        q = [V[rid][ax] for ax in names]
        m = query_topk(q, ARM, k=60)
        others = [(r2, s) for r2, s in m if r2 != rid]
        if not others:
            misses.append((rid, "NO-NEIGHBOR"))
            continue
        if FAMILY[others[0][0]] == FAMILY[rid]:
            hits += 1
        else:
            misses.append((rid, others[0][0]))
    return hits / 60.0, misses

for label, names in [("full8", AXES), ("best4", curve[4]["best_subset"])]:
    acc, misses = live_arm(names)
    live[label] = {"accuracy": acc, "subset": list(names), "misses": misses}
    print(f"[live] {label}: {acc:.3f} ({list(names)}) misses={len(misses)}")

# ---- M5: the 10 fresh family-algebra compositions vs pre-committed null ----
# F5: fixed by deterministic seed BEFORE any query
rng = random.Random(NULL_SEED)
fam_records = {f: [rid for rid in IDS if FAMILY[rid] == f] for f in FAMS}
compositions = []
used = set()
while len(compositions) < 10:
    fa, fb, fc = rng.sample(FAMS, 3)
    a = rng.choice(fam_records[fa])
    b = rng.choice(fam_records[fb])
    c = rng.choice(fam_records[fc])
    key = (a, b, c)
    if key in used or len({a, b, c}) < 3:
        continue
    used.add(key)
    compositions.append({"a": a, "b": b, "c": c, "target_family": fa})

def family_hit(comp):
    q = [V[comp["a"]][ax] - V[comp["b"]][ax] + V[comp["c"]][ax] for ax in AXES]
    m = query_topk(q, ARM, k=60)
    if not m:
        return None, "NO-MATCH"
    top_fam = FAMILY[m[0][0]]
    return top_fam == comp["target_family"], m[0][0]

hits = 0
comp_results = []
for comp in compositions:
    hit, top = family_hit(comp)
    comp_results.append({**comp, "top1": top, "family_hit": hit})
    hits += 1 if hit else 0
    print(f"[algebra] v({comp['a']})-v({comp['b']})+v({comp['c']}) -> {top} (target {comp['target_family']}) {'HIT' if hit else 'MISS'}")

# permutation null: 1000 shuffles of family labels over the fixed 60 ids.
# Efficient correct form: the composed vectors are FIXED (already queried);
# only the labels move — both the target's (a's) label and the top-1's.
labels = [FAMILY[rid] for rid in IDS]
null_hits = []
nrng = random.Random(NULL_SEED + 1)
top1_ids = [cr["top1"] for cr in comp_results]
for _ in range(1000):
    perm = labels[:]
    nrng.shuffle(perm)
    pfam = dict(zip(IDS, perm))
    h = 0
    for cr, t1 in zip(comp_results, top1_ids):
        # target family under permutation: the a-record's family label moves too
        ta = pfam[cr["a"]]
        if t1 is not None and pfam[t1] == ta:
            h += 1
    null_hits.append(h)
null_mean = statistics.mean(null_hits)
null_sd = statistics.pstdev(null_hits)
null_p95 = sorted(null_hits)[int(0.95 * len(null_hits))]
print(f"[algebra] family hits {hits}/10 vs null {null_mean:.3f} ± {null_sd:.3f} (p95 {null_p95})")

# ---- M7: the 240-reading decoy floor ----
floor = {dx: [V[rid][dx] for rid in IDS if V[rid][dx] is not None] for dx in DECOYS}
floor_report = {}
all_floor = []
for dx, vals in floor.items():
    all_floor.extend(vals)
    floor_report[dx] = {"mean": statistics.mean(vals), "max": max(vals), "n": len(vals)}
floor_report["all"] = {"mean": statistics.mean(all_floor), "max": max(all_floor), "n": len(all_floor)}
print(f"[decoy-floor] mean {floor_report['all']['mean']:.4f} max {floor_report['all']['max']:.3f} n={floor_report['all']['n']}")

out = {
    "experiment": "E-Q36",
    "models_served": models_served,
    "corpus_sha256": hashlib.sha256((HERE / "corpus_at_scale.json").read_bytes()).hexdigest(),
    "n_records": 60,
    "stability_max_axis": stab_report,
    "majority_baseline": 0.25,
    "budget_curve": curve,
    "best_overall_k": best_overall[0],
    "shapley": sh,
    "live": live,
    "algebra": {"compositions": comp_results, "hits": hits, "null_mean": null_mean,
                "null_sd": null_sd, "null_p95": null_p95},
    "decoy_floor": floor_report,
    "null_seed": NULL_SEED,
}
(HERE / "eq36_results.json").write_text(json.dumps(out, indent=1))
print("[eval] wrote eq36_results.json")
