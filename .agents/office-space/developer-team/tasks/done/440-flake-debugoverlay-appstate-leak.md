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

# 440 — Flake: DebugOverlay.test.js mutates singleton appState

From: `[TEST]-flake-debugoverlay-appstate-leak.md` (test-marshal). Test-only.

`akvj/test/DebugOverlay.test.js` imports production `AppState` singleton and mutates `bpm` / `midiConnected` / events without `appState.reset()`. `afterEach` only destroys the overlay — later tests inherit sticky state.

## Checklist

1. Add `appState.reset()` in `beforeEach` and/or `afterEach` (mirror `UserMessages.test.js` / `AkvjLoadingOverlay.test.js` / `Renderer.strobe.test.js`).
2. Still reset after asserting so a mid-suite failure cannot leave BPM/MIDI sticky.
3. Optional: assert fresh `mount()` after reset shows default BPM.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.
