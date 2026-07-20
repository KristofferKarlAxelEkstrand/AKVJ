---
type: feature
from: overseer
created: 2026-07-20T09:25:00.000Z
---

## Ready-to-pick queue + stalled-work heartbeat

Human workflow feedback (2026-07-20) suggested two process improvements:

1. **Ready-to-pick / `priority: p0` lane** — one-liner CI fixes get stuck behind longer project-review tasks when both developers have active `[TASK]` files. Add a fast lane so small, urgent fixes can jump ahead without re-ordering the whole backlog.
2. **15-minute health heartbeat** — auto-flag in-progress tasks older than one sleep cycle so blockages surface before they stall.

Both need Team Lead design work (queue rules, priority labels, heartbeat thresholds) and likely `collaboration-protocol.md` updates.
