---
status: done
assignee: akvj-developer
priority: low
---

# Task 165: mainframe `main.js`/`index.html` — `statusClass` Param + Systemic `upload-*` → `clip-editor-*` ID Rename

## Source
`.agents/workflows/developer-team/inbox/read/[NIT]-mainframe-non-js-sweep-2025-07-18.md`
(Nitpicker — read the original for full rationale).

## Scope

### 1. `setStatus()` vague `kind` param (small, do first)
- **File:** `mainframe/src/main.js:104` — `setStatus(statusElement, message, kind = '')`
- `kind` is actually a CSS status class suffix (`'is-ok'`, `'is-err'`, `''`).
- Rename to `statusClass`.

### 2. Systemic `upload-*` → `clip-editor-*` ID rename (larger — read carefully before starting)
The panel is labeled "Clip editor" in the UI (tab text, route `/clip/edit`,
`#clip-editor-heading`), but ~20 element IDs still use the `upload-*` prefix — a leftover
from when the panel was upload-only, before it grew name/role/playback/trigger/sync/bit-depth
fields. "Upload" describes a mechanism, not the domain concept; a reader searching for "clip
editor" code won't find it by grepping `upload-*`.

**IDs to rename** (all `upload-*` → `clip-editor-*`, or `editor-*` for brevity — pick one
prefix and apply consistently):
- `panel-upload` → `panel-editor` (or `panel-clip-editor`)
- `upload-form`, `upload-name`, `upload-clip-id`, `upload-role`, `upload-target-width`,
  `upload-target-height`, `upload-scale-mode`, `upload-placement-x`, `upload-placement-y`,
  `upload-playback`, `upload-retrigger`, `upload-trigger-type`, `upload-trigger-group`,
  `upload-bit-depth-field`, `upload-bit-depth`, `upload-frame-duration-beats`,
  `upload-submit`, `upload-status`
- `upload-sync`, `upload-sync-beat-fields`, `upload-sync-length`, `upload-sync-beats`,
  `upload-sync-beats-field`, `upload-beats-per-bar`
- `main.js`: `panels.upload` key, `TAB_TO_ROUTE.upload` key

**Confirmed touch points** (grepped before filing this task — check each for every ID above,
not just a sample):
- `mainframe/src/index.html` — the `id="upload-*"` attributes themselves
- `mainframe/src/main.js` — `panels`/`TAB_TO_ROUTE` registry, `getElementById`/query calls
- `mainframe/src/js/ClipEditorController.js` — DOM lookups by these IDs
- `mainframe/src/scss/PageShell.scss` — `#upload-*` CSS selectors (styling would silently
  break if IDs are renamed in HTML/JS but not here)
- `mainframe/test/ClipEditorController.test.js` — test queries by these IDs

## Constraints
- Pure rename — no behavior change, no new fields, no schema impact.
- This is systemic: **grep each ID individually** across `mainframe/src/` and `mainframe/test/`
  before considering it done — a missed reference here is a silent runtime breakage (DOM query
  returns null), not a lint/type error, so there's no compiler safety net.
- Do not rename the **route** (`/clip/edit`) or the **panel heading text** — those already say
  "clip editor" and are correct; only the `upload-*` ID/key namespace is wrong.

## Suggested Verification
- `npm run lint`
- `npm run test -w mainframe` (`ClipEditorController.test.js` especially)
- `npm run build -w mainframe`
- Manual: load the mainframe UI, open the clip editor panel, confirm styling (SCSS selectors)
  and all form interactions still work — a missed `getElementById` reference won't show up in
  unit tests if the DOM node itself still exists under the old ID while JS queries the new one.

## Files
- `mainframe/src/main.js`
- `mainframe/src/index.html`
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/scss/PageShell.scss`
- `mainframe/test/ClipEditorController.test.js`
