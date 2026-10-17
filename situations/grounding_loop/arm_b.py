#!/usr/bin/env python3
# situations/grounding_loop/arm_b.py -- ARM B: the code-grounded citation
# loop (the candidate). Per claim:
#   PASS 1 (mechanical, in code, no model): extract anchors from the claim
#     text -- 64-hex shas, repo-relative file paths, "row N of <chain>"
#     references, salient numbers (decimals with >=2 places, integers >=100)
#     -- and check them against the repository (repo-wide sha search, path
#     existence, chain row counts, number presence in the cited file's raw
#     text). Any failing anchor -> fabricated, NO Jev call, receipted
#     mechanically.
#   PASS 2 (Jev, grounded): claims whose anchors pass get ONE Choice
#     question over the LOCATED SECTION ONLY -- the actual cited-file
#     content windowed around the claim's best anchor, plus mechanical
#     prepass facts (path existence, row counts, number presence). The
#     judge sees the artifact, not a briefing. confidence < 0.8 ->
#     human_flag instead of a verdict.
#
# Grouping: claims citing the same file share one call (parallel-questions
# cookbook); claims citing no file share a prepass-facts-only state.
# 3 repeats for the Jev-decided subset. Mechanical rows are deterministic
# and sealed once. Ground truth is read ONLY to hash bytes for provenance.
#
# Locator priorities (all derived from the CLAIM TEXT, never from ground
# truth): hex anchor file > salient-number file > distinctive-token file >
# first cited existing file > head window.
import json
import pathlib
import re
import sys

import jev_client as jc

HERE = pathlib.Path(__file__).resolve().parent
REPO = jc.REPO
ROWS = HERE / "rows_arm_b.jsonl"
CLAIMS = json.loads((HERE / "claims.json").read_text(encoding="utf-8"))["claims"]
CLAIMS_SHA = jc.sha((HERE / "claims.json").read_text(encoding="utf-8"))
GT_SHA = jc.sha((HERE / "ground_truth.json").read_text(encoding="utf-8"))

WINDOW_BEFORE = 700
WINDOW_AFTER = 2900

SKIP_DIRS = {".git", "grounding_loop", "__pycache__", "node_modules"}

RE_HEX64 = re.compile(r"\b[0-9a-f]{64}\b")
# extensions longest-first so 'x.jsonl' is not truncated to 'x.json'
RE_PATH = re.compile(r"(?:[A-Za-z0-9_.\-]+/)+[A-Za-z0-9_.\-]+\.(?:sha256|jsonl|html|json|txt|mjs|py|js|md|c|h)")
RE_BARENAME = re.compile(r"(?<![\w/.\-])[A-Za-z0-9_.\-]+\.(?:sha256|jsonl|html|json|txt|mjs|py|js|md)(?![\w.])")
RE_ROWOF = re.compile(r"[Rr]ow (\d+) of ((?:[A-Za-z0-9_.\-]+/)+[A-Za-z0-9_.\-]+\.jsonl)")
# trailing (?![\w]) not (?![\w.]): a sentence-final number must still match
RE_DECIMAL = re.compile(r"(?<![\w.])\d+\.\d{2,}(?![\w])")
RE_BIGINT = re.compile(r"(?<![\w.])\d{3,}(?![\w])")

STOPWORDS = {
    "receipts", "receipt", "receipted", "verdict", "verdicts", "claim",
    "claims", "chain", "chains", "results", "reports", "reported", "records",
    "recorded", "experiments", "outputs", "scoreboard", "measured",
    "median", "mediancompletion", "prices", "priced", "prices", "pinned",
    "pins", "links", "rows", "carries", "file", "files", "seals", "sealed",
    "run", "running", "lives", "dies", "against", "every", "through",
    "including", "under", "with", "from", "into", "over", "down", "the",
    "and", "for", "all", "its", "this", "that", "bridge", "formation",
}


def repo_files():
    for p in REPO.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(REPO)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        yield rel, p


