# EMBEDDER-PRIOR-ART — where "JEV-as-embedder" sits in the published record (surveyed 2026-10-18)

> Research artifact, Task R24-RESEARCH, companion to `docs/research/DECISION-MODEL-TRENDING.md`
> and `docs/RESEARCH-DECISION-MODELS.md`. Method: 8 web-search queries (one returned
> nothing and was re-issued once), plus primary-source page reads (arXiv abstracts,
> GitHub repo pages) and direct curl verification of every cited URL (all returned
> HTTP 200 on 2026-10-18 unless noted). Star counts read from badge endpoints on the
> same date. House law unchanged: this is briefing-grade triage with verified
> sources, not a claim-by-claim audit of the papers' internals.

**The instrument being situated** (for readers without the R24 context): qthe embeds
each text by asking a fixed battery of **8 typed questions** to a typesafe.ai JEV
model — answers are either `noul` **calibrated probabilities** or `score` rubric
levels — and treats the 8 answers as an interpretable 8-axis vector. Vectors live in
Cloudflare Vectorize; retrieval measured **0.80 top-1 family accuracy** on the sealed
20-record corpus (E-Q22/C14 line). A **ternary quantization** ({-1, 0, +1} per axis,
median-centered) compresses each record to **16 bits** and retains retrieval signal at
**2.2–2.4× the majority baseline**. Project identity: **Quilt-Ternary
Hyper-Embeddings**.

---

## 1. The novelty check

### 1.1 The blunt answer first

**We are not first on the core mechanism.** Question-answering scores as embedding
coordinates exist in the published record, and the closest prior art is close enough
that any qthe claim must be narrowed carefully:

**QA-Emb — "Crafting Interpretable Embeddings by Asking LLMs Questions"**
(Benara, Singh, Morris, Antonello, Stoica, Huth, Gao; arXiv May 26 2024, NeurIPS 2024).
- Paper: https://arxiv.org/abs/2405.16714 · NeurIPS poster:
  https://neurips.cc/virtual/2024/poster/93720 · code:
  https://github.com/csinva/interpretable-embeddings (47 stars as of 2026-10-18)
  · PMC mirror (snippet shows ~22 citations):
  https://pmc.ncbi.nlm.nih.gov/articles/PMC12021422
- Abstract, verbatim load-bearing claims: *"We introduce question-answering
  embeddings (QA-Emb), embeddings where each feature represents an answer to a yes/no
  question asked to an LLM. Training QA-Emb reduces to selecting a set of underlying
  questions rather than learning model weights."* They use QA-Emb to predict **fMRI
  voxel responses** to language stimuli (language-neuroscience framing), beat an
  established interpretable baseline *"while requiring very few questions,"* and note
  *"QA-Emb can be effectively approximated with an efficient model"* (a distillation
  result).
- This is, in mechanism terms, the same object class as ours: prompt-time LLM QA
  scores → feature vector → downstream similarity/prediction. Microsoft Research +
  Berkeley + UT Austin authorship; it shipped 29 months before our R24 experiments.

**CQG-MBQA — "A General Framework for Producing Interpretable Semantic Text
Embeddings"** (Sun et al., arXiv Oct 4 2024).
- Paper: https://arxiv.org/abs/2410.03435 · OpenReview:
  https://openreview.net/forum?id=23uY3FpQxc (snippet shows ~16 citations).
- Contrastive Question Generation (CQG) produces **discriminative yes/no questions**
  automatically; a **trained multi-task binary QA model (MBQA)** answers them cheaply
  at scale instead of calling a live LLM per text. Abstract claims *"embedding
  quality comparable to many advanced black-box models"* and superiority over other
  interpretable text-embedding methods.
- Note their framing: *"Recent approaches have improved interpretability by
  leveraging domain-expert-crafted or LLM-generated questions"* — i.e., **this is
  already a small literature**, and I spot-checked only the two largest entries.
  Treat this doc's coverage as the head of the line, not the whole line.

### 1.2 What we are NOT first on (be precise when asked)

1. **LLM QA scores as embedding axes** — QA-Emb (above), May 2024.
2. **Question-set selection as "training" an embedder** — QA-Emb's central framing.
3. **Automatically generating the question battery** — CQG-MBQA (contrastive,
   discriminative question generation), Oct 2024.
