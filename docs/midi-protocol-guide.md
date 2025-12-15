# MIDI Protocol Guide

A practical guide to understanding the MIDI protocol, message types, and data structures for music applications.

## Table of Contents

1. [What is MIDI?](#what-is-midi)
2. [MIDI Fundamentals](#midi-fundamentals)
3. [MIDI Messages](#midi-messages)
4. [Channel Voice Messages](#channel-voice-messages)
5. [System Messages](#system-messages)
6. [MIDI Channels](#midi-channels)
7. [MIDI Data Format](#midi-data-format)
8. [Timing and Synchronization](#timing-and-synchronization)
9. [Advanced Topics](#advanced-topics)
10. [Practical Examples](#practical-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

## What is MIDI?

**MIDI (Musical Instrument Digital Interface)** is a communication protocol and technical standard that enables electronic musical instruments, computers, and other equipment to communicate with each other.

### Key Concepts

**MIDI is NOT audio** - It's a control protocol that sends instructions about:

- Which notes to play
- How loud to play them
- When to start and stop
- Which instrument sounds to use
- Various control parameters

**MIDI IS:**

- **Event-based**: Describes musical events (note on, note off, etc.)
- **Real-time**: Designed for live performance
- **Compact**: Very small data requirements
- **Universal**: Works across different manufacturers and platforms

### Historical Context

- **Created**: 1983 by Dave Smith (Sequential Circuits) and Ikutaro Kakehashi (Roland)
- **Purpose**: Solve incompatibility between different manufacturers' instruments
- **Impact**: Revolutionized music production and electronic music

## MIDI Fundamentals

### Physical Layer

- **Baud Rate**: 31,250 bits per second
- **Data Format**: 8-bit bytes, asynchronous serial
- **Connector**: 5-pin DIN (traditional) or USB/Ethernet (modern)
- **Cable Length**: Maximum 15 meters (50 feet)

### Data Transmission

- **Serial**: One bit at a time
- **Unidirectional**: Each cable carries data one way only
- **No Error Correction**: Lost data is simply lost

### MIDI Ports

- **IN**: Receives MIDI data
- **OUT**: Sends MIDI data
- **THRU**: Passes received data unchanged to next device

## MIDI Messages

All MIDI communication happens through messages. Each message consists of:

- **Status Byte**: Defines message type and channel
- **Data Bytes**: Contains the actual information

### Message Categories

1. **Channel Voice Messages**: Musical performance data
2. **Channel Mode Messages**: How device responds to data
3. **System Common Messages**: General system information
4. **System Real-Time Messages**: Timing and synchronization
5. **System Exclusive Messages**: Manufacturer-specific data

### Status Bytes vs Data Bytes

```
Status Byte: 1xxxxxxx (bit 7 = 1, values 128-255)
Data Byte:   0xxxxxxx (bit 7 = 0, values 0-127)
```

**Status Byte Format:**

```
1nnntttt
│││└─┴─┴─┴─ Message Type (4 bits)
└─┴─┴─ Channel Number (3 bits, 0-15)
```

## Channel Voice Messages

These are the most common MIDI messages for musical performance.

### Note On (0x9n)

Starts playing a note.

**Format:** `[0x9n, note, velocity]`

- **n**: Channel (0-15)
- **note**: MIDI note number (0-127)
- **velocity**: How hard the key was pressed (1-127, 0 = note off)

```javascript
// Middle C (note 60) on channel 1 with velocity 100
[0x90, 60, 100];
```

### Note Off (0x8n)

Stops playing a note.

**Format:** `[0x8n, note, velocity]`

- **velocity**: Release velocity (usually ignored, set to 0)

```javascript
// Stop middle C on channel 1
[0x80, 60, 0];
```

**Note:** Note On with velocity 0 is equivalent to Note Off.

### Control Change (0xBn)

Changes continuous controllers like volume, modulation, etc.

**Format:** `[0xBn, controller, value]`

**Common Controllers:**

```javascript
// Volume (Controller 7)
[0xb0, 7, 100][ // Set channel 1 volume to 100
    // Modulation (Controller 1)
    (0xb0, 1, 64)
][ // Set modulation to middle position
    // Pan (Controller 10)
    (0xb0, 10, 64)
][ // Center pan position
    // Sustain Pedal (Controller 64)
    (0xb0, 64, 127)
][(0xb0, 64, 0)]; // Sustain pedal pressed // Sustain pedal released
```

### Program Change (0xCn)

Changes the instrument/patch.

**Format:** `[0xCn, program]`

- **program**: Instrument number (0-127)

```javascript
// Change to Grand Piano (program 0) on channel 1
[0xc0, 0][
    // Change to Electric Guitar (program 27) on channel 1
    (0xc0, 27)
];
```

### Pitch Bend (0xEn)

Bends the pitch of notes.

**Format:** `[0xEn, lsb, msb]`

- Uses 14-bit precision (two 7-bit values)
- Range: 0-16383 (8192 = no bend)

```javascript
// No pitch bend
[0xe0, 0, 64][ // 8192 = 0 + (64 << 7)
    // Maximum bend up
    (0xe0, 127, 127)
][ // 16383
    // Maximum bend down
    (0xe0, 0, 0)
]; // 0
```

### Polyphonic Key Pressure (0xAn)

Per-note pressure (aftertouch).

**Format:** `[0xAn, note, pressure]`

```javascript
// Apply pressure to middle C
[0xa0, 60, 80];
```

### Channel Pressure (0xDn)

Overall channel pressure.

**Format:** `[0xDn, pressure]`

```javascript
// Apply channel pressure
[0xd0, 100];
```

## System Messages

### System Common Messages

#### System Exclusive (0xF0)

Manufacturer-specific data.

**Format:** `[0xF0, manufacturer_id, ...data..., 0xF7]`

```javascript
// Roland device inquiry
[0xf0, 0x41, 0x10, 0x16, 0x12, 0x11, 0x00, 0x00, 0x00, 0xf7];
```

#### MIDI Time Code Quarter Frame (0xF1)

**Format:** `[0xF1, data]`

#### Song Position Pointer (0xF2)

**Format:** `[0xF2, lsb, msb]`

#### Song Select (0xF3)

**Format:** `[0xF3, song_number]`

#### Tune Request (0xF6)

**Format:** `[0xF6]`

### System Real-Time Messages

These are single-byte messages for timing:

- **0xF8**: Timing Clock
- **0xFA**: Start
- **0xFB**: Continue
- **0xFC**: Stop
- **0xFE**: Active Sensing
- **0xFF**: System Reset

```javascript
// Start sequencer
[0xfa][0xfc][0xf8]; // Stop sequencer // Timing clock (sent 24 times per quarter note)
```

## MIDI Channels

MIDI supports 16 channels. The protocol uses 0-15 internally (in the status byte), but DAWs and hardware controllers universally display them as 1-16 for users. This is an industry-wide convention—always use 1-16 when communicating with users, and 0-15 in code.

### Channel Usage Patterns

**General MIDI Standard:**

- **Channels 1-15**: Melodic instruments
- **Channel 16 (0x0F)**: Drum sounds

**Typical Arrangements:**

```javascript
// Channel assignments for a band setup
const CHANNELS = {
    BASS: 0, // Channel 1
    PIANO: 1, // Channel 2
    GUITAR: 2, // Channel 3
    STRINGS: 3, // Channel 4
    DRUMS: 15 // Channel 16
};
```

### Multi-Timbral Instruments

Modern synthesizers can play different sounds on different channels simultaneously.

```javascript
// Set up multi-timbral synth
[0xc0, 0][(0xc1, 24)][(0xc2, 40)][(0xc3, 64)]; // Channel 1: Piano // Channel 2: Guitar // Channel 3: Violin // Channel 4: Saxophone
```

## MIDI Data Format

### Note Numbers

MIDI note numbers range from 0-127:

```javascript
// MIDI Note Number = (Octave * 12) + Semitone
// Middle C = C4 = Note 60

const NOTES = {
    'C-1': 0, // Lowest MIDI note
    C4: 60, // Middle C
    A4: 69, // Concert A (440 Hz)
    G9: 127 // Highest MIDI note
};

function noteNameToMIDI(noteName, octave) {
    const noteOffsets = {
        C: 0,
        'C#': 1,
        D: 2,
        'D#': 3,
        E: 4,
        F: 5,
        'F#': 6,
        G: 7,
        'G#': 8,
        A: 9,
        'A#': 10,
        B: 11
    };

    return (octave + 1) * 12 + noteOffsets[noteName];
}

// Examples
console.log(noteNameToMIDI('C', 4)); // 60 (Middle C)
console.log(noteNameToMIDI('A', 4)); // 69 (Concert A)
```

### Velocity Values

- **0**: Note off (in Note On messages)
- **1-127**: Velocity levels
- **Typical ranges:**
    - **ppp**: 1-16 (very soft)
    - **pp**: 17-32 (soft)
    - **p**: 33-48 (moderately soft)
    - **mp**: 49-64 (moderately loud)
    - **mf**: 65-80 (loud)
    - **f**: 81-96 (very loud)
    - **ff**: 97-112 (extremely loud)
    - **fff**: 113-127 (maximum)

### Controller Numbers

Standard controller assignments:

```javascript
const CONTROLLERS = {
    BANK_SELECT_MSB: 0,
    MODULATION: 1,
    BREATH_CONTROLLER: 2,
    FOOT_CONTROLLER: 4,
    PORTAMENTO_TIME: 5,
    DATA_ENTRY_MSB: 6,
    VOLUME: 7,
    BALANCE: 8,
    PAN: 10,
    EXPRESSION: 11,
    BANK_SELECT_LSB: 32,
    SUSTAIN_PEDAL: 64,
    PORTAMENTO: 65,
    SOSTENUTO: 66,
    SOFT_PEDAL: 67,
    REVERB_SEND: 91,
    CHORUS_SEND: 93
};
```

## Timing and Synchronization

### MIDI Clock

- **24 pulses per quarter note**
- **24 pulses per quarter note** (configurable via `settings.midi.ppqn`, default 24)
- **Tempo independent**: Clock rate varies with tempo
- **96 pulses per whole note** at any tempo

```javascript
// Calculate MIDI clock from BPM using configurable PPQN
function calculateClockInterval(bpm, ppqn = 24) {
    const millisecondsPerBeat = 60000 / bpm;
    const millisecondsPerClock = millisecondsPerBeat / ppqn;
    return millisecondsPerClock;
}

// 120 BPM = 20.83ms between clock pulses
console.log(calculateClockInterval(120)); // 20.833...
```

### Song Position Pointer

Indicates playback position in MIDI beats (16th notes):

```javascript
function setSongPosition(sixteenthNotes) {
    const lsb = sixteenthNotes & 0x7f;
    const msb = (sixteenthNotes >> 7) & 0x7f;
    return [0xf2, lsb, msb];
}

// Position at measure 5, beat 1 (assuming 4/4 time)
// Measure 5 = 64 sixteenth notes from start
const positionMessage = setSongPosition(64);
```

## Advanced Topics

### Running Status

MIDI optimization that omits repeated status bytes:

```javascript
// Without running status:
[0x90, 60, 100][(0x90, 64, 100)][(0x90, 67, 100)][ // Note On C4 // Note On E4 // Note On G4
    // With running status:
    (0x90, 60, 100)
][(64, 100)][(67, 100)]; // Note On C4 // Note On E4 (status byte omitted) // Note On G4 (status byte omitted)
```

### MIDI Machine Control (MMC)

System Exclusive messages for transport control:

```javascript
// MMC Stop command
[0xf0, 0x7f, 0x7f, 0x06, 0x01, 0xf7][
    // MMC Play command
    (0xf0, 0x7f, 0x7f, 0x06, 0x02, 0xf7)
][
    // MMC Record command
    (0xf0, 0x7f, 0x7f, 0x06, 0x06, 0xf7)
];
```

### General MIDI (GM)

Standardized instrument mapping:

```javascript
const GM_INSTRUMENTS = {
    // Piano Family
    ACOUSTIC_GRAND_PIANO: 0,
    BRIGHT_ACOUSTIC_PIANO: 1,
    ELECTRIC_GRAND_PIANO: 2,
    HONKY_TONK_PIANO: 3,

    // Organ Family
    DRAWBAR_ORGAN: 16,
    PERCUSSIVE_ORGAN: 17,
    ROCK_ORGAN: 18,

    // Guitar Family
    ACOUSTIC_GUITAR_NYLON: 24,
    ACOUSTIC_GUITAR_STEEL: 25,
    ELECTRIC_GUITAR_JAZZ: 26,
    ELECTRIC_GUITAR_CLEAN: 27,

    // Drum Kit (Channel 16)
    STANDARD_DRUM_KIT: 0 // On channel 15 (16th channel)
};
```

### MIDI 2.0 Overview

Next-generation MIDI with enhanced capabilities:

- **Backward Compatible**: Works with MIDI 1.0 devices
- **Higher Resolution**: 32-bit values instead of 7-bit
- **Bidirectional**: Two-way communication
- **Property Exchange**: Device capability discovery
- **Profiles**: Standardized device behaviors

## Practical Examples

### Simple Note Player

```javascript
class MIDINotePlayer {
    constructor(output) {
        this.output = output;
        this.channel = 0;
        this.activeNotes = new Set();
    }

    playNote(note, velocity = 100, duration = 1000) {
        // Send Note On
        this.output.send([0x90 | this.channel, note, velocity]);
        this.activeNotes.add(note);

        // Schedule Note Off
        setTimeout(() => {
            this.stopNote(note);
        }, duration);
    }

    stopNote(note) {
        if (this.activeNotes.has(note)) {
            this.output.send([0x80 | this.channel, note, 0]);
            this.activeNotes.delete(note);
        }
    }

    stopAllNotes() {
        for (const note of this.activeNotes) {
            this.output.send([0x80 | this.channel, note, 0]);
        }
        this.activeNotes.clear();
    }

    setInstrument(program) {
        this.output.send([0xc0 | this.channel, program]);
    }

    setVolume(volume) {
        this.output.send([0xb0 | this.channel, 7, volume]);
    }
}
```

### MIDI Message Parser

```javascript
class MIDIMessageParser {
    static parse(data) {
        if (data.length === 0) return null;

        const status = data[0];
        const messageType = status & 0xf0;
        const channel = status & 0x0f;

        switch (messageType) {
            case 0x80: // Note Off
                return {
                    type: 'noteOff',
                    channel,
                    note: data[1],
                    velocity: data[2]
                };

            case 0x90: // Note On
                return {
                    type: data[2] === 0 ? 'noteOff' : 'noteOn',
                    channel,
                    note: data[1],
                    velocity: data[2]
                };

            case 0xb0: // Control Change
                return {
                    type: 'controlChange',
                    channel,
                    controller: data[1],
                    value: data[2]
                };

            case 0xc0: // Program Change
                return {
                    type: 'programChange',
                    channel,
                    program: data[1]
                };

            case 0xe0: // Pitch Bend
                const pitchBend = data[1] | (data[2] << 7);
                return {
                    type: 'pitchBend',
                    channel,
                    value: pitchBend - 8192 // Center at 0
                };

            default:
                return {
                    type: 'unknown',
                    data: Array.from(data)
                };
        }
    }

    static getControllerName(controller) {
        const names = {
            1: 'Modulation',
            7: 'Volume',
            10: 'Pan',
            11: 'Expression',
            64: 'Sustain Pedal',
            91: 'Reverb Send',
            93: 'Chorus Send'
        };

        return names[controller] || `Controller ${controller}`;
    }
}

// Usage
const message = MIDIMessageParser.parse([0x90, 60, 100]);
console.log(message); // { type: 'noteOn', channel: 0, note: 60, velocity: 100 }
```

### MIDI Clock Generator

```javascript
class MIDIClockGenerator {
    constructor(output) {
        this.output = output;
        this.bpm = 120;
        this.isRunning = false;
        this.clockInterval = null;
        this.clockCount = 0;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.clockCount = 0;

        // Send start message
        this.output.send([0xfa]);

        // Start clock
        this.startClock();
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;

        // Send stop message
        this.output.send([0xfc]);

        // Stop clock
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    setBPM(bpm) {
        this.bpm = bpm;

        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    startClock() {
        const interval = (60 / this.bpm / 24) * 1000; // 24 clocks per beat

        this.clockInterval = setInterval(() => {
            this.output.send([0xf8]); // Clock pulse
            this.clockCount++;

            // Optional: trigger events on beat boundaries
            if (this.clockCount % 24 === 0) {
                this.onBeat();
            }
        }, interval);
    }

    onBeat() {
        // Override in subclass for beat-based events
        console.log('Beat:', this.clockCount / 24);
    }
}
```

## Best Practices

### Message Optimization

```javascript
// Good: Minimize redundant messages
class EfficientMIDISender {
    constructor(output) {
        this.output = output;
        this.lastProgram = new Array(16).fill(-1);
        this.lastController = new Array(16).fill(new Array(128).fill(-1));
    }

    sendProgramChange(channel, program) {
        if (this.lastProgram[channel] !== program) {
            this.output.send([0xc0 | channel, program]);
            this.lastProgram[channel] = program;
        }
    }

    sendControlChange(channel, controller, value) {
        if (this.lastController[channel][controller] !== value) {
            this.output.send([0xb0 | channel, controller, value]);
            this.lastController[channel][controller] = value;
        }
    }
}
```

### Error Handling

```javascript
function safeMIDISend(output, data) {
    try {
        // Validate data
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid MIDI data');
        }

        // Check status byte
        if (data[0] < 0x80 || data[0] > 0xff) {
            throw new Error('Invalid status byte');
        }

        // Check data bytes
        for (let i = 1; i < data.length; i++) {
            if (data[i] < 0 || data[i] > 127) {
                throw new Error(`Invalid data byte at index ${i}: ${data[i]}`);
            }
        }

        output.send(data);
        return true;
    } catch (error) {
        console.error('MIDI send error:', error);
        return false;
    }
}
```

### Performance Monitoring

```javascript
class MIDIPerformanceMonitor {
    constructor() {
        this.messageCount = 0;
        this.startTime = performance.now();
        this.lastLogTime = this.startTime;
    }

    recordMessage(messageData) {
        this.messageCount++;

        const now = performance.now();
        const timeSinceLastLog = now - this.lastLogTime;

        // Log stats every 5 seconds
        if (timeSinceLastLog > 5000) {
            const totalTime = now - this.startTime;
            const messagesPerSecond = (this.messageCount / totalTime) * 1000;

            console.log(`MIDI Performance: ${messagesPerSecond.toFixed(2)} msg/sec`);
            this.lastLogTime = now;
        }
    }
}
```

## Troubleshooting

### Common Issues

**Issue: Notes stick (don't turn off)**

```javascript
// Solution: All Notes Off message
function allNotesOff(output, channel) {
    output.send([0xb0 | channel, 123, 0]);
}

// Or send individual Note Off for active notes
function forceNotesOff(output, channel, activeNotes) {
    activeNotes.forEach(note => {
        output.send([0x80 | channel, note, 0]);
    });
}
```

**Issue: Wrong instrument sounds**

```javascript
// Solution: Ensure Program Change sent before notes
function playMelodyWithInstrument(output, channel, program, notes) {
    // Set instrument first
    output.send([0xc0 | channel, program]);

    // Small delay to ensure program change is processed
    setTimeout(() => {
        notes.forEach((note, index) => {
            setTimeout(() => {
                output.send([0x90 | channel, note, 100]);
            }, index * 500);
        });
    }, 10);
}
```

**Issue: MIDI timing drift**

```javascript
// Solution: Use high-precision timestamps
class PrecisionMIDIScheduler {
    constructor(output) {
        this.output = output;
        this.startTime = performance.now();
    }

    scheduleNote(note, velocity, startTime, duration) {
        const absoluteStartTime = this.startTime + startTime;
        const absoluteEndTime = absoluteStartTime + duration;

        // Note On
        this.output.send([0x90, note, velocity], absoluteStartTime);

        // Note Off
        this.output.send([0x80, note, 0], absoluteEndTime);
    }
}
```

### Debug Utilities

```javascript
// MIDI message logger
function createMIDILogger(input, name) {
    input.onmidimessage = event => {
        const timestamp = event.timeStamp.toFixed(2);
        const data = Array.from(event.data);
        const hex = data.map(b => b.toString(16).padStart(2, '0')).join(' ');

        console.log(`[${timestamp}] ${name}: [${hex}] ${data}`);

        // Parse and log human-readable format
        const parsed = MIDIMessageParser.parse(data);
        if (parsed) {
            console.log(`  → ${JSON.stringify(parsed)}`);
        }
    };
}
```

---

_This guide provides a comprehensive overview of the MIDI protocol for practical application development. For complete technical specifications, refer to the official MIDI Manufacturers Association documentation._
