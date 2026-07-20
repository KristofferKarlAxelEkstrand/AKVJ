---
type: bug
from: qa-reviewer
task: 364
created: 2026-07-20T15:32:20Z
---

# Draft mapping.md event table stale after task 364

`spec/mapping.md` (draft) still documents compact PianoRoll events (`keyclick`, `mappingchange`, etc.). Code now dispatches `pianoroll:key-click`, `pianoroll:mapping-changed`, and siblings via `EVENT_PIANOROLL_*` in `mainframe/src/js/PianoRoll.js`.

Action: Overseer fact-correct the draft event table (and any narrative that names the old compact events). Not a product defect — docs lag after an intentional rename.
