---
title: General MIDI 2 Function Block Profile
docId: M2-118-UM
version: 1.0.0
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-118-UM_v1-0-0_General-MIDI-2-Function-Block-Profile.pdf
sourceType: online
pages: 12
sha256: e9f7aa65d1857c73ec32247ba0b8fbdb2d8e845cd6bf1206de17ad95235c19d2
extractedAt: 2026-07-16T12:54:04.351Z
summary: MIDI-CI Profile providing General MIDI 2 behavior for an entire Function Block.
---
# General MIDI 2 Function Block Profile

## Page 1

MIDI-CI Profile for General MIDI 2
GM2 Function Block
MIDI Association Document: M2-118-UM
Document Version 1.0.0
Draft Date 2023-11-14
Published 2024-01-24
Developed and Published By
The MIDI Association
and
Association of Musical Electronics Industry (AMEI)

## Page 2

PREFACE
MIDI Association Document M2-118-UM
MIDI-CI Profile for General MIDI 2
This document defines how to use General MIDI 2 as a MIDI-CI Profile, defining
how all the capabilities of General MIDI 2 can be enabled using MIDI-CI Profile
Configuration messages. MIDI-CI's bidirectional mechanisms enable a more reliable
and predictable result from the connection between two devices than possible with the
original General MIDI 2 specification. A Sender can know that a Receiver can
properly interpret MIDI messages intended for a General MIDI 2 device.
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
2024-01-24 1.0 Initial release

## Page 4

Contents
Version History ........................................................................................................................................... 3
Contents ....................................................................................................................................................... 4
Tables ........................................................................................................................................................... 4
1 References ............................................................................................................................................. 5
1.1.1 Normative References....................................................................................................... 5
1.2 Terminology ................................................................................................................................. 6
1.2.1 Definitions ........................................................................................................................ 6
1.2.2 Reserved Words and Specification Conformance ............................................................ 8
2 Introduction .......................................................................................................................................... 9
2.1 Executive Summary ...................................................................................................................... 9
2.2 Background................................................................................................................................... 9
3 Device Requirements ......................................................................................................................... 10
3.1 General MIDI 2 .......................................................................................................................... 10
3.2 MIDI-CI Profile Configuration................................................................................................... 10
3.2.1 Original GM System On/Off Mechanisms ..................................................................... 10
3.3 Channels, Groups, and Function Blocks..................................................................................... 10
3.4 Profile Id ..................................................................................................................................... 10
3.5 MIDI Protocols and Data Formats .............................................................................................. 11
Tables
Table 1 Version History ..............................................................................................................................3
Table 3 Words Relating to Specification Conformance ...........................................................................8
Table 4 Words Not Relating to Specification Conformance ....................................................................8
Table 5 GM2 Profile Id .............................................................................................................................11

## Page 5

1 References
1.1.1 Normative References
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
[MA07] General MIDI 2, RP-24, Version 1.2a, Association of Musical Electronics Industry,
http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/

## Page 6

