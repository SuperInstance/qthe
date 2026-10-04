# qthe — Agent Onboarding
> Zero-shot entry point. Clone → competent in ~10 minutes.

## Identity (2 sentences)

qthe (Quilt-Ternary Hyper-Embeddings) is an 8-bit substrate primitive — 6
bits of spatial amplitude `d` plus 2 bits of timbre τ (Ground 0, Attract +1,
Repel −1, Abstain i, "the Looking Glass") — with a zero-dependency JS
reference kernel implementing a toroidal Moore-8 cellular substrate, an
integer-exact split-channel vector pass, and a 64-slot wormhole table that
gives Abstain cells non-local (twin-resonance) coupling. Everything the
founder's gifted vision asserted was split by the house honesty law into
what is exhaustively tested (LAYER 0), what is implemented deterministically
(LAYER 1), and what is only a priced claim (LAYER 2) — with every run sealed
into stone-v1 receipt chains.

## Why it exists (the fleet problem it solves)

Wave 33–34 took a founder's research corpus that read like a physics
proposal and refused to LARP it: SPEC.md distills it verbatim in structure,
then prices it. The result is a substrate where the algebra is proven by
exhaustion (all 256 bytes, all rules), determinism is a contract (no
`Math.random` in the kernel; same seed → byte-identical traces), and the
performance claims (C1–C5: gain-of-function, wormhole beats traversal,
σ = log2(3) critical scale, phase thresholds, self-repair) run as
pre-registered paired arms where "an honest null is a crown jewel". The
tavern added a cache-gamed DeepSeek guest that generates adversarial
situations and reviews the algebra, its outputs sealed with provider-native
provenance. Waves 34–48 extended it: cross-language re-derivation from the
SPEC alone, a fixed-point (no-floats) plane, collapse-predicate arithmetic,
a k-family closed form, and a two-reader rule installment.

## Verify it works (exact commands)

```bash
git clone https://github.com/SuperInstance/qthe.git && cd qthe

# 1. Kernel smoke (zero deps, Node >= 18):
node -e "
import('./qthe.mjs').then(q => {
  let ok=0; for (let c=0;c<256;c++){const {tau,d}=q.unpack(c); if(q.pack(tau,d)===c) ok++;}
  const sub = q.makeSubstrate(8,8,(x,y)=>q.pack((x+y)&3,(x*5+y*3)&63));
  for(let t=0;t<10;t++) q.tick(sub,{});
  console.log('bijection', ok+'/256', 'ticks', sub.ticks, 'twinEvents', sub.lastEvents.length);
});"
# -> bijection 256/256, ticks 10, twinEvents <n> (verified live, wave 69)

# 2. The full pre-registered gate suite G0-G6. KNOWN ENV DEPENDENCY: it
#    imports the sibling repo quilt-stone (stone.mjs) for canonical JSON +
#    chain sealing. If quilt-stone is absent it refuses loudly:
node tests/run_tests.mjs
#    -> "Error: stone.mjs not found (tried: ../../quilt-stone/stone.mjs, ...)"
#    With the sibling present the sealed result of record is in
#    tests/receipt.json: all_pass TRUE with G4 an honest, preserved FAIL
#    (prediction-arithmetic error; post-hoc G4-P2 PASS) and chain tip
#    7e66ea21…, verified, 10 links.

# 3. Things that run with NO sibling dependency (all verified live, wave 69):
python3 crossimpl/py/selftest.py      # 36 assertions over the Python LAYER 0 -> SELFTEST PASS
node two_reader/selftest.mjs          # 54/54 negative controls, 0 escapes, exit 0

# 4. The A2UI live mirror (browser demo; ES modules refuse file://):
python3 -m http.server 8123           # then open http://localhost:8123
```

No credentials, no network, no API keys anywhere in the repo's own lanes.
The tavern (situations/) used DeepSeek and Moth gateway calls historically;
those run through the operator's own env keys and are NOT required to verify
anything here — the receipts (cache_economics_*.json, guest_rows_*.jsonl)
are the proof those runs happened.

## Reading order (paths, not vibes)

1. `SPEC.md` — the canon. Read fully: the byte layout, the Ψ table, LAYER
   0/1/2, the priced claims C1–C5, the fleet additions.
2. `qthe.mjs` — the 266-line reference kernel. The header's interpretation
   receipts R1–R7 are the real spec of every choice SPEC.md left open.
3. `tests/run_tests.mjs` header — the pre-registered gates G0–G6 with their
   predictions; note the preserved G4 honest-FAIL + G4-P2 post-hoc pattern.
4. `crossimpl/findings.md` + `crossimpl/AMBIGUITY.md` — an independent
   Python re-derivation from the SPEC alone: 10,272/10,272 byte-exact, and
   the three seams (F1–F3) that live outside the specified surface.
5. `fixedpoint/findings.md` — the no-floats plane (R8): P-B1 falsified on
   adversarial rational sigmas, breach "closed with measured cost".
