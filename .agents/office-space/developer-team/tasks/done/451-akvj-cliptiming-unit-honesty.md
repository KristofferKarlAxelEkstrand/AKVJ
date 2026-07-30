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

# 451 — NIT: ClipTiming unit honesty (`*Ms` renames)

From: `[NIT]-akvj-cliptiming-unit-honesty-2026-07-29.md` (nitpicker). Naming only.

- [ ] `getFrameInterval` → `getFrameIntervalMs` (+ tests)
- [ ] local `naturalInterval` → `naturalIntervalMs`
- [ ] `#computeNaturalDuration` → `#computeNaturalDurationMs`; param `frames` → `frameCount`

StagingPreview `elapsed` → `elapsedMs` pairs with task **425** — fold into 425; do not re-do `#getFrameIntervalMs` here.

## Verify

`npm run lint && npm run test -w akvj`.

Scope: **akvj-developer**.
