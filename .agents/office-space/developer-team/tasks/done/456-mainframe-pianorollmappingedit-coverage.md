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

# 456 — pianoRollMappingEdit rejection + same-note coverage

From: `[TEST]-mainframe-pianorollmappingedit-coverage.md` (test-marshal). Test-only — extend `mainframe/test/pianoRollMappingEdit.test.js`; no product source changes.

## Cover

1. `movePlacement` same-note reorder (`sourceNote === targetNote`) — order/velocities after within-note drag.
2. `movePlacement` → `null` when source missing (`sourceIndex < 0`).
3. `movePlacement` → `null` on `MIN_REGION_VELOCITY` — fill note to 64+ clips, then insert; expect `null`.
4. `cloneMappings` isolation — mutate returned entry; original unchanged.
5. `deleteCells` / `assignCells` multi-note batch — other notes/channels untouched.
6. `changedNotes` no-op + channel filter — identical → `[]`; channel 2 change ignored when querying channel 1.

## Out of scope

ChoiceList (453), KeyBed, ClipCategory.

## Verify

`npm run test -w mainframe`, `npm run lint -w mainframe`.

Scope: **mainframe-developer**.
