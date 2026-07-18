---
status: done
assignee: mainframe-developer
priority: low
---

# Task 139: Clip Timing & Sync — Slice 4: Polish (Docs, Shared Constants Cleanup)

## Depends On
Tasks 136, 137, 138 — **all done and approved**. Also fold in Task 148 (fixed a real gap:
`sync: 'beat'` with missing `syncLength` wasn't validated — now is,
`mainframe/scripts/clips/lib/validate/meta.js:144-145`) and Task 138's actual shape:
`mainframe/shared/mappingLeaf.js` (new — parse/serialize/validate mapping-slot overrides for
both `triggerType`/`triggerGroup` and the new sync fields; retroactively fixed the
previously-unvalidated object-leaf case too). AGENTS.md's mapping section may need a note
about object-leaf overrides existing now, not just clipId strings.

## Source
Spec: `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md` (§ Suggested
slicing #4)

## Goal
- Confirm the DJ-style preset constants (Task 136) are the single source both editor (137)
  and any docs reference — no drift between the shared list and what the UI actually offers.
- Confirm/document the `settings.bpm.default` (120) no-clock/no-CC fallback behavior
  explicitly in `clip-schema.md` (was already true, per Task 136's decision #4 — just needs
  writing down now that sync is a real authored feature, not just an engine detail).
- Update `AGENTS.md` clip metadata field table with `sync` / `syncLength` / `syncBeats` /
  `beatsPerBar`.
- Review whether the three slices ended up naming things consistently (e.g. did the mainframe
  mirror in 137 drift from the akvj original in 136?) and reconcile if so.

## Files
- `.agents/workflows/developer-team/spec/clip-schema.md`
- `AGENTS.md` (Clip Metadata table)
- Whatever files 136–138 touched (reconciliation pass only, not new features)
