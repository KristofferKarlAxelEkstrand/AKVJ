---
title: MIDI Polyphonic Expression (MPE) Profile
docId: M2-120-UM
version: 2.0.3
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-120-UM_v2-0-3_MIDI_Polyphonic_Expression_Profile.pdf
sourceType: online
pages: 33
sha256: f0f4132436ac9f2ead47d126ac826040a96b60880062a7db9e1e2bb711432420
extractedAt: 2026-07-16T12:54:04.709Z
summary: MIDI-CI Profile for MPE: per-note pitch bend, timbre, and pressure using channel rotation.
---
# MIDI Polyphonic Expression (MPE) Profile

## Page 1

MIDI-CI Profile for MIDI Polyphonic Expression
MIDI Association Document: M2-120-UM
Document Version 2.0.3
Draft Date 2024-01-24
Published 2024-02-16
Developed and Published By
The MIDI Association
and
Association of Musical Electronics Industry (AMEI)

## Page 2

PREFACE
MIDI Association Document M2-120-UM
MIDI-CI Profile for MIDI Polyphonic Expression
The MIDI Polyphonic Expression (MPE) specification defines an MMA/AMEI
Recommended Practice for hardware and software manufacturers to
communicate multidimensional control data between MIDI controller
instruments, synthesizers, digital audio workstations, and other products, using
MIDI messages. Please Note this document describes the MPE Profile for
MIDI-CI. For information on how to use Profiles please read the MIDI-CI and
Common Rules for MIDI-CI Profile Configuration specifications.
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
2024-02-16 2.0.3 Initial Release of MIDI-CI Profile implementation of MPE

## Page 4

Contents
Version History ........................................................................................................................................... 3
Contents ....................................................................................................................................................... 4
Figures ......................................................................................................................................................... 5
Tables ........................................................................................................................................................... 5
1 Introduction .......................................................................................................................................... 6
1.1 Executive Summary ...................................................................................................................... 6
1.2 Background................................................................................................................................... 6
1.3 References .................................................................................................................................... 7
1.3.1 Normative References....................................................................................................... 7
1.3.2 Informative References ..................................................................................................... 7
1.4 Terminology ................................................................................................................................. 8
1.4.1 Definitions ........................................................................................................................ 8
1.4.2 Reserved Words and Specification Conformance .......................................................... 10
1.4.3 Bit Scaling and Resolution ............................................................................................. 11
1.4.4 Data Values in This Specification................................................................................... 11
2 MPE Profile Overview ....................................................................................................................... 12
2.1 MPE Profile Functional Overview ............................................................................................. 12
2.2 Differences Between MPE (v1.1) and this MIDI-CI Profile for MPE ....................................... 12
3 Turning On and Configuring MPE Profile ..................................................................................... 13
3.1 Profile Details inquiry – How to Enable a Profile and Assign a Number of Channels .............. 13
3.2 Profile Id ..................................................................................................................................... 13
3.3 Receiver Behavior When Disabling an MPE Profile.................................................................. 14
3.4 How to Handle Overlapping Channels. ...................................................................................... 14
3.5 Pitch Bend Sensitivity ................................................................................................................ 14
3.6 Channel Response....................................................................................................................... 15
3.6.1 Polyphonic Channel Response ........................................................................................ 15
3.6.2 Monophonic Channel Response ..................................................................................... 15
3.6.3 Channel Response Type Notification ............................................................................. 15
3.7 Discovering Optional Features ................................................................................................... 16
3.7.1 Optional Features Profile Details Inquiry Message ........................................................ 16
3.7.2 Reply to Profile Details Inquiry Message ....................................................................... 17
3.7.3 Inquiry Target Data – Features Supported ...................................................................... 17
3.8 Discovering Mapping of MPE Controls ..................................................................................... 18
4 MPE Performance Messages............................................................................................................. 19
4.1 Messages Only on Manager Channel ......................................................................................... 19
4.2 Messages on Both Manager Channel and Member Channels .................................................... 19
4.3 Pitch Bend .................................................................................................................................. 19
4.4 Channel Pressure ........................................................................................................................ 20
4.5 Third Dimension of Control ....................................................................................................... 20
4.6 Channels for Program Change and Bank Selection .................................................................... 20

## Page 5

4.7 Channel Mode Messages ............................................................................................................ 21
4.8 Bipolar MPE Controllers ............................................................................................................ 21
4.9 Rules When Using Bipolar Controllers ...................................................................................... 22
4.10 Polyphonic Key Pressure ............................................................................................................ 22
4.11 MIDI 2 Per Note Controllers ...................................................................................................... 22
5 MPE Control Messages and Note On-Off Messages ....................................................................... 23
Appendix A : Example Turning on and Enabling a Profile ................................................................. 24
A.1 Step 1: Initiator Sends Profile Details Inquiry Message ............................................................... 24
A.2 Step 2: Responder Sends Reply to Profile Details Inquiry Message ............................................ 24
A.3 Step 3: Initiator Sends Set Profile On Message ............................................................................ 25
A.4 Step 4: Responder Sends Profile Enabled Message ..................................................................... 25
A.5 Step 5: Profile Enabled ................................................................................................................. 26
Appendix B : Allocation of Notes to Member Channels ....................................................................... 27
Appendix C : Example Pitch Bend Equations for Senders and Receivers .......................................... 28
C.1 Equations for Senders ................................................................................................................... 28
C.2 Sender Example ............................................................................................................................ 28
C.3 Equations for Receivers ................................................................................................................ 29
C.4 Receiver Example ......................................................................................................................... 29
Appendix D : Handling Channel Pressure and Third Dimension of Control ..................................... 31
Appendix E : MIDI Messages Used on MPE Channels ........................................................................ 32
Figures
Figure 1 Bitmap Format Per Byte............................................................................................................18
Tables
Table 1 Version History ..............................................................................................................................3
Table 2 Words Relating to Specification Conformance .........................................................................10
Table 3 Words Not Relating to Specification Conformance ..................................................................10
Table 4 MPE Profile Id .............................................................................................................................13
Table 5 Channel Response Type Notification .........................................................................................15
Table 6 Profile Details Inquiry Message ..................................................................................................16
Table 7 Reply to Profile Details Inquiry Message ..................................................................................17
Table 8 Profile Features Supported .........................................................................................................17
Table 9 MPE Expression Controllers ......................................................................................................22
Table 10 Note On Setup Controllers Example ........................................................................................23
Table 11 Negotiating Number of Channels Step 1 ..................................................................................24
Table 12 Negotiating Number of Channels Step 2 ..................................................................................24
Table 13 Negotiating Number of Channels Step 3 ..................................................................................25
Table 14 Negotiating Number of Channels Step 4 ..................................................................................25
Table 15 MIDI Messages Used on MPE Channels .................................................................................32

