---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 188: PianoKey.js Naming Consistency + Keydown Listener Leak Fix

## Source
`.agents/workflows/developer-team/inbox/[NIT]-piano-key-roll-naming-sweep-2026-07-18.md`
(Nitpicker — naming/pattern sweep on PianoKey.js + PianoRoll.js).

## Scope

### 1. Inconsistent bound-handler pattern (NIT)
**File:** `mainframe/src/js/PianoKey.js`

`#boundPointerUp` (line 193) and `#boundContextMenu` (line 208) are assigned as arrow functions inside `connectedCallback`. `#boundPointerMove` (line 104) and `#boundPointerUpDrag` (line 105) are bound at class-field definition with `.bind(this)`.

**Fix:** Convert `#boundPointerUp` and `#boundContextMenu` to named methods bound at field definition with `.bind(this)`, matching the other two. Pick one pattern per class.

### 2. Keydown listener leak (BUG)
**File:** `mainframe/src/js/PianoKey.js`, line 219

The `keydown` event listener in `connectedCallback` is an anonymous arrow function with no corresponding `removeEventListener` in `disconnectedCallback`. The `pointerup` and `contextmenu` listeners are properly cached and removed.

**Fix:** Cache the keydown handler as `#boundKeyDown` (bound at field definition), add `removeEventListener` in `disconnectedCallback`.

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/src/js/PianoKey.js`
- `mainframe/test/PianoRoll.test.js` (if keydown tests exist)
