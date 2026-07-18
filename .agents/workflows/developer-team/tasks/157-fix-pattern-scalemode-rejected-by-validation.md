---
status: backlog
assignee: none
priority: high
---

# Task 157: Fix `validate/meta.js` Rejecting `scaleMode: "pattern"` (Breaks Already-Shipped Feature)

## Source
Epic: `.agents/workflows/developer-team/epics/refactor-for-greateness-2.md` §B3 (part of
"Finish the P0 clip-format items from Wave 1"). Team Lead independently verified this is a
real, currently-broken bug, not just a style nitpick.

## Urgency
**High** — confirmed via direct code inspection: `mainframe/scripts/clips/lib/validate/meta.js`
lines 69-72 hardcode:
```js
const validScaleModes = ['fit', 'cover', 'stretch', 'none'];
```
`'pattern'` is missing. Task 142 (approved, shipped) added `pattern` as a real `scaleMode`
value — `mainframe/shared/frameFit.js`'s `SCALE_MODES` already includes it. This means any
clip authored with `scaleMode: "pattern"` **fails `npm run clips` validation today**, even
though the akvj engine fully supports rendering it. The pipeline directly contradicts the
engine it feeds.

## Fix
`validate/meta.js` should import `SCALE_MODES` from `mainframe/shared/frameFit.js` (or
`clipSchema.js`, wherever the canonical list lives post-Task-142) instead of hardcoding a
local `validScaleModes` array — same "one definition per concept" principle already applied
elsewhere in this codebase (`PLAYBACK_MODES`, `TRIGGER_TYPES`, `VALID_BIT_DEPTHS` are all
imported from shared, not redeclared).

## Suggested Tests
- `validate-extended.test.js` (or wherever scaleMode validation is tested): a clip with
  `scaleMode: "pattern"` passes validation. Also assert an actually-invalid scaleMode still
  fails, so the import didn't silently loosen validation.

## Files
- `mainframe/scripts/clips/lib/validate/meta.js`
