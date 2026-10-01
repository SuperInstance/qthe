# demo/smoke/ — the A2UI live window, verified by a real browser (Wave 34, Task 34-c)

Agent: window-smith. Date: 2026-09-27 (run window 06:44–06:58 UTC).
Subject: `index.html` + `demo/a2ui.mjs` + `demo/sha256.mjs` driving the SAME
`qthe.mjs` kernel the tests seal — served over localhost per the page's own
note (`python3 -m http.server 8123` in the repo root; ES modules refuse file://).

Browser engine: **HeadlessChrome/153.0.0.0** (Linux x86_64, `navigator.webdriver`),
driven by agent-browser 0.38.1 (Playwright). Viewport 1024×800, full-page PNGs.

## Checklist verdicts

| # | item | verdict | evidence |
|---|------|---------|----------|
| a | page loads with zero console errors | **PASS** | `agent-browser errors` and `console` empty on first open, on every reload, and after the 30 s live run; 0 `error` events, 0 `unhandledrejection` events (listener installed, 30 s live observation, ticks ~60/s) |
| b | canvas renders pixel=cell grid | **PASS** | canvas is 96×64 (attribute + `getImageData(0,0,96,64)`), 6144 cells → 6144 pixels. Pixel census on the `ring` seed matches the seed arithmetic EXACTLY: attract green 112 (=4·28, the r=14 ring perimeter), repel red 120 (=4·30, the r=15 skin), purple keepers 4, ground gray 5908, other 0. One byte per cell → one pixel per cell, timbre → color plane. Screenshot `01-load-ring-live.png` |
| c | HUD shows tick counter + trace sha256; sha stable across two reloads (same seed) | **PASS** | HUD line: `tick 4 · sha256 4f0a62ce5f0393ea… · twins last tick 3 · wormholes ON slots 4/64 · full: 4f0a62ce5f0393eaa23bd46122b3912400b0d42cc27a93fb34515ff7c1cb66c1`. Two independent reloads, paused ASAP: **both landed at tick 4 with the IDENTICAL full sha** `4f0a62ce…66c1`. Cross-runtime: `node demo/smoke/verify-hud-sha.mjs 4:<sha> 421:<sha>` → both `MATCH` (Node replays the demo seed + `tick(sub,{wormholes:true,table})` trajectory with the same kernel; freeze at tick 102 explains the later sample, see finding 2). G0 re-receipted in this runtime: `demo/sha256.mjs` == `node:crypto` sha256 on the seed plane (`145dcd64…74731`). Screenshot `02-hud-sha-reload-stable.png` |
| d | wormholes ON/OFF toggle → VISIBLE behavioral difference | **PASS** | Same `worms` seed (planted twin worms, the C2 geometry), ~92 ticks each (~1.5 s, > the 20 requested). **ON**: `tick 92 · sha256 3e6e19ce58e8619e… · twins last tick 44 · wormholes ON slots 24/64` — pixel census: purple cells 44, purple cells blinking (g>40) **44/44**. **OFF**: `tick 93 · sha256 2d34d91c2ff25331… · twins last tick 0 · wormholes OFF (paired-arm view: no Looking Glass)` — census: purple 44, blinking **0/44**. The blink is the wormhole table answering; OFF shows the mechanistic floor (0 twin events — a disabled table cannot deliver), the same floor E-Q1 measured headlessly. Substrate shas diverge between arms. Screenshots `03-worms-wormholes-ON.png`, `04-worms-wormholes-OFF.png` |
| e | no unhandled promise rejections or resource 404s | **PASS (after fix)** | demo code has no async surface (`grep then/await/fetch/Promise demo/a2ui.mjs` → none). Network log for a fresh load: `index.html`, `demo/a2ui.mjs`, `qthe.mjs`, `demo/sha256.mjs` all 200 — **zero 404s** after finding 1's fix (favicon served inline as a data: URI). Rejection listener: 0 unhandled, 0 error events over 30 s live run |

## Findings (defects, fixes, honest notes)

1. **favicon.ico 404 — FOUND, FIXED (in-scope: index.html).** First loads logged
   `GET /favicon.ico → 404` (the only non-2xx/3xx in the log). Fix: one inline
   `<link rel="icon" href="data:image/svg+xml,…">` (the Abstain purple square)
   in `index.html`. Re-verified: fresh load fetches the 4 repo resources, all
   200, no favicon request at all. Zero 404s standing.
2. **HUD sha freezes on the `ring` seed at tick 102 — NOT a defect, receipted.**
   Observed identical sha at ticks 421 and 483; the Node trajectory replay
   (`verify-hud-sha.mjs`) shows the armor-ring config with wormholes ON reaches
   a fixed point at tick 102 (sha constant thereafter; early ticks t1–t4 all
   differ). The HUD hash is live; the substrate it hashes is genuinely
   stationary. Consequence for the smoke: reload-stability was checked on a
   PRE-freeze tick (4) precisely so the match is nontrivial.
3. **Method note (honest boundary):** the unhandledrejection listener is armed
   after first paint (no init-script hook in the harness), so it observes the
   30 s live run, not the module-eval instant; independently, the page code
   contains no promise construction at all, and the console/error streams were
   empty for the entire session including module eval.

## Receipts — screenshots (sha256)

```
c15ff2b6f2e3d00cecd29bc0af0a3e263891badbace83158b64193b929efea2e  01-load-ring-live.png
e5d86f2247a80ed1ea573bc62feadbf002531c52c18a65ea2c7375f0323b2841  02-hud-sha-reload-stable.png
f9513c4ac46bcd3b6c38c9ee8b4ce3078c6468d962d18023f069450abbac40e2  03-worms-wormholes-ON.png
d67d3abe21195820f2413db03c4f5e8ae8fdc74e782016b349f3e058712a145d  04-worms-wormholes-OFF.png
```

All four are distinct full-page PNGs (1024×800 viewport; canvas 96×64 upscaled
`image-rendering: pixelated`). 01/02 show the ring geometry (green ring, red
skin, 4 purple keepers on gray ground); 03 shows the same twin geometry with
the receivers lit by wormhole activity; 04 the identical seed with the
Looking Glass off — visually and numerically flat.

Receipt chain: this file + the four PNGs + `verify-hud-sha.mjs` are committed
together in the qthe repo; the commit sha is the anchor the tavern row cites.

## How to re-run

```
python3 -m http.server 8123          # repo root
agent-browser open http://127.0.0.1:8123/index.html
node demo/smoke/verify-hud-sha.mjs   # trajectory + G0 re-receipt
node demo/smoke/verify-hud-sha.mjs TICK:SHA64 …   # check browser HUD samples
```
