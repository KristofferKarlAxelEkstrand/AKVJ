---
title: RP 003 General MIDI System Level 1 Specification 96 1 4 0.1
docId: RP-003
version: 96.1.4
protocol: midi1
source: .midi-raw-data/RP-003_General_MIDI_System_Level_1_Specification_96-1-4_0.1.pdf
sourceType: local
pages: 10
sha256: ba09e13069ce3ad79989c3abc1d70c8f1e8ce3e3dd1097d9c241d6665e152bac
extractedAt: 2026-07-16T12:54:07.803Z
summary: General MIDI System Level 1 (GM1) specification: required instrument set, drum map, and controller support.
---
# RP 003 General MIDI System Level 1 Specification 96 1 4 0.1

## Page 1

General MIDI System Level 1
Published by:
The MIDI Manufacturers Association
Los Angeles, CA

## Page 2

PLEASE SEE MMA PUBLICATION “General MIDI System Level 1 Developer
Guidelines” (1996) FOR ADDITIONAL RECOMMENDATIONS AND
CLARIFICATIONS RELATED TO THIS SPECIFICATION.
MMA0007 / RP003
Copyright © 1991, 1994 MIDI Manufacturers Association Incorporated
ALL RIGHTS RESERVED. NO PART OF THIS DOCUMENT MAY BE REPRODUCED IN ANY FORM OR BY ANY MEANS,
ELECTRONIC OR MECHANICAL, INCLUDING INFORMATION STORAGE AND RETRIEVAL SYSTEMS, WITHOUT
PERMISSION IN WRITING FROM THE MIDI MANUFACTURERS ASSOCIATION.
MMA
La Habra CA

## Page 3

General MIDI System Level 1 	1
GM System - Overview
This Specification outlines a minimum MIDI configuration of a “General MIDI System” which
defines a certain class of MIDI controlled sound generators. The General MIDI (or GM) System
provides a high degree of compatibility between MIDI synthesizers, and adds the ability to play
songs (in the form of MIDI data) created for any given MIDI synthesizer module that follows
this Specification.
This class of products are intended for broad applications in the music, consumer, and
entertainment markets, due to increased compatibility and unprecedented ease-of-use.
Background
Without this specification, when an end user tries to play back MIDI data on a given set of
MIDI synthesizers the results can vary widely depending on what MIDI synthesizers are
involved and what their capabilities are. The MIDI data has to be specially prepared for those
particular synthesizers and drum machines in order to sound exactly as originally intended.
For example, the sound that plays on MIDI note messages sent over channel one/program
number one is determined by the individual synthesizer manufacturer. However, there usually
is little similarity between program numbers and expected timbres on today’s popular
synthesizers. Other examples are the variability of pitch bend range, octave registration, or the
drum note mapping.
This variety is wonderful for professional users, but can be troublesome for consumers and
music authors. Therefore, it has in the past been virtually impossible to produce MIDI data
that will play on all of the popular MIDI synthesizers. The data had to be made manufacturer
and device specific. This has limited the availability of MIDI data titles to individual
instruments or at best to those of a particular manufacturer.
The main barrier to resolving this problem is that the original MIDI specification does not
specify a “minimum MIDI configuration” or set of capabilities that one could rely on being in a
given synthesizer. A particular MIDI device has no idea what MIDI device is connected to the
other end of its MIDI cable, and until now there was no industry-standard minimum
configuration that manufacturers or authors could use as a reference.
The Solution
This General MIDI System is the solution to that problem. It describes a minimum number of
voices, sound locations, drum note mapping, octave registration, pitch bend range, and
controller usage, thereby defining a given set of capabilities to expect in a given synthesizer
module. This mode will be identified by a logo on the instrument such as the “Compact Disc”
logo shown on all devices supporting the CD standard.
General MIDI is a mode that synthesizers can be switched in and out of to provide a common
“base case.” Higher end products will likely support additional modes of operation and should
not be limited by General MIDI. The General MIDI Specification is also left open to further
extensions (or “levels”) for advanced applications and continued improvements.

## Page 4

