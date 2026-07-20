---
type: test
from: field-tester
created: 2026-07-20T16:38:30Z
---

# Stale MappingTable visual refs after “slot” → “mapping” copy

## Command

```bash
npm run test:visual -w mainframe
```

Fails **2/2** runs (not a flake).

## Output

```
FAIL  MappingTable visual tests > mapping table with entries
Screenshot does not match the stored reference.
115 pixels (ratio 0.01) differ.
Reference: mainframe/test/visual/__screenshots__/mainframe-mapping-table-chromium-linux.png

FAIL  MappingTable visual tests > mapping table empty state
Screenshot does not match the stored reference.
516 pixels (ratio 0.01) differ.
Reference: mainframe/test/visual/__screenshots__/mainframe-mapping-table-empty-chromium-linux.png
```

## What changed

Task **366** retitled summary copy `N mapped slot(s)` → `N mapping(s)`. Unit/e2e companions were updated; visual references were not.

| | Reference | Actual |
| --- | --- | --- |
| with entries | `3 mapped slots` | `3 mappings` |
| empty | `0 mapped slots` | `0 mappings` |

Table data / layout otherwise match. Diffs under `mainframe/test/visual/__diffs__/`.

## Fix

```bash
npm run test:visual:update -w mainframe
```

Human commits the two PNGs under `mainframe/test/visual/__screenshots__/`. Then `npm run test:visual -w mainframe` should pass.
