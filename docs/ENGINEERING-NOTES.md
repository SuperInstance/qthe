# qthe — Engineering Notes

## Architecture

Four planes around one kernel:

```
                SPEC.md  (canon: LAYER 0 facts / LAYER 1 mechanism /
                          LAYER 2 priced claims C1-C5)
                   |  distilled, priced
                   v
   +----------------------------------------------------------+
   | qthe.mjs — reference kernel (zero deps, ESM, integer-    |
   | exact where the SPEC says exact; R1-R7 in the header)    |
   |                                                          |
   |  pack/unpack  vectorPass  WormholeTable  makeSubstrate   |
   |  nextD (pure rule)  tick (Moore-8 toroidal, live         |
   |  wormhole reads, tau frozen)  traceView  mulberry32*     |
   +---------------------------+------------------------------+
   (* caller-side seeding only; tick draws nothing)
             |                            |                    |
             v                            v                    v
   tests/run_tests.mjs           crossimpl/py/...        fixedpoint/
   G0-G6 pre-registered gates    LAYER 0 re-derived      qthe_fixed.mjs
   -> receipt.json+stone chain   from SPEC alone         (S=2^32 fixed sigma)
                                 10,272/10,272 exact     P-B1 falsification
                                                             |
   experiments/ E-Q1..E-Q12 (pre-registrations, evaluators, tips)  <---+
   situations/ (tavern: DeepSeek guest, cache economics, eq verdicts) -+
   two_reader/ (independent walker over crab-traps chains)             |
   index.html + demo/ (A2UI live mirror; HUD hash = live trace sha) <--+
```

Data flow: callers seed a substrate via `makeSubstrate(w, h, seedFn)` (seed
fn usually built on caller-side `mulberry32`); each `tick` reads neighbors
from a pre-tick snapshot, folds Attract/Repel contributions into a real
accumulator, lets Abstain cells consult the wormhole table (live reads,
row-major, own-write guard), applies the pure `nextD` rule, and emits twin
events. Verification never trusts a live object: traces are
`canonicalJSON(traceView(...))` hashed with sha256, and every experiment
seals parameters + observed numbers into stone-v1 chains.

## Invariants

1. **Bijection.** pack/unpack round-trips exactly for all 256 values, 256
   distinct (τ, d) pairs (G1; Python selftest agrees exhaustively).
2. **Bounds by exhaustion.** Every update maps [0,63] → [0,63]: 2304/2304
   `nextD` cases and 3840/3840 tick cell-updates with τ preserved exactly
   (G2). Timbre never changes inside tick — injectors only.
3. **Determinism.** Same initial substrate + same tick count →
   byte-identical trace (G3: 1000/1000 per-tick hash equality, planes
   equal, different seed differs, zero `Math.random` on comment-stripped
   source). This is the contract that makes every sealed receipt mean
   anything.
