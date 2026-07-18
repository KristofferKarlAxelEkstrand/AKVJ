---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 123: Mainframe Shared Module (frameTiming, frameFit, clip-id, playback enums)

## Severity: Refactor

## Summary
Create a `mainframe/shared/` module for concepts used by both the server and browser bundle, removing the current server→frontend import layering.

## Acceptance Criteria
- Move `frameTiming` helpers to `mainframe/shared/` and update `server/index.js`, `server/spritesheet.js`, `frameLoad.js`, and `gifExpand.js` to import from there.
- Move `frameFit` to `mainframe/shared/` and update `server/spritesheet.js`.
- Centralize `CLIP_ID_PATTERN` and `SAFE_PNG_NAME` in `mainframe/shared/` and replace the 6+ copy-pasted regex sites (`server/paths.js`, `src/js/clipEditorRoute.js`, `scripts/clips/new.js`, `validate/index.js`, `validateMapping.js`, `generate.js`).
- Centralize playback-mode enums and default `240×135`/`scaleMode: 'fit'` constants.
- Add unit tests for the shared module.
- Verify `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe` pass.

## Notes
- This stays inside `mainframe`; it does not create a cross-realm import with `akvj`.
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §M5, M6.