## Page 6

1 Introduction
1.1 Executive Summary
The MIDI-CI Profile for MIDI Polyphonic Expression (MPE) specification makes it possible for artists to perform
independent gestures for each musical note, with up to three dimensions of expression. With MPE, every note a
musician plays can be articulated individually for much greater expressiveness. MPE has broad support from
many DAWs, Synthesizers and Controllers.
The MIDI-CI Profile for MIDI Polyphonic Expression (MPE) specification defines an MMA/AMEI
Recommended Practice for hardware and software manufacturers to communicate multidimensional control data
between MIDI controller instruments, synthesizers, digital audio workstations, and other products, using MIDI
messages.
The specification describes a recommended way of using individual MIDI Channels to achieve per-note control,
enabling richer communication between increasingly expressive MIDI hardware and software.
1.2 Background
Profile Configuration is part of the MIDI Capability Inquiry (MIDI-CI) [MA03] specification and MIDI 2.0.
Profile Configuration is a method for two Devices to agree to use a common set of messages. Profiles are enabled
using System Exclusive Messages defined by MIDI-CI. This document defines only the messages used by the
Profile. For information on how to transmit and receive these MIDI-CI System Exclusive messages, see the MIDI
Capability Inquiry (MIDI-CI) [MA03] and M2-102-U Common Rules for MIDI-CI Profiles [MA04]
This specification is designed for MIDI Devices that allow the performer to vary the pitch and timbre of individual
notes while playing polyphonically. For example, in many of these MIDI Devices, pitch is expressed by lateral
motion on a continuous playing surface, while individual timbre changes are expressed by varying pressure, or
moving fingers towards and away from the player.
MPE 1.0 was designed to work with MIDI 1.0 messages, separating notes across multiple MIDI Channels. When
a single note is playing on an independent MIDI Channel, the controllers on that Channel may be used for
expression on that single note, separately from control of notes on other Channels. This allows each note to
respond independently to Pitch Bend or Control Change messages.
MIDI 2.0 provides mechanisms for Per-Note Controllers such that individual notes on a single MIDI Channel can
be independently controlled: these Per-Note controllers are not covered by the Profile. Instead, this Profile retains
the multi-Channel mechanisms of MPE 1.0, while adding the bidirectional auto configuration features of MIDI-
CI. This allows device implementations to use one set of fundamental control mechanisms. These same
mechanisms are used whether for MPE 1.0 (for backward compatibility to pre-existing MPE) or in a MIDI-CI
Profile environment.
These fundamental control mechanisms are defined in MPE 1.0 and the MPE Profile to provide three or more
dimensions of control — regardless of how a particular controller physically expresses them — and defines how
to configure Devices to send and receive this “multidimensional control data” for maximum interoperability.
MIDI Pitch Bend and Control Change messages are Channel Messages, meaning they affect all Active Notes
assigned to that Channel. To apply Channel Messages to individual notes, an MPE controller assigns each note its
own Channel.
The MPE Specification defines how to perform per-note control for Polyphonic Channel Response but will also
work with synthesizers that support Monophonic Channel Response with some restrictions.

## Page 7

1.3 References
1.3.1 Normative References
[MA01] Complete MIDI 1.0 Detailed Specification, Document Version 96.1, Third Edition, Association
of Musical Electronics Industry, http://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/
[MA02] M2-100-U MIDI 2.0 Specification Overview, Association of Musical Electronics Industry,
http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA03] M2-101-UM MIDI Capability Inquiry (MIDI-CI), Version 1.2, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA04] M2-102-U Common Rules for MIDI-CI Profiles, Version 1.1, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA05] M2-104-UM Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol, Version 1.1,
Association of Musical Electronics Industry, http://www.amei.or.jp/, and The MIDI Association,
https://www.midi.org/
[MA06] MIDI-CI Property Exchange Controller Resources, Version 0.61.0, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA07] MIDI 2.0 Bit Scaling and Resolution, Version 1.0.2, Association of Musical Electronics
Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA08] M1-101-UM MIDI Polyphonic Expression, Version 1.1, Association of Musical Electronics
Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA09] MIDI Polyphonic Expression (RP53), Version 1.0, Association of Musical Electronics Industry,
http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
[MA10] M1-117-UM Property Exchange Controller Resources, Version 1.0, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and The MIDI Association, https://www.midi.org/
1.3.2 Informative References
No informative references.

## Page 8

1.4 Terminology
1.4.1 Definitions
100-Cent Unit: A unit of measure for musical intervals, corresponding to one-twelfth of an octave measured
logarithmically. This term is preferred over “semitone” which may refer to various intervals.
Active Note: Any note for which a Note On message has been delivered, but a Note Off message has not.
AMEI: Association of Musical Electronics Industry. Authority for MIDI Specifications in Japan.
Device: An entity, whether hardware or software, which can send and/or receive MIDI messages and has one or
more functional subsystems which generate, consume, and/or route MIDI messages. A Device has one or more
MIDI inputs, outputs, or bidirectional connections for sending and/or receiving MIDI messages connected to its
functional subsystems.
HCU: See 100-Cent-Unit
MA: See MIDI Association.
Manager Channel: A MIDI Channel reserved for conveying messages that apply to the entire Zone.
Member Channel: Any MIDI Channel within a Zone that is not a Manager Channel.
MIDI 1.0 Specification: Complete MIDI 1.0 Detailed Specification, Document Version 96.1, Third Edition
[MA01]
MIDI Association: The public facing name that the MIDI Manufacturers Association uses as its DBA.
MIDI-CI: MIDI Capability Inquiry, a specification published by The MIDI Association and AMEI.
MIDI Polyphonic Expression (MPE): The specification that defines how MIDI Devices communicate
multidimensional control data. This document is the most current specification, and the original specification was
M1-101-UM MIDI Polyphonic Expression, Version 1.1 [MA08]
MIDI Transport: A hardware or software MIDI connection used by a Device to transmit and/or receive MIDI
messages to and/or from another Device.
MMA: See MIDI Manufacturers Association.
MIDI Manufacturers Association: A California nonprofit 501(c)6 trade organization, and the legal entity name
of the MIDI Association.
Monophonic Channel Response: Each Member Channel will only play one note at a time. Starting a note in such
a Channel, when one is already playing, shall stop the older note, possibly invoking a legato transition between the
old and the new notes.
Monotimbral: For Polyphonic Channel Response, Program Change is applied only to the Manager Channel and
all member Channels are set to the same program.
MPE: See MIDI Polyphonic Expression.
MPE Profile: Shorthand for MIDI-CI Profile for MIDI Polyphonic Expression
Multidimensional Control Data: MPE defines three or more dimensions of expression. It’s left to the
implementor of an MPE controller to determine what gestures are mapped to the three MPE expression messages.
Occupied Channel: A Member Channel with at least one Active Note.
Polyphonic Channel Response: Each Member Channel may play more than one note at a time. Starting a note in
such a Channel, when one is already playing, shall start a new note.
Receiver: A MIDI Device which has a MIDI Transport connected to its MIDI In. A MIDI Device is not required
to recognize or act upon any specific MIDI messages that it receives in order to be defined as a Receiver.

