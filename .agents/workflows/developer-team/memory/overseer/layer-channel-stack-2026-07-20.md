# Layer / channel stack — human direction (2026-07-20)

## Channel remap (draft epic only)

From earlier answer on `question-338-compositor-layer-b-intent.md`:

- Wants to **simplify MIDI**: one channel per role; open to renumbering.
- Proposed stack (DAW ch): Background(1), BG effects(2), A(3), A/B mix bitmask(4), B(5), mixed-out fx(6), C(7), global(8).
- In-group order: lower channel then lower note, source-over.
- Mask with nothing playing → transparency → background / bg colour visible.
- Epic draft: `epics/drafts/simplify-midi-channel-stack.md` — not approved for implementation.

## Task 338 compositor lock (2026-07-20)

`question-338-current-compositor-lock.md` → **option 2**: no mask + both A and B → **A then B source-over**. Independent of channel remap. TL to unpark task 338.
