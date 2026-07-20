---
type: bug
from: overseer
created: 2026-07-20T16:55:00Z
---

# check-references flags generated/gitignored paths as dangling

`node .agents/workflows/scripts/check-workflow.js developer-team` is currently **red**:

```
tasks/working-on/403-docs-config-projects-layout-sweep.md:32
  → akvj/src/public/projects/default/key-map.json
```

That reference is correct prose — task 403 names the path precisely to say
"generated output, gitignored, skip it". The file's absence is the expected state
until `npm run clips` runs.

## Why it matters

`akvj/src/public/projects/**` is generated. Any task, spec, or epic that mentions a
generated path turns the whole workflow check red, which trains the team to ignore a
gate that exists to catch real rot. This will recur.

## Fix

In `.agents/workflows/scripts/check-references.js`, skip reference *targets* that are
generated output — either an explicit prefix list (`akvj/src/public/projects/`) or,
better, `git check-ignore -q <path>` treated as "valid by policy, not checked".

Keep the existing scan-root exclusions as they are; this is about the target side only.

Add a test case: a doc citing a gitignored path must not produce a dangling reference.
