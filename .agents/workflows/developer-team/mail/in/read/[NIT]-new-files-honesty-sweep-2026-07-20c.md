---
type: nit
from: nitpicker
created: 2026-07-20T20:45:00Z
---

# [NIT] New modules — honesty and readability sweep (2026-07-20c)

Swept the new files landed since 2026-07-19: `midiConstants.js`, `mainframe/scripts/clips/lib/fix.js`, `mainframe/server/writeJsonAtomic.js`, `mainframe/server/routes/router.js`, `mainframe/shared/slugify.js`, `mainframe/src/js/ClipFramesPanel.js`, `acceptedImageFiles.js`, `playbackUtils.js`, `e2e/clearStaleMainframe.js`, plus a re-check of the much-expanded `PreviewClip.js`.

Celebrations first: `midiConstants.js` is a tiny model file (clear JSDoc, `MAX_MIDI_DATA_BYTE` with `MAX_MIDI_VELOCITY` alias well-commented). `writeJsonAtomic.js` is honest and compact. `slugify.js` has a great module docstring. `acceptedImageFiles.js` and `playbackUtils.js` read like plain English. `clearStaleMainframe.js` has excellent unit-honest names (`PORT_FREE_WAIT_MS`, `PORT_POLL_MS`, `MAINFRAME_ENTRY_URL`). Prior `PreviewClip.js` nits (`#setAttribute`→`#setAttributeIfChanged`, `#getFrameInterval`→`#getFrameIntervalMs`, `#loading`→`#isLoading`) all resolved — thank you.

Five small gifts for future readers:

- [ ] `mainframe/src/js/PreviewClip.js:28` — `#frames = []` → `#frameImages` (or `#loadedFrameImages`)
  - **Current:** `#frames`
  - **Proposed:** `#frameImages`
  - **Why:** The field stores `Image` objects loaded via `#loadImages`, not abstract "frames". A newcomer could expect frame metadata, URLs, or indices. `#totalFrames` is the count; the image array deserves a name that says what's in it. (Local `frames` on line 253 holds URL strings — same word, two types, which is the smell.)

- [ ] `mainframe/src/js/PreviewClip.js:36` — `#updatingAttribute = false` → `#isUpdatingAttribute`
  - **Current:** `#updatingAttribute`
  - **Proposed:** `#isUpdatingAttribute`
  - **Why:** Boolean field naming consistency — the codebase convention is `#isX` (`#isLoading` sits four lines above). `#updatingAttribute` reads as a gerund ("the act of updating") rather than a state flag.

- [ ] `mainframe/src/js/ClipFramesPanel.js:22` — JSDoc mentions "shadow tree" but the component is light DOM
  - **Current:** `Expose the inner <clip-frames> element so consumers can coordinate without reaching through the shadow tree or racing connectedCallback.`
  - **Proposed:** `Expose the inner <clip-frames> element so consumers can coordinate without reaching into the rendered children or racing connectedCallback.`
  - **Why:** No `attachShadow` anywhere; AGENTS.md mandates light DOM for these elements. A newcomer reading "shadow tree" goes looking for shadow DOM that doesn't exist.

- [ ] `mainframe/scripts/clips/lib/fix.js:42` — `migrateMissingPng` → `repointMissingPng` (or `repairMissingPng`)
  - **Current:** `migrateMissingPng`
  - **Proposed:** `repointMissingPng`
  - **Why:** `migrate` implies schema evolution over time (like `migrateLoopToPlayback` directly above, which converts a deprecated field). This function repairs a broken `png` pointer at runtime — it's not a migration. Honest verb: `repoint` or `repair`.

- [ ] `mainframe/server/routes/router.js:50` — asymmetric `/sprite` guard deserves a one-line comment
  - **Current:** `if (req.method === 'PUT' && url.pathname.startsWith('/api/clips/') && !url.pathname.endsWith('/sprite')) {`
  - **Proposed:** Add a comment above: `// /frames and /recompile already returned above; /sprite has no PUT handler, so exclude it here.`
  - **Why:** This is the only suffix-exclusion on the PUT-to-`handlePutClipMeta` branch, but `/frames` and `/recompile` are also suffix routes under `/api/clips/`. A reader wonders why only `/sprite` is special. The answer (those branches `return` above) is invisible at this line. Not a rename — just a comment so the asymmetry reads as intentional.