def repo_search(needle):
    hits = []
    for rel, p in repo_files():
        try:
            if needle in p.read_text(encoding="utf-8"):
                hits.append(str(rel))
        except (UnicodeDecodeError, OSError):
            continue
    return hits


def extract_anchors(text):
    hexes = RE_HEX64.findall(text)
    paths = []
    for m in RE_PATH.finditer(text):
        if m.group(0) not in paths:
            paths.append(m.group(0))
    barenames = []
    for m in RE_BARENAME.finditer(text):
        if m.group(0) not in paths and m.group(0) not in barenames:
            barenames.append(m.group(0))
    rowofs = [(int(m.group(1)), m.group(2)) for m in RE_ROWOF.finditer(text)]
    decimals = RE_DECIMAL.findall(text)
    bigints = [m.group(0) for m in RE_BIGINT.finditer(text)]
    tokens = []
    for tok in re.findall(r"[A-Za-z][A-Za-z0-9_\-]{6,}", text):
        low = tok.lower()
        if low in STOPWORDS or low.replace("-", "_") in STOPWORDS:
            continue
        if tok not in tokens:
            tokens.append(tok)
    return {"hexes": hexes, "paths": paths, "barenames": barenames,
            "rowofs": rowofs, "numbers": decimals + bigints, "tokens": tokens}


def cited_existing_files(paths, barenames):
    """Slash-paths must exist (repo-relative); bare names resolve at repo
    root only (e.g. SPEC.md). Non-existing bare names are ignored, not
    failed: only an explicit repo-relative path can be an invented_file."""
    out = []
    for p in paths:
        f = REPO / p
        if f.exists() and f.is_file():
            out.append(p)
    for b in barenames:
        if b not in [pathlib.Path(p).name for p in out]:
            f = REPO / b
            if f.exists() and f.is_file():
                out.append(b)
    return out


def mechanical_pass(claim):
    """Returns dict: anchors, checks, verdict ('pass' | 'fabricated'),
    failures[] with disproof receipts, mechanical facts lines."""
    a = extract_anchors(claim["text"])
    checks = []
    failures = []
    facts = []

    existing = cited_existing_files(a["paths"], a.get("barenames", []))
    missing = [p for p in a["paths"] if p not in existing]
    for p in missing:
        failures.append({
            "class": "invented_file",
            "detail": "cited path " + p + " does not exist in the repository",
        })
    if a["paths"]:
        facts.append("cited paths: " + "; ".join(
            p + (" (exists)" if p in existing else " (MISSING)") for p in a["paths"]))

    # row-count fact for EVERY cited chain file (not just explicit row refs)
    for p in existing:
        if p.endswith(".jsonl"):
            rows = [l for l in (REPO / p).read_text(encoding="utf-8").split("\n") if l.strip()]
            facts.append("row-count of " + p + " = " + str(len(rows)) + " (computed)")

    for h in a["hexes"]:
        hits = repo_search(h)
        if hits:
            facts.append("sha " + h[:12] + "... found in: " + ", ".join(hits[:4]))
        else:
            failures.append({
                "class": "sha_not_in_repo",
                "detail": "sha " + h + " appears nowhere in the repository "
                          "(repo-wide walk, " + str(sum(1 for _ in repo_files())) + " files)",
            })
            facts.append("sha " + h[:12] + "... NOT FOUND repo-wide")

    for n, f in a["rowofs"]:
        fp = REPO / f
        if fp.exists():
            rows = [l for l in fp.read_text(encoding="utf-8").split("\n") if l.strip()]
            if n > len(rows):
                failures.append({
                    "class": "row_id_out_of_range",
                    "detail": "row " + str(n) + " of " + f + " is out of range: the chain "
                              "carries " + str(len(rows)) + " rows",
                })
        # if the file is missing, invented_file already failed

    if existing and a["numbers"]:
        raws = {p: (REPO / p).read_text(encoding="utf-8") for p in existing}
        for num in a["numbers"]:
            found_in = [p for p, raw in raws.items() if num in raw]
            if found_in:
                facts.append("number " + num + " found in cited file(s): " + ", ".join(found_in))
            elif existing:
                failures.append({
                    "class": "number_not_in_output",
                    "detail": "number " + num + " appears in NONE of the cited existing file(s): "
                              + ", ".join(existing),
                })
                facts.append("number " + num + " NOT FOUND in cited file(s)")

    verdict = "fabricated" if failures else "pass"
    return {"anchors": a, "checks": checks, "failures": failures,
            "facts": facts, "verdict": verdict, "existing_files": existing}


