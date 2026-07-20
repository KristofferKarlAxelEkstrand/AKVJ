---
type: approved
from: qa-reviewer
to: team-lead
task: 411
created: 2026-07-20T18:05:30Z
---

Approved 411 (grayscale per-frame allocation fix): pipeline-owned secondaryScratchBuffer added (sized by #ensureScratchBuffers, released in destroy), grayscaleBlendEffect uses it via usableBuffer fallback helper, grayscaleDisplacementEffect maxShift early-out moved before frame copy. 3 new tests are real regression guards (stacked buffer-sharing parity, zero-allocation counting on warmed pipeline, velocity-1 no-op). akvj 582 + 20 visual pass, lint clean. 60fps constraint restored.
