---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 289: Add `<preview-clip>` custom element

## Description

Create a reusable `<preview-clip>` custom element containing visual preview, play speed control, and progress indicator. It will be used in pianoroll Play mode, the clip editor, and the library page.

## Requirements

- Custom element name: `<preview-clip>`.
- Properties: `clipId`, `playbackMode`, `isPlaying`, `currentFrame`, `totalFrames`.
- Methods: `play()`, `pause()`, `stop()`, `setSpeed(multiplier)`.
- Events: `speedchange`, `framechange`, `playbackend`.
- Visual preview: Canvas showing clip animation in real time.
- Play speed control: Dropdown or slider (0.5x, 1x, 1.5x, 2x, etc.).
- Progress indicator: Progress bar or frame counter showing playback position.
- Single unified element: all three pieces together, no separate components.
- Styling: Responsive, matches mainframe/akvj visual language.

## Affected files

- New: `mainframe/src/js/PreviewClip.js`
- New: `mainframe/src/scss/PreviewClip.scss`
- `mainframe/src/index.html` (clip editor, library, or pianoroll Play mode usage)
- `mainframe/test/PreviewClip.test.js` (new)

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npm run build -w mainframe` passes.
4. The element renders a canvas, speed control, and progress indicator.
5. `play()`, `pause()`, `stop()`, and `setSpeed()` work and dispatch correct events.

## Notes

- Part of the pianoroll modes / clip editor feature set.
- The example in the design uses colon-prefixed props (`:is-playing`) and at-event (`@speedchange`); adapt to plain vanilla JS custom element attributes and events.
- Coordinate with Task 273/274 (Pianoroll modes) and the clip editor work.
