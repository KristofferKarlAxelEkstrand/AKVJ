# Task 93: Unified Piano Roll — Extract as Reusable Custom Element

## Severity: Medium (Architecture — user requested)

## Location
- `mainframe/src/js/PianoRoll.js` (new — unified custom element)
- `mainframe/src/js/PianoKey.js` (new — individual key element)
- `mainframe/src/main.js` (integration)
- `mainframe/src/index.html` (replace existing piano components)
- `mainframe/src/styles.css` (styling)
- `mainframe/test/PianoRoll.test.js` (new — tests)

## Problem
The user wants one unified piano-roll custom element used on every Mainframe page, covering edit, category browse, and play/test modes. Currently there are separate piano UIs per page.

## Requirements
1. **Extract and unify** the existing piano roll components (`PianoKeyboard`, `StickyPianoRoll`) into a single reusable `<piano-roll>` custom element
2. **Mode property**: `edit`, `category`, `play` — determines behavior and display
3. **Custom element**: Build so multiple instances can be placed on a page
4. **Replace existing**: Swap out `PianoKeyboard` and `StickyPianoRoll` usages with the new unified component

## Scope
- Create `PianoRoll` custom element with mode switching
- Create `PianoKey` custom element for individual keys
- Migrate existing piano UI usages to the new component
- Style with flat, minimalist CSS (consistent with existing keyboard redesign)
- Add tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/PianoRoll.js` (new)
- `mainframe/src/js/PianoKey.js` (new)
- `mainframe/src/js/PianoKeyboard.js` (existing — to be replaced)
- `mainframe/src/js/StickyPianoRoll.js` (existing — to be replaced)

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — keep it simple, one component with modes
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 83 (Keyboard Redesign) — completed, provides flat rectangle styling
- Task 87 (URL Routing) — completed, pages have URLs
