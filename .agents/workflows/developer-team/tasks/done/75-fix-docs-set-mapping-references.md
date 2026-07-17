# Task 75: Fix Docs Referencing set-mapping.json (Should Be key-map.json)

## Severity: Medium (Documentation)

## Location
- `AGENTS.md` (lines 107, 142, 148, 228)
- `README.md` (lines 88, 97, 106, 111, 202, 203, 238, 283, 308)
- `CONTRIBUTING.md` (line 154)
- `docs/how-to-program-midi.md` (lines 40, 183, 190, 311)

## Problem
Task 29 renamed `set-mapping.json` to `key-map.json` in code but missed updating docs. 4 files have 18 stale references total. Since `AGENTS.md` is loaded as authoritative context for every AI agent, the wrong filename propagates.

## Fix
Search-and-replace `set-mapping.json` → `key-map.json` (and any `set-mapping` prose) across all 4 files. Then grep to confirm nothing else was missed.

## Verification
- `grep -rln "set-mapping" --include="*.md" . | grep -vE "node_modules|\.cache|dist|src/public|tasks/done|inbox/read"` should return empty

## Dependencies
- None. Pure documentation fix.
- Found by QA Reviewer
