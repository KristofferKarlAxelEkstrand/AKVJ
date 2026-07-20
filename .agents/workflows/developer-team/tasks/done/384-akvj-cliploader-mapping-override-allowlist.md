---
status: done
assignee: qa-reviewer
priority: high
---

# Task 384: ClipLoader — allowlist mapping overrides

## Source

Overseer `[BUG]-cliploader-mapping-override-allowlist.md`

## Description

Mainframe only allows `MAPPING_OVERRIDE_KEYS` (`triggerType`, `triggerGroup`, `sync`, `syncLength`, `syncBeats`, `beatsPerBar`). ClipLoader shallow-merges any leftover keys.

- [ ] `akvj/src/js/visuals/ClipLoader.js` — filter overrides to that allowlist (share/duplicate frozen list; no cross-package import). Drop unknowns (DEV log ok)
- [ ] Unit test: unknown keys do not reach `normalizeClipMetadata` / Clip

Task **383** is test-only cleanup of the stale positive assert — keep separate.

## Verification

- `npm run lint -w akvj` / `npm run test -w akvj` pass
