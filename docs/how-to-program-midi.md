# How to Program MIDI for AKVJ

A practical guide to creating visuals by programming MIDI notes in your DAW.

## Quick Start

AKVJ uses MIDI notes to trigger animations. Each MIDI channel controls a different layer group or function:

```
╔═══════════════════════════════════════════════════════════╗
║              AKVJ CHANNEL MAPPING                         ║
╠═══════════════════════════════════════════════════════════╣
║  LAYER GROUP A (Primary Deck)                                   ║
║    Channel 1  → Layer Group A, Slot 0                           ║
║    Channel 2  → Layer Group A, Slot 1                           ║
║    Channel 3  → Layer Group A, Slot 2                           ║
║    Channel 4  → Layer Group A, Slot 3                           ║
║                                                           ║
║  MIXER                                                    ║
║    Channel 5  → B&W bitmask for Layer Group A and Layer Group B crossfading          ║
║                                                           ║
║  LAYER GROUP B (Secondary Deck)                                 ║
║    Channel 6  → Layer Group B, Slot 0                           ║
║    Channel 7  → Layer Group B, Slot 1                           ║
║    Channel 8  → Layer Group B, Slot 2                           ║
║    Channel 9  → Layer Group B, Slot 3                           ║
║                                                           ║
║  MIXED OUTPUT EFFECTS                                              ║
║    Channel 10 → Mixed output effects               ║
║                                                           ║
║  LAYER GROUP C (overlay layer)                                        ║
║    Channel 11 → Layer Group C, Slot 0 (logos, graphics)          ║
║    Channel 12 → Layer Group C, Slot 1                            ║
║                                                           ║
║  GLOBAL EFFECTS                                           ║
║    Channel 13 → Effects on entire output                  ║
║                                                           ║
║  RESERVED                                                 ║
║    Channels 14-16 → Ignored                               ║
╚═══════════════════════════════════════════════════════════╝
```

## The Three MIDI Parameters

Every MIDI note you send has three values:

| Parameter    | Range | What It Controls                               |
| ------------ | ----- | ---------------------------------------------- |
| **Channel**  | 1-16  | Which layer group/function (see mapping above) |
| **Note**     | 0-127 | Which animation to trigger                     |
| **Velocity** | 1-127 | Which velocity variant                         |

**Note:** Velocity 0 = Note Off (stops the animation)

**Example:** `Channel 1, Note 60, Velocity 100` plays the animation at `animations/0/60/100/`

> **Source folder paths use 1-16:** Channel 1 in your DAW = folder `1/`. The build pipeline automatically converts to 0-15 for code.

## Layer Group Architecture

### Layer Group A (Channels 1-4) - Primary Deck

Your main clip deck with 4 independent slots. Use for:

- Main rhythmic visuals
- Beat-synced patterns
- Primary content

Each channel can play one animation at a time. Sending a new note replaces the current animation.

### Mixer (Channel 5) - Layer Group A and Layer Group B Crossfading

Triggers **black & white mask clips** that blend Layer Group A and Layer Group B:

- **White pixels** = Show Layer Group A
- **Black pixels** = Show Layer Group B
- **Gray pixels** = Mix of both

Use for creative transitions and DJ-style crossfades.

### Layer Group B (Channels 6-9) - Secondary Deck

Your secondary deck, same as Layer Group A but blended via the Mixer. Use for:

- Alternate visuals for transitions
- Background elements during crossfades
- B-roll content

### Mixed output effects (Channel 10)

Applies effects to the **mixed Layer Group A and Layer Group B output**. Note ranges control different effect types:

| Note Range | Effect Category           |
| ---------- | ------------------------- |
| 0-15       | Split/Divide              |
| 16-31      | Mirror                    |
| 32-47      | Offset/Shift              |
| 48-63      | Color (invert, posterize) |
| 64-79      | Glitch                    |
| 80-95      | Strobe/Flash              |
| 96-127     | Reserved                  |

### Layer Group C (Channels 11-12) - Overlay layer

Renders **on top** of everything. Use for:

- Logos and branding
- Persistent graphics
- Text overlays

### Global effects (Channel 13)

Applies effects to the **entire final output** (all layer groups combined). Same note ranges as mixed output effects.

### Reserved (Channels 14-16)

These channels are ignored by AKVJ.

## DAW Setup

### Create Your MIDI Tracks

