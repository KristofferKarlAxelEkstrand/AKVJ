---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 295: Mainframe non-JS CSS variable consistency sweep

## Description

Non-behavioral cleanup in `mainframe/src/` non-JS assets (`styles.css`, `PageShell.scss`, `index.html`, `main.js`, `scss/`) to make CSS custom-property fallbacks consistent and remove a dead `--bg` token.

## Findings

### 1. `--accent` fallback color is split-brained
- **Files**: `mainframe/src/scss/PageShell.scss` (lines 191, 196–197) vs. `mainframe/src/styles.css` (line 7) and other SCSS files
- **Current**:
  - `PageShell.scss`: `var(--accent, #646cff)`
  - `styles.css` and other components: `--accent: #d9773a` / `var(--accent, #d9773a)`
- **Proposed**: Use the canonical `#d9773a` fallback everywhere, or extract an `$accent-fallback` SCSS variable used consistently.
- **Rationale**: If `--accent` is removed or misspelled, the page would show two different "accent" colors, making the theme look broken.

### 2. `--ok` fallback color diverges from the canonical token
- **File**: `mainframe/src/scss/PageShell.scss` (line 118)
- **Current**: `.clip-summary--all-ready { color: var(--ok, #2a7d2a); }`
- **Canonical**: `styles.css` line 9: `--ok: #6fbf73`
- **Proposed**: `var(--ok, #6fbf73)` (or reuse a shared `$ok` SCSS constant).
- **Rationale**: Fallbacks should match the token they protect.

### 3. `--warn` is used but never defined in `:root`
- **File**: `mainframe/src/scss/PageShell.scss` (line 122)
- **Current**: `.clip-summary--has-incomplete { color: var(--warn, #b8860b); }`
- **Proposed**: Add `--warn: #b8860b;` (or the intended warn color) to `styles.css` `:root`, and use `var(--warn)` without a magic fallback.
- **Rationale**: The only warning color lives as a bare hex fallback; defining it with the other semantic color tokens makes the palette discoverable.

### 4. `--bg` token is dead, while `body` uses a bare magic color
- **File**: `mainframe/src/styles.css` (lines 3, 24–25)
- **Current**:
  - `:root { --bg: #12141a; }`
  - `body { background: #2a2a2a; }`
- **Proposed**: Either
  - use `body { background: var(--bg); }` (if `--bg` is meant to be the page background), or
  - rename `--bg` to something accurate (e.g. `--panel-bg`) and use `var(--panel-bg)` where intended, and/or replace the bare `#2a2a2a` with a named custom property such as `--page-bg`.
- **Rationale**: `--bg` strongly implies "page background" but is defined and never used; `body` hard-codes a different gray.

## Affected files

- `mainframe/src/styles.css`
- `mainframe/src/scss/PageShell.scss`
- Potentially other SCSS files referencing `--accent` fallbacks.

## Verification

1. `npm run lint` passes.
2. `npm run build -w mainframe` passes.
3. Mainframe pages render without visual regressions.
4. No runtime behavior changes.

## Notes

- This is a CSS token/fallback consistency cleanup only.
- Verify colors in the browser or via visual regression if available.
