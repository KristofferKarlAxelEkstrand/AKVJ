---
title: Rotary Speaker Profile
docId: M2-122-UM
version: 1.0.2
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-122-UM_v1-0-2_Rotary-Speaker-Profile.pdf
sourceType: online
pages: 13
sha256: f0ef383dc28e3bdb039aa212d0c2bc4af4c19c05149d4d84204017086df6bbcd
extractedAt: 2026-07-16T12:54:05.004Z
summary: MIDI-CI effect Profile standardizing rotary speaker control mappings.
---
# Rotary Speaker Profile

## Page 1

MIDI-CI Profile for Rotary Speaker
MIDI Association Document: M2-122-UM
Document Version 1.0.2
Draft Date 2024-01-23
Published 2024-01-24
Developed and Published By
The MIDI Association
and
Association of Musical Electronics Industry (AMEI)

## Page 2

PREFACE
MIDI Association Document M2-122-UM
MIDI-CI Profile for Rotary Speaker
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
This MIDI-CI Profile Specification for Rotary Speaker defines a set of messages to
control parameters of many Devices with Rotary Speaker capabilities.
For details of MIDI-CI Profile Negotiation mechanisms, please read the MIDI-CI and
Common Rules for MIDI-CI Profiles specifications.
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
Tables ........................................................................................................................................................... 4
1 References ............................................................................................................................................. 5
1.1 Normative References .................................................................................................................. 5
1.2 Terminology ................................................................................................................................. 6
1.2.1 Definitions ........................................................................................................................ 6
1.2.2 Reserved Words and Specification Conformance ............................................................ 8
1.3 Protocol and Data Format Conventions ........................................................................................ 9
1.3.1 MIDI 1.0 Protocol and MIDI 2.0 Protocol ....................................................................... 9
1.3.2 Registered Controllers (RCs) and Registered Parameter Numbers (RPNs) ..................... 9
1.3.3 Resolution and Bit Scaling ............................................................................................... 9
2 Introduction ........................................................................................................................................ 10
2.1 Executive Summary .................................................................................................................... 10
2.2 Background................................................................................................................................. 10
3 Protocol and Data Format Conventions ............................................... Error! Bookmark not defined.
3.1 MIDI 1.0 Protocol and MIDI 2.0 Protocol .................................. Error! Bookmark not defined.
3.1.1 Registered Controllers (RCs) and Registered Parameter Numbers (RPNs) ............ Error!
Bookmark not defined.
3.2 Resolution and Bit Scaling .......................................................... Error! Bookmark not defined.
4 Device Requirements ......................................................................................................................... 11
4.1 MIDI-CI Profile Configuration................................................................................................... 11
4.2 Response to Channel Messages .................................................................................................. 11
4.2.1 Required Registered Controllers ..................................................................................... 11
4.2.2 Optional Registered Controllers ..................................................................................... 12
4.2.3 Mode Messages............................................................................................................... 12
4.2.3.1 Reset All Controllers (CC#121) ........................................................................12
Tables
Table 1 Version History ..............................................................................................................................3
Table 2 Words Relating to Specification Conformance ...........................................................................8
Table 3 Words Not Relating to Specification Conformance ....................................................................8
Table 5 Optional Registered Controllers.................................................................................................11
Table 6 Optional Registered Controllers.................................................................................................12

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
[MA07] M2-115-U MIDI 2.0 Bit Scaling and Resolution, Version 1.0.1, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA08] M2-121-UM MIDI-CI Profile for Drawbar Organs, Version 1.0, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/

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
Device ID: A one-byte field in Universal System Exclusive messages, as defined in the MIDI 1.0 Specification
[MA01], to indicate which device in the system is supposed to respond. The more specific application of Device
ID in MIDI-CI messages is defined in the MIDI Capability Inquiry specification [MA03]. The use of “Device” in
this context is not the same as a Device as defined above.
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
MMA: See MIDI Manufacturers Association.
MUID (MIDI Unique Identifier): A 28-bit random number generated by a Device used to uniquely identify the
Device in MIDI-CI messages sent to or from that Device.
Profile: An MA/AMEI specification that includes a set of MIDI messages and defined responses to those
messages. A Profile is controlled by MIDI-CI Profile Negotiation Transactions. A Profile may have a defined

## Page 7

minimum set of mandatory messages and features, along with some optional or recommended messages and
features. See the MIDI-CI specification [MA03] and the Common Rules for MIDI-CI Profiles [MA04].
Protocol: There are two defined MIDI Protocols: the MIDI 1.0 Protocol and the MIDI 2.0 Protocol, each with a
data structure that defines the semantics for MIDI messages. See the M2-104-UM Universal MIDI Packet (UMP)
Format and MIDI 2.0 Protocol specification [MA06].
RPN: Registered Parameter Number, a type of controller message defined in the MIDI 1.0 Protocol. RPNs have
equivalent messages in the MIDI 2.0 Protocol, called Registered Controllers (see [MA06]).
UMP: Universal MIDI Packet.
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

## Page 10