def locate_section(claim, mech):
    """Window of the cited file around the claim's best anchor.
    Anchor priority (from the CLAIM TEXT only): hex in a cited file >
    salient number in a cited file > rarest distinctive token in a cited
    file > head of the first cited file."""
    a = mech["anchors"]
    existing = mech["existing_files"]
    if not existing:
        return None
    raws = {p: (REPO / p).read_text(encoding="utf-8") for p in existing}
    candidates = []  # (occurrence_count, kind_rank, kind, needle, path, idx)
    # hexes (naturally rare; rank 0)
    for h in a["hexes"]:
        for p, raw in raws.items():
            if h in raw:
                candidates.append((raw.count(h), 0, "hex", h[:16], p, raw.find(h)))
    # salient numbers (rank 1)
    for num in a["numbers"]:
        for p, raw in raws.items():
            if num in raw:
                candidates.append((raw.count(num), 1, "number", num, p, raw.find(num)))
    # distinctive tokens, hyphen/underscore tolerant (rank 2)
    for tok in a["tokens"]:
        variants = [tok, tok.replace("-", "_"), tok.replace("_", "-"),
                    tok.replace("-", ""), tok.replace("_", "")]
        for p, raw in raws.items():
            best = None
            for v in variants:
                if v and v in raw:
                    idx = raw.find(v)
                    cnt = raw.count(v)
                    if best is None or cnt < best[1]:
                        best = (idx, cnt, v)
            if best:
                candidates.append((best[1], 2, "token", tok, p, best[0]))
    if not candidates:
        chosen = ("head", "file-head", existing[0], 0)
    else:
        # rarest anchor wins (a generic number like '256' must not outrank a
        # distinctive key like 'B2delivered'); ties break by kind priority
        candidates.sort(key=lambda t: (t[0], t[1], t[5]))
        _, _, kind, needle_display, path, idx = candidates[0]
        chosen = (kind, needle_display, path, idx)
    kind, needle_display, path, idx = chosen
    raw = raws.get(path) or (REPO / path).read_text(encoding="utf-8")
    if kind == "head":
        start = 0
        window = raw[:WINDOW_BEFORE + WINDOW_AFTER]
        method = "head (no anchor matched; first " + str(len(window)) + " chars)"
    else:
        start = max(0, idx - WINDOW_BEFORE)
        window = raw[start:start + WINDOW_BEFORE + WINDOW_AFTER]
        method = ("anchor '" + needle_display + "' at offset " + str(idx)
                  + ", window chars " + str(start) + "-" + str(start + len(window)))
    return {"path": path, "window": window, "method": method,
            "anchor_kind": kind, "anchor": needle_display,
            "anchor_offset": idx}


def group_slug(path):
    base = pathlib.Path(path).name
    return re.sub(r"[^a-z0-9]", "", base.lower())[:24] or "group"