## Page 9

Released Note: A note for which a Note Off message has been processed. A Released Note may continue to
sound for considerable time, most often owing to the length of a release envelope or an interaction with the sustain
or sostenuto pedal.
Sender: A MIDI Device which transmits MIDI messages to a MIDI Transport which is connected to its MIDI Out
or to its MIDI Thru port.
Sounding Note: Any Active or Released Note that is still making sound.
Third Dimension of Control: In addition to Pitch Bend and Channel Pressure, MPE controllers may provide a
third dimension of continuous control using Control Change #74 (or RC Bank 0x20, index 0x21) see Section 4.5
Unoccupied Channel: A Channel for which all Active Notes have received Note Off messages.
Zone: Contiguous MIDI Channels comprising a Manager Channel and one or more Member Channels

## Page 10

1.4.2 Reserved Words and Specification Conformance
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

1.4.3 Bit Scaling and Resolution
For critical information on understanding resolution of various fields in MIDI messages in the UMP Format, see
the specification MIDI 2.0 Bit Scaling and Resolution [MA07] That document defines recommended practices
for scaling values, handling of stepped/enumerated values and translating values between MIDI 1.0 Protocol and
MIDI 2.0 Protocol and translation between MIDI 1.0 and MIDI 2.0 Messages.
1.4.4 Data Values in This Specification
Data values in this specification are expressed for both MIDI 1.0 (7/14 bit) and MIDI 2.0 (32 bit) form.

## Page 12

2 MPE Profile Overview
2.1 MPE Profile Functional Overview
The MPE Profile is a MIDI-CI Profile which conforms to the definition of a Multi-Channel Profile as defined in
the M2-102-U Common Rules for MIDI-CI Profiles [MA04] See Template Instructions:a)i)(1)(a)(i)Appendix A
“Turning On and Enabling a Profile”.
This overview summarizes the main elements of the MPE Profile specification, additional important details can be
found in later sections.
MPE Profile is switched on and configured using the following messages:
• MIDI-CI Profile Configuration mechanisms to setup the devices and enable the MPE Profile
• Registered Controller/RPN [0x00, 0x00] to change the Pitch Bend Sensitivity from the default MPE
Profile value of 48 HCUs, if desired or needed.
MPE offers per-note expressive control using the following messages:
• Note On/Off
• Pitch Bend
• Channel Pressure or alternatively, bipolar Registered Controller/RPN [0x20, 0x20]
• Third Dimension of Control using Control Change #74 or, alternatively, bipolar Registered
Controller/RPN [0x20, 0x21]
MPE uses the following mechanisms to coordinate per-note control:
• The range of Channels over which notes are sent and received can be set by enabling this Profile. The
MIDI Channel space can be divided into multiple Zones by enabling multiple MPE Profiles with nonoverlapping Channels.
• Each MPE Profile has a number of Member Channels for notes plus a dedicated extra Channel, called
the Manager Channel, which conveys information common to all Active Notes in that Zone. The
Manager Channel is always the lowest Channel in the Profile and is not used for notes.
• Wherever possible, every note is assigned its own Channel for the lifetime of that note. This allows
MPE messages to be addressed uniquely to that Active Note.
2.2 Differences Between MPE (v1.1) and this MIDI-CI Profile for MPE
There are a number of differences between MPE 1.1 and MPE Profile. Specifically:
• The Profile is receiver centric. The receiver will report back the range of Channels that it can support,
and the Sender will adapt.
• The MPE 1.1 configuration parameter formerly set by RPN 6 (MCM), is now handled by enabling an
MPE Profile using MIDI CI. See M2-102-U Common Rules for MIDI-CI Profiles [MA04].
• Multiple Zones are realized by enabling multiple MPE Profiles with non-overlapping Channels.
• The Manager Channel is always the lowest Channel in the Profile.
• Notes sent on the Manager Channel are not defined by this Profile.
• Because the Manager Channel is always the lowest Channel, the MPE 1.1 Upper Zone is not possible
with an MPE Profile.
• Profile Details Inquiry mechanism is used to determine the number of MIDI Channels which will be
used by MPE and to discover the Receiver's properties which are addressed by the MPE controls.
• There is no need to send Pitch Bend Sensitivity to every individual Member Channel, it is sent to the
Manager Channel only.

## Page 13

3 Turning On and Configuring MPE Profile
The following subsections specify how to turn MPE on, and how to configure MPE.
3.1 Profile Details inquiry – How to Enable a Profile and Assign a Number of
Channels
How Profiles are enabled is described in M2-102-U Common Rules for MIDI-CI Profiles [MA04]. A
generalization of how a Profile is enabled is as follows:
1. Initiator sends a “Profile Inquiry” message to discover which Profiles are supported by the Responder.
2. Responder sends a “Reply to Profile Inquiry” to declare a list of supported Profiles for each Channel.
3. Initiator sends a message to “Request Number of Channels Supported” plus “Optional Features Supported”.
The destination Channel for this message is the desired Manager Channel.
4. Responder sends a “Reply to Profile Details” Message for the Profile, declaring the maximum number of
Channels available and which optional features are supported.
5. Initiator sends a “Set Profile On” message with the desired number of Channels (shall not exceed the number
of Channels declared by the Responder in Step 4). The destination Channel of this message is the desired
Manager Channel.
6. Responder sends a “Profile Enabled” message which includes the number of Channels which have been
assigned.
7. MPE communication can begin.
A detailed example for how this works can be found in M2-102-U Common Rules for MIDI-CI Profiles [MA04]
See Template Instructions:a)i)(1)(a)(i)Appendix A “Turning On and Enabling a Profile”.
An example is also provided in Template Instructions:a)i)(1)(a)(i)Appendix A. Note that these may overlap with
examples provided in M2-102-U Common Rules for MIDI-CI Profiles [MA04].
3.2 Profile Id
The Profile Identifiers for the MPE Profile are as follows:
Table 4 MPE Profile Id
5 bytes Profile ID
Byte 1 0x7E (Standard Defined Profile)
Byte 2 0x31 (MPE Profile Bank)
Byte 3 0x00 (MPE Profile Number)
Byte 4 0x01 (MPE Profile Version)
Byte 5 0x01 (MPE Profile Level)

