---
title: Note-On Orchestral Articulation Profile
docId: M2-123-UM
version: 1.0
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-123-UM_v1-0_Note-On_Orchestral_Articulation_Profile.pdf
sourceType: online
pages: 48
sha256: 1306d4f2529f29c79c8c069f22111197884832354f81acf695922139a05cb37f
extractedAt: 2026-07-16T12:54:05.351Z
summary: MIDI-CI Profile using MIDI 2.0 Note On attribute data for orchestral articulations.
---
# Note-On Orchestral Articulation Profile

## Page 1

MIDI-CI Profile for Note On Selection of
Orchestral Articulation
Using MIDI 2.0 Protocol
MIDI Association Document: M2-123-UM
Document Version 1.0
Draft Date 2024-03-28
Published 2024-04-05
Developed and Published By
The MIDI Association
and
Association of Musical Electronics Industry (AMEI)

## Page 2

PREFACE
MIDI Association Document M2-123-UM
MIDI-CI Profile for Note On Selection of Orchestral Articulation
The MIDI-CI specification and the Common Rules for MIDI-CI Profiles define how
Devices with similar applications or of a similar Device type can negotiate to use a
common set of MIDI messages, called a MIDI-CI Profile, or simply a Profile.
Devices which implement a Profile have a high level of interoperability with each
other. Profiles are a beneficial component in enabling intelligent auto-configuration.
A Profile is a defined set of rules for how a MIDI receiver Device implementing the
Profile shall respond to a chosen set of MIDI messages, to achieve a particular
purpose or to suit a particular application.
This Profile defines how articulation information is attached to notes. This is
primarily achieved by defining the use of fields which are available in MIDI 2.0 Note
On messages. Further details of articulation are defined using fields in MIDI 2.0 Note
Off messages, one Registered Controller, and one Registered Per-Note Controller.
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
2024-04-05 1.0 Initial release

## Page 4

Contents
Version History ........................................................................................................................................... 3
DRAFT Document Change History ............................................................. Error! Bookmark not defined.
Contents ....................................................................................................................................................... 4
Figures ......................................................................................................................................................... 6
Tables ........................................................................................................................................................... 6
1.1 References .................................................................................................................................... 7
1.1.1 Normative References....................................................................................................... 7
1.1.2 Informative References ..................................................................................................... 7
1.2 Terminology ................................................................................................................................. 8
1.2.1 Definitions ........................................................................................................................ 8
1.2.2 Reserved Words and Specification Conformance .......................................................... 10
2 Introduction ........................................................................................................................................ 11
2.1 Executive Summary .................................................................................................................... 11
2.2 Goals ........................................................................................................................................... 11
2.3 Design Overview ........................................................................................................................ 12
2.4 Scope .......................................................................................................................................... 12
3 MIDI-CI Profile for Note On Selection of Orchestral Articulation .............................................. 13
3.1 Single Channel Profile ................................................................................................................ 13
3.2 Profile Id ..................................................................................................................................... 13
3.2.1 Version ............................................................................................................................ 13
3.2.2 Level ............................................................................................................................... 13
4 Note On With Articulation ................................................................................................................ 14
4.1 Note On Message Format ........................................................................................................... 14
Attribute Type – Classifications of Articulations ............................................................14
Subclass 14
Variation ..........................................................................................................................14
Direction ..........................................................................................................................14
Reset Round Robin ..........................................................................................................14
String Assignment............................................................................................................15
4.2 Receiver Response to Note On ................................................................................................... 15
5 Note On Classifications and Subclasses ........................................................................................... 16
5.1 Classifications – Set by Attribute Type ...................................................................................... 16
5.2 Subclasses and Articulations Within Each Classification .......................................................... 16
5.2.1 Subclasses/Articulations in Classification 0x10: Core Sounds – Sustains and Strikes... 17
5.2.2 Subclasses/Articulations in Classification 0x11: Staccatos and Shorts .......................... 19
5.2.3 Subclasses/Articulations in Classification 0x12 Same Note Trills/Repeats ................... 20
5.2.4 Subclasses/Articulations in Classification 0x13 Intervallic Trills .................................. 21
5.2.5 Subclasses/Articulations in Classification 0x14 Additional Colors – Sustained ............ 22
5.2.6 Subclasses/Articulations in Classification 0x15 Pitch and Dynamic Gestures ............... 23
5.2.7 Subclasses/Articulations in Classification 0x16 Scales, Runs, and Arpeggios .............. 24
5.2.8 Subclasses/Articulations in Classification 0x17 Effects and Noises .............................. 25
5.2.9 Attribute Type 0x18-19: Reserved.................................................................................. 26
5.2.10 Attribute Type 0x1A-1F: Custom, Library Specific, or Device Specific Sounds .......... 26

## Page 5

6 Mechanisms using Classes and Subclasses ...................................................................................... 27
6.1 Fallback Mechanism ................................................................................................................... 27
6.2 Interchange ................................................................................................................................. 27
6.2.1 Interchange of Libraries .................................................................................................. 27
6.2.2 Interchange of Instrument Types .................................................................................... 27
7 Note Off Message ............................................................................................................................... 28
7.1 Note Off Message Format .......................................................................................................... 28
Note Off Attribute Type ..................................................................................................28
Note Off Subclass ............................................................................................................28
Note Off Variation ...........................................................................................................29
Note Off Release Velocity – Release Time .....................................................................29
String Assignment............................................................................................................29
7.2 Note Off Versus a Sound Ending Declared in a Note On .......................................................... 29
8 Controllers .......................................................................................................................................... 30
8.1 Mute Related Controllers............................................................................................................ 30
8.1.1 Orchestral Mute Type: Registered Controller 0x20/0x22............................................... 30
Mute Type ........................................................................................................................30
8.1.2 Orchestral Mute Amount: Registered Controller 0x20/0x23 .......................................... 31
8.2 Playing Position: Registered Per-Note Controller 0x0C ............................................................ 31
9 Discovering Sounds Included and Optional Features Supported: Profile Details Inquiry ......... 33
9.1 Discovering Core Features and Specified Sounds ...................................................................... 33
9.1.1 Initiator Sends a MIDI-CI Profile Details Inquiry Message ........................................... 33
9.1.2 Responder Sends a MIDI-CI Reply to Profile Details Inquiry Message ........................ 33
9.2 Discovering Manufacturer Specific Sounds ............................................................................... 35
9.2.1 Initiator Sends a MIDI-CI Profile Details Inquiry Message ........................................... 35
9.2.2 Responder Sends a MIDI-CI Reply to Profile Details Inquiry Message ........................ 35
10 Relationship to Other Profiles .......................................................................................................... 37
Appendix A : Application to Instrument Types..................................................................................... 38
A.1 Attribute Type 0x10: Subclass = Core Sounds – Sustains and Strikes ........................................ 39
A.2 Attribute Type 0x11: Classification = Staccatos and Shorts ........................................................ 40
A.3 Attribute Type 0x12: Classification = Same Note Trills/Repeats ................................................ 41
A.4 Attribute Type 0x13: Classification = Intervallic Trills ............................................................... 42
A.5 Attribute Type 0x14: Classification = Additional Colors - Sustained.......................................... 43
A.6 Attribute Type 0x15: Classification = Pitch and Dynamic Gestures ............................................ 44
A.7 Attribute Type 0x16: Classification = Scales, Runs, and Arpeggios ........................................... 45
A.8 Attribute Type 0x17: Classification = Effects and Noises ........................................................... 46

## Page 6

