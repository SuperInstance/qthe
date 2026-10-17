# DAY-1 — the outsider path (10 minutes, every command verified)

> Zero to "I saw a sealed receipt" without reading the corpus first. Every
> command below was executed on a clean clone while writing this document;
> outputs quoted are real. Prereqs: `git`, `node` ≥ 18, `python3` (optional),
> `cc` (optional). No build system, no package installs, no network beyond
> the clones.

## 0. Clone the two repos (the fleet layout) — 1 minute

```bash
git clone https://github.com/SuperInstance/qthe.git
git clone https://github.com/SuperInstance/quilt-stone.git   # sibling, beside qthe/
```

`quilt-stone` is the canonical receipt-chain module — qthe links it
read-only (`experiments/_stone_link.mjs` resolves `../quilt-stone/`) and
never forks it. Tests and experiments need it; the mirror and REPL do not.

## 1. See it live — 1 minute (zero dependencies)

```bash
cd qthe
python3 -m http.server 8080        # ESM needs http(s) in some browsers
# open http://localhost:8080  → the A2UI mirror
```

You are watching the real kernel tick at frame rate: pixel = cell, τ colors
the plane, purple blinks when the wormhole table answers. The HUD shows the
**live sha256 of the byte plane** — the same hash the receipt chains seal.
Below the grid (ORCH-9): the channel-split meters (re = Moore-8 accumulator
mass, im = twin-resonance mass), the 64-slot looking-glass strip, and the
wormhole event stream. Try: *Seed: twin worms* → watch two distant purple
worms resonate through the table; toggle *wormholes OFF* → the bridge dies,
the planes diverge (that's claim C2, live).

## 2. Drive it by hand — 2 minutes

```bash
echo -e "new 64 64 twins\nstep 10\nstats\nworm\nshow 8 8\nhash\nquit" | node scripts/repl.mjs
```

The REPL runs the same kernel via the same adapter the experiments use; the
hashes it prints are the numbers the gates seal. `help` lists everything;
`random 42` twice → identical hash (determinism, checkable by eye).

## 3. Run one sealed experiment — 3 minutes

```bash
node experiments/e_q13_c1_gain_of_function.mjs
```

This re-runs E-Q13 (claim C1: does packing timbre into the byte actually
buy anything?). You will see 20 trials, each a paired arm — the real kernel
(1-byte QTHE) vs an independent two-plane port (2 bytes) — then:

```
[e-q13] F0=true F1=true F2=true F3=true | median completion=8 | median gain=47.4026%
[e-q13] VERDICT: C1 LIVES — ...
[e-q13] chain ok links=25 tip=d852e6ac…
```

The run appended its trials to `receipts/e_q13_chain.jsonl` and re-verified
the whole chain from disk before writing (refuse-if-broken law).

## 4. See the receipt — 2 minutes

```bash
cat experiments/outputs/e_q13_tip.txt
node scripts/verify_all_chains.mjs        # every receipt chain, from disk
node scripts/probe_gate.mjs               # the mandatory gate: PG1–PG5
```

Expected: `ALL CLEAN :: 13/13 receipts of record verified from disk` and
`PROBE-GATE PASS` (stone re-verify, tip-pin, a tamper control that MUST be
refused, a 1000-tick determinism witness, resource bounds).

The scoreboard you just verified — every claim priced, every verdict with
its chain tip — is `docs/CLAIM-VERDICTS.md`. Two claims live (C1, C2),
three died honestly (C3, C4, C5), one stands definitional (C5′).

## 5. Where to go next

- **The canon**: `SPEC.md` (30 lines you already understand from the mirror).
- **The kernel**: `qthe.mjs` — 265 lines, header holds interpretation
  receipts R1–R7 (every ambiguity the SPEC left open, decided and priced).
- **The map**: `docs/KNOWLEDGE-MAP.md` → everything deeper, one line each.
- **Port it**: `crossimpl/c/` (C99, byte-exact) is the template;
  `docs/REPRESENTATION-LAW.md` is the porter's law.
- **The honest failures**: `fixedpoint/findings.md` (a falsified
  pre-registration kept standing), `situations/eq*_verdict.md` (guest-priced
  levers), `docs/CLAIM-VERDICTS.md` §C3–C5.

If anything on this page does not reproduce byte-for-byte on your machine,
that is a bug in the corpus, not in your setup — the whole point of the
house law is that a stranger's rerun is the final arbiter.
