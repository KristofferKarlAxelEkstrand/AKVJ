---
title: Property Exchange LocalOn Resource
docId: M2-109-UM
version: 1.01
protocol: midi2
source: https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-109-UM_v1-01_LocalOn_Resource.pdf
sourceType: online
pages: 8
sha256: a0516375e2281943f4db4ae236b905dc6729e952e3c6d50dacccb0ef6c1f7116
extractedAt: 2026-07-16T12:54:03.293Z
summary: Property Exchange resource for Local Control on/off state.
---
# Property Exchange LocalOn Resource

## Page 1

MIDI-CI Property Exchange
LocalOn Resource
Version 1.01
November 24, 2020
Document M2-109-UM
Published By:
Association of Musical Electronics Industry
http://www.amei.or.jp
and
The MIDI Association
https://www.midi.org

## Page 2

PREFACE
Property Exchange is part of the MIDI-CI specifications first released in 2018. Property
Exchange is a method for sending JSON over SysEx between two devices to get and set device
properties. Each MIDI device is unique and provides an experience different from another
device. Property Exchange allows you to discover and use almost any device in a consistent way.
This document describes the Property Data for these Resources. For information on how to
transmit and receive Property Data over SysEx please see the MIDI-CI [MMA02] and Common
Rules for MIDI-CI Property Exchange [MMA03].
©2020 Association of Musical Electronics Industry (AMEI)(Japan)
©2020 MIDI Manufacturers Association Incorporated (MMA)(Worldwide except Japan)
ALL RIGHTS RESERVED. NO PART OF THIS DOCUMENT MAY BE REPRODUCED OR
TRANSMITTED IN ANY FORM OR BY ANY MEANS, ELECTRONIC OR MECHANICAL,
INCLUDING INFORMATION STORAGE AND RETRIEVAL SYSTEMS, WITHOUT
PERMISSION IN WRITING FROM THE MIDI MANUFACTURERS ASSOCIATION.
https://www.midi.org
http://www.amei.or.jp

## Page 3

Version 1.01 	Page iii 	Nov. 17, 2020
Table of Contents
1. 	Introduction ........................................................................................................................................... 1
1.1 	Background ................................................................................................................................... 1
1.2 	Related Documents ....................................................................................................................... 1
1.3 	Terminology .................................................................................................................................. 1
1.4 	Reserved Words and Specification Conformance......................................................................... 2
2. 	LocalOn Resource ................................................................................................................................. 3
2.1 	Introduction ................................................................................................................................... 3
2.2 	Initiator Requests Data from a Responder Using an Inquiry: Get Property Data ......................... 3
2.3 	Request using Inquiry: Set Property ............................................................................................. 3
2.4 	"ResourceList" Integration for LocalOn ....................................................................................... 4
Revision History ........................................................................................................................................... 5

## Page 4

1. Introduction
1.1 Background
Property Exchange is part of the MIDI Capability Inquiry (MIDI-CI) [MMA02] specification
and MIDI 2.0. Property Exchange is a method for getting and setting various data, called
Resources, between two Devices. Resources are exchanged inside two payload fields of System
Exclusive Messages defined by MIDI-CI, the Header Data field and Property Data field. This
document defines only the contents of the Header Data and Property Data fields. For information
on how to transmit and receive these Resource payloads inside MIDI-CI System Exclusive
messages, see the MIDI Capability Inquiry specification [MMA02] and Common Rules for
MIDI-CI Property Exchange specification [MMA03].
This document defines the LocalOn Resource which uses Property Exchange to Get and Set the
"Local On/Off" setting of a Property Exchange Device.
1.2 Related Documents
[MMA01] 	The Complete MIDI 1.0 Detailed Specification, Document Version 96.1, Third
Edition, Association of Musical Electronics Industry, http://www.amei.or.jp/, and
MIDI Manufacturers Association, https://www.midi.org/.
[MMA02] 	MIDI Capability Inquiry (MIDI-CI), Version 1.1, Association of Musical
Electronics Industry, http://www.amei.or.jp/, and MIDI Manufacturers
Association, https://www.midi.org/.
[MMA03] 	Common Rules for MIDI-CI Property Exchange, Version 1.1, Association of
Musical Electronics Industry, http://www.amei.or.jp/, and MIDI Manufacturers
Association, https://www.midi.org/.
1.3 Terminology
Device: An entity, whether hardware or software, which can send and/or receive MIDI
messages.
Property: A JSON key:value pair used by Property Exchange.
Property Data: A set of one or more Properties in a Device which are accessible by Property
Exchange. Contained in the Property Data field of a MIDI-CI Property Exchange message.
Property Exchange: an AMEI/MMA specification which is the basis for this specification, in
which one Device may access Property Data from another Device.
Property Exchange Device: A Device which implements Property Exchange.
Property Key: the key in a JSON key:value pair used by Property Exchange.
Property Value: the value in a JSON key:value pair used by Property Exchange.
Resource: A defined Property Data with an associated inquiry for accessing the Property Data.
Simple Property Resource: A Resource that defines only a single Property which includes only
a Property Value, without the Property Key, in the Property Data.

