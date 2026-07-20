---
status: done
assignee: akvj-developer
priority: medium
review: machine
---

# Add direct unit tests for clipDrawRect.js

Area: `akvj/src/js/visuals/clipDrawRect.js`

Add direct unit tests (akvj/test/clipDrawRect.test.js or similar) for the math utilities. The tests should cover:
- `computeDrawRect` outputs for `fit`, `cover`, and `none` scale modes.
- `drawScaled` offset/placement math correctness.
- `drawPattern` tile math and `MAX_PATTERN_TILES_PER_FRAME` limit clamping.

This is a test-only addition touching no product source.
