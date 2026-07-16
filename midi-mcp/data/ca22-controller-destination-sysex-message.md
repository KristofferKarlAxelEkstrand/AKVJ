---
title: Controller Destination Setting
docId: CA-022
protocol: midi1
source: .midi-raw-data/ca22 Controller Destination SysEx Message.pdf
sourceType: local
pages: 3
sha256: d8bfacb16e64b4b381767519f5d6d9749e15c051733e445a5104ff23318c8f88
extractedAt: 2026-07-16T12:54:08.673Z
summary: MMA/AMEI Confirmation of Approval CA-022: Controller Destination Setting.
---
# Controller Destination Setting

## Page 1

MMA Technical Standards Board/
AMEI MIDI Committee
Confirmation of Approval of New MIDI Message
Date of issue: 2/28/99 Originated by: MMA
Reference TSBB Item #: 148 Volume #: 22 (revised)
Title: Controller Destination Setting
CA# __22_
Related item(s): Universal Real Time System Exclusive, General MIDI 2, Controllers
Abstract:
This proposal enables selecting the destination for Control Change messages, plus Channel Pressure and
Polyphonic Key Pressure, using Universal Real Time System Exclusive messages. When coupled with
specific recommended practices for response to these controllers, these messages will provide common
controller response among a variety of playback devices. See General MIDI 2 Recommended Practice for
examples of how the response can be standardized.
Background:
There are now a large number of electronic musical instruments available in the market from different
manufacturers, with a great variety of design concepts, making controlling various parameters of these
sound generators cumbersome because of the lack of a standardized interface. Some parameters, such as
Volume and Pan, are controlled in essentially the same manner in most sound generators, but Channel
Pressure, Polyphonic Key Pressure, Breath Controller, and Foot Controller responses are not defined in
any common manner. Also, it is now popular for many sound generators to have several assignable
controllers, and the method to set these controllers is very different among those devices.
Creators of Standard MIDI Files are unable to use most continuous controllers and reliably predict how
the controller data will be interpreted by the playback devices. Rather than attempt to dictate a specific
design, this proposal allows the composer of the SMF to determine the connection between performance
controls and the sound parameters on each device. It will then be possible to include performance
controllers in MIDI files and expect common playback without limiting the flexibility of individual designs.
Details:
[UNIVERSAL REAL TIME SYSTEM EXCLUSIVE]
CONTROLLER DESTINATION SETTING

## Page 2

Confirmation of Approval for MIDI Standard CA# __22__
Page 2 of 3
Controller Destination Setting message is defined as Universal Real Time System Exclusive message
(sub-ID#1=09). The control source is defined in sub-ID#2 as follows.
sub-ID#2 control source
-----------------------------------------------------
01 Channel Pressure (Aftertouch)
02 Polyphonic Key Pressure (Aftertouch)
03 Control Change message
The complete message assigns the control source to one or more sound parameters/destinations. The
message includes both the destination and a range, defining the magnitude of the response. For instance,
the range may be a number of semitones or cents for pitch bend, hertz for filter cutoff control, etc. See
the example below.
The Controller Destination Setting message can include multiple sets of parameter/range pairs in a single
message, so the length of the message is variable.
Destinations and ranges for a particular controller source which have previously been set will be cleared
upon receiving new destinations and ranges on a channel by channel basis.
Channel Pressure/Polyphonic Key Pressure:
F0 7F <device ID> 09 01/02 0n [pp rr] ... F7
F0 7F Universal Real Time SysEx header
<device ID> ID of target device (7F = all devices)
09 sub-ID#1 = “Controller Destination Setting”
01/02 sub-ID#2 = Control Source:
Channel Pressure/Polyphonic Key Pressure
0n MIDI channel (00 - 0F)
[pp rr] controlled parameter and range
:
F7 EOX
Control Change:
The only difference in this message is the presence of the "controller number" field which is identical to
the actual Control Change number. Only controller (Control Change) numbers 01H to 1FH and 40H to
5FH are allowed. Any other controller number must be ignored by the receiver.
F0 7F <device ID> 09 03 0n cc [pp rr] ... F7
F0 7F Universal Real Time SysEx header
<device ID> ID of target device (7F = all devices)
09 sub-ID#1 = “Controller Destination Setting”
03 sub-ID#2 = Control Source: Control Change Message
0n MIDI channel (00 - 0F)
cc Control Number (01 - 1F, 40 - 5F)

## Page 3

Confirmation of Approval for MIDI Standard CA# __22__
Page 3 of 3
[pp rr] controlled parameter and range
:
F7 EOX
Controlled Parameters and Ranges:
The following controlled parameters are defined for use with the Controller Destination Setting message.
controlled parameter (pp) range (rr)
---------------------------------------------------
00 Pitch Control defined by R/P
01 Filter Cutoff Control defined by R/P
02 Amplitude Control defined by R/P
03 LFO Pitch Depth defined by R/P
04 LFO Filter Depth defined by R/P
05 LFO Amplitude Depth defined by R/P
06 – 7f are reserved for future definition by the MMA/AMEI.
Additional controlled parameters will be defined MMA/AMEI.
Manufacturers must refrain from adding proprietary parameters to the table.
Response to these messages is defined independently in specific recommended practices.
Example:
This example follows the GM 2 Recommended Practice.
F0 7F Universal Real Time SysEx header
7F device ID (7F = all devices)
09 sub-ID#1 "Controller Destination Setting"
01 sub-ID#2 Control Source: (01 =Channel Pressure)
06 Channel: 06
00 Destination#: 00 (Pitch Control)
42 Range: 42 (+2 semitones)
01 Destination#: 01 (Filter Cutoff Control)
60 Range: 60 (+4800 cents)
05 Destination#: 05 (LFO Amplitude Depth)
20 Range: 20 (25%)
F7 EOX
