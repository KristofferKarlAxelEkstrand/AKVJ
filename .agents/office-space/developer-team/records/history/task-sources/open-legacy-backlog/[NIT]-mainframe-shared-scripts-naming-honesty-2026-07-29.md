---
title: Task source: [NIT]-mainframe-shared-scripts-naming-honesty-2026-07-29
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-mainframe-shared-scripts-naming-honesty-2026-07-29.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-29T20:06:00Z
---

# NIT — mainframe/shared + scripts naming honesty

Timer sweep of `mainframe/shared/` and `mainframe/scripts/clips/` (rotation after server). Skipped items already owned by **432** (`fitNone`, `buildComposites` rename, `DEFAULT_TARGET_*`, bare `'loop'`) and **435** (spritesheet usage text, `ValidationResult.dir`, optimize `optimized` flag, CLI `f`/`a`/`b`).

## Checklist

- [ ] `mainframe/shared/spritesheetCore.js:277,298` — cell size params
  - **Current:** `buildComposites(..., width, height, …)` / `renderSpriteSheet(..., width, height, …)`
  - **Proposed:** `frameWidth`, `frameHeight`
  - **Why:** Meta and the CLI path already say `frameWidth`/`frameHeight`; bare `width`/`height` reads as full-sheet size next to a spritesheet compositor.

- [ ] `mainframe/shared/frameTiming.js:10` — default duration literal
  - **Current:** `export const DEFAULT_FRAME_DURATION_MS = 1000`
  - **Proposed:** `DEFAULT_FRAME_DURATION_MS = MS_PER_SECOND` (same file’s private constant)
  - **Why:** One meaning of “one second in ms”; avoids a second bare `1000` after the conversion helpers already use `MS_PER_SECOND`.

- [ ] `mainframe/scripts/clips/lib/generate.js:57-59` — meta terminology
  - **Current:** `const metadata = jsonFile ? await parseJsonFile(...) : {}` then `metadata.png`
  - **Proposed:** `meta`
  - **Why:** Everywhere else this object is `meta` / `meta.json`; `metadata` is a longer synonym with no extra meaning.

- [ ] `mainframe/scripts/clips/lib/copy.js:41-44` — comparison paths
  - **Current:** `filesMatch(file1, file2)` / `content1` / `content2`
  - **Proposed:** `leftPath` / `rightPath` (or `pathA` / `pathB`) and `leftBytes` / `rightBytes`
  - **Why:** These are filesystem paths and buffers, not abstract “file 1/2”; numbered names hide the role.

- [ ] `mainframe/scripts/clips/index.js:121-144` — watch debounce magic
  - **Current:** `let timeout`; `debounce(..., 100)`; `interval: usePolling ? 300 : undefined`
  - **Proposed:** `debounceTimerId`; `REBUILD_DEBOUNCE_MS = 100`; `POLLING_INTERVAL_MS = 300`
  - **Why:** Unit honesty (`Ms`) and named constants so the rebuild cadence is greppable, not a pair of mystery integers.

- [ ] `mainframe/scripts/clips/index.js:58` + `Pipeline.js:50,64` — project option
  - **Current:** `options.project` / parseArgs `project:` / JSDoc `options.project`
  - **Proposed:** `projectId` (CLI flag may stay `--project=`)
  - **Why:** The value is a project id string; matches `projectId` elsewhere and the server on-disk key nit (**498**).

Scope: rename / constant extract only. Verify: `npm run lint -w mainframe && npm run test -w mainframe`.