2 	General MIDI System Level 1
GM System - Level 1 Performance Requirements
General MIDI Sound Generator Requirements
Synthesis/Playback Technology (Sound Source Type):
• Up to the manufacturer.
Number of Voices:
• A minimum of:
1) 24 fully dynamically allocated voices available simultaneously for both melodic and
percussive sounds; or:
2) 16 dynamically allocated voices for melody plus 8 for percussion.
MIDI Channels Supported:
• All 16 MIDI channels.
• Each channel can play a variable number of voices (polyphony).
• Each channel can play a different instrument (timbre).
• Key-based Percussion is always on channel 10.
Instruments:
• A minimum of 128 presets for Instruments (MIDI program numbers), conforming to
the "GM Sound Set" (see Table 2)
• A minimum of 47 preset percussion sounds conforming to the "GM Percussion Map"
(see Table 3)
General MIDI Sound Generator Recommended Hardware
• Master Volume control.
• MIDI In connector (Out and Thru connectors are optional).
• Audio Out (2 – left & right) plus Headphones connectors.

## Page 5

General MIDI System Level 1 	3
Level 1 Performance Requirements
General MIDI Protocol Implementation Requirements
Note on/Note off:
• Octave Registration: Middle C = MIDI Key 60 (3CH)
• All voices, including percussion, respond to velocity
• Voices dynamically allocated (notes/drums can re-attack using free voices)
Controller Changes:
Controller # 	Description
1 	Modulation
7 	Volume
10 	Pan
11 	Expression
64 	Sustain
121 	Reset All Controllers
123 	All Notes Off
Registered Parameter # 	Description
0 	Pitch Bend Sensitivity
1 	Fine Tuning
2 	Coarse Tuning
Channel Messages:
• Channel Pressure (Aftertouch)
• Pitch Bend (default range = ±2 semitones)
Default Settings:
• Bend="0", Volume="100" (0-127), Controllers "normal"

## Page 6

4 	General MIDI System Level 1
GM System - Additional Messages
General MIDI System Messages
In addition to the above already-defined MIDI messages, there is a defined set of Universal
Non-Real Time SysEx messages for turning General MIDI on and off at a sound module
(should it have more than one mode of operation):
• Turn General MIDI System On: 	F0 7E <device ID> 09 01 F7
F0 7E 	Universal Non-Real Time SysEx header
<device ID> 	ID of target device (suggest using 7F: Broadcast)
09 	sub-ID #1 = General MIDI message
01 	sub-ID #2 = General MIDI On
F7 	EOX
• Turn General MIDI System Off: 	F0 7E <device ID> 09 02 F7
F0 7E 	Universal Non-Real Time SysEx header
<device ID> 	ID of target device (suggest using 7F: Broadcast)
09 	sub-ID #1 = General MIDI message
02 	sub-ID #2 = General MIDI Off
F7 	EOX

## Page 7

