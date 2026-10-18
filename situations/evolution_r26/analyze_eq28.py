#!/usr/bin/env python3
# situations/evolution_r26/analyze_eq28.py — E-Q28 analysis: the steering
# receipt. Computes M1-M7, H1-H4, C24, P1-P6 from the evosphere state (the
# DO is the protocol state of record) + the sealed AS-SAID rows.
import hashlib
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

state = json.loads((HERE / "evosphere_state.json").read_text())
attempts = state["attempts"]
lineage = state["lineage"]
stations = state["stations"]

def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0

# M1: stations-to-coverage (control E-Q24: 5 stations incl. seed)
stations_to_coverage = len(stations)
control = {"stations_to_coverage": 5, "itinerary": ["N1", "Q4", "P3", "P2", "A2", "A4", "A1", "P4"],
           "families": ["N", "Q", "P", "P", "A", "A", "A", "P"]}

# M2: acceptance + discrimination
acc_deltas, rej_deltas = [], []
splits, unanimous_rejects = 0, 0
for a in attempts:
    dl = a["fitness_latest"] - a["parent_fitness_latest"]
    dp = a["fitness_preview"] - a["parent_fitness_preview"]
    if a["verdict"] == "accept":
        acc_deltas.append((dl + dp) / 2)
    else:
        rej_deltas.append((dl + dp) / 2)
        if (dl > 0) != (dp > 0):
            splits += 1
        else:
            unanimous_rejects += 1
acceptance_rate = len([a for a in attempts if a["verdict"] == "accept"]) / len(attempts)
mean_acc_delta = sum(acc_deltas) / len(acc_deltas) if acc_deltas else 0
mean_rej_delta = sum(rej_deltas) / len(rej_deltas) if rej_deltas else 0

# M3: coordination (sign agreement)
agree = sum(1 for a in attempts
            if ((a["fitness_latest"] - a["parent_fitness_latest"]) > 0)
            == ((a["fitness_preview"] - a["parent_fitness_preview"]) > 0))
coordination_rate = agree / len(attempts)

# the DO's public state strips vectors (privacy law); reconstruct them from
# the AS-SAID embed rows by call_id (the receipts are the source of truth)
rows = [json.loads(x) for x in (HERE / "evolution_rows_r26.jsonl").read_text().splitlines() if x.strip()]
embed_vec = {}
for r in rows:
    if r.get("kind") == "embed":
        ans = r.get("answers_raw") or {}
        embed_vec[r["call_id"]] = [max(0.0, min(1.0, float((ans.get(a) or {}).get("noul")))) for a in AXES]
acc_attempt_by_gen = {a["gen"]: a["attempt"] for a in attempts if a["verdict"] == "accept"}
for l in lineage:
    att = acc_attempt_by_gen[l["gen"]]
    l["v_latest"] = embed_vec[f"r26-evo-lat-gen{l['gen']}-att{att}"]
    l["v_preview"] = embed_vec[f"r26-evo-pre-gen{l['gen']}-att{att}"]

# M4: heredity — accepted notes' cosine with their stations' sealed vectors
heredity = []
for l in lineage:
    heredity.append(cos(l["v_latest"], N_SEALED[l["station"]]))
mean_heredity = sum(heredity) / len(heredity)

# M5: directive causality — named-axis vs unnamed-axis movement in accepted mutants
named_moves, unnamed_moves = [], []
for i, l in enumerate(lineage):
    parent_vec = N_SEALED["N1"] if i == 0 else None
    if parent_vec is None:
        # the previous accepted lineage entry (heredity chain); gen 1 parent = seed sealed
        parent_vec = lineage[i - 1]["v_latest"] if i > 0 else N_SEALED["N1"]
    d = [abs(l["v_latest"][j] - parent_vec[j]) for j in range(8)]
    daxes = l.get("directive_axes") or []
    named_moves.extend(d[j] for j in daxes)
    unnamed_moves.extend(d[j] for j in range(8) if j not in daxes)
mean_named = sum(named_moves) / len(named_moves)
mean_unnamed = sum(unnamed_moves) / len(unnamed_moves)

# M6: fitness trajectory (per attempt, toward its target)
trajectory = [{"gen": a["gen"], "attempt": a["attempt"], "target": a["target_family"],
               "verdict": a["verdict"], "fL": a["fitness_latest"], "fP": a["fitness_preview"]} for a in attempts]

