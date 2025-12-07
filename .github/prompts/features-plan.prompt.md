# AKVJ Feature Plan: Advanced Layering, Mixing, Effects & BPM Sync

## Overview

This document outlines the planned features for AKVJ to transform it into a more powerful VJ tool with DJ-style deck mixing, visual effects, and BPM synchronization.

---

## 1. Multi-Layer Architecture (DJ Deck Style)

### Concept

Instead of a single layer of animations, AKVJ will support **three distinct layer groups** (A, B, C) with a **crossfader/mixer** system using black-and-white bitmask animations.

### MIDI Channel Mapping (0-15, displayed as 1-16)

| Channel (0-indexed) | Channel (Display) | Purpose                                            |
| ------------------- | ----------------- | -------------------------------------------------- |
| 0                   | 1                 | Layer A - Animation Slot 1                         |
| 1                   | 2                 | Layer A - Animation Slot 2                         |
| 2                   | 3                 | Layer A - Animation Slot 3                         |
| 3                   | 4                 | Layer A - Animation Slot 4                         |
| 4                   | 5                 | **Mixer/Crossfader** - B&W bitmask animations      |
| 5                   | 6                 | Layer B - Animation Slot 1                         |
| 6                   | 7                 | Layer B - Animation Slot 2                         |
| 7                   | 8                 | Layer B - Animation Slot 3                         |
| 8                   | 9                 | Layer B - Animation Slot 4                         |
| 9                   | 10                | **Effects A/B** - Crude effects for Layer A/B      |
| 10                  | 11                | Layer C - Overlay Slot 1 (logos, overlays)         |
| 11                  | 12                | Layer C - Overlay Slot 2 (logos, overlays)         |
| 12                  | 13                | **Global Effects** - Effects applied to everything |
| 13                  | 14                | Reserved (future use)                              |
| 14                  | 15                | Reserved (future use)                              |
| 15                  | 16                | Reserved (future use)                              |

### Layer Groups

#### Layer A (Channels 0-3)

- Primary animation deck
- 4 slots for simultaneous animations
- Can layer animations on top of each other within the group

#### Layer B (Channels 5-8)

- Secondary animation deck
- 4 slots for simultaneous animations
- Mixed with Layer A via the Mixer channel

#### Mixer (Channel 4)

- Uses **black-and-white bitmask animations**
- Pure black pixels → show Layer A
- Pure white pixels → show Layer B
- Creates visual crossfading/transitions between decks
- Trigger different mask patterns via MIDI notes
- Velocity could control mask animation speed or transition style

#### Layer C (Channels 10-11)

- **Overlay layer** - always on top
- Useful for logos, persistent graphics, watermarks
- 2 slots for overlay animations
- Rendered after A/B mixing and effects

---

## 2. Bitmask Mixing System

### How It Works

```
Final Pixel = (maskPixel === black) ? LayerA_Pixel : LayerB_Pixel
```

For grayscale masks (smooth blending):

```javascript
// Optimized blend formula: A + (B - A) * alpha
// Only 3 multiplications instead of 6
const alpha = maskPixel / 255;
output.r = layerA.r + (layerB.r - layerA.r) * alpha;
output.g = layerA.g + (layerB.g - layerA.g) * alpha;
output.b = layerA.b + (layerB.b - layerA.b) * alpha;
```

### Bitmask Animation Requirements

- **Format**: True **grayscale PNG** (not RGB with equal values)
- **Bit Depth**: Configurable per animation via `meta.json`
- **Location**: Channel 4 folder (or any animation with `bitDepth` set)
- **Structure**: Same channel/note/velocity organization as regular animations

### PNG Bit Depth Options

All animations can specify a `bitDepth` in their `meta.json`:

| bitDepth      | Colors     | File Size | Use Case                           | PNG Native?          |
| ------------- | ---------- | --------- | ---------------------------------- | -------------------- |
| **1**         | 2 (B&W)    | Smallest  | Hard cuts, crisp masks             | ✅ Yes               |
| **2**         | 4 shades   | Small     | Subtle transitions                 | ❌ (4-color indexed) |
| **4**         | 16 shades  | Small     | More gradation                     | ✅ Yes               |
| **8**         | 256 shades | Medium    | Smooth gradients, dissolves        | ✅ Yes               |
| **(default)** | Full color | Original  | Regular animations (no conversion) | ✅ Yes               |

