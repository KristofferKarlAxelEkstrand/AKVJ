# USB-MIDI and MIDI 2.0 Reference

A technical guide covering USB-MIDI class compliance and MIDI 2.0 specifications for web developers.

## USB-MIDI Overview

### What is USB-MIDI?

USB-MIDI is a standard device class that allows MIDI devices to connect via USB without custom drivers. The USB Implementers Forum (USB-IF) defines the specification in the "USB Device Class Definition for MIDI Devices."

### Key Characteristics

- **Class-compliant**: Standard drivers built into operating systems
- **No latency advantage**: USB-MIDI has similar latency to traditional MIDI
- **Multiple ports**: Single USB connection can expose multiple virtual MIDI ports
- **Bidirectional**: Single cable handles both input and output
- **Power over USB**: Devices can be bus-powered

### Web MIDI API and USB-MIDI

The Web MIDI API transparently handles USB-MIDI devices:

```javascript
// USB-MIDI devices appear just like any other MIDI device
navigator.requestMIDIAccess().then(midiAccess => {
    for (const input of midiAccess.inputs.values()) {
        // USB-MIDI device
        console.log(`${input.name} - ${input.manufacturer}`);
    }
});
```

### USB-MIDI Packet Format

USB-MIDI uses 4-byte packets internally:

```text
Byte 0: Cable Number (4 bits) | Code Index Number (4 bits)
Byte 1-3: MIDI message bytes (padded if necessary)
```

| CIN | Description              | MIDI Bytes |
| --- | ------------------------ | ---------- |
| 0x0 | Miscellaneous            | 1-3        |
| 0x2 | Two-byte System Common   | 2          |
| 0x3 | Three-byte System Common | 3          |
| 0x4 | SysEx starts/continues   | 3          |
| 0x5 | SysEx ends (1 byte)      | 1          |
| 0x6 | SysEx ends (2 bytes)     | 2          |
| 0x7 | SysEx ends (3 bytes)     | 3          |
| 0x8 | Note Off                 | 3          |
| 0x9 | Note On                  | 3          |
| 0xA | Poly Key Pressure        | 3          |
| 0xB | Control Change           | 3          |
| 0xC | Program Change           | 2          |
| 0xD | Channel Pressure         | 2          |
| 0xE | Pitch Bend               | 3          |
| 0xF | Single Byte              | 1          |

**Note:** The Web MIDI API handles this packaging automatically. You work with standard MIDI messages.

### USB-MIDI Latency Considerations

USB operates on a polling schedule:

| USB Speed            | Polling Interval | Typical Latency |
| -------------------- | ---------------- | --------------- |
| USB 1.1 (Full Speed) | 1ms              | 1-3ms           |
| USB 2.0 (High Speed) | 125μs            | 0.5-1.5ms       |
| USB 3.0              | 125μs            | 0.25-1ms        |

**Best Practices:**

```javascript
// USB-MIDI latency is generally acceptable for real-time performance
// Typical round-trip: 2-6ms (input to processed output)

// For timing-critical applications, use output timestamps
output.send([0x90, 60, 127], performance.now() + 10); // 10ms from now
```

### Virtual MIDI Ports

USB-MIDI devices can expose multiple virtual ports:

```javascript
// A single USB device might show as multiple ports
// Example: "Launchpad Pro MK3 MIDI" and "Launchpad Pro MK3 DAW"
for (const input of midiAccess.inputs.values()) {
    console.log(`ID: ${input.id}, Name: ${input.name}`);
}

// To identify related ports, check manufacturer and similar naming
function groupDevicePorts(midiAccess) {
    const devices = new Map();

    for (const port of [...midiAccess.inputs.values(), ...midiAccess.outputs.values()]) {
        const baseName = port.name.replace(/ (MIDI|DAW|LPX|IN|OUT).*$/i, '');

        if (!devices.has(baseName)) {
            devices.set(baseName, { inputs: [], outputs: [] });
        }

        if (port.type === 'input') {
            devices.get(baseName).inputs.push(port);
        } else {
            devices.get(baseName).outputs.push(port);
        }
    }

    return devices;
}
```

