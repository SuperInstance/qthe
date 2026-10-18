# ORCH-R13 Lane T4-a — parallel-question batching falsifier: VERDICT

> Claim under test (cookbook 6.3, jev-1.12): all-questions-in-one-call vs
> one-per-call gives ~12x cost savings, ~10x latency savings, and "batching
> adds no noise". Every number below is re-derivable from the sealed rows
> (rows_arm_b.jsonl, rows_arm_s.jsonl, rows_docprobe.jsonl) + plan.json.

## Corpus + seeded draws (receipts)

- 10 guests = all 7 parseable r10 seats (40 findings, 120 questions) + 3 r11 turn-1 rows = 53 findings / 159 questions total.
- r11 seeded pick: endorsed seats sorted lexicographically [dsv41f, hy4p, mimov26f, seed20mini]; sha256(arena_rows_r11.jsonl) = `93c0de75db52d3414a0ccd5a8f98bf4bd75f03d9a2804e9d74ead7add9224524`; first hex digit `9` is out of the 0-3 range, read as 9 mod 4 = 1 (standard seeded-draw reading, receipted; the clamp reading 3 would give [seed20mini, dsv41f, hy4p]) -> picks **hy4p, mimov26f, seed20mini** (turn-1 rows; r11 rows carry one findings array per turn).
- Arm S stratified draw: 10 class + 10 actionable + 10 severity, exactly one of each type per guest (spread across all 10 guests); seed = sha256 of the newline-joined guest-qualified question-id list in corpus order = `49a7b7163620fc0453f87d1164c5fd198883055b5b668ae09c3cb63cd9c9a6bc`; draw = seeded shuffle of guests + seeded pick within guest. Full sample sealed in plan.json.
- Doc-dominated probe guests (3 r10 seats with most findings, ties lexicographic): r10-dsv41f, r10-nemotron35sv, r10-hy4p; singles = that guest's first finding's question of each type.
- Corpus-count discrepancy receipted: the lane brief/registration parenthetical listed r10 per-seat counts 6/5/6/3/4/5/4 (= 33) but the sealed rows hold 6/7/6/7/5/5/4 = 40 findings, matching the registration's own standing-state section ("r10 = 40 findings / 7 seats") and the brief's r10 arithmetic (120 questions). ALL findings of ALL 7 parseable seats were used per the operative rule; the registration's "35 findings -> 105 questions" was superseded by the actual 53/159.
- Briefing-length receipt: the r10 briefing constant (SYSTEM_PREFIX in situations/arena_deepinfra.py, prefix_sha256 5d44a0d1... byte-identical to what the r10 seats received) measures **8,882 chars**, not the registration's ~13k estimate. Used verbatim as the doc-state prefix.
- call_id namespacing receipt: arm-S and doc-single call ids carry the guest namespace (r13-bf-s-<guest>-<qid>-r<k>, r13-bf-d-<guest>-s-<qid>) because bare fids (F3__class) collide across guests.

## Falsifier evaluation

- **Batch-hostile count: 0/30** (threshold for OUT: >= 6/30).
- Batch-hostile questions: none. The largest arm-to-arm move was 0.030 (r10-seed20mini/F4__class) against a threshold of 0.043.
- Rule: |mean_B - mean_S| > 2*std_S, std_S floor 0.02 when the single-arm std is exactly 0. The floor NEVER fired: every sampled question had std_S > 0 (min observed 2*std_S = 0.0040).
- No label flips within either arm (argmax / 0.5-crossing / rounded-severity-level) on any of the 30 sampled questions, and no question's modal label differs between arms.

## Per-question mean/std table (30 sampled questions, both arms, 5 repeats each)

Tracked metric: noul = p(yes); choice = max probability; score = score/2. span = max-min over the 5 repeats. flips = repeats whose argmax / 0.5-side / rounded level differs from that arm's majority label.

