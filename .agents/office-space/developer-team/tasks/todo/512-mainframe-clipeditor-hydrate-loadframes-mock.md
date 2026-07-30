---
status: todo
stage: queued
priority: medium
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/test/ClipEditorController.test.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 512 — ClipEditorController hydrate: assert loadFrames payload (mock audit)

From: `[TEST]-mainframe-clipeditor-hydrate-loadframes-mock.md` (test-marshal).

## Gap

`mainframe/test/ClipEditorController.test.js` hydrate success only checks `loadFrames` was called once. Stubs drop duration/bakeConfig payload so regressions pass.

## Cases

1. Hydrate with `frames: [a,b]`, `durationsMs: [250, 750]` → assert `loadFrames` arg[0] length, durationMs, src, default bakeConfig.scaleMode.
2. Prefer `mockClipFrames: false` or deep mock.calls — not bare `toHaveBeenCalled()`.
3. Optional: create/meta path with non-empty bakeConfigs.

## Verify

`npm run test -w mainframe -- test/ClipEditorController.test.js` (or unit config).

Out of scope: **506**, product **500**.

Scope: **mainframe-developer**.
