# Team Update: New Epic — Clip Library Panel on the Mapping Page

## Summary
A new epic is ready for triage/breakdown: `.agents/workflows/developer-team/epics/mapping.md` ("Feature: Clip Library Panel on the Mapping Page").

## Impact
Adds a draggable clip library list to the Mapping page (mounted next to the mapping table, above the sticky keybed dock) so clips can be dragged straight onto keys from that page — closing a real gap where the only clip list in the app lives on the separate Library tab. Also adds one small new keybed interaction: double-click a velocity region to remove it (additive to the existing right-click removal, reuses the same `#removeRegion()` path in `PianoKey.js`).

Everything else referenced (velocity regions, breakpoint handles, auto-redistribution, no-overlap guarantee, sticky-bottom keybed, channel selector) is already shipped from the `keybed-for-mapping` epic — this epic is scoped to page composition plus the double-click addition, not new drag-and-drop engineering.

## Action Needed
Team Lead: review `.agents/workflows/developer-team/epics/mapping.md` and break it into tasks per the 4 phases already outlined there:
1. Mount `<akvj-clip-list>` on the Mapping panel
2. Trim redundant clip-action buttons for that context
3. Double-click-to-remove on velocity regions (`PianoKey.js`)
4. Manual verification

Three open questions are called out in the epic (action-button visibility, per-channel clip filtering, independent filter state per list instance) — resolve or assign before/while scoping tasks.

## Notes
Epic: `.agents/workflows/developer-team/epics/mapping.md`
Related prior work: `.agents/workflows/developer-team/epics/keybed-for-mapping.md` (Done, 2026-07-18) and its spec `.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`.
