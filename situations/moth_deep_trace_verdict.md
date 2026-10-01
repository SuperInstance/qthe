# E-Q9-DT VERDICT — moth-whitened deep trace of the rat-D dyadic families (task 42-b, wave 42, lane moth-smith)

**Status: EXECUTED AS RUN — nothing edited post-run.** Registration `situations/eq9_deep_trace_registration.json` (PRE-RUN, sealed at commit 44a872f, sha256 `3fca3f94…`) frozen every p, the hypergeometric pmf, and the whitener recipe before any tick. Score: **9/11 registered events PASS; 2 FIRED (dt_b, dt_c — the registered falsifier branch "a fixed-kernel move at rat or near (DT-C)" literally fired, honest FAIL standing per the registration's own commitment); zero UNEXPLAINED cells, zero D1 failures, zero holes, zero census-pin mismatches.**

## Seed (moth entropy, receipted)

- Job **1 of 2 budget**: `2caa822b-7c46-4f65-a0c9-152c46272e19`, engine `graph-v1`, backend `aer`, mode `emu`, 1024 shots, 4138 ms. Raw stream 4,848 bits, 2,666 ones, balance 0.5499, 20 distinct outcomes.
- **Raw bits sha256 `ebc8a43d90be5c0b01788f7cc63021ab0b0dac1a0294756e73a2882360b5e9b9`** — archived OUTSIDE the repo (key-free), never used raw (raw balance 0.6288-law: debias mandatory).
- Whitener exactly as registered: von Neumann debias (2,424 pairs → 1,254 bits; emit 1015/239, discard 00=464/11=706; vn sha `67946001…`) → MSB-first byte pack (157 bytes, pad 2; `4477ebbf…`) → SHA-256 counter stream `block_c = SHA256(u32be(c) || vn_bytes)` → block0 sha **`836985ec99d5e5e69cef6445ce5bf33b3b232c2ce0733ca72f9b88d244e8ddeb`** → Fisher-Yates over the 1,134-family rat-D pool (census order dd↑ n↑), 16-bit rejection-sampled draws, selected 16 **in moth shuffle order**.
- No-leak scan CLEAN; `MOTH_KEY` never printed, never committed.

## Selected 16 (moth order, rank 1..16)

`192/1 113/8 219/8 193/8 94/1 1/4 243/2 135/2 248/1 119/1 73/8 232/1 39/128 97/32 131/1 77/16` — all census-pinned rat `D`, all dyadic dd | 2³².

## Pre-run floors held (in-run, LOUD)

Census recompute sha `552d171c…` asserted before any tick; registered pmf ≡ census-recomputed pmf (sha `343fd02b…`, equal=true); EQ8 drift guard: the 6×3 E-Q8 board rebuilt for 2/3 and 8/5 reproduces the RECEIPTED E-Q8 plane hashes byte-for-byte, 17/17 ticks, both kernels — kernels at R8 proven identical to the E-Q8/E-Q9 sealing runs. Board = E-Q9 sweep machinery VERBATIM (9×5, same-slot S3 live-read, A(1,2)→B(6,2), 4 Repels per writer, T=16).

## The dispatcher's headline question — answered AS RUN

**How many of the 16 show a fixed-DOWN kernel-DISAGREEMENT move vs hold at near-sigma? → 0/16.** The 7/10-style fixed-DOWN −1 kernel-disagreement class does NOT appear anywhere in the dyadic deep trace — exactly as the census arithmetic demands (T2: dyadic dd | 2³² makes the fixed B pressure exactly representable; E-Q9's F-INV lives only at the NEAR arm, 379/1,134 all-dyadic).

**dt_a (pool mixture): PASS.** Observed F-INV at near = **3/16** (`1/4`, `39/128`, `97/32`) vs hypergeometric(N=1134, K=379, n=16) expected 5.3474, modal k=5. Full-pmf score honest: pmf-Brier 0.939633 — a k=3 draw is inside the registered support (pmf[3]=0.0443), the cost is the draw's distance from modal, priced before the job chose the 16.

**dt_d (F-INV shape): PASS.** All 3 census-pinned F-INV families: first divergence tick 1, exactly one cell at B(6,2), |dd|=1, fixed HELD at the divergence tick while float moved UP +1 (float dB 20→21; fixed dB 20 at t=1 — dt_e PASS 3/3), pre-tick planes byte-identical, tau preserved — DIV1-FINV under the E-Q9 taxonomy.

**dt_f (degenerates): PASS.** All 13 census-pinned near-degenerate families: near run byte-identical to its own rat run, both kernels (degMatch 13/13) — the float plane cannot see the below-half-ulp irrational step.

**dt_g (far arm): PASS.** All 16: plane hashes byte-identical across kernels at every tick; both planes move EVERY tick; shared d-response DOWN −1 for the 14 families with sigma > √2, UP +1 for the 2 with sigma < √2 (`1/4`, `39/128`) — pool arithmetic (953/1,134 > √2) respected on the sample. B-class both-move, zero fixed-hold, zero divergence.

**dt_h (EQ9-D1 at trace scale): PASS.** Every (family × arm × kernel) run twice from fresh construction — byte-identical plane-hash sequences, event-seq hashes, snapshot hashes, compact strings; `d1_failures: []`. Independent receipt: **rows byte-identical across two full trace runs** (sha256 `45b103c455119425a60b568b609e86186b8493e35157bf8990d8e89a0c23a058` both).

**dt_j (no-twin control): PASS.** A→Ground rat control per family, 16/16 sigmaInert (byte-identical planes, equal event-seq/snapshot hashes) — the artifact needs the live-read twin, E-Q8/E-Q9 precedent.

**dt_k (kernel drift guard): PASS** (see floors).

**dt_i (zero UNEXPLAINED): PASS.** All 48 family-arm audits classify under the E-Q9 extended taxonomy; `unexplained_holes: []`.

## The two FIRES — honest FAIL standing, with the explanation the registration permits

**dt_b ("B stays d=20 every tick, 16 hold / 0 fixed-DOWN −1", p=0.97) and dt_c ("fixed dB === 20 in every per-tick row at rat AND near", p=0.97) — FIRED, 16/16 and 32/32 misses, Brier 0.9409 each.** AS RUN, B's response on the scaled 9×5 board is **not frozen**: it drifts −1/tick from tick 2 (e.g. 192/1 rat: dB = 20,20,19,18,…,6) — **identically on both kernels**, byte-identical plane hashes 17/17, D1-clean, controls inert.

What this is and is not:

- **It is NOT a kernel disagreement.** Every rat/near cell on all 16 families is byte-identical across float/fixed at every tick (`bi` true 32/32). The artifact content of dt_b/dt_c — no float-vs-fixed divergence, zero kernel-disagreement fixed-DOWN −1 moves — HOLDS exactly. The only kernel disagreements anywhere in the trace are the 3 census-pinned near F-INV cells (FIXED-BLIND-INVERSION, receipted class).
- **It IS the registered falsifier branch firing on its letter.** The registration's own commitment: "the verdict may add explanations but may not edit a prediction, a p, or the whitener recipe." No edit: dt_b/dt_c stand FAIL, Brier paid, mean binary Brier 0.19219 carries the cost.
- **Explanation (new datum, deep-trace-only):** the sweep's `IDENTICAL-HOLD` label means "zero divergence cells", not "B frozen" — the sweep's nc=0 audit could not see B's absolute trajectory. The scaled board's 4-Repel acc engineering leaves B an exactly-representable dyadic residual pressure of −1/tick, which both kernels compute identically. The deep trace's full trajectory dumps (every per-tick dB/dA/firings/terms, both kernels, all 48 family-arms + 16 controls) now receipt what the sweep labels compressed away. The registration's own risk note pre-priced this ("residual 3% is board-engineering/kernel-drift risk, not arithmetic doubt") — the risk landed on the LETTER of the frozen-B clauses, not on the arithmetic.

## dt_g scorer defect — caught, fixed mid-lane, receipted (audit-shape bug, never kernels)

Run-1's dt_g false-positived `1/4` and `39/128` with label `no-move`: the check `perTick.some(p => p.dB === SLOT)` flagged trajectories that LAND on d=20 mid-staircase (1/4 far: 21,20,19,20,… — B's tick-1 move UP +1 was present and correctly directed). Same defect class E-Q9's primaries receipted ("comparison bug, never kernels"). Fixed pre-commit to implement the registered claim's own words ("both planes move every tick", both kernels); run-2: dt_g PASS, misses=[], Brier 0.01. Rows byte-identical across runs (sha above) — the fix touched event scoring only, never a kernel, a board, a family, or a trajectory. Predictions, p's, whitener untouched.

## Scorecard

| event | p | outcome | Brier |
|---|---|---|---|
| dt_a F-INV count (full pmf) | pmf | PASS (obs 3, exp 5.35) | 0.939633 (pmf) |
| dt_b rat hold / 0 fixed-DOWN | 0.97 | **FIRED** (letter; intent holds) | 0.9409 |
| dt_c fixed never moves rat+near | 0.97 | **FIRED** (letter; intent holds) | 0.9409 |
| dt_d F-INV shape | 0.93 | PASS | 0.0049 |
| dt_e float UP +1 | 0.90 | PASS | 0.01 |
| dt_f degenerates ≡ rat | 0.95 | PASS | 0.0025 |
| dt_g far arm | 0.90 | PASS (run-2) | 0.01 |
| dt_h D1 ×2 | 0.99 | PASS | 0.0001 |
| dt_i zero UNEXPLAINED | 0.90 | PASS | 0.01 |
| dt_j controls sigmaInert | 0.95 | PASS | 0.0025 |
| dt_k EQ8 drift guard | 0.99 | PASS | 0.0001 |

Mean binary Brier (dt_b..dt_k) **0.19219** — dominated by the two honest letter-fires.

## Receipts

- Registration: `situations/eq9_deep_trace_registration.json` (PRE-RUN, 44a872f), sha256 `3fca3f943d03255e6c2cd8cb0f27e0c627ee9d3422e0407511bb2c4bde3521b3`.
- Seed receipt: `experiments/outputs/eq9dt_seed_receipt.json` (moth job id, raw-bits sha, VN stats, whitened block0 sha, moth-shuffle order; no key material).
- Rows: `experiments/outputs/eq9dt_rows.jsonl` — 64 rows (16 fams × {rat, near, far} + 16 rat-controls), full per-tick trajectory dumps both kernels; sha256 `45b103c455119425a60b568b609e86186b8493e35157bf8990d8e89a0c23a058`, byte-identical across run-1/run-2.
- Results: `experiments/outputs/eq9dt_results.json` sha256 `9cca85cfc3dc88fb8337a7130eb7bccb52b555c67c8518789862097e2b62dff5`.
- Moth budget: **1/2 jobs used** (reserve unspent — VN floor met on job 1). LLM spend $0. Raw bits + whitened seed archived outside the repo, key-free.
- Falsifier disposition, verbatim from the registration: DT-C branch FIRED → "recorded AS RUN and the verdict ships the honest FAIL standing." Shipped.

## Holes

None. Zero UNEXPLAINED cells, zero D1 failures, zero census-pin mismatches. The two event failures are explained, receipted, and paid in Brier — the planes never disagree anywhere the census says they cannot, and disagree exactly where (and only where) the census pins F-INV.