Figures
Figure 1 Note On with Orchestral Articulation Message Format .........................................................14
Figure 2 Note Off with Orchestral Articulation Message Format ........................................................28
Figure 3 Orchestral Mute Type Registered Controller Message Format ............................................30
Figure 4 Orchestral Mute Amount Registered Controller Message Format .......................................31
Figure 5 Playing Position Registered Per-Note Controller Message Format .......................................31
Figure 6 Playing Position on a Violin.......................................................................................................32
Figure 7 Bitmap Format ...........................................................................................................................33
Figure 8 Articulation Table Explanation ................................................................................................38
Tables
Table 1 Version History ..............................................................................................................................3
Table 2 DRAFT Document Change History ............................................... Error! Bookmark not defined.
Table 3 Words Relating to Specification Conformance .........................................................................10
Table 4 Words Not Relating to Specification Conformance ..................................................................10
Table 5 Profile ID for MIDI-CI Transactions .........................................................................................13
Table 6 Note On Direction ........................................................................................................................14
Table 7 Note On String Assignment ........................................................................................................15
Table 8 Classifications set by Attribute Type Value ..............................................................................16
Table 9 Subclasses/Articulations in 0x10 Core Sounds – Sustains and Strikes ...................................17
Table 10 Subclasses/Articulations in 0x11 Staccatos and Shorts ..........................................................19
Table 11 0x12 Same Note Trills/Repeats .................................................................................................20
Table 12 0x13 Intervallic Trills ................................................................................................................21
Table 13 0x14 Additional Colors – Sustained .........................................................................................22
Table 14 0x15 Pitch and Dynamic Gestures ............................................................................................23
Table 15 0x16 Scales, Runs, and Arpeggios ............................................................................................24
Table 16 0x17 Effects and Noises .............................................................................................................25
Table 17 Note Off Attribute Type ............................................................................................................28
Table 18 Note Off Subclasses ....................................................................................................................28
Table 19 Note Off String Assignment ......................................................................................................29
Table 20 Mute Type Value Ranges ..........................................................................................................30
Table 21 Applying the Playing Position Per-Note Registered Controller ............................................32
Table 22 Optional Features Supported Bytes 1-2 ...................................................................................33
Table 23 Optional Features Supported Bytes 3-130 ...............................................................................34
Table 24 The 16 Bytes in Every Declaration of Classification ..............................................................34
Table 25 Optional Features Supported Bytes 1-96 .................................................................................35
Table 26 The 16 Bytes in Every Declaration of Classification ..............................................................36
Table 27 Musical Instrument Type ..........................................................................................................38
Table 28 Applicability to Musical Instrument Type ..............................................................................38
Table 29 Applying 0x10 Core Sounds – Sustains and Strikes ...............................................................39
Table 30 Applying 0x11 Staccatos and Shorts ........................................................................................40
Table 31 Applying 0x12 Same Note Trills/Repeats ................................................................................41
Table 32 Applying 0x13 Intervallic Trills................................................................................................42
Table 33 Applying 0x14 Additional Colors - Sustained .........................................................................43
Table 34 Applying 0x15 Pitch and Dynamic Gestures ...........................................................................44
Table 35 Applying 0x16 Scales, Runs, and Arpeggios ............................................................................45
Table 36 Applying 0x17 Effects and Noises .............................................................................................46

## Page 7

1.1 References
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
[MA06] M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol, Version 1.1.2,
Association of Musical Electronics Industry, http://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/
[MA07] M2-113-UM Default Control Change Mapping Profile, Version 1.0, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
1.1.2 Informative References
No Informative References

## Page 8

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
Group: A field in the UMP Format addressing some UMP Format MIDI messages (and some UMPs comprising
any given MIDI message) to one of 16 Groups. See the M2-104-UM Universal MIDI Packet (UMP) Format and
MIDI 2.0 Protocol specification [MA06].
Initiator: One of two MIDI-CI Devices with a bidirectional communication between them. Initiator has the
management role of setting and negotiating parameters for interoperability between the two Devices. The primary
goal of Initiator is usually (but not strictly required to be) configuring two Devices for subsequent communication
from Initiator as MIDI transmitter to Responder as MIDI receiver. The role of Initiator and Responder may
alternate between the two MIDI-CI Devices. Either MIDI-CI Device may initiate a MIDI Transaction (act as
Initiator) at any time. Also see Responder.
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
MIDI-CI Device: A Device that has the ability to act as a Responder that replies to inquiries received from an
Initiator. The ability to act as an Initiator is recommended but optional.
MIDI-CI Transaction: A Transaction using a set of MIDI-CI messages that includes an Inquiry sent by an
Initiator and a reply to the Inquiry returned by the Responder. The Responder’s reply to an Inquiry might be a
single message that satisfies the Inquiry, a set of multiple messages that satisfy the Inquiry, or an error message.

## Page 9

MIDI Manufacturers Association: A California nonprofit 501(c)6 trade organization, and the legal entity name
of the MIDI Association.
MMA: See MIDI Manufacturers Association.
Note Data Messages: MIDI messages which include a Note Number field. These include Note On/off, Poly
Pressure, Per-Note Pitchbend, Registered Per-Note Controllers, Assignable Per-Note Controllers, and Per-Note
Management Message.
Note On Orchestral Articulation Profile: MIDI-CI Profile for Note On Selection of Orchestral Articulation (this
specification).
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
Sender: A MIDI Device which transmits MIDI messages to a MIDI Transport which is connected to its MIDI Out
or to its MIDI Thru port.
UMP: Universal MIDI Packet.
UMP Format: Data format for fields and messages in the Universal MIDI Packet.
UMP MIDI 1.0 Device: any Device that sends or receives MIDI 1.0 Protocol messages using the UMP Format.
Such Devices may use UMP Message Types that extend the functionality beyond Non-UMP MIDI 1.0 Systems.
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

2 Introduction
2.1 Executive Summary
There are many orchestral sample libraries in the market, and they are essential for film scoring, game audio,
studio, and live MIDI applications. These orchestral libraries have many kinds of articulations.
For example, a string library might have a different set of samples for every articulation including marcato,
staccato, pizzicato, etc.
However, there is no industry standard method-the method for selecting these different articulations has been
different for each developer. Many developers use notes at the lower end of the MIDI note range for “key
switching”, but the actual keys used are different between different developers. Some developers use CC
messages to switch between articulations, but again there is no industry wide consistency. Some plugin formats
now have the ability for per note selection of articulations, but again the method for inputting that data is different
for different applications.
It is the goal of the MIDI-CI Profile for Note On Selection of Orchestral Articulation to provide a consistent way
to encode articulation information directly in the MIDI 2.0 Note On message, using the Attribute Type and
Attribute Data fields.
In arriving at this Profile, a study was made of orchestral instrument families, choir, big band instruments, guitar,
keyboard instruments, and various non-western instruments to evaluate the degree to which they share common
performance attributes and sound production techniques. Notation symbols and performance indications were also
considered to determine, for example, how successfully a violin note marked with a trill might result in a
musically meaningful or analogous articulation when the part is copied to an instrument as far afield as timpani—
all without the composer having to re-articulate the timpani part, at least initially.
The Profile provides a comprehensive yet concise system of articulation mapping that includes a wide palette of
articulation types and supports articulation equivalence across eight instrument categories.
The Profile was designed to offer articulation equivalence — a system of articulation mapping that allows a
passage articulated for one instrument to be copied to another track and played back with an equivalent or
analogous articulation, regardless of the target instrument type.
When implemented by sample library developers, the Profile will greatly aid composers in highly significant
ways.
First, it will simplify the process of substituting or layering sounds from the same or different sample libraries;
Second, it will allow composers to quickly audition and orchestrate unison passages by copying an articulated part
to other tracks and hear them to play back with equivalent or analogous articulations.
2.2 Goals
This Profile specification addresses the following goals to benefit MIDI product designers and define mechanisms
which benefit of MIDI users. The specification addresses the following goals:
1. Defines standardized mechanisms, commonly usable by all MIDI Devices and sound libraries, for Notes to
be tagged with the most common types of musical articulations.
2. Swappable Libraries/Devices – This allows a musician to enter articulations for individual notes using one
sound library or MIDI device and then later switch to a different sound library or MIDI device. In making
that switch, the articulations remain musically useful.
For example, a musician may create articulations for a violin sound from one library and then easily
hear those notes with the same articulations on a violin from a separate sound library.
3. Swappable Instrument Types – This allows a musician to enter articulations for individual notes for one
instrument type and then later switch to a different instrument type. In making that switch, the
articulations remain musically useful.

## Page 12