## Page 14

3.3 Receiver Behavior When Disabling an MPE Profile
To avoid the possibility of a Sender leaving a receiver with hanging Sounding Notes when changing Profiles, the
receiver shall stop all Sounding Notes and reset all controls to reasonable default values on each Channel when
entering or leaving MPE control.
3.4 How to Handle Overlapping Channels.
Multiple MPE Profiles can be optionally used on one Device. This is the equivalent of multiple Zones in MPE
version 1.0 and version 1.1.
MPE Profiles shall not use Channels which overlap with another instance of MPE Profile. If a Responder receives
a Set Profile On message on a Channel that is already part of an active MPE Profile, then the Device shall either
refuse the new Profile request (reply with a Profile Disabled Message for the new Profile) or disable the prior
existing MPE Profile (and reply with a Profile Disabled Message for the prior Profile) before enabling the new
MPE Profile. Which method of handling overlapping Channels is left to the manufacturer.
3.5 Pitch Bend Sensitivity
The Pitch Bend Sensitivity range of the Manager Channel and of every Member Channel shall be the same value
and shall always be set on the Manager Channel. The Pitch Bend Sensitivity range shall not be sent to the Member
Channels. Receivers shall respond to Pitch Bend Sensitivity on the Manager Channel.
The default value of 48 Hundred Cent Units (HCUs) shall be used at the time that the MPE Profile is enabled. The
sensitivity values may subsequently be changed at any time by using the Registered Controller/RPN [0x00, 0x00]
sent to the Manager Channel. MPE Devices should support the selection of the sensitivity from 0 to 96 HCUs.
MPE Devices should transmit the MSB with the integer number of HCUs and should set the LSB to zero.
In many cases, it is desirable to implement a narrower range of Pitch Bend response for the Manager Channel than
the response used on Member Channels. A Sender may implement a unique amount of Pitch Bend for the
Manager Channel using the following steps:
1. The Sender should set the value of the Registered Controller/RPN for Sensitivity to the widest Pitch Bend range
(usually the range for Member Channels).
2. When the Manager Channel requires a narrower Pitch Bend amount, the Sender should send Manager Channel
Pitch Bend messages with only a subset of the values from the whole range of available values. Pitch Bend
has sufficient resolution to provide smooth changes of pitch, even while using only a subset range of the total
available values.

## Page 15

3.6 Channel Response
Channel Response type is determined by the type of sound selected on the Receiver. Some sounds are intended to
be played monophonically, while others are polyphonically.
3.6.1 Polyphonic Channel Response
When MPE is used with Polyphonic Channel Response, a Channel is maximally polyphonic: it will handle as
many simultaneous notes as possible. An MPE controller shall assign every new note its own MIDI Channel, until
there are no unoccupied Channels available.
When there are more notes than unoccupied Channels, a new note shall share a MIDI Channel with an existing
note. Since Control Change, Registered Controller/RPNs, and Pitch Bend are Channel Messages, they then affect
all Active Notes on that Channel.
When there is more than one concurrent Active Note on a Member Channel, implementation of how controllers
affect the notes is up to the Device.
Note: Recommendations about the ordering of note and control messages in MPE that help to improve
compatibility, editability, and the quality of rendered sound are presented in Template
Instructions:a)i)(1)(a)(i)Appendix B
3.6.2 Monophonic Channel Response
When MPE is used with Monophonic Channel Response, starting a note in such a Channel when one is already
playing shall stop the older note, possibly invoking a legato transition between the old and the new notes.
Monophonic Channel Response is thus ideal for controllers that model stringed instruments, in which a ‘one
Channel per string’ allocation assists realistic rendering of hammer-on and pull-off.
MPE Devices are not required to support Monophonic Channel Response.
3.6.3 Channel Response Type Notification
The following optional Profile Specific Data is sent by the Receivers to notify Senders of a change in the Channel
Response Mode.
Table 5 Channel Response Type Notification
Value Parameter
F0 System Exclusive Start
7E Universal System Exclusive
1 byte Device ID: Source or Destination (depending on type of message):
00–0F: To/from MIDI Channels 1-16
0D Universal System Exclusive Sub-ID#1: MIDI-CI
0x2F Universal System Exclusive Sub-ID#2: Profile Specific Data
1 byte MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 bytes MPE Profile Id (0x7E 0x31 0x00 0x01 0x01)
0x01 0x00 0x00 0x00 Length of Following Profile Specific Data (LSB first)

## Page 16

1 bytes 0x00 - Polyphonic Channel Response
0x01 - Monophonic Channel Response
F7 End Universal System Exclusive
3.7 Discovering Optional Features
The following are defined as optional features:
• MPE devices are not required to use all three core MPE Expression Controllers.
• MPE devices may optionally and mutually exclusively use high resolution versions of Channel Pressure or
Third Dimension of Control Section 4.5
• MPE devices may optionally respond to Channel Response Type notification (Section 3.6.3)
Which optional features are supported by a Devices may be discovered using the MIDI-CI Profile Details Inquiry
mechanism as follows:
3.7.1 Optional Features Profile Details Inquiry Message
Table 6 Profile Details Inquiry Message
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
5 bytes MPE Profile Id (0x7E 0x31 0x00 0x01 0x01)
01 Inquiry Target: Profile Optional Features Supported
F7 End Universal System Exclusive

## Page 17

