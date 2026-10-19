#!/usr/bin/env python3
# situations/embedding_r30/eq40_analysis.py — E-Q40: the lexical-sensitivity
# census analysis. Movement per (record, word) vs the sealed r28 E-Q38 baseline
# (primary) and the sealed r24 E-Q22 vectors (secondary); the registered
# measures M1-M7, hypotheses H1-H3, claim C38, predictions P1-P6.
import json
import pathlib
import statistics

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
R24 = ROOT / "situations" / "embedding_r24"
R28 = ROOT / "situations" / "embedding_r28"

AXES = ["P1_nonlocal", "P2_localrule", "P3_quantum", "P4_alloc", "P5_repair", "P6_null", "P7_econ", "P8_exact"]
DECOYS = ["D1_far_marine", "D2_far_painting", "D3_near_bio", "D4_near_price"]

# the sealed r24 baseline (E-Q22)
EQ22 = json.loads((R24 / "eval_eq22_results.json").read_text())
N_r24 = EQ22["vectors"]["N"]

# the sealed r28 baseline (E-Q38)
N_r28 = {}
for line in (R28 / "eq38_rows_r28.jsonl").read_text().splitlines():
    if not line.strip():
        continue
    r = json.loads(line)
    ans = r.get("answers_raw") or {}
    N_r28[r["record_id"]] = [max(0.0, min(1.0, float((ans.get(ax) or {}).get("noul")))) for ax in AXES]
assert len(N_r28) == 20

rows = [json.loads(l) for l in (HERE / "eq40_rows_r30.jsonl").read_text().splitlines() if l.strip()]
anchors = [r for r in rows if r["task"] == "eq40-anchor"]
subs = [r for r in rows if r["task"] == "eq40-subst"]
assert len(anchors) == 4 and len(subs) == 120, f"row counts: {len(anchors)} anchors, {len(subs)} substitutions"
served = {r["model_served"] for r in rows}
assert served == {"jev-1.13.0"}, f"model_served set: {served}"
for r in rows:
    assert r["http_status"] == 200, f"non-200 row: {r['call_id']}"
    ans = r["answers_raw"]
    assert set(ans.keys()) == set(AXES + DECOYS), f"answer keys incomplete: {r['call_id']}"


def vec(r):
    ans = r["answers_raw"]
    return [max(0.0, min(1.0, float((ans.get(ax) or {}).get("noul")))) for ax in AXES]


def decoy_vec(r):
    ans = r["answers_raw"]
    return [max(0.0, min(1.0, float((ans.get(dx) or {}).get("noul")))) for dx in DECOYS]


def spearman(a, b):
    ra = {v: i for i, v in enumerate(sorted(range(len(a)), key=lambda i: a[i]))}
    rb = {v: i for i, v in enumerate(sorted(range(len(b)), key=lambda i: b[i]))}
    # average ranks for ties
    def ranks(x):
        out = [0.0] * len(x)
        i = 0
        while i < len(x):
            j = i
            while j + 1 < len(x) and x[j + 1] == x[i]:
                j += 1
            avg = (i + j) / 2 + 1
            for k in range(i, j + 1):
                out[sorted(range(len(x)), key=lambda i: x[i])[k]] = avg
            i = j + 1
        return out
    rx, ry = ranks(a), ranks(b)
    mx, my = statistics.mean(rx), statistics.mean(ry)
    num = sum((x - mx) * (y - my) for x, y in zip(rx, ry))
    den = (sum((x - mx) ** 2 for x in rx) * sum((y - my) ** 2 for y in ry)) ** 0.5
    return num / den if den else 1.0


# ── F4: the anchors ─────────────────────────────────────────────────────────
anchor_rows = []
for r in anchors:
    v = vec(r)
    base = N_r28[r["record_id"]]
    mx = max(round(abs(a - b), 2) for a, b in zip(v, base))  # AM5 grid-quantized
    anchor_rows.append({"record": r["record_id"], "max_vs_r28": round(mx, 4)})
F4 = all(a["max_vs_r28"] <= 0.10 for a in anchor_rows)
print(f"[F4 anchors] {anchor_rows} -> {'PASS' if F4 else 'FAIL'}")

