#!/usr/bin/env python3
# situations/grounding_loop/arm_a.py -- ARM A: briefing-only Jev triage
# (the status quo). The jev_judge.py r10 pattern, applied to the T3-a claim
# set: ONE batched systemone call per repeat over the whole claim set,
# state = the r10-style corpus briefing (the auditor system prompt from
# situations/arena_deepinfra.py, verbatim except the output-contract
# section, which is auditor-task instructions with no corpus facts --
# the trimming is declared here and in every sealed row's state_hash).
#
# This is deliberately GENEROUS to arm A relative to the literal r10 setup:
# the r10 judge state was the build_call fallback (findings only, no corpus
# briefing pasted in); here the judge gets the full r10 corpus briefing
# including the repo's own honesty framing. If arm A still misses planted
# fabrications, the miss is not an artifact of a thin state.
#
# Questions per claim (3): verdict (choice), locatable (noul),
# checkability (score). 3 repeats, call_ids r12-cc-a-r{1,2,3}.
# Playground probe (a) rides repeat 1: the FULL question set (claims x 3)
# goes in ONE call; on error, bisect and record the ceiling.
#
# Ground truth is read ONLY to hash the file bytes for provenance -- no
# decision in this script reads labels.
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))  # situations/
import arena_deepinfra  # noqa: E402  (r10 harness; import-safe: constants only at top level)

import jev_client as jc  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
ROWS = HERE / "rows_arm_a.jsonl"
CLAIMS = json.loads((HERE / "claims.json").read_text(encoding="utf-8"))["claims"]
CLAIMS_SHA = jc.sha((HERE / "claims.json").read_text(encoding="utf-8"))
GT_SHA = jc.sha((HERE / "ground_truth.json").read_text(encoding="utf-8"))

VERDICT_CRITERIA = {
    "yes_true": "The record as briefed evidences the claim: the named artifact, number, verdict word, or mechanism matches what the briefing says.",
    "fabricated_or_misstated": "The claim names an artifact, number, verdict, or mechanism that the briefing contradicts or cannot own: invented file paths or shas, values the briefing never states, inverted verdicts, wrong metric or unit, or a mechanism attributed to a receipt that says no such thing.",
    "cannot_settle_from_briefing": "The briefing cannot settle the claim either way (history, intent, or a detail the briefing never covers).",
}


def build_state() -> str:
    prefix = arena_deepinfra.SYSTEM_PREFIX
    cut = prefix.find("=========== OUTPUT CONTRACT (strict) ===========")
    assert cut > 0, "output-contract marker not found in r10 system prefix"
    briefing = prefix[:cut].rstrip()
    lines = [
        "Judge claims against this corpus briefing. The briefing below is the "
        "auditor's system prompt for round 10 of the QTHE corpus audit "
        "(post-50-phase orchestration state), verbatim except that the "
        "output-contract section (auditor task instructions, no corpus facts) "
        "is trimmed. You see ONLY this briefing -- not the repository itself. "
        "Judge each claim independently against the briefing.",
        "",
        briefing,
        "",
        "CLAIMS UNDER JUDGMENT (sealed verbatim, one block per claim; question "
        "ids carry the claim id):",
        "",
    ]
    for c in CLAIMS:
        lines.append("[" + c["id"] + "] " + c["text"])
        lines.append("")
    return "\n".join(lines)


def build_questions(claims_subset) -> dict:
    q = {}
    for c in claims_subset:
        cid = c["id"]
        q[cid + "__verdict"] = {
            "type": "choice",
            "instructions": "Claim [" + cid + "]: " + c["text"]
                            + "  Is this claim supported by the sealed record as briefed?",
            "criteria": VERDICT_CRITERIA,
        }
        q[cid + "__locatable"] = {
            "type": "noul",
            "instructions": "Claim [" + cid + "]: is the specific artifact this claim names "
                            "(file, chain, row, number, sha) locatable and checkable from the "
                            "briefing alone?",
            "criteria": {
                "true": "The briefing itself lets me point at the artifact and check the claim",
                "false": "The briefing does not let me check the claim's specifics",
            },
        }
        q[cid + "__checkability"] = {
            "type": "score",
            "instructions": "Claim [" + cid + "]: how directly does the briefing let you "
                            "verify this claim's specifics?",
            "criteria": ["not_at_all", "partially", "directly"],
        }
    return q


def main() -> None:
    repeats = [1, 2, 3]
    for r in repeats:
        call_id = "r12-cc-a-r" + str(r)
        body = {"state": build_state(), "model": jc.MODEL, "questions": build_questions(CLAIMS)}
        extra = {
            "arm": "A",
            "repeat": r,
            "claims_sha": CLAIMS_SHA,
            "ground_truth_sha": GT_SHA,
            "claims_count": len(CLAIMS),
            "state_note": "r10 corpus briefing (SYSTEM_PREFIX minus output-contract "
                          "section) + 32 claims verbatim",
        }
        res = jc.call_and_seal(call_id, body, ROWS, extra)
        if not res.get("ok") and not res.get("skipped"):
            print("arm A repeat " + str(r) + " failed; failure row sealed, moving on")
        jc.time.sleep(jc.GAP_S)
    print("\nrows: " + str(ROWS))


if __name__ == "__main__":
    main()
