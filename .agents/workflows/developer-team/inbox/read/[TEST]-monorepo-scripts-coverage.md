# [TEST] monorepo-scripts — zero unit test coverage

**From:** Test Marshal  
**Area:** `monorepo-scripts/`  
**Date:** 2026-07-18  
**Tier:** unit (node)

## Summary

All 4 files in `monorepo-scripts/` have zero unit test coverage. They are CI tooling
scripts exercised in GitHub Actions CI (`.github/workflows/ci.yml` lines 39-45), but
no unit tests verify their internal logic.

## Findings

### 1. `sort-package-json.js` — exported `sortPackageJson()` untested

`sortPackageJson()` is an exported pure function that sorts package.json keys with
`name`/`version`/`description` first, then remaining keys alphabetically. Easily
testable, non-trivial logic.

**Suggested tests:**
- Sorts keys with name/version/description first, rest alphabetical
- Handles missing standard keys gracefully
- Preserves nested object values (doesn't deep-sort)
- Empty object returns empty object

### 2. `check-utf8.js` — `hasUtf8Bom()` not exported, untested

Pure function `hasUtf8Bom()` checks for UTF-8 BOM bytes (0xEF 0xBB 0xBF). Not exported.
The `--fix` mode BOM stripping logic is also untested.

**Suggested fix:** Export `hasUtf8Bom()` and add unit tests.

### 3. `check-line-endings.js` — `normalizeToLF()` not exported, untested

Pure function `normalizeToLF()` converts CRLF/CR to LF. Not exported.

**Suggested fix:** Export `normalizeToLF()` and add unit tests.

### 4. `lib/gitTrackedTextFiles.js`, `lib/report.js` — untested

`getTrackedTextFiles()` runs `git ls-files` and filters by extension. `failWithOffenders()`
formats and prints error output. Both are small utilities that could be tested with mocks.

## Priority

**Low** — these scripts run in CI and would fail loudly if broken. The most valuable
test would be for `sortPackageJson()` since it's already exported and has sorting logic
that could silently regress.
