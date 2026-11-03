# library-craft · journal (append-only)

## G1-2 · @qthe/core v0 API surface + op-log spec + critiques · 2026-11-02 · GRADED A

- Brief: full TS surface for @qthe/core; op-log format spec with hash
  recipe; three verified critiques of the current API.
- Artifacts: work/G1-2/api-surface.d.ts (741 lines), OLOG-SPEC.md (358
  lines, 10-op catalog, canary vector qth1:69d81dfc…), CRITIQUE.md (234
  lines).
- Orchestrator verification: tsc --strict clean (seat-run); both headline
  critiques re-checked against the kernel source and CONFIRMED —
  mulberry32 seed aliasing (2**32 wrap, silent) and σ-leak-into-permanence
  (lazy table constructor persists a one-tick override). Grade A.
- Learnings filed:
  1. A determinism contract enforced only in tests is a promise; enforced
     in artifacts (version-stamped, op-logged, replayable traces) it is a
     checkable fact. API design is where determinism becomes auditable.
  2. Verify every critique live against the real file before writing it —
     both confirmed findings came from running the kernel, not reading it.
  3. Four flags accepted by the Orchestrator: digest stamps decoupled from
     semver; seed collapsed into ops-at-0; compat synthesizes expandos;
     bytes-capture is the honest ladder for seedFns.
- Errata: none.

## G2-7 · API v0.1 + the code-comment law · 2026-11-02 · GRADED A

- Brief: fold the four adjudication flags + RC-05 split into api-surface
  v0.1; write CODE-COMMENT-STYLE.md from the principal's comment directive.
- Artifacts: work/G2-7/{api-surface-v0.1.d.ts (1,219 lines),
  CODE-COMMENT-STYLE.md} + probe receipts (_verify/tsc-verify.log).
- Orchestrator verification: tsc 5.6.3 --strict --noEmit exit 0 against
  two usage files. The σ-leak fix exceeds the order: TickOptions DELETED —
  σ/wormhole-gate change only via journaled setOptions ops (the leak is
  inexpressible); OLOG §4 rule 5 retracted with a dated marker. Compat
  typed from FRESH probes (structuredClone drops `bytes` too — all
  expandos optional). LegacyTwinEvent typing corrected. Grade A.
- Learnings filed:
  1. Type honesty needs fresh receipts, not remembered ones: memory of a
     receipt is a rumor; the probe is the receipt.
  2. The strongest API fix for a footgun is deletion — make the hazard
     inexpressible, don't document around it.
  3. The next-agent test (an optimizing agent reading only this file must
     reconstruct the decision lattice) is the review gate that makes every
     comment rule enforceable.
- Errata: none.

