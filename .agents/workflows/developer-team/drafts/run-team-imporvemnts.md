# run-team Improvements Plan

## Current state

`run-team` validates `jq` and `tmux` upfront, then discovers agents and creates the tmux session immediately. Per-agent CLI checks happen *inside* `launch_agent_in_pane` — after the session is already running. A bad config silently fails one pane while the rest start fine.

---

## 1. Pre-flight validation — abort on any bad config (PRIMARY ASK)

**Problem:** An agent with `"cli": "claude"` starts launching in tmux before anyone checks if `claude` is on `PATH`. The error lands inside a pane, easy to miss.

**Proposed:** Add a `validate_all_agents` pass that runs **before** `tmux new-session`. It checks every agent config and collects all errors. If any fail → print all errors and `exit 1`. Nothing launches.

Checks per agent:
- Config file exists and is valid JSON
- `prompt` field is non-empty
- `cli` value is `devin` or `claude`
- The resolved binary for that `cli` is available (`$DEVIN_BIN` / `$CLAUDE_BIN`)
- `wait_script` is non-empty (warn, not abort — some agents may not need it)

Output on failure:
```
Pre-flight check failed — fix the following before starting:
  [team-lead]       cli=devin — devin binary not found
  [akvj-developer]  prompt is empty in akvj-developer.prompt.json
Aborting. No agents were started.
```

---

## 2. `enabled` flag in agent config

**Problem:** To skip an optional agent (e.g. `quartermaster`) you must delete or rename the file.

**Proposed:** Add optional `"enabled": false` to `.prompt.json`. Pre-flight and discovery skip disabled agents. Default is `true` (backwards-compatible).

```json
{ "display": "Quartermaster", "enabled": false, ... }
```

---

## 3. Fragile `sleep 1` before devin wait_script

**Problem:** `launch_agent_in_pane` for devin does `sleep 1` then sends `wait_script` as a follow-up keypress. If devin is slow to start, the command lands before the shell is ready.

**Proposed:** Replace with a short poll — check that the pane's command is a shell (not still initializing) before sending, or at minimum bump to `sleep 2` with a comment explaining why.

---

## 4. Health monitor — always-on tmux window, auto-started with the team

**Problem:** `--monitor` is a blocking foreground loop started separately. Easy to forget. If you detach and reattach, you'd need to re-run it.

**Proposed:** The monitor starts automatically as a second tmux window (`window 1: monitor`) every time `run-team` launches a workflow. No separate command needed.

Session layout:
```
developer-team-agents
├── window 0: agents   ← all agent panes (current behavior)
└── window 1: monitor  ← health loop, always running
```

Navigation:
```
Ctrl+B 0   → agent panes
Ctrl+B 1   → monitor output
```

The `--monitor` flag stays for manual/standalone use but `run-team <workflow>` always brings the monitor along.

---

## Implementation order

1. Pre-flight validation (blocking requirement — do this first)
2. Monitor as auto-started tmux window (high value, zero UX cost)
3. `enabled` flag (quick)
4. `sleep 1` fix (low risk, low effort)

---

## Files to change

| File | Change |
|------|--------|
| `.agents/workflows/scripts/run-team` | Add `validate_all_agents` function, call before tmux; add `enabled` check in `discover_agents`; fix `sleep 1`; add `--monitor-window` flag |
| `WORKFLOW.md` | Document `enabled` field in agent config schema; update `--monitor` docs |
| Co-worker `.prompt.json` files | Add `"enabled": true` where needed (optional, for clarity) |
