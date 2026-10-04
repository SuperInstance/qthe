# qthe — Knowledge Map
> The index of indexes. Everything deeper, with one line each.

## In this repo

- `SPEC.md` — the canon: byte layout `[τ:2][d:6]`, Ψ table (Ground/Attract/Repel/Abstain-i), LAYER 0 algebra facts (bijection, bounds, split channels), LAYER 1 mechanism (wormhole table, Moore-8, determinism, A2UI), LAYER 2 priced claims C1–C5, fleet additions (stone-v1 receipts, determinism law, the tavern).
- `qthe.mjs` — the 266-line zero-dependency reference kernel; header holds interpretation receipts R1–R7 and the determinism contract.
- `tests/run_tests.mjs` — pre-registered gates G0–G6 (predictions in the header before the first run; G4 honest FAIL + G4-P2 post-hoc preserved); seals `tests/receipt.json` + `tests/receipts.jsonl` (stone-v1, tip `7e66ea21…`, 10 links, verified).
- `crossimpl/` — lane 34-e: Python re-derivation of LAYER 0 from SPEC alone; `py/qthe_layer0.py` (strict, raises on domain violations), `py/selftest.py` (36 assertions), `py/worker.py`, `py/verify_chain.py`, `conformance.mjs` (needs stone), `probe_exactness.mjs`, `AMBIGUITY.md` (A1–A10 chosen pre-peek), `findings.md` (10,272/10,272 byte-exact; F1–F3 seams; NC1/NC2 negative controls), `artifacts/` (vectors seed 0x5EED34E, byte-identical py/js results, verdict, probe), `receipts/crossimpl_chain.jsonl`.
- `fixedpoint/` — lane 34-b: the no-floats plane (R8). `qthe_fixed.mjs` (S=2^32, `DEFAULT_SIGMA_Q=6807362106`, no log2 anywhere), `conformance.mjs`, `probe_divergence.mjs`, `pre_registration.json` + amendment, `findings.md` (scoreboard F_A–F_E; P-B1 falsified on 1.6/0.7 via exact-zero families; breach closed with measured cost), `outputs/` (f_a…f_e, autopsy), `receipts/fixedpoint_chain.jsonl` (24 rows, tip `a7f7a552…`), `_stone_link.mjs`, `chain_tip.txt`.
- `experiments/` — E-Q1…E-Q12: `pre_registration.json` + amendments 1–3 + erratums; scripts (`e_q1_wormhole.mjs`, `e_q2_sigma_sweep.mjs`, `e_q5_armor_ring.mjs`, `e_q6_slot_collision.mjs`, `e_q7_checkerboard_cascade.mjs`, `e_q8_same_slot_probe.mjs`, `e_q9_sweep.mjs` + `eq9_family_census.mjs` + `eq9_deep_trace_moth.mjs`, `e_q10_armor_injector.mjs`, `e_q11_collapse_predicate.mjs`, `e_q12_kfamily_predicate.mjs` + evals); shared `_harness.mjs`/`_adapter.mjs`/`moth_client.mjs`/`_stone_link.mjs`; `outputs/` (results, tip files, `e_q12_flip_registry.json`, raw receipts).
- `receipts/` — per-experiment stone-v1 chains `e_q1…e_q10_chain.jsonl` (156 lines total).
- `situations/` — the tavern: `situations.jsonl`, guest rows r6–r9 (+ `raw_r9_keyed/`), `cache_economics_r6…r9.json` (+ keyed r9), eq9–eq12 predictions/verdicts/lever registrations, `moth_deep_trace_verdict.md`, guest scripts (`deepseek_guest*.mjs`).
- `two_reader/` — wave 48-b installment 2: independent reader over crab-traps chains; `reader.mjs` (node:-only imports, P5), `run.mjs`, `selftest.mjs` (54/54), `registration.json` (sealed pin table + reseal history), `run_receipts/` (official + self-test + per-chain), `verdict.md` (9/9 claims, 49/49 rows, 49/49 tamper localization).
- `demo/` — `a2ui.mjs` (mirror driver), `sha256.mjs` (pure-JS sha256, G0), `smoke/` (browser smoke checklist, 4 screenshots with sha256, `verify-hud-sha.mjs`, smoke.md with the tick-102 fixed-point finding).
- `index.html` — the A2UI live mirror (pixel = cell; HUD tick + trace sha256; wormholes ON/OFF toggle; zero deps, inline favicon).
- `scripts/reseal-registration.mjs` — reseal helper for mtime-bound registration seals.
- `docs/` — wave-69 documentation layer (this package).

