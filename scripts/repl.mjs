// scripts/repl.mjs — THE INTERACTIVE REPL (orchestrator phase 39, task ORCH-B).
//
// A probe bench for the qthe substrate: build a plane, tick it, inspect cells
// and the wormhole table, save/load whole states — by hand (human) or by pipe
// (agent). Runs the REAL kernel via experiments/_adapter.mjs (loadKernel()
// first; the adapter refuses otherwise) and hashes with the canonical
// planeHash from experiments/_harness.mjs, so every number printed here is
// the same number the gates seal.
//
// HOUSE LAWS: DETERMINISM ONLY — no Math.random, no wall-clock in any output;
// the only randomness is mulberry32 with an EXPLICIT seed ('random'). FAIL
// LOUD — bad dims, out-of-bounds show, step with no substrate, corrupt saves
// all throw; the loop prints `error: ...`, keeps the session alive, and sets
// exit code 1 so a misbehaving piped run is visibly wrong. Zero dependencies
// beyond node builtins. Interactive prompt "qthe> "; piped commands are
// echoed before their output:
//   echo -e "new 64 64 twins\nstep 5\nstats\nquit" | node scripts/repl.mjs
import readline from 'node:readline';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  loadKernel, makeSubstrate, tick, mulberry32, bytePlane, WormholeTable, kernelReport,
} from '../experiments/_adapter.mjs';
import { planeHash } from '../experiments/_harness.mjs';

const TAU_NAMES = ['Ground', 'Attract', 'Repel', 'Abstain'];
let kernel = null;   // real kernel module (set in main, before any command)
let sub = null;      // live substrate (Uint8Array + expandos) or null
let cumulative = 0;  // twin events since new/load — the REPL-level meter
let eventsTick = 0;  // tick at which the current sub.lastEvents were produced

// ── guards / formatters ──────────────────────────────────────────────────────
function requireSub() { if (!sub) throw new Error("no substrate — create one first: 'new W H [pattern] [seed]'"); }
function intArg(name, raw) {
  const v = Number(raw);
  if (!Number.isInteger(v)) throw new Error(`${name}: expected an integer (got '${raw}')`);
  return v;
}
// (t,x,y,slot,resonance,term) — term rides as a 4-decimal string, never a raw float
function fmtEvent(e) { return `(t=${e.t},x=${e.x},y=${e.y},slot=${e.slot},resonance=${e.resonance},term=${e.term.toFixed(4)})`; }
function listEvents(events, pad, max) { // up to max tuples, then an honest "more"
  for (let i = 0; i < Math.min(events.length, max); i++) console.log(pad + fmtEvent(events[i]));
  if (events.length > max) console.log(`${pad}... and ${events.length - max} more`);
}

// ── patterns (all deterministic; 'random' draws ONLY from mulberry32) ────────
function patternFor(pattern, w, h, seedRaw) {
  if (pattern === 'empty') return { fn: () => 0, note: 'all Ground' };
  if (pattern === 'twins') {
    // Two Abstain d=20 twins at (8,8)/(W-8,H-8); one Attract d=40 and one
    // Repel d=30 in the opposite corners — toroidally ~16 away on 64x64, far
    // outside Moore-8, so twin resonance is the only active channel.
    const cells = [
      ['twin A', 8, 8, kernel.pack(3, 20)], ['twin B', w - 8, h - 8, kernel.pack(3, 20)],
      ['attract', w - 8, 8, kernel.pack(1, 40)], ['repel', 8, h - 8, kernel.pack(2, 30)],
    ];
    const seen = new Map(); // "x,y" -> name: bounds + collision receipts
    for (const [name, x, y] of cells) {
      if (x < 0 || x >= w || y < 0 || y >= h) throw new Error(`twins: ${name} at (${x},${y}) out of bounds for ${w}x${h} — need W,H >= 9`);
      const key = `${x},${y}`;
      if (seen.has(key)) throw new Error(`twins: '${seen.get(key)}' and '${name}' collide at (${x},${y}) — degenerate when W or H is 16; pick other dims`);
      seen.set(key, name);
    }
    const map = new Map(cells.map(([, x, y, b]) => [y * w + x, b]));
    return { fn: (x, y, i) => map.get(i) ?? 0, note: 'Abstain d=20 twins at (8,8)/(W-8,H-8), Attract d=40 + Repel d=30 weather' };
  }
  if (pattern === 'checker') {
    return { fn: (x, y) => ((x + y) % 2 === 0 ? kernel.pack(1, 32) : kernel.pack(2, 32)), note: 'Attract/Repel d=32 by (x+y)%2' };
  }
  if (pattern === 'ring') {
    if (w < 64 || h < 64) throw new Error(`ring: needs W,H >= 64 (got ${w}x${h}) — the r in [30,34] ring does not fit`);
    const cx = w / 2, cy = h / 2;
    const fn = (x, y) => {
      const dx = Math.min(Math.abs(x - cx), w - Math.abs(x - cx));   // toroidal wrap
      const dy = Math.min(Math.abs(y - cy), h - Math.abs(y - cy));
      const r = Math.sqrt(dx * dx + dy * dy);                        // Euclid on the torus
      return r <= 8 ? kernel.pack(1, 63) : (r >= 30 && r <= 34 ? kernel.pack(2, 55) : 0);
    };
    return { fn, note: 'Repel d=55 ring r in [30,34], Attract d=63 core r<=8, toroidal-Euclid around center' };
  }
  if (pattern === 'random') {
    if (seedRaw === undefined) throw new Error("random: needs an explicit seed — 'new W H random SEED' (determinism house rule: no unseeded randomness)");
    const rng = mulberry32(intArg('random seed', seedRaw)); // any integer; mulberry32 folds it via >>>0
    const fn = () => {
      const u = rng();                            // tau ~70% Ground / 10% each A, R, Abstain
      const tau = u < 0.7 ? 0 : u < 0.8 ? 1 : u < 0.9 ? 2 : 3;
      return (tau << 6) | Math.floor(rng() * 64); // d uniform 0..63
    };
    return { fn, note: `mulberry32 seed=${seedRaw}` };
  }
  throw new Error(`new: unknown pattern '${pattern}' — empty | twins | checker | ring | random`);
}