**PNG native grayscale bit depths**: 1, 2, 4, 8, 16
**Note**: 2-bit is technically supported by PNG spec but Sharp outputs as 4-color indexed palette.

### meta.json Configuration

```json
{
    "numberOfFrames": 10,
    "framesPerRow": 5,
    "loop": true,
    "bitDepth": 1
}
```

| `bitDepth` Value | Output Format                              |
| ---------------- | ------------------------------------------ |
| `1`              | 1-bit indexed (2 colors: black & white)    |
| `2`              | 2-bit indexed (4 grayscale levels)         |
| `8`              | 8-bit true grayscale (256 levels)          |
| _(omitted)_      | Standard palette optimization (full color) |

### Why True Grayscale PNG?

- **3x smaller file size** than RGB (1 channel vs 3)
- Canvas converts to RGBA at runtime anyway
- At runtime, just read the R channel (R === G === B for grayscale)
- Sharp outputs true grayscale format with `.grayscale()`

### Automatic Conversion in Build Pipeline

The animation pipeline (`scripts/animations/lib/optimize.js`) converts based on:

1. **Channel 4** (bitmask channel): Auto-converts to 1-bit if no `bitDepth` specified
2. **`bitDepth` in meta.json**: Respects explicit setting for any animation

```javascript
// In optimize.js
function getTargetBitDepth(animationPath, meta) {
    // Explicit bitDepth in meta.json takes priority
    if (meta?.bitDepth) {
        return meta.bitDepth;
    }
    // Channel 4 defaults to 1-bit for bitmasks
    const channel = parseInt(animationPath.split('/')[0], 10);
    if (channel === BITMASK_CHANNEL) {
        return 1;
    }
    // Regular animations: no bit depth conversion
    return null;
}

// Sharp conversion based on bitDepth:
switch (bitDepth) {
    case 1:
        // 1-bit: threshold to pure B&W
        pipeline = pipeline.grayscale().threshold(128).png({ palette: true, colors: 2 });
        break;
    case 2:
        // 2-bit: 4 grayscale levels
        pipeline = pipeline.grayscale().png({ palette: true, colors: 4 });
        break;
    case 8:
        // 8-bit: true grayscale (256 levels)
        pipeline = pipeline.grayscale().png({ palette: true, colors: 256 });
        break;
    default:
        // Standard color optimization
        pipeline = pipeline.png({ palette: true, quality: 80 });
}
```

### Runtime Performance

| bitDepth | Blend Operations      | Notes                                 |
| -------- | --------------------- | ------------------------------------- |
| 1        | 0 muls (just branch)  | `mask < 128 ? A : B`                  |
| 2        | 0 muls (4-way branch) | 4 discrete levels                     |
| 8        | 3 muls per pixel      | `A + (B-A) * alpha` optimized formula |

### Usage

**For bitmask animations (channel 4):**

- Place any image in `animations/4/{note}/{velocity}/`
- Automatically converted to 1-bit B&W (unless `bitDepth` specified in meta.json)

**For any animation with custom bit depth:**

```json
// meta.json
{
    "numberOfFrames": 10,
    "framesPerRow": 5,
    "bitDepth": 8
}
```

**Build command:**

```bash
npm run generate-animation-json-to-json  # or full pipeline
```

### Implementation Notes

```javascript
// Runtime mixing based on bit depth
function mixPixel(maskValue, layerA, layerB, bitDepth) {
    switch (bitDepth) {
        case 1:
            return maskValue < 128 ? layerA : layerB;
        case 2:
            // 4 levels: 0, 85, 170, 255
            const level = Math.floor(maskValue / 64);
            const alpha = level / 3;
            return blend(layerA, layerB, alpha);
        case 8:
            // Smooth blend: A + (B - A) * alpha
            const alpha8 = maskValue / 255;
            return {
                r: layerA.r + (layerB.r - layerA.r) * alpha8,
                g: layerA.g + (layerB.g - layerA.g) * alpha8,
                b: layerA.b + (layerB.b - layerA.b) * alpha8
            };
    }
}
```

