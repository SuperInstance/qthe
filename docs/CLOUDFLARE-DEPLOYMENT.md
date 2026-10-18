# CLOUDFLARE-DEPLOYMENT — qthe on Workers, Durable Objects, Vectorize, Pages

> **Status: design, ready to deploy when the operator's Cloudflare token
> arrives** (it was named in the r15 dispatch but not attached; nothing here
> requires it until the `wrangler` steps at the end). The design is learned
> from the fleet's live patterns, cited per section — not invented in a
> vacuum. Zero-dep law preserved throughout: the kernel (`qthe.mjs`) ships
> unchanged.

---

## 0. What qthe is on the edge (the one-paragraph thesis)

A QTHE substrate is a `Uint8Array` of packed cells (`[τ:2][d:6]`) plus a
64-slot `WormholeTable`, advanced by a pure, deterministic `tick()`. That is
a *single-threaded, strongly-consistent, stateful* computation — which is
exactly what a Cloudflare Durable Object is. The whole deployment is one
sentence: **one DO per substrate, the kernel verbatim inside it, Vectorize
for the twin-resonance index, Pages for the A2UI mirror, R2 for the sealed
receipt chains.**

## 1. The fleet's patterns this design borrows (cited)

| pattern | borrowed from | how qthe uses it |
|---|---|---|
| zero-dep single-file Worker, `wrangler.toml`, no build step | `gitpp-fold-edge` (src/worker.js + src/gitpp.js, "runs on Workers, Node 18+, Deno, Bun") | `qthe.mjs` is already pure ESM with zero deps — it ports verbatim, same two-file shape (`src/worker.js` + `src/qthe.mjs`) |
| D1 + Vectorize + KV + R2 bindings via `wrangler` provision | `quilt-cloudflare` (DEPLOY.md: `wrangler d1 create`, `wrangler vectorize create --dimensions=768`, `wrangler kv:namespace create`) | we use **Vectorize + KV + R2 only** — no D1 (the substrate is in-DO memory + DO storage, not SQL; see §3) |
| Durable Objects for vibe state + cron triggers | `quilt-elf` (src/worker.ts: `VIBE_STATE?: DurableObjectNamespace`, `[triggers] crons = ["*/15 * * * *"]`) | one `SubstrateDO` per substrate id; `alarm()` drives tick batches |
| Pages with `_worker.js` + `_redirects` | `AI-Writings` (root `_worker.js`, `_pagesignore`, served at ai-writings.pages.dev) | the A2UI mirror (public-demo.html) as a Pages project talking to the Worker |

## 2. The topology

```
                       ┌────────────────────────────────┐
   browser ──A2UI────▶ │  Pages  (the mirror, static)   │
        │              └───────────────┬────────────────┘
        │ fetch/SSE (twin events)      │
        ▼                              ▼
   ┌─────────────────────────────────────────────────────┐
   │  Worker  (router, zero-dep)                         │
   │   /substrate/:id/tick?n=K   → DO stub → tick K times│
   │   /substrate/:id/view       → traceView JSON        │
   │   /substrate/:id/events    → SSE of twin hits       │
   │   /substrate/:id/receipt   → seal + push to R2      │
   └──────┬──────────────┬──────────────┬────────────────┘
          │              │              │
   ┌──────▼─────┐ ┌──────▼──────┐ ┌─────▼──────────────┐
   │ Durable    │ │ Vectorize   │ │ R2                 │
   │ Objects    │ │ qthe-twins  │ │ qthe-receipts      │
   │ (per       │ │ (twin-event │ │ (append-only       │
   │  substrate)│ │  embeddings)│ │  chain JSONL,      │
   │ kernel +   │ │             │ │  content-addressed)│
   │ table in   │ │             │ │                    │
   │ memory     │ │             │ │                    │
   └────────────┘ └─────────────┘ └────────────────────┘
          │
   ┌──────▼─────────────┐
   │ KV  qthe-hud       │  ephemeral HUD snapshots (the A2UI
   │ (cache, TTL 60s)   │  reads this, not the DO — cheap fan-out)
   └────────────────────┘
```

## 3. Why a Durable Object per substrate (the honest reasoning)

- **The determinism law is the constraint.** SPEC LAYER 0 item 6: same
  substrate + same tick count → byte-identical planes. A DO is
  single-threaded with strongly-consistent storage — there is no interleaving
  that can violate tick order. On a plain Worker + KV/D1, two concurrent
  `tick` requests could interleave reads/writes and the law would need a
  compare-and-swap dance the kernel never promised. We do not buy that risk.
- **The state is small.** A 64×64 substrate is 4 KiB + a 64-slot table
  (~1 KiB). It lives in DO memory; `storage.put("plane", …)` per checkpoint
  is trivially inside DO limits. D1 was considered and rejected: SQL buys
  queryability we do not need — the query surface is Vectorize's job.
