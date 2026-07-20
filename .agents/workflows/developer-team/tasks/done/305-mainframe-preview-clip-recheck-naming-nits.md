---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 305: Mainframe PreviewClip re-check naming/semantics nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/[NIT]-mainframe-preview-clip-recheck-naming-sweep-2026-07-19.md`

## Description

Apply three naming/semantics cleanups to `mainframe/src/js/PreviewClip.js` so the custom element's private API reads consistently and does not shadow built-in `Element` methods.

## Findings and actions

### 1. Private helpers shadow built-in `Element` methods

**File:** `mainframe/src/js/PreviewClip.js` (lines 452–459, 461–473)

**Current:**
- `#setAttribute(name, value)`
- `#toggleAttribute(name, shouldExist)`

**Proposed:**
- `#setAttributeIfChanged(name, value)`
- `#toggleAttributeIfChanged(name, shouldExist)`

**Rationale:** The helpers only write when the value differs (`if (this.getAttribute(name) === value) return;`). Naming them `IfChanged` makes the guard explicit and avoids conflating them with `Element.prototype.setAttribute` / `Element.prototype.toggleAttribute`.

### 2. `#getFrameInterval()` returns milliseconds but omits unit suffix

**File:** `mainframe/src/js/PreviewClip.js` (lines 297–299)

**Current:** `#getFrameInterval()`

**Proposed:** `#getFrameIntervalMs()`

**Rationale:** The method returns `(this.#durationsMs[this.#currentFrame] ?? FALLBACK_MS) / this.#speed`, a millisecond duration. The codebase is moving toward unit-honest names (`durationsMs`, `elapsedMs`, `FALLBACK_MS`), and `Ms` makes the unit obvious at call sites such as `elapsedMs >= this.#getFrameIntervalMs()`.

### 3. Boolean state field `#loading` is inconsistent with `#isPlaying`

**File:** `mainframe/src/js/PreviewClip.js` (lines 34, 235, 238, 269)

**Current:** `#loading`

**Proposed:** `#isLoading`

**Rationale:** The class already uses the `is` prefix for booleans (`#isPlaying`, `#updatingAttribute`). Renaming `#loading` to `#isLoading` keeps boolean guards consistent (e.g. `if (!this.#clipId || this.#isLoading)`).

## Affected files

- `mainframe/src/js/PreviewClip.js`
- `mainframe/test/PreviewClip.test.js` (if it references the renamed private helpers via spy or test name)

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npm run build -w mainframe` passes.
4. No runtime behavior changes.

## Notes

- These are naming/semantics-only changes; do not alter playback timing or public behavior.
