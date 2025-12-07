# MIDI Controller Numbers Reference

A complete reference for all 128 MIDI Control Change (CC) numbers.

## Quick Reference Table

| CC#     | Name                            | Description                 | Range               |
| ------- | ------------------------------- | --------------------------- | ------------------- |
| 0       | Bank Select MSB                 | Select bank (high byte)     | 0-127               |
| 1       | Modulation Wheel                | Vibrato/modulation depth    | 0-127               |
| 2       | Breath Controller               | Breath sensor input         | 0-127               |
| 3       | Undefined                       | Available for assignment    | 0-127               |
| 4       | Foot Controller                 | Foot pedal position         | 0-127               |
| 5       | Portamento Time                 | Glide time between notes    | 0-127               |
| 6       | Data Entry MSB                  | Value for RPN/NRPN          | 0-127               |
| 7       | Channel Volume                  | Main volume control         | 0-127               |
| 8       | Balance                         | Left/right balance          | 0-127               |
| 9       | Undefined                       | Available for assignment    | 0-127               |
| 10      | Pan                             | Stereo position             | 0-127               |
| 11      | Expression                      | Sub-volume control          | 0-127               |
| 12      | Effect Control 1                | Effect parameter            | 0-127               |
| 13      | Effect Control 2                | Effect parameter            | 0-127               |
| 14-15   | Undefined                       | Available for assignment    | 0-127               |
| 16-19   | General Purpose 1-4             | User-assignable             | 0-127               |
| 20-31   | Undefined                       | Available for assignment    | 0-127               |
| 32-63   | LSB for CC 0-31                 | Low byte counterparts       | 0-127               |
| 64      | Sustain Pedal                   | Damper on/off               | 0-63=off, 64-127=on |
| 65      | Portamento On/Off               | Glide enable                | 0-63=off, 64-127=on |
| 66      | Sostenuto                       | Selective sustain           | 0-63=off, 64-127=on |
| 67      | Soft Pedal                      | Una corda effect            | 0-63=off, 64-127=on |
| 68      | Legato Footswitch               | Legato mode                 | 0-63=off, 64-127=on |
| 69      | Hold 2                          | Extended sustain            | 0-63=off, 64-127=on |
| 70      | Sound Controller 1              | Sound variation             | 0-127               |
| 71      | Sound Controller 2              | Timbre/resonance            | 0-127               |
| 72      | Sound Controller 3              | Release time                | 0-127               |
| 73      | Sound Controller 4              | Attack time                 | 0-127               |
| 74      | Sound Controller 5              | Brightness/cutoff           | 0-127               |
| 75      | Sound Controller 6              | Decay time                  | 0-127               |
| 76      | Sound Controller 7              | Vibrato rate                | 0-127               |
| 77      | Sound Controller 8              | Vibrato depth               | 0-127               |
| 78      | Sound Controller 9              | Vibrato delay               | 0-127               |
| 79      | Sound Controller 10             | Undefined                   | 0-127               |
| 80-83   | General Purpose 5-8             | User-assignable             | 0-127               |
| 84      | Portamento Control              | Source note for glide       | 0-127               |
| 85-87   | Undefined                       | Available for assignment    | 0-127               |
| 88      | High Resolution Velocity Prefix | Extends note velocity       | 0-127               |
| 89-90   | Undefined                       | Available for assignment    | 0-127               |
| 91      | Effects 1 Depth                 | Reverb send level           | 0-127               |
| 92      | Effects 2 Depth                 | Tremolo depth               | 0-127               |
| 93      | Effects 3 Depth                 | Chorus send level           | 0-127               |
| 94      | Effects 4 Depth                 | Detune/celeste              | 0-127               |
| 95      | Effects 5 Depth                 | Phaser depth                | 0-127               |
| 96      | Data Increment                  | +1 to current RPN/NRPN      | N/A                 |
| 97      | Data Decrement                  | -1 from current RPN/NRPN    | N/A                 |
| 98      | NRPN LSB                        | Non-Registered Parameter #  | 0-127               |
| 99      | NRPN MSB                        | Non-Registered Parameter #  | 0-127               |
| 100     | RPN LSB                         | Registered Parameter Number | 0-127               |
| 101     | RPN MSB                         | Registered Parameter Number | 0-127               |
| 102-119 | Undefined                       | Available for assignment    | 0-127               |
| 120     | All Sound Off                   | Silence all sound           | 0                   |
| 121     | Reset All Controllers           | Reset to defaults           | 0                   |
| 122     | Local Control                   | Keyboard local on/off       | 0=off, 127=on       |
| 123     | All Notes Off                   | Release all notes           | 0                   |
| 124     | Omni Mode Off                   | Single channel mode         | 0                   |
| 125     | Omni Mode On                    | All channels mode           | 0                   |
| 126     | Mono Mode On                    | Monophonic mode             | 0-16                |
| 127     | Poly Mode On                    | Polyphonic mode             | 0                   |

