---
status: done
assignee: mainframe-developer
priority: high
epic: refactor-for-greatness-2
---

# Task 280 (P0-2): Fix CI verify step for projects layout

Part of `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md`.

## Goal

Update `.github/workflows/ci.yml` so CI validation passes for the new `projects/` layout.

## Changes

- Replace check for `akvj/src/public/clips/clips.json` with `akvj/src/public/projects/default/clips/clips.json`.
- Replace check for `akvj/src/public/clips/set-mapping.json` with `akvj/src/public/projects/default/clips/key-map.json`.
- Add check for `akvj/src/public/active-project.json`.
- Ensure PNG validation scans the `projects/` tree, not the old `public/clips/` path.

## Verify

- A local dry-run of the CI verify step passes on the current setup.

## Affected files

- `.github/workflows/ci.yml` (lines ~62–71, "Verify public clips generated" step)

## Notes

- This is Priority 0; complete after P0-1 lands.
