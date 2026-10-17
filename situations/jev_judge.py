#!/usr/bin/env python3
# situations/jev_judge.py -- the TypeSafe/Jev judge seat (key-pending, fail-closed).
#
# Wave ORCH-R10. The founder's mandate: use typesafe.ai extensively, as a
# power tool, in our applications and in our building. The key left the
# workspace in the reset (same loss round-9 receipted for DeepSeek), so this
# adapter ships CODE-DELIVERED, KEY-PENDING -- the ESP32 pattern applied to
# an API seat: the code is here, the honest gap is named, one env var
# (TYPESAFE_API_KEY, never committed, never logged) takes it live.
#
# What it does once live: JUDGE THE ARENA. The eight DeepInfra seats audit
# the corpus; this seat judges their findings with typed questions --
#   - Choice: is the finding verified-new / already-admitted / plausible-
#     unverified / hallucinated / noise? (full probability vector)
#   - Noul:   is it actionable -- would it change what the orchestrator
#     does next? (P(yes) as a first-class uncertain value)
#   - Score:  severity rubric [minor, major, critical]
# -- batched per the parallel-questions cookbook (12.2x cheaper, 10x faster,
# zero answer drift): ALL of one seat's findings in ONE systemone call.
#
# API contract (docs.typesafe.ai/api.md, fetched 2026-10-18):
#   POST https://api.typesafe.ai/v1/systemone
#   Authorization: Bearer <key>
#   {"state": <text>, "model": "jev-latest",
#    "questions": {"<id>": {"type": "noul|choice|score",
#                           "instructions": "...", "criteria": {...}}}}
#   -> {"model": "jev-1.13.0", "answers": {"<id>": {...}}, "usage": {...}}
#   noul answer: {"type":"noul","noul":0.95}
#   choice answer: {"type":"choice","choice":"...","probabilities":{...},"confidence":...}
#   score answer: {"type":"score","score":1.05,"legend":{...},"probabilities":{...},"confidence":...}
#
# House laws carried: outputs sealed AS SAID (response verbatim, parse_method
# declared); provenance per row (served model version FROM THE RESPONSE,
# usage, state hash, question-map hash, timestamp); append+flush rows; resume
# by call_id; exponential backoff on 429/529/5xx; fail-closed on missing key.
#
# Usage:
#   python3 jev_judge.py canary              # one tiny noul call (key check)
#   python3 jev_judge.py judge               # judge all arena r10 seats
#   python3 jev_judge.py rows                # print sealed judgment rows

import hashlib
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ARENA_ROWS = HERE / "arena_rows_r10.jsonl"
JEV_ROWS = HERE / "jev_judgments_r10.jsonl"

ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
CALL_TIMEOUT_S = 180
GAP_S = 1.0
MAX_ATTEMPTS = 5

CLASS_CRITERIA = {
    "verified_new": "The finding names a real artifact from the briefing, states something true and NOT already admitted by the corpus itself, and implies a concrete repair or control.",
    "already_admitted": "The finding is true but the briefing already concedes it openly (a named honest gap, a receipted null, a receipted defect).",
    "plausible_unverified": "Could be true; cannot be settled from the briefing alone without checking repository internals.",
    "hallucinated": "The finding names an artifact or fact that does not match the briefing, or misstates the sealed record.",
    "noise": "Restates a strength as a weakness, is unfalsifiable, or carries no consequence either way.",
}
SEVERITY_RUBRIC = ["minor", "major", "critical"]


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def api_key() -> str:
    k = os.environ.get("TYPESAFE_API_KEY")
    if not k:
        raise SystemExit(
            "TYPESAFE_API_KEY missing from env (fail-closed: no key, no call, "
            "no spend). Re-supply the key; it is read from env only, never "
            "committed, never logged."
        )
    return k


def http_post(body: dict):
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    last_err = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=CALL_TIMEOUT_S) as res:
                return {"ok": True, "j": json.loads(res.read().decode("utf-8"))}
        except urllib.error.HTTPError as e:
            txt = e.read().decode("utf-8", "replace")
            if e.code in (429, 529) or e.code >= 500:
                wait = min(60.0, 1.5 * 2 ** (attempt - 1))
                last_err = f"http_{e.code}"
                print(f"  attempt {attempt}: {last_err}, backing off {wait:.1f}s", flush=True)
                time.sleep(wait)
                continue
            return {"ok": False, "error": f"http_{e.code}: {txt[:200]}"}
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            wait = min(60.0, 1.5 * 2 ** (attempt - 1))
            last_err = f"network:{str(e)[:100]}"
            print(f"  attempt {attempt}: {last_err}, backing off {wait:.1f}s", flush=True)
            time.sleep(wait)
    return {"ok": False, "error": last_err or "exhausted"}


def append_row(obj: dict) -> None:
    with JEV_ROWS.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def load_done() -> set:
    if not JEV_ROWS.exists():
        return set()
    done = set()
    for line in JEV_ROWS.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            try:
                done.add(json.loads(line)["call_id"])
            except (json.JSONDecodeError, KeyError):
                pass
    return done