### Canvas Compositing (Performance Option)

Could use Canvas 2D `globalCompositeOperation` modes:

- `source-in` / `source-out` / `destination-in` for masking
- Multiple off-screen canvases for layer composition

---

## 3. Effects System

### Design Philosophy

- **Crude/Lo-fi aesthetic** - matches the pixel art style
- **Real-time** - must maintain 60fps
- **MIDI-triggered** - effects activated via notes, modified via velocity

### Effects Channel A/B (Channel 9)

Effects that apply to the mixed A/B output:

| Note Range | Effect                                            |
| ---------- | ------------------------------------------------- |
| 0-15       | **Split/Divide** - Split screen into sections     |
| 16-31      | **Mirror** - Horizontal/vertical/quad mirroring   |
| 32-47      | **Offset/Shift** - Pixel displacement             |
| 48-63      | **Color Effects** - Invert, threshold, posterize  |
| 64-79      | **Glitch** - Random pixel displacement, scanlines |
| 80-95      | **Strobe** - Flash effects                        |
| 96-111     | **Zoom/Scale** - Crude scaling effects            |
| 112-127    | Reserved                                          |

### Global Effects (Channel 12)

Effects that apply to the entire output (after all layers):

- Same effect categories as above
- Could include feedback/echo effects
- Border/frame effects

### Effect Parameters

- **Velocity (0-127)**: Controls effect intensity/variation
- **Note**: Selects specific effect
- **Note On/Off**: Enables/disables effect

### Effect Stacking Order

1. Effects are applied in **ascending note order** (lower notes first)
2. Multiple effects of the **same type don't stack** (last wins)
3. **Velocity 0** = disable effect, **1-127** = intensity

---

## 4. BPM Synchronization

### Concept

Animation playback speed syncs to a BPM (Beats Per Minute) value, allowing beat-matched visuals.

### BPM Sources (Priority Order)

1. **MIDI Clock (0xF8)** - Default, syncs with DJ software/DAWs/hardware
2. **CC Knob** - Manual override/fallback

### MIDI Clock Sync (Default)

MIDI clock sends 24 pulses per quarter note (24 PPQN). BPM is calculated from timing:

```javascript
// MIDI Clock: 24 pulses per beat
// Track time between pulses to calculate BPM
let lastClockTime = null;
let clockCount = 0;
let accumulatedTime = 0;
let smoothedBPM = 120; // Start with default

function handleMIDIClock(timestamp) {
    if (lastClockTime !== null) {
        accumulatedTime += timestamp - lastClockTime;
        clockCount++;

        // Calculate BPM every 24 pulses (1 beat)
        if (clockCount >= 24) {
            const msPerBeat = accumulatedTime;
            const rawBPM = 60000 / msPerBeat;

            // Apply exponential smoothing to reduce jitter
            // USB MIDI has ~1-3ms jitter which can cause ±5 BPM fluctuation
            smoothedBPM = smoothedBPM * 0.9 + rawBPM * 0.1;
            setBPM(smoothedBPM);

            clockCount = 0;
            accumulatedTime = 0;
        }
    }
    lastClockTime = timestamp;
}
```

### MIDI CC Fallback/Override

MIDI CC messages send values 0-127. Maps to BPM range:

#### BPM Range: 10-522 BPM

```javascript
// CC value (0-127) to BPM (10-522)
const MIN_BPM = 10;
const MAX_BPM = 522;
const BPM_RANGE = MAX_BPM - MIN_BPM; // 512

function ccToBPM(ccValue) {
    // ccValue: 0-127
    return MIN_BPM + (ccValue / 127) * BPM_RANGE;
}

// Examples:
// CC 0   → 10 BPM
// CC 64  → ~266 BPM
// CC 127 → 522 BPM
```

