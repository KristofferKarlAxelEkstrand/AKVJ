---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 105: Animated GIF Expand + Delay→Timing

## Severity: Medium (Feature — user requested via spec)

## Location
- `mainframe/scripts/clips/` (pipeline)
- `mainframe/server/index.js`
- `mainframe/src/js/ClipFrames.js`

## Problem
Animated GIFs should be expanded into individual frames with their delay timing preserved.

## Requirements
1. **Detect animation** with `sharp` metadata: `pages > 1` → animated; else static
2. **Expand animation only** when accepted set is exactly one GIF and that GIF is animated
3. **If clip already has frames**: append expanded frames at the end
4. **Extract every frame** from animated GIF
5. **Map GIF frame delays into clip timing** — GIF `delay` and `<clip-frames>` duration inputs are milliseconds; `frameRatesForFrames` is FPS
6. **Convert with shared ms↔FPS helper** (`fps ≈ 1000 / delayMs`, fallback when delay is missing or 0)
7. **GIF with any other accepted image**: treat each GIF as still — first frame only (`page: 0`)
8. **Lone static GIF**: one still frame
9. **Expand before preview** — GIF expansion early enough that preview and `<clip-frames>` match what will be saved

## Acceptance Decision Table
| Accepted input (batch) | Behavior |
|------------------------|----------|
| N× PNG/JPG | N stills |
| 1× animated GIF alone | Expand all frames (+ delays) |
| 1× static GIF alone | 1 still |
| GIF(s) + any other image | Each GIF = first frame only |
| 2+ GIFs, no stills | Each GIF = first frame only |

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — shared conversion helper, no duplicated logic
- **NPM Protocol**: NEVER run `npm install` yourself.

## Spec Reference
`.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` §3, §4, §9
