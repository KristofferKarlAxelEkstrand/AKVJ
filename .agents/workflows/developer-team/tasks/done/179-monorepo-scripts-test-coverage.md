---
status: done
assignee: akvj-developer
priority: low
---

# Task 179: Add Unit Tests for monorepo-scripts

## Source
`.agents/workflows/developer-team/inbox/[TEST]-monorepo-scripts-coverage.md`
(Test Marshal — zero coverage in monorepo-scripts/).

## Scope

### 1. sort-package-json.js (most valuable — already exported)
- `sortPackageJson()` sorts keys with name/version/description first, rest alphabetical
- Handles missing standard keys gracefully
- Preserves nested object values (doesn't deep-sort)
- Empty object returns empty object

### 2. check-utf8.js
- Export `hasUtf8Bom()` and test: detects BOM bytes (0xEF 0xBB 0xBF), returns false for non-BOM
- Test `--fix` BOM stripping if practical

### 3. check-line-endings.js
- Export `normalizeToLF()` and test: converts CRLF→LF, CR→LF, preserves LF
- Test mixed line endings

### 4. lib/gitTrackedTextFiles.js, lib/report.js
- `getTrackedTextFiles()` — mock `git ls-files` output, verify extension filtering
- `failWithOffenders()` — verify error output format

## Note
Priority is low — these run in CI and would fail loudly if broken. `sortPackageJson()` is the most valuable since it has sorting logic that could silently regress.

## Verification
- `npm run test` (root)
- `npm run lint`

## Files
- `monorepo-scripts/sort-package-json.js` (export already exists)
- `monorepo-scripts/check-utf8.js` (add export)
- `monorepo-scripts/check-line-endings.js` (add export)
- `monorepo-scripts/lib/gitTrackedTextFiles.js` (reference)
- `monorepo-scripts/lib/report.js` (reference)
- New test files in `monorepo-scripts/test/` or root `test/`
