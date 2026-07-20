---
type: task
from: team-lead
to: utility-developer
task: 376
created: 2026-07-20T14:47:56Z
---

# Task 376: Fix `agents-status.js` eqeqeq (blocks root lint)

`.agents/workflows/scripts/agents-status.js` ~L120: `waitingOn == null` → `waitingOn === null || waitingOn === undefined`.

Root `npm run lint` must pass. Blocks machine-review for 369/372.
`review: machine`.