3.7.2 Reply to Profile Details Inquiry Message
Table 7 Reply to Profile Details Inquiry Message
Value Parameter
F0 System Exclusive Start
7E Universal System Exclusive
1 byte Destination
00–0F: To/from MIDI Channels 1-16
0D Universal System Exclusive Sub-ID#1: MIDI-CI
29 Universal System Exclusive Sub-ID#2: Reply to Profile Details Inquiry
02 MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 bytes MPE Profile Id (0x7E 0x31 0x00 0x01 0x01)
01 Inquiry Target: Profile Optional Features Supported
2 bytes Inquiry Target Data Length (dl) (LSB first)
4 bytes Inquiry Target Data – Features Supported
F7 End Universal System Exclusive
3.7.3 Inquiry Target Data – Features Supported
The Inquiry Target Data field declares features supported as follows:
Table 8 Profile Features Supported
Bytes Features Supported
Byte 1
(bitmap*)
D0: Supports Channel Response Type Notification
See Section 3.6
D1-D6: Reserved
Byte 2
(enum)
Pitch Bend:
See Section 4.3
0x00 - No Support
0x01 – Pitch Bend Supported
Byte 3
(enum)
Channel Pressure:
See Section 4.4
0x00 - No Support
0x01 - CC Only Supported
0x02 - Bipolar Controller Supported

## Page 18

Byte 4
(enum)
Third Dimension of Control
See Section 4.5
0x00 - No Support
0x01 - CC Only Supported
0x02 - Bipolar Controller Supported
*Bitmap fields in MIDI-CI messages are presented as follows:
Figure 1 Bitmap Format Per Byte
3.8 Discovering Mapping of MPE Controls
Property Exchange may be used to discover the mapping of MPE controls. This is generally used for display to the
user. Property Exchange may be used on both Manager and Member Channels. See the Property Exchange
Controller Resources specification [MA10].

## Page 19

4 MPE Performance Messages
The following subsections specify messages that are used during an MPE performance.
4.1 Messages Only on Manager Channel
An MPE Profile represents one polyphonic instrument in which certain MIDI messages, for example, Damper
Pedal, Course Tuning and Fine Tuning, can be expected to affect all Sounding Notes.
To reduce MIDI traffic and make event editing easier, those messages should be sent only for a Profile’s Manager
Channel (not on Member Channels). If an MPE Device receives any of those messages on a Member Channel, it
should ignore them. See Template Instructions:a)i)(1)(a)(i)Appendix E for a list of MIDI messages that are
Manager Channel Messages but not Member Channel Messages.
4.2 Messages on Both Manager Channel and Member Channels
Some MIDI messages are used on both the Manager Channel and on Member Channels. For example, Pitch Bend
messages from a pitch wheel on a typical MIDI controller affect all Sounding Notes, which makes them Manager
Channel Messages.
However, MPE defines Pitch Bend on a per Member Channel basis. Therefore, Pitch Bend is both a Manager
Channel Message and a Member Channel Message. If an MPE synthesizer receives Pitch Bend (for example) on
both a Manager and a Member Channel, it shall combine the data meaningfully.
The same is true for Channel Pressure, Control Change #74, and the Bipolar Controllers. See the table in
Template Instructions:a)i)(1)(a)(i)Appendix E for a list of MIDI messages that are both Manager Channel and
Member Channel Messages. Template Instructions:a)i)(1)(a)(i)Appendix D addresses MPE Receiver behavior
when these messages are sent both on the Manager Channel and on Member Channels, including suggested
implementation strategies for handling the possible interactions.
4.3 Pitch Bend
An MPE Device may send Pitch Bend messages on both the Manager Channel and on Member Channels. An
MPE Profile Receiver shall respond to Pitch Bend Messages on both the Manager Channel and the Member
Channels. On the Manager Channel, Pitch Bend is typically performed through movement of a global control (for
example, a pitch wheel or a tremolo bar). On Member Channels, Pitch Bend is typically performed by the
movement of a single finger on the playing surface.
The pitch of a new note is affected by the Pitch Bend message most recently received on both the Manager
Channel and that note’s Member Channel before Note On. A receiver shall continue to track Pitch Bend messages
from both the Manager Channel and the Member Channels even when no note is playing. Messages on the
Manager Channel continue to affect all Sounding Notes even after the Note Off message occurs. A Released Note
shall cease to be affected by Pitch Bend messages from the Member Channels after the Note Off message occurs.
Because Pitch Bend may span across multiple semitones, Pitch Bend should be linear across the sensitivity range.
See Section 3.5 for Pitch Bend Sensitivity

## Page 20

