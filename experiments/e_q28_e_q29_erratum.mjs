// experiments/e_q28_e_q29_erratum.mjs — ORCH-R26: output-shape erratum for
// the E-Q28/E-Q29 seals. The chain verdict rows carried the correct values
// (stations_to_coverage 6; live S4/S8 0.90/0.80) but the sealed OUTPUT files
// omitted two fields the curated claims table reads. Numbers unchanged —
// this is a shape fix + append-only erratum rows (the E-Q16 precedent).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendAndVerify, q, fileSha256 } from './_harness.mjs';
import { linkStone } from './_stone_link.mjs';
import { loadKernel, kernelReport } from './_adapter.mjs';

await loadKernel();
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'experiments', 'outputs');

// E-Q28: add stations_to_coverage (recomputed from the itinerary — the data)
const p28 = join(OUT, 'e_q28_results.json');
const d28 = JSON.parse(readFileSync(p28, 'utf8'));
const stc = d28.task.itinerary.length;
d28.stations_to_coverage = stc;
writeFileSync(p28, JSON.stringify(d28, null, 1));

// E-Q29: add live_confirm (from the sealed situation results — unchanged)
const p29 = join(OUT, 'e_q29_results.json');
const d29 = JSON.parse(readFileSync(p29, 'utf8'));
const sit29 = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r26', 'eq29_results.json'), 'utf8'));
d29.live_confirm = sit29.live_confirm;
writeFileSync(p29, JSON.stringify(d29, null, 1));

const { stone } = await linkStone();
const v28 = await appendAndVerify(stone, join(ROOT, 'receipts', 'e_q28_chain.jsonl'), [{
  kind: 'erratum.EQ28',
  what: 'output-file shape: experiments/outputs/e_q28_results.json omitted stations_to_coverage (the chain verdict row carried 6); added, recomputed from task.itinerary.length — numbers unchanged',
  stations_to_coverage: stc, kernel: kernelReport(),
}], { experiment: 'E-Q28', claim: 'evolution-steering-C24' });

const v29 = await appendAndVerify(stone, join(ROOT, 'receipts', 'e_q29_chain.jsonl'), [{
  kind: 'erratum.EQ29',
  what: 'output-file shape: experiments/outputs/e_q29_results.json omitted live_confirm (the chain verdict row carried live_S4 0.9 / live_S8 0.8); added from the sealed situation results — numbers unchanged',
  live_S4: q(sit29.live_confirm.eq29S4.accuracy), live_S8: q(sit29.live_confirm.eq29S8.accuracy), kernel: kernelReport(),
}], { experiment: 'E-Q29', claim: 'budget-knee-C25' });

console.log(`[erratum] e_q28 links=${v28.links} tip=${v28.tip} | e_q29 links=${v29.links} tip=${v29.tip}`);
