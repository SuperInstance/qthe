#!/usr/bin/env python3
# situations/grounding_loop/distractors_seed.py -- ONE DeepInfra call to
# ByteDance/Seed-2.0-mini (the designated creative devil's advocate) asking
# for plausible-unverifiable distractor claims about the qthe corpus.
# Seed briefing law (MODEL-LEARNINGS r11): brief it to ATTACK, not to audit.
# max_tokens 2000, budget <= $0.01. Output is candidates only -- each is
# manually verified unverifiable-from-repo BEFORE it enters claims.json;
# provenance (this call_id) is receipted in ground_truth evidence.
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROWS = HERE / "rows_distractors.jsonl"
ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
MODEL = "ByteDance/Seed-2.0-mini"

BRIEF = (
    "You are the devil's advocate at a receipt-heavy research corpus (qthe: a "
    "deterministic 1-byte cellular substrate with hash-chained experiment "
    "receipts, a falsification budget of banked nulls, and an audit tavern of "
    "LLM seats). We are building a citation-check test set: claims about this "
    "repository that a judge must triage. Your job: write 5 DISTRACTOR claims "
    "-- each one sounds specific and repo-checkable, cites real repo concepts "
    "(experiments E-Q1..E-Q16, claims C1..C5, chains, the tavern seats, the "
    "kernel), but is in fact NOT settleable from the repository's own files "
    "because it is about history, intent, external context, or unrecorded "
    "circumstances. Each distractor must be 1-2 sentences, plausible, and "
    "neither provable nor disprovable by grepping the repo. Do NOT write "
    "claims that contradict sealed verdicts or invent file paths -- those are "
    "other fabrication classes, already covered. Answer with STRICT JSON "
    "only: {\"distractors\":[{\"text\":\"...\"},...]} with exactly 5 items."
)


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def main() -> None:
    key = os.environ.get("DEEPINFRA_API_KEY")
    if not key:
        raise SystemExit("DEEPINFRA_API_KEY missing (fail-closed: no key, no call).")
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": BRIEF}],
        "max_tokens": 2000,
        "stream": False,
    }
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=120) as res:
        j = json.loads(res.read().decode("utf-8"))
    elapsed_ms = int((time.time() - t0) * 1000)
    row = {
        "call_id": "r12-cc-distractors-seed",
        "model_requested": MODEL,
        "model_served": j.get("model"),
        "elapsed_ms": elapsed_ms,
        "sealed_at": now(),
        "usage": j.get("usage"),
        "parse_method": "openai-chat-json-loose (choices[0].message.content, "
                        "then json.loads with fence stripping)",
        "response_raw": j,
    }
    with ROWS.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    content = j["choices"][0]["message"]["content"]
    print("---- RAW CONTENT ----")
    print(content)
    print("---- END ----")
    u = j.get("usage") or {}
    print("usage: " + json.dumps(u) + " | elapsed " + str(elapsed_ms) + "ms")


if __name__ == "__main__":
    main()