| question | type | mean_B | std_B | span_B | flips_B | mean_S | std_S | span_S | flips_S | delta | 2*std_S_eff | hostile |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `r11-hy4p/F4__class` | class | 0.5500 | 0.0110 | 0.030 | 0 | 0.5660 | 0.0250 | 0.060 | 0 | -0.0160 | 0.0500 | no |
| `r10-mimov26f/F1__class` | class | 0.6440 | 0.0233 | 0.060 | 0 | 0.6360 | 0.0196 | 0.060 | 0 | +0.0080 | 0.0392 | no |
| `r10-musegl30b/F1__class` | class | 0.6160 | 0.0273 | 0.080 | 0 | 0.6280 | 0.0160 | 0.040 | 0 | -0.0120 | 0.0320 | no |
| `r10-nemotron35sv/F1__class` | class | 0.5240 | 0.0162 | 0.050 | 0 | 0.5440 | 0.0102 | 0.030 | 0 | -0.0200 | 0.0204 | no |
| `r10-hy4p/F6__class` | class | 0.6600 | 0.0276 | 0.080 | 0 | 0.6440 | 0.0185 | 0.050 | 0 | +0.0160 | 0.0371 | no |
| `r10-dsv41f/F2__class` | class | 0.7580 | 0.0214 | 0.060 | 0 | 0.7680 | 0.0117 | 0.030 | 0 | -0.0100 | 0.0233 | no |
| `r10-seed20mini/F4__class` | class | 0.5640 | 0.0287 | 0.080 | 0 | 0.5940 | 0.0215 | 0.060 | 0 | -0.0300 | 0.0431 | no |
| `r11-mimov26f/F2__class` | class | 0.7460 | 0.0102 | 0.030 | 0 | 0.7560 | 0.0102 | 0.030 | 0 | -0.0100 | 0.0204 | no |
| `r11-seed20mini/F5__class` | class | 0.4940 | 0.0233 | 0.060 | 0 | 0.5000 | 0.0335 | 0.090 | 0 | -0.0060 | 0.0669 | no |
| `r10-qwen3635b/F1__class` | class | 0.4840 | 0.0242 | 0.070 | 0 | 0.4820 | 0.0147 | 0.040 | 0 | +0.0020 | 0.0294 | no |
| `r10-hy4p/F4__actionable` | actionable | 0.8260 | 0.0049 | 0.010 | 0 | 0.8260 | 0.0080 | 0.020 | 0 | +0.0000 | 0.0160 | no |
| `r11-seed20mini/F4__actionable` | actionable | 0.8220 | 0.0040 | 0.010 | 0 | 0.8180 | 0.0040 | 0.010 | 0 | +0.0040 | 0.0080 | no |
| `r11-hy4p/F4__actionable` | actionable | 0.8380 | 0.0075 | 0.020 | 0 | 0.8380 | 0.0040 | 0.010 | 0 | +0.0000 | 0.0080 | no |
| `r10-nemotron35sv/F3__actionable` | actionable | 0.8100 | 0.0063 | 0.020 | 0 | 0.8060 | 0.0049 | 0.010 | 0 | +0.0040 | 0.0098 | no |
| `r10-mimov26f/F1__actionable` | actionable | 0.8620 | 0.0075 | 0.020 | 0 | 0.8640 | 0.0049 | 0.010 | 0 | -0.0020 | 0.0098 | no |
| `r11-mimov26f/F2__actionable` | actionable | 0.8540 | 0.0049 | 0.010 | 0 | 0.8560 | 0.0049 | 0.010 | 0 | -0.0020 | 0.0098 | no |
| `r10-musegl30b/F4__actionable` | actionable | 0.8340 | 0.0049 | 0.010 | 0 | 0.8380 | 0.0040 | 0.010 | 0 | -0.0040 | 0.0080 | no |
| `r10-seed20mini/F4__actionable` | actionable | 0.6500 | 0.0089 | 0.020 | 0 | 0.6500 | 0.0110 | 0.030 | 0 | +0.0000 | 0.0219 | no |
| `r10-dsv41f/F4__actionable` | actionable | 0.8220 | 0.0075 | 0.020 | 0 | 0.8260 | 0.0049 | 0.010 | 0 | -0.0040 | 0.0098 | no |
| `r10-qwen3635b/F4__actionable` | actionable | 0.8080 | 0.0075 | 0.020 | 0 | 0.8060 | 0.0080 | 0.020 | 0 | +0.0020 | 0.0160 | no |
| `r10-qwen3635b/F2__severity` | severity | 0.9380 | 0.0024 | 0.005 | 0 | 0.9430 | 0.0040 | 0.010 | 0 | -0.0050 | 0.0080 | no |
| `r10-seed20mini/F3__severity` | severity | 0.8340 | 0.0080 | 0.020 | 0 | 0.8390 | 0.0049 | 0.010 | 0 | -0.0050 | 0.0098 | no |
| `r11-seed20mini/F4__severity` | severity | 0.9350 | 0.0032 | 0.010 | 0 | 0.9390 | 0.0037 | 0.010 | 0 | -0.0040 | 0.0075 | no |
| `r10-dsv41f/F5__severity` | severity | 0.9130 | 0.0075 | 0.020 | 0 | 0.9120 | 0.0051 | 0.015 | 0 | +0.0010 | 0.0102 | no |
| `r10-musegl30b/F5__severity` | severity | 0.9750 | 0.0032 | 0.010 | 0 | 0.9720 | 0.0024 | 0.005 | 0 | +0.0030 | 0.0049 | no |
| `r10-mimov26f/F4__severity` | severity | 0.9350 | 0.0032 | 0.010 | 0 | 0.9340 | 0.0037 | 0.010 | 0 | +0.0010 | 0.0075 | no |
| `r11-mimov26f/F2__severity` | severity | 0.9590 | 0.0037 | 0.010 | 0 | 0.9570 | 0.0024 | 0.005 | 0 | +0.0020 | 0.0049 | no |
| `r11-hy4p/F3__severity` | severity | 0.9690 | 0.0037 | 0.010 | 0 | 0.9710 | 0.0020 | 0.005 | 0 | -0.0020 | 0.0040 | no |
| `r10-hy4p/F5__severity` | severity | 0.9490 | 0.0037 | 0.010 | 0 | 0.9450 | 0.0063 | 0.015 | 0 | +0.0040 | 0.0126 | no |
| `r10-nemotron35sv/F3__severity` | severity | 0.9120 | 0.0040 | 0.010 | 0 | 0.9110 | 0.0037 | 0.010 | 0 | +0.0010 | 0.0075 | no |

