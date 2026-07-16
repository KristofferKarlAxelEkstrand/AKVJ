---
title: Mobile Musical Interface Specification
protocol: midi1
source: .midi-raw-data/rp48amd1(spec).pdf
sourceType: local
pages: 21
sha256: b647ba1f3e12e10e290b1e793ad733ef99e50b620613c290118e3774a4dd3394
extractedAt: 2026-07-16T12:54:10.161Z
summary: Mobile Musical Interface specification: mapping mobile phone keypads (numeric and QWERTY) to musical instrument playing interfaces.
---
# Mobile Musical Interface Specification

## Page 1

Mobile Musical Interface
Specification
Ver.1.0.6 Nov. 30th 2009
Association of Musical Electronics Industry
MMI Promotion Project
MMA Version RP-048/amd1
Feb. 7 2011

## Page 2

Contents
1 	Background ..................................................................................................................................- 1 -
2 	User interface for mobile phones as musical instruments (numeric keypad) .........................- 2 -
2.1 	Numeric keypad key assignment ......................................................................................................... - 2 -
2.1.1 	Numeric keypad key assignment for melodic instruments.......................................................... - 3 -
2.1.2 	Numeric keypad key assignment for drum sets ........................................................................... - 6 -
2.2 	Directional pad assignment.................................................................................................................. - 9 -
2.2.1 	Directional pad assignment for melodic instruments .................................................................. - 9 -
2.2.2 	Directional pad assignment for drum sets.................................................................................. - 11 -
2.3 	Center octave ...................................................................................................................................... - 12 -
3 	User interface for mobile phones as musical instruments (QWERTY keypad).....................- 14 -
3.1 	Standard QWERTY keypad range ..................................................................................................... - 14 -
3.2 	QWERTY keypad key assignment for melodic instruments............................................................. - 14 -
3.2.1 	Melodic Instrument: Default ....................................................................................................... - 14 -
3.2.2 	Melodic Instrument: Option 1 ..................................................................................................... - 15 -
3.3 	QWERTY keypad key assignment for drum sets .............................................................................. - 16 -
3.3.1 	Drum Set ...................................................................................................................................... - 16 -
3.3.2 	Percussion Set .............................................................................................................................. - 16 -
3.4 	Alternate standard key assignments ................................................................................................. - 17 -
3.4.1 	Mobile phone numeric keypad-like alternate QWERTY key assignment ................................. - 17 -
3.4.2 	PC keyboard-like alternate QWERTY key assignment 1........................................................... - 17 -
3.5 	Center octave ...................................................................................................................................... - 17 -
4 	Guidelines for mobile phone as a musical instrument settings
(numeric and QWERTY keypads).............................................................................................- 18 -
4.1 	Recommended settings ....................................................................................................................... - 18 -
4.1.1 	Instrument type ........................................................................................................................... - 18 -
4.1.2 	Keypad key assignment ............................................................................................................... - 18 -
4.1.3 	Root key ........................................................................................................................................ - 18 -
4.1.4 	Octave ........................................................................................................................................... - 18 -
4.1.5 	Scale.............................................................................................................................................. - 18 -
4.1.6 	Program number .......................................................................................................................... - 18 -
4.1.7 	Volume .......................................................................................................................................... - 18 -

## Page 3

History
Version 	Date 	Revisions
1.0.0 	Jan. 9th 2007 	First Edition
1.0.1 	Jan. 12th
2.2.2 	“[→]: Octave up each time the directional key is
pressed . The new octave is then held.” is
changed to “[→]: Octave up while pressing the
directional key.”
“[←]: Octave down each time the directional
key is pressed . The new octave is then held.” is
changed to “[←]: Octave down while pressing
the directional key.”
In figure 13, “Held” is eliminated.
1.0.2 	Nov. 11th
3.1.5 	Corrected scale definition
1.0.3 	Jul. 27th
2.2.1
Added support for directional pad interaction for
melodic instruments
Added support for QWERTY keypads
Added support for QWERTY keypads
1.0.4 	Oct. 8th 2009 	Figures 14
and 15
4.1
4.1.3
4.1.5
Corrected a typo.
Removed assignments for [F] and [K] keys in
Figure 14
Changed the wording of the title
Changed the wording of the title
Added “(=C)” wording
Removed “Dorian”
1.0.5 	Oct. 30th
Entire
Document
2.1
Changed “mobile phone” to “mobile phone
device”. Changed “standard numeric” to
“numeric”.
Added lines 15 – 17
Changed “The standard mobile phone” to “A
mobile phone with a numeric keypad”
1.0.6 	Nov. 30th
2.2.1
3.2.1
3.2.2
Changed directional pad assignment to Default,
Option 1, Option 3, & Option 4 and Option 2 &
Option 5
Changed to match Section 2.2.1
Changed to match Section 2.2.1
RP48amd1 	Feb 7 2011 	--- 	Reformat for MMA Publication

