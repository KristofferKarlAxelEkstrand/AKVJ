---
status: done
assignee: none
priority: medium
---

# Task 201: Projects Index Cached Forever — Stale MIDI Project Switch

## Source
`.agents/workflows/developer-team/inbox/read/[BUG]-project-index-cached-forever-stale-midi-switch.md`
(Overseer / bug hunt)

## Priority
Medium — MIDI channel 14 project switch. Breaks after projects list changes while AKVJ stays open.

## Problem
`AdventureKidVideoJockey.#resolveProjectIdFromNote` fetches `#projectIndex` once when empty and
reuses it for the element lifetime. Create/rename/reorder/delete in Mainframe leaves note→project
mapping stale until full page reload.

## Fix (prefer simplest)
1. **Refetch every resolve** (tiny JSON; Dev cache-busts via `?t=`) — preferred.
2. Or refetch at start of each `#handleProjectSwitch` / `#switchProject`.
3. Avoid complex invalidate-on-focus unless (1)/(2) prove insufficient.

## Tests
First resolve caches project A; mutate fetch mock to return `[A,B]`; second resolve note `1`
must return B (today returns null).

## Files
- `akvj/src/js/core/AdventureKidVideoJockey.js` — `#projectIndex`, `#resolveProjectIdFromNote`
- `akvj/test/AdventureKidVideoJockey.test.js` (and any Task 168 “fetches+caches” assertions to update)

## Related
- Task 194: stale *activation* on switch (done). This ticket is stale *routing*.
- Sequence after Task 200 (high MIDI Start phase) if both are open.

## Verification
`npm run lint && npm run test && npm run build`
