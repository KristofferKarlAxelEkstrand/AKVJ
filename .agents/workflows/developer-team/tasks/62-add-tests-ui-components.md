# Task 62: Add Unit Tests for ClipEditor, StagingPreview, PianoKeyboard

## Severity: Medium (Tech debt)

## Location
`mainframe/test/`

## Problem
No unit tests for 3 of 5 mainframe UI custom elements: `ClipEditor.js`, `StagingPreview.js`, `PianoKeyboard.js`. Bugs go undetected, refactoring is risky.

## Fix
Add unit tests covering:
- **ClipEditor**: form field rendering, JSON validation, save request, error handling
- **StagingPreview**: frame loading, playback mode advancement, scrub interaction
- **PianoKeyboard**: key count (128), black/white key classification, mapping highlight, click event dispatch

## Key Files
- `mainframe/src/js/ClipEditor.js`
- `mainframe/src/js/StagingPreview.js`
- `mainframe/src/js/PianoKeyboard.js`
- `mainframe/test/` — where tests should go

## Dependencies
- None (discovered during Task 37b)
