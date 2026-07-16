---
title: Default Control Change Mapping Profile
docId: M2-113-UM
version: 1.0
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-113-UM_1-0_Default_Control_Change_Mapping_Profile.pdf
sourceType: online
pages: 19
sha256: 528cb737bb32c6d81064b7918ee1f93fbd70960142e31b065cd657a5b00a97c7
extractedAt: 2026-07-16T12:54:03.699Z
summary: MIDI-CI Profile defining default Control Change mappings for MIDI 2.0 devices.
---
# Default Control Change Mapping Profile

## Page 1

MIDI-CI Profile:
Default Control Change Mapping
Version 1.0
November 26, 2020
Document M2-113-UM
Published By:
Association of Musical Electronics Industry
http://www.amei.or.jp
and
The MIDI Association
https://www.midi.org

## Page 2

PREFACE
Profile Configuration is part of the MIDI-Capability Inquiry (MIDI-CI) specification. Profiles define
specific implementations of a set of MIDI messages chosen to suit a particular instrument, device type,
or to accomplish a particular task. Two devices that conform to the same Profile will generally have
greater interoperability between them than devices using MIDI without Profiles. Profiles increase
interoperability and ease of use while lowering the need for manual configuration of devices by users.
This document describes the Default Control Change Mapping Profile. For information on Profile
Configuration mechanisms, please see the MIDI-Capability Inquiry specification and the Common Rules
for MIDI-CI Profile Configuration specification.
©2020 Association of Musical Electronics Industry (AMEI)(Japan)
©2020 MIDI Manufacturers Association Incorporated (MMA)(Worldwide except Japan)
ALL RIGHTS RESERVED. NO PART OF THIS DOCUMENT MAY BE REPRODUCED OR
TRANSMITTED IN ANY FORM OR BY ANY MEANS, ELECTRONIC OR MECHANICAL,
INCLUDING INFORMATION STORAGE AND RETRIEVAL SYSTEMS, WITHOUT
PERMISSION IN WRITING FROM THE MIDI MANUFACTURERS ASSOCIATION.
https://www.midi.org
http://www.amei.or.jp

## Page 3

