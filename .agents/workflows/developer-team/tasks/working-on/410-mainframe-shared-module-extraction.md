---
status: in-progress
assignee: mainframe-developer
priority: medium
---

# 410 — Mainframe layering: shared module extraction

Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (task S6).

The CLI (`mainframe/scripts/clips/`) and the server (`mainframe/server/`) each reach into the
other's tree for shared logic. Move the shared pieces into `mainframe/shared/`, which both already
import from.

1. `mappingService.js` — move out of `mainframe/server/` into `mainframe/shared/`, same filename
2. `spritesheet-core.js` — move out of `mainframe/scripts/clips/lib/` into `mainframe/shared/`,
   renamed to `spritesheetCore.js` (camelCase — it is not a class module, per the AGENTS.md
   file-naming rule)
3. Update imports in every caller, CLI and server alike.
4. Extract `resolveCompileOptions(meta, overrides)` in the spritesheet code — the same block is
   written out three times.

## Constraints

- No akvj ↔ mainframe imports. The bridge between realms stays JSON-only.
- Pure move + dedupe. No behaviour change to clip compilation or mapping writes.
- Move test files alongside their subjects and fix their import paths.

## Verify

- `npm run clips` succeeds end to end (validate, optimize, generate, copy)
- `npm run lint && npm run test -w mainframe && npm run test`
- `grep -rn "scripts/clips/lib/spritesheet-core\|server/mappingService" mainframe/` returns nothing
