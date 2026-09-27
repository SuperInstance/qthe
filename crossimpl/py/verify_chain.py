"""verify_chain.py — INDEPENDENT verifier for the crossimpl receipt chain.

A second implementation (Python) of the stone-v1 hash math, written for this
lane because a chain verified only by its own sealer is a rumor about a rumor.
Re-derives every row_hash from disk: sha256 over the canonical JSON of
[prev_hash, row_without_row_hash], keys recursively sorted, no whitespace —
matched to quilt-stone/stone.mjs's canonicalJSON for the ASCII-only row
content this chain uses.

    python3 crossimpl/py/verify_chain.py [path-to-chain.jsonl]
"""

import hashlib
import json
import sys


def canon(v) -> str:
    return json.dumps(v, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else sys.path[0] + "/../receipts/crossimpl_chain.jsonl"
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    prev = "STONE-GENESIS-1"
    for i, row in enumerate(rows):
        rh = row.pop("row_hash", None)          # strip, preserves other keys
        if rh is None:
            print(f"CHAIN BROKEN at {i}: missing row_hash")
            return 1
        want = hashlib.sha256(canon([prev, row]).encode("utf-8")).hexdigest()
        if want != rh:
            print(f"CHAIN BROKEN at {i}: hash mismatch want={want} got={rh}")
            return 1
        prev = rh
    print(f"independent python verify: ok=True links={len(rows)} tip={prev}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
