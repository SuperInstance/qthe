// experiments/e_q32_e_q33_erratum.mjs — ORCH-R27: output-shape erratum for
// the E-Q32/E-Q33 seals (the E-Q28/E-Q29 precedent): the chain verdict
// rows carried the correct values; the sealed OUTPUT files omitted two
// fields the curated claims table reads. Numbers unchanged.
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

const p32 = join(OUT, 'e_q32_results.json');
const d32 = JSON.parse(readFileSync(p32, 'utf8'));
const sit32 = JSON.parse(readFileSync(join(ROOT, 'situations', 'evolution_r26', 'eq32_results.json'), 'utf8'));
d32.cross_model_retrieval_agreement = sit32.cross_model_retrieval_agreement;
d32.heredity = sit32.heredity;
d32.decoupling_delta = sit32.decoupling_delta;
d32.directive_causality = sit32.directive_causality;
d32.predictions = sit32.predictions;
writeFileSync(p32, JSON.stringify(d32, null, 1));

const p33 = join(OUT, 'e_q33_results.json');
const d33 = JSON.parse(readFileSync(p33, 'utf8'));
const sit33 = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r26', 'eq33_results.json'), 'utf8'));
d33.generated_questions = sit33.generated_questions;
d33.misses = sit33.misses;
d33.local_best_curve = sit33.local_best_curve;
writeFileSync(p33, JSON.stringify(d33, null, 1));

const { stone } = await linkStone();
const v32 = await appendAndVerify(stone, join(ROOT, 'receipts', 'e_q32_chain.jsonl'), [{
  kind: 'erratum.EQ32',
  what: 'output-file shape: experiments/outputs/e_q32_results.json omitted cross_model_retrieval_agreement/heredity/decoupling_delta/directive_causality/predictions (the chain verdict row carried the values); added from the sealed situation results — numbers unchanged',
  agreement_family: q(sit32.cross_model_retrieval_agreement.family),
  heredity_mean: q(sit32.heredity.mean), kernel: kernelReport(),
}], { experiment: 'E-Q32', claim: 'retrieval-gate-C30' });

const v33 = await appendAndVerify(stone, join(ROOT, 'receipts', 'e_q33_chain.jsonl'), [{
  kind: 'erratum.EQ33',
  what: 'output-file shape: experiments/outputs/e_q33_results.json omitted generated_questions/misses/local_best_curve (the chain verdict row carried the values); added from the sealed situation results — numbers unchanged',
  live_accuracy: q(sit33.live_accuracy), kernel: kernelReport(),
}], { experiment: 'E-Q33', claim: 'ascending-shortcut-C31' });

writeFileSync(join(OUT, 'e_q32_tip.txt'), `${v32.tip} links=${v32.links}\n`);
writeFileSync(join(OUT, 'e_q33_tip.txt'), `${v33.tip} links=${v33.links}\n`);
console.log(`[erratum] e_q32 links=${v32.links} tip=${v32.tip} | e_q33 links=${v33.links} tip=${v33.tip}`);
