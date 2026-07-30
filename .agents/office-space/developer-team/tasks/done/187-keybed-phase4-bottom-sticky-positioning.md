---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 187: Phase 4 — Bottom-Sticky Positioning

## Epic
`.agents/workflows/developer-team/epics/keybed-for-mapping.md`
Spec: `.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`

## Depends On
Task 186 (Phase 3 — drag-and-drop from clip list)

## Scope

Add `position: sticky` CSS to `.piano-roll` with `bottom` offset.

- Piano roll sticks to the **bottom** of the viewport (not top)
- Applies to all instances of `<piano-roll>` regardless of mode
- CSS-only — no JavaScript scroll listeners
- If page has a bottom toolbar/footer, offset should account for its height
- Otherwise `bottom: 0`
- Verify it works across all tabs (Library, Mapping)
- Verify it doesn't overlap any bottom toolbar/footer

## Verification
- `npm run build -w mainframe`
- `npm run lint`
- Manual visual check in browser

## Files
- `mainframe/src/scss/` (`.piano-roll` sticky styling)
