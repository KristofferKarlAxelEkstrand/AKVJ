---
title: Default Drum Note Map Profile
docId: M2-125-UM
version: 1.0
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-125-UM_v1-0_Default-Drum-Note-Map-Profile.pdf
sourceType: online
pages: 28
sha256: 527337d06472cf692f79c6022d15bebfe7144a9e8125496884c128aa790b19ff
extractedAt: 2026-07-16T12:54:06.067Z
summary: MIDI-CI Profile standardizing drum note mappings (successor to the GM drum map).
---
# Default Drum Note Map Profile

## Page 1

MIDI-CI Profile for Default Drum Note Map
MIDI Association Document: M2-125-UM
Document Version 1.0
Draft Date 2025-01-15
Published 2025-01-31
Developed and Published By
The MIDI Association
and
Association of Musical Electronics Industry (AMEI)

## Page 2

PREFACE
MIDI Association Document M2-125-UM
MIDI-CI Profile for Default Drum Note Map
The MIDI-CI specification and the Common Rules for MIDI-CI Profiles define how
Devices with similar applications or of a similar Device type can negotiate to use a
common set of MIDI messages, called a MIDI-CI Profile, or simply a Profile.
Devices which implement a Profile have a high level of interoperability with each
other. Profiles are a beneficial component in enabling intelligent auto-configuration.
A Profile is a defined set of rules for how a MIDI receiver Device implementing the
Profile shall respond to a chosen set of MIDI messages, to achieve a particular
purpose or to suit a particular application. In addition to defining response to MIDI
messages, a Profile may optionally also define other Device functionality
requirements. This definition also then implies MIDI implementation of a sender or in
some cases may require a defined MIDI implementation of a sender.
This specification defines a MIDI-CI Profile for a default mapping of drum sounds to
Note Numbers. The mapping is based on the commonly shared mapping in many
MIDI products since the 1980s. This same mapping was adopted in the 1990s into
General MIDI specifications.
For details of MIDI-CI Profile Negotiation mechanisms which are necessary to
implement these Profile specifications, please read the MIDI-CI and Common Rules
for MIDI-CI Profiles specifications.
© 2025 Association of Musical Electronic Industry (AMEI) (Japan)
© 2025 MIDI Manufacturers Association Incorporated (MMA) (Worldwide except Japan)
ALL RIGHTS RESERVED. NO PART OF THIS DOCUMENT MAY BE REPRODUCED OR TRANSMITTED IN ANY
FORM OR BY ANY MEANS, ELECTRONIC OR MECHANICAL, INCLUDING INFORMATION STORAGE AND
RETRIEVAL SYSTEMS, WITHOUT PERMISSION IN WRITING FROM THE MIDI MANUFACTURERS
ASSOCIATION.
https://www.amei.or.jp https://www.midi.org

## Page 3

Version History
Table 1 Version History
Publication Date Version Changes
2025-01-31 1.0 Initial release

## Page 4

Contents
Version History ............................................................................................................................................ 3
Contents........................................................................................................................................................ 4
Figures .......................................................................................................................................................... 5
Tables............................................................................................................................................................ 5
1 References .............................................................................................................................................. 6
1.1.1 Normative References ....................................................................................................... 6
1.2 Terminology .................................................................................................................................. 7
1.2.1 Definitions ......................................................................................................................... 7
1.2.2 Reserved Words and Specification Conformance ........................................................... 10
1.3 Protocol and Data Format Conventions ...................................................................................... 11
1.3.1 MIDI 1.0 Protocol and MIDI 2.0 Protocol ...................................................................... 11
1.3.2 Registered Controllers (RCs) and Registered Parameter Numbers (RPNs) .................... 11
1.3.3 Resolution and Bit Scaling .............................................................................................. 11
2 Introduction......................................................................................................................................... 12
2.1 Executive Summary .................................................................................................................... 12
2.2 Background ................................................................................................................................. 12
3 MIDI-CI Functions ............................................................................................................................. 13
3.1 MIDI-CI Profile Configuration ................................................................................................... 13
4 Drum Note Map Profile ...................................................................................................................... 14
4.1 Mapping Drum Sounds to Note Numbers ................................................................................... 14
Sound Names: Undefined Tonal Quality......................................................................... 16
Mutually Exclusive Sets (MES) ...................................................................................... 16
Pan Position ..................................................................................................................... 17
4.2 Note On / Note Off ...................................................................................................................... 17
5 Response to Control Change Messages ............................................................................................. 18
5.1 Volume – CC#7 ........................................................................................................................... 18
5.2 Reverb Send Level – CC#91 (Effects 1 Depth) .......................................................................... 18
5.3 Channel Mode Messages ............................................................................................................. 18
5.3.1 All Sound Off – CC#120 ................................................................................................. 18
5.3.2 Reset All Controllers – CC#121 ...................................................................................... 18
5.3.3 All Notes Off – CC#123 .................................................................................................. 19
5.3.4 Other Mode Messages – CC#124-127............................................................................. 19
6 Response to Registered Per-Note Controller Messages................................................................... 20
6.1 Response to Registered Per-Note Controller Messages .............................................................. 20
6.1.1 Volume – RPNC#7 .......................................................................................................... 20
6.1.2 Pan – RPNC#10 ............................................................................................................... 20
6.1.3 Timbre/Harmonic Intensity (Sound Controller 2) – RPNC#71....................................... 21
6.1.4 Release Time (Sound Controller 3) – RPNC#72............................................................. 21
6.1.5 Attack Time (Sound Controller 4) – RPNC#73 .............................................................. 21
6.1.6 Brightness (Sound Controller 5) – RPNC#74 ................................................................. 21
6.1.7 Decay Time (Sound Controller 6) – RPNC#75 ............................................................... 21
6.1.8 Reverb Send Level (Effects 1 Depth) – RPNC#91 ......................................................... 21
6.2 Universal System Exclusive: Key-Based Instrument Controllers .............................................. 22

