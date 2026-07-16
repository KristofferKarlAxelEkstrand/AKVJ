---
title: MIDI 2.0 / UMP Quick Reference
protocol: midi2
summary: Universal MIDI Packet message types and sizes, MIDI 2.0 channel voice messages, groups, JR timestamps, and the MIDI 1.0 ↔ 2.0 value scaling rules.
---

# MIDI 2.0 / UMP Quick Reference

Source of truth: UMP & MIDI 2.0 Protocol Specification (doc `m2-104-um-ump-and-midi-2-0-protocol-specification`), Bit Scaling and Resolution (doc `m2-115-u-midi-2-0-bit-scaling-and-resolution`), MIDI-CI (doc `m2-101-um-midi-ci-specification`).

## Universal MIDI Packet (UMP)

Fixed-size packets of 1–4 32-bit words. The first nibble is the **Message Type (MT)**, which determines packet size:

| MT  | Size     | Contents                                                 |
| --- | -------- | -------------------------------------------------------- |
| 0x0 | 32 bits  | Utility (NOOP, JR Clock, JR Timestamp, Delta Clockstamp) |
| 0x1 | 32 bits  | System Real-Time and System Common                       |
| 0x2 | 32 bits  | MIDI 1.0 Channel Voice (7-bit data, in UMP container)    |
| 0x3 | 64 bits  | Data messages incl. SysEx7                               |
| 0x4 | 64 bits  | MIDI 2.0 Channel Voice (high resolution)                 |
| 0x5 | 128 bits | Data messages incl. SysEx8 and Mixed Data Set            |
| 0xD | 128 bits | Flex Data (lyrics, chords, tempo, key signature, …)      |
| 0xF | 128 bits | UMP Stream (endpoint discovery, function blocks, …)      |

Most other MT values are reserved. Second nibble of word 0 is the **Group** (0–15); each group carries an independent 16-channel MIDI stream (so UMP addresses 16 × 16 = 256 channels).

## MIDI 2.0 Channel Voice messages (MT 0x4)

| Opcode | Message                        | Resolution vs MIDI 1.0                              |
| ------ | ------------------------------ | --------------------------------------------------- |
| 0x8    | Note Off                       | 16-bit velocity (was 7) + attribute                 |
| 0x9    | Note On                        | 16-bit velocity + 16-bit attribute (e.g. pitch 7.9) |
| 0xA    | Poly Pressure                  | 32-bit data                                         |
| 0x0    | Registered Per-Note Controller | new — per-note, 32-bit                              |
| 0x1    | Assignable Per-Note Controller | new — per-note, 32-bit                              |
| 0xF    | Per-Note Management            | new — detach/reset per-note controllers             |
| 0xB    | Control Change                 | 32-bit value                                        |
| 0x2    | Registered Controller (RPN)    | direct message, 32-bit (no CC 101/100/6/38 dance)   |
| 0x3    | Assignable Controller (NRPN)   | direct message, 32-bit                              |
| 0x4    | Relative Registered Controller | new                                                 |
| 0x5    | Relative Assignable Controller | new                                                 |
| 0xC    | Program Change                 | with option flag to include bank                    |
| 0xD    | Channel Pressure               | 32-bit data                                         |
| 0xE    | Pitch Bend                     | 32-bit value                                        |
| 0x6    | Per-Note Pitch Bend            | new — per-note, 32-bit                              |

**MIDI 2.0 Note On velocity 0 is NOT a Note Off** (unlike MIDI 1.0). When translating MIDI 1.0 → 2.0, a 1.0 Note On with velocity 0 must become a 2.0 Note Off.

## Value scaling between MIDI 1.0 and 2.0 (M2-115-U)

- **Upscaling (7→16, 7→32, 14→32 bits)**: use _bit-repeat_ of the source value into the extra low bits (not plain left-shift, which would compress the top of the range; not multiplication). Center-based values (pitch bend, pan) scale around center: min→min, center→center, max→max.
- **Downscaling**: simple right-shift (truncate low bits).
- Velocity 7→16-bit: left-shift 9 with bit-repeat; velocity 0 special-cased (see above).

## Timing

- **JR Timestamp** (MT 0x0): 16-bit, 1/31250-second units — attaches send-time to the following message for jitter reduction.
- **JR Clock**: sender's clock broadcast for receiver synchronization.
- MIDI 1.0-style System Real-Time messages (Clock 0xF8, Start/Stop/Continue) still exist as MT 0x1 messages.

## MIDI-CI (M2-101-UM)

Bidirectional negotiation over Universal SysEx (0x7E … 0x0D …). Three pillars:

1. **Discovery** — exchange MUIDs (28-bit random device IDs), device identity, and supported features
2. **Profile Configuration** — enable/disable standardized behavior sets (e.g. MPE Profile, GM2 Profiles)
3. **Property Exchange** — JSON resources over SysEx chunks (DeviceInfo, ProgramList, device state)

Protocol negotiation (MIDI 1.0 vs 2.0 protocol on the link) was part of MIDI-CI v1.1 but is handled by UMP Stream messages since UMP v1.1.

## Web MIDI status

The Web MIDI API (Chrome/Chromium) speaks MIDI 1.0 byte streams only — no UMP/MIDI 2.0 support yet. OS-level MIDI 2.0 stacks (Windows MIDI Services, macOS CoreMIDI, ALSA) translate UMP ↔ 1.0 for legacy clients.
