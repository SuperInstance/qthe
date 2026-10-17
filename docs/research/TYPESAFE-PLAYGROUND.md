# TYPESAFE-PLAYGROUND — the living register of novel TypeSafe/Jev API findings

> Standing register opened at ORCH-R12 registration. The founder's
> mandate: playground work and experimentation geared toward NOVEL
> findings about what the typesafe.ai API can do. Every entry is
> LAYER-tagged the house way and cites its receipt. The orchestrator
> verifies before an entry counts; unverified observations live in the
> lane worklog fragments until promoted. Companion docs:
> `docs/research/JEV-COOKBOOK-PATTERNS.md` (the 20-cookbook deep-dive),
> `situations/MODEL-LEARNINGS.md` §5 (the grounding-gap law, r10-priced),
> `situations/jev_judge.py` (the integration of record).

## Entry format

```
- [LAYER] date · finding (one line) · receipt: file:line or call_id · verified-by
```

L0 = documented-and-reproduced (docs say it, we ran it).
L1 = mechanism-reproducible (we observed it, byte-replayable rows).
L2 = practical/economics claim (priced from receipts).

## Entries

- [L0] 2026-10-18 · API shape confirmed live this session:
  `POST https://api.typesafe.ai/v1/systemone`, Bearer auth, typed
  question map {noul|choice|score}, answers carry
  probabilities/confidence/noul · receipt: situations/jev_judge.py
  header + canary pattern; served model attributed from response
  (jev-1.13.0 at r10) · verified-by: orchestrator re-verification
  this session (docs fetch + key presence; canary re-run pending in
  T3-a).
- [L1] 2026-10-18 · DeepInfra OpenAI-compatible chat completions expose
  cache telemetry in `usage.prompt_tokens_details.cached_tokens` +
  `cache_write_tokens` and `estimated_cost` per call — the fields the
  tavern's cache-economics files price · receipt: this session's
  verification call (deepseek-ai/DeepSeek-V4.1-Flash, 200 in 2.2 s,
  11 prompt tokens, 2 completion, $0.0000024, cached_tokens 0) ·
  verified-by: orchestrator, live call. (DeepInfra-side, logged here
  because the playground's cost discipline depends on it.)
- [L1] 2026-10-18 · 181 models live on DeepInfra; all eight tavern
  seats confirmed present in the list, including the three
  cache-discount seats and the devil's advocate · receipt: orchestra
  models-list snapshot (tavern seats cross-checked against
  situations/MODEL-LEARNINGS.md) · verified-by: orchestrator.

## Pending (lane fragments, not yet promoted)

(none yet — lanes append through the orchestrator)
