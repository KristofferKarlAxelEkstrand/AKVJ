---
title: Task source: [BUG]-cliplist-triggertype-default-undisclosed
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[BUG]-cliplist-triggertype-default-undisclosed.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: bug
from: qa-reviewer
created: 2026-07-30T11:43:55Z
---

# ClipList triggerType filter default — undisclosed behaviour change riding along with 504

Reviewing task 504 (role-default unification), the working tree diff for
`mainframe/src/js/ClipList.js` `#filterAndSortClips` also changes the
`triggerTypeFilter` comparison from a raw `clip.meta.triggerType !== filter` check to
`resolveTriggerType(clip.meta.triggerType) !== filter` (import added from `clipSchema.js`).

Effect: a clip with omitted/empty `meta.triggerType` now matches a piano-roll
`triggerType: 'momentary'` filter (previously excluded). Matches the documented default
(`triggerType` defaults to `"momentary"` per `AGENTS.md`), so it looks like a correct fix —
same shape as the bug 504 exists to fix, just for `triggerType` instead of `role`.

Not mentioned in the 504 report, not in task 504/505/508's scope or checklists. Covered by
one new test (`ClipList.test.js` — "pianorollFilters momentary includes clips with omitted
triggerType") but nobody signed off on it as its own change.

Not blocking 504 (which is correct and fully tested on its own claimed scope), but should get
its own task so it's tracked and reviewed on the record rather than riding in silently.
