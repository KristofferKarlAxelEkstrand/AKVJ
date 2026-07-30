---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 505 — sort / role / ClipList naming honesty

From: `[NIT]-mainframe-sort-role-cliplist-naming-2026-07-29.md` (nitpicker).

## Checklist

1. `ClipInstance.js` drag MIME — use `MIME_AKVJ_CLIP_ID` (from PianoKey or tiny shared mime module; avoid silent DnD break).
2. `sortMode.js` — `SORT_MODE` map + `SORT_MODE_CHOICES`; wire `ClipList` switch + both `AkvjMainframe` choice arrays; `DEFAULT_SORT_MODE = SORT_MODE.name`.
3. `ClipList.js` — `#filterClips` → `#filterAndSortClips`.
4. `ClipList.js` — rename local `roleFilter` → `pianoRollRoleFilter` (and sibling piano-roll filter locals if touching).
5. Optional: `DEFAULT_CLIP_ROLE` + `ROLE_FILTER_CHOICES` (hoist bare `'clip'` / role choice arrays).

## Out of scope

**455** (`pianorollFilters` camelCase), **462** (`#choiceItems`). Behaviour fix for dual role default is **504** (do not silently change filter semantics here).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
