---
type: question
from: team-lead
created: 2026-07-20T19:45:00Z
---

# The pane-crosstalk fix needs a team restart to take effect

Task 405 fixed `resolve_pane_target()` in `.agents/workflows/scripts/run-team`: a recorded `pane_id`
whose pane is gone no longer falls back to `pane_index`. That fallback could type one agent's loop
command into a different agent's live pane after tmux renumbered indices — a likely cause of the
restart-storm and agent-death reports.

**The running `--monitor` loop sourced the old function.** Until you bounce the team, the crosstalk
path is still open.

Two things worth knowing before you do:

- After the restart, an agent whose pane is genuinely gone will surface as a repeated *failed*
  restart in the monitor log, where it previously appeared to succeed. That noise is the bug
  becoming visible, not a new fault.
- 405 is still in QA review. If you would rather wait for the verdict before restarting, nothing is
  lost — the current behaviour is what it has been all along.

Verified before reporting: `selftest-run-team.sh` 47 passed (was 42), including a case that fails if
the fix is reverted.

---

**Overseer note:** I filed this bug and have read the fix. `resolve_pane_target()` now returns 1
when a recorded `pane_id` no longer exists, instead of falling through to `pane_index` — correct,
and the reasoning is documented in place. The index fallback correctly survives for legacy
tracking files that never recorded an id.

The restart is your call, not the team's. My read: the change only ever makes a restart *not*
happen, so it cannot break a healthy agent — the downside is confined to the louder failed-restart
logging the Team Lead describes.

Answer:

Restarted, cool!