6. `two_reader/verdict.md` — the reverse-direction reader over crab-traps
   chains: 9/9 verdicts, 49/49 rows, 54/54 negative controls.
7. `situations/eq12_verdict.md` — the latest arithmetic verdict (10/10,
   Brier 0.00167) and the honest re-parked cascade half.
8. `docs/KNOWLEDGE-MAP.md` — the index of everything deeper.

## The things that will bite you (gotchas)

- **The gate suite needs the `quilt-stone` sibling repo.** Without it,
  `node tests/run_tests.mjs` and `node crossimpl/conformance.mjs` refuse
  (this is fail-closed honesty, not breakage): stone provides canonicalJSON,
  sha256Hex and the stone-v1 chain sealer. `tests/receipt.json` is the
  sealed green run of record.
- **G4 fails by letter forever, on purpose.** The run-1 header had a
  hand-arithmetic error (row1 re = 7*5 = 35, not 14). House law: never
  rewrite a registered gate — the FAIL stays, and G4-P2 checks the corrected
  literal. Do not "fix" G4.
- **`tick()` never draws randomness.** `mulberry32` is for CALLERS only
  (substrate seeding). Any experiment that breaks this voids itself
  ("determinism or it didn't happen").
- **Wormhole reads are LIVE, writes are for the next tick.** R2/R4: the
  grid updates synchronously from a pre-tick snapshot, but the wormhole
  table is read live in row-major order, last-writer-wins per slot, and a
  cell never resonates with its own write. Same-d twins mutually resonate
  from their second co-tick — the exact schedule is pinned in G5.
- **Timbre is frozen inside tick.** Only injectors (caller code) change τ;
  the update rule moves `d` only. This is what keeps paired arms clean.
- **Serialization:** use `traceView()`, never `JSON.stringify` on the
  substrate — the named expandos (w, h, ticks, bytes, __wormholes,
  __scratch) ride the Uint8Array and must stay out of traces/hashes.
- **JS integer horizon is ±2^53 on the INPUT side** (F1): the kernel is
  exact inside Number but cannot receive integers beyond 2^53 (they round
  before LAYER 0 sees them). The Python cross-impl raises instead of
  masking (F3) and rejects ragged rows (F2) — over the specified surface
  the two agree byte-exact; the seams are documented, not patched.
- **The fixed-point plane is a different kernel:** `fixedpoint/qthe_fixed.mjs`
  (R8: S = 2^32 fixed sigma, `DEFAULT_SIGMA_Q = 6807362106`). It is
  trace-identical to the float kernel on every swept sigma EXCEPT
  adversarial rational sigmas engineered between the double and the
  quantized scale (1.6, 0.7, 2/3) — where the fixed plane is the faithful
  one and the float plane holds cell d by double-rounding artifact.
- **ES modules refuse file://** for the demo; serve over localhost.

## Where deeper knowledge lives

- Knowledge map: [docs/KNOWLEDGE-MAP.md](./KNOWLEDGE-MAP.md)
- Fleet journal: SuperInstance/superinstance-lab → worklog.md (grep 'qthe';
  wave-46/47 E-Q11 8/8 + E-Q12 10/10, wave-48 two_reader + push 43d741b,
  wave-50 jev-garden substrate, wave-66 decomposition with the live
  dog-food numbers)
- `receipts/` — stone-v1 chains e_q1…e_q10 (the experiment series' sealed
  chains); `experiments/outputs/` — per-experiment results + tip files
- `crossimpl/artifacts/` — the cross-implementation vectors, results,
  verdict, probe; `fixedpoint/receipts/` + `outputs/` — the no-floats run
- `tests/receipt.json` + `tests/receipts.jsonl` — the kernel gate run of
  record; `demo/smoke/` — the browser smoke with screenshots
- Siblings: `quilt-stone` (stone-v1 chain + canonical JSON; REQUIRED for
  the gate suite), `crab-traps` (the two-reader's counterpart),
  `jev-garden` (uses qthe as a LAYER-0 substrate), `MicroMoth-quilt`
  (quantum-wow drop-in target; receipt idiom shared)

## Current frontier (what is open right now)

- LAYER 2 claims C1 (gain-of-function), C4 (phase threshold), C5
  (self-repair) remain **open** in SPEC terms; C2/C3 were partially
  exercised by the gate suite and E-Q2's sigma sweep (sigma = monotone
  engineering knob), but the full pre-registered paired-arm programs are
  not discharged.
- The E-Q12 **cascade half is RE-PARKED** with a committed-byte receipt:
  a stable receding remnant (radius@256 = 64, deltaCount 1631 → 97)
  awaiting a well-posed formulation of the next lever.
- The full gate suite and cross-impl conformance require re-runs wherever
  `quilt-stone` is cloned beside this repo; the workspace copies are
  verified only for the stone-free paths (kernel, py selftest, two_reader
  selftest).
- Guest/tavern lanes (situations/) are operator-key-gated and therefore
  not re-runnable zero-shot; the sealed receipts are the evidence trail.
