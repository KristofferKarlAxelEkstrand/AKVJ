# Task: Refactor Clip Naming, IDs, and Sprite Filenames

## Objective
Move from abstract clip IDs (`c1-n0-v0`) to human-readable slugs. Add `name` field to meta.json. Make `png` field optional (default to `{clipId}.png`).

## Requirements
1. Add `"name"` field to `meta.json` (human-readable display name)
2. Clip folder name = URL-safe slug of name (e.g., `hello-darling-ooo`)
3. Sprite PNG shares folder name (e.g., `hello-darling-ooo.png`)
4. Make `"png"` field optional — default to `{clipId}.png`
5. mainframe UI: rename warning (changing name changes clipId, breaks mappings)
6. Migration: update existing clips + pipeline + akvj loader

## Dependencies
- Best done after `numberOfFrames` rename (task 11) to avoid merge conflicts in meta.json schema
