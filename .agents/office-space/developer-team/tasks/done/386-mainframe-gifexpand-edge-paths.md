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

# Task 386: gifExpand delay / corrupt edge-path unit tests

## Source

Test Marshal `[TEST]-mainframe-gifexpand-edge-paths.md`

## Description

Test-only. Extend `mainframe/test/gifExpand.test.js`:

- Static still: `durationsMs[0] === fpsToMs(12)`
- Corrupt buffer rejects
- Zero page delay → `fpsToMs(12)` fallback
- Scalar `meta.delay` applies to all pages
- Short delay array pads with last value

Do not export `normalizeGifDelays` unless necessary.

## Verification

- `npm run test -w mainframe` / `npm run lint -w mainframe` pass