For example, a musician may create articulations for a violin sound and then easily hear those
notes with the same articulations on a clarinet.
4. Atomic Message – Note Articulations are defined as an integral property of a MIDI 2.0 Note On message.
Then if a sequence of Notes is edited in a sequencer or DAW application, the articulation remains fixed
and attached to the Note, whether moved in time or transposition.
5. Autoconfiguration – The MIDI-CI Profile mechanisms allow Devices to discover whether these Profile
mechanisms are supported by a MIDI Device, helping users to configure and use devices which conform
to the Profile.
2.3 Design Overview
This Profile defines how articulation information is attached to notes. This is primarily achieved defining the use
of fields which are available in MIDI 2.0 Note On messages. Further details of articulation are defined using fields
in MIDI 2.0 Note Off messages and one Registered Per-Note Controller, and one Registered Per-Note Controller .
2.4 Scope
This specification focuses on articulation tags which are in a Note On message. The main intention for this
specification to select specific sounds sampled with the requested articulation, while this can also be applied to
technologies beyond sample selection.
This specification does not cover all aspects of musical articulations. Articulation properties which are not fully
addressed by this Profile include properties such as dynamics, multi-note gestures, legato and portamento,
modulation, and tuning. These other properties require mechanism that go beyond a single note. These other
properties of articulation may be addressed by complimentary or alternate MIDI specifications in the future.
Although some of the main targets of the Profile are music production applications such as film scoring and game
audio, it can certainly be used in live performance as well. Keyboards and MIDI controllers could have buttons or
use algorithmic means to select different articulation during a live performance.
Finally, although the Profile requires the expanded features of MIDI 2.0 Attribute Types, it is easy to imagine how
developers could take their currently available means for selecting articulations, such as key switches or Control
Change messages, and map their translation to MIDI 2.0 Note On messages or inversely take MIDI 2.0 Note On
messages and map them back to key switches or Control Change messages.

## Page 13

3 MIDI-CI Profile for Note On Selection of Orchestral
Articulation
3.1 Single Channel Profile
The MIDI-CI Profile for Note On Selection of Orchestral Articulation is a Single Channel Profile.
3.2 Profile Id
The 5 byte ID of the The MIDI-CI Profile for Note On Selection of Orchestral Articulation is as shown in Table 4:
Table 4 Profile ID for MIDI-CI Transactions
5 bytes Profile ID
Byte 1 0x7E (Standard Defined Profile)
Byte 2 0x21 (Note On Orchestral Articulation Profile Bank)
Byte 3 0x01 (Note On Orchestral Articulation Profile Number)
Byte 4 0x01 Note On Orchestral Articulation Profile Version)
Byte 5 0x01 (Note On Orchestral Articulation Level)
3.2.1 Version
Set to 0x01 = Version 1.0 of the MIDI-CI Profile for Note On Selection of Orchestral Articulation
3.2.2 Level
Set to 0x01 = Level 1
0x2-0x7F = Reserved

## Page 14

4 Note On With Articulation
4.1 Note On Message Format
The MIDI-CI Profile for Note On Selection of Orchestral Articulation defines fields in a MIDI 2. Protocol Note
On message as follows.
Figure 1 Note On with Orchestral Articulation Message Format
Attribute Type – Classifications of Articulations
Declares the intended Classification of the articulation using Attribute Type values 0x10 to 0x1F. See Section 5.1
for more details.
Attribute Type field values 0x10-0x1F should be presented as Attribute Classifications 1 to 16 when presented to
users.
Subclass
Declares the intended Subclass of the articulation within the selected Classification. (See Section 5.2)
Subclass field values 0x0-0xF should be presented as Articulation Subclasses 1 to 16 when presented to users.
Variation
Each Subclass supports up to 16 Variations. This allows a library to have multiple sounds that fit into this
Subclass.
Variation field values 0x0-0xF should be presented as Articulation Subclass Variations 1 to 16 when presented to
users.
The Normal/Primary articulation type in Classification 0x10 is spread across 2 Subclasses to allow up to 32
Variations.
Direction
A Note may optionally declare a direction of bowing or plucking stroke, or which hand plays a strike.
Table 5 Note On Direction
Direction Description
0x0 Determined by the receiver or automatic
0x1 Down stroke, right hand pizzicato, or right-hand strike
0x2 Up stroke, left hand pizzicato, or left-hand strike
0x3 Reserved
Reset Round Robin
If the Receiver is using a “round robin” mechanism to provide a different sound for each successive note, this
Note On shall be played with the first sound in the round robin and restart the progress through the available round
robin sounds.

## Page 15

String Assignment
The String Assignment field is used to indicate a specific string on a stringed instrument. For non-stringed
instruments, values 0x1 to 0x7 may be used to indicate alternate fingering or any other variation.
Table 6 Note On String Assignment
String
Assignment
Description
0x0 No string assignment (Receiver may determine)
0x1 First string, highest pitched (usually E on guitar, E on violin)
0x2 Second string (usually B on guitar, A on violin)
0x3 Third string (usually G on guitar, D on violin)
0x4 Fourth string (usually D on guitar, G on violin)
0x5 Fifth string (usually A on guitar, usually G drone on 5 String Banjo)
0x6 Sixth string (usually E on guitar)
0x7 Other String
Note: This String Assignment field is most suited for notes played on a single Channel. Some MIDI
devices, such as a MIDI Guitar might use separate Channel per string. This field might not be used by
such multi-Channel Devices.
4.2 Receiver Response to Note On
When a Device which conforms to the MIDI-CI Profile for Note On Selection of Orchestral Articulation receives
a MIDI 2.0 Note On Message with Attribute Type set to 0x10 through 0x1F, the Device shall play a note with a
the best available sound properties to suit the requested Classification and Subclass of note articulation and the
other fields in the Note On.
If the Device does not have a sound specifically designed for the Classification and Subclass of a received Note
On, the Device shall substitute another sound according to the rules in Section 6.1, Fallback Mechanism.

## Page 16

5 Note On Classifications and Subclasses
Tagging notes with Classifications and Subtypes of articulation is the key mechanism in this Profile.
Classifications and Subtypes are defined in Name only. A sound designer and/or device designer may freely
decide what sound they will provide to best suit each of the named Classifications and Subtypes.
All text in the “Notes, Alternatives” columns found in Table 8 through Table 15 are descriptive hints only and are
not normative definitions.
5.1 Classifications – Set by Attribute Type
A Note does not inherit an articulation from prior Notes. Therefore, while the Profile is active, a Sender should
send Note On Orchestral Articulation Attribute data in every note. In many cases the Sender is a DAW, so the
DAW should put Attribute data in every note sent. If a Sender does not have any articulation data for a Note, then
the Sender may send the note with Attribute Type = 0x00.
If a Receiver receives a Note On with any Attribute Type other than 0x10-1F, then the Receiver shall decide
which articulation to use.
Table 7 Classifications set by Attribute Type Value
Classification
Number
Attribute
Type
Classification of Articulation
N/A 0x00 No Attribute Data.
1 0x10 Core Sounds - Sustains and Strikes
2 0x11 Staccatos and Shorts
3 0x12 Same Note Trills/Repeats
4 0x13 Intervallic Trills
5 0x14 Additional Colors - Sustained
6 0x15 Pitch and Dynamic Gestures
7 0x16 Scales, Runs, and Arpeggios
8 0x17 Effects and Noises
9-10 0x18-0x19 Reserved – shall not be used
11-16 0x1A-0x1F Custom, Library Specific, or Device Specific Sounds (See Section
5.2.10)
Each Classification supports up to 16 Subclasses described in Section 5.2.
5.2 Subclasses and Articulations Within Each Classification
The following sections outline all of the defined Subclasses in each Classification. The Subclass value
declares the type of Articulation.

## Page 17