## Page 4

1 	Background
The evolution of mobile phone functionality in recent years is quite remarkable. 	One example is the
approach to music, with FM tone generators used for playing ringtones appearing in mobile phones around
1999. 	Since then, mobile phone tone generators have continued to evolve, reaching sound quality equivalent
to that of PC-based softsynths.
Using the numeric keypad for text messaging, mobile phone users—particularly younger users—are able to
communicate easily and with great agility. 	As using the mobile phone keypad as a musical instrument
spreads, it is not unimaginable that users could become as virtuosic as on any other musical instrument.
However, if each mobile phone maker independently implements the way the numeric keypad is used to
play music, this could mean that a user would have to re-learn a new interface for each mobile phone. 	This
document provides a suggestion for standardizing the user interface specification for using the mobile phone
as a musical instrument.
Rather than be restricted to mobile phone devices’ numeric keypads, guidelines for also using the QWERTY
keypads of mobile phones and PCs as a musical instrument has been appended since version 1.0.3 of this
document as Section 3.

## Page 5

2 	User interface for mobile phones as musical instruments (numeric keypad)
2.1 Numeric keypad key assignment
A mobile phone with a numeric keypad has twelve keys in the keypad, as shown in Figure 1.
This specification defines standard assignment of these keys for melodic instruments and drum sets.
Figure 1 	Numeric keypad key placement (Reference)

## Page 6

2.1.1 	Numeric keypad key assignment for melodic instruments
The following tables illustrate numeric keypad key assignments for melodic instruments. They define pitch
names corresponding to each keypad key number.
2.1.1.1 Melodic Instrument: Default
Key number 	Pitch name
1 	Root
2 	2nd
3 	3rd
4 	4th
5 	5th
6 	6th
7 	7th
8 	8th
9 	9th
* 	10th
0 	11th
# 	12th
Figure 2 	Numeric keypad key assignment for Melodic Instrument: Default
2.1.1.2 Melodic instrument: Option 1
Key number 	Pitch name
1 	4th(Oct Down)
2 	5th(Oct Down)
3 	6th(Oct Down)
4 	7th(Oct Down)
5 	Root
6 	2nd
7 	3rd
8 	4th
9 	5th
* 	6th
0 	7th
# 	8th
Figure 3 	Numeric keypad key assignment for Melodic Instrument: Option 1
2.1.1.3 Melodic instrument: Option 2

## Page 7

