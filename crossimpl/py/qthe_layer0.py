"""qthe_layer0.py — QTHE LAYER 0, independent Python reimplementation.

Derived from SPEC.md ALONE (SuperInstance/qthe, crossimpl lane, Task 34-e).
No line of this file is transliterated from the JS kernel; where SPEC.md was
ambiguous or silent, the chosen reading is recorded in crossimpl/AMBIGUITY.md
(items A1..A10) and was frozen before the kernel was opened.

LAYER 0 per SPEC (exact integer operations only, no floats):

  The primitive: one byte, two planes.
      d = c & 0x3F   spatial-amplitude coordinate, [0, 63]
      tau = c >> 6   timbre / operator state, {0, 1, 2, 3}

  Timbre table:
      tau 0  Ground   Psi = 0    contributes to neither channel
      tau 1  Attract  Psi = +1   real channel, positive
      tau 2  Repel    Psi = -1   real channel, negative
      tau 3  Abstain  Psi = i    imaginary channel (SPEC expansion:
                                 y^I = sum_{tau=3} d*x_k, coefficient +1)

  Split-channel vector pass over inputs x_k with weights w_jk (8-bit
  primitives):
      y_j^R = sum_{tau(w)=1} d(w)*x_k  -  sum_{tau(w)=2} d(w)*x_k
      y_j^I = sum_{tau(w)=3} d(w)*x_k
  Exact integers end to end.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# The primitive (A1: pack is the implied inverse of the SPEC's unpack)
# ---------------------------------------------------------------------------

D_MASK = 0x3F          # low 6 bits: spatial amplitude
TAU_SHIFT = 6          # high 2 bits: timbre
D_MAX = 63
TAU_MAX = 3


def unpack(c: int) -> tuple[int, int]:
    """c -> (tau, d). SPEC: d = c & 0x3F, tau = c >> 6."""
    _require_int(c, "c")
    if not 0 <= c <= 255:
        raise ValueError(f"primitive byte out of range [0,255]: {c}")
    return (c >> TAU_SHIFT, c & D_MASK)


def pack(tau: int, d: int) -> int:
    """(tau, d) -> c. Implied inverse of the SPEC's unpack (AMBIGUITY A1)."""
    _require_int(tau, "tau")
    _require_int(d, "d")
    if not 0 <= tau <= TAU_MAX:
        raise ValueError(f"tau out of range [0,3]: {tau}")
    if not 0 <= d <= D_MAX:
        raise ValueError(f"d out of range [0,63]: {d}")
    return (tau << TAU_SHIFT) | d


# ---------------------------------------------------------------------------
# The Psi map (SPEC timbre table)
# ---------------------------------------------------------------------------

# Psi as the SPEC writes it: 0, +1, -1, i. 'i' is the imaginary unit; in an
# exact-integer implementation it is carried by the channel split (A8), so
# PSI is given both as the literal complex view and as the channel
# coefficients that the vector pass actually consumes.
PSI_COMPLEX = {0: 0j, 1: 1 + 0j, 2: -1 + 0j, 3: 1j}

# (real coefficient, imaginary coefficient) per tau — the exact-integer form.
# tau=3 -> Psi = i, contribution i*(d*x) => imag channel accumulates +d*x (A2).
PSI_CHANNELS = {0: (0, 0), 1: (1, 0), 2: (-1, 0), 3: (0, 1)}


def psi_real_coeff(tau: int) -> int:
    """Real-channel coefficient of Psi(tau): +1 / -1 / 0."""
    _check_tau(tau)
    return PSI_CHANNELS[tau][0]


def psi_imag_coeff(tau: int) -> int:
    """Imaginary-channel coefficient of Psi(tau): +1 for Abstain, else 0."""
    _check_tau(tau)
    return PSI_CHANNELS[tau][1]


# ---------------------------------------------------------------------------
# Split-channel vector pass (SPEC LAYER 0 item 3)
# ---------------------------------------------------------------------------

def vector_pass(weights: list[list[int]], xs: list[int]) -> tuple[list[int], list[int]]:
    """y_j = sum_k Psi(tau(w_jk)) * d(w_jk) * x_k, split into exact channels.

    weights: J rows, each K weight bytes (8-bit primitives, validated — A7).
    xs:      K exact integers (floats rejected — A4, no-floats invariant).
    returns: (yR, yI), each length J; y_j = yR[j] + i*yI[j] (A8).
    Degenerate shapes are defined, not errors (A9): K=0 -> zeros, J=0 -> [].
    """
    if not isinstance(weights, list) or not all(isinstance(row, list) for row in weights):
        raise TypeError("weights must be a list of rows (lists)")
    if not isinstance(xs, list):
        raise TypeError("xs must be a list")
    for x in xs:
        _require_int(x, "x_k")
    j_rows = len(weights)
    k_dim = len(xs)
    for row in weights:
        if len(row) != k_dim:
            raise ValueError(
                f"ragged weights: row length {len(row)} != K={k_dim} (A3)")
    y_r: list[int] = []
    y_i: list[int] = []
    for row in weights:
        acc_r = 0
        acc_i = 0
        for k, w in enumerate(row):
            _require_int(w, "w_jk")
            if not 0 <= w <= 255:
                raise ValueError(f"weight out of primitive range [0,255]: {w}")
            tau = w >> TAU_SHIFT
            d = w & D_MASK
            if tau == 1:            # Attract: +d*x into the real channel
                acc_r += d * xs[k]
            elif tau == 2:          # Repel: -d*x into the real channel
                acc_r -= d * xs[k]
            elif tau == 3:          # Abstain: +d*x into the imaginary channel
                acc_i += d * xs[k]
            # tau == 0 Ground: contributes to neither channel
        y_r.append(acc_r)
        y_i.append(acc_i)
    return (y_r, y_i)


def vector_pass_complex(weights: list[list[int]], xs: list[int]) -> list[complex]:
    """Reader-side complex view of the channel pair (A8). NOT the Layer-0 op;
    floats re-enter the moment Python builds complex — exactness holds only
    because the components were computed as integers and are re-attached."""
    y_r, y_i = vector_pass(weights, xs)
    return [complex(r, i) for r, i in zip(y_r, y_i)]


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _require_int(v: int, name: str) -> None:
    if isinstance(v, bool) or not isinstance(v, int):
        raise TypeError(f"{name} must be an exact integer, got {type(v).__name__}: {v!r}")


def _check_tau(tau: int) -> None:
    _require_int(tau, "tau")
    if not 0 <= tau <= TAU_MAX:
        raise ValueError(f"tau out of range [0,3]: {tau}")
