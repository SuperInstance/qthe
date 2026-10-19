#!/usr/bin/env python3
# situations/embedding_r28/eq38_analysis.py — the fourth drift reading vs the
# three sealed baselines (r24/r25/r26).
import json, pathlib, statistics

HERE = pathlib.Path(__file__).resolve().parent
R24 = HERE.parent / "embedding_r24"
R25 = HERE.parent / "tripwire_r25"
R26 = HERE.parent / "embedding_r26"
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
DECOYS = ["D1_far_marine", "D2_far_painting", "D3_near_bio", "D4_near_price"]

EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N_r24 = EQ22["vectors"]["N"]

N_r25 = {}
for line in (R25 / "tripwire_rows_r25.jsonl").read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    if r["call_id"].endswith("-stab") or r["call_id"].endswith("-poison"):
        continue
    ans = r.get("answers_raw") or {}
    N_r25[r["record_id"]] = [max(0.0, min(1.0, float((ans.get(ax) or {}).get("noul")))) for ax in AXES]

N_r26 = {}
for line in (R26 / "drift_rows_r26.jsonl").read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    ans = r.get("answers_raw") or {}
    N_r26[r["record_id"]] = [max(0.0, min(1.0, float((ans.get(ax) or {}).get("noul")))) for ax in AXES]

rows = [json.loads(l) for l in (HERE / "eq38_rows_r28.jsonl").read_text().splitlines() if l.strip()]
N_r28, D_r28, models = {}, {}, set()
for r in rows:
    ans = r.get("answers_raw") or {}
    N_r28[r["record_id"]] = [max(0.0, min(1.0, float((ans.get(ax) or {}).get("noul")))) for ax in AXES]
    D_r28[r["record_id"]] = [max(0.0, min(1.0, float((ans.get(dx) or {}).get("noul")))) for dx in DECOYS]
    models.add(r["model_served"])

IDS = sorted(N_r28)
assert len(IDS) == 20

def drift_vs(base):
    per_record = {rid: max(abs(N_r28[rid][i] - base[rid][i]) for i in range(8)) for rid in IDS}
    within = sum(1 for v in per_record.values() if v <= 0.10)
    mean_axis = statistics.mean(abs(N_r28[rid][i] - base[rid][i]) for rid in IDS for i in range(8))
    return {"max": max(per_record.values()), "mean_axis": mean_axis, "within_010": within, "per_record_max": per_record}

d24, d25, d26 = drift_vs(N_r24), drift_vs(N_r25), drift_vs(N_r26)
print(f"[drift vs r24] max {d24['max']:.2f} mean_axis {d24['mean_axis']:.4f} within {d24['within_010']}/20")
print(f"[drift vs r25] max {d25['max']:.2f} mean_axis {d25['mean_axis']:.4f} within {d25['within_010']}/20")
print(f"[drift vs r26] max {d26['max']:.2f} mean_axis {d26['mean_axis']:.4f} within {d26['within_010']}/20")
print(f"[models_served] {sorted(models)}")
print(f"[trend] r28-vs-r26 mean {d26['mean_axis']:.4f} vs r26-vs-r24 0.0093 (from the sealed r26 reading)")
floor_all = [v for rid in IDS for v in D_r28[rid]]
print(f"[decoy floor] mean {statistics.mean(floor_all):.4f} max {max(floor_all):.3f} n={len(floor_all)}")

per_axis = {AXES[i]: statistics.mean(abs(N_r28[rid][i] - N_r26[rid][i]) for rid in IDS) for i in range(8)}
print("[per-axis vs r26]", {k.split('_')[0]: round(v, 4) for k, v in per_axis.items()})

out = {
    "experiment": "E-Q38",
    "models_served": sorted(models),
    "drift_vs_r24": d24, "drift_vs_r25": d25, "drift_vs_r26": d26,
    "per_axis_mean_vs_r26": per_axis,
    "decoy_floor": {"mean": statistics.mean(floor_all), "max": max(floor_all), "n": len(floor_all)},
}
(HERE / "eq38_results.json").write_text(json.dumps(out, indent=1))
print("[eval] wrote eq38_results.json")