## Detailed Controller Descriptions

### Primary Controllers (0-31 MSB)

#### CC 0: Bank Select MSB

Selects the sound bank. Used with CC 32 (LSB) for up to 16,384 banks.

```javascript
// Select bank 5
output.send([0xb0, 0, 5]); // Bank MSB = 5
output.send([0xb0, 32, 0]); // Bank LSB = 0
output.send([0xc0, 0]); // Program Change to select sound
```

#### CC 1: Modulation Wheel

Controls vibrato depth or other modulation effects. Most common expressive controller.

```javascript
// Full modulation
output.send([0xb0, 1, 127]);

// No modulation
output.send([0xb0, 1, 0]);
```

#### CC 7: Channel Volume

Master volume for the channel. Affects all notes on that channel.

```javascript
// Set volume to 75%
const volume = Math.floor(127 * 0.75);
output.send([0xb0, 7, volume]);
```

#### CC 10: Pan

Stereo position. 0 = hard left, 64 = center, 127 = hard right.

```javascript
// Pan positions
const PAN = {
    LEFT: 0,
    CENTER: 64,
    RIGHT: 127
};

output.send([0xb0, 10, PAN.CENTER]);
```

#### CC 11: Expression

Secondary volume control. Multiplies with CC 7 for dynamic control.

```javascript
// Volume = CC7 * CC11 / 127
// Useful for crescendo/decrescendo without affecting master volume
```

### Switch Controllers (64-69)

These are typically on/off switches where:

- **0-63** = Off
- **64-127** = On

#### CC 64: Sustain Pedal (Damper)

The most important pedal controller. Holds notes after key release.

```javascript
// Sustain on
output.send([0xb0, 64, 127]);

// Sustain off
output.send([0xb0, 64, 0]);
```

#### CC 66: Sostenuto

Sustains only notes that are held when pedal is pressed.

#### CC 67: Soft Pedal

Reduces volume and changes timbre (una corda on piano).

### Sound Controllers (70-79)

#### CC 71: Resonance (Filter Q)

Controls filter resonance/emphasis.

#### CC 72: Release Time

Envelope release time. Higher = longer release.

#### CC 73: Attack Time

Envelope attack time. Higher = slower attack.

#### CC 74: Brightness (Cutoff)

Filter cutoff frequency. Higher = brighter sound.

```javascript
// Bright sound
output.send([0xb0, 74, 127]);

// Muffled sound
output.send([0xb0, 74, 20]);
```

### Effects Controllers (91-95)

#### CC 91: Reverb Send

Amount of signal sent to reverb effect.

#### CC 93: Chorus Send

Amount of signal sent to chorus effect.

```javascript
// Add reverb and chorus
output.send([0xb0, 91, 80]); // Reverb
output.send([0xb0, 93, 50]); // Chorus
```

### Channel Mode Messages (120-127)

These are special controllers that affect channel behavior.

#### CC 120: All Sound Off

Immediately silences all sound, including sustained notes.

```javascript
// Emergency stop - silence everything
output.send([0xb0, 120, 0]);
```

#### CC 121: Reset All Controllers

Resets all controllers to default values.

```javascript
// Reset channel 1 controllers
output.send([0xb0, 121, 0]);
```

#### CC 123: All Notes Off

Releases all currently playing notes (respects release envelope).

```javascript
// Stop all notes on channel 1
output.send([0xb0, 123, 0]);

// Stop all notes on all channels
for (let ch = 0; ch < 16; ch++) {
    output.send([0xb0 | ch, 123, 0]);
}
```

## RPN and NRPN

### Registered Parameter Numbers (RPN)

Standard parameters with defined meanings across manufacturers.

| RPN MSB | RPN LSB | Parameter                       |
| ------- | ------- | ------------------------------- |
| 0       | 0       | Pitch Bend Sensitivity          |
| 0       | 1       | Fine Tuning                     |
| 0       | 2       | Coarse Tuning                   |
| 0       | 3       | Tuning Program Select           |
| 0       | 4       | Tuning Bank Select              |
| 0       | 5       | Modulation Depth Range          |
| 127     | 127     | RPN Null (cancel RPN selection) |

```javascript
// Set pitch bend range to ±12 semitones
function setPitchBendRange(output, channel, semitones) {
    const ch = channel & 0x0f;

    // Select RPN 0,0 (Pitch Bend Sensitivity)
    output.send([0xb0 | ch, 101, 0]); // RPN MSB = 0
    output.send([0xb0 | ch, 100, 0]); // RPN LSB = 0

    // Set value
    output.send([0xb0 | ch, 6, semitones]); // Data Entry MSB
    output.send([0xb0 | ch, 38, 0]); // Data Entry LSB (cents)

    // Deselect RPN (good practice)
    output.send([0xb0 | ch, 101, 127]); // RPN MSB = 127
    output.send([0xb0 | ch, 100, 127]); // RPN LSB = 127
}

setPitchBendRange(output, 0, 12); // ±12 semitones on channel 1
```

