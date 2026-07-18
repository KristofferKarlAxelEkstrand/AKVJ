# Task 88: Clip Frame Editor on Upload Page

## Severity: Medium (Feature — user requested)

## Location
- `mainframe/src/js/ClipFrames.js` (new — custom element container)
- `mainframe/src/js/ClipFrame.js` (new — individual frame element)
- `mainframe/src/index.html` (add to upload page)
- `mainframe/src/main.js` (integration)
- `mainframe/src/styles.css` (styling)
- `mainframe/test/ClipFrames.test.js` (new — tests)

## Problem
The user wants a mini frame editor on the upload page that displays every individual frame in a horizontally scrollable container, with per-frame duration editing and drag-and-drop reordering.

## Requirements
1. **Architecture**: Custom elements
   - `<clip-frames>` — main container, horizontally scrollable
   - `<clip-frame>` — individual frame element, nested inside container
2. **Layout & UX**:
   - `<clip-frames>` displays frames horizontally, scrollable left-to-right
   - Each `<clip-frame>` displays the frame image with a duration input field underneath
3. **Interactions**:
   - Edit duration of any specific frame (duration input field)
   - Drag and drop `<clip-frame>` elements to reorder
4. **Simplicity**: Keep it clean, intuitive, and responsive per the user's design principles

## Scope
- Create `ClipFrames` custom element (container with horizontal scroll)
- Create `ClipFrame` custom element (image + duration input)
- Integrate with upload page in `index.html`
- Wire up in `main.js` — populate frames from uploaded sprite sheet
- Add drag-and-drop reordering (vanilla JS — no libraries)
- Add per-frame duration editing
- Update `frameRatesForFrames` metadata when durations change
- Add tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/ClipFrames.js` (new)
- `mainframe/src/js/ClipFrame.js` (new)
- `mainframe/src/index.html`
- `mainframe/src/main.js`
- `mainframe/src/styles.css`

## Constraints
- **Vanilla JS only** — no drag-and-drop libraries
- **Avoid over-engineering** — simple, intuitive interactions
- **Custom elements** — follow existing pattern (PianoKeyboard, ClipEditor, etc.)
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 87 (URL Routing) — the upload page will be at `/clip/new`
- Task 86 (Clip Naming) — related to clip creation workflow