- **`alarm()` is the tick scheduler.** `setAlarm()` for the next batch
  (the quilt-elf cron pattern, but per-substrate and precise): the DO wakes,
  ticks N times, emits twin events, writes the checkpoint, re-arms. Cron
  Triggers (worker-level) are used only for the *fleet* heartbeat — e.g.
  a daily receipt-chain verification sweep (`verify_all_chains` logic).

## 4. The kernel integration (verbatim, zero-dep law)

`src/worker.js` — the whole adapter is import + call; **qthe.mjs is not
modified**:

```js
import { makeSubstrate, tick, traceView, WormholeTable } from "./qthe.mjs";

export class SubstrateDO {
  constructor(state, env) { this.state = state; this.env = env; }
  async load() {
    const buf = await this.state.storage.get("plane");
    if (buf) {
      const cells = new Uint8Array(buf);
      Object.assign(cells, { w: 64, h: 64 });          // expando restore
      cells.__wormholes = new WormholeTable();          // rebuilt from storage
      // (table slots persisted alongside; see receipt below)
      return cells;
    }
    return makeSubstrate(64, 64, seedFn);               // first boot
  }
  async doTicks(n) {
    const cells = await this.load();
    for (let i = 0; i < n; i++) tick(cells);            // the law: serial, in-DO
    await this.state.storage.put("plane", cells.buffer);
    return traceView(cells);                            // deterministic view
  }
  async alarm() { /* tick batch + twin-event emission + re-arm */ }
}
```

**Honest caveat (receipted, not hidden):** the kernel carries substrate
metadata as JS expando properties (`cells.w`, `cells.__wormholes`) — a
`Uint8Array` survives DO storage as its buffer, expandos do not. The adapter
re-derives them on load. This is exactly the AMBIGUITY.md class of
porting note; it belongs in the adapter, never patched into the kernel.

## 5. Vectorize — the twin-resonance index

- Index: `wrangler vectorize create qthe-twins --dimensions=64`.
- **What is embedded:** the twin-hit event stream, not the raw plane. Each
  `{kind:'twin', x, y, slot, resonance, term}` event becomes one vector:
  64 dims = the slot histogram of that substrate's last tick window
  (dim i = normalized write-count of slot i), metadata = `{substrate,
  tick, resonance}`. (Workers AI `@cf/baai/bge-base-en-v1.5` — the same
  embedder `superinstance-advisor` uses for the canon — generates a
  *semantic* side-index over trace summaries; the slot histogram is the
  *mechanical* index. Two indexes, two questions.)
- **The query the index answers:** "which other substrates are resonating
  in the same slots right now?" — the wormhole table's cross-substrate
  analogue. This is the only place the design extends past the SPEC, and it
  is LAYER 2 by house law: an empirical claim (C6 candidate: *cross-substrate
  slot-histogram similarity predicts useful twin overlap*), priced by
  experiment when deployed, never assumed.

## 6. R2 — the receipt chains

Sealed chains (`receipts/*.jsonl`, the stone-v1 format) are append-only
blobs: R2 with content-addressed keys (`sha256-first-16.jsonl`), exactly the
`quilt-organ-workers` content-addressing pattern. KV holds chain tips
(`{chain: tip}`) for cheap verification fan-out; the Cron Trigger runs the
`verify_all_chains` logic daily against R2 and reports mismatches to the
tavern ledger.

## 7. Pages — the A2UI mirror

- Project: `qthe-a2ui` — `demo/public-demo.html` + `docs/dashboard.html`
  built by the existing `scripts/build_public_demo.mjs`, deployed as static
  assets. `_worker.js` optional (only if the HUD needs server-side shaping).
- The HUD reads KV (60s TTL snapshots) for cheap polling; the *live* twin
  events come from the Worker's SSE endpoint. Pixel = cell stays true: the
  mirror renders exactly `traceView()` output, never a server-side
  reinterpretation.

## 8. The deploy runbook (when the token arrives)

```bash
npm install -g wrangler
wrangler login                       # or: CLOUDFLARE_API_TOKEN=<token>
wrangler vectorize create qthe-twins --dimensions=64
wrangler kv:namespace create HUD
wrangler r2 bucket create qthe-receipts
# wrangler.toml: main=src/worker.js, DO binding SubstrateDO,
#   [[vectorize]] qthe-twins, [[kv_namespaces]] HUD, [[r2_buckets]]
wrangler deploy                      # the Worker + DOs
wrangler pages deploy dist/a2ui --project-name qthe-a2ui
```

Durable Objects require a paid Workers plan (or the free-tier single-DO
allowance — verify at deploy time; if absent, the fallback is ONE DO for the
demo substrate and the honest note in the README).

## 9. What this deployment would earn (the LAYER 2 menu)

