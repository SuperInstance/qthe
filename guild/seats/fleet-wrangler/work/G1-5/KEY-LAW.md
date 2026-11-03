# KEY-LAW — Transient Credential Procedure for the qthe Guild
**Seat:** fleet-wrangler · **Coursework:** G1-5 · **Status:** design doctrine. No credentials exist in this workspace; no API call was attempted or needed.

## 1. The Law

> **The No-Key Law:** keys are held by the principal, used transiently by the Orchestrator only, never written to files, never passed to seats, never echoed in output.

This law has a body count: **qthe round 9 fail-closed when a DeepSeek key left the workspace** (MEASURED precedent, `arena_r10_verdict.md` preamble). The cost of one exposure was an entire round plus the migration to a new provider. Everything below exists so that never repeats. **Fail-closed is the default: if a procedure cannot be run safely, the work stops — it is never worked around.**

## 2. Division of labor

| Actor | May | Must never |
|---|---|---|
| **Principal** | Hold keys; issue them per round; revoke/rotate; launch the harness with env vars (Pattern P1) | — (the principal is the trust root) |
| **Orchestrator** | Read keys from process environment at call time; inject into HTTP `Authorization` headers at the transport layer only; let the key die with the process | Write keys to any file, argv, log, receipt, prompt, or echo them in any output; export keys into persistent shell state |
| **Seats (LLM/decision models)** | Receive charter + canon + task (the prompt planes) | See any key material, ever — the model has no legitimate use for it; prompts are auditable artifacts and must be publishable as-is |

## 3. Transient use — the single-invocation patterns

**Pattern P1 — principal-launched (preferred).** The principal, in their own terminal, runs:

```
DEEPINFRA_API_KEY="$KEY" TS_API_KEY="$KEY2" python3 harness.py rounds/rR.json
```

The key exists only in the principal's shell and the harness process. The orchestrator seat never sees the value; no agent transcript contains it. Everything the orchestrator touches (rows, receipts, verdicts) is produced downstream, key-free.

**Pattern P2 — orchestrator-launched (when the principal cannot launch).** One shell invocation; env-only; the principal supplies the assignment into that single command line. Rules:
1. **Env-only.** Keys enter via `VAR=…` prefix on the command — never argv arguments to the harness (argv leaks via `ps`, logs, shell history), never files, never stdin prompts echoed back, never `export` in `.bashrc`/`.profile`/any rc file.
2. **One invocation, one lifetime.** The key lives exactly as long as the harness process. When the process exits the key is gone from the workspace. No wrapper scripts that persist env into dumps, no `env`/`printenv`/`set -x` in any logged command.
3. **Redaction at the error layer.** Harness error handlers log status codes, response bodies, and timing — never request headers, never the environment. A traceback printer that dumps `os.environ` is a defect class; the harness is reviewed for it before first live use.
4. **History hygiene.** The launching shell's history must not retain the key: run the invocation with history suppression (`HISTCONTROL=ignorespace` + space-prefixed invocation, or `history -d` discipline), and verify post-round that no history file in the workspace contains the key prefix (the §6 scan covers this).
5. **Foreground only.** r10's sandbox lesson: background processes get reaped — and a detached process holding env is a slow leak. Run foreground; the resume-by-call_id law makes re-runs safe, so there is never a reason to daemonize a keyholder.

## 4. Rotation cadence (recommendation to the principal)

Rotation is free; leaks are not. Recommended cadence, parameterized:

- **Per round, minimum.** A fresh key at each Guild working round (the natural unit: corpus is pinned, receipts are sealed, the old key retires with them).
- **Hard ceiling: T_live = 24 h wall-clock** for any key in a shared/multi-tenant sandbox, even if unused.
- **Immediate rotation triggers:** (1) any red flag (§5); (2) end of any round that included adversarial or attack-briefed consultations — the Guild's own work includes design-attack tasks, so assume hostile prompting is in scope and rotate after exposure-heavy sessions; (3) any sandbox egress event (a push to GitHub); (4) principal's discretion, exercised liberally.
- **Never reuse a key across providers or projects** — blast radius stays inside one round.

## 5. Red-flag protocol

**Trigger:** the key (or any plausible fragment, prefix, or pattern-match) is observed in ANY of: terminal output, any file (including receipts, rows, logs, scratch, dotfiles), any model output (a seat echoing key material it should never have received), any diff, any push, any third-party display.

**Protocol — HALT → CONTAIN → REPORT → ROTATE → AUDIT → RESUME:**

