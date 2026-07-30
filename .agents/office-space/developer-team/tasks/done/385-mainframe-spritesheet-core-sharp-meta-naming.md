---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 385: Rename sharp `meta` locals in spritesheet-core

## Source

Nitpicker `[NIT]-spritesheet-core-sharp-meta-naming-2026-07-20.md`

## Description

Rename-only — avoid colliding with clip `meta.json`. Match `contentMeta` naming.

- [ ] `mainframe/scripts/clips/lib/spritesheet-core.js` `assertReadableFrames` (~L63–69) `meta` → `imageMeta` / `sharpMeta`
- [ ] Same file (~L232–234) local `meta` → same

## Verification

- `npm run lint -w mainframe` / spritesheet tests pass