General MIDI System Level 1 	5
GM System - Level 1 Sound Set
General MIDI Sound Set Groupings:
(all channels except 10)
Prog # 	Instrument Group 	Prog # 	Instrument Group
1-8 	Piano 	65-72 	Reed
9-16 	Chromatic Percussion 	73-80 	Pipe
17-24 	Organ 	81-88 	Synth Lead
25-32 	Guitar 	89-96 	Synth Pad
33-40 	Bass 	97-104 	Synth Effects
41-48 	Strings 	105-112 	Ethnic
49-56 	Ensemble 	113-120 	Percussive
57-64 	Brass 	121-128 	Sound Effects
Table 1
General MIDI Sound Set:
(MIDI Program Numbers 1 – 128; all channels except 10)
Prog # Instrument
1. 	Acoustic Grand Piano
2. 	Bright Acoustic Piano
3. 	Electric Grand Piano
4. 	Honky-tonk Piano
5. 	Electric Piano 1
6. 	Electric Piano 2
7. 	Harpsichord
8. 	Clavi
9. 	Celesta
10. 	Glockenspiel
11. 	Music Box
12. 	Vibraphone
13. 	Marimba
14. 	Xylophone
15. 	Tubular Bells
16. 	Dulcimer
17. 	Drawbar Organ
18. 	Percussive Organ
19. 	Rock Organ
20. 	Church Organ
21. 	Reed Organ
22. 	Accordion
23. 	Harmonica
24. 	Tango Accordion
25. 	Acoustic Guitar (nylon
26. 	Acoustic Guitar (steel)
27. 	Electric Guitar (jazz)
28. 	Electric Guitar (clean)
29. 	Electric Guitar (muted
30. 	Overdriven Guitar
31. 	Distortion Guitar
32. 	Guitar harmonics
Prog # Instrument
33. 	Acoustic Bass
34. 	Electric Bass (finger)
35. 	Electric Bass (pick)
36. 	Fretless Bass
37. 	Slap Bass 1
38. 	Slap Bass 2
39. 	Synth Bass 1
40. 	Synth Bass 2
41. 	Violin
42. 	Viola
43. 	Cello
44. 	Contrabass
45. 	Tremolo Strings
46. 	Pizzicato Strings
47. 	Orchestral Harp
48. 	Timpani
49. 	String Ensemble 1
50. 	String Ensemble 2
51. 	SynthStrings 1
52. 	SynthStrings 2
53. 	Choir Aahs
54. 	Voice Oohs
55. 	Synth Voice
56. 	Orchestra Hit
57. 	Trumpet
58. 	Trombone
59. 	Tuba
60. 	Muted Trumpet
61. 	French Horn
62. 	Brass Section
63. 	SynthBrass 1
64. 	SynthBrass 2
Prog # Instrument
65. 	Soprano Sax
66. 	Alto Sax
67. 	Tenor Sax
68. 	Baritone Sax
69. 	Oboe
70. 	English Horn
71. 	Bassoon
72. 	Clarinet
73. 	Piccolo
74. 	Flute
75. 	Recorder
76. 	Pan Flute
77. 	Blown Bottle
78. 	Shakuhachi
79. 	Whistle
80. 	Ocarina
81. 	Lead 1 (square)
82. 	Lead 2 (sawtooth)
83. 	Lead 3 (calliope)
84. 	Lead 4 (chiff)
85. 	Lead 5 (charang)
86. 	Lead 6 (voice)
87. 	Lead 7 (fifths)
88. 	Lead 8 (bass + lead)
89. 	Pad 1 (new age)
90. 	Pad 2 (warm)
91. 	Pad 3 (polysynth)
92. 	Pad 4 (choir)
93. 	Pad 5 (bowed)
94. 	Pad 6 (metallic)
95. 	Pad 7 (halo)
96. 	Pad 8 (sweep)
Prog # Instrument
97. 	FX 1 (rain)
98. 	FX 2 (soundtrack)
99. 	FX 3 (crystal)
100. 	FX 4 (atmosphere)
101. 	FX 5 (brightness)
102. 	FX 6 (goblins)
103. 	FX 7 (echoes)
104. 	FX 8 (sci-fi)
105. 	Sitar
106. 	Banjo
107. 	Shamisen
108. 	Koto
109. 	Kalimba
110. 	Bag pipe
111. 	Fiddle
112. 	Shanai
113. 	Tinkle Bell
114. 	Agogo
115. 	Steel Drums
116. 	Woodblock
117. 	Taiko Drum
118. 	Melodic Tom
119. 	Synth Drum
120. 	Reverse Cymbal
121. 	Guitar Fret Noise
122. 	Breath Noise
123. 	Seashore
124. 	Bird Tweet
125. 	Telephone Ring
126. 	Helicopter
127. 	Applause
128. 	Gunshot
Table 2

## Page 8

6 	General MIDI System Level 1
Level 1 Sound Set
General MIDI Percussion Map:
(Channel 10)
MIDI Key Drum Sound 	MIDI Key Drum Sound 	MIDI Key Drum Sound
35 	Acoustic Bass Drum 	51 	Ride Cymbal 1 	67 	High Agogo
36 	Bass Drum 1 	52 	Chinese Cymbal 	68 	Low Agogo
37 	Side Stick 	53 	Ride Bell 	69 	Cabasa
38 	Acoustic Snare 	54 	Tambourine 	70 	Maracas
39 	Hand Clap 	55 	Splash Cymbal 	71 	Short Whistle
40 	Electric Snare 	56 	Cowbell 	72 	Long Whistle
41 	Low Floor Tom 	57 	Crash Cymbal 2 	73 	Short Guiro
42 	Closed Hi Hat 	58 	Vibraslap 	74 	Long Guiro
43 	High Floor Tom 	59 	Ride Cymbal 2 	75 	Claves
44 	Pedal Hi-Hat 	60 	Hi Bongo 	76 	Hi Wood Block
45 	Low Tom 	61 	Low Bongo 	77 	Low Wood Block
46 	Open Hi-Hat 	62 	Mute Hi Conga 	78 	Mute Cuica
47 	Low-Mid Tom 	63 	Open Hi Conga 	79 	Open Cuica
48 	Hi Mid Tom 	64 	Low Conga 	80 	Mute Triangle
49 	Crash Cymbal 1 	65 	High Timbale 	81 	Open Triangle
50 	High Tom 	66 	Low Timbale
Table 3

## Page 9

General MIDI System Level 1 	7
GM System - Level 1 Detailed Explanation
GM Sound Set
For music authors, one of the most frustrating parts of the original MIDI specification was the
lack of sound definitions. For example, where is the piano sound on this instrument (i.e. what
is the program number)? The solution lies in a "sound-set-to-Program-Change-number"
mapping that is specific to the General MIDI System.
This mapping only needs to take effect while operating inside a General MIDI System, and
would otherwise let manufacturers organize sounds in any way they wish. In short, while
operating inside a General MIDI System, this map takes effect – in any other mode, the
manufacturer could present the sounds in any manner desired.
The General MIDI Sound Set (instrument and percussion maps) is shown in Tables 2 and 3.
This mapping describes the MIDI Program Change numbers used to select sounds under the
General MIDI System. The instrument would map these General MIDI program numbers to
its own internal organization. MIDI Program numbers can be changed in real time during
play.
GM Sound Definitions
General MIDI does not recommend any particular method of synthesis or playback. Each
manufacturer should be free to express their own ideas and personal aesthetics when it comes
to picking the exact timbres for each preset. In particular, the names in parentheses after
each of the synth leads, pads, and sound effects are intended as guides.
Therefore, to promote consistency in song playback across a range of sound modules, a set of
guidelines for General MIDI Score authors and Instrument manufacturers will be produced.
GM Performance Notes
For all instruments, the Modulation Wheel (Controller #1) will change the nature of the sound
in the most natural (expected) way. i.e. depth of LFO; change of timbre; add more tine sound;
etc.)
There are other MIDI messages currently pending in the MMA and JMSC that will become
part of a General MIDI Level 2 Specification.

## Page 10

8 	General MIDI System Level 1
GM System - Logos
Rules for Application
The MMA and JMSC have approved the following design for a logo which will indicate a
product that conforms to this specification.
For sound generators, GM is intended to allow the user to play back any score developed for
GM without user intervention. This means a GM sound source must support all of the features
described in that section without requiring any modification by the user. Only products which
meet these requirements should have the GM logo.
Software, such as sequencer and notation programs, games, or other applications which create
or play MIDI music, may also display a GM logo, as long as the product does not interfere with
the performance of required GM data when used with a compatible sound source. For example,
software which allows the user to select different sounds on playback should include a resident
list of the GM sounds. In addition, any software which is GM compatible must properly play
back ⎯ without modification ⎯ all controller settings and other required messages which may
be found in a MIDI file or otherwise performed via MIDI.
GM Logo Variations
The logo is available from the MMA upon application and signing of a license agreement. The
agreement specifies the terms, conditions and restrictions for application of a GM logo to
products, packaging, and marketing materials. For details please refer to the current license
agreement.
GM System Logo - This version of the logo can be applied to sound
generators, applications software (games, sequencers, etc.), and scores
(MIDI data) which conform to the GM System Level 1 Specification.
GM Sound Set - This version of the logo is intended for display with soundsets (samples or patches) designed to modify a specific sound source to be
GM System Level 1 compatible.
