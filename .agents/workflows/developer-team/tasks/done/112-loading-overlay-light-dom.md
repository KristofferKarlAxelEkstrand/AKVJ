---
status: done
assignee: akvj-developer
priority: medium
---

# Task 112: Refactor LoadingOverlay to Light DOM

## Severity: Architecture / Code Quality

## Summary
`akvj/src/js/ui/LoadingOverlay.js` (added during Task 92 — Project live-switching overlay) currently uses `this.attachShadow({ mode: 'open' })` with an inline `<style>` string inside the shadow root. This violates the repo's Custom Elements convention, which requires light-DOM components with scoped stylesheets.

## Problem
- `attachShadow` is used for CSS scoping, listed as an anti-pattern in `.agents/skills/custom-elements-frontend/SKILL.md`.
- `LoadingOverlay.js` is the only component in `akvj/src/` or `mainframe/src/` that uses Shadow DOM.
- Styles are hardcoded as a JS string instead of living in a companion `.scss`/`.css` file, breaking the "one stylesheet per element" convention.
- Shadow DOM opts the component out of the SCSS build and future global theming/custom-property cascades.

## Acceptance Criteria
- Remove `attachShadow` and rewrite `LoadingOverlay.js` to build its DOM as light-DOM children.
- Move styles to a scoped stylesheet (e.g., `akvj/src/scss/_LoadingOverlay.scss` or equivalent), referenced under the `akvj-loading-overlay` host tag.
- Preserve the public API: `show()`, `hide()`, `setProgress(progress)`, `isVisible`.
- No changes required in `AdventureKidVideoJockey.js` callers.
- Verify with `npm run lint`, `npm run test`, and `npm run build` in the `akvj` workspace.

## Notes
- See `.agents/skills/custom-elements-frontend/SKILL.md` for the light-DOM custom elements pattern and skeleton example.
- Original architecture note: `inbox/read/[ARCHITECTURE]-loadingoverlay-uses-shadow-dom.md`