## MIDI 2.0 Overview

### What is MIDI 2.0?

MIDI 2.0, released in 2020, is a major update to the MIDI specification that maintains backward compatibility with MIDI 1.0 while adding significant new capabilities.

### Key Features

| Feature               | MIDI 1.0           | MIDI 2.0                  |
| --------------------- | ------------------ | ------------------------- |
| **Resolution**        | 7-bit (128 values) | 32-bit (4 billion values) |
| **Velocity**          | 7-bit              | 16-bit                    |
| **Pitch Bend**        | 14-bit             | 32-bit                    |
| **Communication**     | Unidirectional     | Bidirectional             |
| **Device Discovery**  | None               | Built-in                  |
| **Profiles**          | None               | Standardized behaviors    |
| **Property Exchange** | None               | JSON-based queries        |

### Universal MIDI Packet (UMP)

MIDI 2.0 introduces a new packet format:

```text
32-bit words (1-4 words per message)

Word 1, Byte 1: Message Type (4 bits) | Group (4 bits)
```

| MT  | Name                      | Size      |
| --- | ------------------------- | --------- |
| 0x0 | Utility                   | 1 word    |
| 0x1 | System Real Time / Common | 1 word    |
| 0x2 | MIDI 1.0 Channel Voice    | 1 word    |
| 0x3 | Data (SysEx 7-bit)        | 2 words   |
| 0x4 | MIDI 2.0 Channel Voice    | 2 words   |
| 0x5 | Data (SysEx 8-bit)        | 2 words   |
| 0xD | Flex Data                 | 2 words   |
| 0xF | Stream                    | 2-4 words |

### MIDI 2.0 Channel Voice Messages

Higher resolution versions of MIDI 1.0 messages:

```javascript
// MIDI 2.0 Note On (conceptual - not yet in Web MIDI API)
// 64-bit message with 16-bit velocity
{
    type: 'noteOn',
    group: 0,
    channel: 0,
    note: 60,
    velocity: 65535,        // 16-bit (0-65535)
    attributeType: 0,
    attribute: 0
}

// MIDI 2.0 Control Change
// 32-bit value instead of 7-bit
{
    type: 'controlChange',
    group: 0,
    channel: 0,
    controller: 74,         // Brightness
    value: 2147483647       // 32-bit value
}
```

### MIDI Capability Inquiry (MIDI-CI)

MIDI-CI enables bidirectional communication for:

1. **Profile Configuration**: Query and enable standardized behaviors
2. **Property Exchange**: JSON-based device configuration
3. **Protocol Negotiation**: Agree on MIDI 1.0 or 2.0

```javascript
// Conceptual MIDI-CI interaction
// Device discovery
await midiDevice.queryProfiles();
// Returns: ['drawbarOrgan', 'analogSynth']

// Enable profile
await midiDevice.enableProfile('drawbarOrgan');
```

### Web MIDI API and MIDI 2.0

**Current Status (2024):**

- Web MIDI API specification does not yet support MIDI 2.0
- Chrome and other browsers only implement MIDI 1.0
- Future updates may add MIDI 2.0 support

**Preparing for MIDI 2.0:**

```javascript
// Design code to handle higher resolution when available
class VelocityHandler {
    // Normalize velocity to 0-1 range
    static normalize(velocity, bits = 7) {
        const maxValue = (1 << bits) - 1;
        return velocity / maxValue;
    }

    // Convert normalized to specific bit depth
    static denormalize(normalized, bits = 7) {
        const maxValue = (1 << bits) - 1;
        return Math.round(normalized * maxValue);
    }
}

// Works with both MIDI 1.0 (7-bit) and future MIDI 2.0 (16-bit)
const normalized = VelocityHandler.normalize(100, 7); // 0.787
const midi2Velocity = VelocityHandler.denormalize(normalized, 16); // 51609
```

