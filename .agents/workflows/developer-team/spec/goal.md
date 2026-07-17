# Overarching Goal: The Server Split & Vision

The goal of this project is to maintain a strict architectural split between two highly decoupled realms: `akvj` and `mainframe`.

## AKVJ: The Live Visualizer
- **Purpose**: A highly efficient pixel VJ setup used in live performances as a backdrop or lighting.
- **Triggered by MIDI**: It runs on a computer that receives MIDI via WebMIDI from a sequencer or DAW to create live, synced visualizations that follow what the performer does.
- **Performance**: It must be extremely efficient, run flawlessly, and completely lock to a 60fps render loop with zero heavy dependencies.
- **No UI**: It should have essentially no user interface. It is meant to run fullscreen (toggled via space and double click) and do nothing but perform its visualization duties.

## Mainframe: The Backoffice
- **Purpose**: A user-friendly backoffice dashboard where you set up, edit, and map all the clips for the live visualizer.
- **User Experience**: It must be easy to use, intuitive, and not overly complex.
- **Clip Management**: The place to import images, resize them to needed dimensions, optimize them, and save sprite maps as PNGs.
- **Mapping**: Used to define trigger zones for clips and configure how MIDI interacts with the visuals.

## The Bridge
The only allowed communication between the two realms is the shared `clips/` directory and its metadata JSON files. They must never share javascript module imports.

## Planned: Projects
Today the app operates on one global, flat clip bank. Per direct user feedback (2026-07-17, see `memory/overseer/`), the long-term vision is to group clips, MIDI mapping, and raw uploads into **Projects** — the user's mental model is roughly "one Project per gig/show." Within that, the user wants to be able to switch between songs/scenes live via a dedicated MIDI channel, with some acceptable load latency (not instant, not a full reload). Bitmask/mixer clips should belong to a Project (each Project gets its own, seeded from a shared default) rather than being global. Some settings remain global/"General" outside any Project (e.g. canvas size, MIDI channel routing); which settings fall in which tier is still being worked out. See Task 73 (`tasks/73-introduce-projects.md`) for the detailed design and open sub-tasks.

## Real-world usage context (from the user, 2026-07-17)
- The user runs AKVJ for their own live sets, occasionally club nights, driven from **FL Studio** sending MIDI over a single dedicated MIDI-out device, aiming to use the full 16-channel range (untested so far — worth keeping in mind when auditing channel-routing code). Playback is meant to track the music closely (near 1:1), so **MIDI clock reliability and BPM-sync accuracy matter a lot** — this is a real, active use case, not a theoretical one.
- AKVJ is currently their primary visual tool; they're separately exploring DMX-style lighting control as a parallel (not integrated, not urgent) system.
- **Explicit priority signal**: the user wants the team to nail the fundamentals before building more on top. In their words, the **clip format is the backbone** and matters more right now than the Project format/feature, because Projects will be built on top of clips — get the clip format solid and testable first. They also want to actually start testing what exists rather than keep adding scope.
- **Feature idea, not yet spec'd**: the user floated using monochrome (grayscale/black-and-white) clips as a reusable base for a family of effects, and fleshed it out further (2026-07-17): (1) grayscale-driven pixel displacement — 50% gray = no shift, values above/below shift pixels proportionally, similar to a displacement map; (2) grayscale-driven soft/smooth fades, as opposed to hard-cut effects. Drew an explicit analogy to bitmasks. Clarified to the user that this isn't as separate from bitmasks as they thought: `Compositor.js`'s multi-bit mask blending (2/4/8-bit) already treats mask pixels as grayscale for smooth crossfades — only 1-bit is a hard threshold — so this could extend existing machinery rather than needing a new pipeline. See `[FEATURE-IDEA]-grayscale-displacement-and-fade-effects.md` for full detail. Not scoped further per the user's own "think about it" — proper design pass needed once clip-format/MIDI-clock hardening is further along.