## Pre-existing docs (before the wave-69 docs layer)

- `README.md` — 18-line identity card: the primitive, the honesty stance, pointers to SPEC/kernel/experiments/mirror, the tavern note.
- `SPEC.md` — described above; the single normative document.
- `crossimpl/AMBIGUITY.md` + `crossimpl/findings.md` — the ambiguity ledger (A1–A10, chosen before the kernel was opened) and the conformance report.
- `fixedpoint/findings.md` — the R8 representation law and the P-B1 falsification autopsy.
- `two_reader/verdict.md` — the reverse-direction reader verdict.
- `situations/eq9…eq12_verdict.md` + `moth_deep_trace_verdict.md` — the arithmetic verdicts of the guest-priced levers.
- `demo/smoke/smoke.md` — the browser smoke report (5/5 checklist, findings, screenshot hashes).
- Wave-69 additions: `docs/ONBOARDING.md`, `docs/USER-GUIDE.md`, `docs/DEVELOPER-GUIDE.md`, `docs/ENGINEERING-NOTES.md`, `docs/CTO-BRIEF.md`, `docs/KNOWLEDGE-MAP.md`, plus the Documentation routing section appended to `README.md`.

## In the fleet

- `SuperInstance/quilt-stone` — upstream dependency: stone-v1 chains, `canonicalJSON`, `sha256Hex`, `sealChain`/`verifyChainFile`; required by `tests/run_tests.mjs` and `crossimpl/conformance.mjs` (imported via `../../quilt-stone/stone.mjs` or a co-clone path). Absent from this workspace — the documented refusal is expected.
- `SuperInstance/crab-traps` — counterpart: the two-reader installment 2 walks crab-traps' pre-registration binding chains (45c/44a/46a; commits e6f5ce3/fed1e98/6bcc757) from qthe with zero shared code.
- `SuperInstance/jev-garden` — downstream: uses qthe as a LAYER-0 substrate (integer split-channel + wormhole blend) in its weaver/field stack (wave 50-b).
- `SuperInstance/MicroMoth-quilt` — sibling: quantum-wow is a named drop-in target for the same "honest wow" pattern; both share the receipt idiom.
- Substrate family (wave-66): `quilt-qcells`, `quilt-jepa`, `jev-quilt` — decomposed in the same pass; `download/decomposition-atlas/parts/substrate/qthe.json` holds the 22-part inventory with file:line evidence.
- `SuperInstance/fleet-seeds` — the registry/lessons ledger that recorded qthe's smoke verdicts (PASS 54/54 two_reader + 260/260 inline kernel; full suite NOT_RUN without stone).

## In the journal

SuperInstance/superinstance-lab → worklog.md, grep 'qthe':

