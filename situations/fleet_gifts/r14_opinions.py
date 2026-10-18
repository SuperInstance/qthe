#!/usr/bin/env python3
"""r14 opinion passes (fleet gifts): Seed-2.0-mini devil's advocate on the
three seed files; Hermes outside-the-box on the reading-room gift framing.

House laws: AS-SAID (response_raw verbatim), usage telemetry per row,
append+flush, fail-closed key (env only), no .format() on JSON-bearing
strings (concatenation only), 1s gap between calls, foreground only.
Receipts: situations/fleet_gifts/opinions_r14.jsonl
"""
import json
import hashlib
import os
import time
import urllib.request

ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
KEY = os.environ.get("DEEPINFRA_KEY") or ""  # fail-closed: env only
OUT = os.path.dirname(os.path.abspath(__file__)) + "/opinions_r14.jsonl"


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def call(model: str, system: str, user: str, max_tokens: int) -> dict:
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=180) as r:
        raw = r.read().decode("utf-8", "replace")
    dt = round(time.time() - t0, 3)
    j = json.loads(raw)
    return {
        "model_requested": model,
        "model_served": j.get("model"),
        "latency_s": dt,
        "finish": (j.get("choices") or [{}])[0].get("finish_reason"),
        "content": (j.get("choices") or [{}])[0].get("message", {}).get("content"),
        "usage": j.get("usage"),
        "response_raw": raw,
    }


def append_row(row: dict) -> None:
    with open(OUT, "a") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
        f.flush()


SEED_SYS = (
    "You are Seed-2.0-mini, seated at the qthe tavern as the devil's advocate "
    "for ROUND 14 gift duty. Three experiment seed files are about to be dropped "
    "into the fleet's seedbox (fleet-seeds/seeds/) for OTHER agents to spawn repos "
    "from. Your job: attack the DESIGNS, not the topic. Confounds, decision-rule "
    "holes, missing controls, unfalsifiable framings, cheap ways each experiment "
    "could produce a FALSE conclusion. Be specific and terse. Your words are "
    "sealed verbatim. Answer with STRICT JSON only: "
    '{"attacks":[{"seed":"<filename stem>","attack":"<the sharpest design flaw>","fix":"<concrete patch, <=40 words>"}],"verdict_per_seed":{"<stem>":"ship|fix-first|kill"},"notes":"<<=40 words>"}'
)

SEED_USER = (
    open(os.path.dirname(os.path.abspath(__file__)) + "/seed-qthe-wormhole-ablation.md").read()
    + "\n\n=====\n\n"
    + open(os.path.dirname(os.path.abspath(__file__)) + "/seed-qthe-ternary-port-race.md").read()
    + "\n\n=====\n\n"
    + open(os.path.dirname(os.path.abspath(__file__)) + "/seed-tavern-disagreement-economics.md").read()
    + "\n\n===== context you may rely on =====\n"
    "The wormhole table is compile-time 64-slot, content-addressed by a cell's own d; "
    "slot writes are last-writer-wins; resonance = |acc|+1. C2 lives at the demo level "
    "(8/8 ON vs 0/20 OFF paired-arm). The batching falsifier measured 0/30 batch-hostile "
    "with a 2*std noise floor and ~147 marginal tokens per question. The reading-room "
    "corpus = discriminating probes where two defensible spec readings diverge."
)

HERMES_SYS = (
    "You are Hermes-3-405B, the tavern's outside-the-box opinion seat (ROUND 14 gift "
    "duty). The qthe orchestrator is about to leave a gift document in the git.pp "
    "reading-room repo — a sibling lane whose method is: independent readings of a "
    "spec with DISAGREEMENT as the output; four readers, forbidden from seeing each "
    "other; probes chosen because two defensible readings produce different output. "
    "The gift carries the qthe tavern's measured disagreement economics: batching all "
    "of one judge's questions into one typed-question call is 12.36x cheaper with zero "
    "measured answer drift (0/30 batch-hostile vs a 2*std noise floor); the question "
    "map costs ~147 marginal tokens per question so the ratio tracks "
    "state-chars-per-question; grounded-confidence is the routing signal; a mechanical "
    "invented-flag check caught hallucinated CLI flags at $0. Your job: think OUTSIDE "
    "the box about what this gift should say so the reading-room lane actually PROFITS "
    "from it rather than files it. What would a reading-room built around measured "
    "disagreement economics look like? What's the one idea they're one step from? "
    "Terse, concrete, no flattery. STRICT JSON only: "
    '{"the_one_idea":"<the single most valuable idea for them, <=60 words>","gift_risk":"<how the gift could land badly or be misread, <=40 words>","add_this":"<one concrete thing to ADD to the gift doc>","drop_this":"<one thing to cut>"}'
)

HERMES_USER = (
    "The reading-room's own receipts: five fold ports agree on 20,043 records — that "
    "is self-consistency, bounded; the one genuinely outside judgment was a sixth fold "
    "which DISAGREED with the spec's reading of the ancestry clause, and that "
    "disagreement was 'the most valuable thing that happened all week'. Their corpus "
    "is instruments, not tests: a probe all readers pass is measuring nothing and "
    "should be deleted. The qthe tavern runs 10 seats with typed questions (noul / "
    "choice / score with calibrated probabilities), sealed rows, and a "
    "mechanical-first verification loop that earned its place by catching two r10 "
    "hallucination incidents (one grounded-suspicion routed to human_flag, one caught "
    "mechanically at $0). Draft the gift's framing: what do we OFFER without "
    "carrying verdicts about their repo (their Law: a repo carries no verdicts about "
    "its neighbors, only content-addressed pointers folded under the reader's own "
    "weights)?"
)


def main() -> None:
    if not KEY:
        raise SystemExit("fail-closed: DEEPINFIA_KEY env not set")
    # Seat 1: Seed-2.0-mini devil's advocate on the seeds
    r1 = call("ByteDance/Seed-2.0-mini", SEED_SYS, SEED_USER, 3000)
    append_row(
        {
            "call_id": "r14-gift-seed20mini-seedattack",
            "ts": now(),
            "purpose": "devil's advocate on the three fleet-seed drafts before the drop",
            "prompt_sha256": hashlib.sha256((SEED_SYS + SEED_USER).encode()).hexdigest(),
            **r1,
        }
    )
    print("seed20mini:", r1["finish"], r1["latency_s"], "s;", (r1["usage"] or {}).get("total_tokens"), "tok")
    time.sleep(1.0)
    # Seat 2: Hermes outside-the-box on the reading-room gift framing
    r2 = call("NousResearch/Hermes-3-Llama-3.1-405B", HERMES_SYS, HERMES_USER, 2500)
    append_row(
        {
            "call_id": "r14-gift-hermes-readingroom",
            "ts": now(),
            "purpose": "outside-the-box framing for the reading-room gift doc",
            "prompt_sha256": hashlib.sha256((HERMES_SYS + HERMES_USER).encode()).hexdigest(),
            **r2,
        }
    )
    print("hermes:", r2["finish"], r2["latency_s"], "s;", (r2["usage"] or {}).get("total_tokens"), "tok")
    cost = 0.0
    for r in (r1, r2):
        u = r["usage"] or {}
        cost += (u.get("prompt_tokens", 0) / 1e6) * 0.027 + (u.get("completion_tokens", 0) / 1e6) * 0.027
    print("est spend ~$", round(cost, 6))


if __name__ == "__main__":
    main()
