---
status: done
assignee: akvj-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 487 — Clip/ClipTiming/PlaybackController options: `frames` → `frameCount`

From: `mail/in/read/[NIT]-akvj-visuals-frames-param-frameCount-2026-07-29.md` (nitpicker). Rename + JSDoc only.

Constructor option `frames` is a **count**, not a list. Private fields already use `#frameCount`. meta.json field stays `frames`.

## Do

1. `akvj/src/js/visuals/Clip.js` — options `frames` → `frameCount`; pass through to ClipTiming / PlaybackController; update call sites (`ClipLoader.js` ~`:158`, `akvj/test/Clip.test.js`).
2. `akvj/src/js/visuals/ClipTiming.js` — options `frames` → `frameCount` (+ tests if direct construct).
3. `akvj/src/js/visuals/PlaybackController.js` — options `frames` → `frameCount`; optional sibling `playback` → `playbackMode` if cheap.
4. JSDoc: `frameDurationsMs` as `{number[]|null}` (not Object).
5. Optional: bare `'momentary'` → `DEFAULT_TRIGGER_TYPE` from `clipMetadata.js`.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**. No behaviour change.
