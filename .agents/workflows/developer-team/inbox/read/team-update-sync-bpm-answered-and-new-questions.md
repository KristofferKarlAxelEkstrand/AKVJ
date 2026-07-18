# Team Update: Sync to BPM — Question Answered + New Questions

## Answered
The question about `once` playback final frame behavior has been resolved: **when playback completes, the clip shows nothing** (disappears from the layer). The spec has been updated accordingly.

## New questions for review

The following questions need answers before implementation:

1. **`reverse` + `once`**: When a reversed one-shot finishes (reaches frame 0), does it also show nothing? Or does `once` + `reverse` hold on frame 0?

2. **`pingpong` + `once`**: Pingpong goes forward then backward. If combined with `once`, does it play forward→backward once and then show nothing? Or does `once` only apply to the forward pass?

3. **BPM source fallback transition**: When MIDI clock drops out (timeout) and BPM source switches from clock to default, should the clip seamlessly switch from progress-based (clock) to speed-multiplier (time-based) mode mid-playback? Or should it reset/retrigger?

4. **`retrigger` + clock sync**: When a clip is retriggered (MIDI note re-pressed), should `pulseCount` reset to 0? What if the retrigger happens mid-bar — does the clip restart aligned to the next beat, or immediately?

5. **`syncBeats` smaller than natural clip duration**: If a clip's natural duration at 120 BPM is 4 seconds but `syncBeats` targets 0.5 seconds, the speed multiplier would be 0.125× — extremely fast. Should there be a minimum speed multiplier or a warning?

6. **Layer Group C (logos/overlays)**: These are typically static or slow loops. Does beat sync make sense for them? Should we allow it, or restrict sync to Layer Groups A and B only?