4.4 Channel Pressure
An MPE Device may send Channel Pressure messages both on the Manager Channel and on Member Channels to
convey pressure. An MPE Profile Receiver shall respond to Channel Pressure Messages on both the Manager
Channel and the Member Channels.
The control of a new note is affected by the Channel Pressure message most recently received on its Channel
before Note On. A receiver shall continue to track Channel Pressure messages even when no note is playing.
Channel Pressure also influences the note’s initial state. The note will cease to be affected by Channel Pressure
messages on its Channel after the Note Off message occurs.
If a Device receives Channel Pressure on both a Manager Channel and a Member Channel, then it shall combine
such data meaningfully and separately for each Sounding Note. It’s left to the manufacturer how to meaningfully
combine Manager Channel and Member Channel, Channel Pressure data.
Registered Controller/RPN 0x20,0x20 may be used as a Bipolar alternative to Channel Pressure. All of the above
rules will apply to the Registered Controller/RPN. See Section 4.8.
A number of examples and strategies are provided in Template Instructions:a)i)(1)(a)(i)Appendix D.
4.5 Third Dimension of Control
In addition to Pitch Bend and Channel Pressure, MPE controllers may provide a third dimension of continuous
control. For example, some instruments inspired by the piano keyboard can track finger movement along the
length of the key. This additional dimension is mapped to Control Change #74.
An MPE Device may send Control Change #74 messages both on the Manager Channel and on Member
Channels. An MPE Profile Receiver shall respond to the Third Dimension of Control on both the Manager
Channel and the Member Channels.
The control of a new note is affected by a Control Change #74 message most recently received on its Channel
before Note On. Thus, a receiver shall continue to track Control Change #74 messages even when no note is
playing. Control Change #74 also influences the note’s initial state. The note will cease to be affected by Control
Change #74 messages on its Channel after the Note Off message occurs.
If a Device receives Control Change #74 on both a Manager Channel and Member Channels, it shall combine
such data meaningfully and separately for each Sounding Note. It’s left to the manufacturer how to meaningfully
combine this data.
A number of examples and strategies are provided in Template Instructions:a)i)(1)(a)(i)Appendix D.
Registered Controller/RPN 0x20,0x21 may be used as a Bipolar alternative to Control Change #74. All of the
above rules will apply to the Registered Controller/RPN. See Section 4.8.
4.6 Channels for Program Change and Bank Selection
In Polyphonic Channel Response mode, a Sender may send Program Change/Bank Select (Control Change #0,
Control Change #32) on the Manager Channel and shall not send Program Change/Bank Select on the Member

## Page 21

Channels. A Receiver shall respond to Program Change/Bank Select on the Manager Channel and shall not
respond to Program Change/Bank Select on Member Channels.
In Monophonic Channel Response mode, a Sender may send Program Change/Bank Select Messages on
individual Member Channels for a multitimbral response. A Receiver shall respond to Program Change/Bank
Select on the Manager Channel and may respond to Program Change/Bank Select on Member Channels.
4.7 Channel Mode Messages
Here are rules regarding how Channel Mode Messages are handled by Senders and Receivers.
• Control Change #120, [All Sounds Off] , Senders may optionally send this message on either the
Manager or Member Channels. Receivers should respond to it on both the Master and Member
Channels
• Control Change #121 [Reset All Controllers] – Senders may optionally send this message on the
Manager Channel. Receivers shall respond to it on the Manager Channel. Senders shall not send this
message on the Member Channels and Receivers shall not respond to it on the Member Channels.
• Control Change #123[All Notes Off] - Senders may optionally send this message on the Manager
Channel. Receivers shall respond to it on the Manager Channel. Senders shall not send this message
on the Member Channels and Receivers shall not respond to it on the Member Channels.
• Control Change #124 [Omni Off] – Senders shall not send this message to either the Manager or
Member Channels. Receivers shall not respond to this message on either the Manager or Member
Channels.
• Control Change #125 [Omni On] – Senders shall not send this message to either the Manager or
Member Channels. Receivers shall not respond to this message on either the Manager or Member
Channels.
• Control Change #126 [Mono Mode On] – Senders shall not send this message to either the Manager
or Member Channels. Receivers shall not respond to this message on either the Manager or Member
Channels.
• Control Change #127 [Poly Mode On] – Senders shall not send this message to either the Manager or
Member Channels. Receivers shall not respond to this message on either the Manager or Member
Channels.
4.8 Bipolar MPE Controllers
The MPE Profile uses the 7-bit and 14-bit controllers of MIDI 1.0 Protocol. MPE uses three expression controllers
by default: Pitch Bend, Channel Pressure, and Control Change #74. MPE enabled using a Profile may optionally

## Page 22

use two Registered Controllers/RPNs for bipolar control with higher resolution to replace Channel Pressure,
Control Change #74, or both.
4.9 Rules When Using Bipolar Controllers
Here are rules defining the use of the Expression Controllers:
• MPE Profile Devices shall use the Profile Details Inquiry mechanism to discover if they will use the
default Controllers or the alternate Bipolar Controllers.
• Bipolar Controllers don't have to be enabled. When a Receiver responds positively to the Profile
Details Inquiry, a Sender can decide to use the Bipolar Registered Controller/RPNs without
additional coordination.
• If an MPE Receiver supports Bipolar Pressure Registered Controller/RPN and the MPE Sender
decides to send Bipolar Pressure Registered Controller/RPN, then the Sender shall not send Channel
Pressure messages.
• If an MPE Receiver supports Third Dimension of Control Controller/RPN and the MPE Sender
decides to send Bipolar Third Dimension of Control Registered Controller/RPN, then the Sender
shall not send Control Change #74 messages.
• When Bipolar Controllers are being used:
o They shall be used by both the Manager and the Member Channels.
o When using RPNs, the data field shall be an unsigned bipolar value, centered at 0x2000.
o When using Registered Controllers, the data field shall be an unsigned bipolar value,
centered at 0x80000000.
o When using RPNs, Senders shall send data atomically as 2 messages (MSB followed by
LSB), and receivers shall wait until they receive both the MSB and LSB values.
o When a Sender has a property which is not bipolar, the Sender shall send only the upper half
of the total range.
• For information about scaling between MIDI 1.0 and MIDI 2.0 see MIDI 2.0 Bit Scaling and
Resolution [MA07]
Table 9 MPE Expression Controllers
Property (in Priority
Order)
Controller Alternate Bipolar Controller
Pitch Bend Pitch Bend Pitch Bend
Pressure Channel Pressure RPN MSB/RC Bank
0x20
RPN LSB/RC Index
0x20
Third Dimension of
Control
Control Change #74 RPN MSB/RC Bank
0x20
RPN LSB/RC Index
0x21
4.10 Polyphonic Key Pressure
Response to Polyphonic Key Pressure is not defined by this Profile.
4.11 MIDI 2 Per Note Controllers
Response to MIDI 2 Per Note Controllers is not defined by this Profile.

## Page 23

5 MPE Control Messages and Note On-Off Messages
Senders that use MPE Controllers or alternate Bipolar Controllers should send initial values for these controllers
before a Note On message. The order in which these Controllers are sent does not matter. Senders that also use
other controller messages may decide whether sending an initial value for those controllers is necessary or not.
If the Sender does not use this mechanism, the Receiver will likely play notes with its own current values for these
properties, which might not match the user intention or expectation.
To play a note that sounds one quarter tone above middle C, with an initial timbre value, the following controllers
would be sent prior to the Note On (using MIDI Channel 3 as an example):
Table 10 Note On Setup Controllers Example
Message
Sequence Description Effect
1 Pitch Bend Pitch Bend is sent Quartertone bend
upwards, assuming sensitivity has been set
to 48 HCUs. This is to ensure that the
Channel already has a Pitch Bend value
before the Note On message.
2 Third Dimension of
Control.
Control Change #74 or Bipolar Controller
(0x20, 0x21) with an initial value for timbre.
This is to ensure that the Channel already
has a Third Dimension of Control value
before the Note On message.
3 Channel Pressure Set to zero Template
Instructions:a)i)(1)(a)(i)Appendix D
4 Note On Note = Middle C
with a velocity

## Page 24

