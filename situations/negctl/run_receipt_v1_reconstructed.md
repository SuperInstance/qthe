# negctl v1 run receipt — AS-RECONSTRUCTED (ORCH-R14)

The lane's verbatim 23/28 run log was overwritten on disk before the
milestone-2 commit: the orchestrator's first post-fix proof attempt hit the
harness's own fail-closed pre-flight (suite-consumed files dirty vs HEAD) and
the harness — correctly — rewrote its receipt file with the refusal. That
refusal is what got committed as `run_receipt.txt` (and it is itself a live
receipt that the pre-flight works). The clobber is receipted here, not hidden.

Reconstruction sources (all committed):
- `wl_T5c.md` (the lane's worklog fragment): "exit code 1 (honest: survivors
  exist), 28 sabotages, 23 DETECTED, 5 SURVIVED, every restore GREEN, ~39 s,
  zero network, zero LLM, zero git writes" at repo HEAD 17465d6.
- `negctl.md` (the lane's 28-row table, committed intact at 7c17a07): the
  per-sabotage results including the five SURVIVED rows.
- The orchestrator's own pre-fix verification run (same 23/28 result class,
  same five SURVIVED lines, exit 1) — quoted in the round worklog.

## v1 summary (reconstructed from the sources above)

```
TOTAL    28 sabotages    23 detected    5 survived    exit 1 (survivors exist)
```

The five v1 survivors (clause -> sabotage id):
1. verify_all_chains content-tip pin was PRESENCE-only (promised recompute
   never implemented) -> V6-content-tip-flipped
2. tip agreement for stone chains was not a verify_all_chains clause at all
   (never reads <gate>_tip.txt) -> V8-stone-tip-flipped
3. PG2 `continue`s on ABSENT tip files -> P3-stone-tip-deleted
4. PG4's t%100 sampling grid (period-2 phase-locked perturbation invisible)
   -> P5b-kernel-oscillation-aliased (found LIVE by the control on its own
   first draft)
5. run_tests rewrites its own receipt chain; nothing pins the gate set ->
   R2-gate-block-removed

## Closure (v2)

All five were closed by the orchestrator per the falsifier law (fix before
trusting) — see the milestone-2 commit for the fix details. The closure proof
is `run_receipt_v2_closure.txt`: **28/28 DETECTED, 0 SURVIVED, exit 0** at
clean HEAD 331ae16, with four PREDICTION MISMATCH receipts (the pre-closure
SURVIVED predicts flipped to DETECTED — the mismatches are the closure's own
receipts) and one R2 crash-class finding (gate-block removal breaks the G4-P2
post-hoc indexing — the suite crashes loudly, which is correct noticing
behavior; detection-rule amendment receipted in the harness source).
