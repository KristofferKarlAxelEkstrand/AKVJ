# Clips

Shared clip bucket for AKVJ. Each clip has a stable **clipId** (folder name). MIDI placement is defined separately in `set-mapping.json`.

## Directory Structure

```
clips/
  {clipId}/             # e.g. neon-skull or c1-n0-v0
    sprite.png          # Sprite sheet with all frames
    meta.json           # Clip metadata
  set-mapping.json      # MIDI → clipId mappings (DAW channels 1–16)
```

**Example mapping entry:**

```json
{
    "channel": 1,
    "note": 60,
    "velocity": 127,
    "clipId": "neon-skull"
}
```

Channel numbers in `set-mapping.json` use DAW display numbering (1–16). Runtime code channels remain 0–15. Layer routing by channel (`settings.channelMapping`) is unchanged.

## Creating a New Clip

### Option 1: Mainframe UI

```bash
npm run mainframe
```

Use **Upload** to ingest frames, **Mapping** to assign MIDI slots, then **Run pipeline**.

### Option 2: Scaffolding tool

```bash
npm run clips:new -- neon-skull
# Creates: clips/neon-skull/meta.json
```

Then add `sprite.png`, map the clip in `set-mapping.json`, and run `npm run clips`.

### Option 3: Manual

1. Create `clips/{clipId}/`
2. Add `sprite.png` and `meta.json`
3. Add a mapping entry in `set-mapping.json`

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

### Bitmask / mixer clips

Clips used as mixer bitmasks set:

```json
{
    "role": "bitmask",
    "bitDepth": 1
}
```

Do not infer bitmask behavior from folder location — use `role`.

### Timing fields

- `frameRatesForFrames` — FPS-based timing
- `frameDurationBeats` — BPM-synced timing (number or per-frame array)

## Build pipeline

From repo root:

```bash
npm run clips
```

Pipeline: validate flat bucket → optimize → generate flat `clips.json` → copy `set-mapping.json` + assets to `akvj/src/public/clips/` (generated; do not hand-edit).
