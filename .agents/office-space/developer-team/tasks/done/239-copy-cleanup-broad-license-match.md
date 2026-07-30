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

# Task 239: Copy Cleanup Script Uses Broad License Match

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[NIT]-mainframe-copy-cleanup-broad-license-match.md`

## Affected Files
- `mainframe/scripts/clips/lib/copy.js` — `removeOrphanedFiles`

## Description
`removeOrphanedFiles` protects the project's `LICENSE-ASSETS.md` file from deletion by checking `file.includes('LICENSE')`. This substring match is too broad: any future clip, directory, or cache artifact whose relative path contains the substring "LICENSE" will also be skipped during cleanup, leaving stale files behind.

## Discrete Actions
Compare against the intended basename or exact relative path, e.g. `path.basename(file) === 'LICENSE-ASSETS.md'`, instead of `file.includes('LICENSE')`.

## Verification
- Add test for removeOrphanedFiles with a file path containing "LICENSE" in a directory name (not the file itself) and verify it is cleaned up
- Run `npm run lint`, `npm run test -w mainframe`, `npm run build -w mainframe`

## Related
- Low priority cleanup issue to prevent potential stale file accumulation
- Affects the clip pipeline cleanup logic
