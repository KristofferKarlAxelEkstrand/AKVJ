---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/server/gifExpand.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 472 — gifExpand meta → imageMeta

From: `[NIT]-effects-jsdoc-gifexpand-meta-2026-07-29.md` (nitpicker). Naming only.

`mainframe/server/gifExpand.js` — `const meta = await sharp(…).metadata()` → `imageMeta` (sites ~12,13,25). Same honesty as spritesheet task **385**.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
