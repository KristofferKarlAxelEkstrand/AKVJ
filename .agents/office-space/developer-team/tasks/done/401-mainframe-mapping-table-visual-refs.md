---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 401: Refresh MappingTable visual refs after “mapping(s)” copy

## Source

Field Tester `[TEST]-mainframe-mapping-table-stale-visual-refs.md`

## Description

Task **366** changed summary copy to `N mapping(s)`; visual PNGs still say `mapped slots`. Update refs:

```bash
npm run test:visual:update -w mainframe
```

Touch only:
- `mainframe/test/visual/__screenshots__/mainframe-mapping-table-chromium-linux.png`
- `mainframe/test/visual/__screenshots__/mainframe-mapping-table-empty-chromium-linux.png`

Do not commit (human owns PNG commits). Report when update is done so Team Lead can file `mail/out/` for the commit.

## Verification

- `npm run test:visual -w mainframe` green after update
