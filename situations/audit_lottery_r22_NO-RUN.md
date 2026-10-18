# T13-e audit-lottery — NO-RUN receipt (ORCH-R22, the conditional stood down)

The r22 registration made the lane conditional: "runs only if the moth
balance receipts ≥ 5 credits after the balance probe; otherwise a
labeled no-run receipt."

## The probe (receipted 2026-10-18T15:52Z)

- `GET https://api.mothquantum.com/{me,credits,account,user,usage}` →
  **404 page not found** on all five (browser-UA law applied; the key is
  valid — `/jobs?limit=5` returns the r21 blur jobs: 67486970, c16cd801,
  ba24baf8, 42e12f5a, 4351db7b, all completed).
- The moth_client_v2 surface (`/engines`, `/engines/:id`, `/jobs`,
  `/jobs/:id/result`, the run POSTs) has no balance/credits route.

## The decision (fail-closed, as registered)

The balance is UNOBSERVABLE through the API. The r21 round spent its
10/10 cap; whether the account holds 5 more credits for a comet-qrng-v1
draw cannot be receipted. The lane stands down WITHOUT a draw and
WITHOUT the live-service route change (a route without its real draw
would be a deploy measured by nothing — the LAYER 2 discipline refuses).

## What stands registered for a future round

- The commit-before-draw design (fleet lab `audit-lottery` precedent +
  the r21 comet certificate): seal `sha256(commitment || entries)` in a
  DO BEFORE the draw; draw comet-qrng-v1 (5 credits); winner =
  `sha256(root || salt) mod n` computed and servable for audit; the
  CHSH witness rides the root receipt (S > 2 or VOID LOUD, the F2 law).
- The trigger: any round where a balance confirmation exists (a
  successful ≥5-credit job by this account, or an API balance endpoint
  appearing), or the operator confirms headroom.