1.2 Terminology
1.2.1 Definitions
AMEI: Association of Musical Electronics Industry. Authority for MIDI Specifications in Japan.
Device: An entity, whether hardware or software, which can send and/or receive MIDI messages.
Device ID: A one-byte field in Universal System Exclusive messages, as defined in the MIDI 1.0 Specification
[MA01], to indicate which device in the system is supposed to respond. The more specific application of Device
ID in MIDI-CI messages is defined in the MIDI Capability Inquiry specification [MA03]. The use of “Device” in
this context is not the same as a Device as defined above.
Function Block: A single logical entity which describes the functional components available on a UMP Endpoint
of a Device, A Function Block operates on a set of one or more Groups.
General MIDI 2: A design and set of features for a Device as defined by the General MIDI 2 specification
[MA07].
GM2: General MIDI 2.
GM2 Profile: The MIDI-CI Profile for General MIDI 2 (this specification).
Group: A field in the UMP Format addressing some UMP Format MIDI messages (and some UMPs comprising
any given MIDI message) to one of 16 Groups. See the M2-104-UM Universal MIDI Packet (UMP) Format and
MIDI 2.0 Protocol specification [MA06].
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
MIDI Manufacturers Association: A California nonprofit 501(c)6 trade organization, and the legal entity name
of the MIDI Association.
MIDI Transport: A hardware or software MIDI connection used by a Device to transmit and/or receive MIDI
messages to and/or from another Device.
MMA: See MIDI Manufacturers Association.
Profile: An MA/AMEI specification that includes a set of MIDI messages and defined responses to those
messages. A Profile is controlled by MIDI-CI Profile Negotiation Transactions. A Profile may have a defined
minimum set of mandatory messages and features, along with some optional or recommended messages and
features. See the MIDI-CI specification [MA03] and the Common Rules for MIDI-CI Profiles [MA04].
Protocol: There are two defined MIDI Protocols: the MIDI 1.0 Protocol and the MIDI 2.0 Protocol, each with a
data structure that defines the semantics for MIDI messages. See the M2-104-UM Universal MIDI Packet (UMP)
Format and MIDI 2.0 Protocol specification [MA06].

## Page 7

Receiver: A MIDI Device which has a MIDI Transport connected to its MIDI In.
Sender: A MIDI Device which transmits MIDI messages to a MIDI Transport which is connected to its MIDI Out
or to its MIDI Thru port.
UMP: Universal MIDI Packet.
UMP Endpoint: A MIDI Endpoint which uses the UMP Format.
UMP Format: Data format for fields and messages in the Universal MIDI Packet.
UMP MIDI 1.0 Device: any Device that sends or receives MIDI 1.0 Protocol messages using the UMP Format.
Such Devices may use UMP Message Types that extend the functionality beyond Non-UMP MIDI 1.0 Systems.
Universal MIDI Packet (UMP): The Universal MIDI Packet is a data container which defines the data format for
all MIDI 1.0 Protocol messages and all MIDI 2.0 Protocol messages. UMP is intended to be universally
applicable, i.e., technically suitable for use in any transport where MA/AMEI elects to officially support UMP.
For detailed definition see M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol
specification [MA06].

## Page 8

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

## Page 9

2 Introduction
2.1 Executive Summary
The General MIDI specifications were written many years before MIDI 2.0 and the concept of MIDI Profiles
enabled by MIDI-Capability Inquiry (MIDI-CI). General MIDI describes a minimum number of voices, sound
locations, drum note mapping, octave registration, pitch bend range, and controller usage, thereby defining a given
set of capabilities to expect in a given synthesizer which claims General MIDI compatibility.
This document defines how to use General MIDI 2 as a MIDI-CI Profile.
This new definition allows all the capabilities of General MIDI 2 devices to be enabled or disabled using MIDI-CI
Profile Configuration messages. The MIDI-CI Profile for General MIDI 2 defines bidirectional mechanisms for
devices to discover whether General MIDI 2 functionality is available on a Receiver, enabling a more reliable and
predictable result from the connection between two devices.
2.2 Background
This General MIDI 2 Profile specification defines certain device requirements and MIDI implementation of a
conforming device.
This Profile specification relies on mechanisms defined by the MIDI Capability Inquiry (MIDI-CI) specification
[MA03]. MIDI-CI allows devices to communicate their capabilities to each other. Devices can use that
capabilities information to self-configure their MIDI connections and related settings. Profiles are a beneficial
component in enabling intelligent auto-configuration between 2 devices.
Profiles define specific implementations of a set of MIDI messages chosen to suit a particular instrument, device
type, or to accomplish a particular task. Two devices that conform to the same Profile will generally have greater
interoperability between them than devices using MIDI without Profiles. Profiles increase interoperability and
ease of use while lowering the need for manual configuration of devices by users.
Further information required for implementing this device Profile is found in the Common Rules for MIDI-CI
Profiles specification [MA04].

## Page 10