# ── M1: per-word movement ───────────────────────────────────────────────────
per_word = []
for r in subs:
    rid = r["record_id"]
    v = vec(r)
    # AM5: both operands are 2-decimal quantized by the API; raw float subtraction
    # injects 1e-17 noise the instrument cannot resolve (the E-Q31 artifact class,
    # caught here at TWO boundaries on the first unsealed run: the 0.10 band edge
    # and the H3 median comparison). Quantized BEFORE every comparison; the fix
    # kills a spurious H3 LIVES (NOUN-vs-VERB median ordering existed only at
    # 8e-17) — the receipt that it is not outcome-motivated.
    d28 = [round(abs(v[i] - N_r28[rid][i]), 2) for i in range(8)]
    d24 = [round(abs(v[i] - N_r24[rid][i]), 2) for i in range(8)]
    sp = spearman(v, N_r28[rid])
    argmax_axis = AXES[max(range(8), key=lambda i: d28[i])]
    per_word.append({
        "record": rid, "family": r["family"], "word": r["word"], "substitute": r["substitute"],
        "pos": r["pos"], "occurrences": r["occurrences"],
        "echo_orig": r["echo_orig"], "echo_axes_orig": r["echo_axes_orig"],
        "echo_sub": r["echo_sub"], "echo_axes_sub": r["echo_axes_sub"],
        "max_vs_r28": max(d28), "max_vs_r24": max(d24),
        "per_axis_d28": [round(x, 4) for x in d28],
        "argmax_axis": argmax_axis,
        "spearman_shape": sp,
        "mean_axis_d28": statistics.mean(d28),
    })

BAND = 0.10
breaches = [w for w in per_word if w["max_vs_r28"] > BAND]
breach_rate = len(breaches) / len(per_word)

