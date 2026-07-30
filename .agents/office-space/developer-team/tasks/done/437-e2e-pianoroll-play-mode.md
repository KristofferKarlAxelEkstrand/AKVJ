---
status: done
assignee: utility-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 437 — e2e: piano-roll Play mode mount

From: `[TEST]-e2e-visual-pianoroll-play-mode.md` (test-marshal). Test-only.
Companion visual coverage is task **438** (mainframe).

Play mode product + units landed with **419**. Task **371** only covered edit + filter in e2e.
Live page never switches to Play.

## Checklist

`e2e/mainframe.spec.js` — on `#mapping-piano-roll` (optionally `#library-piano-roll`):

- Click `.piano-roll-mode-button[data-mode="play"]`
- Assert `mode="play"`, `.piano-roll-play-view` not hidden, `.piano-roll-velocity-slider` visible (min 0 / max 127)

Out of scope: deep preview / note-on velocity (unit-covered).

## Verify

`npm run test:e2e` (or project’s e2e script), `npm run lint`.
