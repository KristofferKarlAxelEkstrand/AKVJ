---
status: done
assignee: akvj-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 471 — pixelUtils JSDoc: data → pixels

From: `[NIT]-effects-jsdoc-gifexpand-meta-2026-07-29.md` (nitpicker). Comment only.

`akvj/src/js/visuals/effects/pixelUtils.js:9` — prose still says `` `data` ``; param is `pixels`. Fix the sentence.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**. (gifExpand `meta` → `imageMeta` is task **472**.)
