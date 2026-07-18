# Clip Format Goals

The JSON schema for clips (specifically `meta.json`, `clips.json`, and `key-map.json`) is the foundational bridge of the entire AKVJ architecture. It must adhere to the following strict principles:

### 1. Human First (KISS)
- **Human Readable**: A user should be able to open any clip JSON file in a text editor and instantly understand what every field means. Use simple, unambiguous naming conventions.
- **Human Editable**: The baseline workflow for adding a clip is completely manual: a user drops a sprite into a folder and writes the `meta.json` by hand. The format must remain simple enough that doing this is easy and error-free.
- **Logical Structure**: Avoid deeply nested, convoluted structures. Keep fields as flat and logical as possible.

### 2. Machine Compatible
- **mainframe Readable**: The `mainframe` UI is a powerful tool to provide a great overview, a good visual feel, and bulk operations. It must cleanly read and write the exact same format that a human would write, without injecting unnecessary bloat or stripping human formatting.
- **akvj Readable**: The lightweight visualizer must be able to quickly ingest this format for 60fps high-performance rendering.

**Golden Rule:** If a schema change makes the JSON file harder for a human to write by hand, it is a bad change.

### 3. Clip rendering fields (engine-consumed)

The following fields in `meta.json` control how the engine draws a clip cell onto the 240×135 output canvas:

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `frameWidth` | number | 240 | Cell width in pixels |
| `frameHeight` | number | 135 | Cell height in pixels |
| `scaleMode` | string | `fit` | How the cell fills the canvas: `fit`, `cover`, `stretch`, `none`, `pattern` |
| `placement` | object `{ x, y }` | `{ x: 0, y: 0 }` | Offset from center of screen, in pixels. `0,0` = centered. Ignored when `scaleMode: "stretch"`. |

**`pattern` mode:** tiles the cell to fill the canvas instead of stretching. The cell is drawn at its native size and repeated in both X and Y. Placement shifts the tile grid origin.

**Whole-pixel rule:** all draw positions and sizes in `akvj` must resolve to integer pixels (`Math.floor()` at every draw-call boundary). This is an engine-wide constraint, not a per-clip setting. The existing `imageSmoothingEnabled: false` only prevents scaling interpolation; sub-pixel positions would still cause edge anti-aliasing. The `floor()` rule eliminates that.

**Legacy clips** without `frameWidth`/`frameHeight`/`scaleMode`/`placement` remain valid — defaults are applied by `normalizeClipMetadata`. No migration required.

### 4. Timing & sync (`meta.json`)

Author-facing beat sync expands into `frameDurationBeats` at load (`normalizeClipMetadata`). Free / FPS clips keep using `frameRatesForFrames` only.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `sync` | `"free"` \| `"beat"` | `free` (omit = free) | Sync mode |
| `syncLength` | string | — | Required when `sync` is `"beat"`. Presets: `1/4 beat`, `1/2 beat`, `1 beat`, `2 beats`, `1 bar`, `2 bars`, `4 bars`, `8 bars`, or `custom` |
| `syncBeats` | number | — | Required when `syncLength` is `"custom"` — total clip length in beats |
| `beatsPerBar` | positive integer | `4` | Meter numerator for bar presets (e.g. `3` for 3/4) |
| `frameDurationBeats` | number \| number[] | — | Explicit beats-per-frame; **wins over** sync expansion if set |
| `frameRatesForFrames` | object | — | Free-mode FPS weights; also used as relative weights when expanding beat sync |

**Preset constants** live in `akvj/.../clipMetadata.js` (`SYNC_LENGTH_PRESETS`, …) and are mirrored in `mainframe/shared/clipSchema.js` (no cross-realm import). Mainframe editor length dropdown is filled from that shared list.

**BPM when no clock / no BPM CC:** engine uses `settings.bpm.default` (**120**). Beat → ms is `(beats * 60000) / bpm`. Mainframe StagingPreview uses the same 120 for live beat-sync preview.

**Mapping overrides:** a `key-map.json` velocity leaf may be a bare clip id string or
`{ "clipId": "…", "sync": "beat", "syncLength": "2 bars", "beatsPerBar": 4 }` (also `triggerType` / `triggerGroup`). Same field rules as meta; see `mainframe/shared/mappingLeaf.js`.
