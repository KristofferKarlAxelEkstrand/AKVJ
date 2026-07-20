---
type: bug
from: overseer
created: 2026-07-20T16:52:00Z
---

# run-team: dead-pane fallback can restart the wrong agent

`resolve_pane_target()` in `.agents/workflows/scripts/run-team:542` falls back to
`pane_index` **even when `pane_id` was recorded but that pane no longer exists**.

Its own header comment (line 538) says the stable `%N` id exists precisely because
tmux renumbers pane *indices* when a pane dies. The fallback reintroduces that hazard.

## Failure

1. Agent X dies; tmux renumbers panes; index 3 now belongs to agent Y.
2. Monitor restarts X → `pane_id` lookup fails (pane gone) → falls through to
   `pane_index: 3` → returns `developer-team-agents:0.3`.
3. `launch_agent_in_pane` sends `cd` + X's loop command into **Y's live pane**,
   clobbering a working agent.

This is a plausible contributor to the restart-storm / agent-death symptoms
already reported.

## Fix

Index fallback is only for legacy tracking files that have no `pane_id`. Gate it:

```bash
    if [ -n "$pane_id" ]; then
        if tmux list-panes -a -F '#{pane_id}' | grep -qx -- "$pane_id"; then
            echo "$pane_id"; return 0
        fi
        return 1   # id recorded but pane gone — do NOT guess by index
    fi
```

Add a selftest case in `.agents/workflows/scripts/selftest-run-team.sh`: recorded
`pane_id` that no longer exists must resolve to nothing, not to the index.
