#!/usr/bin/env bash
# ORCH-R16 — the C6/C7/C8 live checks, re-runnable. Every LAYER 2 claim the
# cloudflare/ module makes is measured by this script against the LIVE
# deployment. Exit non-zero on any failure (fail-closed).
#
# Usage: bash cloudflare/live_checks.sh
set -u
W="${QTHE_WORKER_URL:-https://qthe-cell.casey-digennaro.workers.dev}"
P="${QTHE_PAGES_URL:-https://qthe-demo.pages.dev}"
FAIL=0
say() { printf '%s\n' "$*"; }
chk() { if [ "$1" = "0" ]; then say "PASS  $2"; else say "FAIL  $2"; FAIL=1; fi; }

J() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }

say "== worker info =="
INFO=$(curl -s "$W/")
say "build: $(echo "$INFO" | J "d.get('build')")"

say "== C5/determinism over HTTP (P3) =="
curl -s -X POST "$W/field/livecheck-a/init?w=32&h=32&seed=777" > /dev/null
curl -s -X POST "$W/field/livecheck-b/init?w=32&h=32&seed=777" > /dev/null
curl -s -X POST "$W/field/livecheck-a/tick?times=40" > /dev/null
curl -s -X POST "$W/field/livecheck-b/tick?times=40" > /dev/null
HA=$(curl -s "$W/field/livecheck-a/hash" | J "d['sha256']")
HB=$(curl -s "$W/field/livecheck-b/hash" | J "d['sha256']")
[ -n "$HA" ] && [ "$HA" = "$HB" ]; chk $? "cross-DO determinism (seed 777, 40 ticks): ${HA:0:16}…"

AB=$(curl -s "$W/field/livecheck-a/abtest" | J "d['agree']")
[ "$AB" = "True" ]; chk $? "in-DO replay agreement"

say "== C6 twin sidecar (P4; eventual consistency — the DO is authoritative, the sidecar converges) =="
# Vectorize is eventually consistent: an upsert may take seconds to be visible
# to queries. Retry with backoff and record convergence; the CLAIM is
# convergence + exact agreement, not instantaneous match.
# ORCH-R19: the C6 check is FIELD-SCOPED (ERRATUM 4 — vector ids namespaced
# per field after the field-agnostic ids let any field's sync clobber any
# other's) and the retry budget is 15x15s after a delete-mutation + fresh-upsert window observed >100s (the r16 eventual-consistency law;
# observed propagation exceeded the old 5x8s budget on 2026-10-18 while the
# values HAD converged two minutes later — the claim is convergence, the
# retry prices the wait).
C6=1; TRY=0
while [ $TRY -lt 15 ]; do
  TRY=$((TRY+1))
  TW=$(curl -s "$W/twins/13?field=livecheck-a")
  SLOT=$(echo "$TW" | J "d['c6_twin_lookup']['slot'] if d['c6_twin_lookup'] else -1")
  DO=$(curl -s "$W/field/livecheck-a" | J "str([s for s in d['view']['wormholes'] or [] if s['slot']==13][0])")
  VC=$(echo "$TW" | J "str({'slot':d['c6_twin_lookup']['slot'],'x':d['c6_twin_lookup']['x'],'y':d['c6_twin_lookup']['y'],'resonance':d['c6_twin_lookup']['resonance']}) if d['c6_twin_lookup'] else 'null'")
  if [ "$SLOT" = "13" ] && [ "$DO" = "$VC" ]; then C6=0; break; fi
  say "      (attempt $TRY: sidecar lagging — retrying after 10s)"
  sleep 15
done
chk $C6 "Vectorize slot 13 == DO live table after convergence (attempts: $TRY; $DO)"

say "== C7 receipt chains (P5) =="
RSHA=$(curl -sD - "$W/receipt/receipts/e_q1_chain.jsonl" -o /tmp/qthe_live_e_q1.jsonl | grep -i x-qthe-sha256 | tr -d '\r' | awk '{print $2}')
LSHA=$(sha256sum receipts/e_q1_chain.jsonl | awk '{print $1}')
cmp -s /tmp/qthe_live_e_q1.jsonl receipts/e_q1_chain.jsonl
CMP=$?
[ "$RSHA" = "$LSHA" ] && [ "$CMP" = "0" ]; chk $? "R2 e_q1_chain sha256-identical ($LSHA)"

say "== C8 Pages mirror (P6) =="
CODE=$(curl -sL -o /tmp/qthe_pages.html -w "%{http_code}" "$P/")
[ "$CODE" = "200" ] && grep -q "qthe on Cloudflare" /tmp/qthe_pages.html; chk $? "Pages landing ($P, HTTP $CODE)"
CODE2=$(curl -sL -o /tmp/qthe_pages_demo.html -w "%{http_code}" "$P/demo.html")
[ "$CODE2" = "200" ] && cmp -s /tmp/qthe_pages_demo.html cloudflare/assets/demo.html; chk $? "Pages demo byte-identical (HTTP $CODE2)"

say "== T11-b the docket — the SECOND LIVE CONSUMER (P-D; ORCH-R20) =="
# Determinism over HTTP, the arbitration form: two independently created
# dockets, same seed, same scripted load (24 tasks across 4 sources, 4
# flippers), same epochs -> identical arbitration hashes (plane + full
# serve history). The E-Q19 tiled law running live in the DO's single
# thread; C10's honest label rides in the build string.
curl -s -X POST "$W/docket/livecheck-a/init?seed=1234" > /dev/null
curl -s -X POST "$W/docket/livecheck-b/init?seed=1234" > /dev/null
for i in $(seq 1 24); do
  SRC=$(( (i - 1) % 4 )); P0=$(( (i * 7) % 62 + 1 ))
  if [ $((i % 6)) -eq 0 ]; then BODY="{\"id\": $i, \"source\": $SRC, \"p0\": $P0, \"flip\": true}"; else BODY="{\"id\": $i, \"source\": $SRC, \"p0\": $P0}"; fi
  curl -s -X POST "$W/docket/livecheck-a/submit" -H 'content-type: application/json' -d "$BODY" > /dev/null
  curl -s -X POST "$W/docket/livecheck-b/submit" -H 'content-type: application/json' -d "$BODY" > /dev/null
done
curl -s -X POST "$W/docket/livecheck-a/epoch?times=40" > /dev/null
curl -s -X POST "$W/docket/livecheck-b/epoch?times=40" > /dev/null
DA=$(curl -s "$W/docket/livecheck-a/hash" | J "d['arb_sha256']")
DB=$(curl -s "$W/docket/livecheck-b/hash" | J "d['arb_sha256']")
[ -n "$DA" ] && [ "$DA" = "$DB" ]; chk $? "cross-DO docket arbitration determinism (seed 1234, 24 tasks incl. 4 flippers, 40 epochs): ${DA:0:16}…"
DV=$(curl -s "$W/docket/livecheck-a")
DS=$(echo "$DV" | J "d['served']"); DL=$(echo "$DV" | J "d['live']")
[ -n "$DS" ] && [ "$DS" -gt 0 ]; chk $? "docket served work over HTTP ($DS served, $DL live after 40 epochs)"
DFL=$(echo "$DV" | J "d['per_source_served']")
say "      per-source served: $DFL"
DEP=$(echo "$DV" | J "d['epochs']")
[ "$DEP" = "40" ]; chk $? "docket epoch counter exactly-once ($DEP)"

say ""
if [ "$FAIL" = "0" ]; then say "ALL LIVE CHECKS PASS"; else say "LIVE CHECK FAILURES — see above"; exit 1; fi
