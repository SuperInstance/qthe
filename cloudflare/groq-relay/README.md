# groq-relay — the reachable seat

> ORCH-R22/T13-a · claim C13 (LAYER 2 candidate) · zero runtime
> dependencies · nothing logged

A ~100-line Cloudflare Worker that forwards `/openai/v1/*` to
`api.groq.com/openai/v1/*` with **server-side key custody**.

## Why it exists

The orchestrator's sandbox egress is IP-blocked at Groq's edge (HTTP
403 PRE-AUTH, ~36 ms, authed and unauthenticated identical — receipt:
`situations/groq_seats/BLOCKED-SEAT-RECEIPT.md`). A Worker's outbound
`fetch` originates from Cloudflare's edge instead. Moth (also
Cloudflare-fronted) works from the same sandbox; `qthe-cell` proves this
account's edge reaches CF-fronted services. The relay is therefore the
"reachable seat" the r21 close-out registered.

## Laws baked in

| Law | Implementation |
| --- | --- |
| fail-closed auth | every proxied call requires `Authorization: Bearer <GROQ_RELAY_TOKEN>`; mismatch = 401, no upstream attempt |
| server-side key custody | `GROQ_API_KEY` is a Worker secret only; never accepted from callers, never echoed |
| transparency | `GET /` receipts exactly what the relay is and which claim it prices |
| privacy | observability disabled; request bodies buffered only to forward; response streams pass through |
| pass-through honesty | upstream status/body/salient headers reach the caller untouched |

## Deploy

```sh
cd cloudflare/groq-relay
export CLOUDFLARE_API_TOKEN=…      # Workers Deploy permission
export CLOUDFLARE_ACCOUNT_ID=049ff5e84ecf636b53b162cbb580aae6
npx wrangler deploy
printf '%s' "$GROQ_API_KEY"     | npx wrangler secret put GROQ_API_KEY
printf '%s' "$GROQ_RELAY_TOKEN" | npx wrangler secret put GROQ_RELAY_TOKEN
```

## Use (client side)

```sh
export GROQ_BASE_URL="https://groq-relay.<subdomain>.workers.dev/openai/v1"
export GROQ_RELAY_TOKEN=…   # NOT the Groq key — the relay token
node situations/groq_seats/canary.mjs
```

`groq_client.mjs` (r22+) honors `GROQ_BASE_URL` and swaps the auth
header to the relay token in relay mode; the AS-SAID rows carry
`via_relay` so the ledger never launders the route.

## What C13 claims (and what measures it)

A relay Worker with server-side key custody restores the full Groq API
surface to a blocked-origin caller. Measured by: the two-seat canary
(`qwen/qwen3.8-27b`, `openai/gpt-oss-20b`) completing through the relay
with AS-SAID rows sealed; the fail-closed 401 on a bad token; the
transparency receipt at `GET /`.
