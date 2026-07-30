---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 473 — Filter “momentary” misses omitted triggerType

From: `[BUG]-filter-momentary-misses-default-triggertype.md` (overseer).

Runtime default for missing `meta.triggerType` is **momentary**, but filters use strict equality:

- `PianoRoll.js` `#regionMatchesFilter` (~1558)
- `ClipList.js` `#filterClips` (~166)

Filtering to `momentary` hides clips that omit the field.

## Do

Treat missing/empty as `'momentary'` when comparing (optionally honor placement overrides if in scope). Add unit coverage.

## Verify

`npm run test:unit -w mainframe`, `npm run lint -w mainframe`.

Scope: **mainframe-developer**.
