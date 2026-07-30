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

# Task 371: E2E + visual coverage for piano-roll / key-bed

## Source

Test Marshal `[TEST]-e2e-visual-piano-roll-coverage.md`

## Description

Unit coverage for PianoRoll/KeyBed is strong. E2E and mainframe visual never assert the rolls. Task **367** owns `select`≡`filter` product + unit tests — do not duplicate.

Spans `e2e/` and `mainframe/test/visual/` → utility.

## Checklist

- [ ] `e2e/mainframe.spec.js` — library `#library-piano-roll` visible + `key-bed` + default filter mode; mapping `#mapping-piano-roll` visible + `key-bed` + default edit; optional mode-switch smoke
- [ ] `mainframe/test/visual/mainframe-ui.test.js` — screenshot piano-roll edit (velocity bands) and filter; import PianoRoll/KeyBed/PianoKey; new refs under `mainframe/test/visual/__screenshots__/` (human commits binaries)

## Verification

- E2E suite covers the new assertions
- `npm run test:visual -w mainframe` passes with new references
