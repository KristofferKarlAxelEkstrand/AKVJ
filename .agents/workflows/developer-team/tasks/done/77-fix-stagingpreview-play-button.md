# Task 77: Fix StagingPreview Play/Pause Button Permanently Disabled

## Severity: Medium (UX bug)

## Location
`mainframe/src/js/StagingPreview.js` — `loadFrames()` method

## Problem
The play/pause button is set to `disabled = true` at creation (line 135) and never re-enabled after frames load. The scrub slider correctly follows a disable-during-load / enable-after-load pattern, but the play/pause button was missed. Users can never pause or resume the preview.

## Fix
In `loadFrames()`, wherever the scrub slider is re-enabled after successful load (around line 101-104), also re-enable the play/pause button:
```javascript
if (this.#playPauseButton) {
    this.#playPauseButton.disabled = false;
}
```

Also add a test asserting the button becomes enabled after `loadFrames()` resolves (Task 62 added StagingPreview tests but didn't catch this).

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/StagingPreview.js`
- `mainframe/test/StagingPreview.test.js`

## Constraints
- Verify the early-return path (empty files) doesn't incorrectly enable the button
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Related to Task 62 (StagingPreview tests)
- Found by Overseer/QA
