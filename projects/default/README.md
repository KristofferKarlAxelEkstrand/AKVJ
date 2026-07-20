# Project: default

Clip bucket for the `default` project. Each clip has a stable **clipId** (folder name). MIDI placement is defined separately in this project's `key-map.json`. Every project under `projects/` has the same shape.

## Directory Structure

```
projects/default/
  clips/
    {clipId}/           # e.g. neon-skull or c1-n0-v0
      sprite.png        # Sprite sheet with all frames
      meta.json         # Clip metadata
  key-map.json          # MIDI → clipId mappings (DAW channels 1–16)
```

**Example mapping entry:**

```json
{
    "1": {
        "0": {
            "0": "neon-skull"
        }
    }
}
```

Mapping values can be either a clipId string (above) or an object with per-slot overrides:

```json
{
    "1": {
        "0": {
            "0": {
                "clipId": "neon-skull",
                "triggerType": "latch",
                "triggerGroup": "drums"
            }
        }
    }
}
```

Channel numbers in `key-map.json` use DAW display numbering (1–16). Runtime code channels remain 0–15. Layer routing by channel (`settings.channelMapping`) is unchanged.

## Creating a New Clip

### Option 1: Mainframe UI

```bash
npm run mainframe
```

Use **Upload** to ingest frames, **Mapping** to assign MIDI slots, then **Run pipeline**.

### Option 2: Scaffolding tool

```bash
npm run clips:new -- neon-skull
# Creates: projects/default/clips/neon-skull/meta.json
```

Then add `sprite.png`, map the clip in `projects/default/key-map.json`, and run `npm run clips`.

### Option 3: Manual

1. Create `projects/default/clips/{clipId}/`
2. Add `sprite.png` and `meta.json`
3. Add a mapping entry in `projects/default/key-map.json`

## meta.json Format

```json
{
    "name": "My Cool Clip",
    "png": "sprite.png",
    "frames": 64,
    "framesPerRow": 8,
    "playback": "loop",
    "retrigger": true,
    "frameDurationsMs": [83.33]
}
```

### Fields

| Field              | Type          | Required | Description                                                                                          |
| ------------------ | ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `png`              | string        | yes      | Sprite sheet filename (typically `sprite.png`)                                                       |
| `frames`           | number        | yes      | Total frames (`numberOfFrames` accepted as legacy alias)                                             |
| `framesPerRow`     | number        | yes      | Frames per row in sprite sheet                                                                       |
| `playback`         | string        | no       | Playback mode: `once`, `loop`, `pingpong`, `random`, `reverse`, `shuffle`, `scrub` (default: `loop`) |
| `retrigger`        | boolean       | no       | Restart on re-trigger (default: `true`)                                                              |
| `frameDurationsMs` | array         | no       | Duration in ms per frame (e.g. `[83.33]`)                                                            |
| `sync`             | string        | no       | Sync mode: `"free"` (default) or `"beat"` for BPM-synced clips                                       |
| `syncLength`       | string        | no       | When `sync: "beat"`: preset like `"1 bar"` or `"custom"`                                             |
| `syncBeats`        | number        | no       | When `syncLength: "custom"`: total beats for the clip                                                |
| `beatsPerBar`      | number        | no       | Time signature numerator for bar presets (default: 4)                                                |
| `bitDepth`         | number        | no       | For masks: 1, 2, 4, or 8                                                                             |
| `role`             | string        | no       | `"bitmask"` for mixer mask clips                                                                     |
| `triggerType`      | string        | no       | `momentary` (default), `latch`, or `one-shot`                                                        |
| `triggerGroup`     | string/number | no       | Choke group — triggering a clip stops all others in the same group                                   |
| `name`             | string        | no       | Human-readable clip name                                                                             |

### Legacy fields

- `numberOfFrames` — alias for `frames` (deprecated, use `frames`)
- `loop` — boolean, converted to `playback: "loop"` or `"once"` (deprecated, use `playback`)

### Bitmask / mixer clips

Clips used as mixer bitmasks set:

```json
{
    "role": "bitmask",
    "bitDepth": 1
}
```

Do not infer bitmask behavior from folder location — use `role`.

## Build pipeline

From repo root:

```bash
npm run clips
```

Pipeline: validate project clip bucket → optimize → generate `clips.json` → copy `key-map.json` + assets to `akvj/src/public/projects/default/clips/` (generated; do not hand-edit).
