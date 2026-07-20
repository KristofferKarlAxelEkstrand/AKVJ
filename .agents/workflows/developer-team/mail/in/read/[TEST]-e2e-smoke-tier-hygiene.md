# [TEST] E2E / smoke tier hygiene sweep

Area: `e2e/` and smoke scripts

Sweep date: 2026-07-19

## Findings

### 1. `e2e/mainframe.spec.js` — stale `value` assertion for global duration

**File:** `e2e/mainframe.spec.js:80`

The test asserts `#clip-frames-global-duration` with `toHaveAttribute('value', '1000')` and `toBeDisabled()`. However, `ClipEditorController.syncGlobalDurationControl()` blanks the input's *current* value to `''` and disables it when no frames are staged (see `mainframe/src/js/ClipEditorController.js:686-688`). The HTML `value` attribute remains `1000`, so the e2e passes while the field is actually empty. This is the same attribute-vs-property trap flagged in previous flake hunts.

**Action:**
- Update `e2e/mainframe.spec.js:80` to assert the current value, not the default attribute:
  - Empty state (no frames): `await expect(page.locator('#clip-frames-global-duration')).toHaveValue(''); await expect(...).toBeDisabled();`
  - Add a separate case that stages a clip and asserts `toHaveValue('1000')` when frames are uniform.

### 2. `e2e/mainframe.spec.js` — unreachable `test.skip` in clip edit test

**File:** `e2e/mainframe.spec.js:148-150`

The test first awaits `listItems.first().toBeVisible({ timeout: 15000 })`. If no clips exist, that assertion already fails before the `test.skip(itemCount === 0, ...)` on line 150 is reached, so the skip is dead code.

**Action:**
- Move the count/skip guard before the visibility assertion, or remove the skip if the e2e fixture always seeds clips.

### 3. `e2e/mainframe.spec.js` — conditional skips on mapping seed data

**File:** `e2e/mainframe.spec.js:112` and `e2e/mainframe.spec.js:168`

`test.skip(rowCount === 0, ...)` makes mapping row assertions and the remove-button test dependent on project seed state. If the default project has no key-map, the tests silently skip rather than exercising the UI.

**Action:**
- Seed a deterministic key-map for the e2e project (e.g. via the mainframe API or a dedicated test project) so these tests run predictably, or convert the skips into explicit setup steps.

## Tier notes

- These are all E2E-tier issues; no unit/source changes needed beyond the test files themselves.
- No product bug is implied — the global-duration blank-when-disabled behavior is explicitly documented in `ClipEditorController.js`.

## Suggested test additions

1. `e2e/mainframe.spec.js` — clip editor empty state: global duration blank + disabled.
2. `e2e/mainframe.spec.js` — clip editor with staged frames: global duration populated + enabled.
3. `e2e/mainframe.spec.js` — deterministic mapping row lifecycle (add → assert → remove → assert).
