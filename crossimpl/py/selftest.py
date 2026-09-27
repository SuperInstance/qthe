"""selftest.py — LAYER 0 self-tests for the independent Python implementation.

All expected values below are hand-derived from the SPEC formula
    y_j^R = sum_{tau=1} d*x_k - sum_{tau=2} d*x_k ;  y_j^I = sum_{tau=3} d*x_k
written down BEFORE any run. Exhaustive sections: bijection over the full
2^8 domain; Psi over its full 4-value domain. Runs standalone:
    python3 crossimpl/py/selftest.py
Exit 0 iff every assertion holds. The kernel is NOT consulted here.
"""

from __future__ import annotations

import hashlib
import sys

from qthe_layer0 import (
    D_MAX,
    TAU_MAX,
    PSI_CHANNELS,
    pack,
    psi_imag_coeff,
    psi_real_coeff,
    unpack,
    vector_pass,
)

TRANSCRIPT: list[str] = []


def note(line: str) -> None:
    print(line)
    TRANSCRIPT.append(line)


def expect(name: str, got, want) -> None:
    if got != want:
        note(f"SELFTEST FAIL {name}: got {got!r} want {want!r}")
        sys.exit(1)
    note(f"ok {name}")


def expect_raises(name: str, fn, exc) -> None:
    try:
        fn()
    except exc:
        note(f"ok {name} (raised {exc.__name__})")
        return
    except Exception as e:  # noqa: BLE001 - report the wrong-exception case
        note(f"SELFTEST FAIL {name}: raised {type(e).__name__} not {exc.__name__}: {e}")
        sys.exit(1)
    note(f"SELFTEST FAIL {name}: no exception raised")
    sys.exit(1)


# --- 1. Bijection, exhaustive over the full 2^8 domain ---------------------
pairs = [unpack(c) for c in range(256)]
round_trips = sum(1 for c in range(256) if pack(*unpack(c)) == c)
distinct = len(set(pairs))
in_bounds = sum(1 for (t, d) in pairs if 0 <= t <= TAU_MAX and 0 <= d <= D_MAX)
full_product = set(pairs) == {(t, d) for t in range(4) for d in range(64)}
expect("bijection round-trips 256/256", round_trips, 256)
expect("bijection distinct (tau,d) pairs", distinct, 256)
expect("bijection d,tau in bounds 256/256", in_bounds, 256)
expect("bijection covers {0..3}x{0..63} exactly", full_product, True)

# spot checks straight from the SPEC bit layout [tau:2][d:6]
expect("unpack(0x00)", unpack(0b00000000), (0, 0))
expect("unpack(0xFF)", unpack(0b11111111), (3, 63))
expect("unpack(0x3F)", unpack(0b00111111), (0, 63))
expect("unpack(0x40)", unpack(0b01000000), (1, 0))
expect("unpack(0xC5)", unpack(0b11000101), (3, 5))
expect("pack(3,5)", pack(3, 5), 0xC5)
expect("pack(1,0)", pack(1, 0), 0x40)

# --- 2. Psi map, exhaustive over its 4-value domain ------------------------
expect("psi real coeffs", [psi_real_coeff(t) for t in range(4)], [0, 1, -1, 0])
expect("psi imag coeffs", [psi_imag_coeff(t) for t in range(4)], [0, 0, 0, 1])
expect("psi channel table literal", PSI_CHANNELS, {0: (0, 0), 1: (1, 0), 2: (-1, 0), 3: (0, 1)})

# --- 3. vectorPass hand-computed cases (expected values fixed pre-run) ------
# case 1: attract 5, repel 3, abstain 7, ground 9; x = [2,2,2,2]
yR, yI = vector_pass([[pack(1, 5), pack(2, 3), pack(3, 7), pack(0, 9)]], [2, 2, 2, 2])
expect("hand case 1 yR = 5*2-3*2", yR, [4])
expect("hand case 1 yI = 7*2, ground silent", yI, [14])

# case 2: two repel cells d=1; x = [10,20]
yR, yI = vector_pass([[pack(2, 1), pack(2, 1)]], [10, 20])
expect("hand case 2 yR = -(10+20)", yR, [-30])
expect("hand case 2 yI", yI, [0])

# case 3: negative inputs; attract 63 and abstain 1; x = [-2, 5]
yR, yI = vector_pass([[pack(1, 63), pack(3, 1)]], [-2, 5])
expect("hand case 3 yR = 63*(-2)", yR, [-126])
expect("hand case 3 yI = 1*5", yI, [5])

# case 4: multi-row matrix
yR, yI = vector_pass([[pack(1, 1), pack(0, 63)], [pack(3, 2), pack(2, 4)]], [3, 7])
expect("hand case 4 yR", yR, [3, -28])
expect("hand case 4 yI", yI, [0, 6])

# case 5: exactness at magnitude (Python ints unbounded — no 2^53 seam here)
yR, yI = vector_pass([[pack(1, 63)]], [10**18])
expect("hand case 5 yR = 63 * 10^18 exact", yR, [63 * 10**18])
expect("hand case 5 yI", yI, [0])

# case 6 (A9): degenerate shapes are defined
yR, yI = vector_pass([[]], [])
expect("A9 K=0 -> zero row", (yR, yI), ([0], [0]))
yR, yI = vector_pass([], [])
expect("A9 J=0 -> empty", (yR, yI), ([], []))

# --- 4. validation / no-floats enforcement ---------------------------------
expect_raises("pack rejects tau=4", lambda: pack(4, 0), ValueError)
expect_raises("pack rejects d=64", lambda: pack(0, 64), ValueError)
expect_raises("pack rejects float d", lambda: pack(1, 2.0), TypeError)
expect_raises("unpack rejects 256", lambda: unpack(256), ValueError)
expect_raises("unpack rejects -1", lambda: unpack(-1), ValueError)
expect_raises("no-floats: x_k float rejected",
              lambda: vector_pass([[pack(1, 1)]], [0.5]), TypeError)
expect_raises("no-floats: x_k bool rejected",
              lambda: vector_pass([[pack(1, 1)]], [True]), TypeError)
expect_raises("A7: weight 256 rejected",
              lambda: vector_pass([[256]], [1]), ValueError)
expect_raises("A7: weight -1 rejected",
              lambda: vector_pass([[-1]], [1]), ValueError)
expect_raises("A3: ragged row rejected",
              lambda: vector_pass([[pack(1, 1)], [pack(1, 1), pack(2, 1)]], [1, 2]),
              ValueError)

note("SELFTEST PASS all sections")
note("transcript-sha256 " + hashlib.sha256("\n".join(TRANSCRIPT).encode()).hexdigest())
sys.exit(0)
