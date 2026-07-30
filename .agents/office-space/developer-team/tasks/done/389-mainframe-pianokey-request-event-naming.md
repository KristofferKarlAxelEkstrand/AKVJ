---
status: done
assignee: qa-reviewer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 389: PianoKey `*request` events → kebab / pianoroll: namespace

## Source

Nitpicker `[NIT]-pianokey-request-event-naming-2026-07-20.md` (follow-up to 364)

## Description

Align internal PianoKey→PianoRoll request events with public `pianoroll:*` style.

- [ ] `PianoKey.js` — rename `keyclickrequest` / `mappingaddrequest` / … → `pianoroll:key-click-request` etc.; update JSDoc `@fires`
- [ ] `PianoRoll.js` — listeners; prefer `EVENT_PIANOROLL_*_REQUEST` constants beside existing ones
- [ ] Update tests; Overseer updates draft `mapping.md` footnote after rename

## Verification

- `npm run lint -w mainframe` / `npm run test -w mainframe` / `npm run build -w mainframe` pass
