# Task 99: Migrate Global CSS to Per-Element SCSS (Incremental)

## Severity: Medium (Refactor — user requested, incremental)

## Location
- `mainframe/src/styles.css` (shrink toward baseline only)
- `mainframe/src/js/*.js` (each custom element gets its own SCSS)
- `mainframe/src/scss/` (new — per-component SCSS files)

## Problem
The user wants almost no global CSS. Component styles should move from `mainframe/src/styles.css` onto the custom elements that own them, one piece at a time.

## Requirements
1. **Migrate incrementally** — No big-bang rewrite. Move styles one custom element at a time.
2. **One SCSS file per custom element** — e.g. `PianoKeyboard.scss`, `ClipList.scss`, `ClipEditor.scss`, etc.
3. **Scope under element** — Each SCSS file scopes rules under its custom element selector
4. **Shrink `styles.css`** — Reduce toward the allowed baseline only (box-sizing, body margin/font)
5. **Allowed global baseline**:
   ```css
   html { box-sizing: border-box; }
   *, *:before, *:after { box-sizing: inherit; }
   ```
   Plus minimal page-shell resets (body margin/font). Nothing else.

## Scope
- Identify all component styles currently in `styles.css`
- Create per-element SCSS files
- Import SCSS in each custom element's JS module
- Remove migrated styles from `styles.css`
- Verify each migration step doesn't break appearance
- Update tests if needed

## Migration Order (suggested)
1. PianoKeyboard / piano roll styles
2. ClipList / ClipCategory / ClipInstance styles
3. ClipEditor / ClipFrames / ClipFrame styles
4. MappingTable styles
5. Tab bar styles
6. Upload form styles
7. Any remaining component styles

## Verification
- Run `npm run build -w mainframe` to ensure build succeeds
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Constraints
- **Incremental** — one element at a time, verify after each
- **KISS** — simple scoped SCSS, no complex nesting
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 98 (Add SCSS to Mainframe Build) — must be completed first
