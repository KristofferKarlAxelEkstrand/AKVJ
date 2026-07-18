# Team Update: Can’t open a clip (possible bad data?)

## Summary
User report: opening a clip in the Mainframe clip editor is failing right now. It may be a real load/edit bug, or it may be bad / incomplete data in the specific clip being opened — unclear yet.

## Impact
Blocks verifying the edit-clip path (load frames from raw or sprite, hydrate settings). If it’s bad data only, other clips may still work; if it’s the loader, edit is broken more broadly.

## Action Needed
- Try opening a few known-good clips (e.g. library clips with clear `meta.json` + `sprite.png`) and compare with the failing one.
- If only one clip fails: inspect that clip’s `meta.json` / sprite / `.raw-assets` and note what’s off.
- If multiple clips fail: treat as a Mainframe edit-load bug and file/fix against the edit-clip load path (`GET /api/clips/:id/frames`, sprite split, UI hydrate).

## Notes
- Related spec: `.agents/workflows/developer-team/spec/feature-edit-clip.md`
- User is not sure yet — don’t assume root cause until checked against more than one clip
