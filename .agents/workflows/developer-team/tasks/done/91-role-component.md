# Task 91: Role Component — Custom Horizontal Element

## Severity: Low (UX improvement — user requested)

## Location
- `mainframe/src/js/RoleChoices.js` (new — custom element)
- `mainframe/src/js/RoleChoice.js` (new — individual role option)
- `mainframe/src/index.html` (replace existing role dropdown)
- `mainframe/src/main.js` (integration)
- `mainframe/src/styles.css` (styling)
- `mainframe/test/RoleChoices.test.js` (new — tests)

## Problem
Replace the standard role `<select>` dropdown with a custom horizontal UI element, identical in style to the sort choices component (Task 90).

## Requirements
1. **Architecture**: Custom elements:
   ```html
   <role-choices>
     <label>Role:</label>
     <role-choice>Role Option 1</role-choice>
     <role-choice>Role Option 2</role-choice>
   </role-choices>
   ```
2. **Layout**: The entire `<role-choices>` component laid out horizontally
3. **Styling**: Very simple. Individual `<role-choice>` elements should have slightly rounded corners (border-radius) to look clickable. Same style as `<sort-choice>`.
4. **Behavior**: Clicking a `<role-choice>` should change the role filter (same as the existing dropdown)

## Scope
- Create `RoleChoices` custom element (horizontal container)
- Create `RoleChoice` custom element (clickable role option)
- Replace existing role `<select>` in `index.html`
- Wire up in `main.js` — dispatch role filter change events
- Style with flat, minimalist CSS (same as sort choices)
- Add tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/RoleChoices.js` (new)
- `mainframe/src/js/RoleChoice.js` (new)
- `mainframe/src/index.html`
- `mainframe/src/main.js`
- `mainframe/src/styles.css`

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — keep it simple, same style as sort choices
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 90 (Sort Component) — same pattern, should be done first or together
