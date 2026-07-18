# Task 90: Sort Component — Custom Horizontal Element

## Severity: Low (UX improvement — user requested)

## Location
- `mainframe/src/js/SortChoices.js` (new — custom element)
- `mainframe/src/js/SortChoice.js` (new — individual sort option)
- `mainframe/src/index.html` (replace existing sort dropdown)
- `mainframe/src/main.js` (integration)
- `mainframe/src/styles.css` (styling)
- `mainframe/test/SortChoices.test.js` (new — tests)

## Problem
The user wants to replace the standard sort `<select>` dropdown with a custom horizontal UI element using Web Components.

## Requirements
1. **Architecture**: Custom elements:
   ```html
   <sort-choices>
     <label>Sort</label>
     <sort-choice>Name</sort-choice>
     <sort-choice>ID</sort-choice>
   </sort-choices>
   ```
2. **Layout**: The entire `<sort-choices>` component laid out horizontally
3. **Styling**: Very simple. Individual `<sort-choice>` elements should have slightly rounded corners (border-radius) to look clickable. No fancy styling.
4. **Behavior**: Clicking a `<sort-choice>` should change the sort mode (same as the existing dropdown)

## Scope
- Create `SortChoices` custom element (horizontal container)
- Create `SortChoice` custom element (clickable sort option)
- Replace existing sort `<select>` in `index.html`
- Wire up in `main.js` — dispatch sort mode change events
- Style with flat, minimalist CSS
- Add tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/SortChoices.js` (new)
- `mainframe/src/js/SortChoice.js` (new)
- `mainframe/src/index.html`
- `mainframe/src/main.js`
- `mainframe/src/styles.css`

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — keep it simple, just rounded clickable buttons
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- None — independent
