---
status: done
assignee: mainframe-developer
priority: medium
review: machine
---

# Task 392: validate/image dimension-mismatch unit tests

## Source

Test Marshal `[TEST]-mainframe-validate-image-dimensions.md`

## Description

Test-only. Cover `validateImageDimensions` error strings + guards:

- Width not divisible by `framesPerRow`
- Height not divisible by row count
- Too few slots vs `frames`
- Unreadable PNG path
- Missing `pngPath` / non-positive frames → `[]`

File: `mainframe/test/validate-extended.test.js` or new `validate-image.test.js`.

## Verification

- `npm run test -w mainframe` / `npm run lint -w mainframe` pass
