# Task 32: Sticky Piano Roll Component

## Objective
Build a sticky piano roll custom element (`<ak-piano-roll>`) for the mainframe UI that serves as a visual command center for assigning clips to MIDI keys.

## Sub-tasks

### 1. Create `<ak-piano-roll>` Custom Element
- Build as a native Vanilla JS Custom HTML Element (no frameworks)
- File: `mainframe/src/js/components/PianoRoll.js`
- Render a full piano keyboard (88 keys or 128 MIDI notes with horizontal scroll)
- Support an "octave shift" UI control for navigating the keyboard range
- Each key should display its MIDI note number

### 2. Sticky Layout & CSS
- Position the component 100% wide and sticky/fixed at the bottom of the mainframe screen
- Always visible regardless of scroll position in the clip library above
- Use CSS variables to match mainframe's dark mode palette
- Add subtle CSS transition hover effects on keys for a premium feel
- File: `mainframe/src/css/piano-roll.css` (or inline styles in the component)

### 3. Event-Driven Decoupling
- When a user clicks a key, dispatch a custom event: `new CustomEvent('key-selected', { detail: { note: 60 } })`
- Component must be fully decoupled from main app state — no direct imports of AppState or other modules
- The mainframe app will listen for `key-selected` and handle mapping logic

### 4. Integration into Mainframe UI
- Add `<ak-piano-roll>` to `mainframe/src/index.html`
- Import and register the custom element in `mainframe/src/main.js`
- Ensure the sticky positioning doesn't overlap or hide content above it (add bottom padding to the main content area)

## Key Files to Reference
- `mainframe/src/index.html` — mainframe UI entry
- `mainframe/src/main.js` — mainframe app entry point
- `mainframe/src/js/` — existing mainframe frontend code
- `mainframe/src/styles.css` — existing styles (for CSS variable reference)
- `akvj/src/js/core/AdventureKidVideoJockey.js` — example of custom element pattern in this codebase

## Constraints
- **Vanilla JS only** — no external frameworks or libraries
- **Mainframe-only feature** — must not touch or bleed into the `akvj` engine
- Follow existing codebase conventions: `#` private fields, PascalCase file for class export, EventTarget-based communication
- Component must be reusable and self-contained

## Dependencies
- None (can be built independently)
