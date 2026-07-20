---
status: backlog
assignee: none
priority: medium
---

# Task 340: AKVJ MaskManager/Midi settings injection

## Source

Human review `mail/in/[REVIEW]-akvj-src-2026-07-20.md` finding 5

## Description

`akvj/src/js/visuals/MaskManager.js:32` and `akvj/src/js/midi-input/Midi.js` read the global `settings` / `appState` at class field initialization time. `Renderer` and `AppState` already accept injection, but the test helper `akvj/test/utils/withSettings.js` cannot override mixer channel or MIDI limits because the singleton is captured too early.

Refactor `MaskManager` and `Midi` to accept `settings` and `appState` via constructor parameters (with sensible defaults), and update call sites/tests to pass them in.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
- `withSettings.js` can override mixer channel and MIDI limits in tests
