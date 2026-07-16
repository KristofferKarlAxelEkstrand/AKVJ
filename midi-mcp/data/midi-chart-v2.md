---
title: 1. Introduction
protocol: midi1
source: .midi-raw-data/midi_chart-v2.pdf
sourceType: local
pages: 7
sha256: 9138658888036a4ff57995c1c7179c7b6a8feeb9f3e80e876bc0b89ec7332e70
extractedAt: 2026-07-16T12:54:09.762Z
summary: MIDI implementation chart template (version 2) for documenting device MIDI support.
---
# 1. Introduction

## Page 1

1. Introduction
IMPORTANT: MMA recommends manufacturers of MIDI devices and software ship a MIDI Implementation chart with the
device, or make the chart available online. The Version 2 format described in this RP has 3 pages and is the preferred format.
Manufacturers who prefer a 1-page chart may continue to use the original format described in the MIDI 1.0 Specification.
This revised version of the standard MIDI Implementation Chart is designed as a quick reference guide that allows users to identify
at a glance which MIDI messages and functions are implemented by the device. In this document, the term 'device' is defined as a
hardware device or software program that (a) transmits and/or receives MIDI messages, and/or (b) reads and/or writes MMAdefined file formats. Use of the V2 MIDI Implementation Chart is optional. The standardization of this chart enables a user to judge
the compatibility between two devices to be connected, simply by comparing the “Transmit/Export” column of one device with the
“Recognize/Import” column of the other. For this reason, each chart should be the same size and should have the same number of
lines if at all possible. This chart has been designed to fit both standard A4 and 8 1/2” x 11” paper. If a smaller page size is required
for a particular product, page breaks may be inserted as necessary, but it is strongly recommended to maintain the row height of the
original chart, in order to facilitate comparisons.
IMPORTANT: The MMA Technical Standard Board will review the MIDI Implementation Chart annually, and will update
the chart template and these instructions as necessary to reflect newly standardized MIDI features.
2. All Pages
• 	Use the header at the top of each page of the chart to enter the manufacturer’s name, model name/number of the device,
version number, and date of chart preparation.
• 	On all pages, if the manufacturer wishes to present additional information that will not physically fit in the “Remarks”
column, this must be done by inserting a reference to the appropriate page or section number in the user manual where the
information can be found. If the number of banks the device supports does not fit in the “Comments” section, the
manufacturer should continue the list on a separate sheet of paper.
3. Page 1: Basic Information, MIDI Timing & Synchronization, and Extensions Compatibility
3.1. General
The body of page 1 of the chart is divided into four columns. The first column lists the specific function
or item, the next two columns give information about whether the specified function is transmitted or
exported and/or received or imported (and, if so, may contain information about the range of data)/. The
fourth column is used for remarks about anything unique to this implementation. For functions involving
files, the 2nd and 3rd columns give information on whether the files can be saved (exported) or opened
(imported), and, if so, what degree of compatibility is provided.
3.2. Functions Description
3.2.1. Basic Information
MIDI channels 	The range of MIDI channels that the device transmits, exports, responds to, and/or imports.
Devices using extended channel systems via multiple cables or input/output ports should list the
total number of channels in the appropriate “Transmitted” or “Recognized” columns and should
use the “Remarks” column to indicate the terminology used by the device to identify the extra
channels (i.e., “A1 - A16, B1 - B-16”).
Note numbers 	The total range of transmitted or recognized notes.
Program Change 	Indicate the range of Program Change numbers which are transmitted and/or recognized. If not
implemented, enter a “No” in the appropriate column.

## Page 2

