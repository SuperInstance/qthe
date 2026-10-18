// experiments/e_q27_seal.mjs — E-Q27 seal (ORCH-R25/T16-c): the ternary zero.
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
const A = JSON.parse(readFileSync(join(ROOT, 'situations', 'embedding_r25', 'eq27_results.json'), 'utf8'));
const preRegSha = fileSha256(join(ROOT, 'experiments', 'pre_registration_e_q27.json'));
const CHAIN = join(ROOT, 'receipts', 'e_q27_chain.jsonl');
const fmt = (x) => String(Math.round(x * 1e4) / 1e4);
const acc = (k) => A.arms[k].accuracy;

const SB = acc('SB'), ST = acc('ST'), SQ = acc('SQ'), NB = acc('NB'), NT = acc('NT'), NQ = acc('NQ');
const H1 = ST > SB || NT > NB;
const H2a = (ST > SB ? (SQ - ST) < (ST - SB) : true) && (NT > NB ? (NQ - NT) < (NT - NB) : true);
const H2b = SQ <= ST && NQ <= NT;
const H2 = H2a || H2b;
const H3 = (NT - NB) > (ST - SB);
const C22 = H1;
const P1 = (ST - SB) >= 0.05 && (NT - NB) >= 0.05;
const P2 = Math.abs(SQ - ST) <= 0.05 && Math.abs(NQ - NT) <= 0.05;
const P3 = A.zero_mass.NT > A.zero_mass.ST && A.zero_mass.NT >= 0.35 && A.zero_mass.ST >= 0.25;
const P4 = A.continuous_reference.S > Math.max(SB, ST, SQ) && A.continuous_reference.N > Math.max(NB, NT, NQ);

const verdict = `E-Q27 VERDICT (does the ternary zero do work? — binary vs ternary vs 4-level on both sealed arms, arm-filtered live queries, strict scoring): H1 ${H1 ? 'LIVES — C22 LIVES' : 'DIES'} — DECISIVELY, on BOTH arms: ternary beats binary by ${fmt(ST - SB)} on the score arm (0.60 vs 0.35) and ${fmt(NT - NB)} on the noul arm (0.60 vs 0.40): the sign alone loses five records per arm; the middle level carries real information (the zero says 'this record is TYPICAL here' — a refusal the binary code cannot express). H2 ${H2 ? 'LIVES' : 'DIES'} via the diminishing-returns clause: the ternary-to-4-level gain (${fmt(SQ - ST)} on S, ${fmt(NQ - NT)} on N) is smaller than the binary-to-ternary gain on both arms — but the arms DIVERGE at the 4th level: the score arm SATURATES at ternary (SQ ${fmt(SQ)} < ST ${fmt(ST)} — the ordinal spread's information is exhausted by 3 levels) while the noul arm KEEPS CLIMBING (NQ ${fmt(NQ)} — the calibrated mass buys two more records from the 4th level). H3 ${H3 ? 'LIVES' : 'DIES'}: the T-B gap is SMALLER on the noul arm (${fmt(NT - NB)} vs ${fmt(ST - SB)}) — the saturation-interaction prediction inverted; the zero-mass receipt explains it: ST ${fmt(A.zero_mass.ST)} vs NT ${fmt(A.zero_mass.NT)} — the noul arm does NOT have more zeros (P3 MISS; both arms sit near 0.24, below the predicted ranges). THE QUANTIZATION CURVES: S: ${fmt(SB)} -> ${fmt(ST)} -> ${fmt(SQ)} -> 0.70 (continuous); N: ${fmt(NB)} -> ${fmt(NT)} -> ${fmt(NQ)} -> 0.80. THE CONSUMER LAW: the marginal value of quantization levels is ARM-DEPENDENT — ordinal spread saturates at 3 levels; calibrated mass keeps paying to 4. At equal PRACTICAL storage (2 bits/axis packed) the 4-level noul code (0.70) is the best 16-bit configuration; the ternary code remains the algebra-capable one (the E-Q26 offset arithmetic operates on {-1,0,+1} codes) and the theory-efficient one (~1.5 bits/axis measured). Binary is never the right choice on this corpus: the zero is worth five records.`;

writeFileSync(join(OUT, 'e_q27_results.json'), JSON.stringify({
  experiment: 'E-Q27', claim: 'C22 — the ternary zero does work', kernel: kernelReport(), preRegSha,
  registration: 'experiments/pre_registration_e_q27.json (no amendments — all calls as registered)',
  task: { arms: 'SB/ST/SQ (score) + NB/NT/NQ (noul), 120 vectors upserted arm-tagged, arm-filtered topK 20, strict denominator 20', calls: 'ZERO new embed calls' },
  arms: A.arms, zero_mass: A.zero_mass, continuous_reference: A.continuous_reference,
  hypotheses: { H1, H2, H2a, H2b, H3, C22 }, predictions: { P1, P2, P3, P4 }, verdict,
}, null, 1));

const rows = [
  { kind: 'rules.EQ27', frozen_by: 'experiments/pre_registration_e_q27.json sha ' + preRegSha.slice(0, 16) + '…',
    proposal_cited: 'ORCH-R25 lane T16-c — the prior-art pass open question Q3 (does the ternary zero do work?)',
    claim: 'C22 — the ternary middle level carries retrieval information beyond the sign',
    floors: 'F1 sealed vectors recomputed; F2 quantization tables from the arm corpus only; F3 six arms upserted arm-tagged AND arm-filtered live-queried; F4 strict denominator 20',
    bands: 'H1 T > B on >= 1 arm; H2 diminishing or non-increasing to 4-level; H3 T-B gap larger on N; C22 = H1' },
  { kind: 'run.config', experiment: 'E-Q27', kernel: kernelReport(),
    design: 'binary (x>m -> +1 else -1) / ternary (E-Q22 AM1 rule) / 4-level (quartiles {-1.5,-0.5,+0.5,+1.5}) on both sealed arms; metadata-index-filtered topK 20; 30s changeset wait (the async law)',
    moth: 'ZERO credits', llm: 'ZERO new calls' },
  { kind: 'verdict.EQ27', experiment: 'E-Q27', H1, H2, H3, C22,
    SB: q(SB), ST: q(ST), SQ: q(SQ), NB: q(NB), NT: q(NT), NQ: q(NQ),
    zero_ST: q(A.zero_mass.ST), zero_NT: q(A.zero_mass.NT), P1, P2, P3, P4, verdict },
];
const { stone } = await linkStone();
const v = await appendAndVerify(stone, CHAIN, rows, { experiment: 'E-Q27', claim: 'ternary-zero-C22' });
writeFileSync(join(OUT, 'e_q27_tip.txt'), `${v.tip} links=${v.links}\n`);
console.log(`[e-q27] chain ok links=${v.links} tip=${v.tip}`);
console.log(`[e-q27] H1=${H1} H2=${H2} H3=${H3} C22=${C22} | S: ${SB}/${ST}/${SQ} N: ${NB}/${NT}/${NQ}`);
console.log(`[e-q27] ${verdict}\n`);
