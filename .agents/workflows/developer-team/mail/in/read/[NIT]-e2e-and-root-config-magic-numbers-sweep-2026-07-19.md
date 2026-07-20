# [NIT] E2E + root config magic-number sweep

Area: `e2e/` (`akvj.spec.js`, `mainframe.spec.js`) + root config (`playwright.config.js`, `eslint.config.js`, `knip.json`, `package.json`)

The E2E specs are otherwise clean and descriptive (`akvj canvas has correct dimensions (240x135)`, `mapping table add and remove button lifecycle`). Root config is tidy. Two magic-number nits surfaced in `mainframe.spec.js` and `playwright.config.js`.

## Findings

### 1. `e2e/mainframe.spec.js` repeats bare `15000` timeout values
- **File**: `e2e/mainframe.spec.js` (lines 95, 168, 172)
- **Current**: `{ timeout: 15000 }` used directly in three test calls (frame staging, library refresh, clip edit visibility)
- **Proposed**:
  - Add a top-level constant near the imports, e.g. `const E2E_TIMEOUT_MS = 15000;`.
  - Replace all three `{ timeout: 15000 }` with `{ timeout: E2E_TIMEOUT_MS }`.
- **Rationale**: `15000` is the shared E2E wait timeout across mainframe tests. Naming it makes the intent clear and makes it trivial to adjust globally.

### 2. `playwright.config.js` repeats bare `30000` webServer timeout
- **File**: `playwright.config.js` (lines 34, 40)
- **Current**: `timeout: 30000` for both `npm run akvj` and `npm run mainframe` webServer entries
- **Proposed**:
  - Add `const WEB_SERVER_TIMEOUT_MS = 30000;` near the top of the file (after imports).
  - Use `timeout: WEB_SERVER_TIMEOUT_MS` in both webServer objects.
- **Rationale**: Both dev servers use the same startup timeout. A named constant makes the config self-documenting and keeps the two entries in sync.

## Celebrations

- `e2e/akvj.spec.js` is admirably focused: three clear tests covering mount, dimensions, and render loop, plus a clean Web MIDI error filter in `afterEach`.
- `e2e/mainframe.spec.js` has excellent test names that read like user scenarios (`tab navigation switches between Library, Clip editor, and Mapping`).
- `playwright.config.js` webServer array is a clean, explicit setup for the dual-server E2E environment.