## MIDI 2.0 Profiles

Profiles define standardized behaviors for common use cases.

### Standard Profiles

| Profile                    | Description                  |
| -------------------------- | ---------------------------- |
| **Default Control Change** | Standard CC interpretation   |
| **Drawbar Organ**          | Hammond-style organ controls |
| **Analog Single Synth**    | Classic synth parameters     |
| **Piano**                  | Acoustic piano features      |
| **Electric Piano**         | Rhodes/Wurlitzer features    |

### Profile Example (Conceptual)

```javascript
// Future MIDI 2.0 profile usage
async function setupDrawbarOrgan(device) {
    // Check if profile is supported
    const profiles = await device.getProfiles();

    if (profiles.includes('drawbarOrgan')) {
        await device.enableProfile('drawbarOrgan');

        // Now CC messages map to drawbar positions
        // CC 12-20 = Drawbars 1-9
        device.send([0xb0, 12, 127]); // Drawbar 1 = full
    }
}
```

## Property Exchange

MIDI 2.0 allows JSON-based device queries.

### Property Types

| Property           | Description                  |
| ------------------ | ---------------------------- |
| **DeviceIdentity** | Manufacturer, model, version |
| **ResourceList**   | Available presets, samples   |
| **ChannelList**    | Channel configurations       |
| **Program**        | Current program details      |

### Property Exchange Example (Conceptual)

```javascript
// Future property exchange
async function getDeviceInfo(device) {
    const identity = await device.getProperty('DeviceIdentity');
    // Returns JSON:
    // {
    //   "manufacturer": "Roland",
    //   "model": "FANTOM-8",
    //   "version": "1.5.0"
    // }

    const programs = await device.getProperty('ProgramList');
    // Returns array of available programs with names
}
```

## Backward Compatibility

### Translation Between MIDI 1.0 and 2.0

```javascript
// Convert MIDI 1.0 velocity to MIDI 2.0
function midi1ToMidi2Velocity(velocity7bit) {
    // Scale 7-bit to 16-bit
    // Simple scaling loses precision
    return velocity7bit << 9;

    // Better: preserve full range
    // return (velocity7bit << 9) | (velocity7bit << 2) | (velocity7bit >> 5);
}

// Convert MIDI 2.0 velocity to MIDI 1.0
function midi2ToMidi1Velocity(velocity16bit) {
    return velocity16bit >> 9;
}

// Convert MIDI 1.0 pitch bend (14-bit) to MIDI 2.0 (32-bit)
function midi1ToMidi2PitchBend(lsb, msb) {
    const value14bit = (msb << 7) | lsb;
    // Scale to 32-bit
    return value14bit << 18;
}
```

### Protocol Negotiation

MIDI 2.0 devices negotiate which protocol to use:

1. Device sends MIDI-CI Discovery message
2. Devices exchange supported protocols
3. Higher-capability protocol is selected
4. If no MIDI 2.0 support, fall back to MIDI 1.0

## Practical Considerations for Web Developers

### Current Best Practices

1. **Design for extensibility**: Use normalized values internally
2. **Abstract MIDI handling**: Create wrapper classes that can adapt
3. **Monitor Web MIDI API updates**: Check Chrome Platform Status