## Page 5

MIDI 1.0 Byte Stream Format .................................................................................................... 22
7 Discovering Sounds Included and Optional Features Supported: Profile Details Inquiry ......... 23
7.1.1 Optional Features Profile Details Inquiry Message......................................................... 23
7.1.2 Reply to Profile Details Inquiry Message........................................................................ 23
7.1.3 Inquiry Target Data – Features Supported ...................................................................... 24
Figures
Figure 1 Bitmap Format Per Byte ........................................................................................................... 26
Tables
Table 1 Version History .............................................................................................................................. 3
Table 2 Words Relating to Specification Conformance......................................................................... 10
Table 3 Words Not Relating to Specification Conformance ................................................................. 10
Table 4 Five Bytes Profile ID.................................................................................................................... 13
Table 5 Drum Note Map ........................................................................................................................... 14
Table 6 Response to CC#7 Volume .......................................................................................................... 18
Table 7 Response to RPNC#7 Volume .................................................................................................... 20
Table 8 Key-Based Instrument Controllers List .................................................................................... 22
Table 9 Profile Details Inquiry Message ................................................................................................. 23
Table 10 Reply to Profile Details Inquiry Message ................................................................................ 23
Table 11 Profile Features Supported ....................................................................................................... 24

## Page 6

1 References
1.1.1 Normative References
[MA01] Complete MIDI 1.0 Detailed Specification, Document Version 96.1, Third Edition, Association
of Musical Electronics Industry, https://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/
[MA02] M2-100-U MIDI 2.0 Specification Overview, Version 1.1, Association of Musical Electronics
Industry, https://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA03] M2-101-UM MIDI Capability Inquiry (MIDI-CI), Version 1.2, Association of Musical
Electronics Industry, https://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA04] M2-102-U Common Rules for MIDI-CI Profiles, Version 1.1, Association of Musical
Electronics Industry, https://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA05] M2-103-UM Common Rules for Property Exchange, Version 1.1, Association of Musical
Electronics Industry, https://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA06] M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol, Version 1.1,
Association of Musical Electronics Industry, https://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/
[MA07] M2-118-UM MIDI-CI Profile for General MIDI 2, Version 1.0.0, Association of Musical
Electronics Industry, https://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA08] M2-115-U MIDI 2.0 Bit Scaling and Resolution, Version 1.0.1, Association of Musical
Electronics Industry, https://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/

## Page 7

1.2 Terminology
1.2.1 Definitions
AMEI: Association of Musical Electronics Industry. Authority for MIDI Specifications in Japan.
Controller Message: Any MIDI Message from the following list:
MIDI 1.0 and MIDI 2.0 Protocol:
• Control Change
• Channel Pressure (Aftertouch)
• Poly Pressure (Key Aftertouch)
• Registered Controller (RPN)
• Assignable Controller (NRPN)
• Pitch Bend
MIDI 2.0 Protocol only:
• Registered Per-note Controller (including Relative versions)
• Assignable Per Note Controller (including Relative versions)
• Per Note Pitch Bend
Destination: A Receiver to which the Sender intends to send MIDI messages.
Device: An entity, whether hardware or software, which can send and/or receive MIDI messages.
Device ID: A one-byte field in Universal System Exclusive messages, as defined in the MIDI 1.0 Specification
[MA01], to indicate which device in the system is supposed to respond. The more specific application of Device
ID in MIDI-CI messages is defined in the MIDI Capability Inquiry specification [MA03]. The use of “Device” in
this context is not the same as a Device as defined above.
Drum Note Map Profile: The MIDI-CI Profile for Default Drum Note Map specification.
Initiator: One of two MIDI-CI Devices with a bidirectional communication between them. Initiator has the
management role of setting and negotiating parameters for interoperability between the two Devices. The primary
goal of Initiator is usually (but not strictly required to be) configuring two Devices for subsequent communication
from Initiator as MIDI transmitter to Responder as MIDI receiver. The role of Initiator and Responder may
alternate between the two MIDI-CI Devices. Either MIDI-CI Device may initiate a MIDI Transaction (act as
Initiator) at any time. Also see Responder.
Inquiry: A message sent by an Initiator to begin a Transaction.
MA: MIDI Association. Authority for MIDI specifications worldwide except Japan. See also MMA.
MIDI 1.0 Protocol: Version 1.0 of the MIDI Protocol as originally specified in [MA01] and extended by MA and
AMEI with numerous additional MIDI message definitions and Recommended Practices. The native format for
the MIDI 1.0 Protocol is a byte stream, but it has been adapted for many different transports. MIDI 1.0 messages
can be carried in UMP packets. The UMP format for the MIDI 1.0 Protocol is defined in the M2-104-UM
Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification [MA06].
MIDI 1.0 Specification: Complete MIDI 1.0 Detailed Specification, Document Version 96.1, Third Edition
[MA01].
MIDI 2.0: The MIDI environment that encompasses all of MIDI 1.0, MIDI-CI, Universal MIDI Packet (UMP),
MIDI 2.0 Protocol, MIDI 2.0 messages, and other extensions to MIDI as described in AMEI and MA
specifications. See the MIDI 2.0 Specification Overview [MA02].
MIDI 2.0 Protocol: Version 2.0 of the MIDI Protocol. The native format for MIDI 2.0 Protocol messages is UMP
as defined in M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification [MA06].
MIDI-CI: MIDI Capability Inquiry [MA03], a specification published by The MIDI Association and AMEI.

