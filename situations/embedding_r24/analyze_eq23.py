#!/usr/bin/env python3
# situations/embedding_r24/analyze_eq23.py — E-Q23 lane T15-c: the occlusion
# analysis. Saliency matrices, concentration (M1), axis-specificity (M2),
# family signature (M3), the misfile bridge (M4), the stability bridge (M5,
# the jev-lattice fragility bridge), and the drift lane (M6/D1, jev-preview
# vs jev-latest). Writes eq23_results.json for the seal.
import json
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
SUBSET = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]

corpus = json.loads((R23 / "corpus.json").read_text())
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
spans_doc = json.loads((HERE / "spans_eq23.json").read_text())
SPANS = spans_doc["spans"]
E21 = json.loads((R23 / "eval_results.json").read_text())  # sealed E-Q21 (vectors + misses)

def norm_axis(score, k=4.0):
    return max(0.0, min(1.0, float(score) / k))

# ── parse rows ───────────────────────────────────────────────────────────────
full, occl, drift = {}, {}, {}
for line in (HERE / "occlusion_rows_r24.jsonl").read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    ans = r.get("answers_raw") or {}
    vec = []
    ok = True
    for ax in AXES:
        s = (ans.get(ax) or {}).get("score")
        if s is None:
            ok = False
            break
        vec.append(norm_axis(s))
    if not ok:
        raise SystemExit(f"F3/F5/F6 breach: {r['call_id']} incomplete")
    if r["task"] == "occlusion-full":
        full[r["record_id"]] = vec
    elif r["task"] == "occlusion-span":
        occl[(r["record_id"], r["span_index"])] = vec
    elif r["task"] == "drift-preview":
        drift[r["record_id"]] = {"vec": vec, "model_served": r.get("model_served")}

assert len(full) == 8, f"F5: {len(full)}/8 full rows"
assert len(occl) == sum(len(v) for v in SPANS.values()), "F3: occlusion rows incomplete"
assert len(drift) == 8, f"F6: {len(drift)}/8 drift rows"
for rid, d in drift.items():
    assert "1.14.0" in str(d["model_served"]), f"F6: {rid} drift row served {d['model_served']}"

# ── saliency ────────────────────────────────────────────────────────────────
saliency = {}  # rid -> [span][axis]
for rid in SUBSET:
    mat = []
    for i in range(len(SPANS[rid])):
        mat.append([abs(full[rid][a] - occl[(rid, i)][a]) for a in range(8)])
    saliency[rid] = mat

# M1 concentration: span-mass distribution -> normalized entropy
entropies = {}
for rid in SUBSET:
    masses = [sum(row) for row in saliency[rid]]
    tot = sum(masses)
    n = len(masses)
    if tot == 0:
        entropies[rid] = 1.0  # maximally flat (degenerate: no signal at all)
        continue
    ps = [m / tot for m in masses]
    h = -sum(p * math.log2(p) for p in ps if p > 0)
    entropies[rid] = h / math.log2(n)
mean_entropy = sum(entropies.values()) / 8

# M2 axis-specificity: fraction of axis pairs whose top-span differs
spec = {}
for rid in SUBSET:
    tops = []
    for a in range(8):
        col = [saliency[rid][i][a] for i in range(len(SPANS[rid]))]
        best = max(range(len(col)), key=lambda i: col[i])
        tops.append(best)
    pairs = total = 0
    for a in range(8):
        for b in range(a + 1, 8):
            total += 1
            if tops[a] != tops[b]:
                pairs += 1
    spec[rid] = pairs / total
mean_spec = sum(spec.values()) / 8

# M3 family signature: within- vs cross-family Spearman of flattened profiles
def flatten(rid):
    return [v for row in saliency[rid] for v in row]

def ranks(xs):
    idx = sorted(range(len(xs)), key=lambda i: xs[i])
    rk = [0.0] * len(xs)
    i = 0
    while i < len(idx):
        j = i
        while j + 1 < len(idx) and xs[idx[j + 1]] == xs[idx[i]]:
            j += 1
        avg = (i + j) / 2.0 + 1
        for k in range(i, j + 1):
            rk[idx[k]] = avg
        i = j + 1
    return rk

def spearman(a, b):
    ra, rb = ranks(a), ranks(b)
    n = len(a)
    d2 = sum((x - y) ** 2 for x, y in zip(ra, rb))
    return 1 - 6 * d2 / (n * (n * n - 1))

