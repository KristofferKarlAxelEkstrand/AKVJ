---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 516 — LayerGroup treats `triggerGroup: 0` as no trigger group

(Renumbered from a duplicate ID 513 collision at report time — original bug report and
implementation are unaffected, only the task ID changed.)

From: `[BUG]-layergroup-triggergroup-zero-falsy.md` (overseer).

## Bug

`akvj/src/js/visuals/LayerGroup.js:104,275,293` all gate on clip truthiness:

```js
if (clip.triggerGroup) { ... }        // line 104, noteOn choke-check
if (!clip.triggerGroup) { return; }   // line 275, #addToTriggerGroup
if (!clip.triggerGroup) { return; }   // line 293, #removeFromTriggerGroup
```

`triggerGroup` is validated as `string | number | null` (`mainframe/scripts/clips/lib/validate/meta.js:73`) — `0` is a legal numeric group id. A clip authored with `triggerGroup: 0` never chokes/stops other clips in group `0`, never gets added to or cleaned from `#triggerGroups`. Choke-group feature silently no-ops for group id `0`, no error or warning.

## Fix

Use `clip.triggerGroup != null` (or explicit `!== undefined && !== null`) at all three sites instead of truthiness.

## Test gap

`akvj/test/LayerGroup.test.js` only covers string trigger-group values (`'bg'`, `'fg'`); add a case with `triggerGroup: 0`.

## Verify

`npm run lint`, `npm run test`.

Scope: **akvj-developer**.
