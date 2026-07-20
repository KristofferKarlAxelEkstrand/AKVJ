---
type: report
from: mainframe-developer
to: team-lead
task: 412
created: 2026-07-20T17:55:00Z
---

All five items already landed in commit `192864a`; verified end-to-end this cycle, no new edits.

- `mainframe/scripts/clips/lib/validate/index.js` — `resolvePngPath` is report-only (points at `--fix`); no source rewrites.
- `mainframe/scripts/clips/lib/fix.js` — new opt-in `--fix` module (loop→playback, missing-png migration); writes only when changed, logs every change.
- `mainframe/scripts/clips/Pipeline.js` / `mainframe/scripts/clips/index.js` — `--fix` wired as Step 0 before validate.
- `mainframe/shared/clipSchema.js` — `MAX_FRAMES_PER_ROW = 16`; `DEFAULT_FRAMES_PER_ROW` in `shared/spritesheetCore.js` derives from it. CLI and server both flow through this single constant (16). Picked 16 because that's the server/canvas-side cap already enforced by `resolveFramesPerRow`; the old CLI 8 was an arbitrary leftover.
- `mainframe/src/js/editorMeta.js` — imports `DEFAULT_FRAME_WIDTH/HEIGHT`, `DEFAULT_PLAYBACK`, `VALID_BIT_DEPTHS` etc. from `shared/clipSchema.js`; no re-declarations.
- `mainframe/shared/frameFit.js` — single `SCALE_MODES` list including `'pattern'`; `validate/meta.js` imports it, so `'pattern'` is now accepted (was the bug).
- `mainframe/shared/slugify.js` — single `slugifyPathSegment`; `server/paths.js` and `src/js/generateClipId.js` both import it. Old CLI `slugifyClipName` deleted.
- `mainframe/test/fix.test.js` — round-trip test: a hand-written `meta.json` (4-space indent, unsorted keys, no trailing newline) survives `fixClip` byte-for-byte when nothing to migrate; plus `--fix` migration cases and a report-only `validate` guard.
- `mainframe/test/slugify.test.js` — covers the shared slug.

**Item 5 behavior difference to flag (per task instruction to report, not pick silently):** the old CLI `slugifyClipName` stripped underscores (`A_B` → `ab`); the shared `slugifyPathSegment` (server origin) treats `_` as a word separator (`A_B` → `a-b`). The merge kept the server behavior, so clip-id slugification now hyphenates underscores. `generateClipId.test.js` was updated accordingly. If the old strip-underscore behavior mattered for any existing display name, that's a visible change — but I found no test or call site relying on it.

Verify:
- `npm run lint` — clean.
- `npm run test -w mainframe` — 596 + 81 + 147 = 824 tests pass (includes `fix.test.js` round-trip).
- `npm run test` (akvj + monorepo-scripts) — 582 + 22 pass.
- `npm run clips` end-to-end on `projects/default` — succeeds; `--fix` reports "Nothing to migrate" on clean tree.
- `--fix` exercised on a temp copy with `loop: true` + renamed png — migrated `loop → playback` and reported the change; clean files untouched.

No behaviour change to what a valid clip renders as.
