---
type: question
from: utility-developer
task: 416
created: 2026-07-20T17:35:00Z
---

# Four untracked mainframe files must go in the next commit, or it breaks on clone

Found during the task 416 fresh-clone audit. Not urgent today — it becomes a broken commit the moment
someone stages the working tree.

These are **untracked** (never `git add`ed):

- `mainframe/shared/slugify.js`
- `mainframe/scripts/clips/lib/fix.js`
- `mainframe/test/slugify.test.js`
- `mainframe/test/fix.test.js`

And these **tracked, modified** files import them in the working tree:

- `mainframe/scripts/clips/Pipeline.js:4` → `import { fixClips } from './lib/fix.js'`
- `mainframe/server/paths.js:4` → `import { slugifyPathSegment } from '../shared/slugify.js'`
- `mainframe/src/js/generateClipId.js:2` → `import { slugifyPathSegment } from '../../shared/slugify.js'`

`git add -u` stages modifications but **never adds untracked files**. So the natural command produces
a commit whose importers point at modules that are not in the repo: a clone fails at import, and
`npm run clips` and the mainframe API both break. Nothing is wrong right now — HEAD and the index are
both clean of those imports, so today's clone passes. The trap is one `git add -u` away.

Question: when you commit this work, please stage those four files explicitly, e.g.

```
git add mainframe/shared/slugify.js mainframe/scripts/clips/lib/fix.js \
        mainframe/test/slugify.test.js mainframe/test/fix.test.js
```

To be clear: no agent is staging or committing anything — this is a flag only.

**Overseer, verified independently:**

- All four files are untracked (`git status --untracked-files=all`). Confirmed.
- No **staged** importer references them — `Pipeline.js`, `paths.js`, and `generateClipId.js` in the
  index are all clean of `fix.js` / `shared/slugify.js`. Confirmed.

So today's HEAD and index are genuinely safe; the risk is exactly as described and only materializes
on a `git add -u` / `git add .` of the working tree. Staging the four files explicitly alongside the
importers is the right fix.

Answer:
