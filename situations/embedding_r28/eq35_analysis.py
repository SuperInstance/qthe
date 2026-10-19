#!/usr/bin/env python3
# situations/embedding_r28/eq35_analysis.py — E-Q35 measures M1-M4.
import json, pathlib, statistics

HERE = pathlib.Path(__file__).resolve().parent
R24 = HERE.parent / "embedding_r24"
AXNAMES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
RELS = ["R1_subordination", "R2_independence", "R3_provenance", "R4_boundary", "R5_polarity", "R6_family_edge"]
SUBSET = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]
FAMILY = {r["id"]: r["family"] for r in json.loads((HERE / "corpus_at_scale.json").read_text())["records"]}
EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N_SEALED = EQ22["vectors"]["N"]

rows = [json.loads(l) for l in (HERE / "eq35_rows_r28.jsonl").read_text().splitlines() if l.strip()]
base = {}
stab = {}
for r in rows:
    key = (r["call_id"].split("-")[2], r["record_id"])  # arm, rid
    if r["call_id"].endswith("-stab"):
        stab[key] = r
    else:
        base[key] = r

def vec_of(row):
    ans = row.get("answers_raw") or {}
    return {k: max(0.0, min(1.0, float((ans.get(k) or {}).get("noul")))) if (ans.get(k) or {}).get("noul") is not None else None for k in RELS}

C = {rid: vec_of(base[("C", rid)]) for rid in SUBSET}
Nn = {rid: vec_of(base[("N", rid)]) for rid in SUBSET}

def profile(rid):
    v = N_SEALED[rid]
    ranked = sorted(AXNAMES, key=lambda a: -v[AXNAMES.index(a)])
    return ranked[0], ranked[1], abs(v[AXNAMES.index(ranked[0])] - v[AXNAMES.index(ranked[1])])

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

# M1 THE PROGRAM TEST: Spearman(p_C(R1), dominance)
doms = [profile(rid)[2] for rid in SUBSET]
r1_C = [C[rid]["R1_subordination"] for rid in SUBSET]
r1_N = [Nn[rid]["R1_subordination"] for rid in SUBSET]
sp_C = spearman(doms, r1_C)
sp_N = spearman(doms, r1_N)
print(f"[M1 program] dominance={[round(d,2) for d in doms]}")
print(f"[M1 program] p_C(R1)={[round(p,2) for p in r1_C]}")
print(f"[M1 program] p_N(R1)={[round(p,2) for p in r1_N]}")
print(f"[M1 program] Spearman(dominance, p_C(R1)) = {sp_C:.3f}   [arm N control: {sp_N:.3f}]")

# M2 THE CONDITIONING DELTA: |p_C - p_N| over 48 pairs
deltas = []
by_rel = {k: [] for k in RELS}
flips = []
for rid in SUBSET:
    for rel in RELS:
        d = abs(C[rid][rel] - Nn[rid][rel])
        deltas.append(d)
        by_rel[rel].append(d)
        if (C[rid][rel] >= 0.5) != (Nn[rid][rel] >= 0.5):
            flips.append((rid, rel, Nn[rid][rel], C[rid][rel]))
within = sum(1 for d in deltas if d <= 0.10)
print(f"[M2 delta] median {statistics.median(deltas):.3f} mean {statistics.mean(deltas):.3f} max {max(deltas):.3f} | within 0.10: {within}/48 = {within/48:.2f}")
print(f"[M2 delta] per-relation means:", {k.split('_')[0]: round(statistics.mean(v), 3) for k, v in by_rel.items()})
print(f"[M2 delta] verdict flips (cross 0.5): {flips}")

# M3 THE RELATION SIGNATURE: family separation per relation (max gap between
# one family's mean and the others) vs the raw-axis separations on A-family
fams = ["N", "P", "Q", "A"]
def fam_sep(vals_by_rid, rel):
    seps = {}
    for f in fams:
        mine = [vals_by_rid[rid][rel] for rid in SUBSET if FAMILY[rid] == f]
        others = [vals_by_rid[rid][rel] for rid in SUBSET if FAMILY[rid] != f]
        seps[f] = statistics.mean(mine) - statistics.mean(others)
    return seps

rel_seps = {rel: fam_sep(C, rel) for rel in RELS}
raw_seps = {}
for ax in AXNAMES:
    per = {rid: N_SEALED[rid][AXNAMES.index(ax)] for rid in SUBSET}
    seps = {}
    for f in fams:
        mine = [per[rid] for rid in SUBSET if FAMILY[rid] == f]
        others = [per[rid] for rid in SUBSET if FAMILY[rid] != f]
        seps[f] = statistics.mean(mine) - statistics.mean(others)
    raw_seps[ax] = seps

best_A_raw = max(raw_seps.items(), key=lambda t: t[1]["A"])
print(f"[M3 signature] A-family: best RAW axis = {best_A_raw[0].split('_')[0]} sep {best_A_raw[1]['A']:.3f}")
for rel in RELS:
    s = rel_seps[rel]
    print(f"[M3 signature]   {rel}: A-sep {s['A']:+.3f}  (N{s['N']:+.2f} P{s['P']:+.2f} Q{s['Q']:+.2f})")
best_A_rel = max(rel_seps.items(), key=lambda t: t[1]["A"])
print(f"[M3 signature] A-family: best RELATION = {best_A_rel[0]} sep {best_A_rel[1]['A']:.3f}")

# M4 stability
stab_report = {}
for (arm, rid), row in stab.items():
    v2 = vec_of(row)
    src = C if arm == "C" else Nn
    stab_report[f"{arm}-{rid}"] = max(abs(src[rid][rel] - v2[rel]) for rel in RELS)
print(f"[M4 stability] {stab_report} | max {max(stab_report.values()):.3f}")

out = {
    "experiment": "E-Q35",
    "amendments": ["AM1 (implementation-time, pre-analysis): stability interpreted as 3 records PER ARM (6 calls, 22 total) — the design_frozen reading; budget line said 19; superset chosen, no floor breached"],
    "M1_program_test": {"spearman_dominance_pC_R1": sp_C, "spearman_dominance_pN_R1": sp_N,
                         "dominance": doms, "p_C_R1": r1_C, "p_N_R1": r1_N},
    "M2_conditioning_delta": {"median": statistics.median(deltas), "mean": statistics.mean(deltas),
                               "max": max(deltas), "within_010": within, "n": 48,
                               "per_relation_mean": {k: statistics.mean(v) for k, v in by_rel.items()},
                               "verdict_flips": flips},
    "M3_relation_signature": {"relation_seps": rel_seps, "raw_seps": raw_seps,
                               "best_A_raw": best_A_raw[0], "best_A_rel": best_A_rel[0]},
    "M4_stability": stab_report,
    "models_served": sorted({r["model_served"] for r in rows}),
}
(HERE / "eq35_results.json").write_text(json.dumps(out, indent=1))
print("[eval] wrote eq35_results.json")
