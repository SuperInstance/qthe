// demo/a2ui.mjs — the A2UI live mirror driver (zero dependencies).
// Runs the SAME ../qthe.mjs kernel the tests seal: one tick per frame,
// pixel = cell, direct buffer-to-canvas (SPEC item 7). The HUD trace hash is
// demo/sha256.mjs — the implementation tests/run_tests.mjs G0 pins identical
// to the stone's sha256Hex, so what you see live is receipt-grade hashing.

import { pack, tauOf, dOf, makeSubstrate, tick, traceView, mulberry32, WormholeTable } from '../qthe.mjs';
import { sha256Bytes } from './sha256.mjs';

const W = 96, H = 64;
const TAU_GROUND = 0, TAU_A = 1, TAU_R = 2, TAU_I = 3;

const canvas = document.getElementById('sub');
const ctx = canvas.getContext('2d');
const img = ctx.createImageData(W, H);            // direct buffer, one px per cell
const hud = document.getElementById('hud');

let sub, table, wormholes, paused, flash, twinsLast;
const frameStats = { ticks: 0 };

// ── seed patterns (deterministic: mulberry32 from the kernel, never tick) ──
const seeds = {
  // C5's armor-ring scenario: an Attract ring (the armor), Ground keep, and
  // two Abstain keepers whose wormhole link spans the ring's interior.
  ring() {
    const sub = makeSubstrate(W, H, (x, y) => {
      const dx = x - W / 2, dy = y - H / 2, r = Math.max(Math.abs(dx), Math.abs(dy));
      if (r === 14) return pack(TAU_A, 50);                 // the armor ring
      if (r === 15) return pack(TAU_R, 30);                 // inversion skin
      if (r < 14 && (x === 40 || x === 56) && (y === 22 || y === 42))
        return pack(TAU_I, 40);                             // the keepers (inside the ring)
      return pack(TAU_GROUND, 8);                           // baseline ground
    });
    return sub;
  },
  rand() {
    const rng = mulberry32(20260927);
    return makeSubstrate(W, H, () => pack(Math.floor(rng() * 4), Math.floor(rng() * 64)));
  },
  // C2's planted twins: two Abstain worms with equal d, far apart — the
  // wormhole table is their only bridge (they never touch neighborhoods).
  worms() {
    const rng = mulberry32(33);
    return makeSubstrate(W, H, (x, y) => {
      const onWorm = (y === 12 && x >= 8 && x < 30) || (y === 50 && x >= 62 && x < 84);
      if (onWorm) return pack(TAU_I, 40);
      if (rng() < 0.02) return pack(rng() < 0.5 ? TAU_A : TAU_R, Math.floor(rng() * 64)); // weather
      return pack(TAU_GROUND, 0);
    });
  },
};

function seed(name) {
  sub = seeds[name]();
  table = new WormholeTable();          // σ = log2(3), swept by the field lane
  wormholes = wormholes !== false;      // the toggle survives reseeding
  flash = new Float32Array(W * H);
  twinsLast = 0;
  frameStats.ticks = 0;
  render();                              // first paint before the loop catches up
}

// ── A2UI mapping: τ → color plane, d → intensity, twin hit → blink ────────
function render() {
  const px = img.data;
  for (let i = 0; i < W * H; i++) {
    const c = sub[i], t = tauOf(c), d = dOf(c), v = Math.round(255 * d / 63);
    let r, g, b;
    if (t === TAU_A)      { r = 0;        g = 40 + v;    b = 0; }        // green
    else if (t === TAU_R) { r = 40 + v;   g = 0;         b = 0; }        // red
    else if (t === TAU_I) {                                     // purple (+blink)
      const f = flash[i];
      r = Math.min(255, 90 + v * 0.6 + f * 200);
      g = Math.round(f * 190);
      b = Math.min(255, 140 + v * 0.6 + f * 115);
    } else                { r = 26;       g = 26;        b = 32; }       // ground gray
    const o = i * 4;
    px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// ── HUD: tick count + trace sha256 — determinism you can watch ────────────
function hudLine() {
  const sha = sha256Bytes(sub);         // hashes ONLY the byte plane
  const occ = table.occupiedCount();
  const whState = wormholes
    ? `wormholes <b style="color:#d9b8ff">ON</b> slots ${occ}/64`
    : 'wormholes <span class="off">OFF</span> (paired-arm view: no Looking Glass)';
  hud.innerHTML = `tick ${String(frameStats.ticks).padStart(6, ' ')} · sha256 <b>${sha.slice(0, 16)}…</b>` +
    ` · twins last tick ${twinsLast} · ${whState}` +
    ` · full: <span style="color:#4a4a5e">${sha}</span>`;
}

// ── the loop: one kernel tick per animation frame (~60 ticks/s) ───────────
function frame() {
  if (!paused) {
    const before = table.totalWrites;
    tick(sub, { wormholes, table });
    const ev = sub.lastEvents;
    twinsLast = ev.length;
    for (const e of ev) flash[e.y * W + e.x] = 1;       // blink the receivers
    if (wormholes && table.totalWrites > before) {
      for (let s = 0; s < 64; s++) {
        const hit = table.read(s);                       // writers blink fainter
        if (hit) flash[hit.y * W + hit.x] = Math.max(flash[hit.y * W + hit.x], 0.35);
      }
    }
    for (let i = 0; i < flash.length; i++) flash[i] *= 0.82;
    frameStats.ticks = sub.ticks;
    render();
    hudLine();
  }
  requestAnimationFrame(frame);
}

// ── controls ──────────────────────────────────────────────────────────────
const bPause = document.getElementById('b-pause');
const bWh = document.getElementById('b-wh');
document.getElementById('b-ring').onclick = () => seed('ring');
document.getElementById('b-rand').onclick = () => seed('rand');
document.getElementById('b-worms').onclick = () => seed('worms');
bPause.onclick = () => { paused = !paused; bPause.textContent = paused ? 'Run' : 'Pause'; };
bWh.onclick = () => {
  wormholes = !wormholes;
  bWh.textContent = wormholes ? 'wormholes ON' : 'wormholes OFF';
  bWh.classList.toggle('on', wormholes);
  hudLine();                                            // trace hash unchanged: the toggle is telemetry-free until a slot moves
};

seed('ring');
paused = false;
requestAnimationFrame(frame);
