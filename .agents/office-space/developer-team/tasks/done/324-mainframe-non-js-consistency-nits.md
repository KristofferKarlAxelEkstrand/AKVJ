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

# Task 324: Mainframe non-JS consistency nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-mainframe-non-js-consistency-sweep-2026-07-19.md`

## Description

Fix CSS custom-property fallback inconsistencies and dead tokens in `mainframe/src/` non-JS files.

## Findings and actions

### 1. `--accent` fallback color is inconsistent

**Files:**
- `mainframe/src/scss/PageShell.scss` (lines 191, 196–197): `var(--accent, #646cff)`
- `mainframe/src/styles.css` (line 7) and other components: `--accent: #d9773a` / `var(--accent, #d9773a)`

**Proposed:** Use the canonical `#d9773a` fallback everywhere, or extract an `$accent-fallback` SCSS variable.

### 2. `--ok` fallback color diverges

**File:** `mainframe/src/scss/PageShell.scss` (line 118)

**Current:** `.clip-summary--all-ready { color: var(--ok, #2a7d2a); }`

**Canonical:** `styles.css` line 9: `--ok: #6fbf73`

**Proposed:** `var(--ok, #6fbf73)` or reuse a shared `$ok` SCSS constant.

### 3. `--warn` is used but never defined in `:root`

**File:** `mainframe/src/scss/PageShell.scss` (line 122)

**Current:** `.clip-summary--has-incomplete { color: var(--warn, #b8860b); }`

**Proposed:** Add `--warn: #b8860b;` (or intended warn color) to `styles.css` `:root`, and use `var(--warn)`.

### 4. `--bg` token is dead while `body` uses a bare magic color

**File:** `mainframe/src/styles.css` (lines 3, 24–25)

**Current:**
- `:root { --bg: #12141a; }`
- `body { background: #2a2a2a; }`

**Proposed:** Either
- use `body { background: var(--bg); }` if `--bg` is meant to be the page background, or
- rename `--bg` to `--panel-bg` and use `var(--panel-bg)`, and/or replace `#2a2a2a` with a named custom property such as `--page-bg`.

## Affected files

- `mainframe/src/scss/PageShell.scss`
- `mainframe/src/styles.css`
- Possibly other SCSS files referencing `--accent` / `--ok` / `--warn` / `--bg`

## Verification

- `npm run lint` (root) passes.
- `npm run test -w mainframe` passes.
- `npm run build -w mainframe` passes.
- UI visually consistent (accent, ok, warn, bg colors match expectations).

## Notes

- Non-JS/style consistency cleanup only; no runtime behavior changes.
