# [ARCHITECTURE] main.js uses module-level mutable state instead of AppState pattern

## Location
`mainframe/src/main.js:9-22`

## Description
`main.js` uses plain `let` variables for global state (`mappingState`, `clipCatalog`, `clipSearchQuery`, `clipRoleFilter`, `clipSortMode`, `pianoChannel`). This is inconsistent with the AKVJ engine's pattern of using `AppState` (an `EventTarget` subclass) for state management.

The mainframe UI has no centralized state management — state is scattered across module-level variables and DOM element properties. Changes to state require manual calls to `renderLibrary()`, `renderMapping()`, `updatePianoKeyboard()`, etc.

## Impact
- State changes require manual orchestration of re-renders
- No single source of truth for UI state
- Difficult to add new features that depend on multiple state values
- Testing is harder because state is not observable

## Suggested Fix
Introduce a `MainframeState` class extending `EventTarget` that holds all UI state and dispatches events on changes. Components subscribe to relevant events and re-render automatically. This aligns with the AKVJ engine's `AppState` pattern.
