# [TASK] 84: Mainframe UI Simplification — Background, Body Reset, Remove Title

## Severity: Low (UX cleanup — user requested)

## Location
`mainframe/src/styles.css`
`mainframe/src/index.html`

## Problem
Three UX simplification items from the user were sent as feedback but not addressed in Task 83. Consolidating into a single task.

## Requirements
1. **Flat grey background**: Set the application background to a solid, flat grey. Remove any existing background patterns, gradients, or images (currently has `radial-gradient` in `body`).
2. **Body margin/padding reset**: Ensure `body { margin: 0; padding: 0; }` in global CSS.
3. **Remove title and description**: Remove from `mainframe/src/index.html`:
   - The `<h1>AKVJ Mainframe</h1>` element
   - The `<p>Clip library, upload, and MIDI mapping for the shared clip bucket.</p>` element
   - Keep the `<title>` tag in `<head>` for browser tab purposes

## Verification
- Run `npm run lint` to ensure no lint errors
- Run `npm run test -w mainframe` to ensure all tests pass

## Key Files
- `mainframe/src/styles.css` (background, body reset)
- `mainframe/src/index.html` (remove h1 and p elements)

## Constraints
- **Avoid over-engineering** — simple CSS changes only
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- None
