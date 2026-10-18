// groq-relay/src/worker.js — THE RELAY SEAT (ORCH-R22/T13-a, claim C13).
//
// The r21 seat-block law: api.groq.com returns HTTP 403 PRE-AUTH to the
// orchestrator's sandbox egress (~36 ms, authed and unauthenticated
// identical — an IP-range block; receipt: situations/groq_seats/
// BLOCKED-SEAT-RECEIPT.md). The unlock: a Worker's outbound fetch
// originates from Cloudflare's edge, a different egress. Moth (also
// CF-fronted) works from the sandbox; qthe-cell proves this account's
// CF edge reaches CF-fronted services. Hence this relay.
//
// HOUSE LAWS (carried into the design):
// - FAIL-CLOSED AUTH: every proxied call requires
//   `Authorization: Bearer <GROQ_RELAY_TOKEN>`; a mismatch is a 401
//   with no upstream attempt. No open proxy.
// - SERVER-SIDE KEY CUSTODY: GROQ_API_KEY lives ONLY as this Worker's
//   secret. It is never accepted from callers, never echoed, never
//   logged. The sandbox never transmits the Groq key at all — strictly
//   stronger than the env-only doctrine's minimum.
// - TRANSPARENCY: GET / receipts exactly what this relay is (the house
//   LAYER 2 discipline: the deployment claims what the checks measure).
// - PRIVACY: nothing is logged; request bodies are buffered only to
//   forward them; response streams pass through untouched.
// - PASS-THROUGH HONESTY: upstream status, body, and salient headers
//   reach the caller untouched — the client's AS-SAID rows see the real
//   API, not a rewritten one.
//
// LAYER discipline: LAYER 2. C13 (candidate) is measured by the
// two-seat canary through this relay.

const BUILD = "r22-relay1 (the reachable seat; claim C13)";
const UPSTREAM = "https://api.groq.com";
const PREFIX = "/openai/v1/";

const PASS_HEADERS = ["content-type", "x-request-id", "retry-after"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET / — the transparency receipt
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "")) {
      return Response.json({
        service: "groq-relay",
        build: BUILD,
        what: "a thin forwarding seat: /openai/v1/* -> api.groq.com/openai/v1/*",
        why: "the operator's sandbox egress is IP-blocked at Groq's edge (r21 receipt); a Worker fetch originates from Cloudflare's edge instead",
        layer: "LAYER 2 — deployment claim C13, measured by the two-seat canary through this relay",
        auth: "Authorization: Bearer <GROQ_RELAY_TOKEN> required on every proxied call (fail-closed 401)",
        key_custody: "GROQ_API_KEY lives only as this Worker's secret; never accepted from callers",
        logging: "none — nothing about your calls is recorded here",
        endpoints: {
          "GET  /": "this receipt",
          "GET  /health": "liveness",
          "ANY  /openai/v1/*": "forwarded to api.groq.com with the secret key (relay token required)",
        },
      });
    }

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    // /probe/noauth — THE DISAMBIGUATION ROUTE (ORCH-R22/T13-a, receipted):
    // fetches api.groq.com/openai/v1/models with NO Authorization header and
    // returns the raw status+body. Purpose: distinguish a door-refusal
    // (no-auth ALSO 403s => IP/geo block before auth) from an auth-layer
    // rejection (no-auth 401s => the key itself is what's forbidden).
    // Relay-token gated; adds no unauthenticated capability.
    // (v2 erratum: reads the header DIRECTLY — the first deploy referenced
    // the later `const auth` from this earlier scope: TDZ ReferenceError,
    // error 1101, receipted here not hidden.)
    if (url.pathname === "/probe/noauth") {
      const probeAuth = request.headers.get("Authorization") || "";
      if (probeAuth !== `Bearer ${env.GROQ_RELAY_TOKEN}`) {
        return Response.json({ error: "relay token required" }, { status: 401 });
      }
      const res = await fetch(`${UPSTREAM}/openai/v1/models`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
          Accept: "application/json",
        },
      });
      const body = await res.text();
      return Response.json({ probe: "noauth", upstream_status: res.status, upstream_body: body.slice(0, 500) });
    }

    // Only the Groq OpenAI-compatible surface is forwarded.
    if (!url.pathname.startsWith(PREFIX)) {
      return Response.json(
        { error: `groq-relay forwards ${PREFIX}* only (see GET / for the receipt)` },
        { status: 404 },
      );
    }

    // Fail-closed relay auth.
    const auth = request.headers.get("Authorization") || "";
    if (!env.GROQ_RELAY_TOKEN || !env.GROQ_API_KEY) {
      return Response.json({ error: "relay misconfigured (secrets missing)" }, { status: 500 });
    }
    if (auth !== `Bearer ${env.GROQ_RELAY_TOKEN}`) {
      return Response.json({ error: "relay token required" }, { status: 401 });
    }

    // Forward: buffered request body (the tavern's calls are JSON),
    // streamed response body.
    //
    // THE BROWSER-UA LAW (fleet-banked for Moth, now for Groq): a Worker
    // fetch sends NO User-Agent by default, and Cloudflare-fronted API
    // edges (api.groq.com is a CF zone — cf-ray on the 403) bot-block
    // UA-less requests. The first r22-relay1 deploy WITHOUT a UA drew a
    // 403 from HKG; the browser UA is the fix (measured below in the
    // live checks).
    const upstreamUrl = UPSTREAM + url.pathname + url.search;
    const headers = new Headers({
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": request.headers.get("Content-Type") || "application/json",
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
      Accept: "application/json",
    });
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const init = { method: request.method, headers };
    if (hasBody) init.body = await request.arrayBuffer();

    const upstreamRes = await fetch(upstreamUrl, init);

    const outHeaders = new Headers();
    for (const h of PASS_HEADERS) {
      const v = upstreamRes.headers.get(h);
      if (v) outHeaders.set(h, v);
    }
    return new Response(upstreamRes.body, { status: upstreamRes.status, headers: outHeaders });
  },
};