## Page 5

1.4 Reserved Words and Specification Conformance
In this document, the following words are used solely to distinguish what is required to conform
to this specification, what is recommended but not required for conformance, and what is
permitted but not required for conformance:
Table 1 Words Relating to Specification Conformance
Word 	Reserved For 	Relation to Spec Conformance
shall 	Statements of requirement 	Mandatory.
A conformant implementation conforms to all ’shall’ statements.
should 	Statements of recommendation 	Recommended but not mandatory.
An implementation that does not conform to some or all ‘should’
statements is still conformant, providing all ’shall’ statements are
conformed to.
may 	Statements of permission 	Optional.
An implementation that does not conform to some or all ’may’
statements is still conformant, providing all ’shall’ statements are
conformed to.
By contrast, in this document, the following words are never used for specification conformance
statements; they are used solely for descriptive and explanatory purposes:
Table 2 Words Not Relating to Specification Conformance
Word 	Reserved For 	Notes
must 	Statements of unavoidability 	Describes an action to be taken that, while not required (or at least
not directly required) by this specification, is unavoidable.
Not used for statements of conformance requirement (see ’shall’
above).
will 	Statements of fact 	Describes a condition that as a question of fact is necessarily going
to be true, or an action that as a question of fact is necessarily going
to occur, but not as a requirement (or at least not as a direct
requirement) of this specification.
Not used for statements of conformance requirements (see ‘shall’
above).
can 	Statements of capability 	Describes a condition or action that a system element is capable of
possessing or taking.
Not used for statements of conformance permission (see ‘may’
above).
might 	Statements of possibility 	Describes a condition or action that a system element is capable of
electing to possess or take.
Not used for statements of conformance permission (see ‘may’
above).

## Page 6

2. LocalOn Resource
2.1 Introduction
"LocalOn" is a Simple Property Resource which allows an Initiator to manage the Local On/Off
switch of a Responder. Many Devices have both a tone generator and an attached keyboard (or
other similar local input). These Devices may have a Local On/Off switch to select if the local
input talks directly to the tone generator.
2.2 Initiator Requests Data from a Responder Using an
Inquiry: Get Property Data
An Initiator may request the "LocalOn" Resource from a Responder using an Inquiry: Get
Property Data message.
If set to true, then Local On/Off is set to On. If set to false, then Local On/Off is set to Off.
Initiator Sends Inquiry: Get Property Data Message
Header Data 	{"resource":"LocalOn"}
Property Data 	none
Responder Sends Reply to Get Property Data Message
Header Data 	{"status":200}
Property Data 	false
2.3 Request using Inquiry: Set Property
An Initiator may send the Property Data to a Responder for the "LocalOn" Resource using an
Inquiry: Set Property Data message.
Initiator Sends Inquiry: Set Property Data Message
Header Data 	{"resource":"LocalOn"}
Property Data 	true
Responder Sends Reply to Set Property Data Message
Header Data 	{"status":200}
Property Data 	none

## Page 7

2.4 "ResourceList" Integration for LocalOn
Example minimal entry in ResourceList:
Property Data 	[
{"resource": "LocalOn"}
]
Example full version with default settings:
Property Data 	[
{
"resource": "LocalOn",
"canGet": true,
"canSet": "full",
"canSubscribe": false,
"requireResId": false,
"schema": {
"title": "LocalOn",
"type": "boolean",
"description": "Local on/off state. Will return true if
Local is on."
}
}
]

## Page 8

Revision History
Date 	Version 	Changes
Nov. 17, 2020 	1.01 	Initial Version
https://www.midi.org
