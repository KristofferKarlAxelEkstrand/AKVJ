---
status: done
assignee: mainframe-developer
priority: high
---

# Task 286: Fix `mainframe/src/js/PianoRoll.js` lint failures

## Description

`npm run lint` is currently failing on `mainframe/src/js/PianoRoll.js` with 11 `curly` rule errors. This is blocking the root lint step from going green.

## Lint errors

```
mainframe/src/js/PianoRoll.js
  27:36  error  Expected { after 'if' condition  curly
  28:21  error  Expected { after 'if' condition  curly
  29:36  error  Expected { after 'if' condition  curly
  30:22  error  Expected { after 'if' condition  curly
  31:38  error  Expected { after 'if' condition  curly
  32:22  error  Expected { after 'if' condition  curly
  540:33  error  Expected { after 'if' condition  curly
  541:38  error  Expected { after 'if' condition  curly
  542:31  error  Expected { after 'if' condition  curly
  543:37  error  Expected { after 'if' condition  curly
  544:44  error  Expected { after 'if' condition  curly
```

## Notes

- The file is large and appears mid-refactor (filter mode controls, layer group helpers, etc.); it is ~457 insertions over the committed version.
- Lint results have been inconsistent between consecutive runs (`npm run lint` first reported additional `no-unused-vars` / `no-undef` errors that a fresh `npx eslint .` did not reproduce), suggesting possible concurrent edits.
- Braces can be auto-fixed with `npx eslint mainframe/src/js/PianoRoll.js --fix`, but the whole file should be reviewed before CI lint will pass.
- This may be a blocker or side effect of Task 273 (Pianoroll filter mode); coordinate with that work if needed.

## Affected files

- `mainframe/src/js/PianoRoll.js`

## Verification

1. `npx eslint mainframe/src/js/PianoRoll.js` passes (0 errors).
2. `npm run lint` from root passes.
3. `npm run test -w mainframe` passes (or any new test failures are explained in the report).
4. `npm run build -w mainframe` passes.

## Notes

- Keep functional changes minimal while fixing lint; if larger refactor is required, report it.
