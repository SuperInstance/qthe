# ARENA R11 VERDICT — the fix audit, verified and priced

> Round 11: four endorsed seats (Hy4, DeepSeek-V4.1-Flash, MiMo,
> Seed-2.0-mini as briefed devil's advocate), two turns each — turn 1
> attacks the post-R10 fixes, turn 2 self-critiques. 8 calls, 8/8 contracted
> JSON, $0.046 total. The cache game cashed: MiMo turn 2 hit 1,952 cached
> tokens ($0.000715), Hy4 turn 2 hit 1,792; Seed and DeepSeek drew no hit
> (provider-side, receipted — honest telemetry). Ledger:
> `situations/arena_rows_r11.jsonl`; economics: `situations/cache_economics_r11.json`.

## The scoreboard

| seat | turn-1 findings | verified new | misstated | self-critique quality |
|---|---|---|---|---|
| **dsv41f** | 5 | **3** (seal-time gap; verdict-string residue; convention-not-mechanism) | 0 | sharp: named the self-modifying-code trap in its own fix sketch |
| **mimov26f** | 4 | **3** (curated-table class; Jev rows unadjudicated; erratum single-consumer) | 1 partial (missing-file IS checked — but the naming-escape residue it guessed at is real) | sharp: correctly identified its weakest finding; its fix-sketch repair caught the whitelist-void trap |
| **hy4p** | 5 | **2** (string-compare sweep demand; registry-is-trusted) | 2 (missing/typo'd-path entries ARE caught by existsSync; checker-mutation is the TCB problem, mitigated by the dual-side diff) | best self-critique of the round: caught its own F2 overclaim AND produced the license-copy missed attack |
| **seed20mini** | 4 | **2** (coverage growth; string-compare sweep) | 1 (missing-file claim false — existsSync checks exist in both PG1 and the auditor) | honest: admitted its weakest finding correctly; its missed attack (MODEL-LEARNINGS without receipts) was fair and got fixed |

**Consensus finding (all four seats, independently):** PG6's curated claims
table is another hand-maintained list — the defect-#7 class reintroduced at
the soundness layer. **Adopted as the coverage law:** every registered chain
must carry a curated claim or an explicit exclusion; a new experiment FAILS
PG6 until curated. First coverage run: 14 claims → caught e_q10 uncovered →
demanded and got its claim → **20/20 claims, 16/16 chains, ALL PASS.**

## What the round changed (all verified before landing)

1. **Seal-time registration law** (dsv41f critical, verified: appendAndVerify
   was registry-blind): `experiments/_harness.mjs` now REFUSES to seal into
   any chain not in `chain_registry.mjs`. Negative control: an unregistered
   seal is refused before any write. This also kills the naming-pattern
   escape mimov guessed at (a `foo.jsonl` chain cannot be sealed
   unregistered regardless of name).
2. **PG6 coverage law** (consensus): coverage accounting in
   `verdict_recompute.mjs`, tied to the registry; +6 new claims (e_q5
   no-self-repair, e_q6 LWW survival, e_q7 nu-firings, e_q15 null, e_q10
   injector-reproduce, e_q8 inert-controls) + 4 reasoned exclusions
   (G0-G6, crossimpl-py, crossimpl-c, probe_gate — circularity/gate-class
   reasons stated in-file).
3. **String-compare sweep CLOSED** (seed F3 / hy4 F3): the repo-wide grep
   found no further lexicographic-ordering instances — every other
   `JSON.stringify` comparison is array-equality determinism checking (no
   ordering semantics). Class contained; receipted here.
4. **Erratum-reading law** (mimov F4 / dsv F3, verified: zero current
   victims — only the erratum script, the budget, and this guide reference
   the wrong string): consumers of verdict rows MUST resolve errata;
   verdict_recompute is the reference pattern. Law landed in
   DEVELOPER-GUIDE.
5. **The adjudication artifact** (mimov F2 / dsv F4): judgments stay sealed
   AS SAID; `situations/adjudications_r10.json` now sits beside them with
   the repo-verified outcomes per seat (the machine-readable "repo
   decides"). Standing law: Jev triage is trusted; its artifact-existence
   and mechanism claims are not.
6. **Registry self-verification** (hy4 self-critique): the registry's own
   sha256 is pinned in the fleet-seeds entry and drift-checked by the
   dashboard builder — a registry edit that would legalize a forged chain
   fails the dashboard until seeds are re-emitted in the open.
7. **License-copy survival** (hy4 missed attack, adopted): `LICENSE` joined
   build_qthe_core's FILES copy list — a fresh extraction carries the grant.
8. **MODEL-LEARNINGS receipt pointers** (seed missed attack, fair): the
   seat table now cites its telemetry files; r11 learnings added (budgets,
   latencies, the .format() harness lesson, the confirmed attack-briefing
   for Seed).

## Priced against the seats (the verification layer earns its keep again)

- seed F2 and hy4 F1 claimed missing/typo'd registered chains go uncaught:
  **false** — PG1 and verify_all_chains both `existsSync` every registered
  path and fail loudly (the rename/delete falsifiers would FAIL the gate,
  not pass it).
- hy4 F5 ("edit the curated constant and PG6 passes wrongness"): partially
  mispriced — that is the trusted-computing-base problem every checker
  shares; PG6's mitigations are the dual-side diff (curated AND chain
  verdict rows), git history, and (since this round) the coverage
  accounting. Registered as the honest residue, not fixed by theater.
- mimov F3's rename escape: the specific falsifier fails (registry-side
  missing check fires), but the underlying residue (non-`_chain.jsonl`
  names escaping stray detection) was real — and is now dead via the
  seal-time law, which refuses seals by registration, not filename.

## Standing after R11

16 chains / 391+ rows ALL CLEAN; gate PG1–PG6 PASS with 20-claim coverage;
9 defects caught by the house's own discipline, zero silent failures; the
seal path, the gate, the registry, and the claims table now enforce each
other. The tavern's second round paid for itself twice: the fixes the seats
attacked got stronger, and the attacks that were wrong got priced against
their authors.
