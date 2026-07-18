# [NIT] PianoKey.js + PianoRoll.js — Naming & Pattern Sweep

**Date:** 2026-07-18  
**Swept by:** The Nitpicker  
**Area:** `mainframe/src/js/` — new files `PianoKey.js`, `PianoRoll.js`

---

## Nits (naming/pattern, my lane)

### 1. PianoKey.js — Inconsistent bound-handler pattern within the same class

- **File:** `mainframe/src/js/PianoKey.js`
- **What:** `#boundPointerUp` (line 193) and `#boundContextMenu` (line 208) are assigned as arrow functions inside `connectedCallback`. `#boundPointerMove` (line 104) and `#boundPointerUpDrag` (line 105) are bound at class-field definition with `.bind(this)`.
- **Why confusing:** Two different caching patterns for the same convention (`#bound*` handlers) in one class. A newcomer has to mentally switch between "arrow assigned in lifecycle" and "bind at field init" for no semantic reason.
- **Suggested fix:** Pick one pattern. The class-field `.bind(this)` approach (as used by `#boundPointerMove`/`#boundPointerUpDrag`) is the more common convention in this codebase. Convert `#boundPointerUp` and `#boundContextMenu` to named methods bound at field definition, matching the other two.

---

## Out-of-lane (for Overseer)

### 2. PianoKey.js — `keydown` listener not cached, leaks on disconnect

- **File:** `mainframe/src/js/PianoKey.js`, line 219
- **What:** The `keydown` event listener in `connectedCallback` is an anonymous arrow function:
  ```js
  this.addEventListener('keydown', event => { ... });
  ```
  There is no corresponding `removeEventListener` in `disconnectedCallback`. The `pointerup` and `contextmenu` listeners are properly cached (`#boundPointerUp`, `#boundContextMenu`) and removed on disconnect.
- **Why it matters:** Event listener leak on disconnect — the anonymous handler can't be removed. This is a bug, not a naming nit, so handing to Overseer.

---

## Celebrations

- **`keyclickrequest` / `mappingchangerequest` / `mappingremoverequest` → `keyclick` / `mappingchange` / `mappingremove`** — The `*request` suffix on PianoKey events vs. the clean final event names on PianoRoll is a beautiful semantic distinction. A newcomer can immediately see "this is a request from the leaf" vs. "this is the committed event from the parent." Chef's kiss.
- **`buildVelocityBands` / `redistributeVelocities`** — crystal-clear function names that tell you exactly what they do. No comments needed.
- **`MIN_REGION_LABEL_HEIGHT_PX`** — unit in the name! Every constant should be this honest.
