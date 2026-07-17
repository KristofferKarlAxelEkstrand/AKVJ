# Feature Request: Sticky Piano Roll Component

## The Vision
We need a piano roll interface in the `mainframe` UI. This will eventually become the visual command center where the user assigns clips to specific MIDI keys (key mapping).

## Requirements
1. **Layout**: It must be 100% wide and "sticky" (fixed) at the bottom of the mainframe screen so it is always visible and accessible, regardless of where the user scrolls in the clip library above.
2. **Architecture**: It must be built as a native Vanilla JS Custom HTML Element (e.g., `<ak-piano-roll>`). Do not use any external frameworks.
3. **Decoupling**: This is strictly a `mainframe` feature. It should not touch or bleed into the `akvj` engine.

## Architectural Ideas & Thoughts to Consider
As you plan this implementation, please consider the following:
- **MIDI Range**: A full piano has 88 keys, and MIDI supports 128 notes. A 100% wide element might cramp the keys too much on smaller screens. Consider adding a horizontal scroll within the custom element, or an "octave shift" UI.
- **Event-Driven Design**: The `<ak-piano-roll>` component should be highly decoupled from the main app state. When a user clicks a key, the component should just dispatch a custom event (e.g., `new CustomEvent('key-selected', { detail: { note: 60 } })`). The mainframe app can listen to this event and handle the actual mapping logic.
- **Aesthetics**: Ensure the design feels premium. Use CSS variables to match the mainframe's dark mode palette, and add subtle CSS transition hover effects on the keys so it feels responsive and alive.

**Team Lead**: Please triage this request. This looks like a pure UI component task, so it should likely be delegated to the `mainframe-developer`.
