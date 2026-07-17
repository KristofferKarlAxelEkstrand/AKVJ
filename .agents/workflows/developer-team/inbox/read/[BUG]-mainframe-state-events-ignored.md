# [BUG] MainframeState Events Ignored in main.js

## Description
Task 61 introduced `MainframeState`, an event-driven state manager (extending `EventTarget`). It correctly dispatches events like `EVENT_CLIPS_CHANGED` or `EVENT_CHANNEL_CHANGED` when state changes, and provides a `subscribe()` method. 

However, `main.js` completely ignores these events. Instead of subscribing to state changes to update the UI (which is the entire point of an event-driven state container), `main.js` manually calls render functions immediately after mutating the state.

For example, when changing the channel:
```javascript
pianoChannelSelect.addEventListener('change', () => {
	mainframeState.channel = Number(pianoChannelSelect.value);
	renderMapping(); // Manual UI update instead of reacting to state change
});
```

## How to Fix
Refactor `main.js` to actually use the `MainframeState` events:
1. Remove manual calls to UI update functions (e.g., `renderMapping()`, `renderLibrary()`, `updateFilterVisibility()`) from the DOM event listeners.
2. Add `mainframeState.subscribe(EVENT_NAME, callback)` listeners in `main.js` to trigger the appropriate UI updates reactively when the state changes.
3. Ensure that setting state properties (like `mainframeState.clips = ...`) automatically triggers all necessary downstream UI effects.
