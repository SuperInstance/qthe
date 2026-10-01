"""worker.py — JSON-in/JSON-out solver for the crossimpl conformance harness.

Reads ONE job object from stdin, computes it with crossimpl/py/qthe_layer0.py
(the from-SPEC-alone implementation), writes ONE canonical-JSON object to
stdout (sorted keys, no whitespace — byte-comparable against the JS side's
stone-v1 canonicalJSON). All logs go to stderr.

Tamper control (pre-registered NC2, AMBIGUITY.md): env QTHE_TAMPER_VECTOR=<i>
corrupts the emitted yR[0] of vector id <i> AFTER computation — the worker
lies in-band so the harness can prove its comparison is live. Never set in a
real run.

Job shapes:
  {"task":"bijection"}
  {"task":"psi"}
  {"task":"vectorpass","vectors":[{"id":<int>,"weights":[[w..]..],"xs":[..]} ..]}
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qthe_layer0 import pack, psi_imag_coeff, psi_real_coeff, unpack, vector_pass


def canon(obj) -> str:
    """Stone-v1-compatible canonical JSON: recursive key sort, no whitespace."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def run_bijection() -> dict:
    unpacked = []
    repacked = []
    for c in range(256):
        tau, d = unpack(c)
        unpacked.append([tau, d])
        repacked.append(pack(tau, d))
    return {"task": "bijection", "unpack": unpacked, "repack": repacked}


def run_psi() -> dict:
    return {
        "task": "psi",
        "real": [psi_real_coeff(t) for t in range(4)],
        "imag": [psi_imag_coeff(t) for t in range(4)],
    }


def run_vectorpass(vectors: list) -> dict:
    results = []
    for v in vectors:
        y_r, y_i = vector_pass(v["weights"], v["xs"])
        results.append({"id": v["id"], "yR": y_r, "yI": y_i})
    out = {"task": "vectorpass", "results": results}
    tamper = os.environ.get("QTHE_TAMPER_VECTOR")
    if tamper is not None:
        target = int(tamper)
        hit = False
        for r in out["results"]:
            if r["id"] == target:
                if r["yR"]:
                    r["yR"][0] += 1
                    hit = True
                print(f"worker: NC2 tamper applied id={target} yR[0]->{r['yR'][0] if r['yR'] else None} hit={hit}", file=sys.stderr)
                break
        if not hit:
            print(f"worker: NC2 tamper NOT applied (id={target} not found or empty yR)", file=sys.stderr)
    return out


def main() -> int:
    job = json.loads(sys.stdin.read())
    task = job.get("task")
    if task == "bijection":
        out = run_bijection()
    elif task == "psi":
        out = run_psi()
    elif task == "vectorpass":
        out = run_vectorpass(job["vectors"])
    else:
        raise ValueError(f"unknown task: {task!r}")
    sys.stdout.write(canon(out))
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
