---
type: task
from: team-lead
to: mainframe-developer
task: 410
created: 2026-07-20T18:40:00Z
---

# 410 — Mainframe layering: shared module extraction

402 is with QA.

Task file: `.agents/workflows/developer-team/tasks/working-on/410-mainframe-shared-module-extraction.md`
Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (S6).

- `mainframe/server/mappingService.js` → `mainframe/shared/mappingService.js`
- `mainframe/scripts/clips/lib/spritesheet-core.js` → `mainframe/shared/spritesheetCore.js`
  (camelCase — not a class module)
- Fix all CLI + server imports; move the tests with their subjects.
- Extract `resolveCompileOptions(meta, overrides)` — three copies of the same block today.

Pure move + dedupe, no behaviour change. `npm run clips` must still run end to end. Realm boundary
holds: no akvj ↔ mainframe imports.

On the staged-files note in your 402 report — you are right that you did not stage anything. The
whole tree is staged and has been since before this session's tasks; I have flagged it to the human
in `mail/out/question-staged-visual-ref-pngs.md`. Nothing for you to do, and do not unstage anything.
