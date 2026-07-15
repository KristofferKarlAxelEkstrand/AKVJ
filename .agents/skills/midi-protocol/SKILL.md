---
name: midi-protocol
description: >
  Deep MIDI protocol and Web MIDI API expertise for the AKVJ project.
  Use this skill when working on MIDI-related code, Web MIDI API usage,
  MIDI message parsing, channel mapping, BPM synchronization, clip
  triggering via MIDI, hot-plug device handling, or writing tests that
  involve MIDI input. Also use when debugging MIDI issues, adding new
  MIDI channels or effects, or modifying the MIDI-to-visual pipeline.
license: MIT
---

# MIDI Protocol Skill for AKVJ

This skill provides comprehensive MIDI protocol knowledge specific to the AKVJ (Adventure Kid Video Jockey) codebase. It covers the MIDI 1.0 protocol, the Web MIDI API, AKVJ's implementation, and testing patterns.

## MIDI 1.0 Protocol Reference

### Physical Layer

MIDI's hardware transport defines its latency characteristics and limitations:

| Property | Value |
| --- | --- |
| Baud rate | 31,250 bits/second (fixed) |
| Data format | 1 start bit, 8 data bits, no parity, 1 stop bit (10 bits/byte) |
| Throughput | 3,125 bytes/second |
| 3-byte message time | ~1ms (e.g., Note On/Off) |
| Direction | Unidirectional (separate IN/OUT cables) |
| Error correction | None â€” lost data is simply lost |
| Connector | 5-pin DIN (traditional), USB (modern) |
| Max cable length | 15 meters (50 feet) |
| Electrical | Current loop, 5mA, opto-isolated at receiver |

USB-MIDI uses bulk transfer packets (4 bytes per event), eliminating the 31,250 baud limit. USB-MIDI devices appear as class-compliant devices and don't need drivers on most OSes.

#### Transport Latency Comparison

| Transport | Typical Latency | Jitter |
| --- | --- | --- |
| DIN MIDI (5-pin) | ~1-3ms | < 1ms |
| USB-MIDI (class compliant) | ~2-10ms | 2-5ms |
| Bluetooth MIDI | ~7-15ms | 5-10ms |
| RTP-MIDI (network) | ~5-20ms | varies |

USB introduces several ms of random delay per packet. OS scheduling adds further jitter since MIDI is typically low priority. These factors affect MIDI Clock accuracy â€” AKVJ mitigates this by averaging pulse intervals.

### Byte Format

MIDI uses 8-bit bytes with a strict distinction:

- **Status byte**: Bit 7 set (`1xxxxxxx`, values 128â€“255) â€” defines message type and channel
- **Data byte**: Bit 7 clear (`0xxxxxxx`, values 0â€“127) â€” carries the payload

Status byte structure for channel messages:

```
1nnntttt
â”‚â”‚â”‚â””â”€â”´â”€â”´â”€â”´â”€ Message type (upper nibble)
â””â”€â”´â”€â”´â”€â”€â”€â”€â”€â”€â”€ Channel number (lower nibble, 0â€“15)
```

### Message Length Rules (W3C Web MIDI Spec)

| Status High Nibble | Message Type         | Total Bytes |
| --- | --- | --- |
| `0x8`              | Note Off             | 3           |
| `0x9`              | Note On              | 3           |
| `0xA`              | Poly Key Pressure    | 3           |
| `0xB`              | Control Change       | 3           |
| `0xE`              | Pitch Bend           | 3           |
| `0xC`              | Program Change       | 2           |
| `0xD`              | Channel Pressure     | 2           |
| `0xF0`             | System Exclusive     | Variable    |
| `0xF1`, `0xF3`     | System Common (2-byte) | 2         |
| `0xF2`             | Song Position Pointer | 3          |
| `0xF6`, `0xF8`â€“`0xFF` | System Real-Time / Tune | 1       |

Invalid status bytes: `0xF4`, `0xF5`, `0xF7`, `0xF9`, `0xFD` â€” these are reserved/undefined.

### Channel Voice Messages

#### Note On (`0x9n`)

```
[0x9n, note, velocity]
```

