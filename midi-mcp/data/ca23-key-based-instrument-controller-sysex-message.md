---
title: Key-Based Instrument Controllers
docId: CA-023
protocol: midi1
source: .midi-raw-data/ca23 Key-based Instrument Controller SysEx Message.pdf
sourceType: local
pages: 2
sha256: 8cd97ed56adb3058526ddbf11d4a80fb37c38f58da705d79a7270e833051c380
extractedAt: 2026-07-16T12:54:08.690Z
summary: MMA/AMEI Confirmation of Approval CA-023: Key-Based Instrument Controllers.
---
# Key-Based Instrument Controllers

## Page 1

MMA Technical Standards Board/
AMEI MIDI Committee
Confirmation of Approval of New MIDI Message
Date of issue: 2/28/99 Originated by: MMA
Reference TSBB Item #: 149 Volume #: 22 (revised)
Title: Key-Based Instrument Controllers
CA#: 23__
Related item(s): General MIDI Level 2 R/P, UNIVERSAL REAL TIME SYSTEM EXCLUSIVE
Abstract:
The Key-Based Instrument Controller message is intended to be a standard method of providing
individual key-based instruments with the same performance control that is available for Channel-based
instruments. Specific responses to this message may be defined in a separate recommended practice,
such as General MIDI 2.
Background:
Some manufacturers make sound modules with multiple drum sets, and provide the ability to modify
sound parameters for each drum sound (assigned to individual keys) via MIDI IN. Since there is no
common protocol for this function, the manufacturers use proprietary SysEx or NRPN messages. This
message was developed for GM2, but is not specific to that use.
Details:
The Key-Based Instrument Controllers provide the same functions as Channel-based Controllers for
sounds which are assigned separately to individual keys of the keyboard, such as in a drum set. Of
course, they can also be used for sound effects or any other key-based instrument. Key-based, in this
sense, means that each key on the keyboard may produce a different sound.
[UNIVERSAL REAL TIME SYSTEM EXCLUSIVE]
KEY-BASED INSTRUMENT CONTROL
F0 7F <device ID> 0A 01 0n kk [nn vv] .. F7
F0 7F Universal Real Time SysEx header
<device ID> ID of target device (7F = all devices)
0A sub-ID#1 = “Key-Based Instrument Control”
01 sub-ID#2 = 01 Basic Message
0n MIDI Channel Number
kk Key number

## Page 2

Confirmation of Approval for MIDI Standard CA# __23__
Page 2 of 2
[nn,vv] Controller Number and Value
:
F7 EOX
SOME COMMONLY-USED CONTROLLERS
CC# nn Name vv
-----------------------------------------------------------
7 07H Note Volume 00H-40H-7FH
10 0AH *Pan 00H-7FH absolute
33-63 21-3FH LSB for 01H-1FH
71 47H Timbre/Harmonic Intensity 00H-40H-7FH
72 48H Release Time 00H-40H-7FH
73 49H Attack Time 00H-40H-7FH
74 4AH Brightness 00H-40H-7FH
75 4BH Decay Time 00H-40H-7FH
76 4CH Vibrato Rate 00H-40H-7FH
77 4DH Vibrato Depth 00H-40H-7FH
78 4EH Vibrato Delay 00H-40H-7FH
91 5BH *Reverb Send 00H-7FH absolute
93 5DH *Chorus Send 00H-7FH absolute
120 78H **Fine Tuning 00H-40H-7FH
121 79H **Coarse Tuning 00H-40H-7FH
*Depending on the recommended practice that is being followed, the value
field can either be absolute or relative to the default setting for the
sound. The marked items (nn) will be absolute in most cases.
**The parameters (nn) 78H and 79H are not comparable to their Control
Change usage, (Mode Change messages), but are redefined as Fine Tuning and
Coarse Tuning.
Any controller (Control Change) may be used for "nn" except Bank Select MSB/LSB (00H, 20H),
Data Entry MSB/LSB (06H, 26H), RPN/NRPN messages (60h – 65H), and Mode Change messages
(78H-7FH). Since the numbers for these controllers are unused and available for other uses, some of
them are redefined and noted with two asterisks (**).
Multiple controller/value pairs can be sent in a single message.
Key-Based Instrument Control messages are generally expected to make relative adjustments to
existing (preset) parameter values. Exceptions are marked with a single asterisk (*). When a new sound
set is selected by a Program Change message, the receiving device should adopt the preset setting for
each key-based instrument. The value 40H should select the factory default setting for that controller.
Values below 40H will decrease the parameter; values above 40H will increase it. Units and the exact
behavior of the receiving device are left to the discretion of the manufacturer, unless following a defined
recommended practice. See General MIDI Level 2 for an example.
