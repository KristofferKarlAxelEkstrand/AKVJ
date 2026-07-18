---
status: completed
assignee: mainframe-developer
---

# [REPORT] Mainframe Tooling and File Review

## Task
Task 222: Review `mainframe/` tooling, server, UI, pipeline, configuration, and tests for quality, security, performance, and coverage issues.

## Verification Run
```bash
npm run lint
npm run test -w mainframe
npm run test:monorepo-scripts
npm run build -w mainframe
```
All passed.

## Findings Created
Four findings were added to `.agents/workflows/developer-team/inbox/`:

1. `[BUG]-mainframe-server-malformed-json-returns-500.md` — several server handlers parse request bodies outside their `try/catch`, causing 500 responses for malformed JSON.
2. `[NIT]-mainframe-pipeline-duplicate-project-id-validation.md` — `Pipeline.js` redefines project-id validation that already exists in `paths.js`.
3. `[NIT]-mainframe-copy-cleanup-broad-license-match.md` — `removeOrphanedFiles` uses `file.includes('LICENSE')` instead of matching the intended `LICENSE-ASSETS.md` basename.
4. `[TEST]-mainframe-server-missing-invalid-json-coverage.md` — `server.test.js` does not cover malformed JSON request bodies.

No critical security vulnerabilities or broken builds were found in the review.

## Files Modified
- `/workspaces/AKVJ/.agents/workflows/developer-team/inbox/[BUG]-mainframe-server-malformed-json-returns-500.md`
- `/workspaces/AKVJ/.agents/workflows/developer-team/inbox/[NIT]-mainframe-pipeline-duplicate-project-id-validation.md`
- `/workspaces/AKVJ/.agents/workflows/developer-team/inbox/[NIT]-mainframe-copy-cleanup-broad-license-match.md`
- `/workspaces/AKVJ/.agents/workflows/developer-team/inbox/[TEST]-mainframe-server-missing-invalid-json-coverage.md`
