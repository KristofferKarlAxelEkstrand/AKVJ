---
title: Master Fine/Coarse Tuning
docId: CA-025
protocol: midi1
source: .midi-raw-data/ca25 Master Fine & Coarse Tuning SysEx Message.pdf
sourceType: local
pages: 2
sha256: 5d4ecbc9cdc563fc40d66a3b3b23ee4d70b1993330f1f1f95b36ded184e21cc1
extractedAt: 2026-07-16T12:54:08.724Z
summary: MMA/AMEI Confirmation of Approval CA-025: Master Fine/Coarse Tuning.
---
# Master Fine/Coarse Tuning

## Page 1

MMA Technical Standards Board/
AMEI MIDI Committee
Confirmation of Approval of New MIDI Message
Date of issue: 3/02/99 Originated by: MMA
Reference TSBB Item #: 151 Volume #: 22 (revised)
Title: Master Fine/Coarse Tuning
CA#: 25__
Related item(s): Universal Real Time SysEx, Device Control, General MIDI Level 2
Abstract:
These two new Universal Real Time SysEx messages are additional Device Control messages which control
the overall tuning of a device. The “Master Fine Tuning” and “Master Coarse Tuning” messages are intended
to produce the same effect as the pitch shift control on a tape recorder.
Background:
In recent years, Karaoke using General MIDI playback systems has become very popular. Transpose or key
shift is a basic function for Karaoke, and thus it is important for MIDI Karaoke to be able to tune all MIDI
channels simultaneously. It is also sometimes necessary to vary the overall pitch from 440Hz (MIDI
standard pitch) for Orchestra music or Piano music, because often the original instruments are tuned to
442Hz, 443Hz or 445Hz etc. At present there is no common message to set overall tuning; instead it must
be set using Channel Fine Tuning and Channel Coarse Tuning for each individual MIDI channel, or through
the use of proprietary System Exclusive (SysEx) messages with each manufacturer.
Details:
These messages offer a standard way to control the overall tuning of a MIDI device. They necessitate
renaming the current “Master Tuning” Registered Parameter Numbers (RPNs) referenced on page 18 of the
MIDI 1.0 Detailed Specification v 4.2 to “Channel Fine Tuning” and “Channel CoarseTuning”. (See Channel
Fine/CoarseTuning R/P)
[ DEVICE CONTROL ]
MASTER FINE TUNING
F0 7F <device ID> 04 03 lsb msb F7
F0 7F Universal Real Time SysEx header
<device ID> ID of target device (7F=all devices)
04 sub-ID#1 = “Device Control”
03 sub ID#2 = “Master Fine Tuning”
lsb msb fine tuning value (LSB first)
F7 EOX

## Page 2

Confirmation of Approval for MIDI Standard CA# _25_
Page 2 of 2
fine tuning value Displacement in cents from A440
LSB MSB
00 00 100/8192*(-8192)
00 40 100/8192*0
7F 7F 100/8192*(+8191)
The total displacement in cents from A440 for each MIDI channel is summation of the displacement of this
Master Fine Tuning and the displacement of Fine Tuning using RPN.
MASTER COARSE TUNING
F0 7F <device ID> 04 04 00 msb F7
F0 7F Universal Real Time SysEx header
<device ID> ID of target device (7F=all devices)
04 sub-ID#1 = “Device Control”
04 sub-ID#2 = “Master Coarse Tuning”
00 msb coarse tuning value(LSB first)
F7 EOX
Note that the LSB is always 0.
coarse tuning value Displacement in cents from A440
LSB MSB
00 00 100 cents *(-64)
00 40 100 cents *0
00 7F 100 cents *(+63)
Displacement in cents from A440 of total coarse tuning for each MIDI channel is summation of the
displacement of this Master Coarse Tuning and the displacement of Channel Coarse Tuning.
The relationship of Master Fine Tuning / Coarse Tuning (= Device Control) ,and Channel Fine Tuning /
Coarse Tuning (= RPN, which is a Channel message) is same as the relationship of Master
Volume/Balance (= Device Control) and Volume/Balance (= Control change, which is a Channel Message).
For devices which support Key-based Instruments (where each key has a different instrument sound from
the others, such as with drum kits in General MIDI Level 1 and DLS Level 1) it is important that this
message NOT result in MIDI note-shifting; otherwise a different drum sound would be selected. It is up to the
manufacturer to determine the appropriate means for tuning each instrument according to the current mode
or configuration of the device, unless following a defined recommended practice.
