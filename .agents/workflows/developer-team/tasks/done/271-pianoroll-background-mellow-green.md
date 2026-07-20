---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 271: Mellow green background for piano roll

## Description

Update the `<piano-roll>` UI element so its background is a mellow green color, improving visual consistency and aesthetic appeal.

## Affected files

- `mainframe/src/scss/PianoRoll.scss` — likely add a `background` or `background-color` rule to the `piano-roll` element.
- `mainframe/src/js/PianoRoll.js` — only if the background needs to be set dynamically via inline style.

## Verification

1. `npm run lint` passes.
2. `npm run build -w mainframe` passes.
3. The `/key-map` (Mapping) and `/library` piano rolls display the new background color.

## Notes

- Keep the change minimal; do not alter the layout, sticky positioning, or interaction logic.
- Coordinate with the Pianoroll Modes epic if a mode-specific background is desired later.
