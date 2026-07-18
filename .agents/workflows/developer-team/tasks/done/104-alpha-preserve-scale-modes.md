---
status: done
assignee: none
priority: medium
---

# Task 104: Alpha-Preserving Decode/Fit into Spritesheet + Scale Modes

## Severity: Medium (Feature — user requested via spec)

## Location
- `mainframe/scripts/clips/` (pipeline/sprite generation)
- `mainframe/server/index.js`
- `mainframe/src/js/ClipEditor.js` (or shared editor)

## Problem
Currently sources must be same size. Spec requires accepting mixed source dimensions, fitting each into a shared frame size with alpha preservation.

## Requirements
1. **Preserve alpha end-to-end**: decode → fit/center → spritesheet → stored `sprite.png`
2. **Output remains PNG with alpha channel** — transparent pixels must not be flattened onto opaque background
3. **PNG**: full alpha preserved. **GIF**: preserve transparency. **JPG**: no alpha (fully opaque)
4. **Relax same-size gate** — stop rejecting mismatched source sizes
5. **Frame size**: default 240×135 (AKVJ canvas), other sizes allowed as editor settings
6. **Centering**: smaller → transparent padding; larger + None → centered crop
7. **Scale modes** (Fit is default):
   - **Fit** — scale uniformly to fit inside; center; transparent letterbox
   - **Cover** — scale uniformly to cover; center crop
   - **Stretch** — scale to exact frame size (may change aspect)
   - **None** — no scale; center with pad and/or centered crop
8. **Changing frame size or scale mode updates live staging preview**
9. **Persist scale mode** (meta or alongside raw assets) so edit/recompile can reproduce same fit

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — simple scale modes
- **NPM Protocol**: NEVER run `npm install` yourself.

## Spec Reference
`.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` §5, §7
