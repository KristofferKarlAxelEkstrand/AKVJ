---
title: Edit Item Control Change Messages (Data Bytes) Table 3 - Control Change Messages and RPNs
protocol: midi1
source: .midi-raw-data/Control Change Messages (Data Bytes).pdf
sourceType: local
pages: 10
sha256: 97f23c90d549c9cccac2182e18ee7357c90df98e514aaa45ab2b0a2af394984a
extractedAt: 2026-07-16T12:54:06.545Z
summary: MIDI.org table of all 128 MIDI 1.0 Control Change numbers (data bytes) and their assigned functions.
---
# Edit Item Control Change Messages (Data Bytes) Table 3 - Control Change Messages and RPNs

## Page 1

Edit Item
Control Change Messages (Data Bytes)
Table 3 - Control Change Messages and RPNs
The following table lists all currently dened Control Change messages and Channel Mode messages, in
control number order (adapted from "MIDI by the Numbers" by D. Valenti-Electronic Musician 2/88, and
updated by the MIDI Manufacturers Association.) This table is intended as an overview of MIDI, and is by no
means complete.
WARNING! Details about implementing these messages can dramatically impact compatibility with other
products. We strongly recommend consulting the ofcial MMA Detailed MIDI Specication for additional
information.
Registered Parameter Numbers (RPNs) are an extension to the Control Change message for setting additional
parameters. Appended at the bottom is a table of all currently dened RPNs.
WARNING! Details about implementing these messages can dramatically impact compatibility with other
products. We strongly recommend consulting the ofcial MMA Detailed MIDI Specication for additional
information.
Table 3: Control Changes and Mode Changes
(Status Bytes 176-191)
Control Number
(2nd Byte Value)
Control Function
3rd Byte Value
Decimal 	Binary 	Hex 	Value Used
As

## Page 2

0 	00000000 00 Bank Select 	0-127 	MSB
1 	00000001 01 Modulation Wheel or Lever 	0-127 	MSB
2 	00000010 02 Breath Controller 	0-127 	MSB
3 	00000011 03 Undened 	0-127 	MSB
4 	00000100 04 Foot Controller 	0-127 	MSB
5 	00000101 05 Portamento Time 	0-127 	MSB
6 	00000110 06 Data Entry MSB 	0-127 	MSB
7 	00000111 07 Channel Volume (formerly Main Volume) 	0-127 	MSB
8 	00001000 08 Balance 	0-127 	MSB
9 	00001001 09 Undened 	0-127 	MSB
10 	00001010 0A Pan 	0-127 	MSB
11 	00001011 0B Expression Controller 	0-127 	MSB
12 	00001100 0C Effect Control 1 	0-127 	MSB
13 	00001101 0D Effect Control 2 	0-127 	MSB
14 	00001110 0E Undened 	0-127 	MSB
15 	00001111 0F Undened 	0-127 	MSB
16 	00010000 10 General Purpose Controller 1 	0-127 	MSB
17 	00010001 11 General Purpose Controller 2 	0-127 	MSB
18 	00010010 12 General Purpose Controller 3 	0-127 	MSB
19 	00010011 13 General Purpose Controller 4 	0-127 	MSB
20 	00010100 14 Undened 	0-127 	MSB
21 	00010101 15 Undened 	0-127 	MSB
22 	00010110 16 Undened 	0-127 	MSB
23 	00010111 17 Undened 	0-127 	MSB
24 	00011000 18 Undened 	0-127 	MSB
25 	00011001 19 Undened 	0-127 	MSB

## Page 3

26 	00011010 1A Undened 	0-127 	MSB
27 	00011011 1B Undened 	0-127 	MSB
28 	00011100 1C Undened 	0-127 	MSB
29 	00011101 1D Undened 	0-127 	MSB
30 	00011110 1E Undened 	0-127 	MSB
31 	00011111 1F Undened 	0-127 	MSB
32 	00100000 20 LSB for Control 0 (Bank Select) 	0-127 	LSB
33 	00100001 21 LSB for Control 1 (Modulation Wheel or Lever) 	0-127 	LSB
34 	00100010 22 LSB for Control 2 (Breath Controller) 	0-127 	LSB
35 	00100011 23 LSB for Control 3 (Undened) 	0-127 	LSB
36 	00100100 24 LSB for Control 4 (Foot Controller) 	0-127 	LSB
37 	00100101 25 LSB for Control 5 (Portamento Time) 	0-127 	LSB
38 	00100110 26 LSB for Control 6 (Data Entry) 	0-127 	LSB
39 	00100111 27 LSB for Control 7 (Channel Volume, formerly
Main Volume) 0-127 	LSB
40 	00101000 28 LSB for Control 8 (Balance) 	0-127 	LSB
41 	00101001 29 LSB for Control 9 (Undened) 	0-127 	LSB
42 	00101010 2A LSB for Control 10 (Pan) 	0-127 	LSB
43 	00101011 2B LSB for Control 11 (Expression Controller) 	0-127 	LSB
44 	00101100 2C LSB for Control 12 (Effect control 1) 	0-127 	LSB
45 	00101101 2D LSB for Control 13 (Effect control 2) 	0-127 	LSB
46 	00101110 2E LSB for Control 14 (Undened) 	0-127 	LSB
47 	00101111 2F LSB for Control 15 (Undened) 	0-127 	LSB
48 	00110000 30 LSB for Control 16 (General Purpose Controller 1) 0-127 	LSB
49 	00110001 31 LSB for Control 17 (General Purpose Controller 2) 0-127 	LSB
50 	00110010 32 LSB for Control 18 (General Purpose Controller 3) 0-127 	LSB
51 	00110011 33 LSB for Control 19 (General Purpose Controller 4) 0-127 	LSB

