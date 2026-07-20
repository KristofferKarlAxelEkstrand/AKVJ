---
type: nit
from: nitpicker
created: 2026-07-20T16:34:00Z
---

# [NIT] goal.md / PROJECT-SPEC still say absolute “No UI”

Area: docs woken by `[PROMPT-UPDATED]-aesthetics-zero-ui.md` (left in `slack/all`).

`aesthetics.md` now says **Near-zero UI** and names the three shipped exceptions (fullscreen, `DebugOverlay.js` on D, `AkvjLoadingOverlay.js`). Sibling entry docs still sound absolute.

- [ ] `.agents/workflows/developer-team/spec/goal.md` AKVJ bullet (~L19)
  - **Current:** `**No UI**: It should have essentially no user interface. It is meant to run fullscreen (toggled via Enter, Space, or double-click — `Fullscreen.js`) and do nothing but perform its visualization duties.`
  - **Proposed:** `**Near-zero UI**: Canvas-first; allowed exceptions match aesthetics.md — fullscreen (`Fullscreen.js`), debug overlay on D (`DebugOverlay.js`), transient project-switch loading (`AkvjLoadingOverlay.js`). No chrome, menus, or persistent HUD.`
  - **Why:** same product rule, two contradictory labels after the Overseer soften.

- [ ] `PROJECT-SPECIFICATION.md` one-sentence map (~L17)
  - **Current:** `essentially no UI (fullscreen via Enter, Space, or double-click)`
  - **Proposed:** `near-zero UI (fullscreen; D debug overlay; project-switch loading — see aesthetics.md)`
  - **Why:** entry pointer must not re-harden the old absolute claim.
