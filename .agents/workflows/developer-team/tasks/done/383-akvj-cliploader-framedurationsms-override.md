---
status: done
assignee: akvj-developer
priority: medium
review: machine
---

# Task 383: Remove stale ClipLoader `frameDurationsMs` mapping-override test

## Source

Test Marshal `[TEST]-akvj-cliploader-framedurationsms-override.md`

## Description

Test asserts a **disallowed** key-map override key. Test-only — remove or rewrite to catalog `meta.frameDurationsMs` / allowed sync overrides. Do not teach mainframe to accept `frameDurationsMs` on a leaf.

File: `akvj/test/ClipLoader.test.js` (~L352).

## Note

ClipLoader still shallow-merges any leftover keys (wider than spec/mainframe allowlist) — product gap for Overseer/human, not this task.

## Verification

- `npm run test -w akvj` passes
- `npm run lint -w akvj` passes
