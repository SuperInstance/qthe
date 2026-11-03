#!/bin/sh
# run.sh — G2-6 battle test, one entry point (Orchestrator: re-run me).
#
# Builds both kernels under the compile law, replays the g2-corpus-v1
# golden corpus against G1-1 qthe_l1.c (UNCHANGED, v1) and against the
# patched qthe_l1_v1_1.c (v1.1: R-live + R-feedback + R-sigma), prints
# both conformance tables, then re-verifies under ASan/UBSan and checks
# run-to-run determinism (byte-identical output, twice per binary).
#
# Usage: ./run.sh [path-to-flat-corpus]

set -eu

HERE=$(cd "$(dirname "$0")" && pwd)
cd "$HERE"

CORPUS=${1:-../corpus/g2-corpus-v1.flat}
K_V1=../G1-1/qthe_l1.c
K_V11=qthe_l1_v1_1.c
BUILD=build

mkdir -p "$BUILD"

echo "====================================================================="
echo " G2-6 battle test · corpus: $CORPUS"
echo "====================================================================="
echo " kernel receipts (sha256):"
sha256sum "$K_V1" "$K_V11" || true
echo

# ---- compile law: cc -std=c99 -Wall -Wextra -c, ZERO warnings ----------
# Any compiler output (warnings) on the kernels fails the run.
for k in "$K_V1" "$K_V11"; do
    obj="$BUILD/$(basename "$k" .c).o"
    out=$(cc -std=c99 -Wall -Wextra -c "$k" -o "$obj" 2>&1)
    if [ -n "$out" ]; then
        echo "COMPILE LAW VIOLATED ($k):"
        echo "$out"
        exit 1
    fi
    echo " compile law OK: $k"
done
echo

# ---- conformance table 1: v1 (G1-1 kernel, UNCHANGED) ------------------
out=$(cc -std=c99 -Wall -Wextra -o "$BUILD/replay_v1" corpus_replay.c 2>&1)
if [ -n "$out" ]; then
    echo "HARNESS COMPILE WARNINGS (v1 mode):"
    echo "$out"
    exit 1
fi
"$BUILD/replay_v1" "$CORPUS" | tee "$BUILD/table_v1.txt"

echo

# ---- conformance table 2: v1.1 (patched to the oracle) ------------------
out=$(cc -std=c99 -Wall -Wextra -DQTHE_V11=1 -o "$BUILD/replay_v11" corpus_replay.c 2>&1)
if [ -n "$out" ]; then
    echo "HARNESS COMPILE WARNINGS (v1.1 mode):"
    echo "$out"
    exit 1
fi
"$BUILD/replay_v11" "$CORPUS" | tee "$BUILD/table_v11.txt"

echo

# ---- sanitizer verification (ASan + UBSan, both modes) -------------------
echo " sanitizer verification (ASan+UBSan)..."
san_rc=0
for mode in v1 v11; do
    if [ "$mode" = v11 ]; then flag="-DQTHE_V11=1"; else flag=""; fi
    # shellcheck disable=SC2086
    cc -std=c99 -Wall -Wextra -g -fsanitize=address,undefined $flag \
       -o "$BUILD/replay_${mode}_san" corpus_replay.c
    "$BUILD/replay_${mode}_san" "$CORPUS" > "$BUILD/table_${mode}_san.txt" 2> "$BUILD/san_${mode}.err"
    if [ -s "$BUILD/san_${mode}.err" ]; then
        echo " SANITIZER OUTPUT ($mode):"
        cat "$BUILD/san_${mode}.err"
        san_rc=1
    fi
    if ! cmp -s "$BUILD/table_${mode}_san.txt" "$BUILD/table_${mode}.txt"; then
        echo " SANITIZER OUTPUT DIVERGED FROM PLAIN BUILD ($mode)"
        san_rc=1
    fi
done
[ "$san_rc" -eq 0 ] && echo " ASan/UBSan: CLEAN (both modes, outputs identical to plain builds)"

# ---- determinism self-check (mirror of the corpus's own discipline) ------
echo " determinism self-check (each binary run twice, byte-identical)..."
det_rc=0
for mode in v1 v11; do
    "$BUILD/replay_${mode}" "$CORPUS" > "$BUILD/table_${mode}_b.txt"
    if ! cmp -s "$BUILD/table_${mode}_b.txt" "$BUILD/table_${mode}.txt"; then
        echo " NON-DETERMINISTIC OUTPUT ($mode)"
        det_rc=1
    fi
done
[ "$det_rc" -eq 0 ] && echo " determinism: PASS (byte-identical reruns, both modes)"

echo
echo " G2-6 battle test complete."