5.2.1 Subclasses/Articulations in Classification 0x10: Core Sounds – Sustains and
Strikes
This Attribute Type is used to select core sounds or the default performance sound, both sustains and strikes.
Sounds which continue for the whole time that a performer plays a note should be assigned to this Classification
as sustains.
Naturally short percussion sounds should be assigned to Attribute Type 0x10 as strikes. Longer percussion
sounds, orchestra chimes or cymbals which are allowed to fully ring out should also be assigned to Attribute Type
0x10.
However, If a Device or library includes intentionally stopped or choked (shortened or dampened) performances
of those instruments, those should be assigned instead to Attribute Type 0x11, Staccatos and Shorts.
To enable the fallback mechanism defined in Section 6.1, a Device or library which conforms to the Note On
Orchestral Articulation Profile shall provide a suitable note in Classification 0x10, Subclass 0x0, Variation 0x0 for
every instrument that is part of the sound set.
Table 8 Subclasses/Articulations in 0x10 Core Sounds – Sustains and Strikes
Sub
Class
Articulation Notes, Alternatives
0x0 Normal Sustains & Strikes
(PART 1)*
Default Playing style of the instrument, whether a sustain
or a strike. Vibrato style: the traditional style (either vib or
non-vib) for the selected instrument or genre of the library.
When changing instrument types, vibrato may or may not
be present, depending on the nature of the instrument and
the choices of the sound designer.
0x1 Normal Sustains & Strikes -
(PART 2)*
0x2 Legato and Legato Slurred
0x3
Molto Legato
A loose/lyrical style of playing ("Montovani"). Perhaps
"schmaltzy." It skirts the difference between legato and
glissando.
0x4
Glissando
This is intended to represent the articulation that many
sample library developers call "portamento" for strings
(legato bowing).
0x5 Detaché
0x6 Marcato For all manner of accented-attack, sustained notes which
maintain a relatively loud volume (timbre) post-attack.
0x7
Martelé
Specific to Strings. Same as above, but for string
instruments this represents a distinctly different attack
character.
0x8
Senza Vibrato
Specifically no vibrato (senza vibrato, non-vibrato, n.v.): If
the primary/featured sounds assigned to Subclasses 0x0
or 0x1 were performed with vibrato, then assign nonvibrato alternatives to this Subclass. Non-vibrato variants
of other Sub Classes of Attribute Type 0x10 can be
assigned to 0x8 as needed.**
0x9 Con Vibrato Specifically with vibrato: If the primary/featured sounds
assigned to Subclasses 0x0 or 0x1 were performed

## Page 18

without vibrato, then assign vibrato alternatives to this
Subclass. Vibrato variants of other Sub Classes of
Attribute Type 0x10 can be assigned to 0x8 as needed.***
0xA Synchronized Vibrato A classic big band effect
0xB reserved
0xC reserved
0xD reserved
0xE reserved
0xF reserved
*Note: Space allocated for Normal Sustains & Strikes above is doubled (uses 2 Subclasses) to provide up
to 32 variations of each sound. Devices or libraries should fill all 16 Variations in Subclass 0x0 before
using Subclass 0x1
**Example: If Trumpet assigned to 0x0 – 0x1 is played with vibrato (as the normal sound), then nonvibrato variants are assigned to 0x8.
***Example: If Trumpet assigned to 0x0 – 0x1 is played without vibrato (as the normal sound), then vibrato
variants are assigned to 0x8.

## Page 19

5.2.2 Subclasses/Articulations in Classification 0x11: Staccatos and Shorts
This Classification is intended to accommodate intentionally shortened sounds, such as staccato or instrument
sounds that a performer has deliberately dampened.
For example, dampened or shortened timpani or orchestra chimes should in Classification x11, while
normally played sounds of those instruments should be in Classification 0x10.
Table 9 Subclasses/Articulations in 0x11 Staccatos and Shorts
Sub
Class
Articulation Notes, Alternatives
0x0 Normal Staccato Off String Strings: Off the String. Other Instruments: "Normal
Staccato".
0x1 Normal Staccato On String Strings: On the String. Other Instruments: "Normal
Staccato".
0x2 Slurred Staccato Single bow staccato
0x3 Accented Staccato
0x4 Staccatissimo Staccatissimo, dampened or otherwise shortened or
shorter than "normal staccato".
0x5 Spiccato Specific to Strings. Other instruments: same as
Staccatissimo.
0x6 Sautillé
0x7 Martellato Shortened Marcato or Accented
0x8 Long Staccato Also Mezzo Staccato or Louré
0x9 Portato Strings: Portato. Brass: Light tonguing
0xA Pizzicato
0xB
Bartok Pizzicato
Harsh, Hard, Noisy Notes. Strings: Use for
Bartok/Snap Pizz., Jazz Pizz. Woodwinds: Short,
Overblown Attacks (chiffs). Plucked: Variations of
short, hard-attack sounds on Guitar, Koto, Erhu, Harp
(fingernails), etc.
0xC Col Legno Battuto Strings: strike with the wood, back side of the bow.
Also Geschlagen
0xD
Col Legno Gestrichen
Strings: strike with the wood, back side of the bow,
turned slightly so some of the hairs also strike the
string.
0xE String Hand Tap Pitched
0xF Jete

## Page 20

5.2.3 Subclasses/Articulations in Classification 0x12 Same Note Trills/Repeats
This Classification includes sounds of performance techniques using rapid repeats on a constant pitch.
Table 10 0x12 Same Note Trills/Repeats
Sub
Class
Articulation Notes, Alternatives
0x0
Tremolo / Flutter tongue
Intended for effects notated with a tremolo symbol, or for
non-sustaining instruments performing a rapidly repeated
note of the same pitch. Strings: Normal Tremolo. Winds &
Brass: Flutter Tongue. Percussion & Mallets: Single Note
Rolls. Harp: Bisbigliando. Mandolin, Hammered Dulcimer,
etc.: Plucked Repeats.
0x1
Growl / Razz
Brass: Growl Effects. Woodwind Growl Effects, as distinct
from flutter tongue (see flutter tongue above). Strings: Sul
Ponticello Fast Tremolo. Vocals: lip buzzing effects.
0x2
Other Coloristic Tremolo
Strings: Con Sordino Tremolo or other coloristic or
contemporary tremolo effects. Brass/Winds: Other kinds of
contemporary "buzz" effects.
0x3 One Note Trills One note "Timbral Trills", generally accomplished by
alternating fingerings on the same note (specific to winds &
brass). Strings: Same pitch on 2 strings.
0x4
2 Repeats
Strings: Ricochet/Bounce, or rhythmic 8ths or 16ths (etc.),
down/up-bow gestures. Winds: Double-Tongue, Percussion:
Grace/Flam. Choir/Vocals: e.g. Swingle Singers style
staccato vocalizations, "Dah-dah", etc.
0x5 3 Repeats e.g., Ricochet, Triple Tongue, drags or ruffs, repeating or
non-repeating triplet figures.
0x6 4 Repeats e.g., Ricochet, Quadruple Tongue, drags or ruffs, repeating
or non-repeating 16th note figures.
0x7 5 Repeats
0x8 6 Repeats
0x9 Faster Repeats
0xA reserved
0xB reserved
0xC reserved
0xD reserved
0xE reserved
0xF reserved

## Page 21

5.2.4 Subclasses/Articulations in Classification 0x13 Intervallic Trills
This Classification includes sounds that repeatedly alternate between 2 pitches. Classical trills in SubClasses 0x0
and 0x2 start on the root note. Baroque trills in SubClasses 0x1 and 0x3 start on the auxiliary note above the root
note. The wider intervals indicated for SubClasses 0x4-0xD are referred to as "tremolos" and may start on the root
note or the auxiliary note above the root.
Table 11 0x13 Intervallic Trills
Sub
Class
Articulation Notes, Alternatives
0x0 Half Step (Classical)
0x1 Half Step (Baroque)
0x2 Whole Step (Classical)
0x3 Whole Step (Baroque)
0x4 Minor 3rd
0x5 Major 3rd
0x6 Perfect 4th
0x7 Tritone
0x8 Perfect 5th
0x9 Minor 6th
0xA Major 6th
0xB Minor 7th
0xC Major 7th
0xD Octave
0xE reserved
0xF reserved

## Page 22

5.2.5 Subclasses/Articulations in Classification 0x14 Additional Colors – Sustained
This Classification is intended to accommodate alternate instrumental colors and other timbral variations of
sustained notes.
Table 12 0x14 Additional Colors – Sustained
Sub
Class
Articulation Notes, Alternatives
0x0 Harmonics – Natural
0x1 Harmonics – Artificial
0x2 Col Legno Tratto Strings: bowed with the wood side of the bow, sustained.
0x3 Flautando Strings: Twist the bow so that only half the bow hairs touch
the strings, used with Sul Tasto.
0x4 Polyphony: multiple
octaves
0x5 Polyphony: intervals,
chords, etc.
0x6 Cuivré
0x7 Lontano
0x8 Singing into Instrument
0x9 reserved
0xA reserved
0xB reserved
0xC reserved
0xD reserved
0xE reserved
0xF reserved