## Page 8

MIDI-CI Device: A Device that has the ability to act as a Responder that replies to inquiries received from an
Initiator. The ability to act as an Initiator is recommended but optional.
MIDI-CI Transaction: A Transaction using a set of MIDI-CI messages that includes an Inquiry sent by an
Initiator and a reply to the Inquiry returned by the Responder. The Responder’s reply to an Inquiry might be a
single message that satisfies the Inquiry, a set of multiple messages that satisfy the Inquiry, or an error message.
See also Transaction.
MIDI Endpoint: A Device which is an original source of MIDI messages or final consumer of MIDI messages.
MIDI In: A hardware or software MIDI connection used by a MIDI Device to receive MIDI messages from a
MIDI Transport.
MIDI Manufacturers Association: A California nonprofit 501(c)6 trade organization, and the legal entity name
of the MIDI Association.
MIDI Out: A hardware or software MIDI connection used by a MIDI Device to transmit MIDI messages to a
MIDI Transport.
MIDI Thru: A hardware or software MIDI connection used by a MIDI Device to retransmit MIDI messages the
device has received from a MIDI In.
MIDI Transport: A hardware or software MIDI connection used by a Device to transmit and/or receive MIDI
messages to and/or from another Device.
MMA: See MIDI Manufacturers Association.
MUID (MIDI Unique Identifier): A 28-bit random number generated by a Device used to uniquely identify the
Device in MIDI-CI messages sent to or from that Device.
Note Data Messages: MIDI messages which include a Note Number field. These include Note On/off, Poly
Pressure, Per-Note Pitchbend, Registered Per-Note Controllers, Assignable Per-Note Controllers, and Per-Note
Management Message.
NRPN: Non-Registered Parameter Number, a type of controller message defined in the MIDI 1.0 Protocol.
NRPNs have equivalent messages in the MIDI 2.0 Protocol, called Assignable Controllers (see [MA06]).
Profile: An MA/AMEI specification that includes a set of MIDI messages and defined responses to those
messages. A Profile is controlled by MIDI-CI Profile Negotiation Transactions. A Profile may have a defined
minimum set of mandatory messages and features, along with some optional or recommended messages and
features. See the MIDI-CI specification [MA03] and the Common Rules for MIDI-CI Profiles [MA04].
Protocol: There are two defined MIDI Protocols: the MIDI 1.0 Protocol and the MIDI 2.0 Protocol, each with a
data structure that defines the semantics for MIDI messages. See the M2-104-UM Universal MIDI Packet (UMP)
Format and MIDI 2.0 Protocol specification [MA06].
Receiver: A MIDI Device which has a MIDI Transport connected to its MIDI In.
Responder: One of two MIDI-CI Devices with a bidirectional communication between them. The Responder is
the Device that receives an Inquiry message from an Initiator Device as part of a MIDI-CI Transaction and acts
based on negotiation messages managed by the Initiator Device. Also see Initiator.
RPN: Registered Parameter Number, a type of controller message defined in the MIDI 1.0 Protocol. RPNs have
equivalent messages in the MIDI 2.0 Protocol, called Registered Controllers (see [MA06]).
Sender: A MIDI Device which transmits MIDI messages to a MIDI Transport which is connected to its MIDI Out
or to its MIDI Thru port.
Source: A Source is a Sender which originates or generates MIDI messages. A Source does not include a Sender
which is retransmitting messages which originated in another MIDI Device.
Transaction: An exchange of MIDI messages between two MIDI Devices with a bidirectional connection. All the
MIDI messages in a single Transaction are associated and work together to accomplish one function. The simplest
Transaction generally consists of an inquiry sent by one MIDI Device and an associated reply returned by a

## Page 9

second MIDI Device. A Transaction may also consist of an inquiry from one MIDI Device and several associated
replies from a second MIDI Device. A Transaction may be a more complex set of message exchanges, started by
an initial inquiry from one MIDI Device and multiple, associated replies exchanged between the first MIDI
Device and a second MIDI Device.
UMP: Universal MIDI Packet.
UMP Endpoint: A MIDI Endpoint which uses the UMP Format.
UMP Format: Data format for fields and messages in the Universal MIDI Packet, see [MA06].
UMP MIDI 1.0 Device: any Device that sends or receives MIDI 1.0 Protocol messages using the UMP Format,
see [MA06]. Such Devices may use UMP Message Types that extend the functionality beyond Non-UMP MIDI
1.0 Systems.
Universal MIDI Packet (UMP): The Universal MIDI Packet is a data container which defines the data format for
all MIDI 1.0 Protocol messages and all MIDI 2.0 Protocol messages. UMP is intended to be universally
applicable, i.e., technically suitable for use in any transport where MA/AMEI elects to officially support UMP.
For detailed definition see M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol
specification [MA06].

## Page 10

