---
title: Summary of MIDI 1.0 Messages
version: 1.0
protocol: midi1
source: .midi-raw-data/Summary of MIDI 1.0 Messages – MIDI.org.html
sourceType: local
sha256: 73ddc3ce7593d74d6212164c471c927bb6bd8a7d97a9d2dbd3dc072bb6a737ea
extractedAt: 2026-07-16T12:54:08.325Z
summary: Compact summary table of all MIDI 1.0 messages: status bytes, data bytes, and descriptions.
---
# Summary of MIDI 1.0 Messages

# Summary of

# MIDI 1.0 Messages

Table 1 – Summary of MIDI 1.0 Messages

As a Sysex ID or Corporate Member, you’ll have access to more details and specs. Learn more about joining us by clicking below.

Download

The following table lists the major MIDI 1.0 messages in numerical (binary) order (adapted from “MIDI by the Numbers” by D. Valenti, Electronic Musician 2/88, and updated by the MIDI Manufacturers Association.). This table is intended as an overview of MIDI, and is by no means complete.

WARNING! Details about implementing these messages can dramatically impact compatibility with other products. We strongly recommend consulting the official MIDI Specifications for additional information.

Table 1: MIDI 1.0 Specification Message Summary
Status D7—-D0 | Data Byte(s) D7—-D0 | Description
Channel Voice Messages [nnnn = 0-15 (MIDI Channel Number 1-16)]
1000nnnn | 0kkkkkkk 0vvvvvvv | Note Off event. This message is sent when a note is released (ended). (kkkkkkk) is the key (note) number. (vvvvvvv) is the velocity.
1001nnnn | 0kkkkkkk 0vvvvvvv | Note On event. This message is sent when a note is depressed (start). (kkkkkkk) is the key (note) number. (vvvvvvv) is the velocity.
1010nnnn | 0kkkkkkk 0vvvvvvv | Polyphonic Key Pressure (Aftertouch). This message is most often sent by pressing down on the key after it “bottoms out”. (kkkkkkk) is the key (note) number. (vvvvvvv) is the pressure value.
1011nnnn | 0ccccccc 0vvvvvvv | Control Change. This message is sent when a controller value changes. Controllers include devices such as pedals and levers. Controller numbers 120-127 are reserved as “Channel Mode Messages” (below). (ccccccc) is the controller number (0-119). (vvvvvvv) is the controller value (0-127).
1100nnnn | 0ppppppp | Program Change. This message sent when the patch number changes. (ppppppp) is the new program number.
1101nnnn | 0vvvvvvv | Channel Pressure (After-touch). This message is most often sent by pressing down on the key after it “bottoms out”. This message is different from polyphonic after-touch. Use this message to send the single greatest pressure value (of all the current depressed keys). (vvvvvvv) is the pressure value.
1110nnnn | 0lllllll 0mmmmmmm | Pitch Bend Change. This message is sent to indicate a change in the pitch bender (wheel or lever, typically). The pitch bender is measured by a fourteen bit value. Center (no pitch change) is 2000H. Sensitivity is a function of the receiver, but may be set using RPN 0. (lllllll) are the least significant 7 bits. (mmmmmmm) are the most significant 7 bits.
Channel Mode Messages (See also Control Change, above)
1011nnnn | 0ccccccc 0vvvvvvv | Channel Mode Messages. This the same code as the Control Change (above), but implements Mode control and special message by using reserved controller numbers 120-127. The commands are:
 | All Sound Off. When All Sound Off is received all oscillators will turn off, and their volume envelopes are set to zero as soon as possible. c = 120, v = 0: All Sound Off
Reset All Controllers. When Reset All Controllers is received, all controller values are reset to their default values. (See specific Recommended Practices for defaults). c = 121, v = x: Value must only be zero unless otherwise allowed in a specific Recommended Practice.
Local Control. When Local Control is Off, all devices on a given channel will respond only to data received over MIDI. Played data, etc. will be ignored. Local Control On restores the functions of the normal controllers. c = 122, v = 0: Local Control Off c = 122, v = 127: Local Control On
All Notes Off. When an All Notes Off is received, all oscillators will turn off. c = 123, v = 0: All Notes Off (See text for description of actual mode commands.) c = 124, v = 0: Omni Mode Off c = 125, v = 0: Omni Mode On c = 126, v = M: Mono Mode On (Poly Off) where M is the number of channels (Omni Off) or 0 (Omni On) c = 127, v = 0: Poly Mode On (Mono Off) (Note: These four messages also cause All Notes Off)
System Common Messages
11110000 | 0iiiiiii [0iiiiiii 0iiiiiii] 0ddddddd — — 0ddddddd 11110111 | System Exclusive. This message type allows manufacturers to create their own messages (such as bulk dumps, patch parameters, and other non-spec data) and provides a mechanism for creating additional MIDI Specification messages. The Manufacturer’s ID code (assigned by MMA or AMEI) is either 1 byte (0iiiiiii) or 3 bytes (0iiiiiii 0iiiiiii 0iiiiiii). Two of the 1 Byte IDs are reserved for extensions called Universal Exclusive Messages, which are not manufacturer-specific. If a device recognizes the ID code as its own (or as a supported Universal message) it will listen to the rest of the message (0ddddddd). Otherwise, the message will be ignored. (Note: Only Real-Time messages may be interleaved with a System Exclusive.)
11110001 | 0nnndddd | MIDI Time Code Quarter Frame. nnn = Message Type dddd = Values
11110010 | 0lllllll 0mmmmmmm | Song Position Pointer. This is an internal 14 bit register that holds the number of MIDI beats (1 beat= six MIDI clocks) since the start of the song. l is the LSB, m the MSB.
11110011 | 0sssssss | Song Select. The Song Select specifies which sequence or song is to be played.
11110100 |  | Undefined. (Reserved)
11110101 |  | Undefined. (Reserved)
11110110 |  | Tune Request. Upon receiving a Tune Request, all analog synthesizers should tune their oscillators.
11110111 |  | End of Exclusive. Used to terminate a System Exclusive dump (see above).
System Real-Time Messages
11111000 |  | Timing Clock. Sent 24 times per quarter note when synchronization is required (see text).
11111001 |  | Undefined. (Reserved)
11111010 |  | Start. Start the current sequence playing. (This message will be followed with Timing Clocks).
11111011 |  | Continue. Continue at the point the sequence was Stopped.
11111100 |  | Stop. Stop the current sequence.
11111101 |  | Undefined. (Reserved)
11111110 |  | Active Sensing. This message is intended to be sent repeatedly to tell the receiver that a connection is alive. Use of this message is optional. When initially received, the receiver will expect to receive another Active Sensing message each 300ms (max), and if it does not then it will assume that the connection has been terminated. At termination, the receiver will turn off all voices and return to normal (non- active sensing) operation.
11111111 |  | Reset. Reset all receivers in the system to power-up status. This should be used sparingly, preferably under manual control. In particular, it should not be sent on power-up.

Download

### Join Us

Sign up here

About the MIDI Association
MIDI Association IP Policy
MIDI Association Anti-Trust Policy
MIDI Logo Licensing
Media Enquiries

Privacy Policy | Terms of Use | Accessibility Statement

©2026