Bank Select response 	Use a “Yes” or “No” to indicate whether or not the device correctly responds to Bank Select
messages as per the MIDI 1.0 Specification. Devices that respond only to Bank Select MSB (cc
#0) but not to the LSB (cc #32) should place a "No" in the “Recognized” column and should
indicate this in the “Remarks” column. If the device does correctly respond to Bank Select
messages, use the “Remarks” column to indicate what banks or ranges of banks are available in
the device. If certain banks are accessible only by MIDI (and not by front panel user control),
these should be listed in the “Remarks” column.
Modes supported 	Use a “Yes” or “No” to indicate whether or not the device supports each of the five listed
modes of reception.
Note-On Velocity 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Note-On Velocity.
Note-Off Velocity 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Note-Off Velocity.
Channel Aftertouch 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Channel Aftertouch.
Poly (Key) Aftertouch 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Poly (Key) Aftertouch.
Pitch Bend 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Pitch Bend.
Active Sensing 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Active Sensing.
System Reset 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports System Reset.
Tune Request 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Tune Request.
Universal System Exclusive 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports the various Universal System Exclusive messages described. If the device
supports additional Universal System Exclusive messages that are not listed, for example the
SP-MIDI MIP message or Global Parameter Control, use the “Other” category and, in the
Remarks column, enter the name(s) of the message(s) supported.
Manufacturer or
Non-Commercial
System Exclusive 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports any Manufacturer System Exclusive messages or Non-Commercial System
Exclusive messages. In the Remarks column, enter the name(s) of the message(s) supported,
and either the words “Non-Commercial” or the manufacturer name(s) and MMA Manufacturer
ID(s) for the message(s) supported.
NRPNs 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports NRPNs. Manufacturers may wish to list the NRPNs the device uses in the
“Remarks” column (if this information will not physically fit in the “Remarks” column,
provide a reference to the page or section number in the user manual where the information can
be found).
RPNs 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports each of the specified RPNs.

## Page 3

3.2.2. MIDI Timing And Synchronization
MIDI Clock 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports MIDI Clock.
Song Position Pointer 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Song Position Pointer.
Song Select 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Song Select.
Start/Continue/Stop 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports Start, Continue, or Stop messages.
MIDI Time Code 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports MIDI Time Code (MTC).
MIDI Machine Control 	Use a “Yes” or “No” to indicate whether or not the device transmits, exports, responds to,
and/or imports MIDI Machine Control (MMC). If yes, indicate in the Remarks column whether
the device transmits and/or responds in Open or Closed Loop mode. Manufacturers of devices
utilizing MIDI Machine Control may wish to attach a separate chart indicating the specific
MMC messages transmitted and/or recognized by the device. If so, indicate the presence of this
“sub-chart” in the Remarks column.
MIDI Show Control 	Indicate whether or not the device transmits, exports, responds to, and/or imports MIDI Show
Control (MSC). If not, indicate “No”. If yes, indicate the Level of MIDI Show Control
supported. Manufacturers of devices utilizing MIDI Show Control may wish to attach a
separate chart indicating the specific MSC messages transmitted and/or recognized by the
device. If so, indicate the presence of this “sub-chart” in the Remarks column.
3.2.3. Extensions Compatibility
General MIDI 	Indicate whether or not the device has a mode of operation which complies with any of the
General MIDI specifications: General MIDI System Level 1 (GM), General MIDI System
Level 2 (GM2) and/or General MIDI Lite (GM Lite). If not, indicate “No”. If yes, indicate the
GM Level(s) supported. Also, if GM is the default power-up mode, indicate GM Lite, GM
Level 1 or GM Level 2. If not, indicate “No”.
DLS 	Indicate whether or not the device has a mode of operation that complies with any of the
Downloadable Sounds specifications: DLS Level 1 (DLS) , DLS Level 2 (DLS2, including
DLS 2.1 and DLS 2.2), and/or Mobile DLS. If not, indicate “No”. If yes, indicate the DLS
Level(s) supported. Also, indicate whether or not the device can import and/or export DLS files.
If not, indicate “No”. If yes, indicate what types. It is recommended that manufacturers indicate
in the Remarks column the means of receiving DLS data (i.e., specific physical format, device
interface, or transport protocol, etc.) and, if a file system media is used, indicate in the Remarks
column the exact format(s) supported (i.e., Windows, Mac OS, or Linux file system version,
etc.).
Standard MIDI Files 	Use a "Yes" or "No" to indicate whether or not the device has a mode of operation that can
play, import, and/or export any of the Standard MIDI File formats, and, if so, the formats(s)
supported: format 0 (single track), format 1 (multitrack), and/or format 2 (multiple independent
single-track patterns). If yes, it is also recommended that manufacturers indicate in the Remarks
column the means of receiving SMF data (i.e., specific physical format, device interface, or
transport protocol, etc.) and, if a file system media is used, indicate in the Remarks column the
exact format(s) supported (i.e. Windows, Mac OS, or Linux file system version, etc.).

## Page 4

XMF 	Indicate whether or not the device has a mode of operation that can play, import, and/or export
any of the officially defined XMF File Types: XMF Type 0, XMF Type 1, or Mobile XMF
(XMF Type 2). If the device uses the XMF Meta File Format in a manner that does not conform
to any of the XMF File Type specifications, indicate this in the Remarks column.
SP-MIDI 	Indicate whether or not the device has a mode of operation that can play, import, and/or export
Scalable Polyphony MIDI (SP-MIDI) data. If yes, indicate which SP-MIDI profile
specification(s) that the device conforms to, for example SP-MIDI 5-24 Voice Profile for 3GPP.
4. Pages 2 & 3: Control Number Information
4.1. General
Pages 2 and 3 of the chart are used to describe how the device implements the 128 MIDI Control Change messages (including
those reserved for Channel Mode messages). IMPORTANT: The use of pages 2 and 3 is optional for devices that do not
transmit, export, respond to, and/or import any Control Change messages. The first 120 Control Change messages are
controller numbers, and the last 8 (cc# 120 - 127) reserved for Channel Mode messages. These pages are divided into five
columns, with the first column listing the control number in decimal. The second column lists the defined function from the
MIDI 1.0 Specification for that control number if one exists, or is blank if undefined in the MIDI 1.0 Specification.
Manufacturers using these undefined controller numbers should enter in the title of the assigned function in this column and
should make an entry in the fifth, “Remarks” column noting this proprietary usage. The third and fourth columns are used to
indicate whether the specified controller number is transmitted, exported, responded to, and/or imported.
4.2. Functions Description
The inclusion of these two pages in a MIDI device’s owner’s manual is optional. Use a “Yes” or “No” to indicate whether or
not the device transmits and/or responds to each of the listed control numbers. Use the “Remarks” column to indicate whether a
particular controller number is assignable or if the controller is being used in a non-standard way (i.e., if the device is capable
of receiving the controller message but routes it in an unusual way). If using any undefined controller number, enter the title of
the assigned function in the second, “Function” column and make an entry in the fifth, “Remarks” column noting this
proprietary usage.

## Page 5

MIDI Implementation Chart V 2.0 	MMA/AMEI RP-028
www.midi.org
MIDI Implementation Chart v. 2.0 (Page 1 of 3)
Manufacturer: 	Model: 	Version: 	Date:
Transmit/Export 	Recognize/Import 	Remarks
1. Basic Information
MIDI channels
Note numbers
Program change
Bank Select response? (Yes/No)
If yes, list banks utilized in remarks column
Modes supported : 	Mode 1: Omni-On, Poly (Yes/No)
Mode 2: Omni-On, Mono (Yes/No)
Mode 3: Omni-Off, Poly (Yes/No)
Mode 4: Omni-Off, Mono (Yes/No)
Multi Mode (Yes/No)
Note-On Velocity (Yes/No)
Note-Off Velocity (Yes/No)
Channel Aftertouch (Yes/No)
Poly (Key) Aftertouch (Yes/No)
Pitch Bend (Yes/No)
Active Sensing (Yes/No)
System Reset (Yes/No)
Tune Request (Yes/No)
Universal System Exclusive: Sample Dump Standard (Yes/No)
Device Inquiry (Yes/No)
File Dump (Yes/No)
MIDI Tuning (Yes/No)
Master Volume (Yes/No)
Master Balance (Yes/No)
Notation Information (Yes/No)
Turn GM1 System On (Yes/No)
Turn GM2 System On (Yes/No)
Turn GM System Off (Yes/No)
DLS-1 (Yes/No)
File Reference (Yes/No)
Controller Destination (Yes/No)
Key-based Instrument Ctrl (Yes/No)
Master Fine/Coarse Tune (Yes/No)
Other Universal System Exclusive
Manufacturer or Non-Commercial System Exclusive
NRPNs (Yes/No)
RPN 00 (Pitch Bend Sensitivity) (Yes/No)
RPN 01 (Channel Fine Tune) (Yes/No)
RPN 02 (Channel Coarse Tune) (Yes/No)
RPN 03 (Tuning Program Select) (Yes/No)
RPN 04 (Tuning Bank Select) (Yes/No)
RPN 05 (Modulation Depth Range) (Yes/No)
2. MIDI Timing and Synchronization
MIDI Clock (Yes/No)
Song Position Pointer (Yes/No)
Song Select (Yes/No)
Start (Yes/No)
Continue (Yes/No)
Stop (Yes/No)
MIDI Time Code (Yes/No)
MIDI Machine Control (Yes/No)
MIDI Show Control (Yes/No)
If yes, MSC Level supported
3. Extensions Compatibility
General MIDI compatible? (Level(s)/No)
Is GM default power-up mode? (Level/No)
DLS compatible? (Levels(s)/No)
(DLS File Type(s)/No)
Standard MIDI Files (Type(s)/No)
XMF Files (Type(s)/No)
SP-MIDI compatible? (Yes/No)

## Page 6

MIDI Implementation Chart V 2.0 	MMA/AMEI RP-028
www.midi.org
MIDI Implementation Chart v 2.0 Control Number Information (Page 2 of 3)
Manufacturer: 	Model: 	Version: 	Date:
Control # 	Function 	Transmitted (Y/N) 	Recognized (Y/N) 	Remarks
0 	Bank Select (MSB)
1 	Modulation Wheel (MSB)
2 	Breath Controller (MSB)
4 	Foot Controller (MSB)
5 	Portamento Time (MSB)
6 	Data Entry (MSB)
7 	Channel Volume (MSB)
8 	Balance (MSB)
10 	Pan (MSB)
11 	Expression (MSB)
12 	Effect Control 1 (MSB)
13 	Effect Control 2 (MSB)
16 	General Purpose Controller 1 (MSB)
17 	General Purpose Controller 2 (MSB)
18 	General Purpose Controller 3 (MSB)
19 	General Purpose Controller 4 (MSB)
32 	Bank Select (LSB)
33 	Modulation Wheel (LSB)
34 	Breath Controller (LSB)
36 	Foot Controller (LSB)
37 	Portamento Time (LSB)
38 	Data Entry (LSB)
39 	Channel Volume (LSB)
40 	Balance (LSB)
42 	Pan (LSB)
43 	Expression (LSB)
44 	Effect Control 1 (LSB)
45 	Effect Control 2 (LSB)
48 	General Purpose Controller 1 (LSB)
49 	General Purpose Controller 2 (LSB)
50 	General Purpose Controller 3 (LSB)
51 	General Purpose Controller 4 (LSB)

## Page 7

MIDI Implementation Chart V 2.0 	MMA/AMEI RP-028
www.midi.org
MIDI Implementation Chart v 2.0 Control Number Information (Page 3 of 3)
Manufacturer: 	Model: 	Version: 	Date:
Control # 	Function 	Transmitted (Y/N) 	Recognized (Y/N) 	Remarks
64 	Sustain Pedal
65 	Portamento On/Off
66 	Sostenuto
67 	Soft Pedal
68 	Legato Footswitch
69 	Hold 2
70 	Sound Controller 1 (default: Sound Variation)
71 	Sound Controller 2 (default: Timbre / Harmonic Quality)
72 	Sound Controller 3 (default: Release Time)
73 	Sound Controller 4 (default: Attack Time)
74 	Sound Controller 5 (default: Brightness)
75 	Sound Controller 6 (GM2 default: Decay Time)
76 	Sound Controller 7 (GM2 default: Vibrato Rate)
77 	Sound Controller 8 (GM2 default: Vibrato Depth)
78 	Sound Controller 9 (GM2 default: Vibrato Delay)
79 	Sound Controller 10 (GM2 default: Undefined)
80 	General Purpose Controller 5
81 	General Purpose Controller 6
82 	General Purpose Controller 7
83 	General Purpose Controller 8
84 	Portamento Control
91 	Effects 1 Depth (default: Reverb Send)
92 	Effects 2 Depth (default: Tremolo Depth)
93 	Effects 3 Depth (default: Chorus Send)
94 	Effects 4 Depth (default: Celeste [Detune] Depth)
95 	Effects 5 Depth (default: Phaser Depth)
96 	Data Increment
97 	Data Decrement
98 	Non-Registered Parameter Number (LSB)
99 	Non-Registered Parameter Number(MSB)
100 	Registered Parameter Number (LSB)
101 	Registered Parameter Number(MSB)
120 	All Sound Off
121 	Reset All Controllers
122 	Local Control On/Off
123 	All Notes Off
124 	Omni Mode Off
125 	Omni Mode On
126 	Poly Mode Off
127 	Poly Mode On
