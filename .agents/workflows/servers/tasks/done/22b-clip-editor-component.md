# Task 22b: Extract `<akvj-clip-editor>` Component

## Objective
Extract the clip metadata edit form from `main.js` into a reusable `<akvj-clip-editor>` custom element.

## Requirements
- Move `createClipEditForm()`, validation logic, and save handler into the component
- Component accepts `clip` (object with meta) via setter
- Dispatches `clipsaved` event (bubbles: true) with clipId in detail
- Import via side-effect in `main.js`
