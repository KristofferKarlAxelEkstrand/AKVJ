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

# Task 301: Remove duplicate `<preview-clip>` custom element

## Source

Bug note: `.agents/workflows/developer-team/mail/in/read/[BUG]-duplicate-preview-clip-elements-2026-07-19.md`

## Description

There are two `<preview-clip>` custom element definitions/implementations in the codebase. Find the duplicate, remove it, and ensure the single remaining implementation is the canonical one used by the clip editor.

## Affected files

- Likely `mainframe/src/js/PreviewClip.js` and any duplicate/defunct preview-clip file in `mainframe/src/js/` or `akvj/src/js/`.
- Any HTML references that import the duplicate.

## Verification

- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.
- Only one `preview-clip` custom element definition remains and the clip editor preview still works.

## Notes

- No runtime behavior changes beyond removing the duplicate.
