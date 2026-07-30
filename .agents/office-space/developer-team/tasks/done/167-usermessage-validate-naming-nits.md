---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 167: Fix 5 Naming Nits in UserMessage/UserMessages + validate scripts

## Source
`.agents/workflows/developer-team/inbox/[NIT]-new-files-naming-sweep-2025-07-18-2.md`
(Nitpicker sweep of new/refactored files — 5 actionable nits).

## Nits

### 1. `#abort` → `#abortController` (semantic mismatch)
- **Files**: `akvj/src/js/ui/UserMessage.js:13`, `mainframe/src/js/UserMessage.js:15`
- **Current**: `#abort = null`
- **Proposed**: `#abortController = null`
- **Rationale**: The field holds an `AbortController` instance, not a boolean or action.
  `#abort` reads as a verb or flag; `#abortController` is honest about what the field is.

### 2. `#idSeq` → `#nextMessageId` (abbreviation)
- **Files**: `akvj/src/js/ui/UserMessages.js:19`, `mainframe/src/js/UserMessages.js:20`
- **Current**: `#idSeq = 0`
- **Proposed**: `#nextMessageId = 0`
- **Rationale**: "Seq" is abbreviated and ambiguous. `#nextMessageId` makes the purpose
  instantly clear.

### 3. `#stack` → `#messageStackElement` (ambiguous)
- **Files**: `akvj/src/js/ui/UserMessages.js:15`, `mainframe/src/js/UserMessages.js:16`
- **Current**: `#stack = null`
- **Proposed**: `#messageStackElement = null`
- **Rationale**: "stack" could mean a data structure, stack trace, or DOM element.
  It's actually the DOM `<div>` container. `#messageStackElement` removes all ambiguity.

### 4. Single-letter variables in `validate/structure.js`
- **File**: `mainframe/scripts/clips/lib/validate/structure.js:12,28`
- **Current**: `e` (line 12), `f` (line 28)
- **Proposed**: `entry`, `filename`
- **Rationale**: Self-documenting and consistent with sibling `validate/index.js`.

### 5. `frameNum` → `frameIndex` (ambiguous "num")
- **File**: `mainframe/scripts/clips/lib/validate/meta.js:143`
- **Current**: `const frameNum = parseInt(key, 10);`
- **Proposed**: `const frameIndex = parseInt(key, 10);`
- **Rationale**: "Num" is ambiguous. It's a frame index parsed from an object key.
  Consistent with `frameIndex` in `akvj/src/js/visuals/clipMetadata.js:222`.

## Note
Nits 1-3 affect **both** akvj and mainframe copies of UserMessage/UserMessages.
Make sure to update both copies. Also check if nits from tasks 158/164 (`#items` →
`#messages`, `#enqueue` → `#pushMessage`) are in the same files — coordinate if possible.

## Verification
- `npm run lint`
- `npm run test`
- `npm run build`

## Files
- `akvj/src/js/ui/UserMessage.js`
- `akvj/src/js/ui/UserMessages.js`
- `mainframe/src/js/UserMessage.js`
- `mainframe/src/js/UserMessages.js`
- `mainframe/scripts/clips/lib/validate/structure.js`
- `mainframe/scripts/clips/lib/validate/meta.js`
