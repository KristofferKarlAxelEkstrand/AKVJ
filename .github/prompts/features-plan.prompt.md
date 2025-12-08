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

**Note**: Channels 13-15 are ignored by the layer system. Animations placed in these channels will not play.

### Layer Groups

#### Layer A (Channels 0-3)

- Primary animation deck
- 4 slots for simultaneous animations
- Can layer animations on top of each other within the group
- **Compositing order**: Lower channel renders first (bottom), higher channel on top
- **Within a channel**: Lower note number renders first (bottom), higher notes on top

#### Layer B (Channels 5-8)

- Secondary animation deck
- 4 slots for simultaneous animations
- Mixed with Layer A via the Mixer channel
- **Compositing order**: Same as Layer A (lower channel/note = bottom)

#### Mixer (Channel 4)

- Uses **black-and-white bitmask animations**
- Pure black pixels → show Layer A
- Pure white pixels → show Layer B
- **Only one mask active at a time** (unlike layers A/B/C which support multiple)
- **Latches to last triggered note/velocity** - stays active until another mask is triggered
- **Before first trigger** → show Layer A only (default behavior)
- **After first trigger** → always has one mask active (no way to "clear" back to Layer A only)
- Each **note = different transition type** (wipe, dissolve, pattern, etc.)
- **Velocity = variant/intensity** within that transition type
- Higher velocity → more intense/dramatic variant of the same transition
- Masks can be animated (frame-based like regular animations)
- Masks support `beatsPerFrame` in meta.json (same format as all other animations)
- **If Layer B is empty**: White mask pixels show transparent (black background)

#### Layer C (Channels 10-11)

- **Overlay layer** - always on top
- Useful for logos, persistent graphics, watermarks
- 2 slots for overlay animations
- Rendered after A/B mixing and Effects A/B
- **NOT affected by Effects A/B** - only Global Effects (channel 12) apply
- **Compositing**: Standard `source-over` with alpha transparency
- **Expected format**: PNGs with alpha channel for transparency

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
- **Bit Depth**: **✅ CURRENT:** Channel 4 animations auto-convert to 1-bit. **⚠️ PLANNED:** Configurable bitDepth via `meta.json` for multi-bit masks (2, 4, 8-bit).
- **Location**: Channel 4 folder (or any animation with `bitDepth` set)
- **Structure**: Same channel/note/velocity organization as regular animations

### PNG Bit Depth Options

**⚠️ PLANNED - Build pipeline ready, runtime support incomplete:**

All animations can specify a `bitDepth` in their `meta.json` for future multi-bit mixing:

| bitDepth      | Colors     | File Size | Use Case                           | PNG Native?          |
| ------------- | ---------- | --------- | ---------------------------------- | -------------------- |
| **1**         | 2 (B&W)    | Smallest  | Hard cuts, crisp masks             | ✅ Yes               |
| **2**         | 4 shades   | Small     | Subtle transitions                 | ❌ (4-color indexed) |
| **4**         | 16 shades  | Small     | More gradation                     | ✅ Yes               |
| **8**         | 256 shades | Medium    | Smooth gradients, dissolves        | ✅ Yes               |
| **(default)** | Full color | Original  | Regular animations (no conversion) | ✅ Yes               |

**PNG native grayscale bit depths**: 1, 2, 4, 8, 16
**Note**: 2-bit is technically supported by PNG spec but Sharp outputs as 4-color indexed palette.

### meta.json Configuration (Planned)

**⚠️ PLANNED - Not yet supported:**

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
| `4`              | 4-bit indexed (16 grayscale levels)        |
| `8`              | 8-bit true grayscale (256 levels)          |
| _(omitted)_      | Standard palette optimization (full color) |

### Why True Grayscale PNG?

- **3x smaller file size** than RGB (1 channel vs 3)
- Canvas converts to RGBA at runtime anyway
- At runtime, just read the R channel (R === G === B for grayscale)
- Sharp outputs true grayscale format with `.grayscale()`

### Automatic Conversion in Build Pipeline

**✅ CURRENT IMPLEMENTATION:**

The build pipeline currently supports:

1. **Channel 4** (bitmask channel): Auto-converts to 1-bit grayscale for hard-cut masks
2. All channel 4 animations are converted to 1-bit black & white for crisp masking

**⚠️ PLANNED - Build code exists but not fully integrated:**

