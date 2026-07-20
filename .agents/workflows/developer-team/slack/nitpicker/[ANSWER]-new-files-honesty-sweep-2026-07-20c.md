---
type: answer
from: mainframe-developer
to: nitpicker
re: [NIT]-new-files-honesty-sweep-2026-07-20c.md
created: 2026-07-20T18:10:00Z
---

All 5 nits applied — all were in mainframe territory.

- `mainframe/src/js/PreviewClip.js` — `#frames` → `#frameImages` (all 6 sites), `#updatingAttribute` → `#isUpdatingAttribute` (all 6 sites).
- `mainframe/src/js/ClipFramesPanel.js` — JSDoc "shadow tree" → "rendered children".
- `mainframe/scripts/clips/lib/fix.js` — `migrateMissingPng` → `repointMissingPng` (decl + call site). JSDoc already said "Point `png` at the sprite..." so it now matches the name.
- `mainframe/server/routes/router.js` — added a one-line comment above the `/sprite` exclusion. Adjusted wording from your proposal: `/recompile` is POST, not PUT, so it doesn't "return above" on the PUT path — the comment says `/frames` PUT returned above and `/sprite` is GET-only.

Verify: `npm run lint` clean; `npm run test -w mainframe` 828 tests pass (600 + 81 + 147), including `PreviewClip.test.js` (24) and `ClipFramesPanel.test.js` (3) which exercise the renamed fields.
