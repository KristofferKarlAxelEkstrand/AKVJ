---
status: done
assignee: none
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

## Assignment note (Team Lead)
Task 192 and 193 are landed (192 pending QA). Write tests against `bakeConfig*` / `getBakeConfigs` / `setAllBakeConfigs` / `areBakeConfigsUniform` / `bakeconfigchange` — ignore any outdated `composition*` names in the checklist below.

# Task 195: ClipFrames + ClipEditorController Bake-Composition Wiring Tests

## Source
`.agents/workflows/developer-team/inbox/read/[TEST]-clipframes-bake-composition-coverage.md`
(Test Marshal)

## Related / sequencing
- **Task 192** covers per-frame `ClipFrame` controls + `StagingPreview` pixel draw. This task is the
  **container + controller** layer above that — do not close either by only fixing the other.
- Prefer landing **Task 193** (composition → bakeConfig rename) first. If 193 is done, write tests
  against `getBakeConfigs` / `setAllBakeConfigs` / `areBakeConfigsUniform` / `bakeconfigchange` etc.
  If starting before 193, use whatever public names exist in source — do not invent aliases.

## Files
- `mainframe/src/js/ClipFrames.js` / `mainframe/test/ClipFrames.test.js`
- `mainframe/src/js/ClipEditorController.js` / `mainframe/test/ClipEditorController.test.js`

## Checklist

### 1. `ClipFrames.js` — composition container API (zero coverage)
Existing tests cover duration APIs only. Add (extend `ClipFrames.test.js`):

- `loadFrames` with per-frame `composition` → `getCompositions()` matches resolved values
  (scaleMode / width / height / placement).
- `setAllCompositions({ scaleMode: 'cover', placement: { x: 2, y: -1 } })` → every child reflects
  it, event detail `{ all: true, … }`, `areCompositionsUniform() === true`.
- Edit one child’s scale/placement control → `areCompositionsUniform() === false` and
  `getCompositions()` shows the divergence.
- After a non-uniform edit, reorder frames → compositions follow the frames (same pattern as the
  duration reorder test).

### 2. `ClipEditorController.js` — global bake-scale sync/apply (mocked away)
Fixture has global bake controls but stubs `getCompositions` / `areCompositionsUniform` /
`setAllCompositions`. Prefer a real `<clip-frames>` (or drive controller methods after staging
files) and cover:

- Stage ≥2 frames → global bake select enabled; “Set scale” to `cover` → all compositions `cover`,
  preview refresh path invoked.
- Non-uniform frames → global select disabled and blank; Apply still enabled when frames exist.
- `custom` mode shows global custom size fields; non-custom hides them.
- Empty / zero frames → select + apply disabled.

Untested source paths: `applyGlobalBakeScaleToAllFrames()`, `syncGlobalBakeScaleControl()`,
`#updateGlobalBakeCustomVisibility`.

## Verification
`npm run lint && npm run test -w mainframe && npm run build`
