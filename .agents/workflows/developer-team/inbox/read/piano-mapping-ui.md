# Feature Request: Piano Visualizer for Clip Mapping

## Core Goal
Enhance the `mainframe` server's mapping UI by adding an interactive, horizontal piano keyboard layout. This will allow users to visually map clips to specific MIDI notes across different channels in an intuitive way.

## Requirements

### 1. The Piano Interface (KISS Principle)
- **Layout**: Keep it incredibly simple. Just black and white block keys. No fancy 3D rendering.
- **Scope**: Must display all 128 MIDI notes (0 to 127).
- **Positioning**: Make it sticky to the bottom of the screen (`position: sticky` or `fixed` at bottom), spanning `100%` width horizontally. Users should be able to scroll horizontally if all 128 keys don't fit at a reasonable width.

### 2. Channel Selector
- Add a dropdown or toggle selector for the 16 MIDI channels.
- **Contextual Awareness**: The UI should hint at what each channel does based on AKVJ's hardcoded architecture:
  - Channels 1-4: Layer Group A
  - Channel 5: Mixer
  - Channels 6-9: Layer Group B
  - Channel 10: Mixed output effects
  - Channels 11-12: Layer Group C
  - Channel 13: Global effects
  - Channels 14-16: Reserved

### 3. Workflow Integration
- Clicking a key on the piano should interact with the mapping state (e.g., assigning the currently selected clip to that note and channel).
- Visually indicate on the piano keys which notes already have clips mapped to them on the currently selected channel.

## Architectural Constraints
- This is purely an `mainframe` UI feature. Do not touch `akvj` rendering.
- Keep dependencies light. Build the piano using standard DOM elements (e.g., `<div>`s for keys) and plain CSS. No heavy Canvas/WebGL for the UI.