### Non-Registered Parameter Numbers (NRPN)

Manufacturer-specific parameters. Same process as RPN but using CC 98/99.

```javascript
// Set NRPN value
function setNRPN(output, channel, msb, lsb, value) {
    const ch = channel & 0x0f;

    // Select NRPN
    output.send([0xb0 | ch, 99, msb]); // NRPN MSB
    output.send([0xb0 | ch, 98, lsb]); // NRPN LSB

    // Set value
    output.send([0xb0 | ch, 6, value]); // Data Entry MSB

    // Optionally deselect
    output.send([0xb0 | ch, 99, 127]);
    output.send([0xb0 | ch, 98, 127]);
}
```

## High-Resolution Controllers

Controllers 0-31 have corresponding LSB controllers at 32-63, allowing 14-bit precision (0-16383).

```javascript
// Set high-resolution volume
function setHighResVolume(output, channel, value14bit) {
    const ch = channel & 0x0f;
    const msb = (value14bit >> 7) & 0x7f;
    const lsb = value14bit & 0x7f;

    output.send([0xb0 | ch, 7, msb]); // Volume MSB
    output.send([0xb0 | ch, 39, lsb]); // Volume LSB (7 + 32 = 39)
}

// Full volume in 14-bit
setHighResVolume(output, 0, 16383);
```

## JavaScript Constants

```javascript
/**
 * MIDI Control Change number constants
 */
export const CC = {
    // Primary Controllers (MSB)
    BANK_SELECT: 0,
    MODULATION: 1,
    BREATH: 2,
    FOOT: 4,
    PORTAMENTO_TIME: 5,
    DATA_ENTRY: 6,
    VOLUME: 7,
    BALANCE: 8,
    PAN: 10,
    EXPRESSION: 11,
    EFFECT_1: 12,
    EFFECT_2: 13,

    // General Purpose
    GP_1: 16,
    GP_2: 17,
    GP_3: 18,
    GP_4: 19,

    // LSB Controllers (add 32 to MSB number)
    BANK_SELECT_LSB: 32,
    MODULATION_LSB: 33,
    VOLUME_LSB: 39,
    PAN_LSB: 42,

    // Switch Controllers
    SUSTAIN: 64,
    PORTAMENTO: 65,
    SOSTENUTO: 66,
    SOFT_PEDAL: 67,
    LEGATO: 68,
    HOLD_2: 69,

    // Sound Controllers
    SOUND_VARIATION: 70,
    RESONANCE: 71,
    RELEASE: 72,
    ATTACK: 73,
    BRIGHTNESS: 74,
    DECAY: 75,
    VIBRATO_RATE: 76,
    VIBRATO_DEPTH: 77,
    VIBRATO_DELAY: 78,

    // General Purpose 5-8
    GP_5: 80,
    GP_6: 81,
    GP_7: 82,
    GP_8: 83,

    // Effects
    REVERB: 91,
    TREMOLO: 92,
    CHORUS: 93,
    DETUNE: 94,
    PHASER: 95,

    // Parameter Controls
    DATA_INCREMENT: 96,
    DATA_DECREMENT: 97,
    NRPN_LSB: 98,
    NRPN_MSB: 99,
    RPN_LSB: 100,
    RPN_MSB: 101,

    // Channel Mode
    ALL_SOUND_OFF: 120,
    RESET_CONTROLLERS: 121,
    LOCAL_CONTROL: 122,
    ALL_NOTES_OFF: 123,
    OMNI_OFF: 124,
    OMNI_ON: 125,
    MONO_ON: 126,
    POLY_ON: 127
};
```

## Common Use Cases

### DJ/VJ Controller Mapping

```javascript
// Typical DJ controller mapping
const DJ_MAPPING = {
    CROSSFADER: CC.GP_1, // CC 16
    CHANNEL_1_FADER: CC.GP_2, // CC 17
    CHANNEL_2_FADER: CC.GP_3, // CC 18
    TEMPO: CC.GP_4, // CC 19
    EFFECT_WET_DRY: CC.GP_5, // CC 80
    FILTER: CC.BRIGHTNESS // CC 74
};
```

### MIDI Learn Implementation

```javascript
class MIDILearn {
    #mapping = new Map();
    #learning = null;

    startLearning(parameterName) {
        this.#learning = parameterName;
    }

    handleCC(channel, controller, value) {
        if (this.#learning) {
            this.#mapping.set(this.#learning, { channel, controller });
            this.#learning = null;
            return;
        }

        // Find mapped parameter
        for (const [param, map] of this.#mapping) {
            if (map.channel === channel && map.controller === controller) {
                this.updateParameter(param, value);
            }
        }
    }

    updateParameter(name, value) {
        // Override in subclass
    }
}
```

---

_This reference covers the MIDI 1.0 Control Change specification. Some controllers may behave differently depending on the receiving device's implementation._