| id | claim | test |
|---|---|---|
| C6 | cross-substrate slot-histogram similarity predicts useful twin overlap (Vectorize) | plant known-overlapping substrate pairs; measure retrieval precision |
| C7 | DO-serial ticks preserve the F0 determinism law at the edge (40/40 replays byte-identical through the DO path) | the E-Q1 F0 protocol re-run through the Worker API |
| C8 | the A2UI mirror over KV/SSE stays pixel-faithful to traceView under fan-out | hash the rendered canvas vs the view hash, N concurrent viewers |

All three are OPEN until priced. House law travels: a claim that dies, dies
cheap and honest, with the receipt kept beside the body.

---

# ADDENDUM — the deployment is LIVE (ORCH-R16, 2026-10-18)

The token arrived; the r15 tokenless design is now a running service.
Everything below was measured on the live deployment; re-run the battery
anytime with `bash cloudflare/live_checks.sh` (fail-closed, exit 1 on any
failure).

## What is running

| piece | URL | what it is |
|---|---|---|
| Worker | https://qthe-cell.casey-digennaro.workers.dev | the kernel vendored byte-identical (`cloudflare/PROVENANCE.txt`; sha256 `ef9a3bba…3f091`) |
| Durable Object | `QtheField` (SQLite class, free tier) | one substrate per DO id; single-threaded per id → ticks apply exactly-once, in order |
| Vectorize | index `qthe-twins` (64-dim, cosine) | live sidecar of the 64-slot wormhole table, auto-synced after each tick batch |
| R2 | bucket `qthe-receipts` | all 13 sealed chain files, served content-addressed (`x-qthe-sha256` header) |
| Pages | https://qthe-demo.pages.dev | the C8 landing + the A2UI demo (byte-identical `public-demo.html`, kernel inlined) |

## The measured results (build r16-fix2)

- **Determinism over HTTP (the old C7): EARNED.** Two independently created
  DOs, seed 33001, 50 ticks → identical state hash (`390083a9…80f05`).
  In-DO replay from the stored seed → agree. State hash stable across
  save/load round-trips. Re-run at seed 777/40 ticks → `753da5a1…`, agree.
- **R2 receipt integrity: EARNED.** `e_q1_chain.jsonl` and `e_q17_chain.jsonl`
  fetched over HTTPS are byte-identical to the local sealed files; the
  response's `x-qthe-sha256` equals the local sha256 (`0ee28675…7455e`,
  `cb31dfc9…acb7d`).
- **Twin sidecar: INFRASTRUCTURE LIVE, convergence measured.** `/twins/37`
  returns the DO's exact pairing ({x:26, y:5, resonance:127}, similarity
  1.0); the one-hot census finds 64/64 occupied slots. **Finding: the
  sidecar is eventually consistent** — a fresh upsert can take ~10–20 s to
  become visible to queries; the DO remains authoritative and the live
  check retries with backoff. The *pricing* claim (slot-histogram
  similarity predicting twin overlap — the old C6) remains OPEN; what is
  live is its lookup substrate.
- **Pages mirror: LIVE (static form).** Landing + demo over HTTPS,
  byte-identical. The *old C8* (pixel-faithful A2UI under concurrent
  fan-out over KV/SSE) remains OPEN — the static mirror is the delivery
  vehicle, not the fan-out experiment.

## Errata found by the live checks (the falsifier law, pointed at my own deploy)

- **ERRATUM 1 (hash semantics):** the first deploy's state hash included
  the per-tick twin *events* — real telemetry, but not persisted state;
  the hash was unstable across save/load. Two DOs agreed while the in-DO
  replay "disagreed" (the planes were identical). Fix: the hash basis is
  `stateView()` — persisted state only. Found by `/abtest` on first live
  run, before any claim was written.
- **ERRATUM 2 (route shape):** the receipt route matched only
  single-segment keys, so `receipts/e_q1_chain.jsonl` 404'd. Fix: join
  all remaining path segments (traversal-guarded). Found by the P5 check.
- **OPS LAW (propagation window):** a DO deploy is not live the moment
  `wrangler` says so — the first post-deploy curls were served the OLD
  code with a straight face. Every response now carries a `build` marker;
  never trust a post-deploy curl until the marker confirms the new build.
- **OPS LAW (local-first wrangler):** `wrangler r2 object put` defaults to
  LOCAL simulation — the first 13 "uploads" landed in `.wrangler/` state.
  Remote uploads need `--remote`. The receipt: 13 objects in the real
  bucket, verified by listing + sha256.

## Scope cuts, receipted

- The KV HUD from the r15 design is not built: the DO's `/hash` route
  serves the HUD line (the tip hash) directly. KV adds nothing until a
  second consumer needs it.
- The DO determinism claim covers the kernel path as vendored; the
  E-Q1-style 40/40 replay battery through the Worker API is the next
  registered step if the fleet wants the full protocol at the edge.
