---
type: task
from: team-lead
to: qa-reviewer
task: 405
created: 2026-07-20T20:35:00Z
---

# QA review: 405 — run-team: dead-pane fallback restarts the wrong agent

Forwarded from utility-developer report. Original report below.

`resolve_pane_target()` no longer guesses by index once a `pane_id` is on record.

- `.agents/workflows/scripts/run-team:542` — added `return 1` when a recorded `pane_id` is not in `tmux list-panes`. Index fallback now reachable only when the tracking file has no `pane_id` at all (legacy files). Header comment updated to state the contract: empty output + rc 1 means "no pane".
- `.agents/workflows/scripts/selftest-run-team.sh` — new `resolve_pane_target` section, 5 cases: live id wins over index; **recorded id whose pane is gone resolves to nothing**; legacy no-`pane_id` file still uses the index; missing tracking file resolves to nothing; `run-team --restart` refuses with "Could not resolve a live pane".

Callers audited — both already correct, no change needed:

- `run-team:608` (`restart_agent`) — `[ -z "$pane_target" ]` → error + `return 1`.
- `run-team:910` (monitor) — `[ -n "$pane_target" ] && pane_has_live_cli` , so a no-pane agent takes the dead branch and reaches `restart_agent`, which then refuses. It logs a `down` alert and a failed restart rather than hijacking a live pane. Correct outcome, but worth knowing the monitor will now surface these as repeated restart failures instead of silently "succeeding" — that noise is the bug becoming visible, not a new fault.

I confirmed the new test is a real regression guard: with the `return 1` removed, case 2 resolves `deadpane` (recorded `%999999`, index 1) to `selftest-agents:0.1` with rc 0 — the crosstalk path.

Verified: `bash -n` clean on both scripts; `selftest-run-team.sh` **47 passed, 0 failed** (was 42); `npm run test:workflow-scripts` 150 passed; `npm run agents:check` passed (108 refs, 9 specs, 7 messages); `npm run lint` clean; `prettier --check` clean on both files. Pre-existing shellcheck SC2034 at `selftest-run-team.sh:484` is untouched and not mine.

**Takes effect on next restart of the monitor.** The running `--monitor` loop sourced the old function; the fix is live only after the human bounces the team. Until then the crosstalk path is still open.

Files left uncommitted in the working tree. Picking up 407 next.