1.2.2 Reserved Words and Specification Conformance
In this document, the following words are used solely to distinguish what is required to conform to this
specification, what is recommended but not required for conformance, and what is permitted but not required for
conformance:
Table 2 Words Relating to Specification Conformance
Word Reserved For Relation to Specification Conformance
shall Statements of requirement
Mandatory
A conformant implementation conforms to all ‘shall’
statements.
should Statements of recommendation
Recommended but not mandatory
An implementation that does not conform to some or all
‘should’ statements is still conformant, providing all ‘shall’
statements are conformed to.
may Statements of permission
Optional
An implementation that does not conform to some or all
‘may’ statements is still conformant, providing that all ‘shall’
statements are conformed to.
By contrast, in this document, the following words are never used for specification conformance statements; they
are used solely for descriptive and explanatory purposes:
Table 3 Words Not Relating to Specification Conformance
Word Reserved For Relation to Specification Conformance
must Statements of unavoidability Describes an action to be taken that, while not required (or
at least not directly required) by this specification, is
unavoidable.
Not used for statements of conformance requirement (see
‘shall’ above).
will Statements of fact Describes a condition that as a question of fact is
necessarily going to be true, or an action that as a question
of fact is necessarily going to occur, but not as a
requirement (or at least not as a direct requirement) of this
specification.
Not used for statements of conformance requirements (see
‘shall’ above).
can Statements of capability Describes a condition or action that a system element is
capable of possessing or taking.
Not used for statements of conformance permission (see
‘may’ above).
might Statements of possibility Describes a condition or action that a system element is
capable of electing to possess or take.
Not used for statements of conformance permission (see
‘may’ above).

## Page 11

1.3 Protocol and Data Format Conventions
1.3.1 MIDI 1.0 Protocol and MIDI 2.0 Protocol
This document describes the use of messages in the MIDI 2.0 Protocol. However, Devices which conform to the
Profile in this specification may implement either the MIDI 2.0 Protocol or the MIDI 1.0 Protocol. For a
comparison of the Protocols and for mechanisms to select a Protocol see the M2-104-UM Universal MIDI Packet
(UMP) Format and MIDI 2.0 Protocol specification [MA06].
Note: Section 6.2 is an exception, presenting MIDI 1.0 data format and values because it defines the use
of a System Exclusive mechanism which is included specifically for Devices which use MIDI 1.0.
1.3.2 Registered Controllers (RCs) and Registered Parameter Numbers (RPNs)
This document describes the use of RC messages in the MIDI 2.0 Protocol. These translate directly to RPN
messages in the MIDI 1.0 Protocol. Devices which conform to the Profiles in this specification may implement the
MIDI 2.0 Protocol with RC messages or the MIDI 1.0 Protocol with RPN messages. Scaling of values between
RCs and RPNs is addressed in Section 1.3.3.
1.3.3 Resolution and Bit Scaling
In this document, values are expressed according to the ranges and resolutions defined in fields of the MIDI 2.0
Protocol. Any MIDI 1.0 Protocol Device or system that is using this Profile must scale the values to suit the
Device or system. For example, a 32-bit value of a Registered Controller might be scaled to a 14-bit value or a 7-
bit value in the corresponding Registered Parameter Number.
Scaling methods are defined in the M2-115-UM MIDI 2.0 Bit Scaling and Resolution specification [MA08].

## Page 12

2 Introduction
2.1 Executive Summary
This specification is intended to promote compatibility between a wide range of products which generate drum
sounds.
For example, a drum pattern which is programmed on a drum machine or portable keyboard can also
send MIDI Note messages to play the pattern on a software based drum application and remain musically
useful.
This specification defines a MIDI-CI Profile for a default mapping of specific drums to specific Note Numbers.
The note map used in this Profile was established by many products in the 1980s as a commonly used set of note
assignments for drum sounds and that was later standardized in General MIDI.
Many drum machines, grooveboxes, keyboard workstations, portable keyboards, digital pianos, and software
synthesizers (many of which do NOT support the full GM specification) have drum kits that utilize this drum kit
mapping because of the vast quantity of MIDI data available that will play properly with these drum maps.
For example, a Kick Drum is always played on Note Number 0x24, and a Snare Drum is always played on
Note Number 0x26. As a result, a pattern programmed for a hihat sound on one device which conforms to
the Profile will play a hihat sound on any other device which conforms to the Profile. This Profile also
supports some other key features like mutually exclusive sounds. For example, a closed hihat and an
open hihat cannot sound simultaneously.
This Profile has far broader applications than a more rigidly defined GM Drum map because it allows sound
designers the freedom to map any sound to the Default Note assigned to Bass Drum or Snare and experiment with
matching existing MIDI sequence data to new sonic possibilities.
2.2 Background
This Profile specification relies on mechanisms defined by the MIDI-CI (Capabilities Inquiry) specification.
MIDI-CI allows devices to communicate their capabilities to each other. Devices can use that capabilities
information to self-configure their MIDI connections and related settings. Profiles are a beneficial component in
enabling intelligent auto-configuration between 2 devices.
Profiles define specific implementations of a set of MIDI messages chosen to suit a particular instrument, device
type, or to accomplish a particular task. Two devices that conform to the same Profile will generally have greater
interoperability between them than devices using MIDI without Profiles. Profiles increase interoperability and
ease of use while lowering the need for manual configuration of devices by users.
Further information required for implementing this device Profile is found in the Common Rules for MIDI-CI
Profiles specification.

## Page 13

3 MIDI-CI Functions
This section defines functions which operate on the Channel of the Drum Note Map Profile.
3.1 MIDI-CI Profile Configuration
This section defines the response to Profile Configuration messages including the Drum Note Map Profile
Identification.
MIDI-CI Profile Configuration Messages identify and control each Profile uniquely using several fields in MIDI-
CI Profile Configuration messages. The Profile identifiers for this Drum Note Map Profile are as follows:
Table 4 Five Bytes Profile ID
Profile ID Byte 1 0x7E (Standard Defined Profile)
Profile ID Byte 2 0x20 (Drum Note Map Profile Number MSB)
Profile ID Byte 3 0x03 (Drum Note Map Profile Number LSB)
Profile ID Byte 4 0x01 (Drum Note Map Profile Version)
Profile ID Byte 5 0xXX (Drum Note Map Profile Level)
Drum Note Map Profile Level:
• 0x00 Some implementation but does not comply with minimum requirements
• 0x01 Meets the minimum requirements
• 0x02-0x7E Reserved
• 0x7F Highest level of Profile support (Same as 0x01 in this Profile)