// ── commands ─────────────────────────────────────────────────────────────────
function cmdHelp() {
  console.log(`commands:
  help                      this list
  new W H [pattern] [seed]  create a substrate; patterns: empty (default) | twins | checker
                            | ring (W,H >= 64) | random SEED; prints the t=0 plane hash
  step [N]                  tick N times (default 1; wormholes ON, default sigma); prints
                            tick, plane hash, twin events (up to 10 listed)
  show x y                  one cell: tau name, d, packed byte, index; an Abstain
                            cell also reads wormhole slot d
  stats                     dims, ticks, tau census, d min/mean/max, table stats
  worm [slot]               dump the wormhole table (all occupied, or one slot)
  events                    ALL twin events from the last tick (step format)
  hash                      current plane hash (canonical w x h@t=...:hex)
  save PATH                 write {w,h,ticks,cells,wormholes,lastEvents} JSON
  load PATH                 rebuild from a save (ticks reset to 0; table restored
                            only if saved); verifies plane byte-identity
  quit                      exit`);
}

function cmdNew(args) {
  if (args.length < 2 || args.length > 4) throw new Error('new: usage — new W H [pattern] [seed]');
  const w = intArg('new: W', args[0]), h = intArg('new: H', args[1]);
  if (w < 1 || h < 1) throw new Error(`new: W and H must be positive (got W=${w}, H=${h})`);
  const pattern = args[2] ?? 'empty';
  if (args[3] !== undefined && pattern !== 'random') throw new Error(`new: pattern '${pattern}' takes no seed (only 'random' does)`);
  const { fn, note } = patternFor(pattern, w, h, args[3]);
  sub = makeSubstrate(w, h, fn);
  cumulative = 0; eventsTick = 0;
  console.log(`new substrate ${w}x${h} pattern=${pattern} (${note})`);
  console.log(`plane hash (t=0): ${planeHash(sub, 0, bytePlane)}`);
}

function cmdStep(args) {
  requireSub();
  if (args.length > 1) throw new Error('step: usage — step [N]');
  const n = args.length ? intArg('step: N', args[0]) : 1;
  if (n < 1) throw new Error(`step: N must be >= 1 (got ${n})`);
  const fired = [];
  for (let k = 0; k < n; k++) {
    tick(sub, { wormholes: true }); // sigma default: log2(3) or the table's own
    for (const e of sub.lastEvents || []) fired.push({ t: sub.ticks, ...e });
  }
  cumulative += fired.length; eventsTick = sub.ticks;
  console.log(`tick=${sub.ticks} hash=${planeHash(sub, sub.ticks, bytePlane)}`);
  console.log(`twin events: ${fired.length} this step (${cumulative} cumulative)`);
  if (fired.length) listEvents(fired, '  ', 10);
}

