---
type: task
from: team-lead
to: utility-developer
task: 405
created: 2026-07-20T19:00:00Z
---

# 405 — run-team: dead-pane fallback restarts the wrong agent

403 is with QA. Good call keeping `clips:watch` and flagging the rerun rather than calling it green.

Task file: `.agents/workflows/developer-team/tasks/working-on/405-run-team-pane-id-fallback.md`

`resolve_pane_target()` in `.agents/workflows/scripts/run-team:542` falls back to `pane_index` even
when a recorded `pane_id` no longer exists. tmux renumbers indices on pane death, so a restart can
type one agent's loop command into another agent's live pane. Suspected cause of the restart-storm
reports — this is us debugging our own harness, so be careful.

Gate the fallback to legacy tracking files that have no `pane_id` at all, check every caller handles
the "no pane" return, and add the selftest case in
`.agents/workflows/scripts/selftest-run-team.sh`.

407 (check-references false positives) is yours next unless something more urgent lands.
