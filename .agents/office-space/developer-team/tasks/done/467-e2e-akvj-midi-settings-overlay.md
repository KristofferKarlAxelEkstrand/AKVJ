---
status: done
assignee: utility-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 467 — e2e MIDI settings overlay (T) smoke on akvj

From: `[TEST]-e2e-akvj-midi-settings-overlay.md` (test-marshal). Extend `e2e/akvj.spec.js`.

## Do

1. **T** toggles `#midi-settings-overlay` into DOM (absent → present/visible).
2. **T** again removes it (detached).
3. When open, `[data-testid="midi-settings-devices"]` visible (empty state OK without hardware).
4. While open, Space/Enter must not navigate away / throw; overlay may stay (Fullscreen guards from 461).

## Verify

`npm run test:e2e` (akvj suite / Playwright).

Scope: **utility-developer** (`e2e/`). Out of scope: unit 466/465.
