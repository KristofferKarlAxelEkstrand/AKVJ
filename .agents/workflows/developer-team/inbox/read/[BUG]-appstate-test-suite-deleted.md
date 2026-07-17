# [BUG] AppState Unit Test Suite Was Deleted With No Replacement

## Issue Description
Commit `e627b9f` ("refactor: remove AppState test suite to streamline testing structure") deleted `akvj/test/AppState.test.js` outright — 195 lines removed, 0 lines added anywhere else. Despite the commit message calling it a "refactor," there is no restructuring: the dedicated unit test suite for `akvj/src/js/core/AppState.js` (329 lines) is simply gone, and nothing replaced it.

`AppState` is the central `EventTarget`-based state bus for the whole app (per `AGENTS.md`: "Event-based State Management (EventTarget)"). It owns BPM calculation/clamping from MIDI clock pulses, MIDI CC-to-BPM mapping, `reset()` semantics, and dispatch of every MIDI event (note on/off, start/stop/continue, clock, CC) that the rest of the app subscribes to.

Verified there is no indirect coverage:
- `grep -rl "appState\|AppState" akvj/test/**/*.js` only turns up files that *use* the `appState` singleton as a dependency/mock (`AdventureKidVideoJockey.test.js`, `Clip.test.js`, `DebugOverlay.test.js`, `Renderer.strobe.test.js`, `midi.test.js`) — none of them exercise `AppState`'s own public API (BPM clamping, `dispatchMIDIControlChange` channel/CC filtering, `reset()` not re-dispatching events, `bpmSource` transitions, etc.).
- `npm run test` currently passes fully (301/301) — the regression is silent because CI doesn't fail, it just quietly stopped checking this module.

This is a real risk: a future change to BPM clamping, clock-derived BPM math, or the CC→BPM filter logic could silently break with no test catching it.

## How to Fix
Restore the deleted suite from git history and adapt it to the current `AppState.js` API (double-check method/property names haven't drifted since the delete, e.g. via Task 46's singleton-isolation work if that lands first):

```bash
git show e627b9f~1:akvj/test/AppState.test.js > akvj/test/AppState.test.js
```

Then run `npm run test` and fix any assertions that no longer match current `AppState.js` behavior. If there was a genuine reason to remove specific tests (flakiness, duplication with another suite), keep the rest — don't restore tests that are truly redundant, but the full-file deletion here removed 100% of dedicated coverage, which is not justified by "streamlining."

## Related
- Distinct from Task 46 (`refactor-appstate-singleton.md`), which is about `reset()` not removing listeners / singleton testing isolation — that's an architecture issue in the source, not a missing-test-file issue. Both should probably land together since Task 46 will change what the restored tests need to assert.