## Page 23

5.2.6 Subclasses/Articulations in Classification 0x15 Pitch and Dynamic Gestures
This Classification contains sounds with stylistic change of pitch or prerecorded change of dynamics.
Table 13 0x15 Pitch and Dynamic Gestures
Sub
Class
Articulation Notes, Alternatives
0x0 Pitch Fall End – Pitch of Note
Number. Then falls at end of
note. See also Section 7.2.
Run or gliss down from the starting note: Brass/Big
Band Horn Falls, String Slides, Timpani Pedal Effects,
Trombone Slides, Harmonic Glisses, Choir FX, etc.
0x1 Pitch Fall Start – pitch starts
high falling into Pitch of Note
Number
Run or gliss down to the note. Brass/Big Band Horn
Falls, String Slides, Timpani Pedal Effects, Trombone
Slides, Harmonic Glisses, Choir FX, etc.
0x2 Pitch Rise End – Pitch of Note
Number then rises at the end
note See also Section 7.2.
Run or gliss up from the starting note: Big Band Doits,
Pop/Jazz Horn Rises, String Slides, Timpani Pedal
Effects, Trombone Slides, Harmonic Glisses, French
Horn Rips, Brass/Big Band Rips, Choir FX, etc.
0x3 Pitch Rise Start – pitch starts
low raising into Pitch of Note
Number
Run or gliss up to the note. Pop/Jazz Horn Rises,
String Slides, Timpani Pedal Effects, Trombone
Slides, Harmonic Glisses, French Horn Rips,
Brass/Big Band Rips, Choir FX, etc.
0x4 Blue Note Down- Starts at MIDI
pitch, bends down and then
back to pitch
0x5 Blue Note Up- Starts at MIDI
pitch, bends up and then back to
pitch
0x6 Grace Notes “Classical” (Starts
Below)
Grace (Leading) Notes (Classical) where the grace
note starts below the target pitch. Also Guitar
Hammer Ons, Koto Bends, etc.
0x7 Grace Notes “Baroque” (Starts
Above)
Grace (Leading) Notes (Baroque) where the grace
note starts above the target pitch. Also Guitar Pull
Offs, Koto Bends, etc.
0x8
Shakes
SHAKES (Brass/Horns). Timpani: Comical Pedal
Effects. Choir: Intervallic Leaps. Strings:
Contemporary or other Special FX. Electric Guitar:
Whammy Bar FX
0x9 Crescendo
0xA Decrescendo
0xB Cresc -> Decresc
0xC Decresc -> Cresc
0xD Sfz Crescendo
0xE reserved
0xF reserved

## Page 24