## Page 14

4 Drum Note Map Profile
This MIDI-CI Profile for Default Drum Note Map specification defines, as a minimum requirement, that a
conforming Device shall use the Note Number mapping defined in Table 5.
This Profile specification also defines the optional use of certain Control Change messages and MIDI 2.0 Per-
Note Controllers.
4.1 Mapping Drum Sounds to Note Numbers
All Devices which support this MIDI-CI Profile for Default Drum Note Map shall assign sounds which it can play
to match the mapping defined in Table 5.
A Device is not required to be able to play all of the listed sounds and may include only a subset of the total list of
sounds in the Drum Note Map.
A Device may include extra sounds assigned to Note Numbers 0 through 26 and 89 through 127.
Table 5 Drum Note Map
Note #
Decimal
Note #
Hex
Name Mutually
Exclusive
Set
Recommended
Pan Position
(optional)
Profile Details
Discovery Bitmap
Byte Bit
27 0x1B High Q Left 23% 2 0
28 0x1C Slap Left 23% 2 1
29 0x1D Scratch Push MES 7 Left 16% 2 2
30 0x1E Scratch Pull MES 7 Left 16% 2 3
31 0x1F Sticks Center 2 4
32 0x20 Square Click Left 16% 2 5
33 0x21 Metronome Click Center 2 6
34 0x22 Metronome Bell Center 3 0
35 0x23 Acoustic Bass Drum Center 3 1
36 0x24 Bass Drum 1 Center 3 2
37 0x25 Side Stick Center 3 3
38 0x26 Acoustic Snare Center 3 4
39 0x27 Hand Clap Left 16% 3 5
40 0x28 Electric Snare Center 3 6
41 0x29 Low Floor Tom Left 47% 4 0
42 0x2A Closed Hi-hat MES 1 Right 32% 4 1
43 0x2B High Floor Tom Left 28% 4 2
44 0x2C Pedal Hi-hat MES 1 Right 32% 4 3

## Page 15

Note #
Decimal
Note #
Hex
Name Mutually
Exclusive
Set
Recommended
Pan Position
(optional)
Profile Details
Discovery Bitmap
Byte Bit
45 0x2D Low Tom Left 9% 4 4
46 0x2E Open Hi-hat MES 1 Right 32% 4 5
47 0x2F Low-Mid Tom Right 10% 4 6
48 0x30 High Mid Tom Right 29% 5 0
49 0x31 Crash Cymbal 1 Right 32% 5 1
50 0x32 High Tom Right 48% 5 2
51 0x33 Ride Cymbal 1 Left 31% 5 3
52 0x34 Chinese Cymbal Left 31% 5 4
53 0x35 Ride Bell Left 31% 5 5
54 0x36 Tambourine Right 16% 5 6
55 0x37 Splash Cymbal Left 16% 6 0
56 0x38 Cowbell Right 32% 6 1
57 0x39 Crash Cymbal 2 Left 31% 6 2
58 0x3A Vibra-slap Left 55% 6 3
59 0x3B Ride Cymbal 2 Left 31% 6 4
60 0x3C High Bongo Right 56% 6 5
61 0x3D Low Bongo Right 56% 6 6
62 0x3E Mute High Conga Left 39% 7 0
63 0x3F Open High Conga Left 39% 7 1
64 0x40 Low Conga Left 39% 7 2
65 0x41 High Timbale Right 32% 7 3
66 0x42 Low Timbale Right 32% 7 4
67 0x43 High Agogo Left 55% 7 5
68 0x44 Low Agogo Left 55% 7 6
69 0x45 Cabasa Left 55% 8 0
70 0x46 Maracas Left 63% 8 1
71 0x47 Short Whistle MES 2 Right 56% 8 2

## Page 16

Note #
Decimal
Note #
Hex
Name Mutually
Exclusive
Set
Recommended
Pan Position
(optional)
Profile Details
Discovery Bitmap
Byte Bit
72 0x48 Long Whistle MES 2 Right 56% 8 3
73 0x49 Short Guiro MES 3 Right 48% 8 4
74 0x4A Long Guiro MES 3 Right 48% 8 5
75 0x4B Claves Right 32% 8 6
76 0x4C High Wood Block Right 56% 9 0
77 0x4D Low Wood Block Right 56% 9 1
78 0x4E Mute Cuica MES 4 Left 31% 9 2
79 0x4F Open Cuica MES 4 Left 31% 9 3
80 0x50 Mute Triangle MES 5 Left 63% 9 4
81 0x51 Open Triangle MES 5 Left 63% 9 5
82 0x52 Shaker Right 48% 9 6
83 0x53 Jingle Bell Right 56% 10 0
84 0x54 Bell Tree Right 60% 10 1
85 0x55 Castanets Left 47% 10 2
86 0x56 Mute Surdo MES 6 Left 31% 10 3
87 0x57 Open Surdo MES 6 Left 31% 10 4
88 0x58 Applause Center 10 5
Sound Names: Undefined Tonal Quality
The tonal qualities or properties of each sound is not defined. Each sound is defined in name only, although that
name implies at least a musical role. A sound designer and/or device designer may freely decide what sound they
will provide to best suit each of the named sounds.
A Device may substitute a sound which is not identical to the name of the sound, if that sound is intended in
context to fill a similar role to the named sound.
For example: A Device may have an electronic kick drum sound as the bass drum sound on Note Number
0x24 and a longer or deeper version of the electronic kick drum on Note Number 0x23, even though Note
Number 0x23 is named “Acoustic Bass Drum”.
Mutually Exclusive Sets (MES)
Some sounds require a mutually exclusive Note On/Off assignment. For example, when a Note On message for
Note number 42 (Closed Hi Hat) is received while Note number 46 (Open Hi Hat) is sounding, Note number 46 is
promptly muted and Note number 42 sounds.