```javascript
// Abstraction layer for future MIDI 2.0 support
class MIDIAbstraction {
    #midi1Mode = true;

    constructor(midiAccess) {
        this.midiAccess = midiAccess;
        // Future: detect MIDI 2.0 support
        // this.#midi1Mode = !midiAccess.midi2Enabled;
    }

    // Normalized note on (velocity 0-1)
    noteOn(output, channel, note, velocity) {
        const vel = Math.round(velocity * 127);
        output.send([0x90 | channel, note, vel]);

        // Future MIDI 2.0:
        // if (!this.#midi1Mode) {
        //     const vel16 = Math.round(velocity * 65535);
        //     output.sendMIDI2NoteOn(channel, note, vel16);
        // }
    }

    // Normalized control change (value 0-1)
    controlChange(output, channel, controller, value) {
        const val = Math.round(value * 127);
        output.send([0xb0 | channel, controller, val]);
    }

    // Parse incoming message to normalized format
    parseMessage(data) {
        const status = data[0];
        const type = status & 0xf0;
        const channel = status & 0x0f;

        switch (type) {
            case 0x90:
                return {
                    type: 'noteOn',
                    channel,
                    note: data[1],
                    velocity: data[2] / 127 // Normalized
                };
            case 0x80:
                return {
                    type: 'noteOff',
                    channel,
                    note: data[1],
                    velocity: data[2] / 127
                };
            case 0xb0:
                return {
                    type: 'controlChange',
                    channel,
                    controller: data[1],
                    value: data[2] / 127 // Normalized
                };
            // ... other types
        }
    }
}
```

### Performance Comparison

| Aspect           | MIDI 1.0   | USB-MIDI     | MIDI 2.0        |
| ---------------- | ---------- | ------------ | --------------- |
| **Latency**      | ~1ms       | 1-3ms        | ~1ms (expected) |
| **Bandwidth**    | 31.25 kbps | Up to 1 Mbps | Higher          |
| **Messages/sec** | ~1000      | ~3000        | Higher          |
| **Resolution**   | 7/14-bit   | Same         | 32-bit          |

## Testing MIDI Devices

### Virtual MIDI Devices

For testing without hardware:

**macOS:**

- IAC Driver (built-in)
- Audio MIDI Setup → Enable IAC Driver

**Windows:**

- loopMIDI (free)
- LoopBe1 (free)

**Linux:**

- ALSA virtual MIDI

```javascript
// Detect virtual/software devices
function isVirtualDevice(port) {
    const virtualNames = ['IAC', 'loopMIDI', 'LoopBe', 'Virtual', 'MIDI Through'];

    return virtualNames.some(name => port.name.toLowerCase().includes(name.toLowerCase()));
}
```

### Testing Utilities

```javascript
// MIDI loopback test
async function testMIDILoopback(input, output) {
    return new Promise((resolve, reject) => {
        const testNote = Math.floor(Math.random() * 128);
        const testVelocity = Math.floor(Math.random() * 127) + 1;
        let received = false;

        const timeout = setTimeout(() => {
            if (!received) {
                input.onmidimessage = null;
                reject(new Error('Loopback test timeout'));
            }
        }, 1000);

        input.onmidimessage = event => {
            const [status, note, velocity] = event.data;

            if ((status & 0xf0) === 0x90 && note === testNote && velocity === testVelocity) {
                received = true;
                clearTimeout(timeout);
                input.onmidimessage = null;

                // Send note off
                output.send([0x80, testNote, 0]);
                resolve(true);
            }
        };

        output.send([0x90, testNote, testVelocity]);
    });
}
```

## Resources

### Specifications

- [USB-MIDI Class Specification](https://www.usb.org/document-library/usb-midi-devices-10)
- [MIDI 2.0 Specification](https://midi.org/specifications/midi-2-0-specifications)
- [MIDI-CI Specification](https://midi.org/specifications/midi-ci)

### Tools

- [MIDI Monitor](https://www.snoize.com/MIDIMonitor/) (macOS)
- [MIDI-OX](http://www.midiox.com/) (Windows)
- [Protokol](https://hexler.net/protokol) (Cross-platform)

### Libraries

- [JZZ](https://github.com/jazz-soft/JZZ) - Node.js/Browser MIDI library
- [WebMidi.js](https://github.com/djipco/webmidi) - Web MIDI wrapper

---

_This document covers USB-MIDI and MIDI 2.0 as of 2024. Web MIDI API support for MIDI 2.0 features may be added in future browser updates._