def build_call(seat_row: dict) -> dict:
    """One batched systemone call for one seat's audit findings.

    state = the shared briefing (same asset as the arena round, so the judge
    sees exactly what the auditors saw) + that seat's findings verbatim.
    questions = per finding: class (choice) + actionable (noul) + severity
    (score). This is the parallel-questions cookbook pattern: one call per
    seat, not one call per finding.
    """
    findings = (seat_row.get("content_json") or {}).get("findings") or []
    state = (
        seat_row.get("briefing_for_judge")
        or "Judge audit findings against this corpus briefing. "
        "The briefing is the auditor's system prompt for round 10 of the "
        "QTHE corpus audit (post-50-phase orchestration state).\n\n"
        "FINDINGS UNDER JUDGMENT (from seat "
        + seat_row.get("seat", "?")
        + ", sealed verbatim):\n"
        + json.dumps(findings, ensure_ascii=False, indent=1)
    )
    questions = {}
    for f in findings:
        fid = str(f.get("id") or "f").replace(" ", "-")[:40]
        questions[f"{fid}__class"] = {
            "type": "choice",
            "instructions": (
                "Classify this audit finding against the briefing. Finding: "
                f"[{f.get('severity')}] {f.get('finding')} (artifact: {f.get('artifact')})"
            ),
            "criteria": CLASS_CRITERIA,
        }
        questions[f"{fid}__actionable"] = {
            "type": "noul",
            "instructions": (
                "Would acting on this finding change what the orchestrator "
                "does next (as opposed to being already-handled, decorative, "
                "or consequence-free)?"
            ),
            "criteria": {
                "true": "It would change the next action taken",
                "false": "No change to next actions either way",
            },
        }
        questions[f"{fid}__severity"] = {
            "type": "score",
            "instructions": "Rate the real severity of this finding.",
            "criteria": SEVERITY_RUBRIC,
        }
    return {"state": state, "model": MODEL, "questions": questions}


def cmd_canary() -> None:
    body = {
        "state": "Canary: the tavern checks its key before it spends.",
        "model": MODEL,
        "questions": {
            "alive": {
                "type": "noul",
                "instructions": "Is this sentence a canary probe?",
                "criteria": {"true": "It says so", "false": "It does not"},
            }
        },
    }
    r = http_post(body)
    if r["ok"]:
        j = r["j"]
        print(f"ALIVE :: served model {j.get('model')} :: answers {json.dumps(j.get('answers'))} :: usage {json.dumps(j.get('usage'))}")
        append_row(
            {
                "call_id": "canary-0",
                "sealed_at": now(),
                "model_served": j.get("model"),
                "response_raw": j,
                "note": "canary: key present, endpoint live, version attributed from response",
            }
        )
    else:
        print(f"FAILED: {r['error']}")
        sys.exit(1)


def cmd_judge() -> None:
    if not ARENA_ROWS.exists():
        raise SystemExit(f"no arena rows at {ARENA_ROWS}")
    done = load_done()
    seats = [json.loads(l) for l in ARENA_ROWS.read_text(encoding="utf-8").split("\n") if l.strip()]
    seats = [s for s in seats if s.get("content_json") and not s.get("error")]
    for seat in seats:
        call_id = f"r10-judge-{seat.get('seat')}"
        if call_id in done:
            print(f"skip {call_id} (already sealed)")
            continue
        call = build_call(seat)
        qmap_hash = sha(json.dumps(call["questions"], sort_keys=True))
        print(f"judge {call_id} ({len(call['questions'])} questions, one batched call) ...", flush=True)
        t0 = time.time()
        r = http_post(call)
        elapsed = int((time.time() - t0) * 1000)
        row = {
            "call_id": call_id,
            "seat_judged": seat.get("seat"),
            "model_requested": MODEL,
            "model_served": None,
            "state_hash": sha(call["state"]),
            "questions_hash": qmap_hash,
            "question_count": len(call["questions"]),
            "elapsed_ms": elapsed,
            "sealed_at": now(),
        }
        if r["ok"]:
            j = r["j"]
            row.update(
                {
                    "model_served": j.get("model"),
                    "response_raw": j,
                    "usage": j.get("usage"),
                    "answers": j.get("answers"),
                }
            )
            append_row(row)
            print(f"  sealed: served {j.get('model')} | {len(j.get('answers') or {})} answers | {elapsed}ms", flush=True)
        else:
            row.update({"error": r["error"], "attempts": MAX_ATTEMPTS})
            append_row(row)
            print(f"  FAILED: {r['error']} — failure receipted", flush=True)
        time.sleep(GAP_S)
    print(f"\njudgments: {JEV_ROWS}")


def cmd_rows() -> None:
    if not JEV_ROWS.exists():
        print("(no rows yet)")
        return
    for line in JEV_ROWS.read_text(encoding="utf-8").split("\n"):
        if line.strip():
            r = json.loads(line)
            if r.get("error"):
                print(f"{r['call_id']}: ERROR {r['error']}")
                continue
            print(f"\n== {r['call_id']} (served {r.get('model_served')}) ==")
            for qid, ans in (r.get("answers") or {}).items():
                if ans.get("type") == "choice":
                    print(f"  {qid}: {ans.get('choice')} (p={ans.get('probabilities', {}).get(ans.get('choice'))}, conf={ans.get('confidence')})")
                elif ans.get("type") == "noul":
                    print(f"  {qid}: noul={ans.get('noul')}")
                elif ans.get("type") == "score":
                    print(f"  {qid}: score={ans.get('score')} conf={ans.get('confidence')}")


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in ("canary", "judge", "rows"):
        print("usage: python3 jev_judge.py canary|judge|rows")
        sys.exit(1)
    {"canary": cmd_canary, "judge": cmd_judge, "rows": cmd_rows}[sys.argv[1]]()


if __name__ == "__main__":
    main()
