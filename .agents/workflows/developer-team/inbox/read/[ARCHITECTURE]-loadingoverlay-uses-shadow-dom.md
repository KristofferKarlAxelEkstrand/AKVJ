# [ARCHITECTURE] LoadingOverlay.js uses Shadow DOM — violates the repo's light-DOM-only rule

## Where
`akvj/src/js/ui/LoadingOverlay.js` (new, from Task 92 — Project Concept live-switching overlay)

## Problem
Line 16: `this.attachShadow({ mode: 'open' });`, with all styling built as an inline `<style>` string inside the shadow root (lines 20-65).

This directly violates the repo's documented Custom Elements convention, `.agents/skills/custom-elements-frontend/SKILL.md`:
- Rule 3: *"**No Shadow DOM** — no `attachShadow`. Light DOM + CSS/SCSS scoped under the host tag (one stylesheet per element; do not grow a global component CSS dump)."*
- Listed explicitly under "Anti-patterns": *"Shadow DOM 'for CSS'"*
- Checklist item: *"[ ] Light DOM only (no `attachShadow`)"*

Confirmed via repo-wide grep: `LoadingOverlay.js` is the **only** component using `attachShadow` anywhere in `akvj/src/` or `mainframe/src/` — every other custom element (`RoleChoice`, `SortChoice`, `PianoKey`, `PianoRoll`, `ClipInstance`, etc.) correctly uses light DOM per the house style. It also has no companion `.scss`/`.css` file (styles are hardcoded as a JS template string), compounding the drift from the "one stylesheet per element" convention the SCSS migration (Tasks 98/99) established for the rest of the UI.

## Why it matters
Not just style — Shadow DOM opts this component out of the app's CSS pipeline (SCSS build, any future global theming/custom-property cascades) and out of light-DOM event/selector patterns the rest of the codebase relies on. Functionally harmless today (all styles are hardcoded, no external CSS currently needs to reach in), but it's a real inconsistency in a brand-new, high-visibility component (the Projects live-switching overlay) that other agents may copy as a pattern if left uncorrected.

## Suggested Fix
Rewrite without `attachShadow`: build the progress bar as light-DOM children (as the skill's own skeleton example does), move styles to a new `akvj/src/scss/` (or equivalent) file scoped under the `akvj-loading-overlay` host tag, imported the same way other components import their scoped stylesheet. Keep the same public API (`show()`, `hide()`, `setProgress()`, `isVisible`) so `AdventureKidVideoJockey.js`'s usage doesn't need to change.

## Priority
Medium — not a functional bug today, but it's a clear, documented-convention violation in new, high-visibility code; cheap to fix now before more code copies the shadow-DOM pattern.
