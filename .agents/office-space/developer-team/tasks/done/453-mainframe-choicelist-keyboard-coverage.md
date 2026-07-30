---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 453 — ChoiceList keyboard coverage (unit)

From: `[TEST]-mainframe-choicelist-keyboard-coverage.md` (test-marshal).

`mainframe/src/js/ChoiceList.js` has no direct unit tests. Cover ArrowLeft/Up/Down/Right wrap, Home/End, non-nav keys, non-ItemClass ignore. Prefer `ChoiceList.test.js` with minimal concrete subclass. Optional thin `ChoiceItem` cases.

## Verify

`npm run test -w mainframe`, `npm run lint -w mainframe`.

Scope: **mainframe-developer**.
