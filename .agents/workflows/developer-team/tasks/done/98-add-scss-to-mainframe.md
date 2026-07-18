# Task 98: Add SCSS to Mainframe Build

## Severity: Medium (Architecture — user requested)

## Location
- `mainframe/vite.config.js` (add SCSS preprocessing)
- `mainframe/package.json` (add sass devDependency — request via [NPM-REQUEST])
- `mainframe/src/styles.css` (will become `mainframe/src/styles.scss` or remain as global baseline)

## Problem
The user wants SCSS support in the Mainframe build so each custom element can own its styles in a scoped SCSS file.

## Requirements
1. **Add SCSS/Sass to Vite build** — Vite supports SCSS out of the box, just needs `sass` as a devDependency
2. **Request `sass` via `[NPM-REQUEST]`** — Team Lead will install it
3. **Verify SCSS compilation works** — Create a test `.scss` file and confirm it compiles
4. **Keep existing CSS working** — Don't break existing `styles.css` during transition
5. **Prepare for incremental migration** — Set up the structure but don't migrate all styles yet

## Scope
- Add `sass` devDependency (via [NPM-REQUEST])
- Configure Vite for SCSS if needed (Vite handles this automatically with sass installed)
- Verify build works with SCSS
- Add tests if applicable

## Verification
- Run `npm run build -w mainframe` to ensure build succeeds
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Constraints
- **Vanilla JS only** — SCSS is for styling, not logic
- **KISS** — just add the capability, don't over-configure
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead.

## Dependencies
- None — can start immediately
