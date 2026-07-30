---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 491 — PreviewClip defaults + shared `/api` prefix

From: `mail/in/read/[NIT]-mainframe-previewclip-playback-defaults-2026-07-29.md` (nitpicker). Constants/import only. Sibling of **429** §3 for StagingPreview.

## Do

1. `mainframe/src/js/PreviewClip.js` — bare `'loop'` → `DEFAULT_PLAYBACK` (field + invalid-mode fallback); drop `FALLBACK_MS` alias for `DEFAULT_FALLBACK_FRAME_DURATION_MS`.
2. `PreviewClip.js` + `ClipInstance.js` — hard-coded `/api/clips/…` → `API_BASE_PATH` from `apiClient.js`.
3. `playbackUtils.js` — switch arms use `PLAYBACK_MODE` / `PLAYBACK_MODES` constants, not bare strings.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