1. **HALT:** all API calls stop immediately; key-holding processes are killed; no further egress of any kind from the sandbox.
2. **CONTAIN:** nothing leaves the workspace — pushes are frozen at the gate (§6).
3. **REPORT:** an incident note is written (where observed, by whom, scope of exposure — files/calls/pushes since last clean scan) and delivered to the principal. The note itself is written without reproducing the key.
4. **ROTATE:** the principal revokes the exposed key and issues a fresh one. No work resumes on the old key under any circumstance.
5. **AUDIT:** the full §6 scan runs against the entire workspace (not just the push set); every hit is fixed at the source (file rewritten, not just deleted — git history keeps deletions); the incident note records scan results.
6. **RESUME:** only after rotation + a clean 6/6-canary scan (§6.6). A key that has touched a file is dead — "it's in `.gitignore`" is not a control, it is a hope.

## 6. Pre-push audit — the secret-scan checklist (before anything leaves the sandbox for GitHub)

Run as a scripted gate, in order; every step's result is logged to `push_audit.log`, committed with the push.

1. **Stage review.** `git status` + the intended file list, read by a human seat: only intended artifacts staged; no scratch, no `.env`, no history files, no editor droppings.
2. **Full-set pattern scan** over every staged file (rg, pattern file version-pinned in-repo): `sk-[A-Za-z0-9]{20,}`; `api[_-]?key\s*[:=]\s*['\"]?[^'\"\s]{8,}`; `Bearer\s+[A-Za-z0-9._-]{16,}`; `BEGIN [A-Z ]*PRIVATE KEY`; `DEEPINFRA_API_KEY|TS_API_KEY|TYPESAFE.*KEY` assignments with non-empty values; generic high-entropy strings (32–64 hex or base64ish) in any added line; 20+-char literals adjacent to "token"/"secret"/"auth".
3. **Diff scan, not just file scan.** `git diff --staged` (or the push range) scanned on ADDED lines — and separately flag REMOVED lines that weakened hygiene (deleted `.gitignore` rules, deleted redaction code).
4. **Receipt-schema audit.** Every `*.jsonl` / `*_economics.json` in the push set must pass the PLAYBOOK §5.3 schema: carries model, cache status, cost, verification verdict — and contains NO header/auth/request-raw fields. The schema validator is mechanical; a receipt failing schema blocks the push.
5. **Sealed-output scan.** AS-SAID rows keep model outputs verbatim — and models can echo anything a prompt ever leaked. Scan all sealed response bodies for the key prefixes and pattern classes of step 2. On a hit: redact the key material, log the redaction as a numbered amendment beside the row (the seal law is preserved honestly — the amendment is visible, the leak is not propagated).
6. **Scanner self-test (canary seeding).** Before the real scan counts, seed a scratch directory with 6 fake secrets covering 6 pattern classes and run the scanner against it. **6/6 or the scan is void** — fail closed, fix the scanner, re-run. This is the negctl doctrine pointed at our own gate: the qthe repo's 28-sabotage run found 5 real holes in its own verifiers; our scanner assumes it has holes until the canary says otherwise. Seeded-secret sets are rotated periodically so the scanner is never tuned to a fixed canary.
7. **Environment hygiene check.** No `.env*` files anywhere in the workspace (not merely unpushed), no exported keys in any committed script, no history file containing key prefixes.
8. **Sign-off entry.** `push_audit.log` gains: date, push-set sha, scanner version + pattern-file sha, canary result (must read 6/6), auditor seat id. The push happens only with a complete, passing log.
9. **Halt condition.** ANY hit anywhere → the push is blocked, the §5 red-flag protocol runs, and the audit restarts from step 1 after remediation. There is no "minor" hit.

## 7. Receipt requirements (what every call leaves behind — and never leaves behind)

Every API call the Guild makes produces a receipt row carrying: **model (served id), cache status (`cached_tokens`, `cache_write_tokens`, `hit_ratio`), cost (`usd`, `usd_if_no_cache`), and the verification verdict for any finding it produced.** Receipts never carry: auth headers, environment dumps, request-raw objects, or key fragments. A receipt that cannot be pushed to GitHub unchanged is a defect — receipts are written pushable by construction, and the §6.4 schema audit is the enforcement.

## 8. Drills

- **Quarterly (or per-milestone) leak tabletop:** a seeded "leak" (fake key planted in a scratch file) is presented to the on-duty orchestrator; the protocol of §5 must run HALT→RESUME correctly; the drill log is kept beside the incident forms. First drill scheduled before the first live round of E-F1/E-F2/E-F3.
- **Canary rotation:** the §6.6 seeded-secret set is regenerated whenever the pattern file changes.
- **The standing test of the whole law:** `rg` for key patterns over the FULL workspace must return nothing at every round boundary — the round-sealing ritual includes this scan, so the workspace is provably key-free every time a corpus is pinned.
