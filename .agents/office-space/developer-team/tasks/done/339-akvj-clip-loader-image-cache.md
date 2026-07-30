---
status: done
assignee: qa-reviewer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 339: AKVJ ClipLoader duplicate image load cache

## Source

- Human review `mail/in/[REVIEW]-akvj-src-2026-07-20.md` finding 4
- Epic `.agents/workflows/developer-team/epics/drafts/akvj-visuals-quality.md`

## Description

`akvj/src/js/visuals/ClipLoader.js:355-371` creates a new `Image` and `Clip` for every velocity slot. A clip mapped across 4 channels × 8 velocities decodes the same sprite sheet 32 times. It also makes the `maxActiveClips` cap (`ClipLoader.js:419`) cosmetic because the trim happens after every image has already loaded.

Design and implement a per-load-pass cache keyed by `clipId` so each sprite sheet is decoded once and reused for all velocity slots. Ensure the `maxActiveClips` limit is applied to the cached/loaded set.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
- A clip mapped to multiple velocities/channels loads its image once per project load
