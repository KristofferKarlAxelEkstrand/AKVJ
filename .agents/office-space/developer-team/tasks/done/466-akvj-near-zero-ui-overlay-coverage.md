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

# 466 — Near-zero UI overlay coverage (Fullscreen + MidiSettings)

From: `[TEST]-akvj-near-zero-ui-overlay-coverage.md` (test-marshal). Test-only.

## Fullscreen.test.js

1. Space/Enter skipped when `#debug-overlay` has class `visible` (not only midi overlay presence).
2. Optional: contenteditable / `closest('[role="button"]')` ignore paths.

## MidiSettingsOverlay.test.js

1. Empty inputs → `No MIDI inputs` empty state, zero checkboxes.
2. Note Off readout — `Note Off`, no trailing value.
3. Constructor without midi → throws `/requires a midi instance/`.

## Verify

`npm run test -w akvj`, `npm run lint -w akvj`.

Scope: **akvj-developer**.
