---
title: Task source: [NIT]-clip-editor-timing-load-naming-2026-07-29
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-clip-editor-timing-load-naming-2026-07-29.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-29T20:09:30Z
---

# NIT — clip-editor timing load naming

Broadcast: `clip-editor.md` load prefers `frameDurationsMs`, else FPS→ms. Left the prompt-updated in `slack/all/`. Swept the load/hydrate path (`frameLoad` → API `durationsMs` → editor stage). Skipped **432** (`firstRate` → `firstFrameRate`, bare `'1 bar'`) and **498** (`raw` param, `spriteMeta`).

## Checklist

- [ ] `mainframe/server/frameLoad.js:106` — return-unit honesty
  - **Current:** `function durationsFromFrameRates(rates)` (returns ms via `fpsToMs`)
  - **Proposed:** `durationsMsFromFrameRates` (sibling of `durationsMsFromMeta`)
  - **Why:** Name looks like it yields FPS maps; it yields milliseconds. Matches `padDurationsMs` / API field `durationsMs`.

- [ ] `mainframe/src/js/editorMeta.js:15,30` — orphan hydrate field
  - **Current:** `editorValuesFromMeta` still builds `frameRate` from first `frameRatesForFrames` entry
  - **Proposed:** drop `frameRate` from the return (load path uses `framesResponse.durationsMs`; nothing in `ClipEditorController` reads `editorValues.frameRate`) — or rename to `firstFrameRate` and document “unused by form; legacy tests only”
  - **Why:** After ms-first load, a solo FPS number on the editor-values object is a false friend. Tests in `editorMeta.test.js` assert it today.

- [ ] `mainframe/src/js/ClipEditorController.js:485` — unit suffix
  - **Current:** `const expandedDurations = result.durationsMs.map(...)`
  - **Proposed:** `expandedDurationsMs`
  - **Why:** Source is already `durationsMs`; local name should keep the unit.

- [ ] `mainframe/src/js/ClipEditorController.js:719-722` — local unit honesty
  - **Current:** `const durations` / `const first` / `const uniform` in `syncGlobalDurationMsControl`
  - **Proposed:** `durationsMs` / `firstDurationMs` / `isUniform`
  - **Why:** Same numbers as `getDurationsMs()`; `first` alone is opaque, `isUniform` is honest boolean.

- [ ] `mainframe/src/js/ClipEditorController.js:792-808` — dead branch + JSDoc
  - **Current:** `#previewDurationsMs` branches free vs beat then returns `base` both ways; JSDoc/comments imply a behavioural split
  - **Proposed:** return `#stagedDurationsMs` (with default fill) only; JSDoc: “Preview always uses staged free-timing ms; beat sync is engine-side”
  - **Why:** Readers currently hunt for the missing beat path. Comments should match the one true path.

Scope: rename / comment honesty (item 2 may drop a dead return key + test update). Verify: `npm run lint -w mainframe && npm run test -w mainframe`.
