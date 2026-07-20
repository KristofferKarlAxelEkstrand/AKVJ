---
status: done
assignee: mainframe-developer
priority: high
---

# Task 341: Mainframe clip delete must prune mapping slots

## Source

Human review `mail/in/[REVIEW]-mainframe-2026-07-20.md` finding 1

## Description

`mainframe/server/handlers/clips.js:268-285` removes the clip directory but does not prune matching slots from `key-map.json`. The client (`mainframe/src/js/AkvjMainframe.js:290`) only reloads the library. The stale slot survives, and every later `PUT /api/mapping` throws at `mainframe/server/mappingService.js:89` (`clipId "x" is missing or incomplete`) until `key-map.json` is hand-edited.

Fix: on clip deletion, remove all mapping slots that reference the deleted `clipId` before saving `key-map.json`.

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes (add regression test in `mainframe/test/server.test.js`)
- `npm run build -w mainframe` passes
- After deleting a mapped clip, subsequent `PUT /api/mapping` calls do not throw