4. **Interpretable-embedding-via-text-intermediates as a general goal** — the
   concept-bottleneck line (Koh et al., "Concept Bottleneck Models",
   https://arxiv.org/abs/2007.04612) and the open-vocabulary sparse/lexical embedding
   line (e.g., Opitz et al., EMNLP 2025 commentary,
   https://aclanthology.org/2025.emnlp-main.1135.pdf) both pre-date us with
   different coordinates but the same ambition.

### 1.3 The honest differentiation — what remains ours to claim

None of the found prior art combines the following, and the combination (not the
core trick) is the defensible qthe novelty:

1. **Substrate: a calibrated System One model, not a generative LLM.** QA-Emb reads
   yes/no evidence out of a generative LM's answer distribution. Our axes are `noul`
   **calibrated probability answers** (RLCD-trained epistemic honesty per the
   typesafe.ai launch, see `docs/research/DECISION-MODEL-TRENDING.md` §1.1) or `score`
   rubric levels from a model that *cannot generate strings at all*. That changes the
   epistemics of each axis (a calibration guarantee on the coordinate value itself)
   and is, as far as this pass found, unpublished. The jev-lattice recon
   (R24-RECON-LATTICE, internal) measured that *score levels* are not numerically
   calibrated — which makes "noul vs score as embedding axis" a real, open,
   measurable question (see §4, Q1).
2. **Typed battery, fixed by design.** QA-Emb treats question *selection* as training;
   CQG-MBQA generates questions per task. We deliberately fix 8 typed questions as a
   **stable coordinate contract** — the embedding is reproducible across model
   versions to a measurable degree (our C15 drift instrument), which generated
   question sets cannot be. Prior art optimizes each embedding task; we optimize a
   reusable instrument.
3. **Deployment as live retrieval in a serverless vector DB.** QA-Emb's headline
   evaluation is fMRI voxel prediction with "simple NLP tasks" secondary; CQG-MBQA
   evaluates standard embedding-bench tasks. Neither demonstrates the
   embed-in-Vectorize / query-with-cosine / measure-family-accuracy loop as a
   production retrieval organ.
4. **Ternary quantization of QA-embeddings.** No prior work found that quantizes
   question-answer embeddings to {-1, 0, +1} (§2). This is plausibly first *for this
   embedding class*, though it is an obvious transfer from BitNet-style ternarization.
5. **Instrumentation around the embedder** (occlusion gradients per axis, sealed
   corpora, negative controls, majority-baseline nulls). Prior art reports benchmark
   scores; nobody found reports falsification instruments as part of the artifact.

**Related lines checked and cleared as adjacent-not-same:**

- **Promptagator** (Dai et al., ICLR 2023, https://arxiv.org/abs/2209.11755, ~425
  citations): prompts an LLM to **generate synthetic queries** used to train few-shot
  dual encoders. The LLM is a data generator *for* a dense embedder, not the embedder.
  Same prompting machinery, opposite direction from ours.
- **LLM2Vec** (BehnamGhader et al. 2024, https://arxiv.org/abs/2404.05961,
  https://github.com/McGill-NLP/llm2vec, 1.7K stars): turns decoder-only LLMs into
  dense text encoders via bidirectional attention + contrastive fine-tuning. "LLM as
  embedder" in the *trained-weights* sense; no QA axes, no interpretability claim.
- **Instruction-tuned embedders** (Instructor, https://arxiv.org/abs/2212.09741;
  E5-Mistral, https://arxiv.org/abs/2401.00368; NV-Embed,
  https://arxiv.org/abs/2405.17428): task instructions steer a *trained* encoder.
  The instruction is metadata around a dense forward pass, not a coordinate.
- **"Likelihood-profile embeddings"** (representing text by next-token probability
  profiles over prompted probes): searches under three phrasings surfaced **no
  canonical prior work** as of Oct 2026. QA-Emb is adjacent (a yes/no question read
  off the answer distribution is a 1-coordinate likelihood probe), but the general
  "probability profile as vector" framing appears unclaimed. Low confidence in a
  negative — this needs a dedicated pass before anyone banks a novelty claim on it.

---

## 2. The ternary line

### 2.1 Weights: the BitNet lineage (very mature)

- **Ternary Weight Networks** (Li & Liu, 2016, https://arxiv.org/abs/1605.04711) and
  **Trained Ternary Quantization** (Zhu et al., 2017,
  https://arxiv.org/abs/1612.01064) established {-1, 0, +1} weights with quantization
 -aware training a decade ago.
- **BitNet b1.58** — "The Era of 1-bit LLMs: All Large Language Models are in 1.58
  Bits" (Wang et al., Microsoft, Feb 2024, https://arxiv.org/abs/2402.17764): every
  LLM weight ternary, matching FP16 quality from ~3B params. Repo
  https://github.com/microsoft/BitNet — **41.2K stars**, one of the largest
  quantization repos on GitHub. Follow-ons: *BitNet b1.58 Reloaded* (QAT for small
  language and vision models, https://arxiv.org/abs/2407.09527) and the production
  **BitNet-b1.58-2B-4T** checkpoint (2B params / 4T tokens,
  https://huggingface.co/microsoft/BitNet-b1.58-2B-4T).
- Note the asymmetry: BitNet ternarizes **model weights** (billions of coordinates,
  trained with QAT). We ternarize **embedding vectors** (8 coordinates, no training,
  median-centered threshold). Same alphabet, different physics: our zero state is
  "axis not engaged," theirs is "weight pruned."

### 2.2 Vectors: the hashing lineage (binary dominates)

- **Semantic hashing** (Salakhutdinov & Hinton, 2007,
  https://www.cs.toronto.edu/~hinton/absps/sh.pdf): documents as short binary codes
  for similarity search — the founding move of "embeddings as discrete codes."
- **Learning-to-hash** classical line: Binary Reconstructive Embeddings (Kulis &
  Darrell, NIPS 2009, https://papers.nips.cc/paper/3667-learning-to-hash-with-binary-reconstructive-embeddings),
  the canonical survey (Wang et al., https://arxiv.org/abs/1606.00185) and the
  standing NJU index of the field (https://cs.nju.edu.cn/lwj/L2H.html). Product
  quantization for nearest-neighbor search (Jégou, Douze, Schmid, IEEE TPAMI 2011)
  is the production-grade descendant used inside every serious vector index.
- **Current state**: a fresh survey of deep **text hashing** (Oct 2025,
  https://arxiv.org/abs/2510.27232) still organizes the field around **binary**
  codes; ternary retrieval codes are a rare side branch in this literature. In
  deployed practice, embedding quantization is likewise binary/int8: e.g., Cohere's
  int8/binary embedding storage (https://cohere.com/blog/int8-binary-embeddings),
  which cuts dense vectors 4–32× at small recall cost — but always from a
  768–4096-dim trained encoder.

### 2.3 Where an 8-axis ternary sits

**Nowhere in the published record, as far as this pass found — and the placement is
the point.** The literature offers two extremes: (a) *billions* of ternary
coordinates inside a trained network (BitNet), and (b) *hundreds-to-thousands* of
binary coordinates per record learned for retrieval (hashing). An **8-coordinate
ternary code carrying human-readable axis semantics, 16 bits per record, produced by
zero training** — a prompted LLM plus a median threshold — has no located precedent.
The closest conceptual neighbors:

- **Matryoshka Representation Learning** (Kusupati et al., NeurIPS 2022,
  https://arxiv.org/abs/2205.13147) — truncate a big embedding to its first N dims
  at inference. Our move is the same *goal* (smaller, cheaper coordinates) achieved
  in the opposite direction: start at 8 semantically-named dims, never train, then
  ternarize. MRL truncates dense floats; we discretize typed judgments.
- The hashing literature's "code length vs retrieval quality" curves give the null
  model for our 16-bit result: at 16 bits, random or lexical baselines are weak
  (majority-class retrieval ≈ what our nulls show), which is exactly why retaining
  2.2–2.4× majority-baseline signal at 16 bits is worth reporting — but note the
  honest caveat: on a 20-record corpus with 8 family clusters, the
  information-theoretic ceiling is low and the comparison class is small. The claim
  to defend is the *rate*, not the absolute.

**Verdict for §2:** ternary *weights* = settled science (Microsoft, 41K-star repo);
ternary *retrieval codes* = minority branch of learning-to-hash; **ternary
QA-embeddings at 8 axes = unoccupied territory**, but "unoccupied" here means
"nobody wanted 16 bits per record badly enough" — the contribution is the
cheap-instrument + calibration angle, not the ternary alphabet itself.

---

## 3. Trending (as of Oct 2026)

What the embedding world is actually spending attention on, from 2026-dated
rankings and repos:

**Model families / leaderboards.**
- **Qwen3-Embedding** (June 2025, https://arxiv.org/abs/2506.05176, repo
  https://github.com/QwenLM/Qwen3-Embedding, 2.1K stars) is the current
  open-weight reference point; 2026 round-ups consistently rank it, BGE-M3,
  E5-Mistral, Nomic, Stella, GTE, and Linq-Embed at the top of MTEB-style boards
  (https://presenc.ai/research/best-open-weight-embedding-models-2026, May 2026;
  https://www.premai.io/blog/best-embedding-models-for-rag-2026-ranked-by-mteb-score-cost-and-self-hosting,
  Mar 2026; https://milvus.io/blog/choose-embedding-model-rag-2026.md, Mar 2026;
  https://openrouter.ai/blog/insights/best-embedding-models-2026, Sep 2026).
- **EmbeddingGemma** (Google, 2025) owns the sub-1B slot; NV-Embed
  (https://arxiv.org/abs/2405.17428, https://huggingface.co/nvidia/NV-Embed-v2)
  set the earlier LLM-as-generalist-embedder pattern.
- Trend summary per the Aug 2026 leaderboard analysis
  (https://app.ailog.fr/en/blog/news/embedding-models-leaderboard-2026):
  dimensions exploding, **Matryoshka truncation** now standard, multimodal
  embeddings, 32K+ context.

**Techniques.**
- **Matryoshka embeddings** everywhere (MRL, https://arxiv.org/abs/2205.13147;
  OpenAI's text-embedding-3 exposes it, per
  https://surrealdb.com/blog/embedding-models-comparison, Jul 2026).
- **Late chunking** (Jina AI, https://jina.ai/news/late-chunking-in-long-context-embedding-models/;
  repo https://github.com/jina-ai/late-chunking, 540 stars): embed the long doc
  first, chunk the token embeddings after — preserves context across chunk
  boundaries.
- **Contextual retrieval** (Anthropic, Sep 2024,
  https://www.anthropic.com/news/contextual-retrieval): prepend LLM-generated
  context to each chunk before embedding; reported large retrieval-error reductions
  in RAG. Note the shared shape with us: *an LLM judgment inserted into the
  embedding pipeline* — but as a text preprocessor, not as the coordinate system.
- **Instruction-conditioned embedding** (Instructor → E5-Mistral → Qwen3): the
  task prompt steers one trained encoder.

**Infrastructure.** HuggingFace **text-embeddings-inference**
(https://github.com/huggingface/text-embeddings-inference, 5.1K stars) and
**FlagEmbedding/BGE** (https://github.com/FlagOpen/FlagEmbedding, 12.3K stars —
including an LLM-based embedder with **in-context learning**, BGE-en-icl) are the
default serving/training stacks.

**"LLM-as-embedder" as a prompt-time (untrained) idea** is *not* trending: the
field's LLM-as-embedder energy goes into fine-tuned encoders (LLM2Vec, E5-Mistral,
Qwen3-Embedding). The QA-embedding niche is small — the QA-Emb repo sits at 47
stars, CQG-MBQA has no widely-adopted artifact I could find. Read honestly: the
prompt-time QA-embedder is a **research sideline with two solid papers and no
incumbent** — room for an instrumented, deployed, calibration-focused entry (us),
but also a warning that the mainstream decided the economics favor training.

---

## 4. Open questions for the instrument

Where a cheap, interpretable, 8-axis LLM-embedder can run real experiments that the
big trained-embedder world cannot cheaply run:

1. **Are calibrated probabilities better coordinates than binary or rubric answers?**
   QA-Emb's axes are effectively binary/yes-no; our `score` axes are ordinal rubric
   levels that the jev-lattice recon measured as *not numerically calibrated*; our
   `noul` axes carry an RLCD calibration guarantee. Same 8 questions, three answer
   types, one sealed corpus, one retrieval metric (C14): this is a clean, cheap,
   publishable ablation nobody in the QA-Emb line has run (they never had a model
   whose *only* output is calibrated probability).
2. **Do embedding axes survive model-version drift — and can a question battery be a
   coordinate contract?** jev-lattice measured 4.7–6.2% verdict drift across a Jev
   version bump; our C15 cross-embedder drift instrument exists for exactly this.
   Prior art re-generates questions per task, so the question of *temporal stability
   of an interpretable embedding space* (re-embed the sealed corpus per model
   version; measure per-axis movement and its retrieval cost) is open. Dense embedders
   face the same problem silently; QA-axes make the drift *readable axis-by-axis*.
3. **What is the quantization floor for QA-embeddings — and does the ternary zero
   matter?** Binary vs ternary vs 4-level vs full-precision axes, at 8 dims and
   beyond. BitNet's headline result is ternary ≈ FP16 for *weights at scale*; our
   16-bit/record result is the *embedding-at-8-dims* analog. The specific untested
   question: is the {-1, 0, +1} **zero state** (axis neutral) doing real work vs pure
   binary sign, and does the answer change with question type (noul vs score)?
4. **How much question do you need?** QA-Emb "trains" by question selection;
   CQG-MBQA generates discriminative questions. We hold the battery fixed and
   measure marginal value per question directly with **occlusion gradients** (R24
   instrument, per-axis saliency already built). Open, attackable question: is a
   human-typed 8-map competitive with N generated discriminative questions at equal
   budget, and where does the marginal-value curve flatten?
5. **Do interpretable axes compose for retrieval?** Dense embeddings support cosine;
   typed axes additionally support *logical* queries ("family X AND not tone Y")
   and axis-space arithmetic (genre + topic). No prior art tests compositional
   queries over QA-embedding coordinates. Cheapest experiment in the list: hybrid
   retrieval — ternary axis prefilter over the 16-bit codes, dense rerank on top —
   and compare against pure-cosine on the same corpus. If typed maps compose, the
   16-bit code is not just a compressed embedding but a queryable index.

---

*Compiled by the R24 research subagent. All URLs verified reachable 2026-10-18.
Negative findings ("no prior art found") are scoped to this pass's 8 searches and
page reads; they are evidence of absence of easy matches, not proof of absence.*
