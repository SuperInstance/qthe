#!/usr/bin/env python3
# situations/grounding_loop/canary.py -- one tiny noul call: key present,
# endpoint live, served-model attribution, usage/cost fields observed.
# Closes the playground register's pending "canary re-run pending in T3-a".
import json
import pathlib

import jev_client as jc

ROWS = pathlib.Path(__file__).resolve().parent / "rows_canary.jsonl"

if __name__ == "__main__":
    body = {
        "state": "Canary: the grounding loop checks its key before it spends.",
        "model": jc.MODEL,
        "questions": {
            "alive": {
                "type": "noul",
                "instructions": "Is this sentence a canary probe?",
                "criteria": {"true": "It says so", "false": "It does not"},
            }
        },
    }
    r = jc.call_and_seal("r12-cc-canary", body, ROWS)
    if not r.get("ok") and not r.get("skipped"):
        raise SystemExit(1)
    for row in jc.read_rows(ROWS):
        if row.get("response_raw"):
            ans = row["response_raw"].get("answers") or {}
            print("canary answers: " + json.dumps(ans))
            print("usage: " + json.dumps(row.get("usage"))
                  + " | usd_est " + str(row.get("usd_est"))
                  + " (pricing assumption " + str(jc.PRICE_PER_1M_INPUT_USD)
                  + "/1M in, " + str(jc.PRICE_PER_1M_OUTPUT_USD) + "/1M out)")
