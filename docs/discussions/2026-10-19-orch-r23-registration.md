# ORCH-R23 Registration — the embedding round

Filed 2026-10-19, before any work, orchestrator (Z.ai), erised fleet line.
Operator's dispatch this round: "experiment with the various tools in
synergy and harmony with typesafe.ai; you have vectorization and
embedding and rapid calls etc, try things you haven't tried and you
don't think anyone really has experimented with with JEV and other
models and workers working together… challenge your agents every round
to think in novel ways about typesafe.ai differently than before…
document well as you go." Creative breaks between rounds, and teach
the subagents to take them too.

## Where the frontier actually is (read-the-record first)

HEAD `7980577` = origin/main (fetch-first held; the parallel incarnation
quiet since r22 close). All batteries green (41/41 chains, probe gate
links=34, 33/33 claims, 22/22 coverage, guard PASS, negctl 28/28, ALL
LIVE CHECKS PASS at build `r20-docket1`, CI green). Tavern 12 seats.
Scoreboard: C1/C2 LIVES, C3/C4/C5/C9/C10/C11 DIES, C5′ STANDS; C6/C7/C8
priced at LAYER 2. Standing r22-registered candidates: panel-diversity
claim; relay relocation; e_q20b chain to the R2 mirror; E-Q20c plateau
mechanism; gpt-oss agentic surface. Gift PRs open/unanswered; seedbox
unchanged.

## Why this round (the deep think, receipted)

The operator's phrase — "vectorization and embedding and rapid calls" —
names a composition the fleet has never attempted and that, as far as
the record shows, nobody has: **the systemone typed question map used
as an EMBEDDING FUNCTION.** The API's `score` type maps a level-rubric
to a continuous score; a FIXED battery of K probe questions over a
corpus of records therefore produces a K-dimensional vector per record.
K=8 interpretable semantic axes, ~40× smaller than a bag-of-words
space, carried through one batched call per record (the batching law).
Those vectors then live where the operator pointed: **Cloudflare
Vectorize** (the account already runs two indexes; a third is free
tier). The novel questions, priced as claims:

**C14 (candidate): the question map is an embedding.** A fixed 8-probe
score battery over 20 sealed records, answered by jev, yields a vector
space in which top-1 nearest-neighbor retrieval groups same-family
records above both the majority-class baseline and a permutation null.
Falsifier: retrieval accuracy ≤ majority baseline, or incomplete rows,
or the repeat-stability tolerance breached without receipt.

**C15 (candidate): cross-embedder robustness.** The same probe battery
through both Groq seats (the Actions route) produces embeddings whose
retrieval accuracy is within one family-error of jev's, with structured
per-axis divergence (the harmony finding, extended from answers to
embedding spaces).

**E-Q20c (registered separately): the plateau-mechanism ablation.**
E-Q20b sealed a metastable plateau ~16–20% above the floor through
t=512. Mechanism question: is the wormhole twin channel the correlation
reservoir, or the local Moore-8 coupling? Ablation: the SAME arms and
ladder with `tick(sub, {wormholes:false})`, zero credits. H1c: OFF
plateau ratio (mean dist/floor over t∈{256..512}) ≥15% below ON → the
twin channel carries the memory. H0c: within plane-bootstrap noise →
the reservoir is local.

## Lanes (registered before any run)

- **T14-a E-Q21** — the question-map embedding (typesafe embedder from
  the sandbox, batched per record, explicit-loop questions map — the
  r22 guard law; Vectorize index `qthe-jev-embed` dims 8 metric cosine;
  retrieval eval vs majority/permutation/BOW-cosine controls; repeat-
  stability probes; chain `e_q21`).
- **T14-b E-Q20c** — the wormholes-OFF burn-in ladder (zero credits;
  chain `e_q20c`; the F0'' gate re-derives E-Q20b's ON values
  byte-exactly; manipulation check: twinRate ≡ 0 under OFF).
- **T14-c the novel-ideas battery** — the operator's "challenge your
  agents" instruction made standing: every seat family asked for ONE
  novel typesafe.ai experiment this fleet has not tried, AS-SAID; the
  best registers as an r24 candidate.
- **T14-d the small deploys** — e_q20b chain to the R2 mirror (C7);
  the relay relocation probe (Smart Placement check).
- **T14-e creative + doctrine** — the round's piece (a new form: a
  glossary) + `docs/CREATIVE-PRACTICE.md` (teaching the subagents the
  break discipline, per the dispatch).
- **T14-f watch + docs + sweep** — PRs, seedbox, CI; verdict-recompute
  claims for the new chains; probe gate; guard; negctl; fleet seeds
  (the registry-edit law); dashboard; README r23; round report;
  MODEL-LEARNINGS.

## Budget (committed before any spend)

- LLM: **$0.08 hard cap** (typesafe ~23 embed calls + 2 idea calls;
  Groq 40 embed calls + 2 idea calls via Actions; MiMo 1 idea call).
- Moth: **0 credits** (no quantum lane this round).
- Cloudflare: free tier (one new Vectorize index; R2 object put; no
  Worker redeploy unless a lane demands it).

Fail-closed laws carried: any 401/403 writes a labeled receipt and
stops the lane; the E-Q21 ground truth (family labels + probe rubric)
seals BEFORE any embed call; the E-Q20c ON-gate mismatch VOIDS LOUD.