def main() -> None:
    # ---------------- pass 1: mechanical, receipted, no Jev ----------------
    mech_by_claim = {}
    sections_by_claim = {}
    for c in CLAIMS:
        mech = mechanical_pass(c)
        mech_by_claim[c["id"]] = mech
        if mech["verdict"] == "pass":
            sections_by_claim[c["id"]] = locate_section(c, mech)

    for c in CLAIMS:
        mech = mech_by_claim[c["id"]]
        if mech["verdict"] == "fabricated":
            row = {
                "call_id": "r12-cc-b-mech-" + c["id"],
                "arm": "B",
                "decision_pass": "mechanical",
                "claim_id": c["id"],
                "verdict": "fabricated_or_misstated",
                "failures": mech["failures"],
                "anchors": {k: mech["anchors"][k] for k in ("hexes", "paths", "rowofs", "numbers")},
                "mechanical_facts": mech["facts"],
                "claims_sha": CLAIMS_SHA,
                "ground_truth_sha": GT_SHA,
                "sealed_at": jc.now(),
                "note": "mechanical pass decided; NO Jev call spent (the "
                        "citation-check cookbook: string/sha/number match in "
                        "code first)",
            }
            jc.append_row(ROWS, row)
            print("MECHANICAL fabricated: " + c["id"] + " -> "
                  + "; ".join(f["class"] for f in mech["failures"]))

    # ---------------- pass 2: grounded Jev over located sections ----------
    jev_claims = [c for c in CLAIMS if mech_by_claim[c["id"]]["verdict"] == "pass"]
    groups = {}
    for c in jev_claims:
        sec = sections_by_claim[c["id"]]
        key = sec["path"] if sec else "__nocitedfile__"
        groups.setdefault(key, []).append((c, sec))

    for path, members in sorted(groups.items()):
        slug = group_slug(path) if path != "__nocitedfile__" else "nocitedfile"
        state_lines = [
            "Citation-check grounding loop, arm B. For each claim below you "
            "see ONLY the located section of the repository file it cites -- "
            "actual file content, extracted mechanically around the claim's "
            "anchors -- plus mechanical prepass facts computed in code (path "
            "existence, sha presence repo-wide, chain row counts, number "
            "presence in the cited file). Judge each claim against its "
            "located section only. You are not shown any corpus briefing.",
        ]
        if path != "__nocitedfile__":
            state_lines.append("")
            state_lines.append("=== FILE: " + path + " ===")
        for c, sec in members:
            state_lines.append("")
            if sec:
                state_lines.append("--- SECTION FOR CLAIM [" + c["id"] + "] ("
                                   + sec["method"] + ") ---")
                state_lines.append(sec["window"])
            else:
                state_lines.append("--- NO CITED FILE FOR CLAIM [" + c["id"]
                                   + "] (nothing to locate) ---")
        state_lines.append("")
        state_lines.append("MECHANICAL PREPASS FACTS (computed in code, not by you):")
        for c, sec in members:
            mech = mech_by_claim[c["id"]]
            fl = mech["facts"] or ["no anchors extracted; nothing mechanically checkable"]
            state_lines.append("[" + c["id"] + "] " + " | ".join(fl))
        state = "\n".join(state_lines)

        questions = {}
        for c, sec in members:
            questions[c["id"] + "__verdict"] = {
                "type": "choice",
                "instructions": "Claim [" + c["id"] + "]: " + c["text"]
                                + "  Judge it against the located section labeled for "
                                  "this claim in the state, plus the mechanical prepass facts.",
                "criteria": {
                    "yes_true": "The located section (plus mechanical facts) evidences the claim as stated: right artifact, right value, right verdict word, right unit, right mechanism.",
                    "fabricated_or_misstated": "The located section contradicts the claim or shows it misstates the artifact: value absent or different, verdict inverted, wrong metric or unit, or a mechanism the section does not support.",
                    "cannot_settle": "The located section does not settle the claim either way (history, intent, or absent detail).",
                },
            }

        for r in (1, 2, 3):
            call_id = "r12-cc-b-r" + str(r) + "-" + slug
            body = {"state": state, "model": jc.MODEL, "questions": questions}
            extra = {
                "arm": "B",
                "repeat": r,
                "group_file": path,
                "group_size": len(members),
                "claims_sha": CLAIMS_SHA,
                "ground_truth_sha": GT_SHA,
                "state_note": "located file sections + mechanical prepass facts only "
                              "(no briefing)",
            }
            res = jc.call_and_seal(call_id, body, ROWS, extra)
            if not res.get("ok") and not res.get("skipped"):
                print("arm B group " + slug + " repeat " + str(r) + " failed; receipted")
            jc.time.sleep(jc.GAP_S)

    print("\nrows: " + str(ROWS))


if __name__ == "__main__":
    main()
