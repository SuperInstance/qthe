#!/usr/bin/env python3
# situations/embedding_r28/eq37_analysis.py — E-Q37 measures M1-M5.
import json, pathlib, statistics

HERE = pathlib.Path(__file__).resolve().parent
R24 = HERE.parent / "embedding_r24"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
DECOYS = ["D1_far_marine", "D2_far_painting", "D3_near_bio", "D4_near_price"]
SUBSET = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]
FAMILY = {r["id"]: r["family"] for r in json.loads((HERE / "corpus_at_scale.json").read_text())["records"]}
EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N_SEALED = EQ22["vectors"]["N"]

rows = [json.loads(l) for l in (HERE / "eq37_rows_r28.jsonl").read_text().splitlines() if l.strip()]
T = {}
for r in rows:
    t = r["call_id"].split("-")[2]
    T[(t, r["record_id"])] = r

def vec_of(row):
    ans = row.get("answers_raw") or {}
    return {k: max(0.0, min(1.0, float((ans.get(k) or {}).get("noul")))) if (ans.get(k) or {}).get("noul") is not None else None for k in AXES + DECOYS}

V = {t: {rid: vec_of(T[(t, rid)]) for rid in SUBSET} for t in ("T0", "T1", "T2", "T3")}

def spearman(xs, ys):
    def ranks(v):
        s = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(s):
            j = i
            while j + 1 < len(s) and v[s[j + 1]] == v[s[i]]:
                j += 1
            avg = (i + j) / 2 + 1
            for k in range(i, j + 1):
                r[s[k]] = avg
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    mx, my = statistics.mean(rx), statistics.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den = (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5
    return num / den if den else 0.0

# F4 anchor check: T0 vs sealed E-Q22 within 0.10 on >= 7/8 records
anchor_ok = 0
anchor_maxes = {}
for rid in SUBSET:
    m = max(abs(V["T0"][rid][ax] - N_SEALED[rid][AXES.index(ax)]) for ax in AXES)
    anchor_maxes[rid] = m
    anchor_ok += 1 if m <= 0.10 else 0
print(f"[F4 anchor] T0 vs sealed E-Q22: max-per-record {({k: round(v,3) for k,v in anchor_maxes.items()})} | within 0.10: {anchor_ok}/8")
assert anchor_ok >= 7, "F4 BREACH: anchor failed"

# M1 movement distributions per treatment (vs the IN-RUN T0 anchor)
report = {}
for t in ("T1", "T2", "T3"):
    deltas = [abs(V[t][rid][ax] - V["T0"][rid][ax]) for rid in SUBSET for ax in AXES]
    over = sum(1 for d in deltas if d > 0.10)
    report[t] = {"median": statistics.median(deltas), "mean": statistics.mean(deltas),
                 "p90": sorted(deltas)[int(0.9 * len(deltas))], "max": max(deltas),
                 "pct_over_band": over / 64}
    print(f"[M1 {t}] median {report[t]['median']:.3f} mean {report[t]['mean']:.3f} p90 {report[t]['p90']:.3f} max {report[t]['max']:.3f} | >0.10: {over}/64 = {over/64:.0%}")

# M2 shape preservation: Spearman(profile_T, profile_T0) per record
shape = {}
for t in ("T1", "T2", "T3"):
    sps = []
    for rid in SUBSET:
        a = [V[t][rid][ax] for ax in AXES]
        b = [V["T0"][rid][ax] for ax in AXES]
        sps.append(spearman(a, b))
    shape[t] = {"per_record": [round(s, 3) for s in sps], "median": statistics.median(sps)}
    print(f"[M2 {t}] shape Spearman per record: {[round(s,3) for s in sps]} median {statistics.median(sps):.3f}")

# M3 axis susceptibility: per-axis mean movement, and cross-treatment rank correlation
susc = {}
for t in ("T1", "T2", "T3"):
    susc[t] = {ax: statistics.mean(abs(V[t][rid][ax] - V["T0"][rid][ax]) for rid in SUBSET) for ax in AXES}
    print(f"[M3 {t}] susceptibility:", {ax.split('_')[0]: round(v, 3) for ax, v in sorted(susc[t].items(), key=lambda kv: -kv[1])})
pairs = [("T1", "T2"), ("T1", "T3"), ("T2", "T3")]
susp_corr = {}
for a, b in pairs:
    rho = spearman([susc[a][ax] for ax in AXES], [susc[b][ax] for ax in AXES])
    susp_corr[f"{a}-{b}"] = rho
    print(f"[M3] susceptibility rank corr {a} vs {b}: {rho:.3f}")

# M4 family effect: mean movement per record family
fam_eff = {}
for t in ("T1", "T2", "T3"):
    for f in ("N", "P", "Q", "A"):
        vals = [abs(V[t][rid][ax] - V["T0"][rid][ax]) for rid in SUBSET if FAMILY[rid] == f for ax in AXES]
        fam_eff[f"{t}-{f}"] = statistics.mean(vals)
print("[M4 family]", {k: round(v, 3) for k, v in fam_eff.items()})

# M5 decoy floor under each treatment
floor = {}
for t in ("T0", "T1", "T2", "T3"):
    vals = [V[t][rid][dx] for rid in SUBSET for dx in DECOYS]
    floor[t] = {"mean": statistics.mean(vals), "max": max(vals)}
    print(f"[M5 floor {t}] mean {floor[t]['mean']:.4f} max {floor[t]['max']:.3f}")

out = {
    "experiment": "E-Q37",
    "anchor": {"per_record_max": anchor_maxes, "within_010": anchor_ok},
    "M1_movement": report,
    "M2_shape": shape,
    "M3_susceptibility": susc,
    "M3_susceptibility_rank_corr": susp_corr,
    "M4_family_effect": fam_eff,
    "M5_decoy_floor": floor,
    "models_served": sorted({r["model_served"] for r in rows}),
}
(HERE / "eq37_results.json").write_text(json.dumps(out, indent=1))
print("[eval] wrote eq37_results.json")
