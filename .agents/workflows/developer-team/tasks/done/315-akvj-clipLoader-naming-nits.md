---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 315: AKVJ visuals ClipLoader naming nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-visuals-clipLoader-naming-sweep-2026-07-19.md`

## Description

Apply three naming cleanups to `akvj/src/js/visuals/ClipLoader.js` and its callers/tests.

## Findings and actions

### 1. Vague `setup*` verbs for clip-loading methods

**Files:** `akvj/src/js/visuals/ClipLoader.js`, `akvj/src/js/core/AdventureKidVideoJockey.js`, `akvj/test/AdventureKidVideoJockey.test.js`

- Already renamed to `loadClips(...)` and `loadClipsFromProject(...)`.
- Callers and test spies already use the new names.

### 2. `destroy(clips)` semantically destroys an external object

**Files:** `akvj/src/js/visuals/ClipLoader.js`, `akvj/src/js/core/AdventureKidVideoJockey.js`, `akvj/test/AdventureKidVideoJockey.test.js`

- Already renamed to `destroyClips(clips)`.
- Callers and test spies already use the new name.

### 3. Inconsistent velocity key naming inside `ClipLoader.js`

**File:** `akvj/src/js/visuals/ClipLoader.js`

- Code already consistently uses `velocityThreshold` for the nested key.
- Updated remaining JSDoc comments that still referred to the tree as keyed by `velocity` to `velocityThreshold`:
  - Module header
  - `loadClips` / `loadClipsFromProject` `@returns`
  - `#buildLoadTasks` `@param keyMap`

## Affected files

- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/test/AdventureKidVideoJockey.test.js`

## Verification

- `npm run lint -w akvj` — passed
- `npm run test -w akvj` — passed (535 tests)
- `npm run build -w akvj` — passed

## Notes

- Naming-only cleanup; no runtime behavior changes.