Appendix A : Example Turning on and Enabling a Profile
A.1 Step 1: Initiator Sends Profile Details Inquiry Message
Table 11 Negotiating Number of Channels Step 1
Value Parameter
F0 System Exclusive Start
7E Universal System Exclusive
1 byte Device ID: Source or Destination (depending on type of message):
00–0F: To/from MIDI Channels 1-16 (set to desired Manager Channel)
0D Universal System Exclusive Sub-ID#1: MIDI-CI
0x28 Universal System Exclusive Sub-ID#2: Inquiry: Profile Details Inquiry Message
1 byte MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 bytes MPE Profile Id (0x7E 0x31 0x00 0x01 0x01)
0x00 Inquiry Target = Number of MIDI Channels
F7 End Universal System Exclusive
A.2 Step 2: Responder Sends Reply to Profile Details Inquiry Message
Table 12 Negotiating Number of Channels Step 2
Value Parameter
F0 System Exclusive Start
7E Universal System Exclusive
1 byte Device ID: Source or Destination (depending on type of message):
00–0F: To/from MIDI Channels 1-16 (set to requested Manager Channel)
0D Universal System Exclusive Sub-ID#1: MIDI-CI
0x29 Universal System Exclusive Sub-ID#2: Inquiry: Reply to Profile Details Message
1 byte MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 bytes MPE Profile Id (0x7E 0x31 0x00 0x01 0x01)
0x00 Inquiry Target = Number of MIDI Channels
0x04 0x00 Inquiry Target Data length = 4

## Page 25

2 bytes The number of Channels currently in use by this Profile.
Value = Total Number of Channels, including Manager and Member Channels. (LSB First). If
the Profile is not currently enabled, set to 0x00 0x00.
2 bytes Maximum Number of Channels (available for use by this Profile).
Value = Total number of Channels, including Manager and Member Channels. (LSB first)
F7 End Universal System Exclusive
A.3 Step 3: Initiator Sends Set Profile On Message
Table 13 Negotiating Number of Channels Step 3
Value Parameter
0xF0 System Exclusive Start
0x7E Universal System Exclusive
1 byte Destination
00–0F: To/from MIDI Channels 1-16 (set to desired Manager Channel)
0x0D Universal System Exclusive Sub-ID#1: MIDI-CI
0x22 Universal System Exclusive Sub-ID#2: Set Profile On
1 byte MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 bytes Profile ID of Profile to be Set to On (to be enabled) (0x7E 0x31 0x00 0x01 0x01)
The following fields (except F7 End) were added in MIDI-CI Message Version 2
2 bytes Number of Channels Requested (LSB First) to assign to this Profile when it is enabled
0xF7 End Universal System Exclusive
The value of the Number of Channels field shall not be higher than the Maximum Number of Channels declared
by the Responder in Step 2.
A.4 Step 4: Responder Sends Profile Enabled Message
Table 14 Negotiating Number of Channels Step 4
Value Parameter
0xF0 System Exclusive Start
0x7E Universal System Exclusive
1 byte Destination
00–0F: To/from MIDI Channels 1-16 (set to enabled Manager Channel)
0x0D Universal System Exclusive Sub-ID#1: MIDI-CI
0x24 Universal System Exclusive Sub-ID#2: Inquiry: Profile Enabled

## Page 26

0x02 MIDI-CI Message Version/Format
4 bytes Source MUID (LSB first)
4 bytes Destination MUID (LSB first)
5 byte MPE Profile Id (0x7E 0x31 0x00 0x01 0x01)
The following fields (except F7 End) were added in MIDI-CI Message Version 2
2 bytes Number of Channels enabled on this Profile. (Manager + Member Channels, LSB first)
0xF7 End Universal System Exclusive
A.5 Step 5: Profile Enabled
Initiator knows that the Profile is enabled and how many Channels have been allocated.

## Page 27

Appendix B : Allocation of Notes to Member Channels
An MPE Sender determines the allocation of each note to a Channel. The following considerations should be
taken into account when designing the Sender’s Channel allocation algorithm for MPE notes:
• Simple circular assignment of new notes to Member Channels of an active MPE Profile will not usually provide
satisfactory results. In the simplest workable implementation, a new note will be assigned to the Channel with
the lowest count of Active Notes. Typically, the Channel with the oldest last Note Off would be preferred.
• Senders can preferentially re-use a Channel that has been most recently deployed to play a certain Note Number
once the previous note has entered its Note Off state.
• In particular circumstances it is appropriate to have the same Note Number active on two different MIDI
Channels. For example, a note may start at a certain pitch and be bent to another before a second note is
initiated at the original pitch. Alternatively, a guitar-type controller might permit the same pitch to be played
simultaneously on different strings.

## Page 28

Appendix C : Example Pitch Bend Equations for Senders and
Receivers
C.1 Equations for Senders
If an MPE controller sends Pitch Bend on a Member Channel or Manager Channel in a pitch-precise way
dependent on the active Pitch Bend Sensitivity, it could calculate the data in the following way. Note that this is
purposefully asymmetrical with the equations for Receivers described below due to the neutral Pitch Bend value
making the upwards range being different from the downwards range by 1.
The examples presented here use a single linear equation in order to remain as close to M1-101-UM MIDI
Polyphonic Expression, Version 1.1 [MA08] as possible and to focus on how to handle Pitch Bend across
member and manager channels. MIDI 2.0 recommends Min-Center-Max as the scaling method, as detailed in the
MIDI 2.0 Bit Scaling and Resolution [MA07] document, which preserves compatibility in all translation
scenarios.
While these equations have been carefully designed for maximal correctness in the integer domain, floating point
precision is recommended for these calculations.
• With pbSense the +/- range of Pitch Bend in HCUs and pbMem the Pitch Bend for the Member
Channel, the Pitch Bend value for the Member Channel is pbValMem:
MIDI 1.0 Protocol:
pbValMem = min((pbMem * 0x2000 / pbSense) + 0x2000, 0x3FFF)
MIDI 2.0 Protocol:
pbValMem = min((pbMem * 0x80000000 / pbSense) + 0x80000000, 0xFFFFFFFF)
• With pbSense the +/- range of Pitch Bend in HCUs and pbMan the Pitch Bend for the Manager
Channel, the Pitch Bend value for the Manager Channel is pbValMan:
MIDI 1.0 Protocol:
pbValMan = min((pbMan * 0x2000 / pbSense) + 0x2000, 0x3FFF)
MIDI 2.0 Protocol:
pbValMan = min((pbMan * 0x80000000 / pbSense) + 0x80000000, 0xFFFFFFFF)
C.2 Sender Example
• The Pitch Bend Sensitivity is 48 HCUs.
• The Member Channel has a Pitch Bend of +7 HCUs
• The Manager Channel has Pitch Bend of +2 HCUs
• Here is an example of the computation:
MIDI 1.0 Protocol:
pbValMem = min((7 * 0x2000 / 48) + 0x2000, 0x3FFF)
= 0x24AB Pitch Bend value
pbValMan = min((2 * 0x2000 / 48) + 0x2000, 0x3FFF)