### Default Settings

| Setting             | Default Value | Description                             |
| ------------------- | ------------- | --------------------------------------- |
| `useMIDIClock`      | true          | Use MIDI clock as primary BPM source    |
| `bpmControlCC`      | 0 (CC0)       | Which CC number controls BPM (fallback) |
| `bpmControlChannel` | 0 (Ch 1)      | Which MIDI channel to listen on         |
| `defaultBPM`        | 120           | Default BPM when no clock/CC received   |
| `minBPM`            | 10            | Minimum BPM value                       |
| `maxBPM`            | 522           | Maximum BPM value                       |

### Configurable Settings (in `settings.js`)

```javascript
const settings = {
    // ... existing settings ...

    bpm: {
        default: 120,
        min: 10,
        max: 522,
        // MIDI Clock (primary)
        useMIDIClock: true, // Listen to 0xF8 timing messages
        // MIDI CC (fallback/override)
        controlCC: 0, // CC number (0-127)
        controlChannel: 0 // MIDI channel (0-15)
    },

    // Channel assignments (configurable)
    channelMapping: {
        layerA: [0, 1, 2, 3],
        mixer: 4,
        layerB: [5, 6, 7, 8],
        effectsAB: 9,
        layerC: [10, 11],
        effectsGlobal: 12,
        reserved: [13, 14, 15]
    }
};
```

### How BPM Affects Animations

1. **Frame Rate Sync**: Animation playback speed tied to beat
    - 1 beat = 1 animation cycle
    - Or configurable: 1/2 beat, 1/4 beat, 2 beats, 4 beats per cycle

2. **Beat Divisions**:

    ```javascript
    // Milliseconds per beat
    const msPerBeat = 60000 / bpm;

    // For an animation to complete in 1 beat:
    const frameDelay = msPerBeat / animation.frameCount;
    ```

3. **Sync Modes** (velocity could select):
    - `1:1` - Animation completes on each beat
    - `1:2` - Animation completes every 2 beats
    - `1:4` - Animation completes every 4 beats (1 bar in 4/4)
    - `2:1` - Animation plays twice per beat
    - `4:1` - Animation plays 4 times per beat

4. **Sync Mode in meta.json** (recommended):

    Instead of using velocity for sync mode selection, define it per animation:

    ```json
    {
        "numberOfFrames": 10,
        "framesPerRow": 5,
        "syncMode": "1:4",
        "loop": true
    }
    ```

    This frees velocity for intensity/variation control. Valid values:
    - `"1:1"`, `"1:2"`, `"1:4"`, `"2:1"`, `"4:1"`
    - `"free"` - ignore BPM, use frameRatesForFrames (default for backwards compatibility)

---

## 5. MIDI Message Handling Updates

### Current: Note On/Off only

The current `midi.js` only handles Note On (0x9n) and Note Off (0x8n).

### Required: Add Control Change (0xBn) and System Real-Time Messages

```javascript
// Add to settings.js
commands: {
    noteOff: 8,       // 0x8n
    noteOn: 9,        // 0x9n
    controlChange: 11 // 0xBn - NEW
},
systemRealTime: {
    clock: 0xF8,      // MIDI Clock pulse (24 per beat)
    start: 0xFA,      // Start playback
    continue: 0xFB,   // Continue playback
    stop: 0xFC        // Stop playback
}

// In midi.js #handleMIDIMessage:
case this.#commandControlChange:
    appState.dispatchMIDIControlChange(channel, controller, value);
    break;

// System Real-Time messages are single-byte (no channel)
if (status === 0xF8) {
    appState.dispatchMIDIClock(performance.now());
}
```

### AppState Updates Needed

```javascript
// New dispatch method
dispatchMIDIControlChange(channel, controller, value) {
    // If this is the BPM controller
    if (channel === settings.bpm.controlChannel &&
        controller === settings.bpm.controlCC) {
        this.setBPM(ccToBPM(value));
    }
    // Dispatch generic CC event for other uses
    this.dispatchEvent('midi:cc', { channel, controller, value });
}
```

---

## 6. Implementation Phases

