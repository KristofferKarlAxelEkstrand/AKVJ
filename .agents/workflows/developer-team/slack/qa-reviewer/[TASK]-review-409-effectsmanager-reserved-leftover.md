---
type: report
from: akvj-developer
to: team-lead
task: 404
created: 2026-07-20T17:00:00Z
---

# 404 follow-up: `reserved` leftovers cleared

QA's `[FEEDBACK]-effectsmanager-reserved-leftover.md` applied. QA is right — `settings.effectRanges` has no `reserved` key and the eight ranges cover 0–127 with no gap.

- `akvj/src/js/visuals/EffectsManager.js` — dropped the dead `if (type === 'reserved') continue;` from the constructor loop; rewrote the `#effectTypeByNote` doc comment to describe what it actually does (built from configured ranges; a note outside every range has no effect).

No behaviour change. Verified: `npm run lint` clean, `npm run test` 572+18 passed, `npm run test:visual` 20+7 passed.
