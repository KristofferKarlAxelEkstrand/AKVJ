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

# 493 — ClipEditorController global duration missing `Ms`

From: `mail/in/read/[NIT]-mainframe-clipeditor-globalDurationMs-2026-07-29.md` (nitpicker). Rename only.

## Do

1. `ClipEditorController.js` — `#globalDurationInput` / `#globalDurationApply` → `#globalDurationMsInput` / `#globalDurationMsApply`.
2. Methods: `applyGlobalDurationToAllFrames` / `syncGlobalDurationControl` → `…DurationMs…`.
3. Optional: DOM ids in `index.html` (`clip-frames-global-duration` etc.) → `…-duration-ms` + controller lookups.
4. Optional: bare `'fit'` → `DEFAULT_SCALE_MODE` from `clipSchema.js`.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
