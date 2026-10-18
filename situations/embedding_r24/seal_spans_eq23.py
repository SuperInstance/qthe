#!/usr/bin/env python3
# situations/embedding_r24/seal_spans_eq23.py — E-Q23 lane T15-c: the
# DETERMINISTIC span split, sealed BEFORE any occlusion call (F2).
# Rule (pre_registration_e_q23.json): split each record's text on sentence
# boundaries ('.' followed by space or end), then merge any span shorter
# than 30 chars into the PREVIOUS span (a leading short span merges
# FORWARD). Output: spans.json — the sealed occlusion units.
import hashlib
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
R23 = HERE.parent / "embedding_r23"
corpus = json.loads((R23 / "corpus.json").read_text())
records = corpus["records"]

SUBSET = ["N1", "N3", "P1", "P3", "Q1", "Q3", "A1", "A3"]  # frozen rule: first + third by id order per family

def split_sentences(text):
    # deterministic: '.' followed by whitespace-or-end is a boundary
    parts = re.split(r"(?<=[.])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]

def merge_short(spans, min_chars=30):
    out = []
    for s in spans:
        if out and len(s) < min_chars:
            out[-1] = out[-1] + " " + s
        elif not out and len(s) < min_chars:
            out.append(s)  # leading short span stays (merges forward with the next)
            # per the frozen rule: a leading short span merges FORWARD —
            # implement by deferring: keep as pending
            pending = True
        else:
            if out and len(out[-1]) < min_chars:
                out[-1] = out[-1] + " " + s
            else:
                out.append(s)
    # final pass: any trailing short span has already been merged; re-check
    merged = []
    for s in out:
        if merged and len(s) < min_chars:
            merged[-1] = merged[-1] + " " + s
        else:
            merged.append(s)
    return merged

spans = {}
for rec in records:
    if rec["id"] in SUBSET:
        spans[rec["id"]] = merge_short(split_sentences(rec["text"]))

out = {"subset_rule": "first + third by id order within each family (frozen in pre_registration_e_q23.json)",
       "splitter": "re.split(r'(?<=[.])\\s+') on stripped text; spans < 30 chars merge into the PREVIOUS span (leading/trailing short spans merge forward/backward on re-check)",
       "families": {rec["id"]: rec["family"] for rec in records if rec["id"] in SUBSET},
       "spans": spans}
blob = json.dumps(out, sort_keys=True)
sha = hashlib.sha256(blob.encode("utf-8")).hexdigest()
out["spans_sha256"] = sha
(HERE / "spans_eq23.json").write_text(json.dumps(out, indent=1))
print(f"[spans] sealed sha {sha[:16]}…")
for rid in SUBSET:
    print(f"  {rid} ({out['families'][rid]}): {len(spans[rid])} spans, lens {[len(s) for s in spans[rid]]}")
