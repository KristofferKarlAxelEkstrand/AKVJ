---
title: MIDI 1.0 vs MIDI 2.0 Comparison
protocol: general
summary: Side-by-side capability comparison of MIDI 1.0 and MIDI 2.0 — resolution, messages, transports, discovery, and what translates between them.
---

# MIDI 1.0 vs MIDI 2.0 Comparison

Source of truth: MIDI 2.0 Specification Overview (doc `m2-100-u-midi-2-0-specification-overview`), UMP & MIDI 2.0 Protocol (doc `m2-104-um-ump-and-midi-2-0-protocol-specification`), MIDI 1.0 Detailed Specification (doc `m1-midi-1-0-detailed-specification`).

| Capability             | MIDI 1.0 (1983)                                                   | MIDI 2.0 (2020)                                                                          |
| ---------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Packet format          | Variable-length byte stream (status + data bytes, running status) | Universal MIDI Packet (UMP): fixed 32/64/96/128-bit packets                              |
| Direction              | Unidirectional                                                    | Bidirectional (negotiated via MIDI-CI)                                                   |
| Channels               | 16                                                                | 256 (16 groups × 16 channels)                                                            |
| Velocity               | 7-bit (0–127)                                                     | 16-bit (0–65535)                                                                         |
| CC / controller values | 7-bit (14-bit via paired CCs)                                     | 32-bit                                                                                   |
| Pitch bend             | 14-bit                                                            | 32-bit, plus per-note pitch bend                                                         |
| RPN/NRPN               | CC 101/100/98/99 + CC 6/38 sequences                              | Direct Registered/Assignable Controller messages (16384 banks × 128 controllers, 32-bit) |
| Per-note expression    | Only via MPE (channel rotation workaround)                        | Native: per-note controllers, pitch, management                                          |
| Note attributes        | None                                                              | 16-bit attribute on Note On/Off (e.g. articulation, pitch 7.9)                           |
| Note On velocity 0     | Means Note Off                                                    | Is a real Note On (translation must convert)                                             |
| Timing/jitter          | None built in (MIDI Clock only)                                   | JR Timestamps + JR Clock (1/31250 s resolution)                                          |
| Device discovery       | None (Identity Request SysEx at best)                             | MIDI-CI: MUIDs, Profiles, Property Exchange (JSON)                                       |
| Files                  | Standard MIDI Files (SMF 0/1)                                     | MIDI Clip File (SMF2CLIP), Container in development                                      |
| Transports             | 5-pin DIN (31.25 kbaud), USB-MIDI 1.0, BLE-MIDI, RTP-MIDI         | USB-MIDI 2.0, Network MIDI 2.0 (UDP); UMP is transport-agnostic                          |
| Browser (Web MIDI API) | Supported (Chrome/Chromium)                                       | Not yet supported                                                                        |
| Backward compatibility | —                                                                 | MIDI 1.0 messages carried in UMP (MT 0x2); defined 1.0↔2.0 translation rules             |

## Translation gotchas (MIDI 1.0 ↔ 2.0)

1. **Velocity 0**: 1.0 Note On velocity 0 → 2.0 Note Off. 2.0 Note On with 16-bit velocity that downscales to 0 must be sent as 1.0 velocity 1 (not 0, which would mean Note Off).
2. **Value scaling**: upscale with bit-repeat, downscale by truncation; center-based values scale around center (see doc `m2-115-u-midi-2-0-bit-scaling-and-resolution`).
3. **RPN/NRPN**: 2.0 Registered/Assignable Controllers map to 1.0 CC sequences (101/100 or 99/98, then 6/38); state machines are needed in the 1.0 direction.
4. **Groups**: UMP group information is lost when converting to a 1.0 byte stream (one group per stream).

## Practical guidance for this repo (AKVJ)

AKVJ uses the Web MIDI API, so everything on the wire is MIDI 1.0. MIDI 2.0 matters when: reading modern OS MIDI stacks' docs (they are UMP-native and translate), planning future-proof value handling (normalize to 0–1 floats internally), or reasoning about controllers that advertise MIDI 2.0 (they fall back to 1.0 over USB-MIDI 1.0/Web MIDI).
