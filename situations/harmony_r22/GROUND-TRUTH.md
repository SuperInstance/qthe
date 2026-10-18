# HARMONY-r22 ground truth — sealed BEFORE any seat call (ORCH-R22/T13-c)

The operator's dispatch: "use [Groq] with rapid and cheap models to
experiment with wide abilities **in harmony** with the other tools like
the two typesafe.ai models and the new things people are doing with
them." This lane prices "harmony": the SAME battery, the SAME briefing,
three seat families, agreement + economics measured AS-SAID.

The battery: 6 statements about the E-Q20b burn-in ladder, sealed
minutes ago (chain e_q20b, tip 4aa12d65…, commit pending this push).
Ground truth derives ONLY from the sealed artifacts
(experiments/outputs/e_q20b_results.json + e_q20b_verdict.md); this
file is sealed before any seat is called.

| id | statement | ground truth |
| --- | --- | --- |
| S1 | The replay gate reproduced E-Q20's sealed values byte-exactly (hashes at t=64, the floor table, and the cross-arm medians all matched). | **TRUE** (30/30, 32/32, 64/64) |
| S2 | A3's Moore-8 distance crossed below the A1 noise floor at t=8 and stayed below the floor through t=512. | **FALSE** (dipped at t=8: 0.00298 vs floor 0.01342; re-excited to 0.0482 at t=16 and never returned below) |
| S3 | The shuffled control A3S's Moore-8 distance reached the floor at t=512 (the ladder's final checkpoint). | **TRUE** (0.025762 vs floor 0.025779) |
| S4 | The dW1 control was at or below the floor at every checkpoint from t=8 onward. | **FALSE** (excursions at t=8, 16, 32 for both A3 and A3S) |
| S5 | From t=128 through t=512, A3's Moore-8 distance plateaued around 0.030 — roughly 20% above the floor, not converging to it. | **TRUE** (0.0302/0.0298/0.0296/0.0299/0.0300/0.0301/0.0300 vs floors ~0.0250-0.0266) |
| S6 | The E-Q20b experiment spent 10 moth credits (one comet root plus five blur jobs). | **FALSE** (ZERO credits — journal replay only; the 10 credits were E-Q20's r21 spend) |

Scoring (frozen): a seat's answer per statement is TRUE / FALSE /
UNCERTAIN; accuracy = correct/6 (UNCERTAIN scores 0 on a TRUE/FALSE
ground truth); agreement = pairwise same-answer fraction; the seat
family cost = sum of row usd; latency = per-call elapsed.

The trap structure (registered): S2 tests the dip-then-re-excite
trajectory (the r21 "converging monotonically" reading is exactly what
S2 asserts — and it is FALSE); S6 tests provenance attention (E-Q20
spent the credits, not E-Q20b).
