---
title: Legacy developer-team migration
date: 2026-07-30
status: complete
---

# Legacy developer-team migration

- Source: `.agents/workflows/developer-team/`
- Destination: `.agents/office-space/developer-team/`
- Migrated: six product specs, 20 open tasks, current draft/todo epics, completed epic records, and superseded specs.
- Reset: three interrupted legacy cards were returned to `queued` with their prior state recorded.
- Migrated history: 499 completed legacy task cards copied into `tasks/done/` with `verification_status: unverified` and explicit migration metadata. Metadata was synthesized for 96 early cards that predated frontmatter.
- Promoted durable history: two human-decision records, three incident/product-evolution archives, and five bounded specialist digests under `records/`.
- Final evidence pass: 16 open-task source reports, the supervisor uptime timeline, and four developer/field-test memory records.
- Excluded from current policy: legacy collaboration/maintenance protocol; snapshots are under `records/history/legacy-process/`.

- Source preservation: the original completed cards and transient mail/Slack/memory/health history remain in the legacy tree for rollback.

The legacy tree must not be started alongside office-space. Retire it only after the human confirms the new host has run successfully and the historical files are no longer needed in place.
