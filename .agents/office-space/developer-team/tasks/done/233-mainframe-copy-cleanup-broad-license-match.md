---
status: done
assignee: mainframe-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# [NIT] `removeOrphanedFiles` skips any path containing "LICENSE"

## Affected Files
- `mainframe/scripts/clips/lib/copy.js`

## Description
`removeOrphanedFiles` protects the project's `LICENSE-ASSETS.md` file from deletion by checking `file.includes('LICENSE')`. This substring match is too broad: any future clip, directory, or cache artifact whose relative path contains the substring "LICENSE" will also be skipped during cleanup, leaving stale files behind.

## Suggested Fix
Compare against the intended basename or exact relative path, e.g. `path.basename(file) === 'LICENSE-ASSETS.md'`, instead of `file.includes('LICENSE')`.