within, cross = [], []
for i, a in enumerate(SUBSET):
    for b in SUBSET[i + 1:]:
        c = spearman(flatten(a), flatten(b))
        (within if FAMILY[a] == FAMILY[b] else cross).append(c)
within_mean = sum(within) / len(within)
cross_mean = sum(cross) / len(cross)

# M4 misfile bridge: E-Q21's sealed jev misses vs entropy
e21_misses = {m[0] for m in E21["retrieval"]["jev"]["misses"]}
misfiled_entropy = [entropies[rid] for rid in SUBSET if rid in e21_misses]
filed_entropy = [entropies[rid] for rid in SUBSET if rid not in e21_misses]
m4_mean_misfiled = sum(misfiled_entropy) / len(misfiled_entropy) if misfiled_entropy else None
m4_mean_filed = sum(filed_entropy) / len(filed_entropy)

# M5 stability bridge: max |v_full - v_e21_sealed| vs entropy (Spearman, 8 pts)
stab_delta = {}
for rid in SUBSET:
    v21 = E21["vectors"]["jev"][rid]
    stab_delta[rid] = max(abs(a - b) for a, b in zip(full[rid], v21))
sp5 = spearman([entropies[r] for r in SUBSET], [stab_delta[r] for r in SUBSET])

# M6/D1 drift: per-axis mean |preview - latest| over 8 records
drift_prof = []
for a, ax in enumerate(AXES):
    ds = [abs(drift[rid]["vec"][a] - full[rid][a]) for rid in SUBSET]
    drift_prof.append({"axis": ax, "mean_abs_delta": sum(ds) / 8, "max": max(ds)})
dmax = max(p["mean_abs_delta"] for p in drift_prof)
dmin = min(p["mean_abs_delta"] for p in drift_prof)
top_axis = max(drift_prof, key=lambda p: p["mean_abs_delta"])["axis"]

out = {
    "experiment": "E-Q23",
    "spans_sha256": spans_doc["spans_sha256"],
    "saliency": {rid: saliency[rid] for rid in SUBSET},
    "M1_concentration": {"per_record": entropies, "mean": mean_entropy},
    "M2_axis_specificity": {"per_record": spec, "mean": mean_spec},
    "M3_family_signature": {"within_mean": within_mean, "cross_mean": cross_mean,
                            "n_within": len(within), "n_cross": len(cross)},
    "M4_misfile_bridge": {"e21_misfiled_in_subset": sorted(e21_misses & set(SUBSET)),
                          "mean_entropy_misfiled": m4_mean_misfiled,
                          "mean_entropy_filed": m4_mean_filed,
                          "per_record_entropy": entropies},
    "M5_stability_bridge": {"per_record_max_delta": stab_delta, "spearman_entropy_vs_delta": sp5},
    "M6_drift": {"per_axis": drift_prof, "max_min_ratio": dmax / dmin if dmin else None,
                 "top_axis": top_axis,
                 "mean_vector_l1": sum(sum(abs(x - y) for x, y in zip(drift[r]["vec"], full[r])) for r in SUBSET) / 8},
    "vectors": {"full": full, "drift_preview": {r: drift[r]["vec"] for r in SUBSET}},
}
(HERE / "eq23_results.json").write_text(json.dumps(out, indent=1))

print(f"[M1] mean normalized span entropy: {mean_entropy:.3f} (per-record: " + ", ".join(f"{r}={entropies[r]:.2f}" for r in SUBSET) + ")")
print(f"[M2] mean axis-specificity: {mean_spec:.3f}")
print(f"[M3] within-family saliency correlation {within_mean:.3f} vs cross {cross_mean:.3f} (diff {within_mean-cross_mean:.3f})")
print(f"[M4] misfiled entropy {m4_mean_misfiled} vs filed {m4_mean_filed:.3f} (misfiled-in-subset: {sorted(e21_misses & set(SUBSET))})")
print(f"[M5] spearman(entropy, re-embed delta) = {sp5:.3f}; deltas: " + ", ".join(f"{r}={stab_delta[r]:.2f}" for r in SUBSET))
print(f"[M6] drift max/min axis ratio {dmax/dmin if dmin else float('inf'):.2f}, top axis {top_axis}")
for p in drift_prof:
    print(f"     {p['axis']}: mean {p['mean_abs_delta']:.3f} max {p['max']:.2f}")