- `n`: channel (0â€“15)
- `note`: 0â€“127 (60 = middle C, 69 = A4 / 440 Hz)
- `velocity`: 1â€“127 (0 = equivalent to Note Off)

```javascript
// Middle C on channel 0, velocity 100
[0x90, 60, 100]
```

#### Note Off (`0x8n`)

```
[0x8n, note, velocity]
```

- `velocity`: release velocity (usually 0, often ignored)

```javascript
// Stop middle C on channel 0
[0x80, 60, 0]
```

**Critical**: Note On with velocity 0 is equivalent to Note Off. This is standard MIDI convention and AKVJ handles both cases.

#### Control Change (`0xBn`)

```
[0xBn, controller, value]
```

AKVJ uses CC 0 on channel 0 as a BPM fallback (when no MIDI Clock is present). Other common CCs are listed for reference but not currently used by AKVJ:

| CC# | Name            | Range | Notes                              |
| --- | --------------- | ----- | ---------------------------------- |
| 0   | Bank Select MSB | 0â€“127 | **Used by AKVJ as BPM fallback**   |
| 1   | Modulation      | 0â€“127 | Not used by AKVJ                   |
| 7   | Volume          | 0â€“127 | Not used by AKVJ                   |
| 10  | Pan             | 0â€“127 | 64 = center                        |
| 64  | Sustain Pedal   | 0/127 | 0â€“63 = off, 64â€“127 = on            |
| 120 | All Sound Off   | 0     | Emergency silence                  |
| 123 | All Notes Off   | 0     | Release all notes                  |

For the full list of all 128 CC numbers, see `docs/midi-controller-reference.md`.

#### Channel Mode Messages (CC 120â€“127)

CC numbers 120â€“127 are technically "Channel Mode Messages", not regular Control Change. They affect the entire channel's behavior rather than a continuous controller parameter:

| CC# | Name                | Value  | Effect                                      |
| --- | ------------------- | ------ | ------------------------------------------- |
| 120 | All Sound Off       | 0      | Immediately silence all voices              |
| 121 | Reset All Controllers | 0    | Reset all CCs to default                    |
| 122 | Local Control       | 0/127  | 0 = disconnect keyboard from synth engine   |
| 123 | All Notes Off       | 0      | Release all notes (not immediate silence)   |
| 124 | Omni Mode Off       | 0      | Respond to assigned channels only           |
| 125 | Omni Mode On        | 0      | Respond to all channels                     |
| 126 | Mono Mode On        | n      | n = number of channels (0 = all 16)         |
| 127 | Poly Mode On        | 0      | Full polyphonic mode                        |

AKVJ does not use Channel Mode Messages. They are listed here for completeness and for implementing stuck-note prevention (see Common Pitfalls).

#### Pitch Bend (`0xEn`)

```
[0xEn, lsb, msb]
```

14-bit precision: `value = lsb | (msb << 7)`, range 0â€“16383, center = 8192.

```javascript
// No bend (center)
[0xe0, 0, 64]  // 0 + (64 << 7) = 8192

// Maximum bend up
[0xe0, 127, 127]  // 16383

// Maximum bend down
[0xe0, 0, 0]  // 0
```

#### Program Change (`0xCn`)

```
[0xCn, program]
```

Single data byte (0â€“127). No LSB.

#### Polyphonic Key Pressure (`0xAn`)

```
[0xAn, note, pressure]
```

Per-note aftertouch.

#### Channel Pressure (`0xDn`)

```
[0xDn, pressure]
```

Single data byte. Channel-wide aftertouch.

### RPN and NRPN (Parameter Number Messages)

RPN (Registered Parameter Number) and NRPN (Non-Registered Parameter Number) extend CC to support >128 parameters with 14-bit resolution (0â€“16383). They work by selecting a parameter via CC pairs, then setting its value via Data Entry CCs:

**Parameter Selection:**

| Type | CC (MSB) | CC (LSB) | Purpose |
| --- | --- | --- | --- |
| RPN  | 101 | 100 | Standardized parameters |
| NRPN | 99  | 98  | Manufacturer-specific parameters |

**Value Setting:**

