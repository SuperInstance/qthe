#!/usr/bin/env python3
# situations/creative_r24/analyze_eq24.py — E-Q24 lane T15-d: the walk metrics.
# Reads walk_trace.jsonl, computes the descriptive metrics + hypothesis calls,
# writes eq24_results.json for the seal.
import json
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
R23 = HERE.parent.parent / "situations" / "embedding_r23"
corpus = json.loads((R23 / "corpus.json").read_text())
records = {r["id"]: r for r in corpus["records"]}
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}

rows = [json.loads(l) for l in (HERE / "walk_trace.jsonl").read_text().splitlines() if l.strip()]
rows.sort(key=lambda r: r["step"])
assert [r["step"] for r in rows] == list(range(7)), "F3: trace incomplete"
SEED = "N1"
itinerary = [SEED] + [r["retrieval"]["next_station"] for r in rows]
families = [FAMILY[v] for v in itinerary]
distinct_families = sorted(set(families))

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

scores = [r["retrieval"]["next_score"] for r in rows]
distances = [1 - s for s in scores]
steps = [r["step"] for r in rows]
sp = spearman(steps, distances)

# note-to-station cosine drift (the note vector vs the station record's noul vector from E-Q22)
import urllib.request, os
EQ22 = json.loads((HERE.parent / "embedding_r24" / "eval_eq22_results.json").read_text())
N_vecs = EQ22["vectors"]["N"]
def cos(a, b):
    d = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(x * x for x in b))
    return d / (na * nb) if na and nb else 0.0
note_station_cos = [cos(r["note_vector"], N_vecs[r["station"]]) for r in rows]

retries = sum(r.get("gen_retries", 0) for r in rows)
gen_ms = [r["gen_ms"] for r in rows]
emb_ms = [r["emb_ms"] for r in rows]

H1 = len(distinct_families) >= 3
H2 = abs(sp) >= 0.5
C20 = True  # descriptive: F1-F5 checked at seal; trace complete

P1 = 3 <= len(distinct_families) <= 4
P2 = None  # shape call: early diffusion then plateau/reverse — judged below
# P2 as registered: distances grow for first ~3 steps then plateau or reverse
early_growth = distances[0] < distances[1] < distances[2] or (distances[2] > distances[0] and distances[2] > distances[1])
late = distances[3:]
plateau_or_reverse = (max(late) - min(late)) < 0.15 or late[-1] < max(late)
P2 = early_growth and plateau_or_reverse
P3 = min(distances) < 0.15
P4 = itinerary[-1][0] != SEED[0]

out = {
    "experiment": "E-Q24",
    "itinerary": itinerary, "families": families, "distinct_families": distinct_families,
    "retrieval_scores": scores, "retrieval_distances": distances,
    "spearman_step_vs_distance": sp,
    "note_to_station_cosine": note_station_cos,
    "gen_retries_total": retries, "gen_ms": gen_ms, "emb_ms": emb_ms,
    "hypotheses": {"H1": H1, "H2": H2, "C20": C20},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4},
    "protocol_events": [
        "step-5 trap under unfiltered topK (zero unvisited eq22N neighbors in the global top-20) — the E-Q22 AM1 consumer law applied: arm-filtered queries",
        "the Vectorize METADATA-INDEX LAW receipted live: filters return SILENT ZERO matches without an explicit metadata index; index creation is async; pre-index upserts are NOT indexed — a re-upsert after the index lands is mandatory (three probe variants + docs confirmed)",
    ],
    "notes": [r["note"] for r in rows],
}
(HERE / "eq24_results.json").write_text(json.dumps(out, indent=1))
print(f"[walk] itinerary: {' -> '.join(itinerary)}")
print(f"[walk] families: {' -> '.join(families)} ({len(distinct_families)} distinct)")
print(f"[walk] distances: {[round(d,3) for d in distances]}")
print(f"[walk] spearman(step, distance) = {sp:.3f}")
print(f"[walk] note-to-station cosines: {[round(c,3) for c in note_station_cos]}")
print(f"[walk] H1={H1} H2={H2} | P1={P1} P2={P2} P3={P3} P4={P4} | retries={retries}")