Key number 	Pitch name
1 	Root
2 	2nd
3 	3rd
4 	4th
5 	b2nd(#1st)
6 	b3rd(#2nd)
7 	5th
8 	6th
9 	7th
* 	b5th(#4th)
0 	b6th(#5th)
# 	b7th(#6th)
Figure 4 	Numeric keypad key assignment for Melodic Instrument: Option 2
2.1.1.4 Melodic instrument: Option 3
Key number 	Pitch name
1 	10th
2 	11th
3 	12th
4 	7th
5 	8th
6 	9th
7 	4th
8 	5th
9 	6th
* 	Root
0 	2nd
# 	3rd
Figure 5 	Numeric keypad key assignment for Melodic Instrument: Option 3

## Page 8

2.1.1.5 Melodic instrument: Option 4
Key number 	Pitch name
1 	6th
2 	7th
3 	8th
4 	3rd
5 	4th
6 	5th
7 	7th(Oct Down)
8 	Root
9 	2nd
* 	4th(Oct Down)
0 	5th(Oct Down)
# 	6th(Oct Down)
Figure 6 	Numeric keypad key assignment for Melodic Instrument: Option 4
2.1.1.6 Melodic instrument: Option 5
Key number 	Pitch name
1 	b5th(#4th)
2 	b6th(#5th)
3 	b7th(#6th)
4 	5th
5 	6th
6 	7th
7 	4th
8 	b2nd(#1st)
9 	b3rd(#2nd)
* 	Root
0 	2nd
# 	3rd
Figure 7 	Numeric keypad key assignment for Melodic Instrument: Option 5

## Page 9

2.1.2 	Numeric keypad key assignment for drum sets
The following tables illustrate standard number key assignments for drum sets. They define drum
instruments corresponding to each keypad key number. 	By defining four drum sets , each using the
standard twelve keypad keys, all forty-seven instruments of the GM1 drum set are covered. Four drum set
keypad key assignments are defined: Drum Set 1, Drum Set 2, Percussion Set 1 and Percussion Set 2.
2.1.2.1 Drum Set 1
Key number 	Instrument name
1 	Crash Cymbal 1
2 	Splash Cymbal
3 	Ride Cymbal 1
4 	Hi Tom
5 	Low Mid Tom
6 	High Floor Tom
7 	Acoustic Snare
8 	Cowbell
9 	Open Hi-Hat
* 	Bass Drum 1
0 	Side Stick
# 	Closed Hi-Hat
Figure 8 	Numeric keypad key assignment for Drum Set 1
2.1.2.2 Drum Set 2
Key number 	Instrument name
1 	Crash Cymbal 2
2 	Chinese Cymbal
3 	Ride Bell
4 	Hi Mid Tom
5 	Low Tom
6 	Low Floor Tom
7 	Electric Snare
8 	Hand Clap
9 	Ride Cymbal 2
* 	Acoustic Bass Drum
0 	(Reserved)
# 	Pedal Hi-Hat
Figure 9 	Numeric keypad key assignment for Drum Set 2

## Page 10

2.1.2.3 Percussion Set 1
Key number 	Instrument name
1 	Claves
2 	Cabasa
3 	VibraSlap
4 	Tambourine
5 	Low Timbale
6 	High Timbale
7 	Maracas
8 	Hi Bongo
9 	Low Bongo
* 	Mute Hi Conga
0 	Open Hi Conga
# 	Low Conga
Figure 10 	Numeric keypad key assignment for Percussion Set 1
2.1.2.4 Percussion Set 2
Key number 	Instrument name
1 	Short Guiro
2 	Short Whistle
3 	High Agogo
4 	Long Guiro
5 	Long Whistle
6 	Low Agogo
7 	Mute Cuica
8 	Hi Wood Block
9 	Mute Triangle
* 	Open Cuica
0 	Low Wood Block
# 	Open Triangle
Figure 11 	Numeric keypad key assignment for Percussion Set 2

## Page 11

The following table illustrates the division of the forty-seven GM1 drum set instruments between the
number key assignments for drum sets.
Key# 	Instrument 	Drum1 	Drum2 	Perc.1 	Perc.2
35 	Acoustic Bass Drum 	*
36 	Bass Drum 1 	*
37 	Side Stick 	0
38 	Acoustic Snare 	7
39 	Hand Clap 	8
40 	Electric snare 	7
41 	Low Floor Tom 	6
42 	Closed Hi-Hat 	#
43 	High Floor Tom 	6
44 	Pedal Hi-Hat 	#
45 	Low Tom 	5
46 	Open Hi-Hat 	9
47 	Low Mid Tom 	5
48 	Hi Mid Tom 	4
49 	Crash Cymbal 1 	1
50 	High Tom 	4
51 	Ride Cymbal 1 	3
52 	Chinese Cymbal 	2
53 	Ride Bell 	3
54 	Tambourine 	4
55 	Splash Cymbal 	2
56 	Cowbell 	8
57 	Crash Cymbal 2 	1
58 	Vibraslap 	3
59 	Ride Cymbal 2 	9
60 	Hi Bongo 	8
61 	Low Bongo 	9
62 	Mute Hi Conga 	*
63 	Open Hi Conga 	0
64 	Low Conga 	♯
65 	High Timbale 	6
66 	Low Timbale 	5
67 	High Agogo 	3
68 	Low Agogo 	6
69 	Cabasa 	2
70 	Maracas 	7
71 	Short Whistle 	2
72 	Long Whistle 	5
73 	Short Guiro 	1
74 	Long Guiro 	4
75 	Claves 	1
76 	Hi Wood Block 	8
77 	Low Wood Block 	0
78 	Mute Cuica 	7
79 	Open Cuica 	*
80 	Mute Triangle 	9
81 	Open Triangle 	#

## Page 12

2.2 Directional pad assignment
Pitch ranges greater than one octave can be achieved using the mobile phone’s directional pad.
This specification assumes the directional pad to have four arrows: [↑], [↓], [→], and [←].
2.2.1 	Directional pad assignment for melodic instruments
This describes the directional pad assignments for the melodic instrument keypad key assignments in
Section 2.1.1.
1) For key assignments Default, Option 1, Option 3, and Option 4:
z 	[↑]: Halftone up (sharp; #) by pressing a number key while holding the [↑] key
Pitchbend up by pressing the [↑] key while holding a number key (*1)
z 	[↓]: Halftone down (flat; b) by pressing a number key while holding the [↓] key
Pitchbend down by pressing the [↓] key while holding a number key
z 	[→]: Octave up by pressing a number key while holding the [→] key (*2)
Modulation depth 1 by pressing the [→] key while holding a number key (*3)
z 	[←]: Octave down by pressing a number key while holding the [←] key
Modulation depth 2 by pressing the [←] key while holding a number key
2) For key assignments Option 2 and Option 5:
z 	[↑]: Pitchbend up by pressing the [↑] key while holding a number key (*1)
z 	[↓]: Pitchbend down by pressing the [↓] key while holding a number key
z 	[→]: Octave up by pressing a number key while holding the [→] key (*2)
Modulation depth 1 by pressing the [→] key while holding a number key (*3)
z 	[←]: Octave down by pressing a number key while holding the [←] key
Modulation depth 2 by pressing the [←] key while holding a number key
↑
# up
→	←
↓
Basic
Pitch
b down
Oct. up	Oct. Down
Figure 12 	Directional pad assignment for melodic instrument

## Page 13

[Note]
(*1) Default pitchbend behavior is as follows:
• 	2 halftones (200 cents ) up/down after the number key has been held for 150ms.
• 	The tuning resolution is linear cents.
A system can be implemented such that the above values can be changed.
(*2) Alternatively, it is acceptable to implement it such that each time the [←] or [→] key is pressed by itself,
the octave is raised or lowered. It is also acceptable to implement the system so that the user can
switch between the two implementations described.
(*3) The depth values of modulation depths 1 and 2 can be implemented differently between systems. It is
also acceptable to implement a system such that the depth values can be edited

## Page 14

2.2.2 	Directional pad assignment for drum sets
This describes the directional pad assignment for the drum set keypad key assignments detailed in Section
2.1.2.
z 	[↑]: Volume accent by pressing a number key while pressing the [↑] key.
z 	[↓]: Change drum set by pressing a number key while pressing the [↓] key.
¾ 	When drum set is Drum Set 1, change to Drum Set 2.
¾ 	When drum set is Drum Set 2, change to Drum Set 1.
¾ 	When drum set is Percussion Set 1, change to Percussion Set 2.
¾ 	When drum set is Percussion Set 2, change to Percussion Set 1.
z 	[→]: Reserved.
z 	[←]: Reserved.
↑
Accent
→	←
↓
Basic
Assign
Change Set
Reserved	Reserved
Figure 13 	Directional pad assignment for drum sets
[Note]
The volumes of normal notes and accented notes depend on the implementation of the system.

## Page 15

2.3 Center octave
Center octave is defined for each melodic instrument.
Considering the standard octave provided for in the GM specification to be 0, the table below illustrates the
center octave value relative to the GM octave number for each instrument.
Figure 1 Center Octave
PC# 	Instrument 	Center
Oct.
PC# 	Instrument 	Center
Oct.
0 	Acoustic Grand Piano 	0 	32 	Acoustic Bass 	-2
1 	Bright Grand Piano 	0 	33 	Electric Bass (finger) 	-2
2 	Electric Grand Piano 	0 	34 	Electric Bass (pick) 	-2
3 	Honky-Tonk Piano 	0 	35 	Fretless Bass 	-2
4 	Electric Piano 1 	0 	36 	Slap Bass 1 	-2
5 	Electric Piano 2 	0 	37 	Slap Bass 2 	-2
6 	Harpsichord 	0 	38 	Synth Bass 1 	-2
7 	Clavinet 	0 	39 	Synth Bass 2 	-2
8 	Celesta 	+2 	40 	Violin 	+1
9 	Glockenspiel 	+2 	41 	Viola 	0
10 	Music Box 	+1 	42 	Cello 	-1
11 	Vibraphone 	0 	43 	Contrabass 	-2
12 	Marimba 	+1 	44 	Tremolo Strings 	0
13 	Xylophone 	+2 	45 	Pizzicato Strings 	0
14 	Tubular Bells 	0 	46 	Orchestral Harp 	0
15 	Dulcimer 	0 	47 	Timpani 	-1
16 	Drawbar Organ 	0 	48 	String Ensemble 1 	0
17 	Percussive Organ 	0 	49 	String Ensemble 2 	0
18 	Rock Organ 	0 	50 	SynthStrings 1 	0
19 	Church Organ 	0 	51 	SynthStrings 2 	0
20 	Reed Organ 	0 	52 	Choir Aahs 	0
21 	Accordion 	0 	53 	Voice Oohs 	0
22 	Harmonica 	0 	54 	Synth Voice 	0
23 	Tango Accordion 	0 	55 	Orchestra Hit 	0
24 	Acoustic Guitar (nylon) 	0 	56 	Trumpet 	0
25 	Acoustic Guitar (steel) 	0 	57 	Trombone 	-1
26 	Electric Guitar (jazz) 	0 	58 	Tuba 	-2
27 	Electric Guitar (clean) 	0 	59 	Muted Trumpet 	0
28 	Electric Guitar (muted) 	0 	60 	French Horn 	0
29 	Overdriven Guitar 	0 	61 	Brass Section 	0
30 	Distortion Guitar 	0 	62 	Synth Brass 1 	0
31 	Guitar Harmonics 	0 	63 	Synth Brass 2 	0

## Page 16

PC# 	Instrument 	Center
Oct.
PC# 	Instrument 	Center
Oct.
64 	Soprano Sax 	+1 	96 	FX 1 (Ice Rain) 	0
65 	Alto Sax 	0 	97 	FX 2 (Soundtrack) 	0
66 	Tenor Sax 	-1 	98 	FX 3 (Crystal) 	+2
67 	Baritone Sax 	-2 	99 	FX 4 (Atmosphere) 	+1
68 	Oboe 	+1 	100 	FX 5 (Brightness) 	+1
69 	English Horn 	0 	101 	FX 6 (Goblins) 	0
70 	Bassoon 	-1 	102 	FX 7 (Echoes) 	0
71 	Clarinet 	0 	103 	FX 8 (Sci-Fi) 	0
72 	Piccolo 	+2 	104 	Sitar 	0
73 	Flute 	+1 	105 	Banjo 	0
74 	Recorder 	+1 	106 	Shamisen 	0
75 	Pan Flute 	+1 	107 	Koto 	0
76 	Blown Bottle 	0 	108 	Kalimba 	+1
77 	Shakuhachi 	0 	109 	Bag pipe 	+1
78 	Whistle 	+2 	110 	Fiddle 	+1
79 	Ocarina 	+1 	111 	Shanai 	+1
80 	Lead 1 (Square) 	+1 	112 	Tinkle Bell 	+2
81 	Lead 2 (Sawtooth) 	+1 	113 	Agogo 	0
82 	Lead 3 (Calliope) 	+1 	114 	Steel Drums 	0
83 	Lead 4 (Chiff) 	+1 	115 	Woodblock 	0
84 	Lead 5 (Charang) 	+1 	116 	Taiko Drum 	0
85 	Lead 6 (Voice) 	+1 	117 	Melodic Tom 	0
86 	Lead 7 (Fifths) 	+1 	118 	Synth Drum 	0
87 	Lead 8 (Bass+Lead) 	+1 	119 	Reverse Cymbal 	0
88 	Pad 1 (New Age) 	0 	120 	Guitar Fret Noise 	0
89 	Pad 2 (Warm) 	0 	121 	Breath Noise 	0
90 	Pad 3 (PolySynth) 	0 	122 	Seashore 	0
91 	Pad 4 (Choir) 	0 	123 	Bird Tweet 	0
92 	Pad 5 (Bowed) 	0 	124 	Telephone Ring 	0
93 	Pad 6 (Metallic) 	0 	125 	Helicopter 	0
94 	Pad 7 (Halo) 	0 	126 	Applause 	0
95 	Pad 8 (Sweep) 	0 	127 	Gunshot 	0

## Page 17

3 	User interface for mobile phones as musical instruments (QWERTY keypad)
3.1 Standard QWERTY keypad range
The QWERTY keypad layout is the de facto standard for the many computers and smartphones that
incorporate a Latin character keyboard. Although many computers, smart phones, etc. also include non-Latin
characters, such as symbols and numbers, this specification only covers the Latin character keys. This
definition also allows for an expanded definition that includes these other keys as well.
3.2 QWERTY keypad key assignment for melodic instruments
The following figures illustrate QWERTY keypad key assignments for melodic instruments. They define
pitch names corresponding to each keypad key.
3.2.1 	Melodic Instrument: Default
A 	S 	D 	F 	G 	H 	J 	K 	L
Z 	X 	C 	V 	B 	N 	M
Q 	W 	E 	R 	T 	Y 	U 	I 	O 	P
Figure 13 	QWERTY keypad key assignment for Melodic Instrument: Default
z 	Pitchbend up by pressing the [Bend up] key while holding a QWERTY key (*1)
z 	Pitchbend down by pressing the [Bend down] key while holding a QWERTY key
z 	Octave up by pressing a QWERTY key while holding the [Oct up] key (*2)
Modulation depth 1 by pressing the [Oct up] key while holding a QWERTY key
z 	Octave down by pressing a QWERTY key while holding the [Oct down] key (*2)
Modulation depth 2 by pressing the [Oct down] key while holding a QWERTY key (*3)

## Page 18

3.2.2 	Melodic Instrument: Option 1
A 	S 	D 	F 	G 	H 	J 	K 	L
Z 	X 	C 	V 	B 	N 	M
Q 	W 	E 	R 	T 	Y 	U 	I 	O 	P
Figure 15 	QWERTY keypad key assignment for Melodic Instrument: Option 1
z 	Halftone up (sharp; #) by pressing a QWERTY key while holding the [# up] key
Pitchbend up by pressing the [# up] key while holding a QWERTY key (*1)
z 	Halftone down (flat; b) by pressing a QWERTY key while holding the [b down] key
Pitchbend down by pressing the [b down] key while holding a QWERTY key
z 	Octave up by pressing a QWERTY key while holding the [Oct up] key (*2)
Modulation depth 1 by pressing the [Oct up] key while holding a QWERTY key (*3)
z 	Octave down by pressing a QWERTY key while holding the [Oct down] key
Modulation depth 2 by pressing the [Oct down] key while holding a QWERTY key
[3.2.1, 3.2.2 Note]
(*1) Default pitchbend behavior is as follows:
• 	2 halftones (200 cents ) up/down after the QWERTY key has been held for 150ms.
• 	The tuning resolution is linear cents.
A system can be implemented such that the above values can be changed.
(*2) Alternatively, it is acceptable to implement it such that each time the [Oct up] and [Oct down] key is
pressed by itself, the octave is raised or lowered. It is also acceptable to implement the system so that
the user can switch between the two implementations described.
(*3) The depth values of modulation depths 1 and 2 can be implemented differently between systems. It is
also acceptable to implement a system such that the depth values can be edited.

## Page 19

3.3 QWERTY keypad key assignment for drum sets
The following tables illustrate standard QWERTY key assignment for drum sets. They define drum
instruments corresponding to each keypad key number.
3.3.1 	Drum Set
Figure 16 	QWERTY keypad key assignment for Drum Set
z 	Volume accent by pressing a QWERTY key while pressing the [Accent] key.
3.3.2 	Percussion Set
Figure 17 	QWERTY keypad key assignment for Percussion Set
z 	Volume accent by pressing a QWERTY key while pressing the [Accent] key.

## Page 20

3.4 Alternate standard key assignments
The following tables illustrate alternate QWERTY key assignments that mimic other standard key
arrangements. Support for these alternate key assignments are not required.
3.4.1 	Mobile phone numeric keypad-like alternate QWERTY key assignment
The following figure illustrates the QWERTY key assignment that mimics the numeric keypad of a mobile
phone.
Figure 18 	QWERTY keypad key assignment that mimics a mobile phone numeric keypad
3.4.2 	PC keyboard-like alternate QWERTY key assignment 1
The following figure illustrates the QWERTY key assignment that mimics the keyboard of a PC.
A 	S 	D 	F 	G 	H 	J 	K 	L
Z 	X 	C 	V 	B 	N 	M
Q 	W 	E 	R 	T 	Y 	U 	I 	O 	P
TAB
2 	3 	4 	5 	6 	7 	8
; 	:
Figure 19 	QWERTY keypad key assignment that mimics a PC keyboard
z 	Bend Up by pressing the [2] key.
z 	Bend Down by pressing the [1] key.
z 	Bend Off by pressing the [3] key.
z 	Modulation on by pressing the [8] key.
z 	Octave Up by pressing the [X] key. New octave is maintained.
z 	Octave Down by pressing the [Z] key. New octave is maintained.
z 	Velocity Up by pressing the [V] key. New velocity is maintained.
z 	Velocity Down by pressing the [C] key. New velocity is maintained.
z 	Sustain On by pressing the [Tab] key.
3.5 Center octave
Center octave functions in the same manner described for numeric keypads in Section 2.3.

## Page 21

4 	Guidelines for mobile phone as a musical instrument settings
(numeric and QWERTY keypads)
4.1 Recommended settings
The following items are the recommended standard settings for mobile phone as a musical instrument for
both numeric and QWERTY keypads,.
4.1.1 	Instrument type
Sets the performed type of instrument. Any settings regarding the type of instrument being used provided
by content should take priority in determining the type of instrument performed.
Numeric keypad range: Melodic, Drum 1, Drum 2, Percussion 1, Percussion 2
QWERTY keypad range: Melodic, Drum, Percussion
(Default: Melodic)
4.1.2 	Keypad key assignment
Sets the performed keypad key assignment. Any settings regarding the keypad key assignment provided by
content should take priority in determining the keypad key assignment. This setting is only effective when a
melodic instrument has been assigned.
Numeric keypad range: Default, Option 1, Option 2, Option 3, Option 4, Option 5
QWERTY keypad range: Default and Option
(Default: Default)
4.1.3 	Root key
Sets the performed root key. Any settings regarding the root key provided by content should take priority in
determining the performed root key.
Range: -6～0～+6 (Default: 0 (=C))
4.1.4 	Octave
Sets the performed octave. Any settings regarding the octave provided by content should take priority in
determining the performed octave.
Range: -5～0～+5 (Default: 0)
4.1.5 	Scale
Sets the performed scale type. Any settings regarding the scale type provided by content should take
priority in determining the performed scale type.
Scale type setting applies only to the following keypad assignments:
Numeric keypad key assignments for melodic instruments Default, Option 1, Option 3, and Option 4
QWERTY keypad key assignment for melodic instruments Option 1
Range: Major and Natural Minor, (Default: Major)
However, other scales are free to be implemented.
4.1.6 	Program number
Sets the performed channel’s program number. Any settings regarding the program number provided by
content should take priority in determining the performed program number.
Range: 0～127 (Default: 0)
4.1.7 	Volume
Sets the performed channel’s volume. Any settings regarding the program number provided by content
should take priority in determining the performed program number.
Range: 0～127 (Default: Depends on the implementation of the system)
