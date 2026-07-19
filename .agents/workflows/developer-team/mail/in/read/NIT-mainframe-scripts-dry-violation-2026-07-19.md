# [NIT] mainframe/scripts/ DRY violation — VALID_BIT_DEPTHS duplicate

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
