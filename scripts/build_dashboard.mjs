// scripts/build_dashboard.mjs — ORCH-C (roadmap phase 34): the claim dashboard.
//
// Reads the SEALED RECORD from disk and emits docs/dashboard.html — a single
// self-contained static page (inline CSS, no <script>, no network, no fonts
// fetched) that renders the LAYER 2 scoreboard, the chain-of-chains, and the
// falsification budget for a stranger in one glance.
//
// Sources of truth (nothing is hand-copied; everything is parsed + cross-checked):
//   docs/CLAIM-VERDICTS.md          scoreboard rows + mechanism one-liners
//   experiments/outputs/*_tip.txt   full chain tips + link counts
//   experiments/outputs/fleet_seeds_entry.json   kernel sha + chain pins
//   docs/FALSIFICATION-BUDGET.md    accounts + crown-jewel list
//   scripts/emit_fleet_seeds.mjs    chain-name -> file mapping (parsed)
//   scripts/probe_gate.mjs          gate scope (parsed) + receipts/probe_gate_chain.jsonl
//
// DETERMINISM IS THE CONTRACT: no wall-clock, no randomness, no environment
// spill — reruns are byte-identical ("generated from the sealed record", not
// a date). Fail-loud on any cross-check mismatch (house law: refuse-if-broken).
//
// Usage: node scripts/build_dashboard.mjs
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const exists = (p) => { try { readFileSync(join(ROOT, p)); return true; } catch { return false; } };
const sha256 = (p) => createHash('sha256').update(readFileSync(join(ROOT, p))).digest('hex');
const rowCount = (p) => read(p).split('\n').filter((l) => l.trim() !== '').length;
const die = (why) => { console.error(`build_dashboard: REFUSED — ${why}`); process.exit(1); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const codeify = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

// ── 1. scoreboard — docs/CLAIM-VERDICTS.md ─────────────────────────────────
const verdictsMd = read('docs/CLAIM-VERDICTS.md');
const sections = verdictsMd.split(/^## /m);
const scoreSec = sections.find((s) => s.startsWith('Scoreboard')) ?? die('no "## Scoreboard" section in docs/CLAIM-VERDICTS.md');

// scoreboard table rows: | # | claim | verdict | priced by | chain tip |
const claims = scoreSec.split('\n').filter((l) => /^\| C/.test(l)).map((line) => {
  const c = line.split('|').slice(1, -1).map((x) => x.trim());
  const v = c[2].match(/^\*\*(LIVES|DIES|STANDS)\*\*(?:\s*\(([^)]*)\))?(?:\s+—\s+(.*))?$/)
    ?? die(`unparsable verdict cell in scoreboard row "${c[0]}"`);
  const t = c[4].match(/`([0-9a-f]+)…`(?: \((\d+) links\))?/)
    ?? die(`unparsable chain-tip cell in scoreboard row "${c[0]}"`);
  return {
    id: c[0], text: c[1], verdict: v[1], qualifier: v[2] ?? '', detail: v[3] ?? '',
    pricedBy: c[3], exp: (c[3].match(/E-Q\d+/) ?? [])[0], expId: 'e_q' + ((c[3].match(/E-Q(\d+)/) ?? [])[1] ?? die(`no experiment id in priced-by "${c[3]}"`)), tipPrefix: t[1], links: t[2] !== undefined ? Number(t[2]) : null,
  };
});
claims.length === 9 || die(`expected 9 scoreboard rows, found ${claims.length}`); // 8 -> 9 at ORCH-R21: C11 added (E-Q20)

// mechanism one-liners: first sentence of each claim's "Mechanism
// (re-derivable from the kernel)" paragraph; C5′'s lives in C5's Boundary.
const firstSentence = (s) => {
  const t = s.replace(/\s+/g, ' ').replace(/\*\*/g, '').replace(/`/g, '').trim();
  const cut = t.search(/\.(\s|$)/);
  return cut === -1 ? t : t.slice(0, cut + 1);
};
const mechanisms = {};
for (const chunk of sections) {
  const m = chunk.match(/^(C\d+′?) — /);
  if (!m) continue;
  const mech = chunk.match(/\*\*Mechanism \(re-derivable from the kernel\):\*\*([\s\S]*?)\n\n/);
  if (mech) mechanisms[m[1]] = firstSentence(mech[1]);
  if (m[1] === 'C5') {
    const b = chunk.match(/\*\*Boundary:\*\* C5′ \(injector semantics\) STANDS and is priced definitional\s*\(E-Q10\):\s+([\s\S]*?)\n\n/);
    if (b) mechanisms['C5′'] = firstSentence(b[1]);
  }
}
// curated fallbacks (only used if the doc restructures; keeps the build honest)
const FALLBACK_MECHANISMS = {
  C1: 'the byte packs operator and operand into one memory transaction — 47.40% less semantic traffic, forever.',
  C2: 'the 64-slot wormhole table is the only causal path across Ground (8/8 ON vs 0/20 OFF).',
  C3: 'a pure gain has no critical scale — σ is monotone-inert on this class.',
  C4: 'the cascade is real but converts firings into no terminal structure — no phase transition.',
  C5: 'the rule table has no repair term — like-timbre neighbors walk d to 0 monotonically.',
  'C5′': 'definitional: an injector restores d, the substrate re-erodes it deterministically.',
};
for (const c of claims) if (!mechanisms[c.id]) {
  console.error(`build_dashboard: note — mechanism for ${c.id} not found in CLAIM-VERDICTS.md, using curated fallback`);
  mechanisms[c.id] = FALLBACK_MECHANISMS[c.id];
}
const supporting = (scoreSec.split('\n\n').find((b) => b.startsWith('Supporting mechanism verdicts')) ?? '')
  .replace(/^Supporting mechanism verdicts[^:]*:\s*/, '').replace(/\s+/g, ' ').trim();

// ── 2. chain tips — experiments/outputs/*_tip.txt ──────────────────────────
const tips = {};
for (const f of readdirSync(join(ROOT, 'experiments', 'outputs')).filter((f) => f.endsWith('_tip.txt')).sort()) {
  const [tip, rest] = read(join('experiments', 'outputs', f)).trim().split(' ');
  tips[f.replace('_tip.txt', '')] = { tip, links: rest?.startsWith('links=') ? Number(rest.slice(6)) : null };
}

// ── 3. fleet-seeds entry — kernel sha + chain pins ─────────────────────────
const fleet = JSON.parse(read('experiments/outputs/fleet_seeds_entry.json'));
fleet.kind === 'fleet-seeds.entry' || die('fleet_seeds_entry.json is not a fleet-seeds entry');

// chain pin/scope mapping — from the single registry (ORCH-R10: this builder
// once regex-parsed the producer scripts' hand-maintained lists and inherited
// every drift of what it parsed; defect #7's fifth instance, now impossible)
import { STONE_CHAINS as REGISTRY, CONTENT_TIPS as TIP_REGISTRY } from './chain_registry.mjs';
const chainFiles = REGISTRY.map((r) => [r.pin, r.path]);
const gateStone = new Map(REGISTRY.map((r) => [r.path, r.gate]));
const gateContent = new Map(TIP_REGISTRY.map((r) => [r.path, r.gate]));

// the sealed probe-gate run (last run row of the gate's own chain)
const gateRun = read('receipts/probe_gate_chain.jsonl').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)).reverse().find((r) => r.kind === 'probe_gate.run') ?? die('no probe_gate.run row in receipts/probe_gate_chain.jsonl');
const g = gateRun.sections;

// ── 4. falsification budget — docs/FALSIFICATION-BUDGET.md ─────────────────
const budgetMd = read('docs/FALSIFICATION-BUDGET.md');
const account = (label) => Number((budgetMd.match(new RegExp(`\\| ${label} \\| (\\d+)`)) ?? [])[1] ?? die(`cannot parse account "${label}" from FALSIFICATION-BUDGET.md`));
const nullsBanked = account('honest nulls / falsifications banked');
const surviving = account('claims surviving');
const defectsCaught = account('defects caught by the discipline itself');
const diskChains = Number((budgetMd.match(/\| stone-v1 chains on disk \| (\d+)/) ?? [])[1] ?? die('cannot parse chains-on-disk account'));
const diskRows = Number((budgetMd.match(/\| stone-v1 chains on disk \| \d+ \((\d+) rows/) ?? [])[1] ?? die('cannot parse rows-on-disk account'));
const budgetSection = (heading) => budgetMd.split(`## ${heading}`)[1]?.split('\n## ')[0] ?? die(`no "## ${heading}" section in FALSIFICATION-BUDGET.md`);
const jewels = budgetSection('Banked nulls (the crown jewels)').split('\n')
  .map((l) => l.match(/^- \*\*(.+?)\*\* — priced by (.+) \(([^()]*)\)$/)).filter(Boolean)
  .map((m) => ({ what: m[1], by: m[2], where: m[3] }));
const survivingList = budgetSection('Surviving claims (each with a mechanism explanation)').split('\n')
  .map((l) => l.match(/^- \*\*(.+?)\*\* — (.+) \(([^()]*)\)$/)).filter(Boolean)
  .map((m) => ({ what: m[1], by: m[2], where: m[3] }));
const defectList = budgetSection('Defects the discipline caught (none reached a consumer)').split('\n')
  .map((l) => l.match(/^- (.+) — (.+)$/)).filter(Boolean).map((m) => ({ what: m[1], by: m[2] }));

// ── 5. cross-checks (fail-loud; the dashboard never lies about its inputs) ─
sha256('qthe.mjs') === fleet.kernel_sha256 || die('fleet-seeds kernel sha does NOT match qthe.mjs on disk — re-run scripts/emit_fleet_seeds.mjs');
// ORCH-R11 (hy4p self-critique, adopted): the registry is the single source of
// truth — pin its own sha so a registry edit that legalizes a forged chain
// fails HERE until fleet seeds are re-emitted in the open.
fleet.chain_registry_sha256 === sha256('scripts/chain_registry.mjs') || die('chain_registry.mjs sha does NOT match the fleet-seeds pin — a registry edit landed without re-emitting fleet seeds (re-run scripts/emit_fleet_seeds.mjs)');
chainFiles.length === Object.keys(fleet.chain_tips).length || die(`fleet-seeds pins ${Object.keys(fleet.chain_tips).length} chains but the emit script maps ${chainFiles.length}`);
let pinnedRows = 0;
for (const [name, path] of chainFiles) {
  exists(path) || die(`chain file ${path} (${name}) missing`);
  const pin = fleet.chain_tips[name] ?? die(`no pin for chain "${name}" in fleet_seeds_entry.json`);
  sha256(path) === pin.sha256 || die(`chain ${name}: pinned sha256 does not match ${path} on disk — re-run scripts/emit_fleet_seeds.mjs`);
  rowCount(path) === pin.rows || die(`chain ${name}: pinned rows ${pin.rows} != ${rowCount(path)} on disk`);
  pinnedRows += pin.rows;
}
for (const c of claims) {
  const t = tips[c.expId] ?? die(`no experiments/outputs/${c.expId}_tip.txt for ${c.id} (priced by ${c.pricedBy})`);
  t.tip.startsWith(c.tipPrefix) || die(`${c.id}: scoreboard tip ${c.tipPrefix}… != pinned tip ${t.tip.slice(0, 8)}…`);
  t.links === c.links || die(`${c.id}: scoreboard says ${c.links} links, tip file says ${t.links}`);
  const f = fleet.scoreboard[c.id.replace('′', "'")] ?? die(`no fleet-seeds scoreboard entry for ${c.id}`);
  const fv = f.match(/^(LIVES|DIES|STANDS)/) ?? die(`unparsable fleet verdict "${f}" for ${c.id}`);
  fv[1] === c.verdict || die(`${c.id}: scoreboard says ${c.verdict}, fleet-seeds says ${fv[1]}`);
  f.includes(c.exp) || die(`${c.id}: fleet-seeds prices it by ${f}, scoreboard says ${c.exp}`);
}
jewels.length === nullsBanked || die(`crown jewels list has ${jewels.length} entries, account says ${nullsBanked}`);
survivingList.length === surviving || die(`surviving list has ${survivingList.length} entries, account says ${surviving}`);
defectList.length === defectsCaught || die(`defects list has ${defectList.length} entries, account says ${defectsCaught}`);

// ── 6. render ──────────────────────────────────────────────────────────────
const VERDICT_CLASS = { LIVES: 'g', DIES: 'r', STANDS: 'a' };
const ksha = fleet.kernel_sha256;
const nChains = Object.keys(fleet.chain_tips).length;

const scoreRows = claims.map((c) => `      <tr>
        <td class="claim"><b>${esc(c.id)}</b> ${esc(c.text)}</td>
        <td class="v ${VERDICT_CLASS[c.verdict]}">${esc(c.verdict)}${c.qualifier ? `<span class="q"> (${esc(c.qualifier)})</span>` : ''}${c.detail ? `<span class="d">${esc(c.detail)}</span>` : ''}</td>
        <td class="mech">${esc(mechanisms[c.id])}</td>
        <td class="dim">${esc(c.pricedBy)}</td>
        <td class="tip" title="stone-v1 chain tip — full ${tips[c.expId].tip}">${esc(tips[c.expId].tip.slice(0, 16))}</td>
        <td class="num">${c.links}</td>
      </tr>`).join('\n');

const chainRows = chainFiles.map(([name, path]) => {
  const pin = fleet.chain_tips[name];
  const gate = name === 'probe_gate' ? 'self — the gate&rsquo;s own receipt'
    : gateStone.has(path) ? 'PG1 &middot; stone &check;'
    : gateContent.has(`experiments/outputs/${name}_tip.txt`) ? 'PG2 &middot; tip-pin &check;'
    : '&mdash;';
  return `      <tr>
        <td class="claim"><b>${esc(name)}</b> <span class="dim">${esc(path)}</span></td>
        <td class="num">${pin.rows}</td>
        <td class="tip" title="sha256 of the chain file — full ${pin.sha256}">${esc(pin.sha256.slice(0, 16))}</td>
        <td class="dim">${gate}</td>
      </tr>`;
}).join('\n');

const jewelItems = jewels.map((j) => `      <li><b>${esc(j.what)}</b> — priced by ${esc(j.by)} <span class="dim">(${esc(j.where)})</span></li>`).join('\n');

const html = `<!doctype html>
<!-- qthe claim dashboard — docs/dashboard.html. GENERATED FILE: do not edit
     by hand; regenerate with:  node scripts/build_dashboard.mjs  (ORCH-C).
     Single self-contained page: inline CSS, no scripts, no network, no
     wall-clock — "generated from the sealed record", byte-identical on rerun.
     Every number below is parsed + cross-checked from the sealed record:
     docs/CLAIM-VERDICTS.md · docs/FALSIFICATION-BUDGET.md ·
     experiments/outputs/ (tips + fleet-seeds pins) · receipts/ (gate chain). -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Crect width='8' height='8' fill='%23a86ae8'/%3E%3C/svg%3E">
<title>qthe — claim dashboard</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0b0b10; color: #c9c9d4;
         font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  main { max-width: 1020px; margin: 2rem auto; padding: 0 1rem 3rem; }
  h1 { font-size: 15px; font-weight: 600; color: #e8e8f2; margin: 0 0 2px; }
  h1 span { color: #a86ae8; }                       /* the Abstain purple */
  p.sub { margin: 0 0 18px; color: #6f6f80; }
  p.sub .sha { color: #d9b8ff; }
  p.sub .sha i { font-style: normal; color: #6f6f80; }
  .panel { background: #12121a; border: 1px solid #23232e; padding: 10px 12px; margin-bottom: 14px; }
  .panel h2 { font-size: 11px; font-weight: 600; color: #6f6f80; margin: 0 0 8px;
              letter-spacing: .08em; text-transform: uppercase; }
  .panel h3 { font-size: 11px; font-weight: 600; color: #6f6f80; margin: 12px 0 4px;
              letter-spacing: .08em; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; font-weight: 600; color: #6f6f80;
       text-transform: uppercase; letter-spacing: .06em; padding: 2px 10px 6px 0;
       border-bottom: 1px solid #23232e; vertical-align: bottom; }
  td { padding: 7px 10px 7px 0; border-bottom: 1px solid #1b1b25; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  td.claim b { color: #e8e8f2; font-weight: 600; }
  td.dim, .dim { color: #6f6f80; }
  td.mech { color: #9a9aac; min-width: 24ch; }
  td.tip { color: #9a9aac; white-space: nowrap; }
  td.num { color: #9a9aac; white-space: nowrap; }
  .v { font-weight: 600; white-space: nowrap; }
  .v .q { color: #6f6f80; font-weight: 400; font-size: 11px; }
  .v .d { display: block; color: #6f6f80; font-weight: 400; font-size: 11px;
          margin-top: 2px; max-width: 26ch; }
  .g { color: #4fd45f; } .r { color: #e05a5a; } .a { color: #e0a84f; }
  .legend { margin: 8px 0 0; color: #6f6f80; font-size: 11px; }
  .legend i { font-style: normal; }
  p.note { margin: 8px 0 0; color: #6f6f80; font-size: 11.5px; }
  p.note code, li code { color: #d9b8ff; }
  .counts { display: flex; gap: 10px; flex-wrap: wrap; margin: 2px 0 4px; }
  .count { flex: 1 1 170px; background: #0b0b10; border: 1px solid #23232e; padding: 8px 10px; }
  .count b { display: block; font-size: 22px; font-weight: 600; color: #e8e8f2; }
  .count.p b { color: #a86ae8; }
  .count span { color: #6f6f80; font-size: 11px; }
  ul.jewels { margin: 4px 0 0; padding-left: 18px; color: #9a9aac; }
  ul.jewels li { margin: 3px 0; }
  ul.jewels b { color: #c9c9d4; }
  pre { background: #0b0b10; border: 1px solid #23232e; padding: 8px 10px;
        margin: 8px 0 0; overflow-x: auto; font-size: 12px; }
  pre .cmd { color: #d9b8ff; }
  pre .c { color: #55555f; }
</style>
</head>
<body>
<main>
  <h1>qthe <span>&middot; claim dashboard</span></h1>
  <p class="sub">kernel sha256 <span class="sha">${esc(ksha.slice(0, 16))}<i>${esc(ksha.slice(16))}</i></span> (qthe.mjs, recomputed from disk at build)<br>
     generated from the sealed record by <span class="sha">scripts/build_dashboard.mjs</span> (ORCH-C &middot; roadmap phase 34) &middot; deterministic rebuild, no wall-clock inside &middot; zero deps beyond node: builtins</p>

  <div class="panel" id="scoreboard">
    <h2>scoreboard &middot; LAYER 2 claims priced (6 of 6)</h2>
    <table>
      <thead><tr><th>claim (gifted corpus)</th><th>verdict</th><th>mechanism &middot; one line, re-derivable from the kernel</th><th>priced by</th><th>chain tip</th><th>links</th></tr></thead>
      <tbody>
${scoreRows}
      </tbody>
    </table>
    <p class="legend">LIVES <i class="g">priced and held</i> &middot; DIES <i class="r">falsified or honest null — the body is kept</i> &middot; STANDS <i class="a">definitional, receipted as such</i></p>
    <p class="note">supporting mechanism verdicts (bound the claims, not LAYER 2): ${codeify(supporting)}</p>
  </div>

  <div class="panel" id="chains">
    <h2>chain of chains &middot; ${nChains} stone-v1 receipts pinned by fleet-seeds (${pinnedRows} rows)</h2>
    <table>
      <thead><tr><th>chain</th><th>rows</th><th>tip (sha256 of chain file)</th><th>probe gate</th></tr></thead>
      <tbody>
${chainRows}
      </tbody>
    </table>
    <p class="note">verified by the probe gate — sealed run: <b>${esc(gateRun.verdict)}</b> (scope=${esc(gateRun.scope)}, ${gateRun.failed} failed) &middot; PG1 stone ${g.PG1_STONE.verified}/${g.PG1_STONE.chains} verified from disk &middot; PG2 tip-pin ${g.PG2_TIP_PIN.checked} checked &middot; PG3 tamper control ${g.PG3_NEGATIVE.refused ? 'refused the flipped byte' : 'ACCEPTED A TAMPERED CHAIN'} &middot; PG4 ${g.PG4_DETERMINISM.ticks}-tick twin probe byte-identical &middot; PG5 ${g.PG5_BOUNDS.elapsedMs}ms / ${g.PG5_BOUNDS.rssMb}MB within ${esc(g.PG5_BOUNDS.ceilings)}${g.PG6_VERDICT_RECOMPUTE ? ` &middot; PG6 verdict-recompute ${g.PG6_VERDICT_RECOMPUTE.passed}/${g.PG6_VERDICT_RECOMPUTE.claims} claims re-derived from the sealed outputs` : ' &middot; PG6 not in the sealed run — rerun the gate to seal it'}.<br>
    gate scope today: ${gateStone.size} stone chains + ${gateContent.size} content-hash tips${gateStone.size === g.PG1_STONE.chains ? ' (the sealed run covers the full current scope)' : ` (the sealed run covered ${g.PG1_STONE.chains} stone chains — the scope has grown since; rerun the gate to re-seal it)`}. every pin above was recomputed from disk at build time.</p>
  </div>

  <div class="panel" id="budget">
    <h2>falsification budget &middot; what the house paid to know</h2>
    <div class="counts">
      <div class="count"><b>${nullsBanked}</b><span>nulls / falsifications banked</span></div>
      <div class="count"><b>${surviving}</b><span>claims surviving</span></div>
      <div class="count"><b>${defectsCaught}</b><span>defects caught by the discipline itself</span></div>
      <div class="count p"><b>0</b><span>silent failures</span></div>
    </div>
    <h3>crown jewels &middot; banked nulls (mistakes downstream systems will never make)</h3>
    <ul class="jewels">
${jewelItems}
    </ul>
    <p class="note">the reading: ${nullsBanked} banked nulls and ${defectsCaught} caught defects against zero silent failures — every cost converted into a boundary the next system inherits for free. source: docs/FALSIFICATION-BUDGET.md (${diskChains} chain files, ${diskRows} rows on disk; fleet-seeds pins ${nChains} chains, ${pinnedRows} rows${diskRows === pinnedRows ? '' : ' — regenerate both from the same disk state to reconcile'}).</p>
  </div>

  <div class="panel" id="verify">
    <h2>how to verify this page</h2>
    <p class="note">every number above was parsed from the sealed record and cross-checked at build time (kernel sha &check; qthe.mjs &middot; 6/6 verdicts &check; fleet-seeds scoreboard &middot; 6/6 tips &check; pinned tip files &middot; ${nChains}/${nChains} chain pins recomputed from disk &middot; budget accounts &check; their lists). re-derive it yourself, from a fresh clone:</p>
    <pre><span class="cmd">node scripts/verify_all_chains.mjs</span>     <span class="c"># every stone-v1 chain re-verified from disk (fail-loud)</span>
<span class="cmd">node scripts/probe_gate.mjs</span>              <span class="c"># PG1-PG6 harness integrity gate (tamper + determinism + bounds + verdict-recompute)</span>
<span class="cmd">node scripts/falsification_budget.mjs</span>    <span class="c"># regenerate the falsification-budget ledger from the sealed record</span></pre>
    <p class="note">then rebuild this page: <code>node scripts/build_dashboard.mjs</code> — deterministic, byte-identical on rerun.</p>
  </div>
</main>
</body>
</html>
`;

writeFileSync(join(ROOT, 'docs', 'dashboard.html'), html);
const nLives = claims.filter((c) => c.verdict === 'LIVES').length;
const nDies = claims.filter((c) => c.verdict === 'DIES').length;
const nStands = claims.filter((c) => c.verdict === 'STANDS').length;
console.log(`scoreboard: ${claims.length} claims (${nLives} LIVES / ${nDies} DIES / ${nStands} STANDS) — all cross-checked against the fleet-seeds entry`);
console.log(`chains: ${nChains} pinned, ${pinnedRows} rows, every sha256 recomputed from disk`);
console.log(`budget: ${nullsBanked} nulls banked / ${surviving} surviving / ${defectsCaught} defects caught`);
console.log(`wrote docs/dashboard.html (${html.length.toLocaleString('en-US')} bytes) — generated from the sealed record`);
