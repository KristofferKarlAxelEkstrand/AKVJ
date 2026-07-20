---
status: in-progress
assignee: akvj-developer
priority: medium
epic: bitmask-based-effects
---

# Task 290: Research bitmask-based visual effects

## Epic

`.agents/workflows/developer-team/epics/drafts/bitmask-based-effects.md`

## Description

Research which bitmask/bitwise visual effects are feasible at 60fps on the 240×135 canvas and identify the 2–3 strongest candidates to implement. The existing mask system (1/2/4/8-bit depth) provides a foundation.

## Candidates to evaluate

- Bit-depth crushing / posterization
- XOR blending between Layer Groups A and B
- Bit-shift effects and circular bit rotation
- Threshold masks generated from live clip brightness
- Dithering patterns (Floyd-Steinberg, Bayer matrix)
- Bitplane isolation
- Binary pattern generators (Wolfram cellular automata)

## Deliverables

- A brief research note in the epic or a new `docs/bitmask-effects-research.md` summarizing:
  - Performance cost of each candidate on the target canvas size.
  - Visual impact and MIDI controllability.
  - Recommended 2–3 candidates to prototype.
- No implementation required in this task.

## Affected files

- `.agents/workflows/developer-team/epics/drafts/bitmask-based-effects.md`
- Optional: new `docs/bitmask-effects-research.md`

## Verification

- Research note is clear and cites performance assumptions.
- At least 2 candidates are recommended with rationale.

## Notes

- Do not implement effects in this task; focus on evaluation.