## Page 17

The following combinations of timbres use mutually exclusive assignments. When any sound which belongs to
any of the following Mutually Exclusive Sets (MES) starts to play, all other sounds in the same Mutually
Exclusive Set shall be muted.
• MES 1: Closed HH (42) / Pedal HH (44) / Open HH (46)
• MES 2: Short Whistle (71) / Long Whistle (72)
• MES 3: Short Guiro (73) / Long Guiro (74)
• MES 4: Mute Cuica (78) / Open Cuica (79)
• MES 5: Mute Triangle (80) / Open Triangle (81)
• MES 6: Mute Surdo (86) / Open Surdo (87)
• MES 7: Scratch Push (29) / Scratch Pull (30)
Pan Position
If sounds are mixed in a main audio output which is in stereo, then each sound may be placed according to the
recommended Pan Position. The Pan Position for each sound may be set by a Registered Per-Note Controller (see
Section 6.1.2).
4.2 Note On / Note Off
Each sound is triggered by a Note On message. Every Note On message shall be followed by a matching Note Off
message.
The timing of the Note Off message may be determined by the Sender. For example, a Sender which is a drum
pad might typically send a Note Off shortly after the Note On but a Sender which is a keyboard might typically
send a Note Off whenever the player releases the key.
In many Devices the Note Off message has no impact on the sound output for drum sounds. For most sounds, the
Receiver should play the whole life cycle of the sound regardless of the timing of a Note Off message.

## Page 18

