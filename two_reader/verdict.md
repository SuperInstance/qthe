# 48-b · TWO-READER RULE, INSTALLMENT 2 — the qthe side reads crab-traps · VERDICT

**Lane:** wave 48, lane 48-b (subagent) · **Reader lives in:** `SuperInstance/qthe` @ main `0c36dd2` (this repo) · **Reads:** `SuperInstance/crab-traps` @ working tree `37c34bb`, each chain pinned to the commit that produced it · **API spend:** $0.00 (MOTH_KEY unused; every choice deterministic) · **Run:** 2026-09-28, receipts in `run_receipts/`

Installment 1 (crab-traps 47-b) walked 8 fleet chains with a walker written from the stone-v1 law. Installment 2 REVERSES the direction: this repo now hosts an independent reader that walks the **crab-traps repo's own receipt chains**, written from the law itself — zero code shared with the installment-1 walker, fleet-seeds walkers, or any crab-traps source (P5 static scan: imports of `reader.mjs` are exactly `node:crypto`, `node:fs`, `node:path`).

## Chain-shape honesty (read first)

crab-traps does **not** keep stone-v1 parent-link row chains natively — the fleet's wave-46 rollout already classified its two crab targets as `artifact+pre-registration-binding`. What crab-traps actually has is a **pre-registration binding chain**: predictions sealed before any call → results embedding `pre_registration.sha256` → verdict; receipts bound by byte digests and cross-field bindings. This reader enforces the **stone-v1 LAW over that shape**: every link is a sha256 over exact bytes, and the walker folds a real hash chain from genesis — `h_0 = sha256("CRAB-GENESIS-1")`, `h_i = sha256(h_{i-1} + ":" + bytes_sha256(row_i) + ":" + row_id_i)` — so the pinned tip pins **both row order and row content**, and any single-byte tamper in any row breaks the chain at that row (receipted below as 49/49).

## Chains verified (paths + pinned tips)

| chain | pinned commit | rows | tip (fold from genesis) |
|---|---|---|---|
| `crab45c` — 45-c live-reasoner registration/receipts (`worker/src/arena-scenarios-003-live-reasoner-{predictions,results}.json`, `-verdict.md`, `worker/src/receipts/45c/*` 16 files) | `e6f5ce3` | 19 | `f3ed1b63fbce6f8691353d43941746675d6202039c958ac3abb131f3118244aa` |
| `crab44a` — 44-a GAN-half (`-gan-{predictions,lures,results}.json`, `-gan-verdict.md`) | `fed1e98` | 4 | `0886f81d016c7ee1ca23fd2cbdaea663d43ff7cd4c7bfb687cf0e37a3c5709e4` |
| `crab46a` — 46-a live-chat seat-swap (`-live-chat-{predictions,results}.json`, `-verdict.md`, `worker/src/receipts/46a/*` 23 files) | `6bcc757` | 26 | `45812cffd99d9f8566789b71330b8784c0fa25c1a049e0090f82c6262ccb2b50` |

49 rows total; every row's bytes re-hash to its pin (fleet wave-46 pins reused verbatim where the fleet pinned them — 45c/44a predictions+results, moth fixture `ebc8a43d…`; the rest resolved by disclosed pre-run reconnaissance; git blob ids at every pinned commit verified byte-equal to the working tree before sealing).

## Verdicts on the pre-registered claims P1–P5

