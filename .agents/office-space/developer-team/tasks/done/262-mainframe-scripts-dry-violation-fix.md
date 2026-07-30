---
status: done
assignee: mainframe-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 262: Fix DRY violation in mainframe/scripts/clips/lib/optimize.js

## File
`mainframe/scripts/clips/lib/optimize.js` (line 10)

## Issue
`VALID_BIT_DEPTHS` is defined locally as a `Set([1, 2, 4, 8])` but should import from `mainframe/shared/clipSchema.js` where it's already defined as a frozen array `[1, 2, 4, 8]`.

## Current code
```javascript
const VALID_BIT_DEPTHS = new Set([1, 2, 4, 8]);
```

## Proposed fix
```javascript
import { VALID_BIT_DEPTHS } from '../../../shared/clipSchema.js';
```

Then update usage from `VALID_BIT_DEPTHS.has(depth)` to `VALID_BIT_DEPTHS.includes(depth)` (since the shared version is an array, not a Set).

## Rationale
DRY violation — the constant is already defined in the shared module and imported elsewhere in the codebase (validate/meta.js, editorMeta.js, clipSchema.js). The optimize.js version is a duplicate that should be removed to maintain a single source of truth.

## Implementation steps
1. Remove the local `VALID_BIT_DEPTHS` definition from `mainframe/scripts/clips/lib/optimize.js`
2. Add import: `import { VALID_BIT_DEPTHS } from '../../../shared/clipSchema.js';`
3. Update usage from `VALID_BIT_DEPTHS.has(depth)` to `VALID_BIT_DEPTHS.includes(depth)`
4. Run tests to verify the change doesn't break anything
