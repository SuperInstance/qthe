# negctl — sabotage negative controls for qthe's verifiers (ORCH-R14, lane T5-c)

> Doctrine (adopted from the fleet's `SuperInstance/negctl`): **a suite that
> cannot fail is not evidence.** Sabotage a port, require the suite to notice,
> restore. A suite that survives a sabotage is telling you nothing. One
> sabotage per CLAUSE. A sabotage that quietly becomes a no-op is the same
> disease — every `edit()` here fails loudly when its anchor stops matching.

- **Harness**: `scripts/negctl_qthe.mjs` (zero dependencies, Node only)
- **Run**: `node scripts/negctl_qthe.mjs` from the repo root (~39 s, zero network, zero LLM)
- **Receipts**: this file + `run_receipt.txt` (the harness output verbatim:
  baseline, per-sabotage DETECTED/SURVIVED with failing lines, restore runs)
- **Targets**: `tests/run_tests.mjs` (LAYER 0/1 gates G0–G6),
  `scripts/verify_all_chains.mjs` (chain-of-chains auditor),
  `scripts/probe_gate.mjs` (PG1–PG6)
- **Protocol per sabotage**: fresh workspace copy under `/tmp/negctl-qthe/ws/`
  (real files NEVER edited) -> ONE deterministic sabotage targeting ONE clause
  -> target suite must report MORE failures than its baseline (DETECTED) ->
  re-copy clean -> re-run -> require GREEN again. Baselines are receipted
  first and the control refuses to run if any is not green (fail-closed).
- **Exit code**: 0 only if every sabotage DETECTED and every restore GREEN.
  This run: **exit 1** — 5 sabotages SURVIVED, named below. That is the honest
  headline, not a harness failure.

## Baseline (receipted in run_receipt.txt)

| suite | verdict |
|---|---|
| `tests/run_tests.mjs` | GREEN — exit 0; the one FAIL line is the registered G4 letter-fail (prediction error, post-hoc vindicated by G4-P2) — the harness treats 1 as its baseline failure count |
| `scripts/verify_all_chains.mjs` | GREEN — exit 0, `ALL CLEAN 19/19 receipts of record verified from disk` |
| `scripts/probe_gate.mjs` | GREEN — exit 0, `PROBE-GATE PASS`, 23/23 claims recomputed |

Pre-flight receipts the repo state: `qthe @ 17465d631abc`, zero modifications
to any suite-consumed file (qthe.mjs, demo/, tests/, scripts/, experiments/,
receipts/, crossimpl/, fixedpoint/); concurrent-lane traffic (T5-a/T5-b in
situations/ + docs/) is receipted and excluded via a snapshot frozen once at
harness start, so mid-run drift cannot contaminate baseline-vs-sabotage
comparisons.

## The sabotage table (28 sabotages, one clause each)

| # | sabotage | suite | clause targeted | result |
|---|---|---|---|---|
| V1 | chain-row-payload-corrupt (e_q13 middle row `seed` 66010→66011, non-hash field) | verify_all_chains | stone verification from disk — payload tamper must break link hashes | **DETECTED** (BROKEN) |
| V2 | middle-link-deleted (e_q13 row removed) | verify_all_chains | link continuity / truncation | **DETECTED** (BROKEN) |
| V3 | forged-row-appended (fabricated result.trial, bogus row_hash) | verify_all_chains | seal authenticity (append-only) | **DETECTED** (BROKEN) |
| V4 | rows-reordered (two adjacent e_q13 rows swapped) | verify_all_chains | row ordering / implicit prev-hash linkage | **DETECTED** (BROKEN) |
| V5 | chain-file-deleted (receipts/e_q13_chain.jsonl) | verify_all_chains | registered chain existence | **DETECTED** (MISSING) |
| V6 | content-tip-flipped (e_q11_tip.txt hex char) | verify_all_chains | TIP-PIN for content-hash receipts ("recompute ... else just pin presence + tip") | **SURVIVED** — hole 1 |
| V7 | registry-entry-removed (e_q13 dropped from chain_registry copy) | verify_all_chains | registry completeness / stray enforcement (defect #7) | **DETECTED** (STRAY) |
| V8 | stone-tip-flipped (e_q1_tip.txt hex char) | verify_all_chains | tip agreement for stone chains (registration menu item) | **SURVIVED** — scope fact, see hole 2 |
| P1 | chain-tampered-PG1 (e_q7 arm string renamed) | probe_gate | PG1 every registered chain verifies from disk | **DETECTED** (FAIL PG1) |
| P2 | stone-tip-flipped (e_q1_tip.txt hex char) | probe_gate | PG2 tip file equals recomputed chain tip | **DETECTED** (FAIL PG2) |
| P3 | stone-tip-deleted (e_q1_tip.txt removed) | probe_gate | PG2 tip-pin, presence half | **SURVIVED** — hole 3 |
| P4 | verifier-lobotomized (stone copy `verifyChainFile` → always ok) | probe_gate | PG3 tamper control — a verifier that cannot say NO | **DETECTED** (FAIL PG3: TAMPERED CHAIN ACCEPTED) |
| P5 | kernel-nondeterministic (latched one-cell drift on 2nd construction) | probe_gate | PG4 twin-probe determinism | **DETECTED** (FAIL PG4) |
| P5b | kernel-oscillation-aliased (period-2 cell XOR phase-locked to t%100) | probe_gate | PG4 determinism, SAMPLING coverage | **SURVIVED** — hole 4 |
| P6 | kernel-slowed (makeSubstrate busy-wait 6.5 s ×2 ≈ 13 s) | probe_gate | PG5 resource ceilings (10 s / 512 MB) | **DETECTED** (FAIL PG5, elapsed 13114 ms) |
| P7 | registry-entry-removed (e_q13 dropped) | probe_gate | PG1 strays (defect #7 enforcement) | **DETECTED** (FAIL PG1) |
| P8 | claim-source-remapped (C1/E-Q13-gain → e_q14_results.json) | probe_gate | PG6 claim-to-chain mapping | **DETECTED** (claim MISMATCH on foreign data) |
| P9 | verdict-row-mutated (chain verdict.EQ13 `medianGainPct` 47.4026%→47.5026%) | probe_gate | PG6 data-vs-verdict-row agreement | **DETECTED** (FAIL PG1 hash + FAIL PG6 arithmetic — overlapping detection, receipted) |
| P10 | results-arithmetic-mutated (e_q13_results.json trials[0].gainStr) | probe_gate | PG6 data-vs-claims recomputation (results files are NOT hash-chained — PG6 is the only checker) | **DETECTED** (FAIL PG6) |
| R1 | fixture-literal-flipped (G4-P2 expected `re:35`→`34`) | run_tests | pre-registered literal comparison (gate must not be vacuous) | **DETECTED** (FAIL G4-P2) |
| R2 | gate-block-removed (entire G1 gate deleted from suite copy) | run_tests | gate coverage (suite re-seals its own receipt) | **SURVIVED** — hole 5 |
| R3 | kernel-psi-mutated (PSI[2] −1→1) | run_tests | G1 Psi map pinned [0,1,−1,'i'] | **DETECTED** (FAIL G1) |
| R4 | kernel-nextD-bounds-broken (returns 64 at pressure −1.585) | run_tests | G2 bounds invariance by exhaustion | **DETECTED** (FAIL G2) |
| R5 | kernel-nondeterministic (per-tick XOR from t=400 on 2nd 1000-tick run) | run_tests | G3 determinism seed-to-hash (per-tick witness) | **DETECTED** (FAIL G3) |
| R6 | kernel-vectorPass-sign-flip (Repel `re -=`→`re +=`) | run_tests | G4/G4-P2 split-channel exactness | **DETECTED** (FAIL G4+G4-P2) |
| R7 | kernel-wormhole-resonance-broken (write `|acc|+1`→`|acc|+2`) | run_tests | G5 pinned twin-resonance schedule | **DETECTED** (FAIL G5) |
| R8 | kernel-wormhole-flag-leak (+0.001 pressure on non-Abstain cells when OFF) | run_tests | G6-S2 / R7 law — flag must not leak into non-Abstain dynamics | **DETECTED** (FAIL G6, S2 identical:false) |
| R9 | demo-sha256-broken (K[0] 0x428a2f98→...99) | run_tests | G0 cross-substrate digest agreement | **DETECTED** (FAIL G0) |

**Totals: 23/28 DETECTED, 5 SURVIVED. Every restore run came back GREEN.**

## The survived holes (the honest headline)

Per the registration's falsifier, a sabotage the suite survives means the
suite is not evidence for that clause. These five are receipted for the
orchestrator as follow-ups — this lane did NOT fix any suite (fixing the
measured thing mid-measurement is the disease the doctrine exists to kill).

1. **V6 — verify_all_chains pins content tips by PRESENCE only.** The
   auditor's own comment promises "recompute sha256(JSON.stringify(summary))
   ... else just pin presence + tip"; the recompute half was never
   implemented. Flipping a hex char inside `experiments/outputs/e_q11_tip.txt`
   (or e_q12) keeps `ALL CLEAN`. Trust impact: the two content-hash receipts
   (E-Q11, E-Q12) are integrity-checked by nothing in this suite — a tampered
   tip file (or tampered tip + untampered presence) passes. Follow-up:
   implement the promised recompute from the results file's summary field, or
   pin the tip content as data in `chain_registry.mjs`.
2. **V8 — tip-content agreement for STONE chains is not a verify_all_chains
   clause at all (scope fact).** The suite never reads `<gate>_tip.txt` files;
   flipping `e_q1_tip.txt` survives it. The clause IS enforced one suite over:
   probe_gate PG2 catches the identical flip (P2 DETECTED). Receipted so the
   division of labor is on the record: as long as probe_gate runs wherever
   verify_all_chains runs (the T5-d CI runs all three), the fleet exposure is
   the *combination*, not this suite alone.
3. **P3 — PG2 `continue`s on absent tip files.** `if (!existsSync(tipPath))
   continue;` means DELETING `e_q1_tip.txt` evades the pin entirely (the gate
   reports PASS with one fewer compared chain and no signal). Presence is not
   enforced for stone-chain tips. Follow-up: pin the expected tip-file list
   (e.g. in the registry) and fail on absence, or compare against a
   registry-recorded expected presence.
4. **P5b — PG4 samples the plane only every 100 ticks.** A period-2 cell
   perturbation phase-locked to the `t % 100` sampling grid returns to the
   unperturbed byte at every sampled tick: the twin probe reports byte-
   identical checkpoint sequences for a kernel that is provably drifting
   between constructions. Found LIVE by this control (the first draft of P5
   oscillated and survived — the mismatch is receipted in run_receipt.txt;
   the step-perturbation rewrite P5 is DETECTED, and the oscillating variant
   is kept as its own receipt). Mitigating fact already on the record: the
   SAME kernel is caught by run_tests G3's PER-TICK trace witness (R5
   DETECTED), so the corpus is covered by the pair — but PG4 alone is not a
   per-tick witness. Follow-up: hash at a non-aliased offset (e.g. t % 97),
   or fold a per-tick running hash into the checkpoint list.
5. **R2 — run_tests rewrites its own receipt; gate coverage is unchecked.**
   Deleting the entire G1 block from the suite copy leaves a green run: the
   suite re-seals `tests/receipts.jsonl` with whatever gates ran (7 instead of
   8), nothing pins the gate count or the receipt tip (`experiments/outputs/
   G0-G6_tip.txt` does not exist, so PG2 skips it), and PG6's coverage law
   explicitly EXCLUDES G0-G6 ("the gate is its own checker"). A silently
   shrunk LAYER 0 suite stays green end-to-end. Follow-up: pin the expected
   gate-id set (a tip file checked by PG2, or an explicit coverage entry in
   verdict_recompute's registry instead of the exclusion).

Overlaps receipted (defense in depth, not holes): P9 trips both PG1 (hash)
and PG6 (arithmetic); V7/P7 trip the stray check in both auditors; R6 trips
G4 and G4-P2 (same clause, pre-registered literal + corrected literal).

## What this control establishes

- The **hash-chain core is live evidence**: payload tamper, link deletion,
  forged appends, reordering, missing files, unregistered strays, a tampered
  registry, and even a LOBOTOMIZED VERIFIER (P4) are all refused loudly by at
  least one suite — and PG3 exists precisely to catch the last one.
- **PG6 is the only thing standing between the corpus and silent results-file
  tampering** (P10: results files are not hash-chained; the claim recomputation
  catches a one-digit mutation) — and its claim-to-chain mapping (P8) and
  verdict-row agreement (P9) are live.
- **run_tests' pre-registered literals are not vacuous** (R1: flipping an
  expected literal fails the suite; R3–R9: seven distinct kernel defects are
  each caught by exactly the gate that owns the clause).
- The five survived clauses above are where the suites are NOT evidence, now
  on the record with mechanisms and follow-ups.

## House-law compliance

- Real repo byte-identical before/after: sabotage happens only in
  `/tmp/negctl-qthe/ws/` copies of a frozen snapshot; `git status` at close
  shows zero modifications to any suite-consumed file; only new untracked
  `scripts/negctl_qthe.mjs` + `situations/negctl/` from this lane (plus
  concurrent T5-a/T5-b traffic in situations/ + docs/, present before this
  lane started and outside its domain).
- Fail-closed everywhere: no-green baseline refuses to run; every `edit()`
  asserts a unique anchor and a real on-disk change (no-op disease); every
  restore must return to exact baseline; prediction mismatches are receipted,
  never smoothed over.
- One sabotage per clause; one target suite per sabotage run; workspace
  recreated clean per run (no cross-contamination).
- Zero network, zero LLM calls, zero git writes.
