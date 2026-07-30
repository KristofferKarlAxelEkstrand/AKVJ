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

# 476 — validateKeyMap duplicate + Invalid JSON coverage

From: `[TEST]-mainframe-validate-keymap-duplicate-json.md` (test-marshal). Test-only.

## Do

1. Replace vacuous “duplicate MIDI slots” test — actually hit `Duplicate MIDI slot` (flat `assertValidFlatMapping` with shared `1/60/0`, or document nested JSON can’t express duplicates).
2. Invalid JSON key-map — garbage/`{` → errors path `key-map.json`, `/Invalid JSON/`.

## Verify

`npm run test:unit -w mainframe -- test/validateMapping.test.js`, `npm run lint -w mainframe`.

Scope: **mainframe-developer**. Out of scope: 473/474 product bugs.
