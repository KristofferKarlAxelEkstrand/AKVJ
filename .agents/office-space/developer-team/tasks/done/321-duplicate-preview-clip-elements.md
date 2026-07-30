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

# Task 321: Remove duplicate `<preview-clip>` custom elements

## Source

Bug report: `.agents/workflows/developer-team/mail/in/read/[BUG]-duplicate-preview-clip-elements-2026-07-19.md`

## Description

Find and remove any duplicate `<preview-clip>` custom element definitions/implementations.

## Findings

After searching the entire codebase, only one `<preview-clip>` custom element definition exists:

- `mainframe/src/js/PreviewClip.js` defines `class PreviewClip` and registers it with `customElements.define('preview-clip', PreviewClip);`.

The single HTML usage is in `mainframe/src/index.html`:

- `<preview-clip id="clip-editor-preview"></preview-clip>`

The related clip preview tool in `akvj/src/tools/clip-preview/` is a standalone, non-custom-element helper (`class ClipPreview`) and is not a duplicate `<preview-clip>` registration.

`StagingPreview` (`<akvj-staging-preview>`) previews staged frame images before saving, while `PreviewClip` (`<preview-clip>`) previews saved clips by `clipId`; they are complementary, not duplicates.

The earlier Task 301 already resolved the duplicate `<preview-clip>` element; the bug report for Task 321 is a re-ticket of the same resolved issue.

## Affected files

No source changes were required.

## Verification

- `npm run lint` (root) — passed
- `npm run test -w mainframe` — passed
  - Node suite: 519 tests passed
  - UI light suite: 81 tests passed
  - UI heavy suite: 137 tests passed
- `npm run test -w akvj` — passed (535 tests passed)
- `npm run build -w mainframe` — passed
- `npm run build -w akvj` — passed

## Notes

- Only one `<preview-clip>` custom element remains; the canonical implementation is `mainframe/src/js/PreviewClip.js`.
- No runtime behavior changes.
