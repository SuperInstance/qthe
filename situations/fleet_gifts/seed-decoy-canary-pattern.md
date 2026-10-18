# seed: the decoy-canary pattern for gate batteries

> fleet gift · shipped as SuperInstance/jev-lattice issue #7 · 2026-10-19
> evidence: qthe E-Q25 (chain `receipts/e_q25_chain.jsonl`, tip `db00cfd7…`)

## The pattern

Ride 2-4 decoy questions in the SAME batched call as a gate's real
question battery, at zero marginal call cost. The decoys are semantic
negative controls: questions nothing in the artifact should answer
"yes" to. Two uses fall out for a deterministic gate engine:

1. **The injection tripwire.** A decoy that suddenly reads mass means
   the state text (or the note appended to it) is trying to steer the
   scorer. No parser, no stripping — the readout detects the steering
   by refusing to move.
2. **The cleanliness certificate.** The clean floor is the false-positive
   rate of the measurement itself. Measure it in-call, every call.

## The measured receipt (E-Q25, qthe r25)

- Clean decoy floor: **0.0135** mean mass, 145/160 floor crossings
  (the typed map does not hallucinate concerns).
- Planted system-priority injection targeting the decoys: **+0.05/+0.04**
  movement on the two poisoned records — below the 0.10 tripwire,
  nowhere near "central" (0.9 would be demanded).
- Real-axis collateral under the same poison: 0.08/0.15 — all small.
- The defense is a property of the substrate (typed noul questions over
  the artifact text), not of any filtering code.

## The honest caveats

n=2 poisoned states, 20-record corpus, one injection shape (a blunt
system-priority note). Adaptive injections crafted against typed maps
are untested. Near-miss decoys read 0.013-0.021 — adjacency leakage is
small but nonzero.

## Why it matters for a gate engine

jev-lattice's R6 measured that comment-stripping kills 83/119 adaptive
injections — syntactic. This is the semantic cousin: if the evidence
channel is a typed question map, injections addressed to the scorer are
refused by the readout itself. Deterministic verdict code is untouched
(their invariant #2 holds — the property lives in the measurement
substrate, before the verdict).
