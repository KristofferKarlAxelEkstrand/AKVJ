# AKVJ Developer Team

## 1. Mission

Build and maintain AKVJ's live VJ engine and Mainframe authoring tools with parallel implementation,
independent spec review, and real-browser QA while protecting live-performance latency and data formats.

## 2. Co-workers

- **Team Lead** (`team-lead`) — triages human mail, creates bounded cards, routes work, and unblocks gates; never implements or self-approves.
- **Mainframe Developer** (`dev-1`) — owns Mainframe UI, API, clip pipeline, and project tooling.
- **AKVJ Developer** (`dev-2`) — owns the live engine, MIDI path, renderer, and cross-workspace integration.
- **Scout** (`scout`) — performs bounded read-only investigations and files evidence-backed findings.
- **Quality** (`quality`) — independently reviews diffs against approved specs, scope, architecture, and risk.
- **Tests** (`tests`) — independently runs the required verification tier and evaluates regressions.

Capabilities in `.prompt.json` are authoritative. Route gates with `auto-reviewer` and `auto-qa`, not agent names.

## 3. Claiming and locks

- Every implementation card declares repository-relative `owned_paths`; overlapping live claims fail closed.
- One active implementation card per developer.
- When more than 12 cards are queued or either review gate has more than 4 cards, Scout stops low-priority discovery. The lead consolidates duplicates and drains gates first.

## 4. Pipeline

Normal flow is `queued → implementing → review → qa → done`. `blocked` parks missing dependencies; `human` is reserved for explicit human decisions. Every implementation passes both independent gates.

## 5. Human gate protocol

Use `human` only for:

- approved-spec changes or a code/spec contradiction;
- dependency installation/removal and lockfile changes not already authorized by the task;
- destructive data migration, secrets, credentials, release/publish, commit, or push;
- major architecture, framework, or product-scope changes.

Routine implementation, review, QA, and reversible refactoring proceed autonomously.

## 6. Quality bars

- **While editing:** run the narrowest relevant lint/test. MIDI tests use fakes; never expect container hardware.
- **Before review:** meet acceptance, add focused regression coverage, avoid unrelated edits, and respect approved specs. Protect 60fps rendering and sub-20ms MIDI response.
- **Review:** Quality reads the actual diff and relevant spec; checks scope, light-DOM/event/lifecycle rules, realm separation, cleanup, performance risk, and undisclosed behavior changes.
- **QA:** run `npm run lint`, `npm run test`, and `npm run build`; add `npm run test:visual` for rendering/visible UI and `npm run clips` for clip/pipeline changes.
- **Done:** record command evidence, independent review and QA verdicts, plus browser/MIDI limitations or required human verification.

## 7. Project-health cadence

Scout performs discovery only while the backlog throttle allows it. Dependency audits, flaky-test hunts, format sweeps, and clip-pipeline probes should become bounded one-shot runners if repeated; do not add resident agents for periodic chores.

## 8. Communication and kanban

Follow the `office-space-protocol` skill. Human requests enter `mail/in`; gate handoffs use `task-transition.js` and agent Slack. Product truth lives in `spec/`; durable decisions and migration history live in `records/`. Do not recreate the legacy workflow's second board, health protocol, or random self-wake system.

## 9. Bootstrapping

1. `npm install`
2. `office-space sync --write`
3. `office-space doctor`
4. `office-space check developer-team --tier fast`
5. `office-space team start developer-team`

The devcontainer has no Web MIDI hardware. Interactive browser/MIDI confirmation requires forwarded ports and host Chrome/Chromium.

## 10. Changelog

- 2026-07-30 — Migrated AKVJ product policy and active backlog from the legacy workflow; specialized roles, installed AKVJ validation gates, and adopted office-space task/record conventions.
- 2026-07-30 — Workflow scaffolded by `office-space init`.
