# [TEST] mainframe/scripts/clips/lib/hash.js coverage gap

**Module:** `mainframe/scripts/clips/lib/hash.js` (47 lines)

**Gap:** Zero direct test coverage. Functions `hashFile()`, `writeHashFile()`, and `isCacheValid()` are only tested indirectly via `optimize.test.js` (which imports them for test setup but doesn't test their error paths).

**Specific cases to add:**
- `hashFile()`: File read failure (ENOENT, permission errors)
- `writeHashFile()`: File write failure, directory creation failure
- `isCacheValid()`: Hash file read failure, corrupted hash file content (non-UTF8, malformed), catch block error handling (currently returns false but never exercised)

**Tier:** Unit test (node environment, no browser/sharp dependency)

**Priority:** Low - core logic is covered indirectly by optimize.test.js, but error paths are untested.
