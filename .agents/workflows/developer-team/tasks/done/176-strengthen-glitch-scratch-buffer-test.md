---
status: done
assignee: akvj-developer
priority: low
---

# Task 176: Strengthen glitchEffect Scratch Buffer Test — Verify Buffer Actually Used

## Source
`.agents/workflows/developer-team/inbox/[TEST]-flake-glitch-scratch-buffer-vacuous.md`
(Test Marshal — flake hunt / trustworthiness).

## Problem
`akvj/test/effects.test.js` line 381 — "uses scratch buffer when provided and large enough" only asserts `not.toThrow()`. Doesn't verify the scratch buffer was actually used. If the optimization were removed, the test would still pass.

## Fix
Use option 2 from the ticket: after `glitchEffect.apply()`, verify the scratch buffer contains the original pixel values (copied by `.set()`):

```js
const scratch = new Uint8ClampedArray(BYTE_COUNT);
const originalPixels = new Uint8ClampedArray(img.data);
glitchEffect.apply(img, { velocity: 127 }, 0, { ...EFFECT_CONTEXT, scratchBuffer: scratch });
expect(scratch).toEqual(originalPixels);
```

Also add `expect(result).toBe(true)` and `expect(img.data).not.toEqual(originalPixels)` to confirm the effect ran and mutated pixels.

## Verification
- `npm run test -w akvj -- test/effects.test.js`
- `npm run lint`

## Files
- `akvj/test/effects.test.js`