## Page 29

= 0x2155 Pitch Bend value
MIDI 2.0 Protocol:
pbValMem = min((7 * 0x80000000 / 48) + 0x80000000, 0xFFFFFFFF)
= 0x92AAAAAB Pitch Bend value
pbValMan = min((2 * 0x80000000 / 48) + 0x80000000, 0xFFFFFFFF)
= 0x85555555 Pitch Bend value
C.3 Equations for Receivers
If an MPE synthesizer receives Pitch Bend on a Manager and a Member Channel, it could combine the data in the
following way
• With pbSense being the +/- range of Pitch Bend in HCUs. The Pitch Bend in HCUs for the
Manager Channel is:
MIDI 1.0 Protocol:
pMan = max(pbSense * (pbValMan – 0x2000) / 0x1FFF, -pbSense)
MIDI 2.0 Protocol:
pMan = max(pbSense * (pbValMan - 0x80000000) / 0x7FFFFFFF, -pbSense)
• With pbSense the +/- range of Pitch Bend in HCUs. The Pitch Bend in HCUs for the Member
Channel is:
MIDI 1.0 Protocol:
pMem = max(pbSense * (pbValMan - 0x2000) / 0x1FFF, -pbSense)
MIDI 2.0 Protocol:
pMem = max(pbSense * (pbValMan - 0x80000000) / 0x7FFFFFFF, -pbSense)
• The total Pitch Bend sum of Manager Channel and Member Channel Pitch Bends in HCUs.
pbTotal = pbMan + pbMem
• The variables pbMan and pbMem should be stateful so that when pbTotal is computed it is the sum of
the most recent values for these variables.
C.4 Receiver Example
• The Pitch Bend Sensitivity is 48 HCUs.
• The manager Channel has Pitch Bend of +2 HCUs with values
MIDI 1.0: 0x2155
MIDI 2.0: 0x85555555
• The member Channel has a Pitch Bend of +7 HCUs with a values
MIDI 1.0: 0x24AB
MIDI 2.0: 0x92AAAAAB
• Here is an example of the computation:

## Page 30

MIDI 1.0 Protocol:
pbMan = max(48 * (0x2155 - 0x2000) / 0x1FFF, -48)
= 2 HCUs
pbMem = max(48 * (0x24AB - 0x2000) / 0x1FFF, -48)
= 7 HCUs
pbTotal = 9 HCUs
MIDI 2.0 Protocol:
pbMan = max(48 * (0x85555555 - 0x80000000) / 0x7FFFFFFF, -48)
= 2 HCUs
pbMem = max(48 * (0x92AAAAAB - 0x80000000) / 0x7FFFFFFF, -48)
= 7 HCUs
pbTotal = 9 HCUs

## Page 31

Appendix D : Handling Channel Pressure and Third Dimension
of Control
Typical uses for Channel Pressure and/or Control Change #74 might be for volume (a swell), expression, or a
filter cutoff.
Channel Pressure is often generated by a pressure sensor and typically starts with a value of 0x00 at the time of
Note On, and typically ends with 0x00 at the time of Note Off. Some controllers may use Channer Pressure in a
different way, for instance starting with a non-zero Channel Pressure value before a Note On message.
Control Change #74 is often generated by a vertical position on a key. Note that Control Change #74 might not
necessarily start from, or end with a value of 0x00.
A receiver might need to apply these controls from both the Manager Channels and the Member Channels for a
Sounding Note. There are several possible ways that these controls might be combined, the actual implementation
is left to the manufacturer. For example:
• Add: The two controller values might be added together. As an example, Control Change #74 might
be used to control a filter cutoff on a per Member Channel basis. The Manager Channel might also
send a value for Control Change #74 which is intended to be a bias or Manager offset.
• Max: The max value of the two controller values might be used. As an example, Channel Pressure
might be used to control volume (a swell) on a per Member Channel basis. The Manager Channel
might also send a value for Channel Pressure which serves as an offset from the Sounding Note’s
current value.
• Custom: Manufacturers may choose to create an algorithm for combining Manager and Member
Channel Expression.
These same handling concepts can be applied to Bipolar Controllers

## Page 32

Appendix E : MIDI Messages Used on MPE Channels
Table 15 MIDI Messages Used on MPE Channels
MIDI Message or Feature
Manager
Channel
Member
Channels Details
Tx Rx Tx Rx
Registered Controller/RPN #0 [Pitch Bend
Sensitivity]
O M P P See Section 3.5
Pitch Bend
Channel Pressure or
Registered Controller/RPN 0x20 0x20
Third Dimension of Control:
Control Change #74 or
Registered Controller/RPN 0x20 0x21
O
O
O
M
M
M
O
O
O
M
M
M
See Section 4.3
See Section 4.4
See Section 4.8
See Section 4.5
See Section 4.8
MIDI Mode Messages
Control Change #120 [All Sounds Off]
Control Change #121 [Reset all CC]
Control Change #123 [All Notes Off]
Control Change #124 [Omni Off]
Control Change #125 [Omni On]
O
O
O
P
P
O
M
M
P
P
O
P
P
P
P
O
P
P
P
P
See Section 4.7
Control Change #126 [Mono Mode On]
Control Change #127 [Poly Mode On]
P
P
P
P
P
P
P
P
See Section 3.6.3
Lowest Member Channel
Program Change
Bank Select Control Change #0 and
Control Change #32
O
O
O
M
M
M
P/O
P/O
P/O
P/O
P/O
P/O
See Section 3.6 and 4.6
Refer to monophonic and
polyphonic Channel response
for the rules around the
allowance for these
messages.
Note On/Off messages U U M M See Section 5
Tx: Transmit Rx: Receive
M: Mandatory O: Optional P: Prohibited U: Undefined
Note: Messages tagged as Undefined are not used in the context of this MPE Profile but are included in this table
because they were defined in MPE version 1.0/1.1.

## Page 33

http://www.amei.or.jp https://www.midi.org