5.2.7 Subclasses/Articulations in Classification 0x16 Scales, Runs, and Arpeggios
This Classification contains sounds used to perform fast runs ("playable runs") and to trigger pre-recorded scales,
runs, and arpeggios.
Table 14 0x16 Scales, Runs, and Arpeggios
Sub
Class
Articulation Notes, Alternatives
0x0 Playable Runs
0x1 Playable Tremolos
0x2 Playable Glissando
0x3 Scales/Runs Major
0x4 Scales/Runs Minor
0x5 Scales/Runs Dominant 7th
0x6 Scales/Runs diminished
(whole/half) or Other 1
0x7 Scales/Runs diminished
(half/whole) or Other 2
0x8 Whole Tone Scale 1 (includes
C)
0x9 Whole Tone Scale 2 (incudes
C#)
0xA Pentatonic Scale (maj)
0xB Pentatonic Scale (min)
0xC Lydian
0xD Lydian b7
0xE Chromatic
0xF Other Scales and Runs
Note: The ending note of these gestures is not required to sustain.

## Page 25

5.2.8 Subclasses/Articulations in Classification 0x17 Effects and Noises
This Classification contains sounds which are the result of unconventional performance techniques, background
noise inherent to musical instruments, unpitched sounds, or atypical sounds.
Table 15 0x17 Effects and Noises
Sub
Class
Articulation Notes, Alternatives
0x0 Assorted noises, Air Sound, or
effects – Sustained
Orchestral: e.g. specialty effects libraries of sustained
sounds such as “white tones”, contemporary coloristic
effects, clusters, bowed percussion, etc.
0x1 Behind the Bridge – Sustained
0x2 Random Pizz – Sustained Pizzicati in random pitches, no set tempo, over period of
time. Looped.
0x3 Harmonic Glissando
0x4 Random Glissando
0x5 Air sound, Chiffs/Squeak/Lip-
Pizz – Short
0x6 Mechanical sounds – Sustained
0x7 Mechanical sounds – Short Woodwind: Key open/closing sounds, Brass: valve
noise, etc.
0x8 Finger Glide
0x9 Fret Buzz/Noise
0xA Thump Deep pitched noise, Piano: Sustain pedal, etc.
0xB Knock Knuckles on body of instrument, etc.
0xC Slap Open hand slap on body of instrument, etc.
0xD Pop Woodwinds: note caused by key/finger slap over hole,
Brass: mouthpiece pops, etc.
0xE Tap Finger tap on body of instrument, etc.
0xF Click Short bright noise

## Page 26

5.2.9 Attribute Type 0x18-19: Reserved
Reserved for future articulations to be defined by MIDI Association and AMEI.
Shall not be used for custom sounds. Use Attribute Type 0x1A-1F: Custom, Manufacturer/Device Specific
Sounds instead. See Section 5.2.10.
5.2.10 Attribute Type 0x1A-1F: Custom, Library Specific, or Device Specific Sounds
Many orchestral sound libraries include unique sounds that do not fall into the standard Classifications. A
Receiver may use Attribute Types 0x1A through to 0x1F for those sounds. Manufacturer may put any desired
indexing into the Subclass field.
When using custom, library specific, or device specific sounds, the Variation, Direction, Reset Round Robin,
and String fields remain valid and shall not be used for any other function.

## Page 27

6 Mechanisms using Classes and Subclasses
6.1 Fallback Mechanism
A Receiver might not include a sound for a particular Classification, Subclass, and Variation. In this case, the
Receiver shall play a substitute sound according to the following rules:
• If a Receiver does not have a specific sound for any declared Variation, then it shall fall back to using a
Variation within the same Subclass within the same Classification.
• If a Receiver does not have a specific sound for any declared Subclass, then it shall fall back to using a
sound for the Subclass 0x00 within the same Classification.
• If a Receiver does not have a specific sound for any declared Subclass and does not have a sound for
Subclass 0x00 for within the same Classification, then it shall fall back to using a sound for Classification
0x01 with Subclass 0x00.
A Sender may discover which sounds are available in a Receiver using the MIDI-CI Profile Details Inquiry
mechanism. See Section 9.
6.2 Interchange
Sound designers and device developers should consider the following goals for interchange of different sounds.
6.2.1 Interchange of Libraries
This Profile allows musicians to enter articulations for individual notes using one sound library or MIDI device
and then later switch to a different sound library or MIDI device. In making that switch, the articulations remain
musically useful.
For example, a musician may create articulations for a violin sound from one library and then easily hear
those notes with the same articulations on a violin from a separate sound library.
6.2.2 Interchange of Instrument Types
This Profile allows a musician to enter articulations for individual notes for one instrument type and then later
switch to a different instrument type. In making that switch, the articulations remain musically useful.
For example, a musician may create articulations for a violin sound and then easily hear those notes with
the same articulations on a clarinet.

## Page 28

7 Note Off Message
7.1 Note Off Message Format
The MIDI-CI Profile for Note On Selection of Orchestral Articulation defines the following fields in a MIDI 2.0
Protocol Note Off message when Attribute Type = 0x10:
Figure 2 Note Off with Orchestral Articulation Message Format
Note Off Attribute Type
Devices conforming to the MIDI-CI Profile for Note On Selection of Orchestral Articulation may use the
following values for Attribute Type:
Table 16 Note Off Attribute Type
Attribute
Type
Classification of Articulation
0x00 No Attribute Data. Note ending characteristics are determined by the
Receiver.
0x01 Manufacturer Specific Attribute Data
0x10 Note ending characteristics of the Note On Orchestral Articulation
Profile, as set by fields in the Attribute Data area of the Note Off
message.
Note Off Subclass
Declares the intended Subclass of the articulation when Attribute Type = 0x10.
Table 17 Note Off Subclasses
Subclass Description
0x0 No Note Off Sample
0x1 Soft Ending
0x2 Hard Ending
0x3 Pitch Rise (such as a “doit”) Also see Sections 7.2 and 5.2.6.
0x4 Pitch Fall Also see Sections 7.2 and 5.2.6.
0x5-F Reserved
A Receiver may ignore the Subclass field in a Note Off message if it does not support selection of sounds based
on Note Off Subclass.

## Page 29

Note Off Variation
Each Subclass supports up to 16 Variations. This allows a library to have multiple sounds that fit into this
Subclass. A Receiver may ignore the Variation field in a Note Off message if it does not support selection of
sounds based on Note Off Subclass.
Note Off Release Velocity – Release Time
If a Receiver declares in a Reply to Profile Details Inquiry message (See Section 9) that it supports Note Off
Release Velocity, then the envelope release time of the Note in the Receiver shall be determined by the value of
the Release Velocity field, ranging from 0x0000 to 0xFFFF:
0x0000 = Longest Release Time of the Receiver
0x8000 = Default Release Time (the natural release time of the chosen sound)
0xFFFF = Shortest Release Time (immediate release)
If a Sender does not support sending a variable release time in a Note Off message, then the Sender shall set the
value of Release Velocity to 0x8000 in all Note Off messages.
String Assignment
The String Assignment field is used to indicate a specific string on a stringed instrument. This field in a Note Off
might be useful when two notes of the same Note Number are played on 2 strings of an instrument. The Note Off
can declare which of the 2 notes is intended to process the Note Off.
Table 18 Note Off String Assignment
String
Assignment
Description
0x0 No string assignment (Receiver may determine)
0x1 First string, highest pitched (usually E on guitar, E on violin)
0x2 Second string (usually B on guitar, A on violin)
0x3 Third string (usually G on guitar, D on violin)
0x4 Fourth string (usually D on guitar, G on violin)
0x5 Fifth string (usually A on guitar, usually G drone on 5 String Banjo)
0x6 Sixth string (usually E on guitar)
0x7 Other String
7.2 Note Off Versus a Sound Ending Declared in a Note On
Some Receivers might not use any Note-Off data to control any aspect of articulation. A Receiver may recognize
articulation data in a Note On to determine the way the sound of a note comes to an end.
Examples:
• A Staccato note might stop sounding before a Note Off is received.
• How the end of one note transitions to a following Note may be declared by Note On articulations
such as Legato.
• A Note On message might declare a Pitch Fall End or a Pitch Rise End in the Note On. See
Section 5.2.6.

## Page 30

8 Controllers
The Note On Orchestral Articulation Profile defines three optional Controllers.
8.1 Mute Related Controllers
Two Registered Controllers are used to set the use of mutes for orchestral instruments:
• Registered Controller for Orchestral Mute Type selection (see Section 8.1.1)
• Registered Controller for Orchestral Mute Amount (see Section 8.1.2)
8.1.1 Orchestral Mute Type: Registered Controller 0x20/0x22
Orchestral Mute Type uses 32 ranges of the Registered Controller value to set the type of mute in use.
Figure 3 Orchestral Mute Type Registered Controller Message Format
Mute Type
The total value range is divided into 32 subranges for an enumerated list, easily selected by a knob or slider. All
values within a subrange have the same meaning. Default value = 0x00000000 (No Mute)
Table 19 Mute Type Value Ranges
Subrange Values Mute Type
0x00000000 – 0x07FFFFFF No Mute
0x08000000 – 0x0FFFFFFF Straight mute (brass) or Standard mute (strings and others)
0x10000000 – 0x17FFFFFF Practice mute
0x18000000 – 0x1FFFFFFF Cup Mute
0x20000000 – 0x27FFFFFF Wah-wah/Harmon Mute, stem in
0x28000000 – 0x2FFFFFFF Wah-wah/Harmon, stem extended
0x30000000 – 0x37FFFFFF Wah-wah/Harmon, stem removed
0x38000000 – 0x3FFFFFFF Plunger Mute
0x40000000 – 0x47FFFFFF Bucket Mute
0x48000000 – 0x4FFFFFFF Mica Mute
0x50000000 – 0x57FFFFFF Solotone Mute
0x58000000 – 0x5FFFFFFF Whispa/Whisper Mute
0x60000000 – 0x67FFFFFF Hat
0x68000000 – 0x6FFFFFFF Hand
0x70000000 – 0x77FFFFFF Stopped (Transposing Mute)
0x78000000 – 0x7FFFFFFF Into the Stand

## Page 31

0x80000000 – 0xCFFFFFFF Reserved (10 of 32 subranges)
0xD0000000 – 0xD7FFFFFF Manufacturer Specific Mute 1
0xD8000000 – 0xDFFFFFFF Manufacturer Specific Mute 2
0xE0000000 – 0xE7FFFFFF Manufacturer Specific Mute 3
0xE8000000 – 0xEFFFFFFF Manufacturer Specific Mute 4
0xF0000000 – 0xF7FFFFFF Manufacturer Specific Mute 5
0xF8000000 – 0xFFFFFFFF Manufacturer Specific Mute 6
If a Receiver which conforms to the Note On Orchestral Articulation Profile receives a Registered Controller to
select Orchestral Mute Type, it shall set its state for the Orchestral Mute Amount to 0xFFFFFFFF. Subsequent
Orchestral Mute Amount messages received may change this value (See Section 8.1.2).
If a Receiver which conforms to the Note On Orchestral Articulation Profile receives a Registered Controller to
select Orchestral Mute Type which it does not support for the chosen Articulation, the Receiver may decide its
response, playing whatever it thinks most closely matches the desired sound. For example, the Receiver may
substitute another Mute Type for the same Articulation, or may play the chosen Articulation without any mute.
8.1.2 Orchestral Mute Amount: Registered Controller 0x20/0x23
Orchestral Mute Amount uses the Registered Controller value to set the amount of Mute from 0x00000000 fully
open/off to 0xFFFFFFFF fully closed/muted/dampened. Default value is 0xFFFFFFFF.
Figure 4 Orchestral Mute Amount Registered Controller Message Format
Mutes which have a single position of use should use the value 0xFFFFFFFF fully closed/muted/dampened.
Example: A trumpet player may insert or remove a straight mute. This is generally done between musical
sections and the player does not actively move the mute in and out while playing a note.
Mutes which have some controllable element with a variable are controlled by the full range of values of the
Registered Controller for Orchestral Mute Amount.
Example: A trumpet player may change the position of a plunger held in front of the trumpet bell while
playing notes, moving the plunger mute in positions between fully open (no muting) to fully closed
(maximum muting).
8.2 Playing Position: Registered Per-Note Controller 0x0C
Some instruments have a variety of playing positions or locations where the musician may choose on the playing
surface. Playing Position uses the Registered Per-Note Controller value to set the playing position of a Note.
Figure 5 Playing Position Registered Per-Note Controller Message Format

## Page 32

The Default value of 0x80000000 represents the normal playing position. Values from minimum to maximum
declare a position within a defined range:
Table 20 Applying the Playing Position Per-Note Registered Controller
Value Applied to Bowed/Plucked Applied to Drums & Cymbals
0x00000000 At the Bridge At the Center
0x80000000 (Default) Normal Playing Position Normal Playing Position
0xFFFFFFFF At the Nut At the Rim
Each instrument has its own normal playing position which is set by a value of 0x80000000.The Default value is
in the middle of the value range to represent the normal playing position but is not necessarily the middle of the
physical position on the instrument. See Figure 6 for an example of violin bowing position.
Figure 6 Playing Position on a Violin
For example, Sul Ponticello might typically be in the range of 0x00000000 to 0x10000000.

## Page 33

9 Discovering Sounds Included and Optional Features
Supported: Profile Details Inquiry
The MIDI-CI Profile Details Inquiry mechanism may be used to discover implementation details of a Receiver
which conforms to the Note On Orchestral Articulation Profile. Discoverable features include:
• Which optional features of the Profile are supported.
• Which articulation sounds are available and how many variations are available for each sound.
See MIDI Capability Inquiry (MIDI-CI) [MA03], and the Common Rules for Profiles [MA04] for more details of
how to use the Profile Details Inquiry.
9.1 Discovering Core Features and Specified Sounds
9.1.1 Initiator Sends a MIDI-CI Profile Details Inquiry Message
A MIDI-CI Initiator may ask a Responder for a report of the optional features and sounds supported by the
Responder. This inquiry is made using a Profile Details Inquiry message with the Inquiry Target set to 0x01
(Profile Optional Features Supported).
9.1.2 Responder Sends a MIDI-CI Reply to Profile Details Inquiry Message
When a Responder which is a Receiver receives a Profile Details Inquiry message with the Inquiry Target set to
0x01, the Responder should send back a Reply to Profile Details Inquiry message.
The Inquiry Target Data field in the Reply to Profile Details Inquiry message has a Target Data payload of 130
bytes to declare details of the Receiver’s implementation of the Profile. The first two bytes are a bitmap of
optional features, and the remaining bytes declare the number of variations available (from 0 to 16) for each
Subclass in every Classification.
Table 21 Optional Features Supported Bytes 1-2
Size Bitmap
Data
Feature or
Message
Supported
Description
2 bytes D0 RC 0x20/0x22 Supports Orchestral Mute Type Registered Controller
D1 RC 0x20/0x23 Supports Orchestral Mute Amount Registered Controller
D2 RPNC 0x0C Supports Playing Position Registered Per-Note Controller
D3 Note Off Velocity Supports Note Off Velocity to control Release Time
D4 Discovery of
Manufacturer
Specific Sounds
Supports a Profile Details Inquiry to discover which
Subclasses in Classifications 0x1A to 0x1F contain
sounds. See Section 9.2
D5-D13 Reserved
Figure 7 Bitmap Format

## Page 34

Each bit represents whether the feature is supported or not.
Table 22 Optional Features Supported Bytes 3-130
Size Description
16 bytes Declaration of Classification 0x10: Core Sounds – Sustains and Strikes
16 bytes Declaration of Classification 0x11: Staccatos and Shorts
16 bytes Declaration of Classification 0x12: Same Note Trills/Repeats/Tremolo
16 bytes Declaration of Classification 0x13: Intervallic Trills/Tremolo
16 bytes Declaration of Classification 0x14: Additional Colors - Sustained
16 bytes Declaration of Classification 0x15: Pitch and Dynamic Gestures
16 bytes Declaration of Classification 0x16: Scales, Runs, and Arpeggios
16 bytes Declaration of Classification 0x17: Effects and Noises
Each set of 16 Bytes for each Declaration of Classification declares the number of variations available in a
Receiver for each Subclass in that Classification. If a Receiver does not have any sounds for any Subclass, then it
shall declare 0 variations. See Table 23.
Note: If Classifications 0x18 and 0x19, which are currently reserved, are defined in the future, then this
data set might be expanded accordingly.
Table 23 The 16 Bytes in Every Declaration of Classification
Byte Description
1 Number of Variations for Subclass 0x0, Values 0 - 16
2 Number of Variations for Subclass 0x1, Values 0 - 16
3 Number of Variations for Subclass 0x2, Values 0 - 16
4 Number of Variations for Subclass 0x3, Values 0 - 16
5 Number of Variations for Subclass 0x4, Values 0 - 16
6 Number of Variations for Subclass 0x5, Values 0 - 16
7 Number of Variations for Subclass 0x6, Values 0 - 16
8 Number of Variations for Subclass 0x7, Values 0 - 16
9 Number of Variations for Subclass 0x8, Values 0 - 16
10 Number of Variations for Subclass 0x9, Values 0 - 16
11 Number of Variations for Subclass 0xA, Values 0 - 16

## Page 35

12 Number of Variations for Subclass 0xB, Values 0 - 16
13 Number of Variations for Subclass 0xC, Values 0 - 16
14 Number of Variations for Subclass 0xD, Values 0 - 16
15 Number of Variations for Subclass 0xE, Values 0 - 16
16 Number of Variations for Subclass 0xF, Values 0 - 16
9.2 Discovering Manufacturer Specific Sounds
If a Receiver declares in a Reply to Profile Details Inquiry message that it supports Discovery of Manufacturer
Specific Sounds as shown in Table 21 Optional Features Supported Bytes 1-2 (Receiver sets bit D4 high), then an
additional MIDI-CI Profile Details Inquiry mechanism may be used to discover which sounds the Receiver
contains in Classifications 0x1A-0x1F, Custom, Manufacturer/Device Specific Sounds.
9.2.1 Initiator Sends a MIDI-CI Profile Details Inquiry Message
A MIDI-CI Initiator may ask a Responder for a report of the Manufacturer Specific Sounds supported by the
Responder. This inquiry is made using a Profile Details Inquiry message with the Inquiry Target set to 0x40
(Profile Specific – Discover Manufacturer Specific Sounds).
9.2.2 Responder Sends a MIDI-CI Reply to Profile Details Inquiry Message
When a Responder which is a Receiver receives a Profile Details Inquiry message with the Inquiry Target set to
0x40, the Responder should send back a Reply to Profile Details Inquiry message.
The Inquiry Target Data field in the Reply to Profile Details Inquiry message has a Target Data set of 96 bytes to
declare the number of variations available (from 0 to 16) for each Subclass in Classifications 0x1A - 0x1F.
Table 24 Optional Features Supported Bytes 1-96
Size Description
16 bytes Declaration of Classification 0x1A
16 bytes Declaration of Classification 0x1B
16 bytes Declaration of Classification 0x1C
16 bytes Declaration of Classification 0x1D
16 bytes Declaration of Classification 0x1E
16 bytes Declaration of Classification 0x1F
Each set of 16 Bytes for each Declaration of Classification declares the number of variations available in a
Receiver for each Subclass in that Classification. If a Receiver does not have any sounds for any Subclass, then it
shall declare 0 variations. See Table 25.

## Page 36

Table 25 The 16 Bytes in Every Declaration of Classification
Byte Description
1 Number of Variations for Subclass 0x0, Values 0 - 16
2 Number of Variations for Subclass 0x1, Values 0 - 16
3 Number of Variations for Subclass 0x2, Values 0 - 16
4 Number of Variations for Subclass 0x3, Values 0 - 16
5 Number of Variations for Subclass 0x4, Values 0 - 16
6 Number of Variations for Subclass 0x5, Values 0 - 16
7 Number of Variations for Subclass 0x6, Values 0 - 16
8 Number of Variations for Subclass 0x7, Values 0 - 16
9 Number of Variations for Subclass 0x8, Values 0 - 16
10 Number of Variations for Subclass 0x9, Values 0 - 16
11 Number of Variations for Subclass 0xA, Values 0 - 16
12 Number of Variations for Subclass 0xB, Values 0 - 16
13 Number of Variations for Subclass 0xC, Values 0 - 16
14 Number of Variations for Subclass 0xD, Values 0 - 16
15 Number of Variations for Subclass 0xE, Values 0 - 16
16 Number of Variations for Subclass 0xF, Values 0 - 16

## Page 37

10 Relationship to Other Profiles
Devices which have the MIDI-CI Profile for Note On Selection of Orchestral Articulation enabled, should also
support and enable the Default Control Change Mapping Profile [MA07].

## Page 38

Appendix A : Application to Instrument Types
This appendix provides suggested implementations and application of articulations. Nothing described in this
appendix is mandatory and should not be considered as specification rules.
The tables of articulations in this Appendix are presented in the following format:
Figure 8 Articulation Table Explanation
Subclass Value and Type of Articulation.
Musical Instrument Type (See Table 26)
Applicability of the Articulation to Each Musical Instrument Type (see Table 27)
Table 26 Musical Instrument Type
Str Strings
Ww Woodwinds
Brs Brass
NoP Non-Pitched Percussion
TuP Tuned Percussion
Gui Guitar / Plucked
Hrp Harp
Kbd Keyboard / Organ
Chr Choir / Vocals
Table 27 Applicability to Musical Instrument Type
• Normally associated with this instrument type.
• Not typically associated with this instrument type, but
may have relevant application.
Unanticipated usage for this instrument type, but
assignment is not restricted.
Reserved. Do not use.

## Page 39

A.1 Attribute Type 0x10: Subclass = Core Sounds – Sustains and Strikes
Table 28 Applying 0x10 Core Sounds – Sustains and Strikes
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Normal Sustains & Strikes -
Primary/Default, (PART 1)* • • • • • • • • •
0x1 Normal Sustains & Strikes -
Primary/Default, (PART 2)* • • • • • • • • •
0x2 Legato and Legato Slurred • • • • •
0x3 Molto Legato • • • • •
0x4 Glissando • • • • •
0x5 Detaché •
0x6 Marcato and Accented • • • • • • • • •
0x7 Martelé •
0x8 Senza Vibrato • • • • • • •
0x9 Con Vibrato • • • • • •
0xA Synchronized Vibrato • •
0xB reserved
0xC reserved
0xD reserved
0xE reserved
0xF reserved
*Note: Space allocated for Normal Sustains & Strikes above is doubled here (uses 2 Subclasses) to
provide up to 32 variations of each.

## Page 40

A.2 Attribute Type 0x11: Classification = Staccatos and Shorts
Table 29 Applying 0x11 Staccatos and Shorts
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Normal Staccato Off String • • • • • • • • •
0x1 Normal Staccato On String •
0x2 Slurred Staccato (single bow staccato) •
0x3 Accented Staccato • • • • • • • • •
0x4 Staccatissimo • • • • • • • •
0x5 Spiccato • • • • • • • •
0x6 Sautillé •
0x7 Martellato •
0x8 Long Staccato or Mezzo Staccato or
Louré • • • • • • •
0x9 Portato • • • •
0xA Pizzicato •
0xB Bartok Pizzicato (or Harsh, Hard, Noisy
Notes) • • • • • • • • •
0xC Col Legno Battuto and Geschlagen •
0xD Col Legno Gestrichen •
0xE String Hand Tap • • • • • •
0xF Jete •

## Page 41

A.3 Attribute Type 0x12: Classification = Same Note Trills/Repeats
Table 30 Applying 0x12 Same Note Trills/Repeats
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Tremolo / Flutter tongue • • • • • • • • •
0x1 Growl / Razz • • • • • • • • •
0x2 Other Coloristic Tremolo • • • • • • • • •
0x3 One Note Trills • • • •
0x4 2 Repeats • • • • • • • •
0x5 3 Repeats • • • • • • • •
0x6 4 Repeats • • • • • • • •
0x7 5 Repeats • • • • • • • •
0x8 6 Repeats • • • • • • • •
0x9 Faster Repeats • • • • • • • •
0xA reserved
0xB reserved
0xC reserved
0xD reserved
0xE reserved
0xF reserved

## Page 42

A.4 Attribute Type 0x13: Classification = Intervallic Trills
Table 31 Applying 0x13 Intervallic Trills
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Half Step (Classical) • • • • • • •
0x1 Half Step (Baroque) • • • • • • •
0x2 Whole Step (Classical) • • • • • • •
0x3 Whole Step (Baroque) • • • • • • •
0x4 Minor 3rd • • • • • • • •
0x5 Major 3rd • • • • • • • •
0x6 Perfect 4 • • • • • • • •
0x7 Tritone • • • • • • • •
0x8 Perfect 5 • • • • • • • •
0x9 Minor 6 • • • • • • • •
0xA Major 6 • • • • • • • •
0xB Minor 7 • • • • • • • •
0xC Major 7 • • • • • • • •
0xD Octave • • • • • • • •
0xE reserved
0xF reserved

## Page 43

A.5 Attribute Type 0x14: Classification = Additional Colors - Sustained
Table 32 Applying 0x14 Additional Colors - Sustained
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Harmonics - Natural • • • • • • •
0x1 Harmonics - Artificial • • • • • • •
0x2 Col Legno Tratto •
0x3 Flautando • • •
0x4 Polyphony: multiple octaves • • • • • • • • •
0x5 Polyphony: intervals, chords, etc. • • • • • • • • •
0x6 Cuivré • • • •
0x7 Singing into Instrument • •
0x8 reserved
0x9 reserved
0xA reserved
0xB reserved
0xC reserved
0xD reserved
0xE reserved
0xF reserved

## Page 44

A.6 Attribute Type 0x15: Classification = Pitch and Dynamic Gestures
Table 33 Applying 0x15 Pitch and Dynamic Gestures
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Pitch Fall End - Pitch of Note Number.
Then falls at end of note • • • • • • •
0x1 Pitch Fall Start - pitch starts high falling
into Pitch of Note Number • • • • • • •
0x2 Pitch Rise End - Pitch of Note Number
then rises at the end note (doit and
others)
• • • • • • •
0x3 Pitch Rise Start - pitch starts low raising
into Pitch of Note Number (scoop, strings
portamento, Trumpet and French Horn
Rips and others)
• • • • • • •
0x4 Blue Note Down- Starts at MIDI pitch,
bends down and then back to pitch • • • • • •
0x5 Blue Note Up- Starts at MIDI pitch,
bends up and then back to pitch • • • • • •
0x6 Grace Notes "Classical" (Starts Below) • • • • • •
0x7 Grace Notes "Baroque" (Starts Above) • • • • • •
0x8 Shakes * * * • * * *
0x9 Crescendo • • • • • •
0xA Decrescendo • • • • • •
0xB Cres -> Decresc • • • • • •
0xC Decresc -> Cresc • • • • • •
0xD Sfz Crescendo • • • • • •
0xE reserved
0xF reserved

## Page 45

A.7 Attribute Type 0x16: Classification = Scales, Runs, and Arpeggios
Table 34 Applying 0x16 Scales, Runs, and Arpeggios
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Playable Runs • • • •
0x1 Playable Tremolos • • • •
0x2 Playable Glissando • • •
0x3 Scales/Runs Major • • • • • • •
0x4 Scales/Runs Minor • • • • • • •
0x5 Scales/Runs Dominant 7th • • • • • • •
0x6 Scales/Runs diminished (whole/half) or
Other 1 • • • • • • •
0x7 Scales/Runs diminished (half/whole) or
Other 2 • • • • • • •
0x8 Whole Tone Scale 1 (includes C) • • • • • • •
0x9 Whole Tone Scale 2 (incudes C#) • • • • • • •
0xA Pentatonic Scale (maj) • • • • • • •
0xB Pentatonic Scale (min) • • • • • • •
0xC Lydian • • • • • • •
0xD Lydian b7 • • • • • • •
0xE Chromatic • • • • • • •
0xF Other Scales and Runs • • • • • • •

## Page 46

A.8 Attribute Type 0x17: Classification = Effects and Noises
Table 35 Applying 0x17 Effects and Noises
Sub
Class
Articulation Str Ww Brs NoP TuP Gui Hrp Kbd Chr
0x0 Assorted noises, Air Sound, or effects -
Sustained • • • • • • • • •
0x1 Behind the Bridge - Sustained • • • • • • • • •
0x2 Random Pizz - Sustained • • • • • • • • •
0x3 Harmonic Glissando • • • • • • • • •
0x4 Random Glissando • • • • • • • • •
0x5 Air sound, Chiffs/Squeak/Lip-Pizz - Short • • • • • • • • •
0x6 Mechanical sounds - Sustained • • • • • • • • •
0x7 Mechanical sounds - Short • • • • • • • • •
0x8 Finger Glide •
0x9 Fret Buzz/Noise •
0xA Thump • • • • • • • •
0xB Knock • • • • • • •
0xC Slap • • • • • • •
0xD Pop • • • • • • •
0xE Tap • • • • • •
0xF Click • • • • • • • •

## Page 48

http://www.amei.or.jp https://www.midi.org
