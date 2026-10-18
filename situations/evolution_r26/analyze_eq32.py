#!/usr/bin/env python3
# situations/evolution_r26/analyze_eq32.py — E-Q32 analysis: the repair
# receipt. C30 — retrieval-coupled selection repairs the decoupling.
import json
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R23 = ROOT / "situations" / "embedding_r23"
R24 = ROOT / "situations" / "embedding_r24"

AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]

corpus = json.loads((R23 / "corpus.json").read_text())
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
N_SEALED = json.loads((R24 / "eval_eq22_results.json").read_text())["vectors"]["N"]

state = json.loads((HERE / "evosphere32_state.json").read_text())
attempts = state["attempts"]
lineage = state["lineage"]
stations = state["stations"]

def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

# reconstruct vectors from the AS-SAID rows
rows = [json.loads(x) for x in (HERE / "evolution32_rows_r27.jsonl").read_text().splitlines() if x.strip()]
embed_vec = {}
for r in rows:
    if r.get("kind") == "embed":
        ans = r.get("answers_raw") or {}
        embed_vec[r["call_id"]] = [max(0.0, min(1.0, float((ans.get(a) or {}).get("noul")))) for a in AXES]
acc_attempt_by_gen = {a["gen"]: a["attempt"] for a in attempts if a["verdict"] == "accept"}
for l in lineage:
    att = acc_attempt_by_gen[l["gen"]]
    l["v_latest"] = embed_vec[f"r27-evo32-lat-gen{l['gen']}-att{att}"]
    l["v_preview"] = embed_vec[f"r27-evo32-pre-gen{l['gen']}-att{att}"]

# M1: stations-to-coverage
stations_to_coverage = len(stations)

# M2: acceptance + rejection anatomy
rejection_anatomy = {}
for a in attempts:
    if a["verdict"] == "reject":
        clause = a.get("rejection_clause") or "unknown"
        rejection_anatomy[clause] = rejection_anatomy.get(clause, 0) + 1
acceptance_rate = len([a for a in attempts if a["verdict"] == "accept"]) / len(attempts)

# M3: cross-model retrieval agreement (family level + record level)
fam_agree = rec_agree = 0
for a in attempts:
    rl, rp = a.get("retrieval_latest") or {}, a.get("retrieval_preview") or {}
    if rl.get("family") == rp.get("family"):
        fam_agree += 1
    if rl.get("top1") == rp.get("top1"):
        rec_agree += 1
fam_agreement_rate = fam_agree / len(attempts)
rec_agreement_rate = rec_agree / len(attempts)

# M4: heredity
heredity = [cos(l["v_latest"], N_SEALED[l["station"]]) for l in lineage]
mean_heredity = sum(heredity) / len(heredity)

# M5: the decoupling delta — rejected attempts where the centroid cosine
# improved while the retrieval refused (the E-Q28 failure mode, still trying)
decoupling_rejections = 0
rejections = 0
for a in attempts:
    if a["verdict"] == "reject":
        rejections += 1
        if a["fitness_latest"] > a["parent_fitness_latest"]:
            decoupling_rejections += 1
decoupling_delta_rate = decoupling_rejections / rejections if rejections else None

# M6: directive causality
named_moves, unnamed_moves = [], []
for i, l in enumerate(lineage):
    parent_vec = N_SEALED["N1"] if i == 0 else lineage[i - 1]["v_latest"]
    d = [abs(l["v_latest"][j] - parent_vec[j]) for j in range(8)]
    daxes = l.get("directive_axes") or []
    named_moves.extend(d[j] for j in daxes)
    unnamed_moves.extend(d[j] for j in range(8) if j not in daxes)
mean_named = sum(named_moves) / len(named_moves)
mean_unnamed = sum(unnamed_moves) / len(unnamed_moves)

# hypotheses / claims
H1 = stations_to_coverage <= 5
H2 = fam_agreement_rate >= 0.60
H3 = mean_heredity >= 0.75
C30 = H1
P1 = stations_to_coverage in (4, 5)
other_clauses = [v for k, v in rejection_anatomy.items() if k != "latest-retrieval-not-novel"]
P2 = rejection_anatomy.get("latest-retrieval-not-novel", 0) >= (max(other_clauses) if other_clauses else 0) if rejection_anatomy else False
P3 = 0.6 <= fam_agreement_rate <= 0.9
P4 = 0.70 <= mean_heredity <= 0.90
P5 = decoupling_delta_rate is not None and decoupling_delta_rate >= 0.40
P6 = any(True for a in attempts if (a.get("event") or "").startswith("stagnation")) or state.get("stagnation", 0) > 0

out = {
    "experiment": "E-Q32",
    "done": state["done"],
    "itinerary": [s["id"] for s in stations],
    "family_sequence": [s["family"] for s in stations],
    "stations_to_coverage": stations_to_coverage,
    "comparisons": {"walk_eq24": 5, "centroid_gate_eq28": 6, "retrieval_gate_eq32": stations_to_coverage},
    "attempts_total": len(attempts),
    "accepted": len([a for a in attempts if a["verdict"] == "accept"]),
    "rejected": len([a for a in attempts if a["verdict"] == "reject"]),
    "acceptance_rate": acceptance_rate,
    "rejection_anatomy": rejection_anatomy,
    "cross_model_retrieval_agreement": {"family": fam_agreement_rate, "record": rec_agreement_rate},
    "heredity": {"per_note": [round(h, 4) for h in heredity], "mean": round(mean_heredity, 4)},
    "decoupling_delta": {"rate_on_rejections": decoupling_delta_rate, "rejections": rejections},
    "directive_causality": {"mean_named_move": round(mean_named, 4), "mean_unnamed_move": round(mean_unnamed, 4)},
    "embed_calls": 9,
    "hypotheses": {"H1_coverage": H1, "H2_agreement": H2, "H3_heredity": H3, "C30": C30},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4, "P5": P5, "P6": P6},
}
(HERE / "eq32_results.json").write_text(json.dumps(out, indent=1))
print(f"[e-q32] stations to coverage: {stations_to_coverage} (walk 5, centroid gate 6)")
print(f"[e-q32] attempts {len(attempts)} | acceptance {acceptance_rate:.2f} | anatomy {rejection_anatomy}")
print(f"[e-q32] cross-model retrieval agreement: family {fam_agreement_rate:.2f}, record {rec_agreement_rate:.2f}")
print(f"[e-q32] heredity mean {mean_heredity:.4f} | decoupling delta on rejections {decoupling_delta_rate}")
print(f"[e-q32] directive causality: named {mean_named:.4f} vs unnamed {mean_unnamed:.4f}")
print(f"[e-q32] H1={H1} H2={H2} H3={H3} C30={C30} | P1..P6: {P1} {P2} {P3} {P4} {P5} {P6}")
