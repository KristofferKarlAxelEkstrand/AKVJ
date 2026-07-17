# [TECH-DEBT] No test coverage for ClipEditor, StagingPreview, or PianoKeyboard

## Location
`mainframe/test/`

## Description
The test suite has no unit tests for three of the five mainframe UI custom elements:
- `ClipEditor.js` — no tests for form rendering, validation logic, or save flow
- `StagingPreview.js` — no tests for frame loading, playback modes, or scrub functionality
- `PianoKeyboard.js` — no tests for key rendering, mapping highlights, or click events

Only `ClipList.js` and `MappingTable.js` have test coverage (via the visual regression tests added in Task 26b, but no unit tests for logic).

## Impact
Bugs in these components (like the ClipEditor save response check bug, or the StagingPreview shuffle issue) go undetected. Refactoring these components is risky without test coverage.

## Suggested Fix
Add unit tests for each component covering:
- **ClipEditor**: form field rendering, JSON validation, save request, error handling
- **StagingPreview**: frame loading, playback mode advancement, scrub interaction
- **PianoKeyboard**: key count (128), black/white key classification, mapping highlight, click event dispatch