3 Device Requirements
3.1 General MIDI 2
The General MIDI 2 specification [MA07] defines the fundamental device design and minimum requirements of a
GM2 compatible Device. This specification makes no changes to those requirements other than adding
implementation of MIDI-CI Profile Configuration messages.
All Devices which support the MIDI-CI Profile for General MIDI 2 shall implement the minimum requirements
which are defined by the General MIDI 2 specification.
3.2 MIDI-CI Profile Configuration
All Devices which support the MIDI-CI Profile for General MIDI 2 shall respond to MIDI-CI Profile
Configuration messages to enable or disable GM2 functionality.
3.2.1 Original GM System On/Off Mechanisms
MIDI-CI Profile Configuration mechanisms are an improvement over the original GM2 mechanisms for turning
on/off GM functionality. However, some Devices may continue to also use the original GM2 mechanisms for
compatibility with older devices that do not implement MIDI-CI.
Devices which support the MIDI-CI Profile for General MIDI 2 may also respond to the original GM1 System
On, GM2 System On, and GM System Off messages (see [MA07]).
• If a Device which supports the MIDI-CI Profile for General MIDI 2 turns on GM functionality in
response to receiving a GM1 System On or GM2 System On, then the Device shall send a MIDI-CI
Profile Enabled message.
• If a Device which supports the MIDI-CI Profile for General MIDI 2 turns off GM functionality in
response to receiving a GM System Off, then the Device shall send a MIDI-CI Profile Disabled message.
3.3 Channels, Groups, and Function Blocks
The MIDI-CI Profile for General MIDI 2 is a Function Block Profile (see the Common Rules for Profiles
[MA04]). The Device ID: Source or Destination field in all MIDI-CI Profile Configuration messages for this GM2
Profile shall be set to 0x7F (Function Block).
The GM2 Profile supports 16 Channels on a Device connected by a MIDI 1.0 transport. On a MIDI 2.0 transport
using UMP Format, the Profile supports any multiple of 16 up to 256 Channels. When using the UMP Format, the
number of Channels which will be used when the GM2 Profile is enabled is determined by the Function Block
design of the Receiver. The Sender may discover the number of Channels in the Receiver's Function Block(s) by
mechanisms defined in the Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification [MA06].
When the Function Block spans 2 or more Groups, the rules of Channel usage from General MIDI 2 shall apply
individually to each Group.
For example, if the Profile is operating on Groups 7 and 8, Channel 10 of both Groups defaults to a Rhythm
Channel and all other Channels default to a Melody Channel. See the General MIDI 2 specification [MA07]
for rules of implementation for each set of 16 Channels (each Group).
As defined in the Common Rules for Profiles, if no Function Blocks are declared by the Receiver, then the Profile
will operate on a single UMP Group (with 16 Channels) or on 16 Channels of a MIDI 1.0 connection.
3.4 Profile Id
MIDI-CI Profile Configuration Messages identify and control each Profile uniquely using several fields in the
Profile Configuration message. The Profile Identifiers for this General MIDI Profile are as follows:

## Page 11

Table 4 GM2 Profile Id
5 bytes Profile ID
Byte 1 0x7E (Standard Defined Profile)
Byte 2 0x00 (General MIDI 2 Profile Bank)
Byte 3 0x00 (General MIDI 2 Profile Number)
Byte 4 0x01 (General MIDI 2 Profile Version)
Byte 5 0x01 (General MIDI 2 Profile Level)
3.5 MIDI Protocols and Data Formats
The MIDI-CI Profile for General MIDI 2 may be implemented using messages in the following protocols and data
formats:
• MIDI 1.0 Protocol in MIDI 1.0 data format
• MIDI 1.0 Protocol in Universal MIDI Packet data format
• MIDI 2.0 Protocol in Universal MIDI Packet data format
The choice of Protocol which will be used by Sender and Receiver is not defined by this specification. See the
Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification [MA06].

## Page 12

http://www.amei.or.jp https://www.midi.org
