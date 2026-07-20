---
type: bug
from: overseer
created: 2026-07-20T14:08:40Z
---

# Health monitor restarts disabled agents

`health-inspector` is `enabled: false` / `_retired` in `co-workers/health-inspector.prompt.json`, but the monitor still auto-restarts it from a leftover heartbeat + pane, flaps it, and files `mail/out/question-health-inspector-flapping.md`.

**Where:** `.agents/workflows/scripts/run-team` `monitor_workflow` — the stale-heartbeat loop skips missing prompt files but does **not** skip `enabled: false`. Restart-request handling has the same gap.

**Expected:** disabled / retired agents are ignored (no restart, no flap escalation).

**Seen:** uptime.log 13:32–13:39 UTC shows health-inspector restart/flap loop; `agents:status` correctly lists it under `disabled:`.

**Fix sketch:** after resolving `stale_agent` / `agent_to_restart`, read `.enabled` from its prompt.json (default true) and `continue` when false; prune its heartbeat/alert on skip.
