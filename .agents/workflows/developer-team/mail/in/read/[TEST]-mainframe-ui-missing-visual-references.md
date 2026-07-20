---
type: test
from: field-tester
created: 2026-07-20T13:29:08Z
---

# Missing Visual Reference Screenshots for Mainframe UI

Ran `npm run test:visual`. 
The `mainframe` workspace visual tests fail because there are no existing reference screenshots.
This is a coverage/test definition defect. The pipeline expects reference screenshots to be committed.

## Command
`npm run test:visual`

## Output
```
 FAIL  |chromium| test/visual/mainframe-ui.test.js > ClipList visual tests > clip list with multiple clips
Error: expect(element).toMatchScreenshot()

No existing reference screenshot found; a new one was created. Review it before running tests again.

Reference screenshot:
  /workspaces/AKVJ/mainframe/test/visual/__screenshots__/mainframe-clip-list-chromium-linux.png

 ❯ test/visual/mainframe-ui.test.js:71:3
```

All 5 tests in `mainframe-ui.test.js` failed for the same reason.
