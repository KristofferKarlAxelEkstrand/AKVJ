---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 395: Delete dead validateFrameHeight slots check

## Source

Overseer `[BUG]-validate-image-dead-slots-check.md`

## Description

Remove unreachable `totalFrameSlots < frameCount` branch (and `actualRows` / `totalFrameSlots` compute) in `validateFrameHeight`. Keep width/height divisibility checks. Optional early-return if `frameHeight <= 0`. Do not invent a test for the dead path.

File: `mainframe/scripts/clips/lib/validate/image.js`

Task **394** removes the vacuous mock only.

## Verification

- `npm run lint -w mainframe` / `npm run test -w mainframe` pass
