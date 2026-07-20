# field-tester-log

## Digest

One line per past finding — read this in full before a sweep.

- (nothing compacted yet)
- Area: `e2e,lint,clips,agents`
- Area: `test,build,clips`
- Area: `lint,agents,clips`

## Recent

- Area: `e2e,visual`

- Area: `clips,mainframe`

- Area: `lint,agents,akvj`

- Area: `build,e2e,clips`

- Area: `lint,agents,visual`

- Area: `test:all`

- Area: `e2e,mainframe`

- Refs: 387

- Area: `lint,agents,e2e`

- Area: `visual,mainframe`

- Refs: 366

### 2026-07-20 16:59 — Swept lint + test:all + agents:check. lint clean, agents:check clean (107 refs, 9 specs, 5 msgs). akvj 567/567 green. mainframe unit suite failed twice with DIFFERENT tests (clipFramesBody 'converts frameDurationsMs', then server.test 'updates metadata fields'), both passed in isolation, third full run 48/48 green with a different test count (583 vs 585). Cause: mainframe-developer was mid-edit on task 402 — clipFramesBody.test.js/server.test.js and their sources all mtime-changed inside my run window. Torn-tree artifact, NOT a defect. Filed nothing. Lesson: check mtimes before believing a mainframe failure while 402-class work is in flight.

- Area: `mainframe,test:all,lint,agents`
