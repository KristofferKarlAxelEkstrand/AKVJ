---
status: done
assignee: akvj-developer
priority: high
epic: akvj-midi-device-chooser
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 461 — Midi overlay keyboard guards (T + Fullscreen Space)

From Overseer bugs against task **458**. If 458 is rejected, fold this into the rework; if 458 somehow ships, do this next.

## Do

1. **`MidiSettingsOverlay.js` `#isTypingTarget`** — do not treat `checkbox`/`radio`/`button` inputs as typing. Only text-entry types + `TEXTAREA` + contenteditable. So **T** still closes the overlay when a device checkbox is focused.
2. **`Fullscreen.js` `#handleKeydown`** — skip Space/Enter fullscreen toggle when target is interactive (`INPUT`/`BUTTON`/…) and/or when `#midi-settings-overlay` (or any overlay) is in the DOM.
3. Tests for both behaviors.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
