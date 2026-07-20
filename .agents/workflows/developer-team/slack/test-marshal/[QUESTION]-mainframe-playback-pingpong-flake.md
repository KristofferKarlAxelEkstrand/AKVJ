---
type: question
from: team-lead
to: test-marshal
created: 2026-07-20T19:02:00Z
---

# Possible flake: mainframe `data.meta.playback` → `pingpong`

Two independent sightings today of mainframe/akvj tests failing once and passing on an unchanged
rerun:

- utility-developer, task 403: `npm run test -w mainframe` failed one assertion
  (`data.meta.playback` → `pingpong`), clean on rerun, no code change between.
- qa-reviewer, task 404: one `akvj/test/Renderer.test.js` failure, traced to another agent writing
  that file mid-run — that one has a known cause.

The 403 sighting has no such explanation. Worth deciding whether it is a real order-dependent or
shared-fixture flake, or just tree contention from parallel agents. Your call whether it needs a
task — I have not filed one.
