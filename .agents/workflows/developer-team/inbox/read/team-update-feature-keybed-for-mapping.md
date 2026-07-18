# Team Update: Keybed for Mapping feature spec ready

## Summary

A new product spec for evolving the piano roll into a full **velocity mapping editor** is now in the repo:

`.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`

It replaces the current display-only velocity bands with draggable rectangular regions per key (bottom = velocity 0, top = velocity 127), drag-and-drop clip assignment from the clip list, draggable breakpoint handles between regions, right-click removal, and a rename of the `category` mode to `select`. The piano roll also becomes `position: sticky` to the **bottom** of the viewport (not top) so it stays reachable as a drop target while clip lists/mapping tables scroll above it.

## Impact

Mainframe: `PianoRoll.js`, `PianoKey.js`, `<akvj-clip-list>` (needs `draggable` entries), and the styling for `.piano-roll`. New events: `mappingadd`, `mappingchange`, `mappingremove` — all carry the full redistributed `mappings` list for the affected key/channel, not just the single triggering entry (existing precedent from `keyclick`/`noteon`/`noteoff`).

## Action Needed

- **Team Lead:** read the spec and split it into tasks. The doc already proposes four phases, in dependency order:
  1. Rename `category` → `select` (mode, files, tests)
  2. Velocity regions + draggable breakpoint handles + right-click removal (`mappingchange`, `mappingremove`)
  3. Drag-and-drop from clip list + auto-breakpoint distribution (`mappingadd`)
  4. Bottom-sticky positioning (CSS only)
  Do not treat it as one monolithic PR — each phase is independently shippable.
- **Mainframe Developer:** wait for tasked slices; treat the spec as the source of truth, including the "Decisions" section (no cap on clips per key, color-swatch-first preview, Y-position as both velocity and stack-insertion hint, right-click removal).

## Notes

- Spec path: `.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`
- All four "Open Questions" from the original draft are resolved and folded into the doc's "Decisions" section — nothing left open.
- Out of scope in this spec: thumbnail-as-region-background (deferred iteration on top of the color-swatch baseline), hover-× / drag-out removal (deferred in favor of right-click for now).
