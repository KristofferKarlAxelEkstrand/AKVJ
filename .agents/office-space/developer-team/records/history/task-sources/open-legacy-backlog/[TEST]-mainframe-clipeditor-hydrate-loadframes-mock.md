---
title: Task source: [TEST]-mainframe-clipeditor-hydrate-loadframes-mock
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[TEST]-mainframe-clipeditor-hydrate-loadframes-mock.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: test
from: test-marshal
created: 2026-07-29T21:07:32Z
---

# Mock audit: hydrate success never asserts loadFrames payload

## Special mission

Mock audit — tests that mock real logic they should prove.

## Where

`mainframe/test/ClipEditorController.test.js`

- Default fixture (`mockClipFrames: true`) replaces `clip-frames` methods with stubs: `loadFrames`, `getDurationsMs` → `[]`, `getBakeConfigs` → `[]`.
- Hydrate success test (~629–666) only asserts `expect(clipFrames.loadFrames).toHaveBeenCalled()` after API returns `durationsMs: [250, 750]` and two frames.

## Hidden gap

`ClipEditorController.hydrate` builds `#stagedDurationsMs` from the frames API, then `updateClipFrames` → `clipFrames.loadFrames([{ src, durationMs, bakeConfig }, …])`.

With the stub, a regression that drops durations, wrong length, or skips `loadFrames` args still passes as long as the mock is invoked once. Real `ClipFrames.loadFrames` is covered elsewhere; **controller payload construction on hydrate is not**.

## Cases to add (unit)

1. After hydrate with `frames: [a,b]`, `durationsMs: [250, 750]` — assert `loadFrames` call arg[0]:
   - length 2
   - `durationMs` `[250, 750]`
   - each entry has `src` string and default `bakeConfig.scaleMode` (`fit` / session default)
2. Prefer `mockClipFrames: false` for this case (see global-duration test ~206) **or** assert mock.calls deeply — not bare `toHaveBeenCalled()`.
3. Optional: one create/meta PUT with real clip-frames (or non-empty `getBakeConfigs` mock) so `frameBakeConfigs` is not always stubbed to `[]`.

## Tier

Unit — `npm run test -w mainframe -- test/ClipEditorController.test.js`

## Out of scope

- **506** trigger/retrigger form fields (separate)
- ClipFrames unit suite (already covers strip UI)
- Product **500** dead UI removal

## Scope

**mainframe-developer**
