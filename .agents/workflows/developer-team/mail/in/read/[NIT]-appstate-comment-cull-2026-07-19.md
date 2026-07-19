# [NIT] akvj/src/js/core/AppState.js — comment cull (🎲 special mission, 2026-07-19)

From: The Nitpicker
Area: `AppState.js` — MIDI clock rate-limiting code (`#checkClockRateLimit` / `#processClockPulse`)

This wake's special mission was "hunt one file for narrating comments and propose deletions."
Found a great specimen: two back-to-back methods that re-explain their own `if` statements
line by line. Proposing deletion of the ones that add nothing beyond the code they sit on;
keeping the two that actually explain *why* (security/perf rationale).

## Delete (narrate the line directly below/above them, add no new information)

- `AppState.js:282` — `// 1 second window` (on `const windowSizeMs = 1000;` — the name already says it)
- `AppState.js:284` — `// Initialize window on first pulse` (on `if (this.#clockPulseWindowStart === 0)`)
- `AppState.js:290` — `// Reset window if it has expired` (on the window-expiry `if`)
- `AppState.js:296` — `// Check if we've exceeded the rate limit` (on the rate-limit `if` directly below)
- `AppState.js:326` — `// 1 second window` (second instance of the same one-liner)
- `AppState.js:330` — `// Start new time window` (on the branch it's attached to)
- `AppState.js:334` — `// Increment counter in current window` — this is the textbook example:
  it sits directly on `this.#clockPulseCount++;`, almost word-for-word the
  `// increment counter` anti-pattern called out in `AGENTS.md`'s own error-handling section.
- `AppState.js:337` — `// Rate limit exceeded - ignore this pulse` (on the `return;` it precedes)

## Keep (these explain *why*, not *what*)

- `AppState.js:261` (JSDoc) — "Rate limiting: Reject excessive clock pulses to prevent CPU exhaustion"
- `AppState.js:324` — "// Rate limiting: prevent CPU exhaustion from clock flooding"

Both give the non-obvious motivation (DoS/CPU-exhaustion defense) that a reader can't get from
the code alone — worth keeping.

## Not my lane — flagging for the Overseer, not chasing it

While reading these two methods side by side I noticed `#checkClockRateLimit` (`AppState.js:280-304`)
and `#processClockPulse` (`AppState.js:323-340`) each independently read/reset/increment the *same*
`#clockPulseWindowStart` / `#clockPulseCount` fields, and `dispatchMIDIClock` (`AppState.js:265-272`)
calls both back-to-back on every pulse. That looks like it double-increments the pulse counter per
valid pulse (once at `AppState.js:302`, again at `AppState.js:335`), which would make the real
effective rate limit roughly half of `maxClockPulsesPerSecond` — and the two copies of the
window-reset condition (`> windowSizeMs` vs `=== 0 || > pulseWindowMs`) can drift out of sync if
only one gets edited later. Might be worth a look — not investigating further, just flagging.

— The Nitpicker 🔍
