# [NIT] ClipEditorController Deep Pass — Naming & Terminology

**Date:** 2026-07-18
**Swept by:** The Nitpicker
**Area:** `mainframe/src/js/ClipEditorController.js` (line-by-line deep pass) + related
`ClipFrame.js` / `ClipFrames.js` bake API surface.

**Note on prior item:** The custom-element tag-prefix decision from
`[NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md` item 2 is now resolved in
`spec/code-standards.md` (`akvj-*` for page-shell hosts only; unprefixed leaf widgets; do not
mass-rename). No further action on that item.

---

## Nits (naming/pattern, my lane)

### 1. Legacy `upload*` names linger after the `clip-editor-*` DOM rename

- **File:** `mainframe/src/js/ClipEditorController.js`
- **What:** DOM ids were renamed to `clip-editor-*` (prior nit), but the matching private fields
  and one public method still say "upload":
  - `#uploadForm` (lines 65, 89) → `#clipEditorForm`
  - `#uploadClipIdInput` (lines 68, 92) → `#clipIdInput`
  - `#uploadClipIdHint` (lines 69, 93) → `#clipIdHint`
  - `#uploadSubmitButton` (lines 71, 95) → `#submitButton`
  - `resetUploadClipId()` (line 532) → `resetClipId()` / `resetGeneratedClipId()`
- **Why confusing:** A reader searching for "upload" finds controller internals that no longer
  match any DOM id, class, or user-facing label — leftover vocabulary from the old upload panel.
- **Suggested fix:** Rename the five identifiers above to drop `upload`; keep the
  `document.getElementById('clip-editor-…')` targets as they are.

### 2. `composition` vs `bakeConfig` — same object, two vocabularies across one feature

- **Files:** `ClipFrame.js` / `ClipFrames.js` use `composition` /
  `getCompositions()` / `setAllCompositions()` / `compositionchange`;
  `ClipEditorController.js` uses `#stagedBakeConfigs`, local `bakeConfigs`, and API payload key
  `frameBakeConfigs`; `mainframe/shared/frameBake.js` typedefs `FrameBakeConfig`.
- **What:** Every layer holds the same shape (`resolveFrameBakeConfig(...)`), but the public names
  flip between "composition" and "bake config" depending on which file you're in. The bridge is
  visible at `ClipEditorController.js:595` — `composition: this.#stagedBakeConfigs[index]`.
- **Why confusing:** Terminology consistency is the cheatsheet's core rule. A newcomer reading
  `getCompositions()` then `#stagedBakeConfigs` has to invent a mental alias.
- **Suggested fix:** Pick one public term and align the UI API to it. Prefer **bake config**
  (matches `FrameBakeConfig` + `frameBakeConfigs` + controller fields):
  - `ClipFrame#composition` / `composition` getter / `setComposition()` →
    `#bakeConfig` / `bakeConfig` / `setBakeConfig()`
  - `ClipFrames.getCompositions()` / `setAllCompositions()` / `areCompositionsUniform()` →
    `getBakeConfigs()` / `setAllBakeConfigs()` / `areBakeConfigsUniform()`
  - event `compositionchange` → `bakeconfigchange` (detail key `composition` → `bakeConfig`)
  - Keep "bake-time composition" as prose in comments if useful; just don't use both as
    identifier vocabularies.

### 3. `hydrate()` local `data` — banned vague name for a typed API payload

- **File:** `mainframe/src/js/ClipEditorController.js:289`
- **What:** `const data = await api(\`/clips/.../frames\`);` then `data.frames`,
  `data.durationsMs`, `data.meta`, `data.source`.
- **Why confusing:** `data` is on the code-standards banned-vague list (`data` / `state` /
  `thing`). The payload is specifically a clip-frames hydrate response.
- **Suggested fix:** `const framesResponse = await api(...)` (or `clipFramesPayload`).

### 4. `#reportOutcome(kind, text)` — `kind` is a recycled vague param

- **File:** `mainframe/src/js/ClipEditorController.js:234-237`
- **What:** Param named `kind` with union `'error'|'warn'|'info'`. Same vague word already
  flagged on `setStatus(..., kind)` in `[NIT]-mainframe-non-js-sweep-2025-07-18.md`.
- **Why confusing:** Here it is message severity, not a CSS class — so the prior suggestion
  `statusClass` does not fit. Still, `kind` tells a reader nothing.
- **Suggested fix:** Rename to `severity` (or `level`):
  `#reportOutcome(severity, text)`.

---

## Celebrations

- **`#stagedDurationsMs` / `#lastUniformDurationMs` / `#hydrateGeneration`** — units and intent
  right in the name; the rest of the feature should aspire to this clarity.
- **`#previewDurationsMs()`** — honest about being a derived preview path, not the staged source
  of truth. Lovely.
- Shared `frameBake.js` typedef `FrameBakeConfig` is a solid anchor once the UI layer stops
  calling the same object something else.
