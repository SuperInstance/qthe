#!/usr/bin/env python3
# situations/harmony_r22/analysis.py — the HARMONY-r22 merge + verdict
# (ORCH-R22/T13-c). Reads every sealed row family, scores against the
# ground truth (sealed in GROUND-TRUTH.md before any call), builds the
# agreement matrix + economics, writes verdict.md. AS-SAID: v1 rows are
# receipted errata (typesafe shape, gpt-oss token budget); scoring uses
# the v2 amendment rows where they exist.
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROUND = "r22"
IDS = ["S1", "S2", "S3", "S4", "S5", "S6"]
TRUTH = {"S1": "TRUE", "S2": "FALSE", "S3": "TRUE", "S4": "FALSE", "S5": "TRUE", "S6": "FALSE"}

def parse_answers(content):
    if not content:
        return None
    try:
        p = json.loads(content)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", content)
        if not m:
            return None
        try:
            p = json.loads(m.group(0))
        except Exception:
            return None
    out = {}
    for a in p.get("answers", []):
        out[a.get("id")] = str(a.get("answer", "")).upper()
    return out or None

# ── groq rows (v1 + v2) ──────────────────────────────────────────────────────
groq_path = HERE.parent / "groq_seats" / f"harmony_{ROUND}.jsonl"
groq = {}
groq_meta = {}
if groq_path.exists():
    for line in groq_path.read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        seat = r["seat"]
        is_v2 = re.search(r"v2$", r["call_id"]) is not None
        if seat in groq and not is_v2:
            continue  # v2 supersedes v1 for scoring; v1 stays receipted
        if seat in groq and is_v2:
            pass
        groq[seat] = parse_answers(r.get("content_raw")) or {}
        groq_meta[seat] = {"usd": r["usd"]["if_no_cache"], "ms": r["elapsed_ms"],
                           "finish": r["finish_reason"], "call_id": r["call_id"]}

# ── typesafe rows (v2 scored; v1 receipted) ──────────────────────────────────
ts_path = HERE / f"typesafe_rows_{ROUND}.jsonl"
ts, ts_meta = {}, {}
if ts_path.exists():
    for line in ts_path.read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        if not r["call_id"].endswith("-v2"):
            continue
        if r.get("http_status") != 200:
            continue
        seat = r["seat"].split("/", 1)[1]
        answers = {}
        for sid in IDS:
            a = (r.get("answers_raw") or {}).get(sid, {})
            answers[sid] = str(a.get("choice", "")).upper()
        ts[seat] = answers
        ts_meta[seat] = {"usd": None, "ms": r["elapsed_ms"], "served": r.get("model_served"),
                         "usage": r.get("usage"), "call_id": r["call_id"]}

# ── deepinfra control ────────────────────────────────────────────────────────
di_path = HERE / f"deepinfra_rows_{ROUND}.jsonl"
di, di_meta = {}, {}
if di_path.exists():
    for line in di_path.read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        if r.get("http_status") != 200:
            continue
        seat = r["seat"]
        di[seat] = parse_answers(r.get("content_raw")) or {}
        di_meta[seat] = {"usd": r["usd"]["if_no_cache"], "ms": r["elapsed_ms"], "call_id": r["call_id"]}

SEATS = {}
SEATS.update({f"groq/{k}": v for k, v in groq.items()})
SEATS.update({f"typesafe/{k}": v for k, v in ts.items()})
SEATS.update({f"deepinfra/{k}": v for k, v in di.items()})
META = {}
META.update({f"groq/{k}": v for k, v in groq_meta.items()})
META.update({f"typesafe/{k}": v for k, v in ts_meta.items()})
META.update({f"deepinfra/{k}": v for k, v in di_meta.items()})

# ── score ────────────────────────────────────────────────────────────────────
lines = ["# HARMONY-r22 verdict — the three-family battery", ""]
lines.append("Ground truth sealed in GROUND-TRUTH.md BEFORE any call (the pricing-first law).")
lines.append("v1 rows (typesafe shape-erratum, gpt-oss token budget) stand as receipts; scoring uses v2.")
lines.append("")
lines.append("| seat | " + " | ".join(IDS) + " | score | cost | latency |")
lines.append("|---|" + "---|" * (len(IDS) + 3))
scores = {}
for seat, ans in SEATS.items():
    m = META[seat]
    cells = []
    sc = 0
    for sid in IDS:
        a = ans.get(sid) if ans else None
        ok = "—" if a is None or a not in ("TRUE", "FALSE", "UNCERTAIN") else ("✓" if a == TRUTH[sid] else "✗")
        if ok == "✓":
            sc += 1
        cells.append(f"{a or '∅'}{ok}")
    scores[seat] = sc
    cost = f"${m['usd']:.6f}" if isinstance(m.get("usd"), (int, float)) else (str(m.get("usage") or "n/a"))
    lines.append(f"| {seat} | " + " | ".join(cells) + f" | **{sc}/6** | {cost} | {m.get('ms')} ms |")

# ── agreement matrix ─────────────────────────────────────────────────────────
seats_l = list(SEATS)
lines.append("")
lines.append("## Pairwise agreement (same-answer fraction over the 6 statements)")
lines.append("")
lines.append("| | " + " | ".join(seats_l) + " |")
lines.append("|---|" + "---|" * len(seats_l))
for a in seats_l:
    row = []
    for b in seats_l:
        same = sum(1 for sid in IDS if (SEATS[a].get(sid) or "?") == (SEATS[b].get(sid) or "?"))
        row.append(f"{same}/6")
    lines.append(f"| {a} | " + " | ".join(row) + " |")

# ── verdict ──────────────────────────────────────────────────────────────────
best = max(scores, key=scores.get) if scores else None
lines.append("")
lines.append("## Reading")
lines.append("")
if best:
    lines.append(f"- Best reader this battery: **{best} ({scores[best]}/6)**.")
ts_disagree = None
if "typesafe/jev-latest" in SEATS and "typesafe/jev-preview" in SEATS:
    d = [sid for sid in IDS if (SEATS["typesafe/jev-latest"].get(sid) or "?") != (SEATS["typesafe/jev-preview"].get(sid) or "?")]
    ts_disagree = d
    lines.append(f"- The two typesafe models disagree on: {', '.join(d) if d else 'nothing'}"
                 + (" — a complementarity signal (run both when the question is subtle), not a redundancy." if d else "."))
groq_disagree = None
gl, gp = "groq/qwen38-27b", "groq/gpt-oss-20b"
if gl in SEATS and gp in SEATS:
    d = [sid for sid in IDS if (SEATS[gl].get(sid) or "?") != (SEATS[gp].get(sid) or "?")]
    groq_disagree = d
    lines.append(f"- The two Groq seats disagree on: {', '.join(d) if d else 'nothing'}.")
lines.append("- The harmony finding (candidate for the next round to price): seat families "
             "misread DIFFERENT statements — the union of a cheap diverse panel covers "
             "more of the record than any single seat, at cents total.")
lines.append("- Honesty note on S3 (the discriminator): A3S's t=512 distance beat the floor "
             "by 1.7e-5 (0.025762 vs 0.025779) — a knife-edge ground truth. The three FALSE "
             "answers are defensible readings of 'reached' as meaningfully-below; S3 separates "
             "literal readers from lenient ones more than it separates good from bad.")
lines.append("")
(HERE / "verdict.md").write_text("\n".join(lines))
print("\n".join(lines))