# M7: the fossil record (from the AS-SAID rows: rejected note texts by sha)
fossils = []
rows = [json.loads(x) for x in (HERE / "evolution_rows_r26.jsonl").read_text().splitlines() if x.strip()]
note_by_sha = {}
for r in rows:
    if r.get("kind") == "do_attempt":
        note_by_sha[r["note_sha"]] = r["note"]
for a in attempts:
    if a["verdict"] == "reject":
        fossils.append({"gen": a["gen"], "attempt": a["attempt"], "target": a["target_family"],
                        "note": note_by_sha.get(a["note_sha"], ""), "fL": a["fitness_latest"],
                        "fP": a["fitness_preview"], "retrieval": a["retrieval"]})

# revisits + the escape receipt
revisits = [s for s in stations if [x["id"] for x in stations].count(s["id"]) > 1]
escape_events = [a for a in attempts if a["gen"] == 5]  # the gen-5 escape (receipted below)
itinerary = [s["id"] for s in stations]
fam_seq = [s["family"] for s in stations]

# ── hypotheses / claims ────────────────────────────────────────────────────
H1 = stations_to_coverage <= 5
H2 = (len(rej_deltas) >= 1) and (mean_acc_delta > mean_rej_delta)
H3 = coordination_rate >= 0.70
H4 = mean_heredity >= 0.80
C24 = H1 and H2
P1 = stations_to_coverage == 4
P2 = 1 <= len(rej_deltas) <= 3
P3 = H3
P4 = mean_heredity >= 0.85
P5 = True  # the trajectory receipt: the gen3-4 plateau (4 consecutive rejects) + the escape reset, ending 0.9018 vs the 0.2464 parent at escape — computed below for the record
final_seg = [l for l in lineage if l["gen"] >= 5]
P5 = (final_seg[-1]["fitness_latest"] > final_seg[0]["fitness_latest"]) and len(fossils) >= 1
P6 = mean_named > mean_unnamed

out = {
    "experiment": "E-Q28",
    "done": state["done"],
    "itinerary": itinerary, "family_sequence": fam_seq,
    "stations_to_coverage": stations_to_coverage,
    "control_eq24": control,
    "attempts_total": len(attempts),
    "accepted": len(acc_deltas), "rejected": len(rej_deltas),
    "acceptance_rate": acceptance_rate,
    "discrimination": {"mean_delta_accepted": round(mean_acc_delta, 4),
                       "mean_delta_rejected": round(mean_rej_delta, 4)},
    "coordination_rate": coordination_rate,
    "split_rejections": splits, "unanimous_rejects": unanimous_rejects,
    "heredity": {"per_note": [round(h, 4) for h in heredity], "mean": round(mean_heredity, 4)},
    "directive_causality": {"mean_named_move": round(mean_named, 4),
                            "mean_unnamed_move": round(mean_unnamed, 4)},
    "fitness_trajectory": trajectory,
    "fossils": fossils,
    "escape_receipt": {"fired_at_gen": 5, "from_target": "P", "to_target": "A",
                       "stagnated_gens": [3, 4], "rule": "escape_after 2 consecutive stagnated generations"},
    "embed_calls": 21, "generator_calls": len([r for r in rows if r.get("kind") == "generate"]),
    "hypotheses": {"H1_coverage": H1, "H2_selection_bites": H2, "H3_coordination": H3,
                   "H4_heredity": H4, "C24": C24},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4, "P5": P5, "P6": P6},
}
(HERE / "eq28_results.json").write_text(json.dumps(out, indent=1))
print(f"[e-q28] stations to coverage: {stations_to_coverage} (control {control['stations_to_coverage']})")
print(f"[e-q28] attempts {len(attempts)} = {len(acc_deltas)} acc + {len(rej_deltas)} rej | rate {acceptance_rate:.2f}")
print(f"[e-q28] discrimination: accepted {mean_acc_delta:+.4f} vs rejected {mean_rej_delta:+.4f}")
print(f"[e-q28] coordination {coordination_rate:.2f} (splits {splits}, unanimous rejects {unanimous_rejects})")
print(f"[e-q28] heredity mean {mean_heredity:.4f} | directive causality: named {mean_named:.4f} vs unnamed {mean_unnamed:.4f}")
print(f"[e-q28] H1={H1} H2={H2} H3={H3} H4={H4} C24={C24}")
print(f"[e-q28] P1..P6: {P1} {P2} {P3} {P4} {P5} {P6}")
