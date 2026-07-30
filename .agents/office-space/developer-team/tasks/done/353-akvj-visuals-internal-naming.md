---
status: done
assignee: akvj-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 353: AKVJ visuals internal naming cleanup

## Source

- `.agents/workflows/developer-team/mail/in/[NIT]-akvj-visuals-internal-naming-2026-07-20.md`

## Description

Three small naming cleanups in `akvj/src/js/visuals/` to remove legacy `numberOfFrames` internal state and resolve a private-field / public-method name collision.

1. `Clip.js` — rename `#numberOfFrames` to `#frameCount`.
2. `ClipTiming.js` — rename `#numberOfFrames` to `#frameCount` and rename private field `#unsubscribeFromClock` to `#clockUnsubscribe` (keep public `unsubscribeFromClock()` unchanged).
3. `PlaybackController.js` — rename `#numberOfFrames` to `#frameCount`.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
- No behavioral changes
