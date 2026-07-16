---
title: MIDI 1.0 Status Byte Quick Reference
protocol: midi1
summary: Complete table of MIDI 1.0 status bytes with message lengths, data byte meanings, and validity rules — the fastest answer to "what is message 0x9n / how many bytes".
---

# MIDI 1.0 Status Byte Quick Reference

Source of truth: MIDI 1.0 Detailed Specification v4.2.1 (doc `m1-midi-1-0-detailed-specification`) and the Expanded Messages List (doc `expanded-messages-list-status-bytes`).

A byte with bit 7 set (0x80–0xFF) is a **status byte**; bit 7 clear (0x00–0x7F) is a **data byte**. For channel messages the low nibble is the channel (0–15 in code, displayed 1–16 in DAWs).

## Channel Voice Messages

| Status | Message                   | Total bytes | Data byte 1          | Data byte 2                              |
| ------ | ------------------------- | ----------- | -------------------- | ---------------------------------------- |
| 0x8n   | Note Off                  | 3           | Note number (0–127)  | Release velocity                         |
| 0x9n   | Note On                   | 3           | Note number (0–127)  | Velocity (0 = Note Off)                  |
| 0xAn   | Polyphonic Key Pressure   | 3           | Note number          | Pressure                                 |
| 0xBn   | Control Change            | 3           | Controller (0–119)   | Value                                    |
| 0xBn   | Channel Mode (CC 120–127) | 3           | Controller (120–127) | Value                                    |
| 0xCn   | Program Change            | 2           | Program number       | —                                        |
| 0xDn   | Channel Pressure          | 2           | Pressure             | —                                        |
| 0xEn   | Pitch Bend                | 3           | LSB                  | MSB (value = LSB + MSB×128, center 8192) |

**Note On with velocity 0 is equivalent to Note Off** — every receiver must handle both forms.

## System Common Messages

| Status | Message                | Total bytes | Data                                        |
| ------ | ---------------------- | ----------- | ------------------------------------------- |
| 0xF0   | System Exclusive start | variable    | Manufacturer ID, then data bytes until 0xF7 |
| 0xF1   | MTC Quarter Frame      | 2           | Time code nibble                            |
| 0xF2   | Song Position Pointer  | 3           | LSB, MSB (in MIDI beats = 6 clocks)         |
| 0xF3   | Song Select            | 2           | Song number                                 |
| 0xF4   | (undefined/reserved)   | —           | Invalid                                     |
| 0xF5   | (undefined/reserved)   | —           | Invalid                                     |
| 0xF6   | Tune Request           | 1           | —                                           |
| 0xF7   | End of Exclusive (EOX) | 1           | Terminates SysEx                            |

## System Real-Time Messages (single byte, may interrupt any other message)

| Status | Message              | Notes                                  |
| ------ | -------------------- | -------------------------------------- |
| 0xF8   | Timing Clock         | 24 pulses per quarter note (fixed)     |
| 0xF9   | (undefined/reserved) | Invalid                                |
| 0xFA   | Start                | Play from the beginning; clocks follow |
| 0xFB   | Continue             | Resume from current position           |
| 0xFC   | Stop                 | Halt playback                          |
| 0xFD   | (undefined/reserved) | Invalid                                |
| 0xFE   | Active Sensing       | Optional ≤300ms heartbeat              |
| 0xFF   | System Reset         | Reset device to power-up state         |

## Parsing rules

- **Running status**: after a channel-message status byte, subsequent messages of the same status may omit it. Cancelled by any System Common message; System Real-Time bytes do NOT cancel or affect running status. The Web MIDI API never uses running status in `MIDIOutput.send()` and delivers complete messages to `onmidimessage`.
- System Real-Time bytes (0xF8–0xFF) may appear between the bytes of another message; process them immediately and continue the interrupted message.
- Data bytes without a preceding status byte (and no running status) must be ignored.
