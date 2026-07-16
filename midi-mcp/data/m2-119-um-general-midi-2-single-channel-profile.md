---
title: General MIDI 2 Single Channel Profile
docId: M2-119-UM
version: 1.0.0
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-119-UM_v1-0-0_General-MIDI-2-Single-Channel-Profile.pdf
sourceType: online
pages: 12
sha256: 040a12006d102fa86b1a6b46c837cbc7820b18e5461248b437717753a33bee3c
extractedAt: 2026-07-16T12:54:04.449Z
summary: MIDI-CI Profile providing General MIDI 2 melodic/rhythm behavior on a single channel.
---
# General MIDI 2 Single Channel Profile

## Page 1

MIDI-CI Profile for General MIDI 2 Single Channel
GM2 Melody Channel
MIDI Association Document: M2-119-UM
Document Version 1.0.0
Draft Date 2023-11-14
Published 2024-01-24
Developed and Published By
The MIDI Association
and
Association of Musical Electronics Industry (AMEI)

## Page 2

PREFACE
MIDI Association Document M2-119-UM
MIDI-CI Profile for General MIDI 2 Single Channel
This specification defines a MIDI-CI Profile for implementing the functions of a
General MIDI 2 Melody Channel on a single MIDI Channel.
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
1.1 Normative References .................................................................................................................. 5
1.2 Terminology ................................................................................................................................. 6
1.2.1 Definitions ........................................................................................................................ 6
1.2.2 Reserved Words and Specification Conformance ............................................................ 8
2 Introduction .......................................................................................................................................... 9
2.1 Executive Summary ...................................................................................................................... 9
2.2 Background................................................................................................................................... 9
3 Device Requirements ......................................................................................................................... 10
3.1 Profile Requirements and Melody Channel Requirements......................................................... 10
3.1.1 Rhythm Channels Not Supported ................................................................................... 10
3.2 Profile Id ..................................................................................................................................... 10
3.3 MIDI Protocols and Data Formats .............................................................................................. 11
Tables
Table 1 Version History ..............................................................................................................................3
Table 3 Words Relating to Specification Conformance ...........................................................................8
Table 4 Words Not Relating to Specification Conformance ....................................................................8
Table 5 GM2 Single Channel Profile Id ..................................................................................................10

## Page 5

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
[MA07] General MIDI 2, RP-044, Version 1.2a, Association of Musical Electronics Industry,
http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA08] M2-118-UM MIDI-CI Profile for General MIDI (GM2 Function Block), Version 1.0,
Association of Musical Electronics Industry, http://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/

## Page 6

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
• Per-note Registered Controller (including Relative versions)
• Per Note Assignable Controller (including Relative versions)
• Per Note Pitch Bend
Device: An entity, whether hardware or software, which can send and/or receive MIDI messages.
Function Block: A single logical entity which describes the functional components available on a UMP Endpoint
of a Device, A Function Block operates on a set of one or more Groups.
General MIDI 2: A design and set of features for a Device as defined by the General MIDI 2 specification
[MA07].
GM2: General MIDI 2.
GM2 Single Channel Profile: The MIDI-CI Profile for General MIDI 2 Single Channel (this specification).
Group: A field in the UMP Format addressing some UMP Format MIDI messages (and some UMPs comprising
any given MIDI message) to one of 16 Groups. See the M2-104-UM Universal MIDI Packet (UMP) Format and
MIDI 2.0 Protocol specification [MA06].
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
MIDI Manufacturers Association: A California nonprofit 501(c)6 trade organization, and the legal entity name
of the MIDI Association.
MMA: See MIDI Manufacturers Association.

## Page 7