### Phase 1: Foundation

- [ ] Update `settings.js` with channel mapping and BPM config
- [ ] Add CC handling to `midi.js`
- [ ] Add BPM state to `AppState.js`
- [ ] Update dispatch methods

### Phase 2: Layer Architecture

- [ ] Create `LayerGroup` class (manages 4 animation slots)
- [ ] Update `LayerManager` to handle A, B, C groups
- [ ] Modify `Renderer` for multi-layer composition

### Phase 3: Bitmask Mixing

- [ ] Create mask animation loader/storage
- [ ] Implement pixel-level mixing in renderer
- [ ] Add mask animation triggers (channel 4)

### Phase 4: BPM Sync

- [ ] Implement BPM-based frame timing
- [ ] Add sync mode selection (velocity-based)
- [ ] Test with various BPM values

### Phase 5: Effects

- [ ] Create base `Effect` class
- [ ] Implement crude effects (split, mirror, invert, etc.)
- [ ] Wire effects to channels 9 and 12
- [ ] Velocity-based intensity control

### Phase 6: Testing & Optimization

- [ ] Performance testing at 60fps
- [ ] Memory management for multi-layer
- [ ] MIDI latency testing (<20ms)

---

## 7. Technical Considerations

### Performance

- Use off-screen canvases for layer composition
- Pre-compute masks when possible
- Avoid per-pixel loops in JavaScript (use Canvas operations)
- Consider WebGL for future optimization

### Memory

- Each layer group = up to 4 active animations × frames × pixel data
- Masks add additional memory footprint
- Implement proper cleanup when animations change

### Canvas Composition Order

```
1. Render Layer A (4 slots) → canvasA
2. Render Layer B (4 slots) → canvasB
3. Render Mask → canvasMask
4. Composite A + B using Mask → canvasMixed
5. Apply Effects A/B to canvasMixed
6. Render Layer C (2 slots) on top
7. Apply Global Effects
8. Output to visible canvas
```

---

## 8. Open Questions

1. ~~**Mask granularity**: Should masks support grayscale for smooth transitions, or stick to pure B&W for crisp cuts?~~
   **RESOLVED**: Support multiple bit depths via `bitDepth` in meta.json:
    - **1-bit**: 2 colors (pure B&W, hard cuts) - default for channel 4
    - **2-bit**: 4 grayscale levels (not native PNG, uses 4-color indexed palette)
    - **4-bit**: 16 grayscale levels (native PNG support)
    - **8-bit**: 256 grayscale levels (smooth gradients, dissolves)

    All saved as **true grayscale PNG** for smallest file size.

2. ~~**Effect stacking**: Can multiple effects be active simultaneously?~~
   **RESOLVED**: Yes. Effects work similarly to animations - multiple can be active at once via different MIDI notes on the effects channels (9 and 12). Effects are applied in order and can stack/combine.

3. ~~**MIDI learn**: Should users be able to reassign CC/channel mappings at runtime?~~
   **RESOLVED**: No. Mappings are configured in `settings.js` and require a rebuild/reload to change. No runtime MIDI learn feature.

4. ~~**Tap tempo**: Should there be a MIDI note for tap tempo in addition to CC knob?~~
   **RESOLVED**: No. BPM is controlled only via CC knob.

5. ~~**MIDI clock**: Should AKVJ listen to external MIDI clock (0xF8) for BPM instead of/in addition to CC?~~
   **RESOLVED**: Yes. MIDI clock (0xF8) is the **default** method for BPM sync. CC knob available as fallback/override. This allows sync with DJ software, DAWs, and hardware sequencers.

---

## Notes on MIDI CC Values

MIDI Control Change (CC) messages:

- **Format**: `[0xBn, controller, value]`
- **controller**: CC number 0-127
- **value**: 0-127

Common CC assignments (can be changed):

- CC0: Bank Select MSB (often unused, good for BPM)
- CC1: Modulation wheel
- CC7: Volume
- CC10: Pan
- CC64: Sustain pedal

For maximum flexibility, the BPM CC should be configurable in settings.