| CC  | Purpose | Resolution |
| --- | --- | --- |
| 6   | Data Entry MSB | 7-bit (0â€“127) |
| 38  | Data Entry LSB | 14-bit when combined with MSB |
| 96  | Data Increment | +1 per message |
| 97  | Data Decrement | -1 per message |

**Standard RPNs:**

| RPN (MSB, LSB) | Name |
| --- | --- |
| (0, 0) | Pitch Bend Sensitivity (range in semitones + cents) |
| (0, 1) | Master Fine Tuning (14-bit, 8192 = A440) |
| (0, 2) | Master Coarse Tuning (semitones) |
| (0, 3) | Tuning Program Select |
| (0, 4) | Tuning Bank Select |
| (127, 127) | Null â€” deselect active parameter |

**Critical**: Always send RPN Null (CC 101=127, CC 100=127) after setting a parameter. If you don't, subsequent Data Entry messages will unintentionally modify the last-selected parameter. Only one RPN/NRPN can be active per channel at a time.

AKVJ does not currently use RPN/NRPN.

### System Real-Time Messages

Single-byte messages (no channel, no data bytes). These are high-priority timing messages that **can interrupt other messages** in the MIDI stream â€” the Web MIDI API dispatches them immediately while buffering the interrupted message.

| Status | Message          | AKVJ Usage                              |
| --- | --- | --- |
| `0xF8` | Timing Clock     | 24 pulses per quarter note (BPM sync)   |
| `0xFA` | Start            | Resets clock state for fresh sync       |
| `0xFB` | Continue         | Resumes clock from current position     |
| `0xFC` | Stop             | Pauses BPM sync (keeps last BPM)        |
| `0xFE` | Active Sensing   | Not used by AKVJ (ignored)              |
| `0xFF` | System Reset     | Not used by AKVJ (ignored)              |

#### Active Sensing (`0xFE`)

Active Sensing is an optional heartbeat mechanism:

- Sent repeatedly every 300ms (max) to indicate the connection is alive
- If the receiver stops getting Active Sensing within 300ms, it assumes the connection was terminated
- At termination, the receiver turns off all voices (prevents stuck notes from disconnected cables)
- Many devices don't send it â€” it's entirely optional
- AKVJ correctly ignores it (falls through to the `default` case in the switch)

#### MIDI Clock Timing Details

MIDI Clock sends 24 pulses per quarter note (24 PPQN) â€” this is fixed by the spec and cannot be changed:

| BPM | Pulses/Second | ms Between Pulses |
| --- | --- | --- |
| 60  | 24  | ~41.67ms |
| 120 | 48  | ~20.83ms |
| 180 | 72  | ~13.89ms |

- Start (`0xFA`) should be followed immediately by Clock pulses
- Continue (`0xFB`) resumes from the current position without resetting
- Stop (`0xFC`) halts clock; AKVJ keeps the last calculated BPM
- USB and OS scheduling introduce jitter (several ms of random delay)
- AKVJ mitigates jitter by averaging the last 24 pulse intervals before calculating BPM

### System Common Messages

| Status | Message                  | Format                          |
| --- | --- | --- |
| `0xF0` | System Exclusive (start) | `[0xF0, mfr_id, ...data, 0xF7]` |
| `0xF1` | MTC Quarter Frame        | `[0xF1, data]`                  |
| `0xF2` | Song Position Pointer    | `[0xF2, lsb, msb]`              |
| `0xF3` | Song Select              | `[0xF3, song_number]`           |
| `0xF6` | Tune Request             | `[0xF6]`                        |

#### System Exclusive (SysEx) Format

SysEx allows manufacturer-specific data transfer with variable length:

```
F0 <manufacturer_id> <device_id> <model_id> <data...> <checksum> F7
```

- **Manufacturer IDs**: 1-byte (0x01â€“0x7D) or 3-byte (0x00 + 2 bytes, for IDs > 127)
- **Special IDs**:
  - `0x7D` = non-commercial / experimental
  - `0x7E` = universal non-real-time (Identity Request, General MIDI on/off, Sample Dump)
  - `0x7F` = universal real-time (Master Volume, MTC, MMC, Device Control)
