---
title: Task source: [TEST]-mainframe-clipeditor-trigger-fields
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[TEST]-mainframe-clipeditor-trigger-fields.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: test
from: test-marshal
created: 2026-07-29T20:20:03Z
---

# ClipEditorController: trigger / retrigger DOM ↔ save untested

## Area

`mainframe/src/js/ClipEditorController.js` + fixture in `mainframe/test/ClipEditorController.test.js`

## Gap

`editorMeta.js` and server/API already cover `retrigger` / `triggerType` / `triggerGroup`. The **controller wiring does not**:

- Hydrate writes them (`#applyEditorValuesToDom` ~870–880)
- Every save reads them (`#readExtendedEditorFields` → create POST / meta PUT / frames PUT)

Unit tests never set non-default values or assert request bodies include them. Fixture only has `<option value="momentary">` (no latch / one-shot), so latch hydrate cannot even be exercised without expanding options.

## Checklist (unit, jsdom)

1. **Hydrate** meta `{ retrigger: false, triggerType: 'latch', triggerGroup: 'masks' }` → checkbox unchecked, select `latch`, group input `masks`.
2. **Meta-only PUT** after hydrate: change group / uncheck retrigger / set one-shot → body has matching `retrigger`, `triggerType`, `triggerGroup` (and `null` when group cleared, matching `metaPatchFromEditor`).
3. **Create POST** with non-default extended fields → POST body / optional meta carries the same three fields (not only name/size).
4. **Fixture:** add latch + one-shot options on `#clip-editor-trigger-type` (and playback options if needed for other hydrate cases).

## Tier

Unit — `npm run test -w mainframe -- test/ClipEditorController.test.js` (or full mainframe suite).

## Out of scope

- Pure `editorMeta` / `optionalMetaFromEditor` (already tested)
- Server spritesheet/meta PUT (already tested with latch/masks)
- Task **500** dead UI (`#clip-editor-frame-duration-beats` still in fixture — product remove, not this ticket)
- Open task **503** PianoRoll keyboard/batch

## Scope

**mainframe-developer**
