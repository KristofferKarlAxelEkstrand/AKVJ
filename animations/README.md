# Animations

This folder contains the source animation assets for AKVJ. Animations are organized by MIDI channel, note, and velocity.

## Directory Structure

> **Note:** Source folder names use 1-16 (matching DAW channel display). The build pipeline automatically converts to 0-15 for code.

```
animations/
  {channel}/            # 0-15 (where 0 = DAW Channel 1)
    {note}/
      {velocity}/
        sprite.png      # Sprite sheet with all frames
        meta.json       # Animation metadata
```

**Example:** `animations/0/5/0/` = DAW Channel 1, Note 5, Velocity layer 0

## Creating a New Animation

### Option 1: Using the Scaffolding Tool

```bash
npm run animations:new 0 5 0
# Creates: animations/0/5/0/meta.json with template
# This is DAW Channel 1, Note 5, Velocity layer 0
```

Then add your `sprite.png` to the same folder and update `meta.json`.

### Option 2: Manual Creation

1. Create the folder structure: `animations/{channel}/{note}/{velocity}/`
2. Add your sprite sheet as `sprite.png`
3. Create `meta.json` with the required fields

## meta.json Format

```json
{
    "png": "sprite.png",
    "numberOfFrames": 64,
    "framesPerRow": 8,
    "loop": true,
    "retrigger": true,
    "frameRatesForFrames": {
        "0": 12
    }
}
```

### Required Fields

| Field            | Type   | Description                      |
| ---------------- | ------ | -------------------------------- |
| `png`            | string | Filename of the sprite sheet     |
| `numberOfFrames` | number | Total number of animation frames |
| `framesPerRow`   | number | How many frames fit in one row   |

### Optional Fields

| Field                 | Type            | Default | Description                                |
| --------------------- | --------------- | ------- | ------------------------------------------ |
| `loop`                | boolean         | true    | Whether animation loops                    |
| `retrigger`           | boolean         | true    | Restart animation on repeated MIDI trigger |
| `frameRatesForFrames` | object          | {0: 12} | Frame rate per frame index (fps)           |
| `frameDurationBeats`  | number \| array | null    | BPM-synced timing: beats per frame         |
| `bitDepth`            | number          | null    | Bit depth for mask mixing (1, 2, 4, or 8)  |

### Frame Rates

The `frameRatesForFrames` object maps frame indices to frame rates. The rate applies from that frame until the next defined rate:

```json
{
    "frameRatesForFrames": {
        "0": 12,
        "32": 24
    }
}
```

This plays frames 0-31 at 12 fps, then frames 32+ at 24 fps.

### BPM Sync (frameDurationBeats)

For tempo-synced animations, use `frameDurationBeats` instead of `frameRatesForFrames`:

```json
{
    "frameDurationBeats": 0.5
}
```

This plays each frame for half a beat (e.g., 250ms at 120 BPM).

**Array form** for per-frame timing:

```json
{
    "numberOfFrames": 4,
    "frameDurationBeats": [0.25, 0.5, 0.25, 1.0]
}
```

The array length must match `numberOfFrames`.

**Timing sources:**

- **MIDI Clock**: When active, uses real-time clock pulses (24 PPQN) for tight sync
- **BPM fallback**: Uses time-based calculation from current BPM setting

### Bit Depth (for Masks)

Mask animations on Channel 5 (folder `4/`) support `bitDepth` for crossfade control:

| bitDepth | Levels | Effect                    |
| -------- | ------ | ------------------------- |
| 1        | 2      | Hard cut (black/white)    |
| 2        | 4      | 4-level blend             |
| 4        | 16     | 16-level blend            |
| 8        | 256    | Smooth gradient crossfade |

## Sprite Sheet Format

- **Image format:** PNG with transparency
- **Frame size:** 240×135 pixels (matches canvas resolution)
- **Layout:** Frames arranged left-to-right, top-to-bottom
- **Color depth:** 8-bit palette recommended for smaller files

**Example:** 64 frames with 8 per row = 8 columns × 8 rows = 1920×1080 pixels

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ ... │     │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

## Creating Sprite Sheets from Frames

If you have individual frame images, use the sprite sheet generator:

```bash
node scripts/animations/spritesheet.js ./my-frames ./animations/0/3/0

# With options:
node scripts/animations/spritesheet.js ./my-frames ./animations/0/3/0 --frames-per-row 8 --frame-rate 12
```

**Input:** Folder with numbered frames (`frame001.png`, `frame002.png`, etc.)

**Output:** `sprite.png` + `meta.json` in the output folder

## Building Animations

After adding or modifying animations:

```bash
npm run animations          # Build once
npm run animations:watch    # Watch mode (auto-rebuild on changes)
npm run animations:clean    # Clear cache and regenerate
```

The build pipeline:

1. **Validates** all animations (checks meta.json and image dimensions)
2. **Optimizes** PNGs (8-bit palette compression)
3. **Generates** `animations.json` index
4. **Copies** to `src/public/animations/`

## Previewing Animations

Start the dev server and open the preview tool:

```bash
npm run dev
# Open http://localhost:5173/tools/animation-preview/
```

Features:

- Select any animation by channel/note/velocity
- Play/pause and step through frames
- View metadata and frame timing

## MIDI Mapping

| MIDI Parameter   | Animation Parameter                   |
| ---------------- | ------------------------------------- |
| Channel (1-16)   | Layer selection (matches folder name) |
| Note (0-127)     | Animation selection                   |
| Velocity (1-127) | Animation variant                     |

**Note:** Velocity 0 is interpreted as Note Off (stops the animation).

## Tips

- **Keep source files:** Only `animations/` is committed to git. The `src/public/animations/` folder is generated.
- **Use 8 frames per row:** Standard layout that works well with 240×135 frames.
- **Test frame rates:** Use the preview tool to fine-tune timing.
- **Optimize images:** The build pipeline compresses PNGs automatically, but starting with optimized source files helps.

## Troubleshooting

### "Validation failed" errors

Check that:

- `meta.json` is valid JSON
- `png` field matches the actual filename
- `numberOfFrames` and `framesPerRow` are positive numbers
- Image width is divisible by `framesPerRow`

### Animation not appearing

1. Run `npm run animations` to rebuild
2. Check browser console for loading errors
3. Verify the channel/note/velocity path is correct

### Animation plays too fast/slow

Adjust `frameRatesForFrames` in `meta.json`. Values are in frames per second (fps).