function cmdShow(args) {
  requireSub();
  if (args.length !== 2) throw new Error('show: usage — show x y');
  const x = intArg('show: x', args[0]), y = intArg('show: y', args[1]);
  if (x < 0 || x >= sub.w || y < 0 || y >= sub.h) throw new Error(`show: (${x},${y}) out of bounds for ${sub.w}x${sub.h}`);
  const i = y * sub.w + x, c = sub[i], tau = c >> 6, d = c & 63;
  console.log(`cell (${x},${y}) index=${i} byte=0x${c.toString(16).padStart(2, '0')} (${c}) tau=${tau} ${TAU_NAMES[tau]} d=${d}`);
  if (tau === 3) { // Abstain: what does slot d hold right now?
    const hit = sub.__wormholes ? sub.__wormholes.read(d) : null;
    console.log(hit ? `wormhole slot ${d}: (x=${hit.x},y=${hit.y}) resonance=${hit.resonance}`
      : `wormhole slot ${d}: empty${sub.__wormholes ? '' : ' (no table yet — no tick has run)'}`);
  }
}

function cmdStats() {
  requireSub();
  const census = [0, 0, 0, 0];
  let dMin = 64, dMax = -1, dSum = 0;
  for (let i = 0; i < sub.length; i++) {
    const c = sub[i], d = c & 63;
    census[c >> 6]++; dSum += d;
    dMin = Math.min(dMin, d); dMax = Math.max(dMax, d);
  }
  const t = sub.__wormholes;
  console.log(`substrate: ${sub.w}x${sub.h} ticks=${sub.ticks}`);
  console.log(`tau census: Ground=${census[0]} Attract=${census[1]} Repel=${census[2]} Abstain=${census[3]}`);
  console.log(`d: min=${dMin} mean=${(dSum / sub.length).toFixed(2)} max=${dMax}`);
  console.log(`wormhole table: ${t ? `${t.occupiedCount()}/64 slots occupied` : 'absent (no tick has run)'}, totalWrites=${t ? t.totalWrites : 0}`);
}

function cmdWorm(args) {
  requireSub();
  if (args.length > 1) throw new Error('worm: usage — worm [slot]');
  const t = sub.__wormholes;
  if (!t) { console.log('wormhole table: absent (no tick has run)'); return; }
  if (args.length === 1) {
    const s = intArg('worm: slot', args[0]);
    if (s < 0 || s > 63) throw new Error(`worm: slot must be in 0..63 (got ${s})`);
    const hit = t.read(s);
    console.log(hit ? `slot ${s}: (x=${hit.x},y=${hit.y}) resonance=${hit.resonance}` : `slot ${s}: empty`);
    return;
  }
  const snap = t.snapshot();
  console.log(`wormhole table (sigma=${t.sigma}, ${t.occupiedCount()}/64 occupied, totalWrites=${t.totalWrites}):`);
  let shown = 0;
  for (let s = 0; s < snap.length; s++) {
    if (snap[s]) { console.log(`  slot ${s}: (x=${snap[s].x},y=${snap[s].y}) resonance=${snap[s].resonance}`); shown++; }
  }
  if (!shown) console.log('  (all slots empty)');
}

function cmdEvents() {
  requireSub();
  const evts = (sub.lastEvents || []).map((e) => ({ t: eventsTick, ...e }));
  console.log(`twin events (last tick, t=${eventsTick}): ${evts.length}`);
  listEvents(evts, '  ', evts.length); // 'events' prints ALL of them
}

function cmdSave(args) {
  requireSub();
  if (args.length !== 1) throw new Error('save: usage — save PATH');
  // traceView from the real kernel when present (R5: serialize via traceView,
  // never JSON.stringify the Uint8Array with expandos); manual same-shape
  // fallback if a future kernel drops it.
  const tv = typeof kernel.traceView === 'function' ? kernel.traceView(sub) : {
    w: sub.w, h: sub.h, ticks: sub.ticks, cells: Array.from(sub),
    wormholes: sub.__wormholes && sub.__wormholes.occupiedCount() > 0 ? sub.__wormholes.snapshot() : null,
    events: sub.lastEvents || [],
  };
  const out = { w: tv.w, h: tv.h, ticks: tv.ticks, cells: tv.cells, wormholes: tv.wormholes, lastEvents: tv.events };
  const json = JSON.stringify(out);
  writeFileSync(args[0], json, 'utf8');
  console.log(`saved ${args[0]} (w=${out.w} h=${out.h} t=${out.ticks} cells=${out.cells.length} wormholeSlots=${out.wormholes ? out.wormholes.filter(Boolean).length : 0} lastEvents=${out.lastEvents.length} bytes=${json.length})`);
}