4. **Ground silence.** τ=0 contributes to neither channel even with d>0
   (G4 row2 / G4-P2; cross-impl C' edge vectors).
5. **Wormhole schedule exactness.** The twin fixture's six-tick schedule
   (events, d values, slot contents, totalWrites = 12) is pinned in G5;
   lone Abstain cells never twin after their own write; wormholes=false
   arms are silent AND tableless.
6. **Flag non-leakage.** With zero Abstain cells, wormholes ON and OFF
   arms are byte-identical over 200 ticks (G6-S2); with Abstain cells they
   diverge (G6-S1). R7: traces record wormhole STATE, not the flag.
7. **Append-only honesty.** Registered gates and pre-registrations are
   never rewritten; honest FAILs (G4; P-B1) stay in chains beside their
   post-hoc corrections; re-runs rewrite identical bytes.

## Failure modes & blast radius

- **Missing stone sibling:** the gate suite and cross-impl conformance
  refuse with a named import error. Blast radius: none (fail-closed before
  any seal). The sealed runs of record (`tests/receipt.json`,
  `crossimpl/receipts/`) remain the citable evidence.
- **Kernel edit without re-run:** every downstream sha pin (receipt.json,
  experiment registrations) references the kernel sha; a moved kernel makes
  old pins point at a lineage that is no longer HEAD — detected by
  comparing shas, not by silent passage.
- **Float-plane vs fixed-plane divergence:** engineered rational sigmas
  (1.6, 0.7, 2/3) create exact-zero pressure families where the float
  kernel holds a cell its own bridge scale says should move (double
  rounding) while the fixed kernel moves on an honest remainder. Contained
  by treating the two kernels as separate sealed lineages with a priced
  translation table (the fixedpoint findings).
- **JSON.stringify on the substrate:** leaks the expandos and breaks trace
  equality; use `traceView`. This bit the G6 run 1 (the R7 finding) and is
  receipted.
- **Out-of-domain inputs:** JS masks (`tau & 3`, `d & 63`), Python raises;
  ragged rows are NaN poison in JS, ValueError in Python (F2/F3). Both are
  documented SPEC-ambiguity findings — outside the specified surface, but
  a caller feeding hostile data should prefer the Python path.
- **Tavern lanes:** operator-key-gated; not re-runnable zero-shot.
  Blast radius of their absence: none on the kernel claims; the sealed
  guest receipts remain the provenance trail.

## Performance & cost envelope

- The gate run G0–G6 (including a 1000-tick 24×16 determinism trace,
  hashed per tick) is sub-minute on a laptop; the two_reader selftest
  (54 negative controls) and Python selftest (36 assertions) run in
  seconds — all verified live this wave.
- E-Q12 enumerated 254,520 triples and held 12 hard pins; the fixedpoint
  run priced 2,085,522 paired twin events. These are CPU-minutes lanes,
  receipts sealed; no cloud involved.
- The A2UI mirror renders 96×64 = 6,144 cells at ~60 ticks/s in-browser
  (demo/smoke: 30 s live run, zero console errors) — direct
  buffer-to-canvas, no log files.
- No services, no spend in the repo's own lanes; the tavern's external
  model spend was receipted per turn (cache economics) by the operator.

## Operations

- **Local:** the four stone-free commands in ONBOARDING.md; the gate suite
  with `quilt-stone` cloned two levels up; the demo via
  `python3 -m http.server 8123`.
- **Receipts model:** stone-v1 chains with `sealChain`/`verifyChainFile`;
  tips are the citations (`tests/receipt.json` chain tip `7e66ea21…`;
  fixedpoint tip `a7f7a552…`; per-experiment tips in receipts/ and
  experiments/outputs/).
- **Credentials model:** none in-repo. Historical tavern/DeepSeek/Moth
  calls used operator env keys (never committed; the keyscan discipline of
  sibling repos applies); everything those runs produced is sealed as
  data + provenance, not as live dependencies.
- **Journal:** SuperInstance/superinstance-lab → worklog.md, grep 'qthe'.

## Design decisions & why

1. **Split the gift by honesty law (SPEC L0/L1/L2).** The founder's corpus
   mixed testable algebra, implementable mechanism, and metaphor. Forcing
   all three through one gate would either LARP the claims or strangle the
   vision; the split lets the algebra be exhaustive, the mechanism be
   deterministic, and the claims be priced — with "honest null = crown
   jewel" stated up front.
2. **Integer-exact LAYER 0.** No floats in the split-channel pass keeps
   cross-implementation byte-parity achievable at the serialization level
   (the 10,272/10,272 result). The cost: JS's ±2^53 input horizon — a
   documented seam (F1) rather than a silent one.
3. **Live wormhole reads (R2).** SPEC says writes land "for the next
   tick"; live reads in row-major order make equal-d twins mutually
   audible from their second co-tick, which is precisely the mechanism C2
   prices. Determinism survives because order is fixed. The exact schedule
   is pinned in G5 so the choice is auditable tick by tick.
4. **Timbre frozen inside tick (R3/R4).** Letting τ drift would blur every
   paired arm; freezing it confines the imaginary channel's influence to
   the only degree of freedom the byte has (d via pressure), which also
   made sigma empirically potent instead of decorative.
5. **The no-floats plane (R8) as a separate sealed lineage.** Rather than
   mutating the reference kernel, the fixed-point lane built
   `qthe_fixed.mjs` (S = 2^32, integer sigma literal, no log2 anywhere)
   and priced the translation honestly — including the P-B1 falsification
   on adversarial rational sigmas — answering guest review R5 with
   "closed with measured cost" instead of a quiet patch.
6. **Two-reader rule (installment 2 in-repo).** qthe hosted an independent
   reader for another repo's receipt chains (crab-traps), written from the
   law with zero shared code — proving the receipt discipline is
   re-derivable from its statement, the same standard the cross-impl lane
   applied to the SPEC itself.
