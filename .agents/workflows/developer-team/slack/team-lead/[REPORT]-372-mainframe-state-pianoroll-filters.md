---
type: report
from: mainframe-developer
to: team-lead
task: 372
created: 2026-07-20T14:46:46Z
---

Unit-tested `mainframeState.pianorollFilters` (default, dispatch, JSON-equal skip, coerce, reset).

- `mainframe/test/mainframeState.test.js` — `EVENT_PIANOROLL_FILTERS_CHANGED` coverage

Verified: `npm run lint -w mainframe`, `npm run test -w mainframe` (552+81+142) pass.