Set up tracks for each layer group you want to control:

| DAW Track             | MIDI Channel (DAW) | AKVJ Function                                                   |
| --------------------- | ------------------ | --------------------------------------------------------------- |
| Layer Group A, Slot 0 | Channel 1          | Primary slot 0                                                  |
| Layer Group A, Slot 1 | Channel 2          | Primary slot 1                                                  |
| Layer Group A, Slot 2 | Channel 3          | Primary slot 2                                                  |
| Layer Group A, Slot 3 | Channel 4          | Primary slot 3                                                  |
| Mixer                 | Channel 5          | B&W bitmask for Layer Group A and Layer Group B crossfading     |
| Layer Group B, Slot 0 | Channel 6          | Secondary slot 0                                                |
| Layer Group B, Slot 1 | Channel 7          | Secondary slot 1                                                |
| Layer Group B, Slot 2 | Channel 8          | Secondary slot 2                                                |
| Layer Group B, Slot 3 | Channel 9          | Secondary slot 3                                                |
| Mixed output effects  | Channel 10         | Effects applied to mixed Layer Group A and Layer Group B output |
| Layer Group C, Slot 0 | Channel 11         | Logo slot 0                                                     |
| Layer Group C, Slot 1 | Channel 12         | Logo slot 1                                                     |
| Global effects        | Channel 13         | Effects on entire output                                        |

> **Folder path note:** Animation source folders use 1-16 (matching your DAW). The build pipeline converts to 0-15 for code output.

### Route to AKVJ

1. Create a virtual MIDI port (IAC on macOS, loopMIDI on Windows)
2. Set all tracks to output to that virtual port
3. Open AKVJ in Chrome/Chromium
4. AKVJ automatically connects to available MIDI inputs

## Programming Patterns

### Basic 4-on-the-floor

```
Channel 1 (Layer Group A, Slot 0):
  Note 36, every beat (quarter notes)
  Velocity: 100

Result: Animation at animations/0/36/100/ plays on every beat
```

### Layer Group pattern

```
Channel 1 (Layer Group A, Slot 0): Kick animation on beats 1 & 3
  Note 36, Velocity 100

Channel 2 (Layer Group A, Slot 1): Snare animation on beats 2 & 4
  Note 38, Velocity 90

Channel 3 (Layer Group A, Slot 2): Hi-hat on every 8th note
  Note 42, Velocity 60-80 (vary velocity for dynamics)
```

### Layer Group A and Layer Group B Crossfade Performance

```
1. Start with content on Layer Group A (Channels 1-4)
2. Prepare alternate content on Layer Group B (Channels 6-9)
3. Trigger a mask clip on Channel 5 (Mixer)
4. The mask gradually reveals Layer Group B as it plays
```

### Effects Automation

```
Channel 10 (Mixed output effects):
  Note 64, Velocity 100  → Glitch effect on Layer Group A and Layer Group B mix

Channel 13 (Global effects):
  Note 80, Velocity 127  → Strobe on entire output

### Strobe (Notes 80-95)

The **Strobe** effect (notes 80–95) creates a BPM‑synchronized flash on the output. Velocity controls how the strobe behaves:

- Velocities **1–9**: Full-frame **white‑out** flash (instant full white frame)
- Velocities **10–19**: **1 pulse per beat**
- Velocities **20–29**: **2 pulses per beat**
- Velocities **30–39**: **3 pulses per beat**
- ... (each 10‑velocity bucket increases pulses by 1)
- Velocities **120–127**: **12 pulses per beat**

The strobe is synchronized to the current BPM (MIDI Clock when available). Within each 10‑velocity bucket a small duty‑cycle variation is applied (roughly 25–50% on time) so different velocities feel slightly different even within the same bucket. The behavior is deterministic (no random flashes), which makes it testable and reliable in live performance.
```

### Logo Overlay layer

```
Channel 11 (Layer Group C, Slot 0):
  Note 0, Velocity 100   → Show logo
  (sustain for duration)
  Note 0, Velocity 0     → Hide logo (Note Off)
```

## Animation File Locations

Animations are stored at:

```
src/public/animations/{channel}/{note}/{velocity}/
  ├── sprite.png     # Spritesheet with all frames
  └── meta.json      # Animation metadata
```

**Example:** For `Channel 0, Note 60, Velocity 100`:

```
src/public/animations/0/60/100/
  ├── sprite.png
  └── meta.json
```

If no animation exists for the exact velocity, AKVJ will look for available velocities.

## Note Duration

- **Note On** = Start animation
- **Note Off** (or Velocity 0) = Stop animation on that channel

For looping animations, hold the note for the desired duration. For one-shot animations, the note length doesn't matter (animation plays to completion).

## Velocity Dynamics

Use velocity to select different animation variants:

```
Soft hit:   Velocity 40  → Subtle animation
Medium hit: Velocity 80  → Normal animation
Hard hit:   Velocity 120 → Intense animation
```

Each velocity can be a completely different animation or a more intense version of the same visual.

## BPM Sync

AKVJ syncs to your DAW's tempo via MIDI Clock:

1. Enable **MIDI Clock** output in your DAW's MIDI settings
2. AKVJ receives the 0xF8 timing messages automatically
3. Tempo-synced animations adjust playback speed to match your BPM

**Fallback:** If no MIDI Clock is received, AKVJ defaults to 120 BPM.

## Virtual MIDI Setup

### macOS (IAC Driver)

1. Open **Audio MIDI Setup** (Applications → Utilities)
2. Window → Show MIDI Studio
3. Double-click **IAC Driver**
4. Check "Device is online"
5. In your DAW, output to "IAC Driver Bus 1"

### Windows (loopMIDI)

1. Download and install [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html)
2. Create a new port named "AKVJ"
3. In your DAW, output to "AKVJ"

### Linux (virmidi)

```bash
sudo modprobe snd-virmidi
# Connect your DAW to "Virtual Raw MIDI" device
```

## Troubleshooting

### No visuals appearing

1. **Check Chrome:** AKVJ requires Chrome/Chromium (Web MIDI API)
2. **Check console:** Press F12, look for "JSON for animations loaded"
3. **Check MIDI routing:** Ensure DAW outputs to virtual MIDI port
4. **Check channel numbers:** Use channels 1-16 in your DAW
5. **Check animation exists:** Verify folder at `animations/{ch-1}/{note}/{vel}/`

### Wrong Layer Group responding

Remember the channel mapping:

- Channels 1-4 = Layer Group A
- Channel 5 = Mixer
- Channels 6-9 = Layer Group B
- Channel 10 = Mixed output effects
- Channels 11-12 = Layer Group C (overlay layer)
- Channel 13 = Effects on entire output
- Channels 14-16 = Ignored

### Animation won't stop

Send a Note Off (velocity 0) on the same channel and note, or send a new note to replace it.

### Animations out of sync

Enable MIDI Clock output in your DAW to sync AKVJ to your tempo.

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════╗
║                AKVJ MIDI QUICK REFERENCE                  ║
╠═══════════════════════════════════════════════════════════╣
║ CHANNELS (0-15)                                           ║
║   0-3   = Layer Group A (Primary deck, 4 slots)                ║
║   4     = Mixer (B&W bitmask for Layer Group A and Layer Group B crossfading)        ║
║   5-8   = Layer Group B (Secondary deck, 4 slots)              ║
║   9     = Mixed output effects (on mixed Layer Group A and Layer Group B)                     ║
║   10-11 = Layer Group C (overlay layer, 2 slots)               ║
║   12    = Global effects (on entire output)                   ║
║   13-15 = Reserved (ignored)                             ║
║                                                           ║
║ NOTES (0-127)                                             ║
║   Each note triggers a different animation               ║
║   For effect channels (9, 12):                           ║
║     0-15   = Split      48-63  = Color                   ║
║     16-31  = Mirror     64-79  = Glitch                  ║
║     32-47  = Offset     80-95  = Strobe                  ║
║                                                           ║
║ VELOCITY (0-127)                                          ║
║   0     = Note Off (stop animation)                      ║
║   1-127 = Animation variant/intensity                    ║
║                                                           ║
║ FILE LOCATION                                             ║
║   animations/{channel}/{note}/{velocity}/sprite.png      ║
╚═══════════════════════════════════════════════════════════╝
```

## See Also

- [Animation Asset Guide](../animations/README.md) - Creating animations
- [MIDI Protocol Guide](./midi-protocol-guide.md) - Technical MIDI details
- [Web MIDI API Guide](./web-midi-api-guide.md) - Browser integration

---

Happy VJing! 🎨🎹✨