Version 1.0 	Page iii 	Nov. 26, 2020
Table of Contents
1. 	Introduction ....................................................................................................................................... 1
1.1 	Background ................................................................................................................................ 1
1.2 	Executive Overview ................................................................................................................... 1
1.3 	Related Documents .................................................................................................................... 1
2. 	Device Requirements ........................................................................................................................ 2
2.1 	General Requirements ................................................................................................................ 2
2.2 	MIDI-CI Profile Configuration .................................................................................................. 2
2.2.1 	Single MIDI Channel Profile .............................................................................................. 2
2.3 	Enabling the Default Control Change Mapping Profile via the Set Profile On Message .......... 2
2.4 	Reset All Controllers (cc#0x79) ................................................................................................ 3
2.5 	Disabling the Default Control Change Mapping Profile via the Set Profile Off Message ........ 3
2.6 	Disabling the Default Control Change Mapping Profile and Reporting Profile Disabled upon a
Change of Configuration....................................................................................................................... 3
2.7 	Data Values ................................................................................................................................ 3
Appendix A. List of Control Change Message Destinations (and Reset Values) .................................... 4
Appendix B. Recommended Response to Control Change Messages ................................................... 11
1. 	Bank Select Control Change (cc#0/32) ........................................................................................... 11
2. 	Portamento Time Control Change (cc#5/37) .................................................................................. 11
3. 	Channel Volume Control Change (cc#07/39) ................................................................................. 11
4. 	Pan Control Change (cc#10/42) ...................................................................................................... 12
5. 	Expression Control Change (cc#11/43) .......................................................................................... 13
6. 	Hold1 (Damper or Sustain) Control Change (cc#64) ...................................................................... 14
7. 	Portamento ON/OFF (cc#65) .......................................................................................................... 14
8. 	Sostenuto (cc#66) ............................................................................................................................ 15
9. 	Legato (cc#68) ................................................................................................................................. 15
Revision History ..................................................................................................................................... 16

## Page 4

1. Introduction
1.1 Background
This Default Control Change Mapping Profile specification defines device requirements and MIDI
implementation of a conforming device.
This Profile specification relies on mechanisms defined by the MIDI-CI (Capabilities Inquiry)
specification. MIDI-CI allows devices to communicate their capabilities to each other. Devices can use
that capabilities information to self-configure their MIDI connections and related settings. Profiles are
a beneficial component in enabling intelligent auto-configuration between two devices.
Profiles define specific implementations of a set of MIDI messages chosen to suit a particular
instrument, device type, or to accomplish a particular task. Two devices that conform to the same
Profile will generally have greater interoperability between them than devices using MIDI without
Profiles. Profiles increase interoperability and ease of use while lowering the need for manual
configuration of devices by users.
Further information required for implementing this device Profile is found in the Common Rules for
MIDI Profiles specification.
1.2 Executive Overview
Many MIDI devices are very flexible in configuration to allow a wide variety of interaction between
devices in various applications. However, when 2 devices are configured differently, there can be a
mismatch that reduces interoperability.
This Default Control Change Mapping Profile defines how devices can be set to a default state, aligned
with core definitions of MIDI 1.0 and MIDI 2.0. In particular, devices with this Profile enabled have
the assignment of Control Change message destinations/functions set to common, default definitions.
1.3 Related Documents
The Complete MIDI 1.0 Detailed Specification, Document Version 96.1, Third Edition, Association
of Musical Electronics Industry, http://www.amei.or.jp/, and MIDI Manufacturers Association,
https://www.midi.org/.
MIDI 2.0 Specification Overview, Association of Musical Electronics Industry,
http://www.amei.or.jp/, and MIDI Manufacturers Association, https://www.midi.org/.
MIDI Capability Inquiry (MIDI-CI) Version 1.1, Association of Musical Electronics Industry,
http://www.amei.or.jp/, and MIDI Manufacturers Association, https://www.midi.org/.
Common Rules for MIDI-CI Profiles, Version 1.0, Association of Musical Electronics Industry,
http://www.amei.or.jp/, and MIDI Manufacturers Association, https://www.midi.org/.
Universal MIDI Packet Format (UMP) and MIDI 2.0 Protocol, Version 1.0, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and MIDI Manufacturers Association,
https://www.midi.org/.

## Page 5

2. Device Requirements
2.1 General Requirements
While this Profile is enabled, a device has the assignment of controller message destinations/functions
set to the common, default definitions. Details of destinations/functions are in Appendix A.
2.2 MIDI-CI Profile Configuration
This section defines the response to Profile Configuration messages including the Default Control
Change Mapping Profile Identification.
MIDI-CI Profile Configuration Messages identify and control each Profile uniquely by the use of
several fields in the Profile Configuration message. The Profile identifiers for this Default Control
Change Mapping Profile are as follows:
Profile ID Byte 1 	0x7E (Standard Defined Profile)
Profile ID Byte 2 	0x21 (Default Control Change Mapping Profile Number MSB)
Profile ID Byte 3 	0x00 (Default Control Change Mapping Profile Number LSB)
Profile ID Byte 4 	0x01 (Default Control Change Mapping Profile Version)
Profile ID Byte 5 	0xXX (Default Control Change Mapping Profile Level*)
* Default Control Change Mapping Profile Level:
• 	0x00 Some Implementation but Not to Minimum Requirements.
• 	0x01 Meets Minimum Requirements
2.2.1 Profile Per MIDI Channel
This this Default Control Change Mapping Profile functions on a per-channel basis. In all Profile
Configuration messages for this Profile, the Destination or Source field shall be set to values 0x00-0F
= to/from MIDI Channels 1-16.
2.3 Enabling the Default Control Change Mapping Profile via the
Set Profile On Message
When Default Control Change Mapping Profile Device receives a Set Profile On message, it shall
assign the routing of all Control Change messages to the destinations/functions setting shown in
Appendix A. These assignments shall remain fixed while the Profile is enabled.
Note: For the sake of clarity, those Control Change numbers shown in Appendix A with default
functions (Sound Controllers and Effects) shall conform to the default function listed.
Note: MIDI specifications require that Registered Parameter Numbers (RPN), Registered Controllers,
and Registered Per-Note Controllers are never used for any undefined purpose. Therefore, this Profile

## Page 6

assumes that mappings of those messages is correctly fixed in the Default Control Change Mapping
Profile Device and implementation does not need to be defined as part of these Profile mechanisms.
2.4 Reset All Controllers (cc#0x79)
When a Default Control Change Mapping Profile device receives a Reset All Controllers message, it
should set Control Change values to the Initial Values as defined in Appendix A.
2.5 Disabling the Default Control Change Mapping Profile via the
Set Profile Off Message
When Default Control Change Mapping Profile Device receives a Set Profile Off message, the device
may respond freely at the design of the manufacturer. Some devices may do nothing, some may return
to a previous state, some may have some other response.
2.6 Disabling the Default Control Change Mapping Profile and
Reporting Profile Disabled upon a Change of Configuration
If the Default Control Change Mapping Profile Device’s assignment of Control Change message
destination/function changes to a configuration that does not match the Default Control Change
Mapping Profile, then the device shall send a Profile Disabled Report message.
This may occur when the user changes a setting on the device or when some other action causes the
device to change its Control Change message destinations/functions.
2.7 Data Values
All values for messages in this document are expressed as the 7 bit and 14 bit values in the MIDI 1.0
Protocol. When using this Profile with the MIDI 2.0 Protocol with higher resolutions, values should be
upscaled according to the guidelines in the Data Value Translations section of the Universal MIDI
Packet Format (UMP) and MIDI 2.0 Protocol specification.

## Page 7

Appendix A. List of Control Change Message
Destinations (and Reset Values)
Control Change Message 	Value 	Value to be
Set by
Reset All
Controllers
Decimal 	Hex 	Function 	Value 	Used
As
0 	0x00 	Bank Select 	0-127 	MSB 	Do Not Set
1 	0x01 	Modulation Wheel or Lever 	0-127 	MSB 	0
2 	0x02 	Breath Controller 	0-127 	MSB 	0
3 	0x03 	Undefined 	0-127 	MSB 	Device
Specific
4 	0x04 	Foot Controller 	0-127 	MSB 	0
5 	0x05 	Portamento Time 	0-127 	MSB 	0
6 	0x06 	Data Entry MSB 	0-127 	MSB 	Do Not Set
7 	0x07 	Channel Volume (formerly Main
Volume)
0-127 	MSB 	Do Not Set
8 	0x08 	Balance 	0-127 	MSB 	64
9 	0x09 	Undefined 	0-127 	MSB 	Device
Specific
10 	0x0A 	Pan 	0-127 	MSB 	Do Not Set
11 	0x0B 	Expression Controller 	0-127 	MSB 	127
12 	0x0C 	Effect Control 1 	0-127 	MSB 	0
13 	0x0D 	Effect Control 2 	0-127 	MSB 	0
14 	0x0E 	Undefined 	0-127 	MSB 	Device
Specific
15 	0x0F 	Undefined 	0-127 	MSB 	Device
Specific
16 	0x10 	General Purpose Controller 1 	0-127 	MSB 	Device
Specific
17 	0x11 	General Purpose Controller 2 	0-127 	MSB 	Device
Specific
18 	0x12 	General Purpose Controller 3 	0-127 	MSB 	Device
Specific
19 	0x13 	General Purpose Controller 4 	0-127 	MSB 	Device
Specific

## Page 8

20 	0x14 	Undefined 	0-127 	MSB 	Device
Specific
21 	0x15 	Undefined 	0-127 	MSB 	Device
Specific
22 	0x16 	Undefined 	0-127 	MSB 	Device
Specific
23 	0x17 	Undefined 	0-127 	MSB 	Device
Specific
24 	0x18 	Undefined 	0-127 	MSB 	Device
Specific
25 	0x19 	Undefined 	0-127 	MSB 	Device
Specific
26 	0x1A 	Undefined 	0-127 	MSB 	Device
Specific
27 	0x1B 	Undefined 	0-127 	MSB 	Device
Specific
28 	0x1C 	Undefined 	0-127 	MSB 	Device
Specific
29 	0x1D 	Undefined 	0-127 	MSB 	Device
Specific
30 	0x1E 	Undefined 	0-127 	MSB 	Device
Specific
31 	0x1F 	Undefined 	0-127 	MSB 	Device
Specific
32 	0x20 	LSB for Control 0 (Bank Select) 	0-127 	LSB 	Do Not Set
33 	0x21 	LSB for Control 1 (Modulation
Wheel or Lever)
0-127 	LSB 	0
34 	0x22 	LSB for Control 2 (Breath
Controller)
0-127 	LSB 	0
35 	0x23 	LSB for Control 3 (Undefined) 	0-127 	LSB 	Device
Specific
36 	0x24 	LSB for Control 4 (Foot
Controller)
0-127 	LSB 	0
37 	0x25 	LSB for Control 5 (Portamento
Time)
0-127 	LSB 	0
38 	0x26 	LSB for Control 6 (Data Entry) 	0-127 	LSB 	Do Not Set
39 	0x27 	LSB for Control 7 (Channel
Volume, formerly Main Volume)
0-127 	LSB 	Do Not Set
40 	0x28 	LSB for Control 8 (Balance) 	0-127 	LSB 	64

## Page 9

41 	0x29 	LSB for Control 9 (Undefined) 	0-127 	LSB 	Device
Specific
42 	0x2A 	LSB for Control 10 (Pan) 	0-127 	LSB 	Do Not Set
43 	0x2B 	LSB for Control 11 (Expression
Controller)
0-127 	LSB 	127
44 	0x2C 	LSB for Control 12 (Effect
control 1)
0-127 	LSB 	0
45 	0x2D 	LSB for Control 13 (Effect
control 2)
0-127 	LSB 	0
46 	0x2E 	LSB for Control 14 (Undefined) 	0-127 	LSB 	Device
Specific
47 	0x2F 	LSB for Control 15 (Undefined) 	0-127 	LSB 	Device
Specific
48 	0x30 	LSB for Control 16 (General
Purpose Controller 1)
0-127 	LSB 	Device
Specific
49 	0x31 	LSB for Control 17 (General
Purpose Controller 2)
0-127 	LSB 	Device
Specific
50 	0x32 	LSB for Control 18 (General
Purpose Controller 3)
0-127 	LSB 	Device
Specific
51 	0x33 	LSB for Control 19 (General
Purpose Controller 4)
0-127 	LSB 	Device
Specific
52 	0x34 	LSB for Control 20 (Undefined) 	0-127 	LSB 	Device
Specific
53 	0x35 	LSB for Control 21 (Undefined) 	0-127 	LSB 	Device
Specific
54 	0x36 	LSB for Control 22 (Undefined) 	0-127 	LSB 	Device
Specific
55 	0x37 	LSB for Control 23 (Undefined) 	0-127 	LSB 	Device
Specific
56 	0x38 	LSB for Control 24 (Undefined) 	0-127 	LSB 	Device
Specific
57 	0x39 	LSB for Control 25 (Undefined) 	0-127 	LSB 	Device
Specific
58 	0x3A 	LSB for Control 26 (Undefined) 	0-127 	LSB 	Device
Specific
59 	0x3B 	LSB for Control 27 (Undefined) 	0-127 	LSB 	Device
Specific
60 	0x3C 	LSB for Control 28 (Undefined) 	0-127 	LSB 	Device
Specific

## Page 10

61 	0x3D 	LSB for Control 29 (Undefined) 	0-127 	LSB 	Device
Specific
62 	0x3E 	LSB for Control 30 (Undefined) 	0-127 	LSB 	Device
Specific
63 	0x3F 	LSB for Control 31 (Undefined) 	0-127 	LSB 	Device
Specific
64 	0x40 	Damper Pedal on/off (Sustain) 	≤63 off
≥64 on
--- 	0
65 	0x41 	Portamento On/Off 	≤63 off
≥64 on
--- 	0
66 	0x42 	Sostenuto On/Off 	≤63 off
≥64 on
--- 	0
67 	0x43 	Soft Pedal On/Off 	≤63 off
≥64 on
--- 	0
68 	0x44 	Legato Footswitch 	≤63 Normal
≥64 Legato
--- 	0
69 	0x45 	Hold 2 	≤63 off
≥64 on
--- 	0
70 	0x46 	Sound Controller 1 (default:
Sound Variation)
0-127 	LSB 	Do Not Set
71 	47 	Sound Controller 2 (default:
Timbre/Harmonic Intens.)
0-127 	LSB 	Do Not Set
72 	48 	Sound Controller 3 (default:
Release Time)
0-127 	LSB 	Do Not Set
73 	49 	Sound Controller 4 (default:
Attack Time)
0-127 	LSB 	Do Not Set
74 	4A 	Sound Controller 5 (default:
Brightness)
0-127 	LSB 	Do Not Set
75 	4B 	Sound Controller 6 (default:
Decay Time - see MMA RP-021)
0-127 	LSB 	Do Not Set
76 	4C 	Sound Controller 7 (default:
Vibrato Rate - see MMA RP-021)
0-127 	LSB 	Do Not Set
77 	4D 	Sound Controller 8 (default:
Vibrato Depth - see MMA RP-
021)
0-127 	LSB 	Do Not Set
78 	4E 	Sound Controller 9 (default:
Vibrato Delay - see MMA RP-
021)
0-127 	LSB 	Do Not Set
79 	4F 	Sound Controller 10 (default
undefined - see MMA RP-021)
0-127 	LSB 	Do Not Set

## Page 11

80 	50 	General Purpose Controller 5 	0-127 	LSB 	Device
Specific
81 	51 	General Purpose Controller 6 	0-127 	LSB 	Device
Specific
82 	52 	General Purpose Controller 7 	0-127 	LSB 	Device
Specific
83 	53 	General Purpose Controller 8 	0-127 	LSB 	Device
Specific
84 	54 	Portamento Control 	0-127 	LSB 	Do Not Set
85 	55 	Undefined 	--- 	--- 	Device
Specific
86 	56 	Undefined 	--- 	--- 	Device
Specific
87 	57 	Undefined 	--- 	--- 	Device
Specific
88 	58 	High Resolution Velocity Prefix 	0-127 	LSB 	Do Not Set
89 	59 	Undefined 	--- 	--- 	Device
Specific
90 	5A 	Undefined 	--- 	--- 	Device
Specific
91 	5B 	Effects 1 Depth (default: Reverb
Send Level - see MMA RP-023)
(formerly External Effects Depth)
0-127 	--- 	Do Not Set
92 	5C 	Effects 2 Depth (formerly
Tremolo Depth)
0-127 	--- 	Do Not Set
93 	5D 	Effects 3 Depth (default: Chorus
Send Level - see MMA RP-023)
(formerly Chorus Depth)
0-127 	--- 	Do Not Set
94 	5E 	Effects 4 Depth (formerly Celeste
[Detune] Depth)
0-127 	--- 	Do Not Set
95 	5F 	Effects 5 Depth (formerly Phaser
Depth)
0-127 	--- 	Do Not Set
96 	60 	Data Increment (Data Entry +1)
(see MMA RP-018)
N/A 	--- 	Do Not Set
97 	61 	Data Decrement (Data Entry -1)
(see MMA RP-018)
N/A 	--- 	Do Not Set
98 	62 	Non-Registered Parameter
Number (NRPN) - LSB
0-127 	LSB 	127
99 	63 	Non-Registered Parameter
Number (NRPN) - MSB
0-127 	MSB 	127

## Page 12

100 	64 	Registered Parameter Number
(RPN) - LSB*
0-127 	LSB 	127
101 	65 	Registered Parameter Number
(RPN) - MSB*
0-127 	MSB 	127
102 	66 	Undefined 	--- 	--- 	Device
Specific
103 	67 	Undefined 	--- 	--- 	Device
Specific
104 	68 	Undefined 	--- 	--- 	Device
Specific
105 	69 	Undefined 	--- 	--- 	Device
Specific
106 	6A 	Undefined 	--- 	--- 	Device
Specific
107 	6B 	Undefined 	--- 	--- 	Device
Specific
108 	6C 	Undefined 	--- 	--- 	Device
Specific
109 	6D 	Undefined 	--- 	--- 	Device
Specific
110 	6E 	Undefined 	--- 	--- 	Device
Specific
111 	6F 	Undefined 	--- 	--- 	Device
Specific
112 	70 	Undefined 	--- 	--- 	Device
Specific
113 	71 	Undefined 	--- 	--- 	Device
Specific
114 	72 	Undefined 	--- 	--- 	Device
Specific
115 	73 	Undefined 	--- 	--- 	Device
Specific
116 	74 	Undefined 	--- 	--- 	Device
Specific
117 	75 	Undefined 	--- 	--- 	Device
Specific
118 	76 	Undefined 	--- 	--- 	Device
Specific
119 	77 	Undefined 	--- 	--- 	Device
Specific

## Page 13

120 	78 	[Channel Mode Message] All
Sound Off
0 	--- 	Do Not Set
121 	79 	[Channel Mode Message] Reset
All Controllers
(See MMA RP-015)
0 	--- 	Do Not Set
122 	7A 	[Channel Mode Message] Local
Control On/Off
0 off, 127 on 	--- 	Do Not Set
123 	7B 	[Channel Mode Message] All
Notes Off
0 	--- 	Do Not Set
124 	7C 	[Channel Mode Message] Omni
Mode Off (+ all notes off)
0 	--- 	Do Not Set
125 	7D 	[Channel Mode Message] Omni
Mode On (+ all notes off)
0 	--- 	Do Not Set
126 	7E 	[Channel Mode Message] Mono
Mode On (+ poly off, + all notes
off)
Note: This
equals the
number of
channels, or zero
if the number of
channels equals
the number of
voices in the
receiver.
--- 	Do Not Set
127 	7F 	[Channel Mode Message] Poly
Mode On (+ mono off, +all notes
off)
0 	--- 	Do Not Set
Note: Default Control Change Mapping Profile Devices may use "Undefined" Controllers for any
device-specific purpose without invalidating the Profile.
Note: When Value to be Set by Reset All Controllers is defined as "Device Specific", the Default
Control Change Mapping Profile Device should use it's own default value for that Control Change or
the Device may choose to ignore Reset All Controllers for that Control Change.

## Page 14

Appendix B. Recommended Response to Control
Change Messages
The following are optional recommendations, outlining responses to some common Control Change
messages.
1. 	Bank Select Control Change (cc#0/32)
The Bank Select message shall not affect any change in sound until a subsequent Program Change
message is received.
2. 	Portamento Time Control Change (cc#5/37)
Default Value: 0
Sets the pitch increment speed for the specified Channel when Portamento (cc#65) is on.
Pitch increment rate varies according to the recommended example shown below.
3. 	Channel Volume Control Change (cc#07/39)
Default Value: 100 (64H)
If the device creates a sound, the device should respond to CC #07. This controller controls the volume
of all sounds on the specified MIDI Channel and thus the relative volume balance among the Channels.
Regarding the curve of volume change messages, the square of the value is proportional to the volume.
CC#7 	Amplitude 	Proportional To:
127 	0 dB 	127 x 127 = 16129
96 	-4.9 dB 	96 x 96 = 9216
Portamento Rate
0.0100
0.1000
1.0000
10.0000
100.0000
1,000.0000
0 	16 	32 	48 	64 	80 	96 	112
Pitch increment speed
[cent/msec]

## Page 15

64 	-11.9 dB 	64 x 64 = 4096
32 	-23.9 dB 	32 x 32 = 1024
16 	-36.0 dB 	16 x 16 = 256
0 	-infinity 	0 x 0x = 0
The formula used is: gain in dB = 40 * log10(CC7/127)
Note: The total Channel volume is not always determined only by Volume Control Change. The total
volume may be dependent on Expression (cc#11), as well as the MIDI Master Volume Universal SysEx
message which is used to set the overall volume of all Channels if the device supports those messages.
4. 	Pan Control Change (cc#10/42)
Default Value: 64 (center) (40H)
Sets the stereo position of the specified Channel.
This message will pan a sound anywhere in the stereo field from hard left (value = 0, 00H) to hard
right (value = 127, 7FH).
It is not necessary to pan a Note that is currently sounding. However, if a currently sounding Note is
panned, the panning shall be done without audible artifacts or clicksno "zipper" noise.
A recommended example of the Pan curve is shown below:
The following formulas are recommended (see AMEI/MMA RP-037 for details):
Left Channel Gain [dB] = 20*log (cos (Pi/2* max(0,CC#10 - 1)/126)
Right Channel Gain [dB] = 20*log (sin (Pi /2* max(0,CC#10 - 1)/126)
The rate of Pan [%]

## Page 16

5. 	Expression Control Change (cc#11/43)
Default Value: 127 (7FH)
Modifies the volume set by Channel Volume (cc#7) on the specified Channel. The resulting Channel
volume is dependent on Volume (cc#7), Expression (cc#11), as well as the MIDI Master Volume
Universal SysEx message that is used to set the overall volume of all Channels.
Note: Expression (cc#11) and Channel Volume (cc#7) are used for different purposes. Channel
Volume (cc#7) should be used to set the overall volume of the Channel prior to music data playback as
well as for mixdown fader-style movements, while Expression (cc#11) should be used during music
data playback to attenuate the programmed MIDI volume (cc#7) data, thus creating diminuendos and
crescendos. This enables a listener, after the fact, to adjust the relative mix of instruments without
destroying the dynamic expression of that instrument.
In the curve of volume changes responding to the Expression value, the square of the value is
proportional to the volume. An example of the amplitude relationship between volume and expression
is shown below.
Examples:
CC#7 	CC#11 	Amplitude
127 	127 	0 dB
96 	127 	-4.9 dB
64 	127 	-11.9 dB
32 	127 	-23.9 dB
16 	127 	-36.0 dB
0 	127 	-infinity
CC#7 	CC#11 	Amplitude
127 	96 	-4.9 dB
127 	64 	-11.9 dB
127 	32 	-23.9 dB
127 	0 	-infinity
64 	64 	-23.8 dB
32 	96 	-28.8 dB
The formula used is: 	Gain in dB = (40 * log10(cc7/127)) + (40 * log 10 (cc11/127))

## Page 17

6. 	Hold1 (Damper or Sustain) Control Change (cc#64)
Default Value: 0 (OFF)
Turns Damper ON or OFF for the specified Channel. (Also known as “sustain pedal”.) Damper values
between 0 and 63 are recognized as OFF, and values between 64 and 127 are recognized as ON
(except if used as continuous or Half Pedal, below).
Default Control Change Mapping Profile Devices may also respond to Hold1 as a continuous
controller. On a piano this is typically used for "Half Pedal" effects. A Damper pedal may send
continuous values between minimum and maximum instead of just On/Off values sent by most typical
momentary sustain pedals.
Default Control Change Mapping Profile Devices may also respond to re-damper (as in when a
Damper pedal is stepped on immediately AFTER piano keys are released). This is typically used for
pianos but some other devices or timbres may implement this function.
Response to the Damper controller should be similar to the behavior of the Damper foot pedal
on a traditional piano. In terms of a traditional ADSR envelope, the Damper controller response
shall be as follows:
- When a Note-Off (or a Note-On with a velocity of 0) is received and the Damper is
ON, the Note-Off shall be deferred (ignored for now). When the Damper transitions
from ON to OFF, any notes which have deferred Note-Offs should now respond to the
note off, and the amplitude envelope should enter the Release stage, from wherever it
was.
- When the Damper transitions from OFF to ON, notes currently sounding shall be
unaffected. If the level of a note that has been released (either from a Note-Off, a Note-
On with a velocity of 0, or from a Damper ON to OFF) is greater than the envelope
Sustain level, the device should switch back to the Decay or Sustain portion of the
envelope. If the note's current level is not greater than the Sustain level, the Damper's
transition should be ignored.
- So, for example, an Organ note, having received a note-off followed by a Damper ON,
will not be "caught" by the damper. A piano note, however, with its Sustain level of
zero, would be "caught."
7. 	Portamento ON/OFF (cc#65)
Default Value: 0 (OFF)
Turns the Portamento effect ON or OFF for the specified Channel.
Values between 0 and 63 are recognized as OFF; values between 64 and 127 are recognized as ON.

## Page 18

8. 	Sostenuto (cc#66)
Default Value: 0 (OFF)
Turns Sostenuto ON or OFF for the specified Channel.
Values between 0 and 63 are recognized as OFF; values between 64 and 127 are recognized as ON.
Sostenuto is similar to Damper. It acts as a latch for currently held notes (those without any note-off
message). When Sostenuto transitions from OFF to ON, notes already held won’t be released until the
later of a) when the note receives a note-off, or b) when Sostenuto transitions from ON to OFF.
However, notes which are played (receive note-on message) while Sostenuto remains ON are
unaffected.
9. 	Legato (cc#68)
Default Value: 0 (OFF)
Turns the Legato effect ON or OFF for the specified Channel.
Values between 0 and 63 are recognized as OFF; values between 64 and 127 are recognized as ON.

## Page 19

Revision History
Date 	Version 	Changes
Nov. 26, 2020 	1.0 	Initial Version
https://www.midi.org
http://www.amei.or.jp
