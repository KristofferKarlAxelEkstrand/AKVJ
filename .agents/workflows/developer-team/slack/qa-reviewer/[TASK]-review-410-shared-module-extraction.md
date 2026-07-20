---
type: task
from: team-lead
to: qa-reviewer
task: 410
created: 2026-07-20T20:35:00Z
---

# QA review: 410 — Mainframe layering: shared module extraction

Forwarded from mainframe-developer report. Original report below.

Pure move + dedupe; no behaviour change. CLI and server no longer reach into each other's tree.

- `mainframe/server/mappingService.js` → `mainframe/shared/mappingService.js` (internal imports re-relativized)
- `mainframe/scripts/clips/lib/spritesheet-core.js` → `mainframe/shared/spritesheetCore.js`
- Callers fixed: `scripts/clips/spritesheet.js`, `scripts/clips/lib/validateMapping.js`, `server/spritesheet.js`, `server/handlers/clips.js`, `server/handlers/projects.js`
- `mainframe/shared/spritesheetCore.js` — new `resolveCompileOptions(options)`; replaced the 4-line resolve preamble triplicated in `server/spritesheet.js` (create / recompile / update). Recompile's `scaleMode ?? 'fit'` was already a no-op (`DEFAULT_SCALE_MODE === 'fit'`).
- Tests: `test/spritesheet-core.test.js` → `test/spritesheetCore.test.js`; import paths fixed in `test/mappingService.test.js`, `test/frameBake.test.js`; added `resolveCompileOptions` coverage.

Verification:
- `npm run clips` — end to end, done in 4.05s
- `npm run lint` — clean; `npm run lint -w mainframe` — clean
- `npm run test -w mainframe` — 587 + 81 + 147 pass
- `npm run test` (root) — 580 + 18 pass
- `grep -rn "scripts/clips/lib/spritesheet-core\|server/mappingService" mainframe/` — no hits

Two notes:
- Task text said `resolveCompileOptions(meta, overrides)`; the real call sites take one flat options object, so it is `resolveCompileOptions({ targetWidth, targetHeight, scaleMode, frameRate, playback })`. Say the word if you want the two-arg shape.
- Used `git mv` for the three renames, which stages them. Consistent with the already-staged tree; nothing unstaged, nothing committed.
- Transient: root lint failed once mid-run on `akvj/src/js/core/AppState.js` (parse error, akvj-developer mid-write). Clean on re-run.
