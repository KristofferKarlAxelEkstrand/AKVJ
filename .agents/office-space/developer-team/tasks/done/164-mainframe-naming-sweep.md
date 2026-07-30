---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 164: mainframe `src/js/` + `server/` Naming & Semantics Sweep (10 items)

## Source
- `.agents/workflows/developer-team/inbox/read/[NIT]-mainframe-js-naming-sweep-2025-07-18.md` (items 1-9)
- `.agents/workflows/developer-team/inbox/read/[NIT]-mainframe-server-sweep-2025-07-18.md` (item 10)
(Nitpicker — read the originals for full rationale per item).

Mirrors the same recurring patterns already filed for `akvj/` in Task 158 (timestamp-not-time,
vague `#clips`, vague `#items`/`#enqueue`) plus three mainframe-specific file↔class mismatches
and one "banned vague term" hit. This is mainframe-only — do not touch `akvj/` files (that's
Task 158's scope).

## Scope

1. `StagingPreview.js`: `#lastFrameTime` → `#lastFrameTimestamp` (line 18; refs in
   `#setPlaying`, `#animate`) — stores a `requestAnimationFrame` timestamp, not a duration.
2. `mainframeState.js`: `#clips` → `#loadedClips` (line 25; setter/getter, `reset()`) — vague
   next to filtered/active-clip concepts elsewhere in the codebase.
3. `ClipList.js`: `#clips` → `#loadedClips` (line 17; setter/getter, `#render`, `#filterClips`,
   `#groupByCategory`) — same pattern as item 2, holds the pre-filter catalog.
4. `ClipFrames.js`: `#frameData` → `#frameEntries` (line 15; refs in `loadFrames`,
   `getFrameOrder`, `getDurations`, `getCompositions`, `setAllDurations`, `setAllCompositions`,
   `removeFrameAt`, `clearAll`, `#render`, `#reorderFrames`) — "data" is a banned vague term;
   holds `{src, duration, composition, originalIndex}` entry objects.
5. `StagingPreview.js`: class `AkvjStagingPreview` → `StagingPreview` (line 15, custom element
   `akvj-staging-preview` stays as-is — only the **class name** changes, dropping the `Akvj`
   prefix to match file name and the majority of mainframe classes, e.g. `PianoRoll`,
   `ClipFrame`).
6. `ClipList.js`: class `AkvjClipList` → `ClipList` (line 15, same file↔class fix as item 5;
   custom element tag `akvj-clip-list` stays as-is).
7. `MappingTable.js`: class `AkvjMappingTable` → `MappingTable` (line 10, same fix; custom
   element tag `akvj-mapping-table` stays as-is).
8. `mainframe/src/js/UserMessages.js`: `#items` → `#messages` (line 15; refs in `#enqueue`,
   `#dismiss`, `#renderShell`, `#renderStack`, `#handleKeydown`, `#handleFocusIn`,
   `disconnectedCallback`) — same nit as the akvj-side `UserMessages.js` (Task 158 item 13),
   but this is the **separate mainframe file** of the same name.
9. `mainframe/src/js/UserMessages.js`: `#enqueue` → `#pushMessage` (line 52) — same
   FIFO-name/LIFO-behavior mismatch as the akvj-side nit (Task 158 item 12); `#items.unshift()`
   is a stack push, not a queue enqueue.
10. `mainframe/server/spritesheet.js`: `frames` param → `frameCount` in `writeClipFiles`
    (line 243), `overwriteClipFiles` (line 264), `buildClipMeta` (line 280) — in these three
    functions `frames` is a **number** (call sites pass `resizedBuffers.length`), but `frames`
    means an array of frame buffers everywhere else in this file and codebase. Rename the
    parameter in each signature and its uses within the function body.

**Note on items 5-7:** these rename the exported **class**, not the file or the custom-element
tag string (`code-standards.md`'s tag-prefix rule from Task 154 governs the tag; this nit is
purely about the JS class identifier matching its file). Grep for each class name across
`mainframe/src/` and `mainframe/test/` — these are exported classes, likely referenced in test
imports (`import { AkvjStagingPreview } from ...` etc.), not just local file scope.

## Constraints
- Pure rename — no behavior/logic changes.
- mainframe-only. Do not touch any `akvj/` file (items 8-9 have akvj-side counterparts already
  covered by Task 158 — don't duplicate that work here).

## Suggested Verification
- `npm run lint`
- `npm run test -w mainframe`
- `npm run build -w mainframe`

## Files
- `mainframe/src/js/StagingPreview.js`
- `mainframe/src/js/mainframeState.js`
- `mainframe/src/js/ClipList.js`
- `mainframe/src/js/ClipFrames.js`
- `mainframe/src/js/MappingTable.js`
- `mainframe/src/js/UserMessages.js`
- `mainframe/server/spritesheet.js`
- `mainframe/test/` (update imports/references for renamed classes as needed)
