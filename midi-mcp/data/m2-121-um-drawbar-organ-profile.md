---
title: Drawbar Organ Profile
docId: M2-121-UM
version: 1.0.2
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-121-UM_v1-0-2_Drawbar-Organ-Profile.pdf
sourceType: online
pages: 22
sha256: 07ee1be66d3f0e75af2c200c7722caa66f1b31fd14681263e040b472089e43da
extractedAt: 2026-07-16T12:54:04.893Z
summary: MIDI-CI instrument Profile standardizing drawbar organ control mappings.
---
# Drawbar Organ Profile

## Page 1

MIDI-CI Profile for Drawbar Organs
Drawbar Organ Single Channel Profile
MIDI Association Document: M2-121-UM
Document Version 1.0.2
Draft Date 2024-01-23
Published 2024-01-24
Developed and Published By
The MIDI Association
and
Association of Musical Electronics Industry (AMEI)

## Page 2

PREFACE
MIDI Association Document M2-121-UM
MIDI-CI Profile for Drawbar Organs
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
This MIDI-CI Profile Specification defines a set of messages to control parameters of
many Devices with drawbar organ capabilities.
For details of MIDI-CI Profile Negotiation mechanisms which are necessary to
implement these Profile specifications, please read the MIDI-CI and Common Rules
for MIDI-CI Profiles specifications.
© 2024 Association of Musical Electronic Industry (AMEI) (Japan)
© 2024 MIDI Manufacturers Association Incorporated (MMA) (Worldwide except Japan)
ALL RIGHTS RESERVED. NO PART OF THIS DOCUMENT MAY BE REPRODUCED OR TRANSMITTED IN ANY
FORM OR BY ANY MEANS, ELECTRONIC OR MECHANICAL, INCLUDING INFORMATION STORAGE AND
RETRIEVAL SYSTEMS, WITHOUT PERMISSION IN WRITING FROM THE MIDI MANUFACTURERS
ASSOCIATION.
http://www.amei.or.jp https://www.midi.org

## Page 3

Version History
Table 1 Version History
Publication Date Version Changes
2024-01-24 1.0.2 Initial release

## Page 4

