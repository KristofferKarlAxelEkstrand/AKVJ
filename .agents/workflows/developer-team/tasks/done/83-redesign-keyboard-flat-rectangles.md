# Task 83: Redesign Keyboard Component — Flat Rectangles

## Severity: Medium (UX redesign — user priority)

## Location
`mainframe/src/js/PianoKeyboard.js`
`mainframe/src/js/StickyPianoRoll.js`
`mainframe/src/styles.css`

## Problem
The user wants a drastic simplification of the keyboard/piano component UI. Move away from realistic piano look to a flat, simple layout of rectangles.

## Requirements
1. **Architecture**: Must remain a custom element
2. **Layout**: Simple horizontal row of rectangles (left to right, like a MIDI keyboard)
3. **Dimensions**: All keys (both black and white) must have the **exact same height and width**. Rectangles should be taller than they are wide.
4. **Styling**: No overlapping elements. Just simple white and black boxes. A small gap between keys is acceptable.
5. **Pattern**: Octave sequence: white, black, white, black, white, white, black, white, black, white, black, white
6. **Simplicity**: "Simplicity is really a key goal for the frontend really make it great." — apply this principle to all future frontend work.

## Scope
- Redesign `PianoKeyboard` component rendering
- Redesign `StickyPianoRoll` component rendering (same flat rectangle style)
- Update CSS styles — remove realistic piano styling, add flat rectangle styling
- Keep all existing functionality (mapped note highlighting, click events, filter behavior)
- Update tests to match new rendering

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/PianoKeyboard.js`
- `mainframe/src/js/StickyPianoRoll.js`
- `mainframe/src/styles.css`
- `mainframe/test/PianoKeyboard.test.js`
- `mainframe/test/StickyPianoRoll.test.js`

## Constraints
- **Avoid over-engineering** — keep it simple, flat rectangles only
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- None
