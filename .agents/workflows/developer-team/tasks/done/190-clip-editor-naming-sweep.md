---
status: done
assignee: none
priority: low
---

# Task 190: Clip Editor Refactor — Naming & Terminology Cleanup

## Source
`.agents/workflows/developer-team/inbox/read/[NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md`
(The Nitpicker, batched sweep over the new clip-editor refactor files in `mainframe/src/js/`.)

## Scope note
The source ticket's item #2 (custom-element tag-prefix consistency across `akvj-*` vs. unprefixed
tags) is **excluded** — it's already resolved by the documented rule in
`.agents/workflows/developer-team/spec/code-standards.md:13` ("Use `akvj-*` only for top-level app
shells... unprefixed for reusable leaf widgets... Do **not** mass-rename existing tags for
consistency"). The current mix (3 prefixed shells, 13 unprefixed leaf widgets) already matches that
rule. Do not touch tag names as part of this task.

## Checklist

1. **`#abort` → `#abortController` rename** (3 files): `mainframe/src/js/ChoiceItem.js:13`,
   `mainframe/src/js/ChoiceList.js:17`, `mainframe/src/js/ClipNameInput.js:30`. Field holds an
   `AbortController` instance, not the abort action — `#abort` reads like a verb/flag. Matches the
   already-established house style for this per-`connectedCallback` `AbortController` pattern (same
   fix previously proposed for `UserMessage.js` in both workspaces).

2. **`ClipEditorController.js:101` — `bind()` → `bindEventListeners()`** (or `wireControls()`).
   Doc comment above it already says "Wire DOM listeners once after construction" — the method name
   itself should say what's being bound, matching the naming style already used for other lifecycle
   methods (`#initializeVisuals()`, `mount()`, `enable()`, `initialize()`).

3. **`duration` → `durationMs` consistency** across `ClipFrame.js` (`#duration` field, `duration`
   getter, `setDuration(duration)`, event detail key `duration`, ~lines 13, 42-44, 53, 99-104) and
   `ClipFrames.js` (`getDurations()`, `setAllDurations(ms)`, `areDurationsUniform()`, event detail
   keys `duration`/`all`, ~lines 43-45, 57-64, 74-89). Rename to `#durationMs`/`durationMs`/
   `setDurationMs()` and `getDurationsMs()`/`setAllDurationsMs()`/`areDurationsMsUniform()`, plus the
   `durationchange` event detail key `duration` → `durationMs`. Matches the convention
   `ClipEditorController.js` already uses one layer up (`#stagedDurationsMs`,
   `#lastUniformDurationMs`). Update all call sites/listeners.

4. **`index.html` id prefix consistency**: `id="drop-zone"` (line 42) → `id="clip-editor-drop-zone"`,
   `id="staging-preview"` (line 47) → `id="clip-editor-staging-preview"`, to match every other sibling
   id inside `#panel-clip-editor` (`clip-editor-form`, `clip-editor-heading`, etc. — ~20 instances,
   itself the result of a prior nit fix). Update the matching `document.getElementById(...)` calls in
   `ClipEditorController.js:66,73`.

## Verification
`npm run lint && npm run test -w mainframe && npm run build` after the rename pass — these are pure
renames (fields, methods, ids, event detail keys), no behavior change, so existing tests should catch
any missed call site.
