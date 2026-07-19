---
status: done
assignee: mainframe-developer
priority: low
---
# Task 263: Add unit test coverage for mainframe/scripts/clips/lib/hash.js

**Module:** `mainframe/scripts/clips/lib/hash.js` (47 lines)

**Gap:** Zero direct test coverage. Functions `hashFile()`, `writeHashFile()`, and `isCacheValid()` are only tested indirectly via `optimize.test.js` (which imports them for test setup but doesn't test their error paths).

**Specific cases to add:**
- `hashFile()`: File read failure (ENOENT, permission errors)
- `writeHashFile()`: File write failure, directory creation failure
- `isCacheValid()`: Hash file read failure, corrupted hash file content (non-UTF8, malformed), catch block error handling (currently returns false but never exercised)

**Tier:** Unit test (node environment, no browser/sharp dependency)

**Priority:** Low - core logic is covered indirectly by optimize.test.js, but error paths are untested.

**Assignee:** mainframe-developer (mainframe scripts task)

**QA Feedback (from rejection):**
- mainframe/test/hash.test.js:60-67 — Permission error test fails in container/root environments (chmod doesn't block writes). Consider skipping this test or using a different error simulation method.
- mainframe/test/hash.test.js:82-91 — Cache invalid test has logic error: writes hash of sourcePath ('hello') instead of hash of cachePath ('goodbye'). Should write `await hashFile(cachePath)` to `${cachePath}.hash` to simulate mismatch.

**Verification:**
- Add new test file `test/hash.test.js` or add to existing test structure
- Cover all error paths listed above
- Fix the two test failures identified by QA
- Run `npm run test` to verify all tests pass
