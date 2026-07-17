# Task 81: Wire MainframeState Events to UI Updates in main.js

## Severity: Medium (Architecture — incomplete refactor)

## Location
`mainframe/src/main.js`

## Problem
Task 61 introduced `MainframeState` with event dispatch, but `main.js` ignores the events. Instead of subscribing to state changes to update the UI reactively, `main.js` manually calls render functions immediately after mutating state. This defeats the purpose of the event-driven state container.

Example:
```javascript
pianoChannelSelect.addEventListener('change', () => {
    mainframeState.channel = Number(pianoChannelSelect.value);
    renderMapping(); // Manual UI update instead of reacting to state change
});
```

## Fix
1. Remove manual calls to UI update functions from DOM event listeners
2. Add `mainframeState.subscribe(EVENT_NAME, callback)` listeners to trigger UI updates reactively
3. Ensure setting state properties automatically triggers all necessary downstream UI effects
4. Events to wire: `EVENT_CLIPS_CHANGED`, `EVENT_MAPPINGS_CHANGED`, `EVENT_CHANNEL_CHANGED`, `EVENT_SEARCH_CHANGED`, `EVENT_ROLE_FILTER_CHANGED`, `EVENT_SORT_MODE_CHANGED`

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify UI still updates correctly when state changes

## Key Files
- `mainframe/src/main.js` (main refactor target)
- `mainframe/src/js/mainframeState.js` (event names and API)

## Constraints
- Use `#` prefix for private fields
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 61 (MainframeState) — completed but events not wired
- Found by Overseer