Profile: An MA/AMEI specification that includes a set of MIDI messages and defined responses to those
messages. A Profile is controlled by MIDI-CI Profile Negotiation Transactions. A Profile may have a defined
minimum set of mandatory messages and features, along with some optional or recommended messages and
features. See the MIDI-CI specification [MA03] and the Common Rules for MIDI-CI Profiles [MA04].
Protocol: There are two defined MIDI Protocols: the MIDI 1.0 Protocol and the MIDI 2.0 Protocol, each with a
data structure that defines the semantics for MIDI messages. See the M2-104-UM Universal MIDI Packet (UMP)
Format and MIDI 2.0 Protocol specification [MA06].
Receiver: A MIDI Device which has a MIDI Transport connected to its MIDI In.
RPN: Registered Parameter Number, a type of controller message defined in the MIDI 1.0 Protocol. RPNs have
equivalent messages in the MIDI 2.0 Protocol, called Registered Controllers (see [MA06]).
Sender: A MIDI Device which transmits MIDI messages to a MIDI Transport which is connected to its MIDI Out
or to its MIDI Thru port.
UMP: Universal MIDI Packet.
UMP Endpoint: A MIDI Endpoint which uses the UMP Format.
UMP Format: Data format for fields and messages in the Universal MIDI Packet.
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
General MIDI System Level 1 and General MIDI 2 specifications were written many years before the concept of
MIDI Profiles enabled by MIDI-CI. The original specifications require support on all 16 MIDI channels. This
document defines how to use MIDI-CI Profile Configuration Messages to implement the functions of a General
MIDI 2 Melody Channel on a single channel.
This specification only defines a MIDI-CI Profile for a single Melody Channel. A separate specification, the
MIDI-CI Profile for General MIDI 2, defines a Profile which implements the full set of 16 Channels or on
multiple Groups of a Function Block.
2.2 Background
The General MIDI 2 specification [MA07] defines the fundamental device design and minimum requirements of a
GM2 compatible Device using all 16 MIDI Channels of a MIDI 1.0 connection. GM2 defines two MIDI Channel
types: Melody Channels and Rhythm Channels.
This MIDI-CI Profile specification defines how a Device uses all the functions of GM2 Melody Channel on a per
Channel basis. Devices do not need to implement GM2 on 16 Channels to take advantage of GM2 features for a
single Channel.
For example, a Device might have GM2 capabilities but does not want to dedicate 16 Channels to GM2. A
synthesizer might provide most Channels for users’ own sounds while using GM2 sounds and functionality
on several other Channels.
This Profile specification relies on mechanisms defined by the MIDI-CI (Capabilities Inquiry) specification.
MIDI-CI allows devices to communicate their capabilities to each other. Devices can use that capabilities
information to self-configure their MIDI connections and related settings. Profiles are a beneficial component in
enabling intelligent auto-configuration between 2 devices.
Profiles define specific implementations of a set of MIDI messages chosen to suit a particular instrument, device
type, or to accomplish a particular task. Two devices that conform to the same Profile will have generally have
greater interoperability between them than devices using MIDI without Profiles. Profiles increase interoperability
and ease of use while lowering the need for manual configuration of devices by users.
Further information required for implementing this device Profile is found in the Common Rules for MIDI-CI
Profiles specification.

## Page 10

3 Device Requirements
The requirements for a Melody Channel are defined by the General MIDI 2 specification. This MIDI-CI Profile
specification makes no changes to those requirements other than adding implementation of MIDI-CI Profile
Configuration messages and enabling support on a single Channel only.
All Devices which support this MIDI-CI Profile for General MIDI 2 Single Channel shall comply with all of the
required features of a Melody Channel as defined as "required" in the General MIDI 2 (GM2) specification
[MA07]. These include but are not limited to:
• Bank and Program Change access to the GM2 Sound Set (does not include GM2 Percussion Sound Sets)
• Response to Channel Tuning
• Response to certain Mode messages
• Response to Notes
• Response to certain Controller Messages
3.1 Profile Requirements and Melody Channel Requirements
The requirements for a Melody Channel are defined by the General MIDI 2 specification. This MIDI-CI Profile
specification makes no changes to those requirements other than adding implementation of MIDI-CI Profile
Configuration messages and enabling support on a single Channel.
All Devices which support this MIDI-CI Profile for General MIDI 2 Single Channel shall comply with all of the
features of a Melody Channel which are defined as "required" in the General MIDI 2 (GM2) specification
[MA07]. These include but are not limited to:
• Bank and Program Change access to the GM2 Sound Set (does not include GM2 Percussion Sound Sets)
• Response to Channel Tuning
• Response to certain Mode messages
• Response to Notes
• Response to certain Controller Messages
3.1.1 Rhythm Channels Not Supported
The General MIDI 2 specification [MA07] defines how a single Channel may be changed between a Melody
Channel and Rhythm Channel by sending Bank Select and Program Change messages. This defined mechanism to
switch to a Rhythm Channel is optional in GM2.
The MIDI-CI Profile for General MIDI 2 Single Channel only requires implementation of the functions necessary
to implement a Melody Channel without requiring the optional mechanism to switch to a Rhythm Channel.
Support for the Rhythm Channel functions and sounds in the GM2 Percussion Sound Set in Bank MSB 0x78 is
outside the scope of this Profile.
3.2 Profile Id
MIDI-CI Profile Configuration Messages identify and control each Profile uniquely by the use of several fields in
the Profile Configuration message. The Profile Identifiers for this MIDI-CI Profile for General MIDI 2 Single
Channel are as follows:
Table 4 GM2 Single Channel Profile Id
5 bytes Profile ID
Byte 1 0x7E (Standard Defined Profile)
Byte 2 0x20 (GM2 Single Channel Profile Bank)
Byte 3 0x02 (GM2 Single Channel Profile Number)

## Page 11

Byte 4 0x01 (GM2 Single Channel Profile Version)
Byte 5 0x01 (GM2 Single Channel Profile Level)
3.3 MIDI Protocols and Data Formats
The MIDI-CI Profile for General MIDI 2 Single Channel may be implemented using messages in the following
protocols and data formats:
• MIDI 1.0 Protocol in MIDI 1.0 data format
• MIDI 1.0 Protocol in Universal MIDI Packet data format
• MIDI 2.0 Protocol in Universal MIDI Packet data format
The choice of Protocol which will be used by Sender and Receiver is not defined by this specification. See the
Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol specification [MA06].

## Page 12

http://www.amei.or.jp https://www.midi.org
