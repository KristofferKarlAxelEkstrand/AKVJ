---
status: in-progress
assignee: mainframe-developer
priority: medium
---

# 412 — Clip format: validation honesty and single-source defaults

Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (task S7).

Same constants are declared in several places and validation quietly rewrites author files. Both
erode the "clip JSON is hand-editable" guarantee the epic calls sacred.

1. **Validation becomes report-only.** Remove the silent `meta.png` rewrites from
   `mainframe/scripts/clips/lib/validate/`. Migration moves to an explicit `--fix` CLI step that
   says what it changed. A validate run must never modify a source file.
2. Align the `framesPerRow` default — CLI uses 8, the server uses 16. Pick one, put it in
   `mainframe/shared/`, import it in both. Say which you picked and why.
3. `mainframe/src/js/editorMeta.js` — import `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT`,
   `DEFAULT_PLAYBACK`, `BIT_DEPTHS` from the shared schema instead of re-declaring them.
4. Consolidate the scale-mode lists — `mainframe/scripts/clips/lib/validate/meta.js` and
   `mainframe/shared/frameFit.js` have
   diverged, one rejects `'pattern'`. `'pattern'` is a documented mode in AGENTS.md, so the
   validator is the one that is wrong. Single source in `shared/`.
5. One `slugifyPathSegment` in `mainframe/shared/`, replacing the CLI and server variants. Check
   they actually behave identically before merging them — if they differ, say so rather than
   picking one silently.

## Verify

- Round-trip test: a hand-written `meta.json` survives save/migrate byte-for-byte identical.
- `npm run clips` end to end; the `--fix` path exercised at least once.
- `npm run lint && npm run test -w mainframe && npm run test`
- No behaviour change to what a valid clip renders as.
