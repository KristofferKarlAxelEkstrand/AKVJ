# Task 69: Restore AppState Unit Test Suite

## Severity: High (Missing test coverage)

## Location
`akvj/test/AppState.test.js` (deleted in commit `e627b9f`)

## Problem
The entire `AppState.test.js` suite (195 lines) was deleted with no replacement. `AppState` is the central EventTarget-based state bus — BPM calculation, MIDI CC-to-BPM mapping, `reset()` semantics, and all MIDI event dispatch. Zero dedicated test coverage remains.

No indirect coverage exists — other test files only use `appState` as a mock dependency, not exercising its public API.

## Fix
1. Restore from git: `git show e627b9f~1:akvj/test/AppState.test.js > akvj/test/AppState.test.js`
2. Run `npm run test` and fix assertions that no longer match current API
3. Keep tests that are still relevant; don't restore truly redundant ones
4. If Task 46 (AppState singleton refactor) lands first, adapt tests accordingly

## Verification
- Run `npm run test -w akvj` to ensure all tests pass (including restored ones)
- Run `npm run lint` to ensure no lint errors
- Verify BPM clamping, CC filtering, reset semantics, and bpmSource transitions are tested

## Key Files
- `akvj/test/AppState.test.js` — restore from git
- `akvj/src/js/core/AppState.js` — the module being tested

## Dependencies
- Related to Task 46 (AppState singleton refactor) — both should land together
- Found by QA Reviewer during codebase audit