## Page 4

52 	00110100 34 LSB for Control 20 (Undened) 	0-127 	LSB
53 	00110101 35 LSB for Control 21 (Undened) 	0-127 	LSB
54 	00110110 36 LSB for Control 22 (Undened) 	0-127 	LSB
55 	00110111 37 LSB for Control 23 (Undened) 	0-127 	LSB
56 	00111000 38 LSB for Control 24 (Undened) 	0-127 	LSB
57 	00111001 39 LSB for Control 25 (Undened) 	0-127 	LSB
58 	00111010 3A LSB for Control 26 (Undened) 	0-127 	LSB
59 	00111011 3B LSB for Control 27 (Undened) 	0-127 	LSB
60 	00111100 3C LSB for Control 28 (Undened) 	0-127 	LSB
61 	00111101 3D LSB for Control 29 (Undened) 	0-127 	LSB
62 	00111110 3E LSB for Control 30 (Undened) 	0-127 	LSB
63 	00111111 	3F LSB for Control 31 (Undened) 	0-127 	LSB
64 	01000000 40 Damper Pedal on/off (Sustain) 	≤63 off, ≥64 on 	---
65 	01000001 41 Portamento On/Off 	≤63 off, ≥64 on 	---
66 	01000010 42 Sostenuto On/Off 	≤63 off, ≥64 on 	---
67 	01000011 43 Soft Pedal On/Off 	≤63 off, ≥64 on 	---
68 	01000100 44 Legato Footswitch ≤63 Normal, ≥64
Legato ---
69 	01000101 45 Hold 2 	≤63 off, ≥64 on 	---
70 	01000110 46 Sound Controller 1 (default: Sound Variation) 	0-127 	LSB
71 	01000111 47 Sound Controller 2 (default: Timbre/Harmonic
Intens.) 0-127 	LSB
72 	01001000 48 Sound Controller 3 (default: Release Time) 	0-127 	LSB
73 	01001001 49 Sound Controller 4 (default: Attack Time) 	0-127 	LSB
74 	01001010 4A Sound Controller 5 (default: Brightness) 	0-127 	LSB
75 	01001011 4B Sound Controller 6 (default: Decay Time - see
MMA RP-021) 0-127 	LSB

## Page 5

76 	01001100 4C Sound Controller 7 (default: Vibrato Rate - see
MMA RP-021) 0-127 	LSB
77 	01001101 4D Sound Controller 8 (default: Vibrato Depth - see
MMA RP-021) 0-127 	LSB
78 	01001110 4E Sound Controller 9 (default: Vibrato Delay - see
MMA RP-021) 0-127 	LSB
79 	01001111 4F Sound Controller 10 (default undened - see
MMA RP-021) 0-127 	LSB
80 	01010000 50 General Purpose Controller 5 	0-127 	LSB
81 	01010001 51 General Purpose Controller 6 	0-127 	LSB
82 	01010010 52 General Purpose Controller 7 	0-127 	LSB
83 	01010011 53 General Purpose Controller 8 	0-127 	LSB
84 	01010100 54 Portamento Control 	0-127 	LSB
85 	01010101 55 Undened 	--- 	---
86 	01010110 56 Undened 	--- 	---
87 	01010111 57 Undened 	--- 	---
88 	01011000 58 High Resolution Velocity Prex 	0-127 	LSB
89 	01011001 59 Undened 	--- 	---
90 	01011010 5A Undened 	--- 	---
91 	01011011 5B
Effects 1 Depth
(default: Reverb Send Level - see MMA RP-023)
(formerly External Effects Depth)
0-127 	---
92 	01011100 5C Effects 2 Depth (formerly Tremolo Depth) 	0-127 	---
93 	01011101 5D
Effects 3 Depth
(default: Chorus Send Level - see MMA RP-023)
(formerly Chorus Depth)
0-127 	---
94 	01011110 5E Effects 4 Depth (formerly Celeste [Detune]
Depth) 0-127 	---
95 	01011111 	5F Effects 5 Depth (formerly Phaser Depth) 	0-127 	---

## Page 6