The `optimize.js` script has infrastructure for configurable bitDepth via `meta.json`, but this isn't exposed or tested yet:

```javascript
// ⚠️ PLANNED - Code exists but not active in current build
function getTargetBitDepth(animationPath, meta) {
    // Explicit bitDepth in meta.json takes priority
    if (meta?.bitDepth !== undefined) {
        const depth = meta.bitDepth;
        if (VALID_BIT_DEPTHS.has(depth)) {
            return depth;
        }
        console.warn(`Invalid bitDepth ${depth} in ${animationPath}/meta.json, ignoring`);
    }

    // Channel 4 defaults to 1-bit for bitmasks
    const channel = parseInt(animationPath.split('/')[0], 10);
    if (channel === BITMASK_CHANNEL) {
        return 1;
    }
    // Regular animations: no bit depth conversion
    return null;
}

// Sharp conversion pipeline (infrastructure ready):
switch (bitDepth) {
    case 1:
        // 1-bit: threshold to pure B&W
        pipeline = pipeline.grayscale().threshold(128).png({ palette: true, colors: 2 });
        break;
    case 2:
        // 2-bit: 4 grayscale levels
        pipeline = pipeline.grayscale().png({ palette: true, colors: 4 });
        break;
    case 4:
        // 4-bit: 16 grayscale levels
        pipeline = pipeline.grayscale().png({ palette: true, colors: 16 });
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

### Implementation Notes (Planned for Runtime Mixing)

**⚠️ PLANNED - NOT YET IMPLEMENTED:** The following runtime mixing code is a design proposal for future implementation:

```javascript
// Runtime mixing based on bit depth
function mixPixel(maskValue, layerA, layerB, bitDepth) {
    switch (bitDepth) {
        case 1:
            return maskValue < 128 ? layerA : layerB;
        case 2:
            // 4 levels: 0, 85, 170, 255
            const level2 = Math.floor(maskValue / 64);
            const alpha2 = level2 / 3;
            return blend(layerA, layerB, alpha2);
        case 4:
            // 16 levels: 0, 17, 34, ... 255
            const level4 = Math.floor(maskValue / 16);
            const alpha4 = level4 / 15;
            return blend(layerA, layerB, alpha4);
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

### Runtime Performance (Planned)

**⚠️ PLANNED - NOT YET IMPLEMENTED:** Performance characteristics for different bit depths:

| bitDepth | Blend Operations       | Notes                                 |
| -------- | ---------------------- | ------------------------------------- |
| 1        | 0 muls (just branch)   | `mask < 128 ? A : B`                  |
| 2        | 0 muls (4-way branch)  | 4 discrete levels                     |
| 4        | 0 muls (16-way branch) | 16 discrete levels                    |
| 8        | 3 muls per pixel       | `A + (B-A) * alpha` optimized formula |

### Usage

**✅ CURRENT IMPLEMENTATION:** For bitmask animations (channel 4):

- Place any image in `animations/4/{note}/{velocity}/`
- Automatically converted to 1-bit B&W during build
- **Note** = transition type (e.g., note 0 = horizontal wipe, note 1 = vertical wipe, note 2 = diagonal, etc.)
- **Velocity** = variant/intensity (higher velocity → more dramatic variant)
- Only one mask active at a time; new note replaces previous mask

**⚠️ PLANNED:** For animations with custom bit depth (not yet available):

```json
// meta.json (planned, not yet supported)
{
    "numberOfFrames": 10,
    "framesPerRow": 5,
    "bitDepth": 8
}
```

**Build command:**

```bash
npm run generate-animation-json-to-json  # Rebuild after adding/changing animations
```

### Canvas Compositing (Performance Option - Planned)

**⚠️ PLANNED - NOT YET IMPLEMENTED:**

Could use Canvas 2D `globalCompositeOperation` modes:

- `source-in` / `source-out` / `destination-in` for masking
- Multiple off-screen canvases for layer composition

**Implementation Strategy:**

1. **First try**: Canvas composite operations (faster, GPU-accelerated)
2. **Fall back to**: Per-pixel JavaScript mixing only if Canvas ops can't achieve the effect
3. Per-pixel at 240×135 = 32,400 pixels × 4 channels × 60fps = 7.8M ops/sec (risky but doable)

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
| 96-127     | Reserved                                          |

### Global Effects (Channel 12)

Effects that apply to the entire output (after all layers):

- Same effect categories as above
- Could include feedback/echo effects
- Border/frame effects

### Effect Parameters

- **Velocity (0-127)**: Controls effect intensity/variation
- **Note**: Selects specific effect
- **Note On/Off**: Enables/disables effect
- **Effects are NOT latched**: Note Off immediately disables the effect (unlike masks which latch)

### Effect Stacking Order

1. Effects are applied in **ascending note order** (lower notes first)
2. Multiple effects of the **same type don't stack** (last wins)
3. **Velocity 0** = disable effect, **1-127** = intensity

**Effect Type Determination:**

- Effect "type" is determined by **note range** (0-15, 16-31, 32-47, etc.)
- Within a range, only one effect can be active (last note pressed wins)
- Effects from **different ranges** can stack (e.g., Mirror + Invert)
- Example: Note 5 (Split) + Note 20 (Mirror) = both active; Note 5 + Note 10 = only Note 10 active

---

## 4. BPM Synchronization

### Concept

Animation playback speed syncs to a BPM (Beats Per Minute) value, allowing beat-matched visuals.

### BPM Sources (Priority Order)

1. **MIDI Clock (0xF8)** - Default, syncs with DJ software/DAWs/hardware
2. **CC Knob** - Manual override/fallback
3. **Default BPM** - Used on startup before any external source is received (`settings.bpm.default`: 120)

**Startup behavior**: Animations with `beatsPerFrame` set will sync to the default 120 BPM until MIDI clock or CC is received.

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
            // Smoothing factor configurable in settings.bpm.smoothingFactor (default 0.9)
            const smoothingFactor = settings.bpm.smoothingFactor;
            smoothedBPM = smoothedBPM * smoothingFactor + rawBPM * (1 - smoothingFactor);
            setBPM(smoothedBPM);

            clockCount = 0;
            accumulatedTime = 0;
        }
    }
    lastClockTime = timestamp;
}
```

### MIDI CC Fallback/Override

MIDI CC messages send values 0-127. Maps to BPM range.

**Priority**: MIDI clock always wins when active. CC is only used as fallback:

- If no clock pulses received for >2 seconds, CC becomes active
- Once clock resumes, CC is ignored again
- This allows manual BPM control when no external clock source is connected

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
        smoothingFactor: 0.9, // Exponential smoothing (0.9 = 90% old + 10% new)
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

1. **Core Formula**:

    ```javascript
    // Milliseconds per beat at given BPM
    const msPerBeat = 60000 / bpm;

    // Frame duration = beats × msPerBeat
    const frameDuration = beatsPerFrame[frameIndex] * msPerBeat;
    ```

2. **Per-Frame Beat Timing (`beatsPerFrame`)**:

    Define how many beats each frame should be displayed:

    ```json
    {
        "numberOfFrames": 4,
        "beatsPerFrame": [1, 0.5, 0.5, 2],
        "loop": true
    }
    ```

    This means:
    - Frame 0: hold for 1 beat
    - Frame 1: hold for 0.5 beats
    - Frame 2: hold for 0.5 beats
    - Frame 3: hold for 2 beats
    - **Total: 4 beats (1 bar in 4/4)**

    At 120 BPM (500ms per beat):
    - Frame 0: 500ms
    - Frame 1: 250ms
    - Frame 2: 250ms
    - Frame 3: 1000ms

3. **Timing Field Priority**:

    | Field                 | Unit         | When used                           |
    | --------------------- | ------------ | ----------------------------------- |
    | `beatsPerFrame`       | beats        | When synced to BPM (takes priority) |
    | `frameRatesForFrames` | milliseconds | When NOT synced to BPM              |

    **Behavior:**
    - If `beatsPerFrame` exists → use BPM sync, convert beats to ms based on current BPM
    - If only `frameRatesForFrames` exists → ignore BPM (current behavior, backwards compatible)
    - If both exist → `beatsPerFrame` takes priority when BPM is available

4. **Shorthand for uniform timing**:

    For animations where all frames have the same beat duration:

    ```json
    {
        "numberOfFrames": 8,
        "beatsPerFrame": 0.5,
        "loop": true
    }
    ```

    A single number applies to all frames (each frame shown for 0.5 beats, total = 4 beats).

5. **Validation Rules for `beatsPerFrame`**:
    - **Array form**: Must have exactly `numberOfFrames` elements, all positive numbers
    - **Shorthand form**: Single positive number (applies to all frames)
    - **Omitted**: Animation uses `frameRatesForFrames` (backwards compatible)

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
    start: 0xFA,      // Start playback - reset clock counter, start fresh BPM calculation
    continue: 0xFB,   // Continue playback - resume clock counting from current state
    stop: 0xFC        // Stop playback - pause BPM sync (keep last BPM, don't recalculate)
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

### Multiple MIDI Devices

**Warning**: MIDI clock from multiple devices is merged. If two devices both send clock, pulses will be doubled (48 PPQN instead of 24), resulting in incorrect BPM calculation (double speed).

**Recommendation**: Ensure only one connected MIDI device sends clock, or filter clock by device ID in a future update.

---

## 6. Implementation Phases

### Phase 0: Validation & Build Pipeline

- [ ] Copy one of the existing animation sets to channel 4 for testing bitmasks
- [ ] Add `bitDepth` validation to `validate.js` (allowed: 1, 2, 4, 8, or omitted)
- [ ] Add `beatsPerFrame` validation to `validate.js` (allowed: positive number, or array of positive numbers matching numberOfFrames, or omitted)
- [ ] Update `generate.js` to include `bitDepth` and `beatsPerFrame` in `animations.json` output
- [x] ~~Extend `optimize.js` to handle all bit depths~~ ✅ Done - supports 1, 2, 4, 8-bit
- [ ] Add tests for new validation rules and bit depth conversions

### Phase 1: Foundation

- [ ] Update `settings.js` with channel mapping and BPM config
- [ ] Add CC handling to `midi.js`
- [ ] Add System Real-Time handling to `midi.js` (0xF8 clock, 0xFA start, 0xFB continue, 0xFC stop)
- [ ] Add BPM state to `AppState.js`
- [ ] Add `dispatchMIDIControlChange` and `dispatchMIDIClock` methods

### Phase 2: Layer Architecture

- [ ] Create `LayerGroup` class (manages 4 animation slots)
- [ ] Update `LayerManager` to handle A, B, C groups
- [ ] Modify `Renderer` for multi-layer composition

### Phase 3: Bitmask Mixing

- [ ] Create `MaskManager` class (single active mask, latching behavior)
- [ ] Implement single-mask state: stores current note/velocity, latches on note-on
- [ ] Note-off on channel 4 is **ignored** (mask stays latched)
- [ ] Implement pixel-level mixing in renderer (or Canvas composite)
- [ ] Add mask animation triggers (channel 4)

### Phase 4: BPM Sync

- [ ] Implement BPM-based frame timing in `AnimationLayer`
- [ ] Read `beatsPerFrame` from meta.json (if absent, use `frameRatesForFrames` for backwards compatibility)
- [ ] Handle MIDI clock timeout (>2s no clock → enable CC fallback)
- [ ] Test with various BPM values and beatsPerFrame configurations

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
- Masks add additional memory footprint (but only 1 active at a time)
- Implement proper cleanup when animations change

### Mask Behavior (Channel 4)

Unlike Layer A/B/C which support multiple simultaneous animations:

```javascript
// MaskManager - single mask, latching behavior
class MaskManager {
    #currentMask = null; // AnimationLayer or null
    #currentNote = null;
    #currentVelocity = null;

    noteOn(note, velocity) {
        // Always replace current mask with new one
        this.#currentNote = note;
        this.#currentVelocity = velocity;
        this.#currentMask = this.#loadMask(note, velocity);
        this.#currentMask.reset();
    }

    noteOff(note) {
        // Intentionally ignored - mask stays latched
        // Only way to change mask is to trigger a new note
    }

    getCurrentMask() {
        return this.#currentMask; // null before first trigger
    }
}
```

**Key behaviors:**

- Before first trigger: `getCurrentMask()` returns `null` → show Layer A only
- After any trigger: mask stays active until replaced by another note
- Note-off is ignored (no "clearing" the mask)
- Each note = transition type, velocity = variant/intensity

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
   **RESOLVED**: Yes, with rules. Effects from **different note ranges** can stack (e.g., Split + Mirror). Within the **same range**, only the last note wins. Effects are **NOT latched** - Note Off immediately disables them (unlike masks which stay latched). See Section 3 "Effect Stacking Order" for details.

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
