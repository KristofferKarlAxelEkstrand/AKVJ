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

# [TEST] Missing coverage for malformed JSON request bodies in server tests

## Affected Files
- `mainframe/test/server.test.js`

## Description
`mainframe/test/server.test.js` exercises happy paths and many 400/404 cases for clip and project endpoints, but it does not send syntactically invalid JSON bodies. Because the handlers currently parse the body outside their local `try/catch`, this gap means the server can return 500 for a simple client mistake without a test catching the regression.

## Suggested Next Step
Add tests that POST/PUT malformed JSON (e.g. `{ not json`) to `/api/clips`, `/api/projects`, `/api/mapping`, `/api/projects/{id}/key-map`, and `/api/expand-gif`, and assert that the response status is 400 with a clear `error` field.