# ── M2: concentration ───────────────────────────────────────────────────────
mass = sorted((w["max_vs_r28"] for w in per_word), reverse=True)
total_mass = sum(mass)
top20_n = max(1, len(mass) // 5)
top20_share = sum(mass[:top20_n]) / total_mass

# ── H1 ──────────────────────────────────────────────────────────────────────
H1_a = breach_rate < 0.30
H1_b = top20_share >= 0.50
H1 = H1_a and H1_b

# ── M3 + H2: the echo contrast ──────────────────────────────────────────────
echo_w = [w for w in per_word if w["echo_orig"]]
nonecho_w = [w for w in per_word if not w["echo_orig"]]
echo_breaches = [w for w in echo_w if w["max_vs_r28"] > BAND]
nonecho_breaches = [w for w in nonecho_w if w["max_vs_r28"] > BAND]
ebr = len(echo_breaches) / len(echo_w)
nbr = len(nonecho_breaches) / len(nonecho_w)
H2_rate = ebr >= 2 * nbr
H2_count = len(echo_breaches) >= 3
H2 = H2_rate and H2_count

# ── M4 + H3: the POS gradient ───────────────────────────────────────────────
def med(cls):
    vals = [w["max_vs_r28"] for w in per_word if w["pos"] == cls]
    return statistics.median(vals) if vals else None
pos_med = {c: med(c) for c in ("NOUN", "VERB", "IDENT", "ADJ", "NUM", "ADP")}
pos_means = {c: statistics.mean([w["max_vs_r28"] for w in per_word if w["pos"] == c])
             for c in ("NOUN", "VERB", "IDENT", "ADJ") if any(w["pos"] == c for w in per_word)}
H3 = pos_med["NOUN"] > pos_med["VERB"] > pos_med["IDENT"]

# ── M5: axis targeting among echo breaches ───────────────────────────────────
targeted = [w for w in echo_breaches if w["argmax_axis"] in w["echo_axes_orig"]]
P6 = (len(targeted) / len(echo_breaches) >= 0.60) if echo_breaches else False

# ── M6: the decoy floor under substitutions ─────────────────────────────────
floor_vals = [v for r in subs for v in decoy_vec(r)]
decoy_floor = {"mean": statistics.mean(floor_vals), "max": max(floor_vals), "n": len(floor_vals)}
P3 = decoy_floor["mean"] <= 0.05

# ── M7 + predictions ────────────────────────────────────────────────────────
shapes = [w["spearman_shape"] for w in per_word]
med_shape = statistics.median(shapes)
P4 = med_shape >= 0.95
max_move = max(w["max_vs_r28"] for w in per_word)
P1 = max_move >= 0.15
axis_mean_move = {AXES[i]: statistics.mean(w["per_axis_d28"][i] for w in per_word) for i in range(8)}
most_moved_axis = max(axis_mean_move, key=axis_mean_move.get)
P2 = most_moved_axis in ("P8_exact", "P6_null")
P5 = pos_med["IDENT"] == min(pos_med[c] for c in ("NOUN", "VERB", "IDENT"))

C38 = H1 and H2

# ── the report ──────────────────────────────────────────────────────────────
top10 = sorted(per_word, key=lambda w: -w["max_vs_r28"])[:12]
print("\n[E-Q40] THE LEXICAL-SENSITIVITY CENSUS — verdicts vs the sealed r28 baseline")
print(f"  movement: max {max_move:.4f}  median {statistics.median(mass):.4f}  mean {statistics.mean(mass):.4f}")
print(f"  breaches (>0.10): {len(breaches)}/120 = {breach_rate:.1%}")
print(f"  top-20% share of movement mass: {top20_share:.1%}")
print(f"  H1 few-words: {H1} (rate<30%: {H1_a}; top20>=50%: {H1_b})")
print(f"  echo breach rate {ebr:.1%} ({len(echo_breaches)}/{len(echo_w)}) vs non-echo {nbr:.1%} ({len(nonecho_breaches)}/{len(nonecho_w)})")
print(f"  echo median {statistics.median([w['max_vs_r28'] for w in echo_w]):.4f} vs non-echo median {statistics.median([w['max_vs_r28'] for w in nonecho_w]):.4f}")
print(f"  H2 echo: {H2} (rate>=2x: {H2_rate}; count>=3: {H2_count})")
print(f"  POS medians: { {k: (round(v,4) if v is not None else None) for k,v in pos_med.items()} }")
print(f"  H3 gradient NOUN>VERB>IDENT: {H3}")
print(f"  C38 = H1 AND H2: {C38}")
print(f"  P1 max>=0.15: {P1} ({max_move:.4f}) | P2 most-moved axis in {{P8,P6}}: {P2} ({most_moved_axis})")
print(f"  P3 decoy floor<=0.05: {P3} (mean {decoy_floor['mean']:.4f}) | P4 median shape>=0.95: {P4} ({med_shape:.4f})")
print(f"  P5 IDENT lowest median: {P5} | P6 echo-breaches targeted >=60%: {P6} ({len(targeted)}/{len(echo_breaches)})")
print("\n  TOP MOVERS:")
for w in top10:
    print(f"    {w['record']:3s} {w['word']:20s}->{w['substitute']:20s} {w['pos']:5s} echo={str(w['echo_orig']):5s} "
          f"max={w['max_vs_r28']:.4f} argmax={w['argmax_axis']:12s} shape={w['spearman_shape']:.3f}")
print("\n  AXIS mean movement:", {k.split('_')[0]: round(v, 4) for k, v in sorted(axis_mean_move.items(), key=lambda kv: -kv[1])})

# per-family means
fam = {}
for w in per_word:
    fam.setdefault(w["family"], []).append(w["max_vs_r28"])
print("  per-family mean movement:", {k: round(statistics.mean(v), 4) for k, v in sorted(fam.items())})

# secondary baseline (r24) headline
b24 = [w for w in per_word if w["max_vs_r24"] > BAND]
print(f"  [secondary vs r24] breaches {len(b24)}/120; max {max(w['max_vs_r24'] for w in per_word):.4f}")

out = {
    "experiment": "E-Q40",
    "models_served": sorted(served),
    "calls": {"canary": 1, "anchors": 4, "substitutions": 120},
    "anchors": anchor_rows, "F4_anchor_band": F4,
    "movement": {"max": max_move, "median": statistics.median(mass), "mean": statistics.mean(mass),
                 "breaches": len(breaches), "breach_rate": breach_rate, "band": BAND},
    "concentration": {"top20_share": top20_share, "top20_n": top20_n, "total_mass": total_mass},
    "echo": {"n_echo": len(echo_w), "n_nonecho": len(nonecho_w),
             "echo_breaches": len(echo_breaches), "echo_breach_rate": ebr,
             "nonecho_breaches": len(nonecho_breaches), "nonecho_breach_rate": nbr,
             "echo_median": statistics.median([w["max_vs_r28"] for w in echo_w]),
             "nonecho_median": statistics.median([w["max_vs_r28"] for w in nonecho_w]),
             "echo_mean": statistics.mean([w["max_vs_r28"] for w in echo_w]),
             "nonecho_mean": statistics.mean([w["max_vs_r28"] for w in nonecho_w])},
    "pos": {"medians": pos_med, "means": pos_means,
            "counts": {c: sum(1 for w in per_word if w["pos"] == c) for c in pos_med}},
    "targeting": {"echo_breaches_targeted": len(targeted), "echo_breaches_total": len(echo_breaches), "P6": P6},
    "decoy_floor": decoy_floor,
    "shape": {"median_spearman": med_shape, "min": min(shapes), "p10": sorted(shapes)[11]},
    "axis_mean_movement": axis_mean_move, "most_moved_axis": most_moved_axis,
    "per_family_mean": {k: statistics.mean(v) for k, v in fam.items()},
    "secondary_vs_r24": {"breaches": len(b24), "max": max(w["max_vs_r24"] for w in per_word)},
    "hypotheses": {"H1_few_words": H1, "H1_rate": H1_a, "H1_concentration": H1_b,
                   "H2_echo": H2, "H2_rate": H2_rate, "H2_count": H2_count,
                   "H3_pos_gradient": H3, "C38": C38},
    "predictions": {"P1": P1, "P2": P2, "P3": P3, "P4": P4, "P5": P5, "P6": P6},
    "top_movers": [{k: w[k] for k in ("record", "word", "substitute", "pos", "echo_orig", "max_vs_r28", "argmax_axis", "spearman_shape")} for w in top10],
    "per_word": per_word,
}
(HERE / "eq40_results.json").write_text(json.dumps(out, indent=1))
print("\n[eq40] wrote eq40_results.json")
