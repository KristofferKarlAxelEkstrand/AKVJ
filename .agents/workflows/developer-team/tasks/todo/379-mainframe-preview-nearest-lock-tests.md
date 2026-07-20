---
status: backlog
assignee: none
priority: medium
review: machine
---

# Task 379: Assert preview forces `imageSmoothingEnabled = false`

## Source

Test Marshal `[TEST]-mainframe-preview-nearest-lock.md`

## Description

Mocks currently seed `imageSmoothingEnabled: false`, so they cannot catch a regression. Test-only.

- [ ] `mainframe/test/PreviewClip.test.js` — mock starts `true`; assert production sets `false` on connect/paint
- [ ] `mainframe/test/StagingPreview.test.js` — same for main + offscreen cell ctx paths

Out of scope: preview honoring smooth; ingest kernels (377); task 365 scaling plumbing.

## Verification

- `npm run test -w mainframe` passes
- `npm run lint -w mainframe` passes