Contents
Version History ........................................................................................................................................... 3
Contents ....................................................................................................................................................... 4
Figures ......................................................................................................................................................... 5
Tables ........................................................................................................................................................... 5
1 References ............................................................................................................................................. 6
1.1 Normative References .................................................................................................................. 6
1.2 Terminology ................................................................................................................................. 7
1.2.1 Definitions ........................................................................................................................ 7
1.2.2 Reserved Words and Specification Conformance ............................................................ 9
1.3 Protocol and Data Format Conventions ...................................................................................... 10
1.3.1 MIDI 1.0 Protocol and MIDI 2.0 Protocol ..................................................................... 10
1.3.2 Registered Controllers (RCs) and Registered Parameter Numbers (RPNs) ................... 10
1.3.3 Resolution and Bit Scaling ............................................................................................. 10
2 Introduction ........................................................................................................................................ 11
2.1 Executive Summary .................................................................................................................... 11
2.2 Background................................................................................................................................. 11
3 Drawbar Organ Implementations .................................................................................................... 12
3.1 Sound Engine.............................................................................................................................. 12
3.1.1 Rotary Speaker Profile .................................................................................................... 12
4 MIDI-CI Functions ............................................................................................................................ 13
4.1 MIDI-CI Profile Configuration................................................................................................... 13
4.2 Discovering Optional Features Supported: Profile Details Inquiry ............................................ 13
4.2.1 Initiator Sends a MIDI-CI Profile Details Inquiry Message ........................................... 13
4.2.2 Responder Sends a MIDI-CI Reply to Profile Details Inquiry Message ........................ 13
Drawbar Organ Profiles Optional Features Supported ....................................................13
5 Response to Required Channel Messages ........................................................................................ 15
5.1.1 Note On / Note Off ......................................................................................................... 15
5.1.2 Registered Controllers .................................................................................................... 15
Drawbars ..........................................................................................................................15
5.1.3 Control Change ............................................................................................................... 16
5.1.3.1 Volume (CC#7) .................................................................................................16
5.1.3.2 Expression (CC#11) ..........................................................................................17
5.1.4 Channel Mode Messages ................................................................................................ 17
5.1.4.1 All Sound Off (CC#120) ...................................................................................17
5.1.4.2 Reset All Controllers (CC#121) ........................................................................17
5.1.4.3 All Notes Off (CC#123) ....................................................................................17
5.1.4.4 Omni Mode Off (CC#124) ................................................................................17
5.1.4.5 Omni Mode On (CC#125) ................................................................................18
5.1.4.6 Mono Mode On (CC#126) ................................................................................18
5.1.4.7 Poly Mode On (CC#127) ..................................................................................18
6 Response to Optional Channel Messages ......................................................................................... 19
6.1.1 Control Change ............................................................................................................... 19

## Page 5

6.1.1.1 Hold1(Damper/Sustain) (CC#64) .....................................................................19
6.1.1.2 Soft Pedal (CC#67) ...........................................................................................19
6.1.2 Registered Controllers (or RPN when in MIDI 1.0 Protocol) ........................................ 19
6.1.2.1 RC 0x40 0x39 Vibrato / Chorus Type ..............................................................19
6.1.2.2 RC 0x40 0x3A Vibrato / Chorus Off/On ..........................................................20
6.1.2.3 RC 0x40 0x3B Percussion Off/On ....................................................................20
6.1.2.4 RC 0x40 0x3C Percussion Normal/Soft............................................................20
6.1.2.5 RC 0x40 0x3D Percussion Slow/Fast ...............................................................20
6.1.2.6 RC 0x40 0x3E Percussion Type 2nd/3rd ..........................................................20
6.1.2.7 RC 0x40 0x40 Amount of Key Click ................................................................20
6.1.2.8 RC 0x40 0x41 Amount of Crosstalk/Leakage ..................................................20
6.1.3 Poly Pressure .................................................................................................................. 20
6.1.4 Channel Pressure............................................................................................................. 20
6.1.5 Pitch Bend ....................................................................................................................... 20
Appendix A: Minimum Requirements ................................................................................................... 21
Figures
Figure 1 Bitmap Format ...........................................................................................................................14
Tables
Table 1 Version History ..............................................................................................................................3
Table 2 Words Relating to Specification Conformance ...........................................................................9
Table 3 Words Not Relating to Specification Conformance ....................................................................9
Table 4 Five Bytes Profile ID ....................................................................................................................13
Table 5 Bitmap of Optional Features Supported....................................................................................14
Table 6 Drawbar Settings .........................................................................................................................15
Table 7 Registered Controllers Used for Drawbars ...............................................................................16
Table 8 Response to CC#7 Volume ..........................................................................................................16
Table 9 Response to CC#11 Expression ..................................................................................................17
Table 10 Registered Controllers Used for Optional Parameters ..........................................................19
Table 11 MIDI Messages Summary .........................................................................................................21

## Page 6

1 References
1.1 Normative References
[MA01] Complete MIDI 1.0 Detailed Specification, Document Version 96.1, Third Edition, Association
of Musical Electronics Industry, http://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/
[MA02] M2-100-U MIDI 2.0 Specification Overview, Version 1.1, Association of Musical Electronics
Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA03] M2-101-UM MIDI Capability Inquiry (MIDI-CI), Version 1.2, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA04] M2-102-U Common Rules for MIDI-CI Profiles, Version 1.1, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA05] M2-103-UM Common Rules for Property Exchange, Version 1.1, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA06] M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol, Version 1.1,
Association of Musical Electronics Industry, http://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/
[MA07] M2-115-U MIDI 2.0 Bit Scaling and Resolution, Version 1.0.1, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA08] M2-122-UM MIDI-CI Profile Specification for Rotary Speaker Version 1.0, Association of
Musical Electronics Industry, http://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/

## Page 7

1.2 Terminology
1.2.1 Definitions
100-Cent Unit: A unit of measure for musical intervals, corresponding to one-twelfth of an octave measured
logarithmically. This term is preferred over “semitone” which may refer to various intervals.
AMEI: Association of Musical Electronics Industry. Authority for MIDI Specifications in Japan.
Device: An entity, whether hardware or software, which can send and/or receive MIDI messages.
Group: A field in the UMP Format addressing every UMP Format MIDI message (and every UMP comprising
any given MIDI message) to one of 16 Groups. See the M2-104-UM Universal MIDI Packet (UMP) Format and
MIDI 2.0 Protocol specification [MA06].
HCU: See 100-Cent-Unit.
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
specifications.
MIDI 2.0 Protocol: Version 2.0 of the MIDI Protocol. The native format for MIDI 2.0 Protocol messages is UMP
as defined in M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification [MA06].
MIDI-CI: MIDI Capability Inquiry [MA03], a specification published by The MIDI Association and AMEI.
MIDI-CI Device: A Device that has the ability to act as a Responder that replies to inquiries received from an
Initiator. The ability to act as an Initiator is recommended but optional.
MIDI-CI Transaction: A Transaction using a set of MIDI-CI messages that includes an Inquiry sent by an
Initiator and a reply to the Inquiry returned by the Responder. The Responder’s reply to an Inquiry might be a
single message that satisfies the Inquiry, a set of multiple messages that satisfy the Inquiry, or an error message.
See also Transaction.
MIDI Transport: A hardware or software MIDI connection used by a Device to transmit and/or receive MIDI
messages to and/or from another Device.
MMA: MIDI Manufacturers Association, a California nonprofit 501(c)6 trade organization, and the legal entity
name of the MIDI Association.
MUID (MIDI Unique Identifier): A 28-bit random number generated by a Device used to uniquely identify the
Device in MIDI-CI messages sent to or from that Device.

## Page 8

Profile: An MA/AMEI specification that includes a set of MIDI messages and defined responses to those
messages. A Profile is controlled by MIDI-CI Profile Negotiation Transactions. A Profile may have a defined
minimum set of mandatory messages and features, along with some optional or recommended messages and
features. See the MIDI-CI specification [MA03] and the Common Rules for MIDI-CI Profiles [MA04].
Protocol: There are two defined MIDI Protocols: the MIDI 1.0 Protocol and the MIDI 2.0 Protocol, each with a
data structure that defines the semantics for MIDI messages. See [MA01] and [MA06].
Responder: One of two MIDI-CI Devices with a bidirectional communication between them. The Responder is
the Device that receives an Inquiry message from an Initiator Device as part of a MIDI-CI Transaction and acts
based on negotiation messages managed by the Initiator Device. Also see Initiator.
Transaction: An exchange of MIDI messages between two MIDI Devices with a bidirectional connection. All the
MIDI messages in a single Transaction are associated and work together to accomplish one function. The simplest
Transaction generally consists of an inquiry sent by one MIDI Device and an associated reply returned by a
second MIDI Device. A Transaction may also consist of an inquiry from one MIDI Device and several associated
replies from a second MIDI Device. A Transaction may be a more complex set of message exchanges, started by
an initial inquiry from one MIDI Device and multiple, associated replies exchanged between the first MIDI
Device and a second MIDI Device. Also see MIDI-CI Transaction.
UMP: Universal MIDI Packet, see [MA06].
UMP Format: Data format for fields and messages in the Universal MIDI Packet, see [MA06].
UMP MIDI 1.0 Device: any Device that sends or receives MIDI 1.0 Protocol messages using the UMP [MA06].
Such Devices may use UMP Message Types that extend the functionality beyond Non-UMP MIDI 1.0 Systems.
Universal MIDI Packet (UMP): The Universal MIDI Packet is a data container which defines the data format for
all MIDI 1.0 Protocol messages and all MIDI 2.0 Protocol messages. UMP is intended to be universally
applicable, i.e., technically suitable for use in any transport where MA/AMEI elects to officially support UMP.
For detailed definition see M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol
specification [MA06].

## Page 9

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
must Statements of unavoidability Describes an action to be taken that, while not required (or at
least not directly required) by this specification, is
unavoidable.
Not used for statements of conformance requirement (see
‘shall’ above).
will Statements of fact Describes a condition that as a question of fact is necessarily
going to be true, or an action that as a question of fact is
necessarily going to occur, but not as a requirement (or at
least not as a direct requirement) of this specification.
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

## Page 10

1.3 Protocol and Data Format Conventions
1.3.1 MIDI 1.0 Protocol and MIDI 2.0 Protocol
This document describes the use of messages in the MIDI 2.0 Protocol. However, Devices which conform to the
Profiles in this specification may implement either the MIDI 2.0 Protocol or the MIDI 1.0 Protocol. For a
comparison of the 2 Protocols and for mechanisms to select a Protocol see the M2-104-UM Universal MIDI
Packet (UMP) Format and MIDI 2.0 Protocol specification [MA06].
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
Scaling methods are defined in the M2-115-UM MIDI 2.0 Bit Scaling and Resolution specification [MA07].

## Page 11

2 Introduction
2.1 Executive Summary
This MIDI-CI Profile specification defines a selected set of MIDI messages which are recommended to be used by
all drawbar organs to control the features which are common to most drawbar organs.
This specification defines Device requirements and MIDI implementation of conforming Devices.
2.2 Background
This specification relies on mechanisms defined by the MIDI-CI (Capabilities Inquiry) specification. MIDI-CI
allows Devices to communicate their capabilities to each other. Devices can use that capabilities information to
self-configure their MIDI connections and related settings. Profiles are a beneficial component in enabling
intelligent auto-configuration between two MIDI-CI Devices.
Profiles define specific implementations of a set of MIDI messages chosen to suit a particular instrument, Device
type, or to accomplish a particular task. Two Devices that conform to the same Profile will generally have greater
interoperability between them than Devices using MIDI without Profiles. Profiles increase interoperability and
ease of use while lowering the need for manual configuration of Devices by users.
This specification defines data for specific fields in several MIDI-CI Profile Configuration messages. The entire
message is not always shown in this specification. The format of the messages and further, critical information
required for implementing this Device Profile is found in the [MA03] MIDI Capability Inquiry (MIDI-CI) and
[MA04] Common Rules for MIDI-CI Profiles specifications.

## Page 12

3 Drawbar Organ Implementations
This specification is intended to define specific features and control messages for a musical instrument that is a
drawbar organ or a musical instrument that emulates the behavior of a single manual drawbar organ.
The basic model and functions are patterned after a Hammond* B3 organ, while many other variations of drawbar
organ can be represented by this Profile. Properties of this Profile are features that are commonly found on many
drawbar organ instruments or emulators from a wide range of manufacturers.
3.1 Sound Engine
The sound engine of a Device that implements the Drawbar Organ Profile shall provide the sound of 9 adjustable
drawbars per voice.
An original drawbar organ had full polyphony and developers should take into account the demands of having 9
adjustable drawbars per voice and typical playing style.
The Drawbar Organ Profile does not define a specific synthesis type for producing a drawbar organ sound. The
Drawbar Organ Profile does not define the tone quality or style of the sound. Various organ types with different
sounds may use the Drawbar Organ Profile.
3.1.1 Rotary Speaker Profile
The Drawbar Organ Profile recommends support for the Rotating Speaker Profile that is patterned after a Leslie*
rotating speaker (See [MA08] MIDI-CI Profile Specification for Rotary Speaker) if the Rotary Speaker function is
built into the Drawbar Organ Profile Device. It is usually most convenient to support the Rotating Speaker Profile.
*Note: Hammond and Leslie are trademarks of SUZUKI MUSICAL INST.MFG.CO., LTD. Used with permission.

## Page 13

4 MIDI-CI Functions
This section defines functions which operate on the Channel of the Drawbar Organ Profile.
4.1 MIDI-CI Profile Configuration
This section defines the response to Profile Configuration messages including the Drawbar Organ Profile
Identification.
MIDI-CI Profile Configuration Messages identify and control each Profile uniquely using several fields in MIDI-
CI Profile Configuration messages. The Profile identifiers for this Drawbar Organ Profile are as follows:
Table 4 Five Bytes Profile ID
Profile ID Byte 1 0x7E (Standard Defined Profile)
Profile ID Byte 2 0x20 (Drawbar Organ Profile Number MSB)
Profile ID Byte 3 0x01 (Drawbar Organ Profile Number LSB)
Profile ID Byte 4 0x01 (Drawbar Organ Profile Version)
Profile ID Byte 5 0xXX (Drawbar Organ Profile Level)
Drawbar Organ Profile Level:
• 0x00 Some implementation but does not comply with minimum requirements
• 0x01 Meets the minimum requirements
• 0x02 Implements some extended/optional features
• 0x03-0x7E Reserved
• 0x7F Highest level of Profile support (Same as 0x02 in this Profile)
4.2 Discovering Optional Features Supported: Profile Details Inquiry
The Initiator may discover which optional features of the Drawbar Organ Profile are supported using MIDI-CI
Profile Details Inquiry Transactions. See MIDI Capability Inquiry (MIDI-CI) [MA03], and the Common Rules for
Profiles [MA04].
4.2.1 Initiator Sends a MIDI-CI Profile Details Inquiry Message
The Initiator may ask the Responder for a bitmap report of the optional features supported by the Responder. This
inquiry is made using a Profile Details Inquiry message with the Inquiry Target set to 0x01 (Profile Optional
Features Supported).
4.2.2 Responder Sends a MIDI-CI Reply to Profile Details Inquiry Message
When a Responder receives a Profile Details Inquiry message with the Inquiry Target set to 0x01, the Responder
shall report a bitmap declaring the optional features supported by the Responder. This report is made using a
Reply to Profile Details Inquiry message.
Drawbar Organ Profiles Optional Features Supported
Target Data is 0x01 = Get Optional Features Supported. The Inquiry Target Data field is a 1-byte bitmap of
optional features. The bitmap may be expanded in future revisions of this specification.

## Page 14

Figure 1 Bitmap Format
Each bit represents whether the feature is supported or not.
Table 5 Bitmap of Optional Features Supported
Byte Bitmap
Data
Message
Supported
Description
Byte 1 D0 CC#67 Supports Soft Pedal = Volume Normal/Soft Tab
D1 RC 0x40 0x39
RC 0x40 0x3A
Supports both Vibrato/Chorus parameters
D2 RC 0x40 0x3B
RC 0x40 0x3C
RC 0x40 0x3D
RC 0x40 0x3E
Supports all four Percussion parameters
D3 RC 0x40 0x40 Amount of Key Click
D4 RC 0x40 0x41 Amount of Crosstalk/Leakage
D5-6 reserved Reserved for Future Expansion
D7 reserved 0 == status bit

## Page 15

5 Response to Required Channel Messages
A Device which conforms to the Drawbar Organ Profile shall implement the MIDI messages as defined in this
Section.
5.1.1 Note On / Note Off
The Device shall sound notes for the key range from at least Note Number 36 (0x24) through 96 (0x60).
MIDI Note Number 69 (0x45) sounds as A=440Hz on the 8’ drawbar as a default. This may optionally be changed
by user settings, MIDI Tuning Standard, Channel Tuning Registered Controller 0x01 and Registered Controller
0x02, or other tuning mechanisms.
The Device shall not respond to Velocity in Note On / Note Off messages as a default. This may be overridden by
user settings.
5.1.2 Registered Controllers
The Device shall respond to RPN / Registered Controllers as defined below.
Drawbars
The Device shall support nine drawbars as defined in the following table. The nine drawbars of each manual of the
drawbar organ are controlled by RC messages.
Table 6 Drawbar Settings
Setting Range Discrete Value
Off/In/0 0x00000000 – 0x1C71C71B 0x0E38E38E
1 0x1C71C71C– 0x38E38E37 0x2AAAAAAB
2 0x38E38E38– 0x55555554 0x471C71C7
3 0x55555555– 0x71C71C70 0x638E38E4
4 0x71C71C71– 0x8E38E38C 0x80000000
5 0x8E38E38D – 0xAAAAAAA9 0x9C71C71D
6 0xAAAAAAAA – 0xC71C71C5 0xB8E38E39
7 0xC71C71C6- 0xE38E38E1 0xD5555556
Full/Out/8 0xE38E38E2 – 0xFFFFFFFF 0xF1C71C72
Senders: In this Profile drawbars have nine selectable settings for each drawbar. When switching settings, the
Device should use the discrete value list above. Devices that have an ability to set the volume for each drawbar
smoothly over the whole range may send values that are between the discrete values defined for each setting.
Receivers: All Receives shall support the full ranges of values as above. The Receiver may support fully
continuous response or may implement 9 discrete settings in response to any value from within the 9 ranges.

## Page 16

Table 7 Registered Controllers Used for Drawbars
MIDI Message Parameter
RC 0x40 0x30 16’ Drawbar
RC 0x40 0x31 5-1/3’ Drawbar
RC 0x40 0x32 8’ Drawbar
RC 0x40 0x33 4’ Drawbar
RC 0x40 0x34 2-2/3’ Drawbar
RC 0x40 0x35 2’ Drawbar
RC 0x40 0x36 1-3/5’ Drawbar
RC 0x40 0x37 1-1/3’ Drawbar
RC 0x40 0x38 1’ Drawbar
Note: Implementation of a user interface is outside the scope of this Drawbar Organ Profile specification.
On traditional drawbar organs, the sound level increases from off to maximum as a drawbar is pulled
toward the player. But on a typical controller, a fader might respond in the opposite direction, increasing
from off to maximum as the fader is pushed away from the player. Or a drawbar control may be assigned
to a rotary knob. This specification allows any of these (and other) user interface implementations.
5.1.3 Control Change
The Device shall respond to Control Change messages as defined below.
5.1.3.1 Volume (CC#7)
A controller which is set by a main volume knob (or similar control mechanism). Regarding the curve of volume
change messages, the square of the value is proportional to the volume.
Table 8 Response to CC#7 Volume
CC#7 Amplitude
0xFFFFFFFF 0 dB
0xC1041041 -4.9 dB
0x80000000 -11.9 dB
0x40000000 -23.9 dB
0x20000000 -36.0 dB
0x00000000 -infinity
The formula used is: gain in dB = 40 * log10(CC#7/0xFFFFFFFF)

## Page 17

The resulting volume is, however, also dependent on Expression (CC#11).
5.1.3.2 Expression (CC#11)
A controller which is set by an expression pedal (or similar control mechanism). Regarding the curve of volume
change messages, the square of the value is proportional to the volume.
Table 9 Response to CC#11 Expression
CC#11 Amplitude
0xFFFFFFFF 0 dB
0xC1041041 -4.9 dB
0x80000000 -11.9 dB
0x40000000 -23.9 dB
0x20000000 -36.0 dB
0x00000000 -infinity
The formula used is: gain in dB = 40 * log10(CC#11/0xFFFFFFFF)
The resulting volume is, however, also dependent on Volume (CC#7).
Note: Some drawbar organs do not send the full range of Expression. Traditionally, a drawbar organ’s
expression pedal does not go all the way down to -infinity. Devices may choose the range of values sent
and the range of values recognized.
5.1.4 Channel Mode Messages
Devices running the Drawbar Organ Profile shall operate in Mode 3, Omni Off, Poly.
The following defines the response to Mode messages.
5.1.4.1 All Sound Off (CC#120)
Value: 0x00000000
When this message is received, all the Notes sounding shall be immediately released, and the sound is muted as
quickly as possible without producing a click or other audible noise.
5.1.4.2 Reset All Controllers (CC#121)
Default Value: 0x00000000
When value is 0x00000000, this message shall reset the status of Control Change messages (except as noted
below) to default values, Channel pressure to 0x00000000, and Pitch Bend to 0x80000000(center) on the specified
Channel.
Program Change, Bank Select (0/32), Channel Volume (7), Pan (10), and Expression (11) shall not be reset.
5.1.4.3 All Notes Off (CC#123)
This message shall turn off all Notes sounding on the drawbar organ.
5.1.4.4 Omni Mode Off (CC#124)
This message shall turn off all Notes sounding on the drawbar organ. Messages shall not change the mode.

## Page 18

5.1.4.5 Omni Mode On (CC#125)
This message shall turn off all Notes sounding on the drawbar organ. Messages shall not change the mode.
5.1.4.6 Mono Mode On (CC#126)
This message shall turn off all Notes sounding on the drawbar organ. Messages shall not change the mode.
5.1.4.7 Poly Mode On (CC#127)
This message shall turn off all Notes sounding on the drawbar organ and switch the operation to Mode 3 (Omni
Off, Poly).

## Page 19

6 Response to Optional Channel Messages
A Device which conforms to the Drawbar Organ Profile may implement the MIDI messages as defined in this
Section.
6.1.1 Control Change
The Device may optionally respond to Control Change messages as defined below.
6.1.1.1 Hold1(Damper/Sustain) (CC#64)
Value: 0x00000000-0x7FFFFFFF = Off, 0x80000000-0xFFFFFFFF = On
Default Value: 0x00000000
6.1.1.2 Soft Pedal (CC#67)
Value: 0x00000000-0x7FFFFFFF = Off, 0x80000000-0xFFFFFFFF = Soft
Default Value: 0x00000000
Soft Pedal controls a drawbar organ’s “Soft” tab/switch.
6.1.2 Registered Controllers (or RPN when in MIDI 1.0 Protocol)
Table 10 Registered Controllers Used for Optional Parameters
MIDI Message Parameter
RC 0x40 0x39 Vibrato / Chorus Type
RC 0x40 0x3A Vibrato / Chorus On / Off
RC 0x40 0x3B Percussion Off/On
RC 0x40 0x3C Percussion Normal/Soft
RC 0x40 0x3D Percussion Slow/Fast
RC 0x40 0x3E Percussion Type 2nd/3rd
RC 0x40 0x3F Reserved
RC 0x40 0x40 Amount of Key Click
RC 0x40 0x41 Amount of Crosstalk/Leakage
6.1.2.1 RC 0x40 0x39 Vibrato / Chorus Type
Value Range: 0x00000000 to 0x2AAAAAA9 = V1
Value Range: 0x2AAAAAAA to 0x55555554 = C1
Value Range: 0x55555555 to 0x7FFFFFFF = V2
Value Range: 0x80000000 to 0xAAAAAAA9 = C2

## Page 20

Value Range: 0xAAAAAAAA to 0xD5555554 = V3
Value Range: 0xD5555555 to 0xFFFFFFFF = C3
6.1.2.2 RC 0x40 0x3A Vibrato / Chorus Off/On
Value: 0x00000000-0x7FFFFFFF = Off, 0x80000000-0xFFFFFFFF = On
Default Value: 0x00000000
6.1.2.3 RC 0x40 0x3B Percussion Off/On
Value: 0x00000000-0x7FFFFFFF = Off, 0x80000000-0xFFFFFFFF = On
6.1.2.4 RC 0x40 0x3C Percussion Normal/Soft
Value: 0x00000000-0x7FFFFFFF = Normal, 0x80000000-0xFFFFFFFF = Soft
6.1.2.5 RC 0x40 0x3D Percussion Slow/Fast
Value: 0x00000000-0x7FFFFFFF = Slow, 0x80000000-0xFFFFFFFF = Fast
6.1.2.6 RC 0x40 0x3E Percussion Type 2nd/3rd
Value: 0x00000000-0x7FFFFFFF = 2nd Harmonic, 0x80000000-0xFFFFFFFF = 3rd Harmonic
6.1.2.7 RC 0x40 0x40 Amount of Key Click
Value Range: 0x00000000-0xFFFFFFFF = None to Full
Default Value: 0x80000000
This parameter value usually sets the amount of Key Click noise that occurs at a Note On. The Device is free to
decide if it wants to use the same parameter value to apply a relative amount of Key Click noise for Note Off
events. The Device may also use its own proprietary controller to set the amount of Key Click noise for a Note
Off.
6.1.2.8 RC 0x40 0x41 Amount of Crosstalk/Leakage
Value Range: 0x00000000-0xFFFFFFFF = None to Full
Default Value: 0x80000000
6.1.3 Poly Pressure
The Device should not respond to Poly Pressure by default. This may be overridden by user settings on the
Device.
6.1.4 Channel Pressure
The Device should not respond to Channel Pressure as a default. This may be overridden by user settings on the
Device.
6.1.5 Pitch Bend
Default Value: 0x80000000 (center)
Adjusts the Pitch up or down on the specified Channel. Default sensitivity (range) is +/- 2 HCU. 0x00000000
specifies maximum pitch bend down. 0xFFFFFFFF specifies maximum pitch bend up. Pitch Bend Sensitivity may
be adjusted using RC 0x00 00.

## Page 21

Appendix A: Minimum Requirements
Note: This section is informational only. For normative requirements, refer to Section 1 to 6 of this specification.
All Devices which have the Drawbar Organ Profile enabled implement at least the following features in the
manner defined by this Drawbar Organ Profile:
• Play Notes for Key Range from at least Note Number 36 (0x24) to 96 (0x60)
• MIDI Note Number 69 (0x45) sounds as A=440Hz on the 8’ Drawbar
• Other controllers listed as “required” in the following table:
Table 11 MIDI Messages Summary
MIDI Message Parameter Requirement
Note On/Off required
RC 0x40 0x30 16’ Drawbar required
RC 0x40 0x31 5-1/3’ Drawbar required
RC 0x40 0x32 8’ Drawbar required
RC 0x40 0x33 4’ Drawbar required
RC 0x40 0x34 2-2/3’ Drawbar required
RC 0x40 0x35 2’ Drawbar required
RC 0x40 0x36 1-3/5’ Drawbar required
RC 0x40 0x37 1-1/3’ Drawbar required
RC 0x40 0x38 1’ Drawbar required
CC#7 Volume required
CC#11 Expression Pedal required
CC#64 Sustain optional
CC#67 Soft optional
CC#120 All Sound Off required
CC#121 Reset All Controllers required
CC#122 All Notes Off required
Pitch Bend Pitch Bend optional
Profile Specific Data Discover Optional Features optional

## Page 22

http://www.amei.or.jp https://www.midi.org
