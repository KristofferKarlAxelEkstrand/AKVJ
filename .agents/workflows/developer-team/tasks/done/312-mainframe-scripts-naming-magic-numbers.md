---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 312: Mainframe scripts naming/magic-number nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-mainframe-scripts-recheck-naming-sweep-2026-07-19.md`

## Description

Apply four small naming and magic-number cleanups in `mainframe/scripts/`.

## Findings and actions

### 1. Vague `data` property on `loadKeyMap` result

**File:** `mainframe/scripts/clips/lib/validateMapping.js`

- Renamed `loadKeyMap` return from `{ data: keyMap }` to `{ keyMap }`.
- Updated `validateKeyMap` to use `keyMapResult.keyMap` and `keyMapResult.errors`.

### 2. Hard-coded default frame rate in `spritesheet.js`

**File:** `mainframe/scripts/clips/spritesheet.js`

- Replaced `frameRate: 12` with `frameRate: DEFAULT_FRAME_RATE` (already imported from `./lib/spritesheet-core.js`).

### 3. Bare `1000` in `index.js`

**File:** `mainframe/scripts/clips/index.js`

- Extracted `MS_PER_SECOND = 1000` and used it in the elapsed-time calculation.

### 4. Bare `128` grayscale threshold in `optimize.js`

**File:** `mainframe/scripts/clips/lib/optimize.js`

- Extracted `DEFAULT_1BIT_THRESHOLD = 128` and used it in the 1-bit pipeline threshold call.

## Affected files

- `mainframe/scripts/clips/lib/validateMapping.js`
- `mainframe/scripts/clips/spritesheet.js`
- `mainframe/scripts/clips/index.js`
- `mainframe/scripts/clips/lib/optimize.js`

## Verification

- `npm run lint -w mainframe` — passed
- `npm run test -w mainframe` — passed
  - Node suite: 519 tests passed
  - UI light suite: 81 tests passed
  - UI heavy suite: 137 tests passed
- `npm run build -w mainframe` — passed

## Notes

- Naming/magic-number cleanup only; no runtime behavior changed.
