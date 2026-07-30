---
status: done
assignee: utility-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 450 — Install Playwright Chromium deps so `test:visual` runs in-container

Unblocks **447** (akvj blocked: `libnspr4.so` missing; visual shots written, refs not generated).

Container cannot launch Chromium for `npm run test:visual` / `:update`. Prefer enabling the existing Playwright browser path (system libs), not a full Chrome install for manual MIDI browsing.

## Checklist

- [x] Install Playwright Chromium OS deps (e.g. `npx playwright install-deps chromium` / project-documented equivalent) so Chromium launches
- [x] Confirm `npm run test:visual -w akvj` starts (may still fail on missing refs until 447 updates them)
- [x] Tell Team Lead when ready so akvj can finish `test:visual:update` on **447**

If deps are impossible in this image, report and escalate to host/CI instead — do not half-commit empty refs.

## Verify

Chromium launches; visual suite runs. Scope: **utility-developer**.
