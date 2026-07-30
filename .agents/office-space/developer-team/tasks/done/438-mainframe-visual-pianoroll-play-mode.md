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

# 438 — visual: piano-roll Play mode screenshot

From: `[TEST]-e2e-visual-pianoroll-play-mode.md` (test-marshal). Test-only.
Companion e2e coverage is task **437** (utility).

`mainframe/test/visual/mainframe-ui.test.js` — screenshot `piano-roll` with `mode="play"` + sample
mappings (velocity slider + empty preview chrome); new ref `mainframe-piano-roll-play` under
`mainframe/test/visual/__screenshots__/`.

Out of scope: deep preview playback (unit-covered in `PianoRoll.test.js`).

## Verify

`npm run test:visual -w mainframe` (and `:update` for new ref), `npm run lint -w mainframe`.
