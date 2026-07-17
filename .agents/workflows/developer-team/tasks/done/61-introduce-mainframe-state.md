# Task 61: Introduce MainframeState for Centralized UI State

## Severity: Medium (Architecture)

## Location
`mainframe/src/main.js:9-22`

## Problem
`main.js` uses plain `let` variables for global state. No centralized state management — state is scattered across module-level variables. Changes require manual re-render orchestration. Inconsistent with AKVJ's `AppState` pattern.

## Fix
Introduce a `MainframeState` class extending `EventTarget` that holds all UI state and dispatches events on changes. Components subscribe to relevant events and re-render automatically.

## Key Files
- `mainframe/src/main.js`
- `mainframe/src/js/` — all UI components that would subscribe

## Constraints
- Large refactor — should be done incrementally
- Follow AKVJ's `AppState` pattern as reference

## Dependencies
- None (discovered during Task 37b)
- Should be done before Task 32 (Piano Roll) for best architecture