## Cost / latency ratios

**Compact state** (instruction + findings verbatim; aggregate over 10 guests, 50 batched + 150 single calls measured):
- cost ratio (full battery as singles vs as one batched call per guest): **7.41x** (per-guest 5.18x-9.38x, rising with question count)
- latency ratio (API time, sequential singles vs batched): **15.76x**
- per-call input-token ratio (single / batched): 0.442 — at compact state the QUESTION MAP is a large share of the bill (measured ~147 marginal tokens per question: the class instructions embed each finding's full text), so the single call is NOT dominated by the state and the ratio sits well below the naive N x.

**Document-dominated state** (full r10 briefing, 8,882 chars + findings; 3 guests, 3 batched + 9 single calls):
- r10-dsv41f (21 q): batched 8367 in-tok / 284 ms; single 5123 in-tok / 228 ms -> full-battery ratio 12.86x cost, 16.8x latency
- r10-nemotron35sv (21 q): batched 7575 in-tok / 253 ms; single 4589 in-tok / 246 ms -> full-battery ratio 12.72x cost, 20.4x latency
- r10-hy4p (18 q): batched 7649 in-tok / 258 ms; single 4866 in-tok / 230 ms -> full-battery ratio 11.45x cost, 16.0x latency
- aggregate cost ratio (full battery): **12.36x**
- aggregate latency ratio (full battery, API time): **17.7x**
- as-run 3-singles-per-guest ratio (no extrapolation): 1.85x (the honest floor: with only 3 of ~20 questions actually run as singles, the measured saving is capped near 3x; the full-battery numbers above extrapolate the measured per-single cost to that guest's actual question count — the registration's "measured at our actual traffic shape")
- N-scaling receipt: both ratios are bounded above by the questions-per-call N (a state-only bill would give exactly N x). The cookbook's 12.2x was at N=13 over a 53,777-char document (0.94x of N); our doc-dominated 12.36x is 0.63x of N (avg N 19.7) because the r10 briefing (8,882 chars) is smaller relative to the ~147-token-per-question map; our compact 7.41x is 0.47x of N (avg N 15.9). The 12x-class number is real but NOT a constant — it tracks state-chars-per-question.

**Secondary null check** (downgrade to state-shape-conditional if < 5x): measured doc-dominated cost ratio = 12.36x -> **above 5x, secondary null does NOT fire**

## r10 judge-round arithmetic (documented, no new calls)

- Sealed reality (situations/jev_judgments_r10.jsonl): 7 batched calls, 120 questions, 29283 input + 4102 output tokens, 1594 ms API time, $0.001230 at $0.042/1M in / $0 out.
- Counterfactual 120 single calls (state tokens from sealed usage minus N*146.7 measured marginal per-question tokens; per-single tokens from this lane's measured compact singles): 228349 input tokens, $0.009591, 27304 ms API time (147 s wall-clock with the 1 s inter-call gap vs 8.6 s batched).
- **r10 cost ratio: 7.80x; latency ratio (API): 17.1x.**

## Spend

- Total lane spend: **$0.022110** of the $0.05 ceiling (213 calls: 50 arm B + 150 arm S + 12 doc probe + 1 canary). Per-call breakdown: budget_receipt.json.

## Notable drift (top movers by |mean_B - mean_S|)

- `r10-seed20mini/F4__class` (class): delta -0.0300 (B 0.5640 vs S 0.5940, std_S 0.0215) | values B [0.61, 0.56, 0.58, 0.54, 0.53] | values S [0.62, 0.58, 0.6, 0.61, 0.56]
- `r10-nemotron35sv/F1__class` (class): delta -0.0200 (B 0.5240 vs S 0.5440, std_S 0.0102) | values B [0.55, 0.53, 0.52, 0.52, 0.5] | values S [0.55, 0.53, 0.56, 0.54, 0.54]
- `r11-hy4p/F4__class` (class): delta -0.0160 (B 0.5500 vs S 0.5660, std_S 0.0250) | values B [0.56, 0.53, 0.55, 0.56, 0.55] | values S [0.59, 0.6, 0.54, 0.54, 0.56]
- `r10-hy4p/F6__class` (class): delta +0.0160 (B 0.6600 vs S 0.6440, std_S 0.0185) | values B [0.62, 0.68, 0.7, 0.65, 0.65] | values S [0.65, 0.66, 0.61, 0.66, 0.64]
- `r10-musegl30b/F1__class` (class): delta -0.0120 (B 0.6160 vs S 0.6280, std_S 0.0160) | values B [0.58, 0.63, 0.61, 0.66, 0.6] | values S [0.61, 0.64, 0.61, 0.65, 0.63]
- No label flips within either arm on any sampled question.

## VERDICT

**BATCHING IS IN** (with the receipts below): 0/30 sampled questions batch-hostile (< 20% threshold), doc-dominated cost ratio 12.36x, latency ratio 17.7x.

