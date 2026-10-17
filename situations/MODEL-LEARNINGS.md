# MODEL LEARNINGS — the tavern's operating manual for its seats

> Living document (update every round). What the house has PAID to learn
> about each seat: latency, budget needs, output-contract reliability,
> strengths, failure modes, and the role each seat has EARNED. Priced from
> sealed rounds — receipts: `situations/cache_economics_r10.json`,
> `situations/cache_economics_r11.json`, `situations/arena_rows_r10.jsonl`
> (call ids cited inline), `situations/arena_rows_r11.jsonl`, adjudications
> `situations/adjudications_r10.json`. (Receipt pointers added ORCH-R11 per
> seed20mini's missed-attack: the table's claims cite their telemetry.)

## The seats, round-10 priced

| seat | $/audit | latency | budget needed | contract | earned role |
|---|---|---|---|---|---|
| **XiaomiMiMo/MiMo-V2.6-Flash** | $0.0012 | ~70 s | 6k ok (2.9k used) | direct JSON | **every-round workhorse** — best verified_new per dollar (6/6 at 1/13th Hy4's cost); 50× cache discount |
| **deepseek-ai/DeepSeek-V4.1-Flash** | $0.0018 | ~31 s | 6k ok (2.3k used) | direct JSON | **every-round workhorse** — 5/7 verified new, fastest of the quality seats; 33× cache discount |
| **nvidia/NVIDIA-Nemotron-3.5-Super-VL** | $0.0024 | 47 s (first attempt hung past 280 s once — transient, retry worked) | 6k ok (5.5k used, close to cap) | direct JSON | solid auditor; restates admitted gaps more than it finds new ones (3/7 new); near-zero cache discount (1.2×) |
| **ByteDance/Seed-2.0-mini** | $0.0023 | ~35 s | 6k ok (5.1k used) | direct JSON (severities typo'd `ajor`/`inor` — sealed verbatim) | **designated devil's advocate** (founder's call): expansive/creative, but r10 spent it restating admitted gaps — BRIEF IT TO ATTACK, not to audit, or it converges to the mean |
| **meta-models/Muse-Glimmer-30B** | $0.0056 | ~23 s | 6k ok (4.1k used) | direct JSON | fastest, but invented CLI flags (priced) — usable only with repo-verification downstream |
| **Qwen/Qwen3.6-35B-A3B** | $0.0045 | ~23 s | 6k ok (4.5k used) | direct JSON | hallucinated a mechanism (cache-eviction "breaking byte-determinism"); NO cache discount — skip unless a fifth opinion is needed |
| **tencent/Hy4-preview** | $0.0160 | ~40 s | 6k ok (5.6k used, close to cap) | direct JSON | **adjudicator, not draftsman**: 5/6 verified new incl. the falsifier that predicted the registry-drift class — but 13× MiMo's cost; 20× cache discount |
| **inclusionAI/Ling-3.1-flash** | $0.0171 (2 calls) | 48 s then 92 s | **runaway reasoning: 6k AND 12k both exhausted, finish=length ×2** | FAILED ×2 | unseatable as an auditor at current budgets; its sealed reasoning (46k chars) held the round's deepest meta-finding — mine reasoning-class calls from it only with ≥24k budgets or a reasoning-cap formatter |

## Operating rules learned (r10, priced)

1. **Budgets:** 6,000 max_tokens is adequate for 3–7-finding JSON audits on
   every seat EXCEPT Ling (runaway) and borderline for Nemotron/Hy4 (5.5k
   used). For harder tasks: give Hy4 8k, Nemotron 8k, Ling ≥24k or skip.
2. **Latency:** plan 30–75 s per audit call; Nemotron occasionally hangs
   (one >280 s transient observed — the harness backoff + resume-by-call_id
   law makes retries free: just re-run the same command).
3. **Cache game:** single-call-per-seat rounds cannot hit cache (each
   model's first call is cold). The discount table prices MULTI-call rounds:
   keep one seat across many short turns (draft→critique→revise) to cash
   its discount. MiMo (50×), DeepSeek (33×), Hy4 (20×) are the seats worth
   multi-turn gaming. Qwen (1.0×) and Nemotron (1.2×) never pay off
   cached.
4. **Sandbox lesson:** background `nohup` processes get reaped in this
   environment — run seats in foreground batches (resume law makes
   re-running safe and free of duplicates).
5. **The grounding gap (Jev judgment, r10):** a briefing-only judge (Jev
   1.13.0, batched, ~230 ms/seat) is excellent at severity + actionability
   triage with tight consistency, and NEVER flags hallucinated artifacts
   (0/40; it rated Qwen's hallucinated mechanism 4/4 verified_new). Judge
   layers triage; only repo-verification decides. Never let the judge layer
   replace the verification layer — the closed-room critique, receipted
   inside the tavern itself.
6. **Amendment law for guests:** a seat that fails its output contract gets
   ONE declared amendment at a higher budget (row carries `amendment_of` +
   note; both rows stand). Two failures = priced out of the round.
7. **r11 additions:** the two-turn structure works — turn-2 self-critique
   cashes the prefix cache (MiMo turn 2: 1,952 cached tokens, $0.000715;
   Hy4 turn 2: 1,792 cached; Seed and DeepSeek-V4.1 turn 2 drew no hit —
   provider-side, receipted in `cache_economics_r11.json`, honest telemetry).
   Seed under ATTACK-briefing produced 4 sharp findings + honest
   self-critique (its weakest-finding admission was correct) — the
   devil's-advocate framing is now the confirmed briefing for it. Harness
   lesson: never `.format()` a prompt containing literal JSON braces —
   `.replace()` only (r11 in-run fix, disclosed).
8. **Budget/latency table update (r11, n=2 rounds):** turn-1 attack runs
   came in 1.8–6.7k tokens at 8k budgets (Seed 6,712 — closest to cap;
   give it 10k+ for attack rounds), latencies 31–92 s; DeepSeek-V4.1-Flash
   remains the fastest quality seat (31 s / 1.8k out).
