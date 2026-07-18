# Question: Sync to BPM Redesign — Follow-up Clarifications (3 questions)

## Question
Thank you for the answers! Three of them need a bit more clarification before we can finalize the spec:

### 1. BPM clock dropout behavior (from answer #3)
You said: "if it received bpm clock I think it should stay on that until it changes, but if no clock ever than the fallback."

**Scenario**: MIDI clock is active and a clip is playing in clock-driven mode. Then the MIDI clock stops (device unplugged, or timeout). What should happen to the clip that was mid-playback?

- **Option A**: Switch to time-based mode using the project's fallback BPM. The clip continues playing seamlessly, just driven by the internal timer instead of clock pulses.
- **Option B**: Freeze at the current position (stop advancing) until clock returns.
- **Option C**: Reset/retrigger the clip using the fallback BPM.

Which one matches your intent? (My recommendation would be Option A — seamless switch to fallback BPM.)

### 2. Retrigger + clock sync — pulse alignment (from answer #4)
You said: "it restarts when it starts so the timing of the midi note is what is important, so its immediately and I guess that means the pulse also resets."

**Follow-up**: When the clip restarts, its `pulseCount` resets to 0. But the global MIDI clock is still running (say it's at pulse 48 = beat 3 of bar 1). Does the clip:

- **Option A**: Start its own independent pulse count from 0, ignoring where the global clock is. The clip plays its full `totalPulses` duration starting from the moment you pressed the note, regardless of bar alignment.
- **Option B**: Snap to the nearest beat boundary in the global clock. E.g., if you press at pulse 48, the clip starts at pulse 48 and its progress is `48 mod totalPulses / totalPulses`.

I believe Option A is what you described (immediate restart, pulse resets to 0). Can you confirm?

### 3. `syncBeats` smaller than natural clip duration — explained (from answer #5)
**Use case**: You have a 64-frame clip where each frame plays at 1 FPS (1 second per frame). The clip's natural duration is 64 seconds. Now you set `sync: "beat"` with `syncLength: "1/4 beat"` (0.25 beats). At 120 BPM:

- Target duration = (0.25 × 60000) / 120 = **125 milliseconds**
- Speed multiplier = 125ms / 64000ms = **0.002×**
- The clip would try to play all 64 frames in 125ms — that's **512 FPS**, way too fast to see anything

**The question**: Should we:
- **Option A**: Just let it happen — the user chose that sync length, it's their responsibility. (Maybe they want a rapid flash effect.)
- **Option B**: Cap the speed multiplier at some maximum (e.g., 10×) so the clip is still somewhat visible.
- **Option C**: Show a warning in the Mainframe UI when the speed multiplier is extreme, but still allow it.

What feels right to you?

## Context
- Answers #1 (reverse + once → shows nothing), #2 (pingpong + once → shows nothing), and #6 (Layer Group C works the same as others) are clear and will be incorporated into the spec.
- Once these 3 follow-ups are answered, I'll create the epic and task breakdown for implementation.

## Answer
_(pending human response)_