5 Response to Control Change Messages
A Device which conforms to the Drum Note Map Profile should respond to Control Change messages to set the
properties on the specified MIDI Channel as defined below.
5.1 Volume – CC#7
A controller which is set by a main volume knob (or similar control mechanism) applied to all sounds. Regarding
the curve of volume change messages, the square of the value is proportional to the volume.
Table 6 Response to CC#7 Volume
CC#7 Amplitude
0xFFFFFFFF 0 dB
0xC1041041 -4.9 dB
0x80000000 -11.9 dB
0x40000000 -23.9 dB
0x20000000 -36.0 dB
0x00000000 -infinity
The formula used is:
gain in dB = 40 * log10(CC#7/0xFFFFFFFF)
Default = 0xC8000000
Also see Section 6.1.1 for information about Per-Note Volume Control.
5.2 Reverb Send Level – CC#91 (Effects 1 Depth)
Sets the reverb send level for the Channel. The curve responding to the value shall be linear with respect to
amplitude. Send level is 100% at value 0xFFFFFFFF.
Also see Section 6.1.8 for information about Per-Note Reverb Control.
5.3 Channel Mode Messages
The following sections define the response to Mode messages.
5.3.1 All Sound Off – CC#120
Value: 0x00000000
When this message is received, all the Notes sounding shall be immediately released, and the sound is muted as
quickly as possible without producing a click or other audible noise.
5.3.2 Reset All Controllers – CC#121
Default Value: 0x00000000
When value is 0x00000000, this message shall reset the status of Control Change messages (except as noted in the
following paragraph) to default values, Channel pressure to 0x00000000, and Pitch Bend to 0x80000000(center)
on the specified Channel.

## Page 19

Program Change, Bank Select (0/32), Channel Volume (7), Pan (10), and Expression (11) shall not be reset.
5.3.3 All Notes Off – CC#123
This message shall turn off all Notes sounding on the Receiver.
5.3.4 Other Mode Messages – CC#124-127
Response to the following Mode messages is optional and device implementation specific:
• Omni Mode Off (CC#124)
• Omni Mode On (CC#125)
• Mono Mode On (CC#126)
• Poly Mode On (CC#127)

## Page 20

6 Response to Registered Per-Note Controller Messages
The Default Drum Note Map Profile defines 2 optional mechanisms to set properties on a specified Note Number
1. Per-Note Controller messages as defined in Section 6.1.
2. Key-Based Instrument Controllers Universal System Exclusive messages as defined in Section 6.2.
6.1 Response to Registered Per-Note Controller Messages
A Device which conforms to the Drum Note Map Profile and the MIDI 2.0 Protocol may implement Registered
Per-Note Controllers to set the properties on the specified Note Number as defined in Sections 6.1.1 through 6.1.8.
A Receiver which responds to these Registered Per-Note Controllers shall treat these Registered Per-Note
Controllers as persistent for all future Notes. The Per Note Management message may be used to reset these to
default values and/or detach all Registered Per-Note Controllers from a currently sounding Note (see [MA06]).
For any Registered Per-Note Controller which does not have a defined default value, the Receiver may determine
its preferred default value.
6.1.1 Volume – RPNC#7
A Registered Per-Note Controller which sets the volume of the sound on each Note Number. Regarding the curve
of volume change messages, the square of the value is proportional to the volume.
Table 7 Response to RPNC#7 Volume
RPNC#7 Amplitude
0xFFFFFFFF 0 dB
0xC1041041 -4.9 dB
0x80000000 -11.9 dB
0x40000000 -23.9 dB
0x20000000 -36.0 dB
0x00000000 -infinity
The formula used is:
gain in dB = 40 * log10(RPNC#7/0xFFFFFFFF)
Default = 0xC8000000
The Volume level set by this RPNC for the specified Note Number is relative to any value set by the Control
Change #7 (see Section Error! Reference source not found.).
For example: If a CC#7 sets Volume for the whole Channel to -3 dB and a subsequent PNCC#7 sets the
Volume for Note Number 64 to -2 dB, then the sound assigned to Note Number #64 should sound at a
Volume of -5 dB, while the sounds on other Note Numbers continue to sound a Volume of -3 dB.
6.1.2 Pan – RPNC#10
A Registered Per-Note Controller which sets the left to right pan position of the sound on each Note Number.
This message will pan a sound anywhere in the stereo field from left 100% to right 100%.
The recommended (optional) default pan value for each sound is shown in Table 5.
0x00000000 = Left 100%

## Page 21

0x80000000 = Center (Left 0%, Right 0%)
0xFFFFFFFF = Right 100%
6.1.3 Timbre/Harmonic Intensity (Sound Controller 2) – RPNC#71
Default Value: 0x80000000 (no change)
Sets the strength of the resonance effect for filter(s) for the specified Note Number. Exact behavior is left to the
manufacturer's discretion.
Modifies the resonance parameter value that is preset in the timbre. The timbre shall recognize it as a relative
change, where the center (null point) is 0x80000000. When the value is less than 0x80000000, the resonance
becomes weaker. When the value is greater than 0x80000000, the resonance becomes stronger.
6.1.4 Release Time (Sound Controller 3) – RPNC#72
Default Value: 0x80000000 (no change)
Controls the release time of the envelope for the specified Note Number. This is a relative parameter whose center
(null point) is 0x80000000. When the value is less than 0x80000000, the time becomes shorter. When the value is
greater than 0x80000000, the time becomes longer. Exact behavior is left to the manufacturer's discretion.
6.1.5 Attack Time (Sound Controller 4) – RPNC#73
Default Value: 0x80000000 (no change)
Controls the attack time of the envelope for the specified Note Number. This is a relative parameter whose center
(null point) is 0x80000000. When the value is less than 0x80000000, the time becomes shorter. When the value is
greater than 0x80000000, the time becomes longer. Exact behavior is left to the manufacturer's discretion.
6.1.6 Brightness (Sound Controller 5) – RPNC#74
Default Value: 0x80000000 (no change)
Controls the cut-off frequency of filter(s) for the specified Note Number.
Controls the preset cut-off frequency of the filter. This is a relative parameter whose center (null point) is
0x80000000. When the value is less than 0x80000000, the frequency becomes lower. When the value is greater
than 0x80000000, the cutoff frequency becomes higher. Exact behavior is left to the manufacturer's discretion.
6.1.7 Decay Time (Sound Controller 6) – RPNC#75
Default Value: 0x80000000 (no change)
Controls the decay time of the envelope for the specified Note Number. This is a relative parameter whose center
(null point) is 0x80000000. When the value is less than 0x80000000, the time becomes shorter. When the value is
greater than 0x80000000, the time becomes longer. Exact behavior is left to the manufacturer's discretion.
6.1.8 Reverb Send Level (Effects 1 Depth) – RPNC#91
Sets the reverb send level for the specified Note Number. The curve responding to the value shall be linear with
respect to amplitude. Send level is 100% at value 0xFFFFFFFF.
The Reverb level set by this RPNC overrides for the specified Note Number any value set by the CC#91 (see
Section Error! Reference source not found.).
For example: If a CC#91 sets Reverb Send level for the whole Channel to 0x40000000 and a subsequent
PNCC#91 sets the Reverb Send for Note Number 64 to 0x00000000, then the sound assigned to Note
Number #64 should sound without Reverb, while the sounds on other Note Numbers continue to sound with
Reverb Send Level of 0x40000000.

## Page 22

6.2 Universal System Exclusive: Key-Based Instrument Controllers
A Device which conforms to the Default Drum Note Map Profile and the MIDI 1.0 Protocol may implement the
Key-Based Instrument Controller messages to set the properties on the specified Note Number as defined in this
Section.
Key-Based Instrument Controllers are Universal System Exclusive messages defined in MIDI 1.0 to mimic the
functions of the Channel-based Controllers for sounds which are assigned separately to individual Note Numbers.
MIDI 1.0 Byte Stream Format
F0 7F <device ID> 0A 01 0n kk [nn vv] .. F7
F0 7F Universal Real Time SysEx header
<device ID> ID of responding device
0A sub-ID#1 = Key-Based Instrument Control
01 sub-ID#2 = Controller
0n MIDI Channel Number
kk Key number
[nn,vv] Controller Number and Value
:
F7 EOX
nn Controller Number
The Control Change numbers applicable to this Profile:
Table 8 Key-Based Instrument Controllers List
nn
Controller
Number
Name Equivalent RPNC
7 Volume See Section 6.1.1
10 Pan See Section 6.1.2
71 Timbre/Harmonic Intensity (Sound Controller 2) See Section 6.1.3
72 Release Time (Sound Controller 3) See Section 6.1.4
73 Attack Time (Sound Controller 4) See Section 6.1.5
74 Brightness (Sound Controller 5) See Section 6.1.6
75 Decay Time (Sound Controller 6) See Section 6.1.7
91 Reverb Send Level (Effects 1 Depth) See Section 6.1.8
vv Value
The values used are 7-bit scaled values of the 32-bit values defined for the equivalent Registered Per-
Note Controllers. See Sections 6.1.1 through to 6.1.8.

## Page 23

7 Discovering Sounds Included and Optional Features
Supported: Profile Details Inquiry
The MIDI-CI Profile Details Inquiry mechanism may be used to discover implementation details of a Receiver.
The following implementation details are discoverable:
• Which Per-Note control mechanisms are supported.
• Which Note Numbers have active sounds available.
A Device may also use the Reply to Profile Details Inquiry message to report changes to its configuration.
7.1.1 Optional Features Profile Details Inquiry Message
An Initiator may send this to discover details of the Profile implementation of a Responder.
Table 9 Profile Details Inquiry Message
Value Parameter
F0 System Exclusive Start
7E Universal System Exclusive
1 byte Destination
00–0F: To/from MIDI Channels 1-16
0D Universal System Exclusive Sub-ID#1: MIDI-CI
28 Universal System Exclusive Sub-ID#2: Profile Details Inquiry
1 byte MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 bytes Default Drum Map Profile Id (0x7E 0x20 0x03 0x01 0x01)
01 Inquiry Target: Profile Optional Features Supported
F7 End Universal System Exclusive
7.1.2 Reply to Profile Details Inquiry Message
When a Responder receives the Profile Details Inquiry message it shall respond by sending a Reply to Profile
Details Inquiry message.
A Device should also send this message as a Notification message when the data has changed, without needing a
prior receipt of a Profile Details Inquiry message. For example, if a change of program on a Device results in a
different set of Note Numbers having sounds available, the Device should send the message to declare the new
data set.
Table 10 Reply to Profile Details Inquiry Message
Value Parameter
F0 System Exclusive Start
7E Universal System Exclusive

## Page 24

1 byte Destination
00–0F: To/from MIDI Channels 1-16
0D Universal System Exclusive Sub-ID#1: MIDI-CI
29 Universal System Exclusive Sub-ID#2: Reply to Profile Details Inquiry
02 MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 bytes Default Drum Note Map Profile Id (0x7E 0x20 0x03 0x01 0x01)
01 Inquiry Target: Profile Optional Features Supported
14 00 Inquiry Target Data Length (dl) (LSB first)
11 bytes Inquiry Target Data – Features Supported
F7 End Universal System Exclusive
7.1.3 Inquiry Target Data – Features Supported
The Inquiry Target Data field declares features supported as follows:
Table 11 Profile Features Supported
Bytes Features Supported
Byte 1
(bitmap*)
D0: Supports MIDI 2.0 Per-Note Controllers
D1: Supports MIDI 1.0 Key-Based Instrument
Controllers (Universal SysEx)
D2-D6: Reserved
Byte 2
(bitmap*)
D0: Default Sound on Note Number 27
D1: Default Sound on Note Number 28
D2: Default Sound on Note Number 29
D3: Default Sound on Note Number 30
D4: Default Sound on Note Number 31
D5: Default Sound on Note Number 32
D6: Default Sound on Note Number 33
Byte 3
(bitmap*)
D0: Default Sound on Note Number 34
D1: Default Sound on Note Number 35
D2: Default Sound on Note Number 36
D3: Default Sound on Note Number 37
D4: Default Sound on Note Number 38
D5: Default Sound on Note Number 39
D6: Default Sound on Note Number 40

## Page 25

Byte 4
(bitmap*)
D0: Default Sound on Note Number 41
D1: Default Sound on Note Number 42
D2: Default Sound on Note Number 43
D3: Default Sound on Note Number 44
D4: Default Sound on Note Number 45
D5: Default Sound on Note Number 46
D6: Default Sound on Note Number 47
Byte 5
(bitmap*)
D0: Default Sound on Note Number 48
D1: Default Sound on Note Number 49
D2: Default Sound on Note Number 50
D3: Default Sound on Note Number 51
D4: Default Sound on Note Number 52
D5: Default Sound on Note Number 53
D6: Default Sound on Note Number 54
Byte 6
(bitmap*)
D0: Default Sound on Note Number 55
D1: Default Sound on Note Number 56
D2: Default Sound on Note Number 57
D3: Default Sound on Note Number 58
D4: Default Sound on Note Number 59
D5: Default Sound on Note Number 60
D6: Default Sound on Note Number 61
Byte 7
(bitmap*)
D0: Default Sound on Note Number 62
D1: Default Sound on Note Number 63
D2: Default Sound on Note Number 64
D3: Default Sound on Note Number 65
D4: Default Sound on Note Number 66
D5: Default Sound on Note Number 67
D6: Default Sound on Note Number 68
Byte 8
(bitmap*)
D0: Default Sound on Note Number 69
D1: Default Sound on Note Number 70
D2: Default Sound on Note Number 71
D3: Default Sound on Note Number 72
D4: Default Sound on Note Number 73
D5: Default Sound on Note Number 74
D6: Default Sound on Note Number 75
Byte 9
(bitmap*)
D0: Default Sound on Note Number 76
D1: Default Sound on Note Number 77
D2: Default Sound on Note Number 78
D3: Default Sound on Note Number 79
D4: Default Sound on Note Number 80

## Page 26

D5: Default Sound on Note Number 81
D6: Default Sound on Note Number 82
Byte 10
(bitmap*)
D0: Default Sound on Note Number 83
D1: Default Sound on Note Number 84
D2: Default Sound on Note Number 85
D3: Default Sound on Note Number 86
D4: Default Sound on Note Number 87
D5: Default Sound on Note Number 88
D6: Reserved
If the Device has a default sound currently available to be played on a Note Number, then set the bit to one. If
there is no sound currently available on the Note Number, then set the bit to zero.
*Bitmap fields in MIDI-CI messages are presented as follows:
Figure 1 Bitmap Format Per Byte

## Page 28

https://www.amei.or.jp https://www.midi.org
