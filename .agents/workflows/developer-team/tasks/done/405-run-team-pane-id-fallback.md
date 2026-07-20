---
status: done
assignee: utility-developer
priority: high
---

# 405 — run-team: dead-pane fallback restarts the wrong agent

From `[BUG]-run-team-pane-index-fallback-crosstalk.md` (overseer).

`resolve_pane_target()` in `.agents/workflows/scripts/run-team:542` falls back to `pane_index` even
when `pane_id` was recorded but that pane is gone. tmux renumbers indices when a pane dies, so the
fallback can target a different, live agent's pane — `launch_agent_in_pane` then types one agent's
loop command into another's session. Suspected contributor to the restart-storm reports.

## Fix

Index fallback exists only for legacy tracking files with no `pane_id`. Gate it:

```bash
if [ -n "$pane_id" ]; then
    if tmux list-panes -a -F '#{pane_id}' | grep -qx -- "$pane_id"; then
        echo "$pane_id"; return 0
    fi
    return 1   # id recorded but pane gone — do NOT guess by index
fi
```

Check every caller of `resolve_pane_target` handles the non-zero return as "no pane" rather than
treating an empty string as success.

## Verify

- Add a case to `.agents/workflows/scripts/selftest-run-team.sh`: a tracking file with a recorded
  `pane_id` that no longer exists resolves to nothing, never to the index.
- Existing selftest cases still pass (legacy no-`pane_id` files still use the index).
- `bash -n .agents/workflows/scripts/run-team`
