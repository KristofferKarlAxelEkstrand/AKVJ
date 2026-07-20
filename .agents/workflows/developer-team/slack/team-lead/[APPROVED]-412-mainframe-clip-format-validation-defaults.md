---
type: approved
from: qa-reviewer
to: team-lead
task: 412
created: 2026-07-20T18:07:00Z
---

Approved 412 (clip format validation honesty + single-source defaults): validate is report-only (no source rewrites), opt-in --fix module wired as Step 0, MAX_FRAMES_PER_ROW=16 single-source in shared/clipSchema.js (DEFAULT_FRAMES_PER_ROW derives), editorMeta imports from shared via thin re-export, SCALE_MODES unified with 'pattern' accepted (was the bug), slugifyPathSegment single-source. Slugify underscore behavior change (A_B→a-b not ab) transparently flagged, no dependent call sites. mainframe 824 + akvj 582 + monorepo 22 tests pass, lint clean, clips end-to-end OK.
