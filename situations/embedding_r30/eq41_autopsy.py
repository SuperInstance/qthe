#!/usr/bin/env python3
# situations/embedding_r30/eq41_autopsy.py — E-Q41 mechanism autopsy (the
# E-Q39 pattern: the death's causal story, sealed as its own row). ZERO new
# calls — pure arithmetic on the sealed eq41_results.json + the sealed eq36
# vectors. THE TIE-DEGENERACY MECHANISM: why the ladder died and what the
# local!=live disagreement (P4) actually is.
import itertools
import json
import pathlib
import statistics

HERE = pathlib.Path(__file__).resolve().parent
R28 = HERE.parent / "embedding_r28" if (HERE.parent / "embedding_r28").exists() else HERE.parent.parent / "embedding_r28"

e41 = json.loads((HERE / "eq41_results.json").read_text())
corpus = json.loads((R28 / "corpus_at_scale.json").read_text())
FAMILY = {r["id"]: r["family"] for r in corpus["records"]}
IDS = [r["id"] for r in corpus["records"]]
AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]

rows = [json.loads(l) for l in (R28 / "eq36_rows_r28.jsonl").read_text().splitlines() if l.strip()]
base = {r["record_id"]: r for r in rows if not r["call_id"].endswith("-stab")}
V = {rid: [float((base[rid]["answers_raw"].get(ax) or {}).get("noul")) for ax in AXES] for rid in base}
VQ = e41["vectors_quantized"]


def cos(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return dot / (na * nb) if na and nb else 0.0


# ── the tie table: top-1 score ties and the adversarial bracket ─────────────
tie_table = {}
for name, vecs in (("dense", V), ("binary", VQ["binary"]), ("ternary", VQ["ternary"]), ("quad", VQ["quad"])):
    n_tied = 0
    best = worst = 0
    for rid in IDS:
        scores = {r2: round(cos(vecs[rid], vecs[r2]), 12) for r2 in IDS if r2 != rid}
        mx = max(scores.values())
        tied = [r2 for r2 in scores if scores[r2] == mx]
        if len(tied) > 1:
            n_tied += 1
        fams = [FAMILY[r2] for r2 in tied]
        if FAMILY[rid] in fams:
            best += 1
            worst += 1 if all(f == FAMILY[rid] for f in fams) else 0
    tie_table[name] = {"top1_ties": n_tied, "n": 60,
                       "bracket_optimistic": best / 60.0, "bracket_pessimistic": worst / 60.0}
    print(f"[tie] {name:8s}: top-1 ties {n_tied}/60; bracket [{worst/60.0:.3f}, {best/60.0:.3f}]")

# ── the separation table (mean within- vs cross-family cosine per arm) ──────
def sep(vectors):
    ids = sorted(vectors)
    within, cross = [], []
    for a, b in itertools.combinations(ids, 2):
        s = cos(vectors[a], vectors[b])
        (within if FAMILY[a] == FAMILY[b] else cross).append(s)
    return {"within": statistics.mean(within), "cross": statistics.mean(cross),
            "separation": statistics.mean(within) - statistics.mean(cross)}


separation = {name: sep(vecs) for name, vecs in (("dense", V), ("binary", VQ["binary"]),
                                                 ("ternary", VQ["ternary"]), ("quad", VQ["quad"]))}
for k, v in separation.items():
    print(f"[sep] {k:8s}: within {v['within']:.4f} cross {v['cross']:.4f} sep {v['separation']:.4f}")

# ── the miss-set overlaps ────────────────────────────────────────────────────
bm = {tuple(m) for m in e41["arms"]["binary"]["live_misses"]}
tm = {tuple(m) for m in e41["arms"]["ternary"]["live_misses"]}
qm = {tuple(m) for m in e41["arms"]["quad"]["live_misses"]}
e36 = json.loads((R28 / "eq36_results.json").read_text())
dm = {tuple(m) for m in e36["live"]["full8"]["misses"]}
overlaps = {"binary_ternary": len(bm & tm), "quad_dense": len(qm & dm),
            "quad_dense_both_n": (len(qm), len(dm))}
print(f"[miss] binary^ternary overlap {len(bm & tm)}; quad^dense overlap {len(qm & dm)} (both {len(qm)}/{len(dm)})")

# ── the zeroed-axes null (the simple account, tested and FALSIFIED) ─────────
nz = lambda rid: sum(1 for x in VQ["ternary"][rid] if x == 0.0)
tmbh = {m[0] for m in (tm - bm)}
bmth = {m[0] for m in (bm - tm)}
zeroed_axes = {"mean_all": statistics.mean(nz(r) for r in IDS),
               "mean_ternary_miss_binary_hit": statistics.mean(nz(r) for r in tmbh),
               "mean_binary_miss_ternary_hit": statistics.mean(nz(r) for r in bmth)}
print(f"[zeroed] all {zeroed_axes['mean_all']:.3f} | ternary-only-miss {zeroed_axes['mean_ternary_miss_binary_hit']:.3f} | binary-only-miss {zeroed_axes['mean_binary_miss_ternary_hit']:.3f}")

finding = ("THE TIE-DEGENERACY MECHANISM: the coarse codes' strict top-1 accuracies at 60 records are "
           "TIE-ORDER-DEPENDENT — binary has a top-1 score tie on 32/60 records (bracket [0.467, 0.733]), "
           "ternary on 15/60 (bracket [0.533, 0.633]), quad on 0/60 (bracket [0.733, 0.733] — degenerate, "
           "convention-free). The live readings (0.617 / 0.567 / 0.733) sit inside their brackets; the "
           "local-vs-live disagreements (P4's death) live exactly on the tie-degenerate arms and vanish on "
           "the tie-free arm — the E-Q30 local==live law is refined to: local==live IFF the code is tie-free "
           "at the operating scale. The mean-separation account is FALSIFIED as the ladder's explanation: "
           "ternary's separation (0.312) BEATS binary's (0.226) while its strict accuracy loses — mean "
           "separation is not the top-1 operator. The zeroed-axes account is likewise falsified (ternary-only "
           "misses average 1.9 zeroed axes vs binary-only 2.0 vs 1.7 overall — no material difference). The "
           "inversion receipt: the ternary zero's +0.20 margin at n=20 is gone at n=60 (point estimate -0.05, "
           "inside the overlapping tie brackets — the operative law is the margin's DEATH, not the sign of its "
           "ash). THE 4-LEVEL CODE IS THE SCALE-ROBUST RECEIPT: tie-free at 60 records, lossless in count vs "
           "dense (0.733 == 0.7333; the miss SETS reshuffle — only 2/16 shared — but the count is the "
           "invariant), and the dense arm itself replicated EXACTLY across sessions (delta 0.0000).")

out = {"experiment": "E-Q41-autopsy", "tie_table": tie_table, "separation": separation,
       "miss_overlaps": overlaps, "zeroed_axes": zeroed_axes, "the_finding": finding}
(HERE / "eq41_autopsy.json").write_text(json.dumps(out, indent=1))
print("\n[eq41-autopsy] wrote eq41_autopsy.json")
print(f"[eq41-autopsy] {finding}")