- **Device ID** `0x7F` = broadcast to all devices
- **Checksum**: All data bytes + checksum = 0 (mod 128) for Roland-style; other manufacturers may differ
- **EOX** (`0xF7`): End of Exclusive â€” terminates the message

Common SysEx messages:

```javascript
// General MIDI System On
[0xf0, 0x7e, 0x7f, 0x09, 0x01, 0xf7]

// Master Volume (14-bit: ll=LSB, mm=MSB, 0x7f7f = maximum)
[0xf0, 0x7f, 0x7f, 0x04, 0x01, 0x7f, 0x7f, 0xf7]

// Identity Request (asks device to report its manufacturer/model)
[0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]
```

The Web MIDI API requires `sysex: true` in `requestMIDIAccess()` to send or receive SysEx. AKVJ does not use SysEx.

### Running Status

Running status omits repeated status bytes to save bandwidth. **The Web MIDI API does not allow running status in `MIDIOutput.send()`** â€” each message must include its full status byte. Incoming running status may or may not be decoded by the browser's MIDI driver.

### Channels: 0â€“15 vs 1â€“16

MIDI uses 0â€“15 internally (in the status byte's lower nibble). DAWs and hardware display channels as 1â€“16. This is an industry-wide convention.

**In AKVJ**: Source clip folders use 1â€“16 (matching DAWs). The build pipeline converts to 0â€“15 for code. Always use 0â€“15 in code and 1â€“16 when communicating with users.

### Note Number Reference

```
MIDI Note = (octave + 1) * 12 + semitone_offset

C-1 = 0 (lowest)
C4  = 60 (middle C)
A4  = 69 (concert A, 440 Hz)
G9  = 127 (highest)
```

**Octave numbering ambiguity**: The MIDI standard does not officially define octave numbering. The convention "C4 = 60" is used by Roland and most DAWs. Yamaha uses "C3 = 60". Always clarify which convention you're using when discussing note names.

#### Note-to-Frequency Formula

```
f = 440 Ã— 2^((n - 69) / 12)
```

Where `n` = MIDI note number, `f` = frequency in Hz. Based on equal temperament with A4 = 440 Hz.

| Note | MIDI # | Frequency |
| --- | --- | --- |
| C3  | 48  | 130.81 Hz |
| C4  | 60  | 261.63 Hz |
| A4  | 69  | 440.00 Hz |
| C5  | 72  | 523.25 Hz |
| C6  | 84  | 1046.50 Hz |

### Velocity Ranges

| Dynamic | Velocity Range |
| --- | --- |
| ppp     | 1â€“16           |
| pp      | 17â€“32          |
| p       | 33â€“48          |
| mp      | 49â€“64          |
| mf      | 65â€“80          |
| f       | 81â€“96          |
| ff      | 97â€“112         |
| fff     | 113â€“127        |

In AKVJ, velocity selects clip variants (not volume). The `findVelocityThreshold()` function uses a floor strategy: returns the highest configured velocity threshold that doesn't exceed the input velocity.

### General MIDI Reference

General MIDI (GM) is a standard instrument mapping, not used by AKVJ but relevant for context:

- **GM1**: 128 instruments (programs 0â€“127), drum kit on channel 10 (code channel 9)
- **GM2**: Extended set, 256 instruments
- Not used by AKVJ (AKVJ uses MIDI for visual control, not sound generation)
- **Notable coincidence**: GM's drum channel (10 / code 9) is the same channel AKVJ uses for mixed output effects

## Web MIDI API Reference

### Browser Support

- **Chrome/Chromium only** â€” required for AKVJ
- Firefox and Safari do not support the Web MIDI API
- Not available inside Docker/devcontainer (no MIDI hardware access)

### Core API

#### `navigator.requestMIDIAccess(options?)`

Returns `Promise<MIDIAccess>`. Requires user permission (secure context).

```javascript
const access = await navigator.requestMIDIAccess({ sysex: false });
```

Options:
- `sysex`: boolean (default `false`) â€” enables System Exclusive messages
- `software`: boolean â€” enables software MIDI devices

#### `MIDIAccess`

```javascript
interface MIDIAccess extends EventTarget {
    readonly inputs: MIDIInputMap;    // Map of MIDIInput objects
    readonly outputs: MIDIOutputMap;  // Map of MIDIOutput objects
    onstatechange: EventHandler;      // Device connect/disconnect events
    readonly sysexEnabled: boolean;
}
```

**Important**: Leaving an `onstatechange` handler attached prevents garbage collection. Always remove listeners in cleanup.

#### `MIDIInput`

```javascript
interface MIDIInput extends MIDIPort {
    onmidimessage: EventHandler;  // Fired when MIDI message received
}
```

Setting `onmidimessage` (or calling `addEventListener('midimessage', ...)`) implicitly opens the port.

The `MIDIMessageEvent` contains:
- `data`: `Uint8Array` â€” raw MIDI message bytes (single complete message)
- `timeStamp`: `DOMHighResTimeStamp` â€” high-resolution time the message was received by the system

**About `timeStamp`**: It is a `DOMHighResTimeStamp` (same type as `performance.now()`), relative to `performance.timeOrigin` (navigation start), NOT Unix epoch. It can be compared directly to `performance.now()` values. AKVJ uses `performance.now()` instead of `event.timeStamp` â€” this measures processing time rather than receive time, which is more consistent with the render loop's `requestAnimationFrame` timestamps. Both approaches are valid; the difference is typically < 1ms.

**System Real-Time messages can arrive mid-message** â€” the browser buffers the interrupted message and dispatches the real-time message immediately, then completes the original message.

#### `MIDIOutput`

```javascript
interface MIDIOutput extends MIDIPort {
    send(data: sequence<octet>, timestamp?: DOMHighResTimeStamp): void;
    clear(): void;
}
```

- `send()`: Enqueues a complete MIDI message. No running status allowed. Throws `TypeError` for invalid messages, `NotAllowedError` for SysEx without permission, `InvalidStateError` if port disconnected.
- `clear()`: Clears unsent messages. If mid-SysEx, sends `0xF7` termination.

#### Port States

| Property    | Values                          |
| --- | --- |
| `state`     | `"connected"` / `"disconnected"` |
| `connection`| `"open"` / `"closed"` / `"pending"` |
| `type`      | `"input"` / `"output"`           |

When a device is disconnected, its port enters `"pending"` state. On reconnection, the browser attempts to reopen it. If successful, returns to `"open"`; otherwise `"closed"`.

### Security Considerations

- Requires explicit user permission (permissions API)
- Device enumeration can be used for fingerprinting
- SysEx access requires separate permission (`sysex: true`)
- Secure context required (HTTPS or localhost)
- SysEx can be used for firmware updates â€” browsers inform users of this risk

## AKVJ MIDI Implementation

### Architecture Overview

```
MIDI Hardware â†’ Web MIDI API â†’ Midi.js (singleton) â†’ AppState (events) â†’ LayerManager/Effects
```

### Key Files

| File | Purpose |
| --- | --- |
| `src/js/midi-input/Midi.js` | Web MIDI API singleton, device management, message parsing |
| `src/js/core/AppState.js` | Event-based state, BPM calculation, event dispatch |
| `src/js/core/settings.js` | Channel mapping, command codes, PPQN, BPM config |
| `src/js/utils/velocitySelection.js` | Velocity-based clip selection (floor strategy) |

### Message Parsing Flow (`Midi.js`)

```
1. Receive MIDIMessageEvent
2. If message.data is null/undefined or length === 0 â†’ ignore
3. Extract status byte: message.data[0]
4. If status >= 0xF8 â†’ System Real-Time (handle first, return early)
   - 0xF8: dispatchMIDIClock(performance.now())
   - 0xFA: dispatchMIDIStart()
   - 0xFB: dispatchMIDIContinue()
   - 0xFC: dispatchMIDIStop()
5. If message.data.length < 3 â†’ ignore (channel messages need 3 bytes)
6. Extract: command = status >> 4, channel = status & 0xF
7. Extract: note = data[1], velocity = data[2]
8. Switch on command:
   - 9 (Note On): velocity > 0 â†’ dispatchMIDINoteOn; velocity 0 â†’ dispatchMIDINoteOff
   - 8 (Note Off): dispatchMIDINoteOff
   - 11 (CC): dispatchMIDIControlChange (note = controller, velocity = value)
```

Note: AKVJ passes `performance.now()` to `dispatchMIDIClock()`, not `message.timeStamp`. This ensures BPM calculation uses the browser's high-resolution timer at the moment of processing, which is consistent with the render loop's timing.

### AppState Events

| Event Name                | Detail                                          |
| --- | --- |
| `midiNoteOn`              | `{ channel, note, velocity }`                   |
| `midiNoteOff`             | `{ channel, note }`                             |
| `midiControlChange`       | `{ channel, controller, value }`                |
| `midiClock`               | `{ timestamp }`                                 |
| `midiStart`               | (no detail)                                     |
| `midiContinue`            | (no detail)                                     |
| `midiStop`                | (no detail)                                     |
| `bpmChanged`              | `{ bpm, source }` â€” source: `'clock'`/`'cc'`/`'manual'` |
| `bpmSourceChanged`        | `{ source, bpm }` â€” fired when clock times out, source: `'default'` |
| `midiConnectionChanged`   | `{ connected }`                                 |
| `clipsLoadedChanged`      | `{ loaded }`                                    |
| `videoJockeyReady`        | (no detail)                                     |

### BPM Synchronization

AKVJ supports two BPM sources with priority:

1. **MIDI Clock (highest priority)**: 24 PPQN. `AppState.dispatchMIDIClock()` averages the last 24 pulse intervals to calculate BPM. Requires at least 6 intervals before calculating. Falls back to default after 500ms without clock pulses (`settings.bpm.clockTimeoutMs`).

2. **MIDI CC (fallback)**: CC number `settings.bpm.controlCC` (default 0) on channel `settings.bpm.controlChannel` (default 0). Maps 0â€“127 to `settings.bpm.min`â€“`settings.bpm.max` (10â€“522 BPM). Only used when clock source is not active.

3. **Default**: 120 BPM when no clock or CC received.

### Settings Reference (`settings.midi`)

```javascript
{
    channels: { min: 0, max: 15 },
    notes: { min: 0, max: 127 },
    messageMinLength: 3,
    velocity: { min: 0, max: 127 },
    commands: {
        noteOff: 8,        // 0x8n
        noteOn: 9,         // 0x9n
        controlChange: 11  // 0xBn
    },
    systemRealTime: {
        clock: 0xf8,
        start: 0xfa,
        continue: 0xfb,
        stop: 0xfc
    },
    ppqn: 24
}
```

### Hot-Plug Support

`midi.js` listens for `statechange` events on `MIDIAccess`. When a device connects or disconnects, it automatically attaches/detaches the `midimessage` handler. This supports hot-plugging MIDI devices during live performance.

### Cleanup Pattern

`midi.js` implements a `destroy()` method that:
1. Removes `midimessage` listeners from all connected inputs
2. Clears the `statechange` listener from `MIDIAccess`
3. Resets `appState.midiConnected = false`

This is called during HMR disposal and in tests.

## AKVJ Channel Mapping

### Channel Assignments (0â€“15 in code, 1â€“16 in DAWs)

| Channels (code) | Channels (DAW) | Layer Group          | Function                                       |
| --- | --- | --- | --- |
| 0â€“3             | 1â€“4            | Layer Group A        | Primary clip deck (4 slots)                    |
| 4               | 5              | Mixer                | B&W bitmask for Layer Group A and Layer Group B crossfade      |
| 5â€“8             | 6â€“9            | Layer Group B        | Secondary clip deck (4 slots)                  |
| 9               | 10             | Mixed output effects | Effects applied to mixed Layer Group A and Layer Group B output |
| 10â€“11           | 11â€“12          | Layer Group C        | Overlay layer (logos)                          |
| 12              | 13             | Global effects       | Effects on entire output                       |
| 13â€“15           | 14â€“16          | Reserved             | Ignored                                        |

### Effect Note Ranges (Channels 9 and 12)

| Note Range | Effect Category           |
| --- | --- |
| 0â€“15       | Split/Divide              |
| 16â€“31      | Mirror                    |
| 32â€“47      | Offset/Shift              |
| 48â€“63      | Color (invert, posterize) |
| 64â€“79      | Glitch                    |
| 80â€“95      | Strobe/Flash              |
| 96â€“127     | Reserved                  |

### Strobe Velocity Behavior (Notes 80â€“95)

- Velocity 0: Off (no effect)
- Velocities 1â€“9: Full-frame white-out flash (always on)
- Velocities 10â€“19: 1 pulse per beat
- Velocities 20â€“29: 2 pulses per beat
- Each 10-velocity bucket increases pulses by 1 (clamped to max 12)
- Velocities 120â€“127: 12 pulses per beat
- Duty cycle varies within each bucket: 0.25â€“0.50 based on the remainder within the 10-velocity bucket (e.g., velocity 10 = 25% duty, velocity 19 = 50% duty)
- Synchronized to current BPM (MIDI Clock when available, CC/default fallback)
- Deterministic (no random flashes)

### Clip Folder Structure

Source folders use 1â€“16 (DAW convention). Build pipeline converts to 0â€“15.

```
clips/{channel_1-16}/{note}/{velocity}/
  â”œâ”€â”€ meta.json
  â””â”€â”€ sprite.png
```

## Testing MIDI in AKVJ

### Test Utilities

| File | Purpose |
| --- | --- |
| `test/utils/fake-midi.js` | Fake MIDI inputs, access objects, and environment factory |
| `test/utils/midi-fixture.js` | `useFakeMIDIFixture()` â€” beforeEach/afterEach setup |
| `test/utils/invoke-listeners.js` | `invokeListeners()` â€” simulate MIDI message events |
| `test/utils/wait-for-event.js` | `waitForEvent()` â€” async wait for AppState events |

### Simulating MIDI Messages

```javascript
import { useFakeMIDIFixture } from './utils/midi-fixture.js';
import { invokeListeners } from './utils/invoke-listeners.js';

const { getEnv, recreateEnv } = useFakeMIDIFixture([{ id: 'fake-1', name: 'Fake MIDI' }]);

// Simulate Note On: channel 0, note 60, velocity 127
invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0x90, 60, 127]) });

// Simulate Note Off: channel 0, note 60
invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0x80, 60, 0]) });

// Simulate Note On with velocity 0 (equivalent to Note Off)
invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0x90, 60, 0]) });

// Simulate MIDI Clock pulse
invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0xf8]) });

// Simulate CC: channel 0, controller 0, value 64
invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0xb0, 0, 64]) });
```

### Container Limitations

- **No MIDI hardware access** inside Docker/devcontainer
- `navigator.requestMIDIAccess` will fail â€” always use fake MIDI utilities in tests
- No Chrome/Chromium installed in the base image
- Visual/MIDI integration testing requires port forwarding to host browser

### Test Patterns

```javascript
// Waiting for an AppState event
const promise = waitForEvent(appState, 'midiNoteOn');
invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0x90, 60, 127]) });
const event = await promise;
expect(event.detail.channel).toBe(0);
expect(event.detail.note).toBe(60);
expect(event.detail.velocity).toBe(127);
```

```javascript
// Hot-plug testing
env.connectInput('hotplug-1');
expect(midi.getConnectedDevices()).toEqual(['hotplug-1']);
expect(appState.midiConnected).toBe(true);

env.disconnectInput('hotplug-1');
expect(midi.getConnectedDevices()).toEqual([]);
expect(appState.midiConnected).toBe(false);
```

## Common Pitfalls and Best Practices

### Channel Numbers
- **Code uses 0â€“15**, DAWs display 1â€“16. Always clarify which convention you're using.
- Source clip folders use 1â€“16; the build pipeline converts to 0â€“15.

### Note On Velocity 0
- Note On with velocity 0 is equivalent to Note Off. Always handle both `0x8n` and `0x9n` with velocity 0.
- AKVJ's `midi.js` checks `velocity > 0` in the Note On case to dispatch the correct event.

### Stuck Notes
- A stuck note occurs when Note On is received but Note Off is never received (cable disconnected, app crash, etc.)
- **Active Sensing** (`0xFE`) helps detect dead connections â€” receiver turns off all voices after 300ms timeout
- **All Notes Off** (CC 123) can be sent as a panic button
- **All Sound Off** (CC 120) is more aggressive â€” immediately silences
- AKVJ doesn't implement stuck note prevention (relies on DAW/controller to send Note Off)
- If implementing: listen for `statechange` with `disconnected` and send All Notes Off for all active channels

### System Real-Time Messages
- Can interrupt other messages in the MIDI stream. Handle them **before** channel messages.
- AKVJ checks `status >= 0xF8` first and returns early.
- Single-byte messages â€” no channel, no data bytes.

### Timing
- Use `performance.now()` for all timing, never `Date.now()`.
- AKVJ passes `performance.now()` to `dispatchMIDIClock()`, not `message.timeStamp` â€” this ensures timing consistency with the render loop.
- `message.timeStamp` is also a `DOMHighResTimeStamp` and can be compared directly to `performance.now()`. The difference between the two is typically < 1ms.
- BPM calculation averages pulse intervals for stability.

### Event Listener Cleanup
- Cache bound handlers (`#boundHandleMIDIMessage = this.#handleMIDIMessage.bind(this)`) so they can be removed later.
- Always implement `destroy()` to remove all listeners and reset state.
- In HMR, use `import.meta.hot.dispose()` to call cleanup methods.
- Leaving listeners attached prevents garbage collection of `MIDIAccess`.

### Message Validation
- Guard for `message.data.length === 0` (empty message)
- Guard for `message.data.length < 3` for channel messages (AKVJ uses `settings.midi.messageMinLength`)
- Guard for `null`/`undefined` data before accessing bytes

### Web MIDI API Quirks
- No running status in `MIDIOutput.send()` â€” always send complete messages
- `addEventListener` vs `onmidimessage` â€” AKVJ supports both via feature detection
- Port auto-opens when `onmidimessage` is set
- Some systems poll for new devices infrequently â€” don't rely solely on `statechange` events

### Performance
- MIDI message handling must be < 20ms latency (input to visual output)
- Never block the render loop with MIDI processing
- BPM calculation is O(n) where n = PPQN (24) â€” negligible cost
- Avoid creating new objects in the hot path of message handling

### Feature Detection
- Always check `navigator.requestMIDIAccess` exists before calling
- AKVJ's `midi.js` checks `#isSupported()` first and logs a dev-only message if unsupported
- Wrap in try-catch â€” `requestMIDIAccess()` can reject (permission denied)

## Existing Documentation

For deeper reference, see these project docs:

- `docs/midi-protocol-guide.md` â€” Full MIDI 1.0 protocol reference with code examples
- `docs/how-to-program-midi.md` â€” DAW setup guide and AKVJ channel mapping
- `docs/midi-controller-reference.md` â€” All 128 CC numbers with descriptions
- `docs/usb-midi-and-midi2-reference.md` â€” USB-MIDI packet format and MIDI 2.0 overview

## MIDI 2.0 Reference

MIDI 2.0 (released 2020) is the first major protocol update. Key features:

- **UMP (Universal MIDI Packet)**: Fixed-size packets (4, 8, 16, or 32 bytes) replacing variable-length MIDI 1.0 messages
- **MIDI-CI (Capability Inquiry)**: Bidirectional protocol for device discovery and negotiation
- **32-bit resolution**: Velocity, CC, and other values expand from 7-bit to 32-bit
- **Per-note management**: Individual note pitch, timbre, and pressure control
- **Jitter Reduction Timestamps (JRTS)**: Built-in timestamping for sync accuracy over jittery transports
- **Backward compatible**: MIDI 1.0 messages are encapsulated in UMP format for coexistence
- **Property Exchange**: Devices can query/set human-readable properties (name, manufacturer, model)

The Web MIDI API does not yet support MIDI 2.0 (as of 2025). AKVJ targets MIDI 1.0 only. If MIDI 2.0 support is added in the future, design internal values as normalized (0â€“1) for easy scaling between bit depths.