function cmdLoad(args) {
  if (args.length !== 1) throw new Error('load: usage — load PATH');
  let j;
  try { j = JSON.parse(readFileSync(args[0], 'utf8')); }
  catch (err) { throw new Error(`load: cannot read/parse ${args[0]} — ${err.message}`); }
  if (!Number.isInteger(j.w) || !Number.isInteger(j.h) || j.w < 1 || j.h < 1) throw new Error(`load: bad dims (w=${j.w}, h=${j.h}) in ${args[0]}`);
  if (!Array.isArray(j.cells) || j.cells.length !== j.w * j.h) throw new Error(`load: cells length ${Array.isArray(j.cells) ? j.cells.length : '?'} != w*h=${j.w * j.h} in ${args[0]}`);
  const bad = j.cells.findIndex((c) => !Number.isInteger(c) || c < 0 || c > 255);
  if (bad >= 0) throw new Error(`load: cells[${bad}]=${JSON.stringify(j.cells[bad])} is not a byte (0..255) — refusing a corrupt save`);
  const refT = Number.isInteger(j.ticks) ? j.ticks : 0;      // hash reference: the file's epoch
  const fileBytes = Uint8Array.from(j.cells);
  const before = planeHash({ w: j.w, h: j.h }, refT, () => fileBytes); // the plane as saved
  const next = makeSubstrate(j.w, j.h, (x, y, i) => fileBytes[i]); // cells + dims
  next.ticks = 0;                                              // fresh counter (spec)
  if (Array.isArray(j.wormholes)) {                            // table only if the save has one
    const table = WormholeTable();                             // default sigma (not in the save shape)
    for (const s of j.wormholes) if (s) {
      if (!Number.isInteger(s.slot) || s.slot < 0 || s.slot > 63) throw new Error(`load: wormhole slot ${JSON.stringify(s.slot)} is not in 0..63 — refusing a corrupt save`);
      table.write(s.slot, s.x, s.y, s.resonance);
    }
    next.__wormholes = table;
  }
  next.lastEvents = Array.isArray(j.lastEvents) ? j.lastEvents : [];
  const after = planeHash(next, refT, bytePlane);
  console.log(`loaded ${args[0]} (w=${j.w} h=${j.h} cells=${j.cells.length} wormholeSlots=${Array.isArray(j.wormholes) ? j.wormholes.filter(Boolean).length : 0} lastEvents=${next.lastEvents.length})`);
  console.log(`hash before rebuild (t=${refT}): ${before}`);
  console.log(`hash after rebuild  (t=${refT}): ${after}`);
  if (before !== after) throw new Error('load: PLANE MISMATCH — the rebuild changed bytes; keeping the previous substrate');
  sub = next; cumulative = 0; eventsTick = refT; // restored events fired at the file's epoch
  console.log('plane byte-identity: CONFIRMED (ticks reset to 0)');
}

// ── the loop ─────────────────────────────────────────────────────────────────
const COMMANDS = {
  help: cmdHelp, new: cmdNew, step: cmdStep, show: cmdShow, stats: cmdStats,
  worm: cmdWorm, events: cmdEvents, save: cmdSave, load: cmdLoad,
  hash: () => { requireSub(); console.log(`plane hash (t=${sub.ticks}): ${planeHash(sub, sub.ticks, bytePlane)}`); },
};

async function main() {
  const { kernel: k } = await loadKernel(); // adapter law: before ANY substrate op
  kernel = k;
  const rep = kernelReport();
  console.log(`[qthe repl] kernel=${rep.kernelKind} (${rep.kernelPath}) — 'help' lists commands`);
  const interactive = process.stdin.isTTY === true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt('qthe> ');
  rl.on('line', (line) => {
    const text = line.trim();
    if (text !== '' && !interactive) console.log(`qthe> ${text}`); // echo piped commands
    try {
      if (text === 'quit') { rl.close(); return; }
      if (text !== '') {
        const [cmd, ...rest] = text.split(/\s+/);
        const fn = COMMANDS[cmd];
        if (!fn) throw new Error(`unknown command '${cmd}' — try 'help'`);
        fn(rest);
      }
    } catch (err) {
      process.exitCode = 1; // loud: visible error + non-zero exit at the end
      console.error(`error: ${err.message}`);
    }
    if (interactive) rl.prompt();
  });
  rl.on('close', () => process.exit(process.exitCode || 0));
  if (interactive) rl.prompt();
}

main().catch((err) => { console.error(`fatal: ${err.message}`); process.exit(1); });
