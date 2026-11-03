# fleet-wrangler · journal (append-only)

## G1-5 · cache-economics playbook + experiment matrix + key law · 2026-11-02 · GRADED A

- Brief: design (no live calls) the prefix-cache playbook, the decision-
  model synergy experiments, and the key-law procedure.
- Artifacts: work/G1-5/PLAYBOOK.md (225 lines), EXPERIMENT-MATRIX.md (106
  lines), KEY-LAW.md (79 lines).
- Orchestrator verification: no invented prices (all rates parameterized
  EST with canary ritual EST→MEASURED); experiment matrix carries kill
  criteria; grounded in live fetches (SPEC.md, MODEL-LEARNINGS.md,
  arena_r10_verdict.md, cache_economics_r11.json, TYPESAFE-PLAYGROUND.md);
  workspace secret-scan clean. Grade A.
- Learnings filed:
  1. The loop is the unit of economics, not the call — discounts only pay
     from turn 2 on a byte-identical prefix; seats are chosen by
     (discount × turns retained).
  2. Record the counterfactual (usd_if_no_cache) in every receipt — the
     cache game's value must be measured, not asserted; honest misses are
     telemetry (r11's provider-side misses were a real receipt).
  3. Pre-registration discipline transfers wholesale from experiments to
     model economics: hypothesis, arms, kill criteria — before any live
     call.
- Errata: none.