- Line ~619 (wave 48): environment-regression recovery — remote already had E-Q11 8/8 + E-Q12 10/10 (qthe 0c36dd2); wave-48 commits queued locally (43d741b).
- Lines ~622, ~627, ~628 (wave 48, task 48-b): the two-reader installment 2 verdicts (ok:true, 3/3 crab chains, 49/49 rows re-hash, selftest 54/54 zero escapes, keyscan CLEAN); committed qthe 43d741b; the two-reader rule became BIDIRECTIONAL; $0.00 API spend for the lane.
- Line ~655 (wave 49): token re-arm; queued qthe 43d741b pushed direct.
- Line ~675 (wave 50): ecosystem recon — qthe described as "8-bit ternary hyper-embeddings (τ:2+d:6, integer split-channel)".
- Line ~677 (wave 50-b): jev-garden built with qthe as substrate (LAYER-0 integer split-channel + wormhole blend); cross-language mtime ns-precision pitfall receipted (seals bind sha+size+mtime-to-second).
- Lines ~1210–1213 (wave 66, substrate decomposition): qthe STUDIED (SPEC.md; qthe.mjs 266 lines line-by-line; interpretation receipts R1–R7; gates G0–G6 incl. the preserved G4 honest-FAIL erratum; two_reader negative-control verdict). DOG-FOOD: (a) node two_reader/selftest.mjs → PASS 54/54, 0 escapes; (b) inline kernel smoke → 260/260 after fixing the lane's own seed-reuse bug (disclosed); (c) full suite NOT_RUN — imports ../../quilt-stone/stone.mjs, absent; tests/receipt.json records the prior full green run (kernel sha ef9a3bba…). Side effect repaired: the selftest re-wrote its own self-test receipt (content restored to HEAD). HEADs pinned: qthe 6017f80.
- Line ~1220, ~1222 (wave 66): smoke verdicts — qthe PASS 54/54 + 260/260, full suite NOT_RUN (missing sibling); honest negative: workspace mtime normalization + qthe selftest auto-detected mtime-witness mode.
- Task IDs found: 47-a (E-Q12), 48-b (two-reader), 33-a (core-smith, owns qthe.mjs/tests/index.html/demo per the stone header), 34-b (fixedpoint), 34-c (browser smoke), 34-e (crossimpl porter-smith), 50-b (jev-garden), the wave-66 substrate task (line 1207).

## Receipts of record

- `tests/receipt.json` (+ `tests/receipts.jsonl`) — the kernel gate run of record: all_pass TRUE; G0 4/4, G1 256/256, G2 2304/2304 + 3840/3840, G3 1000/1000 + randHits 0, G4 FAIL (prediction error) with G4-P2 PASS, G5 exact schedule, G6 paired-arm separation; chain tip `7e66ea218978fc7de10dae1c26141a5530ed142ca54e9f6c0aa13a465bb1235d`, verified, 10 links; kernel sha `ef9a3bba…`.
- `crossimpl/artifacts/{py_results,js_results}.json` — byte-identical files (sha256 `d242f96d…`) produced by two independent serializers on two sides of a process boundary; 10,272/10,272 matched.
- `fixedpoint/receipts/fixedpoint_chain.jsonl` — 24 rows, tip `a7f7a55291575476ca5241cacf2233bbf7180d934797e62038970426d4a4f05b`; rows include the honest run A/B defects beside run C (append-only, never rewritten).
- `receipts/e_q1…e_q10_chain.jsonl` + `experiments/outputs/*_tip.txt` — the experiment series' sealed chains and tips.
- `situations/eq12_predictions.json` (sha `dea66269…`) + `experiments/outputs/e_q12_results.json` — 10/10 PASS, Brier P1–P10 0.00167, 254,520 triples, flip registry 3,546 (LOST 2,462 / GAINED 1,084), cascade half re-parked.
- `two_reader/run_receipts/official-run-receipt.json` + `self-test-receipt.json` — 3/3 chains, 49/49 rows, 54/54 negative controls, P1–P5 PASS × {official, self-test}.
- `demo/smoke/*.png` — four distinct full-page screenshots with sha256-pinned contents proving the live mirror's checklist.

## How to search further

```bash
# Every interpretation receipt and canon choice:
grep -n "R[0-9]" qthe.mjs | head -20
grep -n "^| C[0-9]" SPEC.md

# All pre-registrations and their amendments:
ls experiments/pre_registration* fixedpoint/pre_registration*
grep -l "FALSIFIED\|FAIL" fixedpoint/*.md tests/*.mjs experiments/outputs/*.json

# Chain tips to cite:
cat experiments/outputs/*_tip.txt fixedpoint/receipts/chain_tip.txt 2>/dev/null
python3 -c "import json; print(json.load(open('tests/receipt.json'))['chain'])"

# The guest/tavern provenance trail:
head -3 situations/cache_economics_r9.json situations/guest_rows_r9_keyed.jsonl

# Journal history:
grep -n "qthe" /home/z/my-project/worklog.md | head -40
```
