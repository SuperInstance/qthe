# evosphere — selection-as-infrastructure (ORCH-R26/T17-a, E-Q28)

A single Durable Object that hosts the DETERMINISTIC SELECTION GATE for
latent-space evolution. It never calls a model; it computes verdicts by
code from measured vectors (the jev-lattice law applied to evolution).

| Law | Implementation |
| --- | --- |
| providers never decide | the DO receives already-measured 8-dim vectors; verdicts are pure code |
| append-only proofs | every attempt (accepted or fossil) appends; nothing is removed |
| coordinated gate | jev-latest AND jev-preview cosines to the frozen target centroid must BOTH strictly improve |
| protocol as code | max generations, attempts/generation, the stagnation escape rule — all enforced here |
| fail-closed auth | `Authorization: Bearer <EVOSPHERE_TOKEN>` (Worker secret) |
| transparency | `GET /` receipts what this is and which claim it prices |
| frozen geometry | family centroids installed at `/init` from the sealed eq22N arm, immutable after |

## Deploy

```sh
cd cloudflare/evosphere
export CLOUDFLARE_API_TOKEN=…      # Workers Deploy + DO permissions
export CLOUDFLARE_ACCOUNT_ID=049ff5e84ecf636b53b162cbb580aae6
npx wrangler deploy
printf '%s' "$EVOSPHERE_TOKEN" | npx wrangler secret put EVOSPHERE_TOKEN
```

## Endpoints (all authed)

- `GET /` — the transparency receipt
- `POST /init` — install centroids + config + seed (once; append-only world)
- `GET /directive` — the current gap-derived mutation directive (target family, top-2 gap axes, memory)
- `POST /attempt` — submit a measured mutant; the gate returns accept/reject + fitness values
- `GET /state` — the full world (the receipt of record)
- `GET /attempts` — the append-only attempt log

The driver (`situations/evolution_r26/evolve.py`) is the mutator/observer:
DeepSeek varies, typesafe measures, Vectorize retrieves, the DO selects.