- **P1 — PASS.** All 49 rows re-hash to their pinned digests; every registered binding check holds: embedded `pre_registration.sha256` == recomputed predictions digest (45c, 44a, 46a); `whitening.order_sha256` == `sha256(JSON.stringify(step4_fisherYates.selected))` over the actual 96-element array (canonicalization re-derived independently at recon); `selected` is a permutation of 0..95; `order_first12` constants; `46a-registration-receipt` binds predictions sha + byte length; all 15 usage rows (5×45c + 10×46a) bind to their per-call request/response receipts (call_no, attempt, usage block deep-equal, model, `finish_reason` vs `choices[0].finish_reason`, `requested_model` vs `request.model`, `batch_size`); verdict content constants present; tips match the pins (receipts `run1-*.json`).
- **P2 — PASS.** Full tamper sweep: one flipped byte in **every one of the 49 rows** → reader exits non-zero with `first_failure.row_index == tampered row` in **49/49** cases (`self-test-receipt.json`, S1).
- **P3 — PASS.** Two official runs, byte-identical receipts after normalizing the single declared wall-clock field `run_at` (raw diff is exactly line 4, the `run_at` line, in all three chains; `p3-compare` inside `official-run-receipt.json`).
- **P4 — PASS.** Missing row file fails closed at that row (S2); wrong `--expect-tip` on good bytes fails closed at the tip check (S3); tampered byte inside the `usage.jsonl` row-set row caught at the usage row's index (S4); unknown chain id fails closed (S5); a **mutated registration copy is refused outright** — the reader verifies the pin table's own seal (masked-self-sha + mtime binding) and refuses to walk against an unsealed/mutated pin table (S6).
- **P5 — PASS.** Static scan: zero non-`node:` imports; zero references to the installment-1 walker, fleet walkers, or stone modules.

**Self-test: 54/54 negative controls detected, 0 escapes.** Overall: **9/9 claim verdicts PASS (P1–P5 × {official-run, self-test} as registered), 3/3 chains verified, 49/49 rows, 49/49 tamper localization, 0 honest-FAIL standing.**

## Honest findings (receipted, not hidden)

1. **No native hash chain in crab-traps.** The repo's receipts bind by pre-registration sha embedding, not parent-link rows. The two-reader therefore pins row digests individually AND folds the rolling tip — the law (fail closed at a precise row) is enforced, and the tip makes the row sequence tamper-evident as a whole. Nothing was fabricated to make crab-traps look stone-v1-shaped.
2. **The crab repo cannot prove its own entropy provenance; the two-reader can.** `worker/src/receipts/45c/moth-raw-bits.txt` (257 bytes) is a dead-end sample of the FAILED fresh QPU fetch (both attempts error: "no usable output.random.hex"). The whitening actually consumed the **archived 42-b fixture** (4,848 bytes, `ebc8a43d…`), which does not exist in the crab repo. The qthe reader cross-checked the fleet archive copy byte-for-byte (sha + length, `--moth-fixture`): **PASS** — the 45-c whitening provenance is verified from qthe against bytes crab-traps itself does not hold.
3. **Cross-chain interlock verified.** 46-a's `order-reuse-receipt` and `results.order_reuse.order_sha256` equal 45-c's `whitening.order_sha256` (`5f86bcd3…`) — the seat-swap's "only delta is the seat" comparability claim now has an independent qthe-side receipt.
4. **Registration re-seal #1, disclosed.** Pre-run QA smoke (not an official run) caught a row-numbering defect in `crab46a` (`call-01-request` double-registered at index 3, row 23 missing). Indices are bookkeeping only — no pin digest, tip, claim, or check changed; tips recomputed and byte-identical (the fold is index-independent). Fixed and re-sealed; seal #2 (`mtime 2026-09-28T04:05:39.331Z`) predates both official runs (04:08:41Z). Recorded in `registration.json → registration.reseal_history`.

## What would falsify this verdict

Any single byte in any of the 49 rows (detected at that row — proven by sweep), any mutation of the pin table (seal refusal — S6), any missing row (S2), any wrong tip (S3), or a run whose receipts differ beyond `run_at` (P3).

## Artifacts

`two_reader/reader.mjs` (the independent walker) · `two_reader/registration.json` (pre-registered claims + pin table, sealed pre-run) · `two_reader/run.mjs` (official runner) · `two_reader/selftest.mjs` (negative controls) · `run_receipts/{run1,run2}-crab{45c,44a,46a}.json`, `run_receipts/official-run-receipt.json`, `run_receipts/self-test-receipt.json`.

*Honest limits: the reader verifies the crab working tree against pins resolved at pinned commits (git-blob-verified stable); it does not re-fetch from the network (no token in this environment, per house rule commits queue locally). The tip fold is qthe-side law, not a crab-traps-native format — declared, not hidden.*