2 Introduction
2.1 Executive Summary
Rotary Speaker Profile Specification defines a common set of basic features and MIDI messages to control a
rotary speaker. The typical model is a rotating speaker cabinet with a horn and woofer that rotate at different
speeds. The Device that implements the specification might be a rotating speaker or an effects unit that emulates
the sound of a rotating speaker. The goal of the specification is to encourage implementation of a chosen set of
MIDI messages for control for the parameters that are most common to all such Devices.
2.2 Background
This Rotary Speaker Profile Specification defines Device requirements and MIDI implementation of a conforming
Device.
This Profile specification relies on mechanisms defined by the MIDI-CI (Capabilities Inquiry) specification.
MIDI-CI allows Devices to communicate their capabilities to each other. Devices can use that capabilities
information to self-configure their MIDI connections and related settings. Profiles are a beneficial component in
enabling intelligent auto-configuration between 2 Devices.
Profiles define specific implementations of a set of MIDI messages chosen to suit a particular instrument, Device
type, or to accomplish a particular task. Two Devices that conform to the same Profile will generally have greater
interoperability between them than Devices using MIDI without Profiles. Profiles increase interoperability and
ease of use while lowering the need for manual configuration of Devices by users.
Further information required for implementing this Device Profile is found in the Common Rules for MIDI
Profiles specification [MA04].

## Page 11

3 Device Requirements
This section outlines basic Device design or functional goals of a Device that conforms to the Rotary Speaker
Profile. The basic model and functionality is patterned after a Leslie* rotating speaker. Such a rotating speaker is
most typically used with Hammond B3* organ, which is the pattern or model for the closely related Drawbar
Organ Profile [MA08]. Additional properties of the Profile are features that are commonly found on many other
rotating speakers or emulators from a wide range of manufacturers. The Rotary Speaker Profile Device is typically
one of 3 types of a Device:
• A speaker cabinet with a horn and woofer that rotate at different speeds.
• An effect device or plugin designed to emulate a rotating speaker.
• The effects section of an instrument, such as an organ or synthesizer, is designed to emulate a rotating
speaker.
Selection of Fast and Slow rotation is set by a Registered Controller. Control of other optional features are also
defined.
* Hammond and Leslie are trademarks of SUZUKI MUSICAL INST.MFG.CO.,LTD.
3.1 MIDI-CI Profile Configuration
MIDI-CI Profile Configuration Messages identify and control each Profile uniquely using several fields in the
Profile Configuration message. The Profile identifiers for this Rotary Speaker Profile are as follows:
Table 4 Five Bytes Profile ID
Profile ID Byte 1 0x7E (Standard Defined Profile)
Profile ID Byte 2 0x22 (Rotary Speaker Profile Number MSB)
Profile ID Byte 3 0x00 (Rotary Speaker Profile Number LSB)
Profile ID Byte 4 0x01 (Rotary Speaker Profile Version)
Profile ID Byte 5 0x01 (Rotary Speaker Profile Level)
3.2 Response to Channel Messages
3.2.1 Required Registered Controllers
A Device that conforms to the Rotary Speaker Profile shall respond to Registered Controllers as defined below.
Table 5 Optional Registered Controllers
Registered
Controller
Value Range Description Default Value
0x60 0x20 0x00000000-0x7FFFFFFF = Slow,
0x80000000-0xFFFFFFFF = Fast
Rotary Speed (Slow/Fast)
Slow (Traditionally labeled Chorale)
Fast (Traditionally labeled Tremolo)
0x00000000
Note: The Device may also respond to Rotary Speed Registered Controller as a continuous controller to control
a variable speed from slow to fast. Therefore, controllers with a 2-position switch for this Registered Controller
should send values of 0x00000000(Slow) and 0xFFFFFFFF (Fast).

## Page 12

3.2.2 Optional Registered Controllers
The Device may optionally respond to any of the Registered Controllers as defined below.
Table 6 Optional Registered Controllers
Registered
Controller
Value Range Description Default Value
0x60 0x21 0x00000000-0x7FFFFFFF = Off,
0x80000000-0xFFFFFFFF = On
Rotary Effect 0xFFFFFFFF
0x60 0x22 0x00000000-0x7FFFFFFF = Rotate,
0x80000000-0xFFFFFFFF = Stop
Rotary Brake 0x00000000
0x60 0x23 0x00000000-0xFFFFFFFF (Slowest to
Fastest)
Horn Slow Speed 0x80000000
0x60 0x24 0x00000000-0xFFFFFFFF (Slowest to
Fastest)
Horn Fast Speed 0x80000000
0x60 0x25 0x00000000-0xFFFFFFFF (Slowest to
Fastest)
Woofer Slow
Speed
0x80000000
0x60 0x26 0x00000000-0xFFFFFFFF (Slowest to
Fastest)
Woofer Fast
Speed
0x80000000
0x60 0x27 0x00000000-0xFFFFFFFF (Slowest to
Fastest)
Horn Accelerate
Time
0x80000000
0x60 0x28 0x00000000-0xFFFFFFFF (Slowest to
Fastest)
Horn Decelerate
Time
0x80000000
0x60 0x29 0x00000000-0xFFFFFFFF(Slowest to
Fastest)
Woofer
Accelerate Time
0x80000000
0x60 0x2A 0x00000000-0xFFFFFFFF (Slowest to
Fastest)
Woofer
Decelerate Time
0x80000000
0x60 0x2B 0x00000000-0xFFFFFFFF (Off to Full) Horn Level 0xC8000000
0x60 0x2C 0x00000000-0xFFFFFFFF (Off to Full) Woofer Level 0xC8000000
0x60 0x2D 0x00000000-0xFFFFFFFF (Off to Full) Rotary Overdrive
Amount
0x00000000
3.2.3 Mode Messages
3.2.3.1 Reset All Controllers (CC#121)
Default Value: 0x00000000
When a Device receives a Reset All Controllers message (cc#121) it shall reset all of the parameters that the
Device supports to the default values as defined in Section 3.2.1 and 3.2.2.

## Page 13

http://www.amei.or.jp https://www.midi.org
