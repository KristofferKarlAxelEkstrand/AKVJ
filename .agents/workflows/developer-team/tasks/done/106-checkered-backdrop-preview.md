---
status: done
assignee: none
priority: medium
---

# Task 106: Checkered Transparency Backdrop + 2× Pixelated Staging Preview

## Severity: Medium (Feature — user requested via spec)

## Location
- `mainframe/src/js/StagingPreview.js`
- `mainframe/src/js/ClipFrames.js` (thumbnails)
- `mainframe/src/scss/StagingPreview.scss`
- `mainframe/src/scss/ClipFrames.scss`

## Problem
Transparency is not visible in previews. Spec requires a Photoshop-style checkered backdrop and 2× pixelated display.

## Requirements
1. **Photoshop-style light grey/white checkerboard** behind previews so transparency is obvious
2. **No backdrop chooser** — checker only, keep UI simple
3. **Apply same checkered backdrop to**:
   - Main staging preview canvas
   - Frame thumbnails in `<clip-frames>`
4. **Preview-only chrome** — must NOT bake into saved spritesheet
5. **Display staging preview at 2×** the clip frame size (e.g. 240×135 → 480×270) with `image-rendering: pixelated`
6. **Internal canvas buffer stays at true frame size** — only on-screen CSS scale is doubled
7. **Cap displayed width at 960px** — scale down further if `2 × frameWidth` would exceed that

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — CSS-only checkerboard, no canvas manipulation
- **CSS per element** — use SCSS scoped under custom element
- **NPM Protocol**: NEVER run `npm install` yourself.

## Spec Reference
`.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` §6