96 	01100000 60 Data Increment (Data Entry +1) (see MMA RP-
018) N/A 	---
97 	01100001 61 Data Decrement (Data Entry -1) (see MMA RP-
018) N/A 	---
98 	01100010 62 Non-Registered Parameter Number (NRPN) -
LSB 0-127 	LSB
99 	01100011 63 Non-Registered Parameter Number (NRPN) -
MSB 0-127 	MSB
100 	01100100 64 Registered Parameter Number (RPN) - LSB* 	0-127 	LSB
101 	01100101 65 Registered Parameter Number (RPN) - MSB* 	0-127 	MSB
102 	01100110 66 Undened 	--- 	---
103 	01100111 67 Undened 	--- 	---
104 	01101000 68 Undened 	--- 	---
105 	01101001 69 Undened 	--- 	---
106 	01101010 6A Undened 	--- 	---
107 	01101011 6B Undened 	--- 	---
108 	01101100 6C Undened 	--- 	---
109 	01101101 6D Undened 	--- 	---
110 	01101110 6E Undened 	--- 	---
111 	01101111 	6F Undened 	--- 	---
112 	01110000 70 Undened 	--- 	---
113 	01110001 71 Undened 	--- 	---
114 	01110010 72 Undened 	--- 	---
115 	01110011 73 Undened 	--- 	---
116 	01110100 74 Undened 	--- 	---
117 	01110101 75 Undened 	--- 	---
118 	01110110 76 Undened 	--- 	---
119 	01110111 	77 Undened 	--- 	---

## Page 7

Note: Controller numbers 120-127 are reserved for Channel Mode Messages, which rather than
controlling sound parameters, affect the channel's operating mode. (See also Table 1.)
120 	01111000 78 [Channel Mode Message] All Sound Off 	0 	---
121 	01111001 79 [Channel Mode Message] Reset All Controllers
(See MMA RP-015) 0 	---
122 	01111010 7A [Channel Mode Message] Local Control On/Off 	0 off, 127 on 	---
123 	01111011 	7B [Channel Mode Message] All Notes Off 	0 	---
124 	01111100 7C [Channel Mode Message] Omni Mode Off (+ all
notes off) 0 	---
125 	01111101 	7D [Channel Mode Message] Omni Mode On (+ all
notes off) 0 	---
126 	01111110 	7E [Channel Mode Message] Mono Mode On (+ poly
off, + all notes off)
Note: This equals
the number of
channels, or zero if
the number of
channels equals the
number of voices in
the receiver.
---
127 	01111111 	7F [Channel Mode Message] Poly Mode On (+ mono
off, +all notes off) 0 	---
Table 3a: Registered Parameter Numbers

## Page 8

To set or change the value of a Registered Parameter:
1. Send two Control Change messages using Control Numbers 101 (65H) and 100 (64H) to select the
desired Registered Parameter Number, as per the following table.
2. To set the selected Registered Parameter to a specic value, send a Control Change messages to the
Data Entry MSB controller (Control Number 6). If the selected Registered Parameter requires the LSB to be
set, send another Control Change message to the Data Entry LSB controller (Control Number 38).
3. To make a relative adjustment to the selected Registered Parameter's current value, use the Data
Increment or Data Decrement controllers (Control Numbers 96 and 97).
Parameter Number 	Parameter Function 	Data Entry Value
MSB: Control
101 (65H)
Value
LSB: Control
100 (64H)
Value
00H 00H 	Pitch Bend Sensitivity MSB = +/- semitones
LSB =+/--cents
01H Channel Fine Tuning
(formerly Fine Tuning - see MMA RP-022)
Resolution 100/8192
cents
00H 00H = -100 cents
40H 00H = A440
7FH 7FH = +100 cents
02H Channel Coarse Tuning
(formerly Coarse Tuning - see MMA RP-022)
Only MSB used
Resolution 100 cents
00H = -6400 cents
40H = A440
7FH = +6300 cents
03H 	Tuning Program Change Tuning Program
Number
04H 	Tuning Bank Select 	Tuning Bank Number
05H Modulation Depth Range
(see MMA General MIDI Level 2 Specication)
For GM2, dened in
GM2 Specication.
For other systems,
dened by
manufacturer

## Page 9

06H MPE Congurarion Message (see MPE Specication) See MPE Specication
... 	... 	All RESERVED for future MMA Denition 	...
3DH (61)
Three Dimensional Sound Controllers
00H 	AZIMUTH ANGLE 	See RP-049
01H 	ELEVATION ANGLE 	See RP-049
02H 	GAIN 	See RP-049
03H 	DISTANCE RATIO 	See RP-049
04H 	MAXIMUM DISTANCE 	See RP-049
05H 	GAIN AT MAXIMUM DISTANCE 	See RP-049
06H 	REFERENCE DISTANCE RATIO 	See RP-049
07H 	PAN SPREAD ANGLE 	See RP-049
08H 	ROLL ANGLE 	See RP-049
... 	... 	All RESERVED for future MMA Denition 	...
7FH 	7FH 	Null Function Number for RPN/NRPN
Setting RPN to
7FH,7FH will disable
the data entry, data
increment, and data
decrement controllers
until a new RPN or
NRPN is selected.
The MIDI Manufacturers Association (MMA)
About the MMA
Join the MMA
Request a SysEx ID
MMA IP Policy
Contact Us
Click here to contact us -- We'd love to hear from you

## Page 10

Privacy Policy | Terms of Use
© 2020 MIDI Manufacturers Association
