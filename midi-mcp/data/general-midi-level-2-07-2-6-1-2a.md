---
title: General MIDI 2 February 6, 2007
version: 07.2.6
protocol: midi1
source: .midi-raw-data/General_MIDI_Level_2_07-2-6_1.2a.pdf
sourceType: local
pages: 38
sha256: 56af9df9d9da3cbca39e743af0595a8441246124cdaa3f70736071ced164996e
extractedAt: 2026-07-16T12:54:06.920Z
summary: General MIDI Level 2 (GM2) specification: extended instrument set, controller behavior, and universal SysEx requirements.
---
# General MIDI 2 February 6, 2007

## Page 1

General MIDI 2
February 6, 2007
Version 1.2a
Including PAN Formula, MIDI Tuning Changes and Mod Depth Range Recommendation
Published By:
The MIDI Manufacturers Association
Los Angeles, CA

## Page 2

PREFACE
Abstract:
General MIDI 2 is a group of extensions made to General MIDI (Level 1) allowing for expanded standardized
control of MIDI devices. This increased functionality includes extended sounds sets and additional
performance and control parameters.
New MIDI Messages:
Numerous new MIDI messages were defined specifically to support the desired performance features of
General MIDI 2. The message syntax and details are published in the Complete MIDI 1.0 Detailed
Specification version 1999 (and later):
MIDI Tuning Bank/Dump Extensions (C/A-020)
Scale/Octave Tuning (C/A-021)
Controller Destination Setting (C/A-022)
Key-Based Instrument Controll SysEx Messages (C/A-023)
Global Parameter Control SysEx Message (C/A-024)
Master Fine/Course Tuning SysEx Messages (C/A-025)
Modulation Depth Range RPN (C/A-026)
General MIDI 2 Message:
Universal Non-Realtime System Exclusive sub-ID #2 under General MIDI sub-ID #1 is reserved for General
MIDI 2 system messages (see page 21 herein).
Changes from version 1.0 to version 1.1:
o 	Section 3.3.5: changed PAN formula per RP-036
o 	Section 4.7: Added new recommendations per RP-037
Changes from version 1.1 to version 1.2:
o 	Section 3.4.4: added recommendation for Mod Depth Range Response per RP-045
o 	V 1.2a is reformatted for PDF distribution
General MIDI 2 Specification (Recommended Practice)
RP-024 (incorporating changes per RP-036, RP-037, and RP-045)
Copyright ©1999, 2003, and 2007 MIDI Manufacturers Association Incorporated
ALL RIGHTS RESERVED. NO PART OF THIS DOCUMENT MAY BE REPRODUCED OR TRANSMITTED
IN ANY FORM OR BY ANY MEANS, ELECTRONIC OR MECHANICAL, INCLUDING INFORMATION
STORAGE AND RETRIEVAL SYSTEMS, WITHOUT PERMISSION IN WRITING FROM THE MIDI
MANUFACTURERS ASSOCIATION.
Printed 2007
MMA
PO Box 3173
La Habra CA 90632-3173

## Page 3

General MIDI 2 v1.2a 	Page i
Table Of Contents
1. DEFINITIONS 	1
2. GENERAL REQUIREMENTS 	2
2.1 Sound Source Type 	2
2.2 Number of Notes 	2
2.3 MIDI Channels 	2
2.4 Melody Channels and Rhythm Channels 	2
2.5 Modes 	2
2.6 Timbres 	2
2.7 Pitch 	3
2.7.1 Melody Channels (Tuned instruments) 	3
2.7.2 Rhythm Channels 	3
2.8 Sound Generator Assignment 	4
2.8.1 Rhythm Channels 	4
2.9 Effects 	4
3. RESPONSE TO MIDI CHANNEL MESSAGES 	5
3.1 Note On/ Note Off 	5
3.2 Program Change Message 	5
3.3 Control Change Messages 	5
3.3.1 Bank Select (cc#0/32) 	5
3.3.2 Modulation Depth (cc#1) 	6
3.3.3 Portamento Time (cc#5) 	6
3.3.4 Channel Volume (cc#7) 	6
3.3.5 Pan (cc#10) 	7
3.3.6 Expression (cc#11) 	8
3.3.7 Hold1 (Damper) (cc#64) 	8
3.3.8 Portamento ON/OFF (cc#65) 	9
3.3.9 Sostenuto (cc#66) 	9
3.3.10 Soft (cc#67) 	9
3.3.11 Filter Resonance (Timbre/Harmonic Intensity) (cc#71) 	9
3.3.12 Release Time (cc#72) 	10
3.3.13 Attack time (cc#73) 	10
3.3.14 Brightness (cc#74) 	10
3.3.15 Decay Time (cc#75) 	10
3.3.16 Vibrato Rate (cc#76) 	11
3.3.17 Vibrato Depth (cc#77) 	11
3.3.18 Vibrato Delay (cc#78) 	11
3.3.19 Reverb Send Level (cc#91) 	11
3.3.20 Chorus Send Level (cc#93) 	11
3.3.21 Data Entry (cc#6/38) 	12
3.3.22 RPN LSB/MSB (cc#100/101) 	12

## Page 4

General MIDI 2 v1.2a 	Page ii
Table Of Contents - Continued
3.4 RPN (Registered Parameter Numbers) 	12
3.4.1 00H / 00H Pitch Bend Sensitivity 	12
3.4.2 00H / 01H Channel Fine Tune 	12
3.4.3 00H / 02H Channel Coarse Tune 	13
3.4.4 00H / 05H Modulation Depth Range (Vibrato Depth Range) 	13
3.4.5 7FH / 7FH (RPN NULL) 	13
3.5 Channel Mode Messages 	13
3.5.1 All Sound Off (cc#120) 	13
3.5.2 Reset All Controllers (cc#121) 	14
3.5.3 All Notes Off (cc#123) 	14
3.5.4 Omni Mode Off (cc#124) 	14
3.5.5 Omni Mode On (cc#125) 	14
3.5.6 Mono Mode On (Poly Mode Off) (cc#126) 	14
3.5.7 Poly Mode On (Mono Mode Off) (cc#127) 	15
3.6 Pitch Bend 	15
3.7 Channel Pressure 	15
4. UNIVERSAL SYSTEM EXCLUSIVE MESSAGES 	16
4.1 Master Volume 	16
4.2 Master Fine Tuning 	16
4.3 Master Coarse Tuning 	16
4.4 Reverb Parameters 	16
4.4.1 Reverb Type 	17
4.4.2 Reverb Time 	17
4.5 Chorus Parameters 	18
4.5.1 Chorus Type 	18
4.5.2 Mod Rate 	18
4.5.3 Mod Depth 	18
4.5.4 Feedback 	18
4.5.5 Send to Reverb 	19
4.6 Controller Destination Setting 	19
4.6.1 Channel Pressure (Aftertouch) 	19
4.6.2 Controller (Control Change) 	20
4.7 Scale/Octave Tuning Adjust 	21
4.8 Key-Based Instrument Controllers 	21
4.9 GM System Messages 	22
4.9.1 GM2 System On 	22
4.9.2 GM1 System On (currently called GM System On) 	22
4.9.3 GM System Off 	22
5. OTHER MIDI MESSAGES 	23
5.1 Active Sensing 	23
6. GM2™ LOGO 	24
7. APPENDIX A: GM 2 SOUND SET 	25
8. APPENDIX B: GM 2 PERCUSSION SOUND SET 	32

## Page 5

1. Definitions
In this document, all GM2 features are described as being either [required], [recommended], [optional] or [not allowed].
These terms are used to mean the following:
The information in this section must be implemented by the manufacturer in order to meet the GM2 specification.
[recommended]
The information in this section may be implemented by the manufacturer, but it is not required. If the feature is
implemented, it must meet the specifications for the feature as defined in the GM2 specification. Implementation of the
feature will allow further compatibility.
[optional]
The information in this section is neither recommended nor required. If the feature is implemented, it must meet the
specifications for the feature as defined in the GM2 specification.
[not allowed]
A manufacturer may not implement this feature, because it would prevent GM2 compatibility.

## Page 6

2. General Requirements
2.1 Sound Source Type
Undefined. Each manufacturer can choose the most appropriate technology, as long as the GM2 requirements are met.
2.2 Number of Notes
The sound engine must be capable of supplying polyphony of 32 or more allocated notes simultaneously in any
combination of desired sounds.
2.3 MIDI Channels
All 16 MIDI Channels must be addressable simultaneously.
2.4 Melody Channels and Rhythm Channels
A Melody Channel is a Channel that can select timbres or sounds from the GM2 Sound Set. These timbres are Programs
in Bank 79H/xxH (79H/00H, 79H/01H, 79H/02H, etc.).
A Rhythm Channel is a Channel that can select timbres from the GM2 Percussion Sound Set. These timbres are
Programs in Bank 78H/xxH.
Any Channel can be used as a Melody Channel, including Channel 10. Channels 10 and 11 can be used as Rhythm
Channels (see Bank Select). Channel 10 defaults to a Rhythm Channel and Channel 11 defaults to a Melody Channel.
[optional]
Any Channel can be used as a Rhythm Channel by sending the Bank Select message 78H/xxH followed by a Program
Change message. GM2 scores that use this optional message may be incompatible with some GM2 devices.
2.5 Modes
The initial mode for all MIDI Channels is MODE 3 (OMNI OFF, POLY). This mode is commonly called “Poly Mode”
or “Polyphonic Mode” for a single Channel, but is also known as “Multi Mode” when applied to all Channels in a
device.
Each Channel can play a different instrument (timbre or sound) and can respond to Channel Voice Messages (Note On,
Note Off, Control Change, RPN, Channel Pressure, Program Change, Pitch Bend) and Channel Mode Messages
individually.
Melody Channels also support MODE 4, (OMNI OFF, MONO) when M=1 only. Any other value of M is invalid,
causing the Mode message to be ignored. This mode is commonly called “Mono Mode” or Monophonic Mode”. Note:
M=1 is the value byte for controller #126, which places the MIDI Channel into Mono Mode.
2.6 Timbres
All timbres described in both the GM2 Sound Set and GM2 Percussion Sound Set (Appendices A and B) must be
provided.

## Page 7

Bank 79H/00H shall conform to the GM1 Sound Set.
Note numbers 35 – 81 (23H - 51H) in Program 1 of GM2 Rhythm Channel (Bank 78H/00H) shall conform to the GM1
Percussion Sound Set.
The Program numbers that are undefined by the GM2 Sound Set in Banks 78H/xxH and 79H/xxH are reserved for
future expansion and may not be used until defined by MMA and AMEI.
[recommended]
If an undefined Program is selected in Banks 79H/xxH, the Program from Bank 79H/00H (the GM1 Sound Set) shall be
played. Similarly, if an undefined Program in Bank 78H/00H is selected, Program 1 (the GM1 Drum Set) shall be used.
[optional]
Displayed timbre names can be different from the names on the list of GM2 Sound Set. Also, the same timbre can be
used to support different Program Changes. For example, an identical timbre can be used for both basic timbre "41:
Violin" and "42: Viola", but in higher-quality GM2 devices these two sounds will be noticeably different.
2.7 Pitch
2.7.1 Melody Channels (Tuned instruments)
2.7.1.1 Pitched instrument sounds
Initial tuning is set to equal temperament.
Middle C Note = Note number 60 (3CH).
Note number 69 (45H) is tuned to 440Hz (when fine tune, coarse tune, and pitch bend are set to center.)
Each Note shall play the correct pitch across its key range listed in the GM2 Sound Set (see Appendix A).
Within the key range of the GM2 Sound Set, each timbre shall have the appropriate sonic characteristics of the name of
its instrument.
A Pitch Bend of +/-1 octave for all the Notes in a defined key range shall work correctly without aliasing, and Note
numbers 36-96 shall sound with the correct pitch regardless of the key range listed in the GM2 Sound Set.
[optional]
Notes outside the key range may not necessarily have a pleasing sound, but they should play the correct pitch (no octave
folding). The notes should be free of noisy distortions although the sound may lose its character outside the specified
key range.
2.7.1.2 Effect sounds
Pitch and temperament are undefined. The normal Note number for the effect sound shall be in the octave corresponding
to MIDI Note numbers 60-72.
[optional]
The pitch shall change by one semitone for each MIDI Note number. If the pitch of the effect can be reasonably
identified, it shall be in tune with the MIDI Note number.
2.7.2 Rhythm Channels
A specific rhythm timbre is assigned to each key or Note number, but some note numbers are assigned to play silence
(no sound at all).

## Page 8

2.8 Sound Generator Assignment
Regardless of its Channel, a new Note On is assigned to an unused sound generator. There is no Channel-specific
priority defined. Manufacturers can decide how to assign sound generators for the following situations:
1. 	When a new Note On is received while all the sound generators of the sound source are already in use.
2. 	When one key is hit repeatedly.
3. 	When one key has multiple generators that are active simultaneously.
2.8.1 Rhythm Channels
Note Off messages are ignored on Rhythm Channels, with the exception of the ORCHESTRA SET (specifically, Note
number 88) and the SFX SET (Note numbers 47-84).
Some percussion timbres require a mutually exclusive Note On/Off assignment. For example, when a Note On message
for Note number 42 (Closed Hi Hat) is received while Note number 46 (Open Hi Hat) is sounding, Note number 46 is
promptly muted and Note number 42 sounds.
The following combinations of timbres use mutually exclusive assignment:
<Standard Set> 	<Analog Set>
Closed HH (42) / Pedal HH (44) / Open HH (46) 	Analog CHH 1 (42) / Analog CHH 2 (44) / Analog OHH (46)
Short Whistle (71) / Long Whistle (72)
Short Guiro (73) / Long Guiro (74) 	<Orchestra Set>
Mute Cuica (78) / Open Cuica (79) 	Closed HH 2 (27) / Pedal HH (28) / Open HH 2 (29)
Mute Triangle (80) / Open Triangle (81)
Scratch Push (29) / Scratch Pull (30) 	<SFX Set>
Mute Surdo (86) / Open Surdo (87) 	Scratch Push (41) / Scratch Pull (42)
2.9 Effects
The whole device must have one chorus effect and one reverb effect. Each Channel must have its own adjustable send
levels to the chorus and the reverb. A connection from chorus to reverb must be provided.
[recommended]
An example of the recommended design is shown below:

## Page 9

3. Response to MIDI Channel Messages
3.1 Note On/ Note Off
All Notes of every Bank and Program (all sounds/timbres) shall respond to velocity.
The velocity effect on volume is not defined.
3.2 Program Change Message
Default Value: 1 (00H)
(Note: Program Change messages in consumer documentation are normally one-based; therefore, the decimal value of 1
presented here, as the default, is equivalent to 00H.)
Sets the timbre for the specified Channel.
When the Channel is a Melody Channel, the timbre is selected from the Bank specified by Bank Select (using Bank
Select 79H/xxH, with Bank 79H/00H corresponding to the GM1 sound set).
When the Channel is a Rhythm Channel (using Bank Select 78H/xxH, with Bank 78H/00H corresponding to the GM1
and GM2 Percussion Sound Sets [see Appendix B]), a Drum Set is selected with the Program Change.
[recommended]
Currently sounding Notes shall not be released or muted when a Program Change is received. Instead, they shall
continue sounding with the timbre of the prior Program until a Note Off (or Note On with a velocity of 0) is received for
that Note. All new Note On messages shall use the new timbre.
The GM2 device shall not change or reset the values of any Control Change, RPN, Pitch Bend, or Channel Pressure
when a Program Change is received.
3.3 Control Change Messages
3.3.1 Bank Select (cc#0/32)
Default Value 	- All Channels except Channel 10: 	79H/00H
- Channel 10: 	78H/00H
Bank Select selects the desired Bank for the specified Channel. The first byte listed is the MSB, transmitted on cc#0.
The second byte listed is the LSB, transmitted on cc#32. Banks are listed in the GM2 Sound Set table (Appendix A).
Bank Select 79H/00H corresponds to the GM1 Sound Set, as defined in the GM1 Recommended Practice. Bank Select
78H/00H Program 1 (00H) corresponds to the GM1 Drum Set. (Note: Program Change messages in consumer
documentation are normally one-based; therefore, the decimal value of 1 presented here is equivalent to 00H.)
The Bank Select message shall not affect any change in sound until a subsequent Program Change message is received.
Channels 10 and 11 are special in that they can function as a Melody Channel or a Rhythm Channel, depending upon the
Bank Select message. On Channels 10 and 11, Bank Select 78H/xxH followed by a Program Change will cause the
Channel to become a Rhythm Channel, using the Drum Set selected by the Program Change. Bank Select 79H/xxH
followed by a Program Change will cause the Channel to become a Melody Channel, with the sound or timbre selected
by the Program Change.

## Page 10

[recommended]
Currently sounding Notes shall not be released or muted when a Bank Select and Program Change is received. Instead,
they shall continue sounding with the timbre of the prior Bank/Program until a Note Off (or Note On with a velocity of
0) is received for that Note. All new Note On messages use the new timbre.
[optional]
Any Channel can be used as a Rhythm Channel by sending the Bank Select message 78H/xxH followed by a Program
Change message. GM2 scores that use this optional message may be incompatible with some GM2 devices.
3.3.2 Modulation Depth (cc#1)
Default Value: 0
Changes the vibrato (LFO pitch modulation) depth of the specified Channel.
The waveform of the LFO shall be a triangle wave or a sine wave.
The depth of change at the maximum value conforms to the value that is set by Modulation Depth Range (Vibrato Depth
Range), described in section 3.4.4.
The vibrato depth controlled by Modulation Depth follows a curve that is linear in cents.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.3 Portamento Time (cc#5)
Default Value: 0
Sets the pitch increment speed for the specified Channel when Portamento (cc#65) is on.
Monophonic (MODE 4) Channels support portamento.
[recommended]
Pitch increment rate shall vary according to the recommended example shown below.
Portamento Rate
0.0100
0.1000
1.0000
10.0000
100.0000
1,000.0000
0 	16 	32 	48 	64 	80 	96 	112
	Pitch increment speed
[cent/msec]
[optional]
Polyphonic (MODE 3) Channels also support portamento.
3.3.4 	Channel Volume (cc#7)
Default Value: 100 (64H)
Changes the volume of all sounds on the specified MIDI Channel and thus the relative volume balance among the
Channels. The resulting Channel volume is, however, also dependent on Expression (cc#11), as well as the MIDI Master
Volume Universal SysEx message which is used to set the overall volume of all Channels.

## Page 11

Regarding the curve of volume change messages, the square of the value is proportional to the volume.
Example 	CC#7 	amplitude 	proportional to
-------- 	------------- 	----------------------------
127 	0 dB 	127 x 127= 16129
96 	- 4.9 dB 	96 x 96 = 	9216
64 	-11.9 dB 	64 x 64 = 	4096
32 	-23.9 dB 	32 x 32 = 	1024
16 	-36.0 dB 	16 x 16 = 	256
0 	- ∞ 	0 x 0 = 	0
The formula used is: 	gain in dB = 40 * log 10(cc7/127)
3.3.5 Pan (cc#10)
Default Value: 64 (center) (40H)
Sets the stereo position of the specified Channel.
This message will pan a timbre on a Melody Channel anywhere in the stereo field from hard left (value = 0, 00H) to hard
right (value = 127, 7FH).
When the specified Channel is a Rhythm Channel, this message will set the nominal (base) stereo position of the entire
percussion set. This message cannot be used to pan an individual percussion instrument or sound effect. If panning of an
individual percussion instrument or sound effect on a Rhythm Channel is required, its panning shall be set in advance
using the Key-Based Instrument Controllers Universal Real-Time SysEx message (see section 4.8). The GM2
Percussion Sound Set table (Appendix B) shows recommended preset values. The Pan message will offset the values
defined for the percussion set.
[recommended]
It is not necessary to pan a Note that is currently sounding. However, if a currently sounding Note is panned, the
panning shall be done without audible artifacts or clicks⎯no "zipper" noise.
A recommended example of the Pan curve is shown below:
P a n T a b le
0 .0 0
2 0 .0 0
4 0 .0 0
6 0 .0 0
8 0 .0 0
1 0 0 .0 0
0 	1 6 	3 2 	4 8 	6 4 	8 0 	9 6 	1 1 2
The following formulas are recommended (see AMEI/MMA RP-037 for details):
Left Channel Gain [dB] = 20*log (cos (Pi/2* max(0,CC#10 - 1)/126)
Right Channel Gain [dB] = 20*log (sin (Pi /2* max(0,CC#10 - 1)/126)
The rate of Pan [%]

## Page 12

3.3.6 Expression (cc#11)
Default Value: 127 (7FH)
Modifies the volume set by Channel Volume (cc#7) on the specified Channel. The resulting Channel volume is
dependent on Volume (cc#7), Expression (cc#11), as well as the MIDI Master Volume Universal SysEx message that is
used to set the overall volume of all Channels.
Note: Expression (cc#11) and Channel Volume (cc#7) are used for different purposes. Channel Volume (cc#7) should
be used to set the overall volume of the Channel prior to music data playback as well as for mixdown fader-style
movements, while Expression (cc#11) should be used during music data playback to attenuate the programmed MIDI
volume (cc#7) data, thus creating diminuendos and crescendos. This enables a listener, after the fact, to adjust the
relative mix of instruments without destroying the dynamic expression of that instrument.
In the curve of volume changes responding to the Expression value, the square of the value is proportional to the
volume. An example of the amplitude relationship between volume and expression is shown below.
Example 	CC#7 	CC#11 	Total amplitude 	CC#7 	CC#11 	Total amplitude
------- 	--------- 	--------------------- 	------- 	--------- 	----------------------
127 	127 	0dB 	127 	96 	- 4.9dB
96 	127 	- 4.9dB 	127 	64 	-11.9dB
64 	127 	-11.9dB 	127 	32 	-23.9dB
32 	127 	-23.9dB 	127 	0 	- ∞
16 	127 	-36.0dB 	64 	64 	-23.8dB
0 	127 	- ∞ 	32 	96 	-28.8dB
The formula used is: 	Gain in dB = (40 * log 10(cc7/127)) + (40 * log 10(cc11/127))
3.3.7 Hold1 (Damper) (cc#64)
Default Value: 0 (OFF)
Turns Damper ON or OFF for the specified Channel. (Also known as “sustain pedal”.) Damper values between 0 and 63
are recognized as OFF, and values between 64 and 127 are recognized as ON (except if used as Half Damper, below).
Piano and related timbres shall also respond to re-damper (as in when a Damper pedal is stepped on immediately
AFTER piano keys are released).
[recommended]
Response to the Damper controller shall be similar to the behavior of the Damper foot pedal on a piano. In terms of a
traditional ADSR envelope, the Damper controller response shall be as follows:
- When a Note-Off (or a Note-On with a velocity of 0) is received and the Damper is ON, the Note-Off shall
be deferred (ignored for now). When the Damper transitions from ON to OFF, any notes which have deferred
Note-Offs should now respond to the note off, and the amplitude envelope should enter the Release stage,
from wherever it was.
- When the Damper transitions from OFF to ON, notes currently sounding shall be unaffected. If the level of a
note that has been released (either from a Note-Off, a Note-On with a velocity of 0, or from a Damper ON to
OFF) is greater than the envelope Sustain level, the device should switch back to the Decay or Sustain portion
of the envelope. If the note's current level is not greater than the Sustain level, the Damper's transition should
be ignored.
- So, for example, an Organ note, having received a note-off followed by a Damper ON, will not be "caught"
by the damper. A piano note, however, with its Sustain level of zero, would be "caught."
Rhythm Channels shall not respond to this message.

## Page 13

[optional]
A GM2 device may also respond to Hold1 as a continuous controller, in which case it acts as a Half-Damper.
3.3.8 Portamento ON/OFF (cc#65)
Default Value: 0 (OFF)
Turns the Portamento effect ON or OFF for the specified Channel.
Values between 0 and 63 are recognized as OFF; values between 64 and 127 are recognized as ON.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.9 Sostenuto (cc#66)
Default Value: 0 (OFF)
Turns Sostenuto ON or OFF for the specified Channel.
Values between 0 and 63 are recognized as OFF; values between 64 and 127 are recognized as ON.
Sostenuto is similar to Damper. It acts as a latch for currently held notes (those without any note-off message). When
Sostenuto transitions from OFF to ON, notes already held won’t be released until the later of a) when the note receives a
note-off, or b) when Sostenuto transitions from ON to OFF. However, notes which are played (receive note-on message)
while Sostenuto remains ON are unaffected.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.10 Soft (cc#67)
Default Value: 0 (OFF)
Turns Soft controller ON or OFF for the specified Channel.
Values between 0 and 63 are recognized as OFF; values between 64 and 127 are recognized as ON.
The Soft controller causes new notes to be played at a slightly reduced volume and/or with a lowered cutoff frequency.
It is required only for piano and related timbres.
[recommended]
Rhythm Channels shall not respond to this message.
[optional]
At the manufacturer's discretion, a low-pass filter may be imposed on new notes following receipt of a Soft controller
ON in order to cause them to be perceived as being played at a lower volume.
3.3.11 Filter Resonance (Timbre/Harmonic Intensity cc#71)
[recommended]
Default Value: 64 (40H, no change)
Sets the strength of the resonance effect for filter(s) for the specified Channel. Exact behavior is left to the
manufacturer's discretion.
Modifies the resonance parameter value that is preset in the timbre. The timbre shall recognize it as a relative change,
where the center (null point) is 64. When the value is less than 64, the resonance becomes weaker. When the value is
greater than 64, the resonance becomes stronger.

## Page 14

[recommended]
Rhythm Channels shall not respond to this message.
3.3.12 Release Time (cc#72)
[recommended]
Default Value: 64 (40H, no change)
Controls the release time of the envelope for the specified Channel. This is a relative parameter whose center (null point)
is 64 (no change). When the value is less than 64, the time becomes shorter. When the value is greater than 64, the time
becomes longer. Exact behavior is left to the manufacturer's discretion.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.13 Attack time (cc#73)
[recommended]
Default Value: 64 (40H, no change)
Controls the attack time of the envelope for the specified Channel. This is a relative parameter whose center (null point)
is 64 (no change). When the value is less than 64, the time becomes shorter. When the value is greater than 64, the time
becomes longer. Exact behavior is left to the manufacturer's discretion.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.14 Brightness (cc#74)
[recommended]
Default Value: 64 (40H, no change)
Controls the cut-off frequency of filter(s) for the specified Channel.
Controls the preset cut-off frequency of the filter. This is a relative parameter whose center (null point) is 64 (no
change). When the value is less than 64, the frequency becomes lower. When the value is greater than 64, the cutoff
frequency becomes higher. Exact behavior is left to the manufacturer's discretion.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.15 Decay Time (cc#75)
[New "Defaults for Sound Controllers", MIDI 1.0 Detailed Specification 1999 or later]
[recommended]
Default Value: 64 (40H, no change)
Controls the decay time of the envelope for the specified Channel. This is a relative parameter whose center (null point)
is 64 (no change). When the value is less than 64, the time becomes shorter. When the value is greater than 64, the time
becomes longer. Exact behavior is left to the manufacturer's discretion.
[recommended]
Rhythm Channels shall not respond to this message.

## Page 15

3.3.16 Vibrato Rate (cc#76)
[New "Defaults for Sound Controllers", MIDI 1.0 Detailed Specification 1999 or later]
[recommended]
Default Value: 64 (40H, no change)
Controls the vibrato rate on the specified Channel relative to the sound's preset rate. This is a relative parameter whose
center (null point) is 64 (no change). When the value is less than 64, the vibrato rate becomes slower. When the value is
greater than 64, the vibrato rate becomes faster. Exact behavior is left to the manufacturer's discretion.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.17 Vibrato Depth (cc#77)
[New "Defaults for Sound Controllers", MIDI 1.0 Detailed Specification 1999 or later]
[recommended]
Default Value: 64 (40H, no change)
Controls the vibrato depth for the specified Channel. This is a relative parameter whose center (null point) is 64 (no
change). When the value is less than 64, the vibrato depth is reduced. When the value is greater than 64, the vibrato
depth is increased. Exact behavior is left to the manufacturer's discretion.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.18 Vibrato Delay (cc#78)
[New "Defaults for Sound Controllers", MIDI 1.0 Detailed Specification 1999 or later]
[recommended]
Default Value: 64 (40H, no change)
Controls the vibrato delay on the specified Channel. This is a relative parameter whose center (null point) is 64 (no
change). When the value is less than 64, the delay time becomes shorter. When the value is greater than 64, the delay
time becomes longer. Exact behavior is left to the manufacturer's discretion.
[recommended]
Rhythm Channels shall not respond to this message.
3.3.19 Reverb Send Level (cc#91)
[CC91 Defined – MIDI 1.0 Detailed Specification 1999 or later]
Default Value: 40 Decimal (28H)
Sets the reverb send level for the specified Channel. The curve responding to the value shall be linear with respect to
amplitude. Send level is 100% at value 127.
3.3.20 Chorus Send Level (cc#93)
[CC93 Defined - MIDI 1.0 Detailed Specification 1999 or later]
Default Value: 0
Sets the chorus send level for the specified Channel. The curve responding to the value shall be linear with respect to
amplitude. Send level is 100% at value 127.

## Page 16

3.3.21 Data Entry (cc#6/38)
Default Value: 0/0
Data Entry (MSB/LSB) is used on the specified Channel to adjust the value of the RPN that is selected using
cc#100/101.
3.3.22 RPN LSB/MSB (cc#100/101)
Default Value: 7FH/7FH (NULL)
Selects parameter numbers for the RPN on the specified Channel.
3.4 RPN (Registered Parameter Numbers)
3.4.1 00H / 00H Pitch Bend Sensitivity
Default Value: 02H/00H = 2 semitones
Sets the sensitivity of Pitch Bend. The MSB of Data Entry represents the sensitivity in semitones and the LSB of Data
Entry represents the sensitivity in cents. For example, a value of MSB=01, LSB= 00 means +/- 1 semitone (a total range
of 2 semitones).
The GM2 device shall be able to accommodate at least +/-12 semitones.
[recommended]
Rhythm Channels shall not respond to this message.
[optional]
LSB can be ignored.
3.4.2 00H / 01H Channel Fine Tuning
Default Value: 	40H/00H
Resolution: 	100/8192 cents
Range: 	100/8192*(-8192) to 100/8192*(+8191)
Control Value 	Displacement in cents from A440Hz
MSB 	LSB 	(MIDI Note Number 69)
-------------------------------------------------------------------------------------------
00H 	00H 	100/8192*(-8192)
40H 	00H 	100/8192*(0)
7FH 	7FH 	100/8192*(+8191)
[recommended]
Rhythm Channels shall not respond to this message.

## Page 17

3.4.3 00H / 02H Channel Coarse Tuning
Default Value: 40H/00H
Resolution: 	100 cents
Range: 	100*(-64) to 100*(+63)
Control Value 	Displacement in cents
MSB 	LSB 	from A440Hz (MIDI Note Number 69)
-----------------------------------------------------------------------------------
00H 	XX 	100*(-64)
40H 	XX 	100*(0)
7FH 	XX 	100*(+63)
The GM2 device shall be able to accommodate at least +/- 12 semitones.
[recommended]
This transposition function can be implemented by shifting the MIDI Note numbers internal to the synthesizer.
Rhythm Channels shall not respond to this message.
3.4.4 00H / 05H Modulation Depth Range (Vibrato Depth Range)
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Modulation Depth Range RPN" ]
Default Value: 00H/40H (+/-50 cents)
Sets the peak value of Vibrato or LFO Pitch change amount from the basic pitch set by the Modulation Depth controller
(cc#1). See section 3.3.2.
The value "1" of MSB of the Data Entry corresponds to a semitone, and "1" of LSB corresponds to 100/128 Cents. For
example, MSB = 01H, LSB = 00H means that the Mod Wheel will modulate a maximum of +/- one semitone of vibrato
depth (that is, two semitones peak to peak, or one semitone from the center frequency in either direction). Another
example, MSB = 00H, LSB = 08H means that the vibrato depth will be 6.25 cents in either direction from the center
frequency.
[recommended]
Rhythm Channels shall not respond to this message.
Devices should be able to pitch change a minimum of 6 semitones (+/-600 cents).
(Note: This range is only intended to apply to GM2 devices. In the case of other device specifications that are based
upon and reference this specification, implementers should consult the referencing specification for the appropriate
range value).
3.4.5 7FH / 7FH (RPN NULL)
When this RPN is received, the GM2 device will ignore Data Entry until the RPN is set to a valid value.
3.5 Channel Mode Messages
3.5.1 All Sound Off (cc#120)
Value: 0
When this message is received, all the Notes sounding on the specified Channel are immediately released and the sound
is muted as quickly as possible without producing a click or other audible noise.

## Page 18

3.5.2 Reset All Controllers (cc#121)
Default Value: 0
When value is 00H, this message resets the status of controllers and other messages in the table below on the specified
channel as follows:
CC# 	nn 	Name 	Value
------------------------------------------------------------------------------
1 	01H 	Modulation 	0 (off)
11 	0BH 	Expression 	7FH (maximum)
64 	40H 	Hold1 (Damper) 	0 (off)
65 	41H 	Portamento 	0 (off)
66 	42H 	Sostenuto 	0 (off)
67 	43H 	Soft 	0 (off)
100 	64H 	RPN LSB 	7FH (null)
101 	65H 	RPN MSB 	7FH (null)
- 	Channel pressure 	0 (off)
- 	Pitch bend change 	40H/00H (center)
Program Change, Bank Select (0/32), Channel Volume (7), Pan (10), Portamento Time (5), Reverb Send Level (91) and
Chorus Send Level (93) are NOT reset.
3.5.3 All Notes Off (cc#123)
Value: 0
Turns off all Notes sounding on the specified Channel.
3.5.4 Omni Mode Off (cc#124)
Value: 0
Turns off all Notes sounding on the specified Channel. Does NOT change the mode (this is because Omni mode is not
supported in GM2).
3.5.5 Omni Mode On (cc#125)
Value: 0
Turns off all Notes sounding on the specified Channel. Does NOT change the mode (this is because Omni mode is not
supported in GM2).
3.5.6 Mono Mode On (Poly Mode Off) (cc#126)
Default Value: 1
On melody Channels, should turn off all Notes sounding on the specified Channel and switches the operation to Mode 4.
Responds only to M=1, where M is the number of Channels specified in the value byte.
On rhythm Channels, should turn off all Notes sounding on the specified Channel; however, the receiver may or may not
change modes.

## Page 19

3.5.7 Poly Mode On (Mono Mode Off) (cc#127)
Value: 0
Turns off all Notes sounding on the specified Channel and switches the operation to Mode 3.
3.6 Pitch Bend
Default Value: 40H/00H (center)
Adjusts the Pitch up or down on the specified Channel. Default sensitivity (range) is +/- 2 semitones. 00H/00H
specifies maximum pitch bend down. 7FH/7FH specifies maximum pitch bend up. Pitch Bend Sensitivity can be
adjusted using RPN 00H/00H.
[recommended]
Rhythm Channels shall not respond to this message.
3.7 Channel Pressure
Default value: 0
Alters modulation, pitch, brightness, and/or amplitude for the specified Channel, depending on the sound or timbres
being controlled. The amount of modification is the sum of the value established with the Controller Destination Setting
(see Section 4.6.1) and the default setting of the timbre.
[recommended]
Rhythm Channels shall not respond to this message.

## Page 20

4. Universal System Exclusive Messages
4.1 Master Volume
Default Value: 7FH/7FH
Sets the overall volume of the entire device. As with cc#7 and cc#11, the square of the value is proportional to the
volume. See the curve definition given earlier for cc#7 in section 3.3.4.
4.2 Master Fine Tuning
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Master Fine/Coarse Tuning"]
Default Value: 40H/00H
Sets the overall fine-tuning of the entire device. When Master Fine and Coarse Tuning are at their default settings, the
tuning of Note number 69 will be A440Hz (in the absence of Pitch Bend or other pitch altering controllers).
[recommended]
Master Fine Tuning will not alter sounds assigned to Rhythm Channels.
4.3 Master Coarse Tuning
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Master Fine/Coarse Tuning"]
Default Value: 40H/00H
Sets the overall Coarse tuning of the entire device. The Master Coarse Tuning message has a range of +63/-64
semitones. For a GM2 device, the range shall be at least +/-12 semitones.
[recommended]
Master Coarse Tuning will not alter sounds assigned to Rhythm Channels.
4.4 Reverb Parameters
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Global Parameter Control"]
The Global Parameter Control Universal Real-Time SysEx Message can be used to control the system-wide parameters
of the Reverb unit.
F0 7F <device ID> 04 05 01 01 01 01 01 [pp vv] ... F7
F0 7F 	Universal Real-Time SysEx header
<device ID> 	ID of target device (7F = all devices)
04 	sub-ID#1 = DEVICE CONTROL
05 	sub-ID#2 = GLOBAL PARAMETER CONTROL
01 	Slot Path Length = 1
01 	Parameter ID Width = 1
01 	Value Width = 1
01 	Slot Path MSB = 1
01 	Slot Path LSB = 1 (Effect 0101: Reverb)
pp 	Parameter to be controlled.
vv 	Value for the parameter.
F7 	EOX

## Page 21

Although this is a real-time message, it shall only be used at the start of playback for a song or during a break in the
sound playback, since effects changes may not occur quickly.
4.4.1 Reverb Type
pp = 0
Default Value: 4 (Large Hall)
The names for each reverb type are provided as examples of reverb designs, and they are not intended to define the
effect algorithms. Each reverb type may have certain distinctive acoustical characteristics associated with that size of a
space, such as early reflections or a unique frequency response. Care shall be exercised to avoid compatibility problems.
While the same general algorithm may be used for several or all of the different reverb types, it must be possible to set
the Reverb Time. When a Reverb Type is selected, the default Reverb Time from the table below for that Reverb Type
shall be set.
0: Small Room 	A small size room with a length of approximately 5m.
1: Medium Room 	A medium size room with a length of approximately 10m.
2: Large Room 	A large size room suitable for live performances.
3: Medium Hall 	A medium size concert hall.
4: Large Hall 	A large size concert hall suitable for a full orchestra.
8: Plate 	A plate reverb simulation.
4.4.2 Reverb Time
pp = 1
val = ln(rt) / 0.025 + 40
rt is the time in seconds (0.36 - 9.0) for which the low frequency portion of the original sound declines by -60 dB. The
default values for each reverb type are listed below.
Type 	Value (Time)
--------------------------------------
0 	44 (1.1s)
1 	50 (1.3s)
2 	56 (1.5s)
3 	64 (1.8s)
4 	64 (1.8s)
8 	50 (1.3s)

## Page 22

4.5 Chorus Parameters
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Global Parameter Control"]
The Global Parameter Control Universal Real-Time SysEx Message can be used to control the system-wide parameters
of the Chorus unit.
F0 7F <device ID> 04 05 01 01 01 01 02 [pp vv] ... F7
F0 7F 	Universal Real-Time SysEx header
<device ID> 	ID of target device (7F = all devices)
04 	sub-ID#1 = DEVICE CONTROL
05 	sub-ID#2 = GLOBAL PARAMETER CONTROL
01 	Slot Path Length = 1
01 	Parameter ID Width = 1
01 	Value Width = 1
01 	Slot Path MSB = 1
02 	Slot Path LSB = 2 (Effect 0102: Chorus)
pp 	Parameter to be controlled.
vv 	Value for the parameter.
F7 	EOX
Although this is a real-time message, it shall only be used at the start of playback for a song or during a break in the
sound playback, since effects changes may not occur quickly.
4.5.1 Chorus Type
pp = 0
Default Value: 2 (Chorus 3)
Sets Chorus parameters as listed below.
Type 	Feedback 	Mod Rate 	Mod Depth 	Rev Send
----------------------------------------------------------------------------------------------------------------------
0: Chorus 1 	0 (0%) 	3 (0.4Hz) 	5 (1.9ms) 	0 (0%)
1: Chorus 2 	5 (4%) 	9 (1.1Hz) 	19 (6.3ms) 	0 (0%)
2: Chorus 3 	8 (6%) 	3 (0.4Hz) 	19 (6.3ms) 	0 (0%)
3: Chorus 4 	16 (12%) 	9 (1.1Hz) 	16 (5.3ms) 	0 (0%)
4: FB Chorus 	64 (49%) 	2 (0.2Hz) 	24 (7.8ms) 	0 (0%)
5: Flanger 	112 (86%) 	1 (0.1Hz) 	5 (1.9ms) 	0 (0%)
Each parameter's definition assumes an algorithm that modulates the delay time of the effect-send line. The modulation
waveform and stereo output are implementation-dependent.
4.5.2 Mod Rate
pp = 1
mr = val * 0.122 	mr is the modulation frequency in Hz.
4.5.3 Mod Depth
pp = 2
md = (val + 1) / 3.2 	md is the peak-to-peak swing of the modulation in ms.
4.5.4 Feedback
pp = 3
fb = val * 0.763 	fb is the amount of feedback from Chorus output in percent.

## Page 23

4.5.5 Send to Reverb
pp = 4
ctr = val * 0.787 	ctr is the send level from Chorus to Reverb in percent.
4.6 Controller Destination Setting
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Controller Destination Setting"]
4.6.1 Channel Pressure (Aftertouch)
F0 7F <device ID> 09 01 0n [pp rr] … F7
F0 7F 	Universal Real Time SysEx header
<device ID> 	ID of target device (7F = all devices)
09 	sub-ID#1 = Controller Destination Setting
01 	sub-ID#2 = Controller Type: 01 (Channel Pressure)
0n 	MIDI Channel (00 - 0F)
[pp rr] 	Controlled parameter and range
:
F7 	EOX
For each Channel, this message assigns Channel Pressure. “Controller Destination Setting” also provides a way to map
Polyphonic Key Pressure; however, only Channel Pressure is required for GM2.
Only the last complete Controller Destination Setting message received for a Channel is active for that Channel,
meaning that if Channel Pressure was previously controlling something else, it will now only control what the most
recent Controller Destination Setting message specifies.
The following controlled parameters and ranges are supported in GM2:
Controlled Parameter (pp) 	Range (rr) 	Description 	Default
-------------------------------------------------------------------------------------------------------------------------------------------------------
00 Pitch Control 	28H - 58H 	-24 - +24 semitones 	40H
01 Filter Cutoff Control 	00H - 7FH 	-9600 - +9450 cents 	40H
02 Amplitude Control 	00H - 7FH 	0 - (127/64) * 100 percent 	40H
03 LFO Pitch Depth 	00H - 7FH 	0 - 600 cents 	0
04 LFO Filter Depth 	00H - 7FH 	0 - 2400 cents 	0
05 LFO Amplitude Depth 	00H - 7FH 	0 - 100 percent 	0
The example below sets Channel Pressure to control pitch, filter cutoff, and LFO Amplitude Depth (tremolo):
F0 7F 	Universal Real Time SysEx header
<device ID> 	ID of target device (7F = all devices)
09 	sub-ID#1 = Controller Destination Setting
01 	sub-ID#2 = Controller: 	01 (Channel Pressure)
06 	Channel: 	06 (= 7 one-based)
00 	Destination: 	00 (Pitch Control)
42 	Range: 	42 (+2 semitones)
01 	Destination: 	01 (Filter Cutoff Control)
60 	Range: 	60 (+4800 cents)
05 	Destination: 	05 (LFO Amplitude Depth)
20 	Range: 	20 (25%)
F7 	EOX
[recommended]
Rhythm Channels shall not respond to this message.

## Page 24

4.6.2 Controller (Control Change)
F0 7F <device ID> 09 03 0n cc [pp rr] … F7
F0 7F 	Universal Real Time SysEx header
<device ID> 	ID of target device (7F = all devices)
09 	sub-ID#1 = Controller Destination Setting
03 	sub-ID#2 = Controller Type: 03 (Control Change)
0n 	MIDI Channel (00 - 0F)
cc 	Controller number (01 - 1F, 40 - 5F)
[pp rr] 	Controlled parameter and range
:
F7 	EOX
For each Channel, this message assigns any one MIDI controller to any selection on the list of controlled parameters.
Only the last complete Controller Destination Setting message received for a Channel is active for that Channel,
meaning that if a Control Change was previously controlling something else, it will now only control what the most
recent Controller Destination Setting message specifies.
The Controller Destination Setting is only active for one controller at a time on each Channel, meaning that, if a
Controller Destination Setting for some other controller was already set, that controller will be reset to its default, with
the exception of the Channel Pressure Controller Destination Setting.
The following controlled parameters and ranges are supported in GM2:
Controlled Parameter (pp) 	Range (rr) 	Description 	Default
-------------------------------------------------------------------------------------------------------------------------------------------------------
00 Pitch Control 	28H - 58H 	-24 - +24 semitones 	40H
01 Filter Cutoff Control 	00H - 7FH 	-9600 - +9450 cents 	40H
02 Amplitude Control 	00H - 7FH 	0 - (127/64) * 100 percent 	40H
03 LFO Pitch Depth 	00H - 7FH 	0 - 600 cents 	0
04 LFO Filter Depth 	00H - 7FH 	0 - 2400 cents 	0
05 LFO Amplitude Depth 	00H - 7FH 	0 - 100 percent 	0
The example below sets General Purpose Controller #1 to control pitch, filter cutoff, and LFO Amplitude Depth
(tremolo):
F0 7F 	Universal Real Time SysEx header
<device ID> 	ID of target device (7F = all devices)
09 	sub-ID#1 = Controller Destination Setting
03 	sub-ID#2 = Controller: 	03 (Control Change)
06 	Channel: 	06 (= 7 one-based)
10 	Controller Number: 10 (General Purpose Controller #1)
00 	Destination: 	00 (Pitch Control)
42 	Range: 	42 (+2 semitones)
01 	Destination: 	01 (Filter Cutoff Control)
60 	Range: 	60 (+4800 cents)
05 	Destination: 	05 (LFO Amplitude Depth)
20 	Range: 	20 (25%)
F7 	EOX
[recommended]
Rhythm Channels shall not respond to this message.

## Page 25

4.7 Scale/Octave Tuning Adjust
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Scale/Octave Tuning"]
Default Value: 40H
Sets the micro tuning. GM2 supports the Non-Real-time, one-byte form of the Scale Octave Tuning Adjust SysEx
message.
This message shall only be used at the start of playback for a song or during a break in the sound playback, since
changes may not occur quickly.
[recommended]
It is recommended that devices also support the Real-Time one byte form of the Scale/Octave Tuning Message.
Rhythm Channels shall not respond to these message.
4.8 Key-Based Instrument Controllers
[Refer to Complete MIDI 1.0 Detailed Specification 1999 or later - "Key-Based Instrument Controllers"]
Allows the control of Volume, Pan, Reverb Send Level, Chorus Send Level, etc., for individual Note numbers in the
GM2 Percussion Sound Set programs.
When a new percussion sound set is selected by a Program Change message, the receiving device should adopt the
preset setting for each key-based instrument.
The following items can be adjusted per Note number in GM2. Units are provided where appropriate.
CC# 	nn 	Name 	vv 	Description 	Default
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
--
07 	07H 	Volume 	00H-40H-7FH 	0 -100 - (127/64) * 100 (%) (Relative) 	40H
10 	0AH 	Pan 	00H-40H-7FH 	Left-Center-Right (Absolute) 	(Preset value)
91 	5BH 	Reverb Send Level 	00H-7FH 	0 - Max. (Absolute) 	(Preset value)
93 	5DH 	Chorus Send Level 	00H-7FH 	0 - Max. (Absolute) 	(Preset value)
[recommended]
Melody Channels shall not respond to this message.

## Page 26

4.9 GM System Messages
4.9.1 GM2 System On
F0 7E 	Universal Non-Real Time SysEx header
<device ID> 	ID of target device (7F = all devices)
09 	sub-ID#1 	= General MIDI message
03 	sub-ID#2 	= General MIDI 2 On
F7 	EOX
When this message is received, all currently sounding Notes immediately mute without producing a click, and the device
is reset to the initial GM System 2 status.
The reset operation shall be completed within 100ms after receiving GM2 System On.
4.9.2 GM1 System On (currently called GM System On)
F0 7E 	Universal Non-Real Time SysEx header
<device ID> 	ID of target device (7F = all devices)
09 	sub-ID#1 	= General MIDI message
01 	sub-ID#2 	= General MIDI 1 On
F7 	EOX
When this message is received, all currently sounding Notes immediately mute without producing a click, and the device
is reset to the initial GM System Level 1 status.
4.9.3 GM System Off
F0 7E 	Universal Non-Real Time SysEx header
<device ID> 	ID of target device (7F = all devices)
09 	sub-ID#1 	= General MIDI message
02 	sub-ID#2 	= General MIDI Off
F7 	EOX
When a device that has an initialized mode that is not GM1 or GM2 receives this message, it returns to its initialized
mode. A device that is exclusively GM will ignore this message.

## Page 27

5. Other MIDI Messages
5.1 Active Sensing
GM2 devices shall respond to Active Sensing.

## Page 28

6. GM2™ Logo
Devices that meet these specifications may display the GM2™ logo when properly applied for and used in accordance
with guidelines supplied by AMEI (Japan) and MMA (all other countries). The logo is the property of the MMA &
AMEI and cannot be used without permission. Please contact AMEI or MMA for details.

## Page 29

7. Appendix A: GM 2 Sound Set
General MIDI 2 Sound Set ⎯ 1 of 7
PROG# 	BANK#(MSB LSB) 	GM2 TIMBRE NAME 	Recommended Key Range
### Piano
1(00H) 	79H 00H 	Acoustic Grand Piano 	21-108
79H 01H 	Acoustic Grand Piano (wide) 	21-108
79H 02H 	Acoustic Grand Piano (dark) 	21-108
2(01H) 	79H 00H 	Bright Acoustic Piano 	21-108
79H 01H 	Bright Acoustic Piano (wide) 	21-108
3(02H) 	79H 00H 	Electric Grand Piano 	21-108
79H 01H 	Electric Grand Piano (wide) 	21-108
4(03H) 	79H 00H 	Honky-tonk Piano 	21-108
79H 01H 	Honky-tonk Piano (wide) 	21-108
5(04H) 	79H 00H 	Electric Piano 1 	28-103
79H 01H 	Detuned Electric Piano 1 	28-103
79H 02H 	Electric Piano 1 (velocity mix) 	28-103
79H 03H 	60's Electric Piano 	28-103
6(05H) 	79H 00H 	Electric Piano 2 	28-103
79H 01H 	Detuned Electric Piano 2 	28-103
79H 02H 	Electric Piano 2 (velocity mix) 	28-103
79H 03H 	EP Legend 	28-103
79H 04H 	EP Phase 	28-103
7(06H) 	79H 00H 	Harpsichord 	41-89
79H 01H 	Harpsichord (octave mix) 	41-89
79H 02H 	Harpsichord (wide) 	41-89
79H 03H 	Harpsichord (with key off) 	41-89
8(07H) 	79H 00H 	Clavi 	36-96
79H 01H 	Pulse Clavi 	36-96
### Chromatic Percussion
9(08H) 	79H 00H 	Celesta 	60-108
10(09H) 	79H 00H 	Glockenspiel 	72-108
11(0AH) 	79H 00H 	Music Box 	60-84
12(0BH) 	79H 00H 	Vibraphone 	53-89
79H 01H 	Vibraphone (wide) 	53-89
13(0CH) 	79H 00H 	Marimba 	48-84
79H 01H 	Marimba (wide) 	48-84
14(0DH) 	79H 00H 	Xylophone 	65-96
15(0EH) 	79H 00H 	Tubular Bells 	60-77
79H 01H 	Church Bell 	60-77
79H 02H 	Carillon 	60-77
16(0FH) 	79H 00H 	Dulcimer 	60-84

## Page 30

General MIDI 2 Sound Set ⎯ 2 of 7
PROG# 	BANK#(MSB LSB) 	GM2 TIMBRE NAME 	Recommended Key Range
### Organ
17(10H) 	79H 00H 	Drawbar Organ 	36-96
79H 01H 	Detuned Drawbar Organ 	36-96
79H 02H 	Italian 60's Organ 	36-96
79H 03H 	Drawbar Organ 2 	36-96
18(11H) 	79H 00H 	Percussive Organ 	36-96
79H 01H 	Detuned Percussive Organ 	36-96
79H 02H 	Percussive Organ 2 	36-96
19(12H) 	79H 00H 	Rock Organ 	36-96
20(13H) 	79H 00H 	Church Organ 	21-108
79H 01H 	Church Organ (octave mix) 	21-108
79H 02H 	Detuned Church Organ 	21-108
21(14H) 	79H 00H 	Reed Organ 	36-96
79H 01H 	Puff Organ 	36-96
22(15H) 	79H 00H 	Accordion 	53-89
79H 01H 	Accordion 2 	53-89
23(16H) 	79H 00H 	Harmonica 	60-84
24(17H) 	79H 00H 	Tango Accordion 	53-89
### Guitar
25(18H) 	79H 00H 	Acoustic Guitar (nylon) 	40-84
79H 01H 	Ukulele 	40-84
79H 02H 	Acoustic Guitar (nylon + key off) 	40-84
79H 03H 	Acoustic Guitar (nylon 2) 	40-84
26(19H) 	79H 00H 	Acoustic Guitar (steel) 	40-84
79H 01H 	12-Strings Guitar 	40-84
79H 02H 	Mandolin 	40-84
79H 03H 	Steel Guitar with Body Sound 	40-84
27(1AH) 	79H 00H 	Electric Guitar (jazz) 	40-86
79H 01H 	Electric Guitar (pedal steel) 	40-86
28(1BH) 	79H 00H 	Electric Guitar (clean) 	40-86
79H 01H 	Electric Guitar (detuned clean) 	40-86
79H 02H 	Mid Tone Guitar 	40-86
29(1CH) 	79H 00H 	Electric Guitar (muted) 	40-86
79H 01H 	Electric Guitar (funky cutting) 	40-86
79H 02H 	Electric Guitar (muted velo-sw) 	40-86
79H 03H 	Jazz Man 	40-86
30(1DH) 	79H 00H 	Overdriven Guitar 	40-86
79H 01H 	Guitar Pinch 	40-86
31(1EH) 	79H 00H 	Distortion Guitar 	40-86
79H 01H 	Distortion Guitar (with feedback) 	40-86
79H 02H 	Distorted Rhythm Guitar 	40-86
32(1FH) 	79H 00H 	Guitar Harmonics 	40-86
79H 01H 	Guitar Feedback 	40-86

## Page 31

General MIDI 2 Sound Set ⎯ 3 of 7
PROG# 	BANK#(MSB LSB) 	GM2 TIMBRE NAME 	Recommended Key Range
### Bass
33(20H) 	79H 00H 	Acoustic Bass 	28-55
34(21H) 	79H 00H 	Electric Bass (finger) 	28-55
79H 01H 	Finger Slap Bass 	28-55
35(22H) 	79H 00H 	Electric Bass (pick) 	28-55
36(23H) 	79H 00H 	Fretless Bass 	28-55
37(24H) 	79H 00H 	Slap Bass 1 	28-55
38(25H) 	79H 00H 	Slap Bass 2 	28-55
39(26H) 	79H 00H 	Synth Bass 1 	28-55
79H 01H 	Synth Bass (warm) 	28-55
79H 02H 	Synth Bass 3 (resonance) 	28-55
79H 03H 	Clavi Bass 	28-55
79H 04H 	Hammer 	28-55
40(27H) 	79H 00H 	Synth Bass 2 	28-55
79H 01H 	Synth Bass 4 (attack) 	28-55
79H 02H 	Synth Bass (rubber) 	28-55
79H 03H 	Attack Pulse 	28-55
### Strings & Orchestral instruments
41(28H) 	79H 00H 	Violin 	55-96
79H 01H 	Violin (slow attack) 	55-96
42(29H) 	79H 00H 	Viola 	48-84
43(2AH) 	79H 00H 	Cello 	36-72
44(2BH) 	79H 00H 	Contrabass 	28-55
45(2CH) 	79H 00H 	Tremolo Strings 	28-96
46(2DH) 	79H 00H 	Pizzicato Strings 	28-96
47(2EH) 	79H 00H 	Orchestral Harp 	23-103
79H 01H 	Yang Chin 	23-103
48(2FH) 	79H 00H 	Timpani 	36-57
### Ensemble
49(30H) 	79H 00H 	String Ensembles 1 	28-96
79H 01H 	Strings and Brass 	28-96
79H 02H 	60s Strings 	28-96
50(31H) 	79H 00H 	String Ensembles 2 	28-96
51(32H) 	79H 00H 	SynthStrings 1 	36-96
79H 01H 	SynthStrings 3 	36-96
52(33H) 	79H 00H 	SynthStrings 2 	36-96
53(34H) 	79H 00H 	Choir Aahs 	48-79
79H 01H 	Choir Aahs 2 	48-79
54(35H) 	79H 00H 	Voice Oohs 	48-79
79H 01H 	Humming 	48-79
55(36H) 	79H 00H 	Synth Voice 	48-84
79H 01H 	Analog Voice 	48-84
56(37H) 	79H 00H 	Orchestra Hit 	48-72
79H 01H 	Bass Hit Plus 	48-72
79H 02H 	6th Hit 	48-72
79H 03H 	Euro Hit 	48-72

## Page 32

General MIDI 2 Sound Set ⎯ 4 of 7
PROG# 	BANK#(MSB LSB) 	GM2 TIMBRE NAME 	Recommended Key Range
### Brass
57(38H) 	79H 00H 	Trumpet 	58-94
79H 01H 	Dark Trumpet Soft 	58-94
58(39H) 	79H 00H 	Trombone 	34-75
79H 01H 	Trombone 2 	34-75
79H 02H 	Bright Trombone 	34-75
59(3AH) 	79H 00H 	Tuba 	29-55
60(3BH) 	79H 00H 	Muted Trumpet 	58-82
79H 01H 	Muted Trumpet 2 	58-82
61(3CH) 	79H 00H 	French Horn 	41-77
79H 01H 	French Horn 2 (warm) 	41-77
62(3DH) 	79H 00H 	Brass Section 	36-96
79H 01H 	Brass Section 2 (octave mix) 	36-96
63(3EH) 	79H 00H 	Synth Brass 1 	36-96
79H 01H 	Synth Brass 3 	36-96
79H 02H 	Analog Synth Brass 1 	36-96
79H 03H 	Jump Brass 	36-96
64(3FH) 	79H 00H 	Synth Brass 2 	36-96
79H 01H 	Synth Brass 4 	36-96
79H 02H 	Analog Synth Brass 2 	36-96
### Reed
65(40H) 	79H 00H 	Soprano Sax 	54-87
66(41H) 	79H 00H 	Alto Sax 	49-80
67(42H) 	79H 00H 	Tenor Sax 	42-75
68(43H) 	79H 00H 	Baritone Sax 	37-68
69(44H) 	79H 00H 	Oboe 	58-91
70(45H) 	79H 00H 	English Horn 	52-81
71(46H) 	79H 00H 	Bassoon 	34-72
72(47H) 	79H 00H 	Clarinet 	50-91
### Pipe
73(48H) 	79H 00H 	Piccolo 	74-108
74(49H) 	79H 00H 	Flute 	60-96
75(4AH) 	79H 00H 	Recorder 	60-96
76(4BH) 	79H 00H 	Pan Flute 	60-96
77(4CH) 	79H 00H 	Blown Bottle 	60-96
78(4DH) 	79H 00H 	Shakuhachi 	55-84
79(4EH) 	79H 00H 	Whistle 	60-96
80(4FH) 	79H 00H 	Ocarina 	60-84

## Page 33

General MIDI 2 Sound Set ⎯ 5 of 7
PROG# 	BANK#(MSB LSB) 	GM2 TIMBRE NAME 	Recommended Key Range
### Synth Lead
81(50H) 	79H 00H 	Lead 1 (square) 	21-108
79H 01H 	Lead 1a (square 2) 	21-108
79H 02H 	Lead 1b (sine) 	21-108
82(51H) 	79H 00H 	Lead 2 (sawtooth) 	21-108
79H 01H 	Lead 2a (sawtooth 2) 	21-108
79H 02H 	Lead 2b (saw + pulse) 	21-108
79H 03H 	Lead 2c (double sawtooth) 	21-108
79H 04H 	Lead 2d (sequenced analog) 	21-108
83(52H) 	79H 00H 	Lead 3 (calliope) 	36-96
84(53H) 	79H 00H 	Lead 4 (chiff) 	36-96
85(54H) 	79H 00H 	Lead 5 (charang) 	36-96
79H 01H 	Lead 5a (wire lead) 	36-96
86(55H) 	79H 00H 	Lead 6 (voice) 	36-96
87(56H) 	79H 00H 	Lead 7 (fifths) 	36-96
88(57H) 	79H 00H 	Lead 8 (bass + lead) 	21-108
79H 01H 	Lead 8a (soft wrl) 	21-108
### Synth Pad
89(58H) 	79H 00H 	Pad 1 (new age) 	36-96
90(59H) 	79H 00H 	Pad 2 (warm) 	36-96
79H 01H 	Pad 2a (sine pad) 	36-96
91(5AH) 	79H 00H 	Pad 3 (polysynth) 	36-96
92(5BH) 	79H 00H 	Pad 4 (choir) 	36-96
79H 01H 	Pad 4a (itopia) 	36-96
93(5CH) 	79H 00H 	Pad 5 (bowed) 	36-96
94(5DH) 	79H 00H 	Pad 6 (metallic) 	36-96
95(5EH) 	79H 00H 	Pad 7 (halo) 	36-96
96(5FH) 	79H 00H 	Pad 8 (sweep) 	36-96
### Synth SFX
97(60H) 	79H 00H 	FX 1 (rain) 	36-96
98(61H) 	79H 00H 	FX 2 (soundtrack) 	36-96
99(62H) 	79H 00H 	FX 3 (crystal) 	36-96
79H 01H 	FX 3a (synth mallet) 	36-96
100(63H) 	79H 00H 	FX 4 (atmosphere) 	36-96
101(64H) 	79H 00H 	FX 5 (brightness) 	36-96
102(65H) 	79H 00H 	FX 6 (goblins) 	36-96
103(66H) 	79H 00H 	FX 7 (echoes) 	36-96
79H 01H 	FX 7a (echo bell) 	36-96
79H 02H 	FX 7b (echo pan) 	36-96
104(67H) 	79H 00H 	FX 8 (sci-fi) 	36-96

## Page 34

General MIDI 2 Sound Set ⎯ 6 of 7
PROG# 	BANK#(MSB LSB) 	GM2 TIMBRE NAME 	Recommended Key Range
### Ethnic Misc.
105(68H) 	79H 00H 	Sitar 	48-77
79H 01H 	Sitar 2 (bend) 	48-77
106(69H) 	79H 00H 	Banjo 	48-84
107(6AH) 	79H 00H 	Shamisen 	50-79
108(6BH) 	79H 00H 	Koto 	55-84
79H 01H 	Taisho Koto 	55-84
109(6CH) 	79H 00H 	Kalimba 	48-79
110(6DH) 	79H 00H 	Bag pipe 	36-77
111(6EH) 	79H 00H 	Fiddle 	55-96
112(6FH) 	79H 00H 	Shanai 	48-72
### Percussive
113(70H) 	79H 00H 	Tinkle Bell 	72-84
114(71H) 	79H 00H 	Agogo 	60-72
115(72H) 	79H 00H 	Steel Drums 	52-76
116(73H) 	79H 00H 	Woodblock 	*
79H 01H 	Castanets 	*
117(74H) 	79H 00H 	Taiko Drum 	*
79H 01H 	Concert Bass Drum 	*
118(75H) 	79H 00H 	Melodic Tom 	*
79H 01H 	Melodic Tom 2 (power) 	*
119(76H) 	79H 00H 	Synth Drum 	*
79H 01H 	Rhythm Box Tom 	*
79H 02H 	Electric Drum 	*
120(77H) 	79H 00H 	Reverse Cymbal 	*

## Page 35

General MIDI 2 Sound Set ⎯ 7 of 7
PROG# 	BANK#(MSB LSB) 	GM2 TIMBRE NAME 	Recommended Key Range
### SFX
121(78H) 	79H 00H 	Guitar Fret Noise 	*
79H 01H 	Guitar Cutting Noise 	*
79H 02H 	Acoustic Bass String Slap 	*
122(79H) 	79H 00H 	Breath Noise 	*
79H 01H 	Flute Key Click 	*
123(7AH) 	79H 00H 	Seashore 	*
79H 01H 	Rain 	*
79H 02H 	Thunder 	*
79H 03H 	Wind 	*
79H 04H 	Stream 	*
79H 05H 	Bubble 	*
124(7BH) 	79H 00H 	Bird Tweet 	*
79H 01H 	Dog 	*
79H 02H 	Horse Gallop 	*
79H 03H 	Bird Tweet 2 	*
125(7CH) 	79H 00H 	Telephone Ring 	*
79H 01H 	Telephone Ring 2 	*
79H 02H 	Door Creaking 	*
79H 03H 	Door 	*
79H 04H 	Scratch 	*
79H 05H 	Wind Chime 	*
126(7DH) 	79H 00H 	Helicopter 	*
79H 01H 	Car Engine 	*
79H 02H 	Car Stop 	*
79H 03H 	Car Pass 	*
79H 04H 	Car Crash 	*
79H 05H 	Siren 	*
79H 06H 	Train 	*
79H 07H 	Jetplane 	*
79H 08H 	Starship 	*
79H 09H 	Burst Noise 	*
127(7EH) 	79H 00H 	Applause 	*
79H 01H 	Laughing 	*
79H 02H 	Screaming 	*
79H 03H 	Punch 	*
79H 04H 	Heart Beat 	*
79H 05H 	Footsteps 	*
128(7FH) 	79H 00H 	Gunshot 	*
79H 01H 	Machine Gun 	*
79H 02H 	Lasergun 	*
79H 03H 	Explosion 	*

## Page 36

8. Appendix B: GM 2 Percussion Sound Set
PC#1 	PC#9 	PC#17
STANDARD Set 	ROOM Set 	POWER Set
NOTE# 	Inst.Name 	PAN Inst.Name 	PAN Inst.Name 	PAN
27 (D#) 	High Q 	49 @ 	@
28 (E) 	Slap 	49 @ 	@
29 (F) 	Scratch Push 	[EXC7] 	54 @ 	@
30 (F#) 	Scratch Pull 	[EXC7] 	54 @ 	@
31 (G) 	Sticks 	64 @ 	@
32 (G#) 	Square Click 	54 @ 	@
33 (A) 	Metronome Click 	64 @ 	@
34 (A#) 	Metronome Bell 	64 @ 	@
35 (B) 	Acoustic Bass Drum 	64 @ 	@
36 (C) 	Bass Drum 1 	64 @ 	Power Kick Drum 	64
37 (C#) 	Side Stick 	64 @ 	@
38 (D) 	Acoustic Snare 	64 @ 	Power Snare Drum 	64
39 (D#) 	Hand Clap 	54 @ 	@
40 (E) 	Electric Snare 	64 @ 	@
41 (F) 	Low Floor Tom 	34 Room Low Tom 2 	34 Power Low Tom 2 	34
42 (F#) 	Closed Hi-hat 	[EXC1] 	84 @ 	@
43 (G) 	High Floor Tom 	46 Room Low Tom 1 	46 Power Low Tom 1 	46
44 (G#) 	Pedal Hi-hat 	[EXC1] 	84 @ 	@
45 (A) 	Low Tom 	58 Room Mid Tom 2 	58 Power Mid Tom 2 	58
46 (A#) 	Open Hi-hat 	[EXC1] 	84 @ 	@
47 (B) 	Low-Mid Tom 	70 Room Mid Tom 1 	70 Power Mid Tom 1 	70
48 (C) 	High Mid Tom 	82 Room Hi Tom 2 	82 Power Hi Tom 2 	82
49 (C#) 	Crash Cymbal 1 	84 @ 	@
50 (D) 	High Tom 	94 Room Hi Tom 1 	94 Power Hi Tom 1 	94
51 (D#) 	Ride Cymbal 1 	44 @ 	@
52 (E) 	Chinese Cymbal 	44 @ 	@
53 (F) 	Ride Bell 	44 @ 	@
54 (F#) 	Tambourine 	74 @ 	@
55 (G) 	Splash Cymbal 	54 @ 	@
56 (G#) 	Cowbell 	84 @ 	@
57 (A) 	Crash Cymbal 2 	44 @ 	@
58 (A#) 	Vibra-slap 	29 @ 	@
59 (B) 	Ride Cymbal 2 	44 @ 	@
60 (MID C) 	High Bongo 	99 @ 	@
61 (C#) 	Low Bongo 	99 @ 	@
62 (D) 	Mute Hi Conga 	39 @ 	@
63 (D#) 	Open Hi Conga 	39 @ 	@
64 (E) 	Low Conga 	44 @ 	@
65 (F) 	High Timbale 	84 @ 	@
66 (F#) 	Low Timbale 	84 @ 	@
67 (G) 	High Agogo 	29 @ 	@
68 (G#) 	Low Agogo 	29 @ 	@
69 (A) 	Cabasa 	29 @ 	@
70 (A#) 	Maracas 	24 @ 	@
71 (B) 	Short Whistle 	[EXC2] 	99 @ 	@
72 (C) 	Long Whistle 	[EXC2] 	99 @ 	@
73 (C#) 	Short Guiro 	[EXC3] 	94 @ 	@
74 (D) 	Long Guiro 	[EXC3] 	94 @ 	@
75 (D#) 	Claves 	84 @ 	@
76 (E) 	Hi Wood Block 	99 @ 	@
77 (F) 	Low Wood Block 	99 @ 	@
78 (F#) 	Mute Cuica 	[EXC4] 	44 @ 	@
79 (G) 	Open Cuica 	[EXC4] 	44 @ 	@
80 (G#) 	Mute Triangle 	[EXC5] 	24 @ 	@
81 (A) 	Open Triangle 	[EXC5] 	24 @ 	@
82 (A#) 	Shaker 	94 @ 	@
83 (B) 	Jingle Bell 	99 @ 	@
84 (C) 	Bell Tree 	104 @ 	@
85 (C#) 	Castanets 	34 @ 	@
86 (D) 	Mute Surdo 	[EXC6] 	44 @ 	@
87 (D#) 	Open Surdo 	[EXC6] 	44 @ 	@
88 (E) 	--- 	--- 	---

## Page 37

General MIDI 2 Percussion Sound Set ⎯ 2 of 3
PC#25 	PC#26 	PC#33
ELECTRONIC Set 	ANALOG Set 	JAZZ Set
NOTE# 	Inst.Name 	PAN Inst.Name 	PAN Inst.Name 	PAN
27 (D#) 	@ 	@ 	@
28 (E) 	@ 	@ 	@
29 (F) 	@ 	@ 	@
30 (F#) 	@ 	@ 	@
31 (G) 	@ 	@ 	@
32 (G#) 	@ 	@ 	@
33 (A) 	@ 	@ 	@
34 (A#) 	@ 	@ 	@
35 (B) 	@ 	@ 	Jazz Kick 2 	64
36 (C) 	Electric Bass Drum 	64 Analog Bass Drum 	64 Jazz Kick 1 	64
37 (C#) 	@ 	Analog Rim Shot 	64 @
38 (D) 	Electric Snare 1 	64 Analog Snare 1 	64 @
39 (D#) 	@ 	@ 	@
40 (E) 	Electric Snare 2 	64 @ 	@
41 (F) 	Electric Low Tom 2 	34 Analog Low Tom 2 	34 @
42 (F#) 	@ 	Analog CHH 1 	[EXC1] 	84 @
43 (G) 	Electric Low Tom 1 	46 Analog Low Tom 1 	46 @
44 (G#) 	@ 	Analog CHH 2 	[EXC1] 	84 @
45 (A) 	Electric Mid Tom 2 	58 Analog Mid Tom 2 	58 @
46 (A#) 	@ 	Analog OHH 	[EXC1] 	84 @
47 (B) 	Electric Mid Tom 1 	70 Analog Mid Tom 1 	70 @
48 (C) 	Electric Hi Tom 2 	82 Analog Hi Tom 2 	82 @
49 (C#) 	@ 	Analog Cymbal 	84 @
50 (D) 	Electric Hi Tom 1 	94 Analog Hi Tom 1 	94 @
51 (D#) 	@ 	@ 	@
52 (E) 	Reverse Cymbal 	44 @ 	@
53 (F) 	@ 	@ 	@
54 (F#) 	@ 	@ 	@
55 (G) 	@ 	@ 	@
56 (G#) 	@ 	Analog Cowbell 	84 @
57 (A) 	@ 	@ 	@
58 (A#) 	@ 	@ 	@
59 (B) 	@ 	@ 	@
60 (MID C) 	@ 	@ 	@
61 (C#) 	@ 	@ 	@
62 (D) 	@ 	Analog High Conga 	39 @
63 (D#) 	@ 	Analog Mid Conga 	44 @
64 (E) 	@ 	Analog Low Conga 	49 @
65 (F) 	@ 	@ 	@
66 (F#) 	@ 	@ 	@
67 (G) 	@ 	@ 	@
68 (G#) 	@ 	@ 	@
69 (A) 	@ 	@ 	@
70 (A#) 	@ 	Analog Maracas 	24 @
71 (B) 	@ 	@ 	@
72 (C) 	@ 	@ 	@
73 (C#) 	@ 	@ 	@
74 (D) 	@ 	@ 	@
75 (D#) 	@ 	Analog Claves 	84 @
76 (E) 	@ 	@ 	@
77 (F) 	@ 	@ 	@
78 (F#) 	@ 	@ 	@
79 (G) 	@ 	@ 	@
80 (G#) 	@ 	@ 	@
81 (A) 	@ 	@ 	@
82 (A#) 	@ 	@ 	@
83 (B) 	@ 	@ 	@
84 (C) 	@ 	@ 	@
85 (C#) 	@ 	@ 	@
86 (D) 	@ 	@ 	@
87 (D#) 	@ 	@ 	@
88 (E) 	--- 	--- 	---

## Page 38

General MIDI 2 Percussion Sound Set ⎯ 3 of 3
PC#41 	PC#49 	PC#57
BRUSH Set 	ORCHESTRA Set 	SFX Set
NOTE# 	Inst.Name 	PAN Inst.Name 	PAN Inst.Name 	PAN
27 (D#) 	@ 	Closed Hi-hat 2 	[EXC1] 	84 ---
28 (E) 	@ 	Pedal Hi-hat 	[EXC1] 	84 ---
29 (F) 	@ 	Open Hi-hat 2 	[EXC1] 	84 ---
30 (F#) 	@ 	Ride Cymbal 1 	44 ---
31 (G) 	@ 	@ 	---
32 (G#) 	@ 	@ 	---
33 (A) 	@ 	@ 	---
34 (A#) 	@ 	@ 	---
35 (B) 	Jazz Kick 2 	64 Concert BD 2 	24 ---
36 (C) 	Jazz Kick 1 	64 Concert BD 1 	24 ---
37 (C#) 	@ 	@ 	---
38 (D) 	Brush Tap 	64 Concert SD 	44 ---
39 (D#) 	Brush Slap 	64 Castanets 	34 High Q 	49
40 (E) 	Brush Swirl 	64 Concert SD 	44 Slap 	49
41 (F) 	@ 	Timpani F 	34 Scratch Push 	[EXC7] 	54
42 (F#) 	@ 	Timpani F# 	34 Scratch Pull 	[EXC7] 	54
43 (G) 	@ 	Timpani G 	34 Sticks 	64
44 (G#) 	@ 	Timpani G# 	34 Square Click 	54
45 (A) 	@ 	Timpani A 	34 Metronome Click 	64
46 (A#) 	@ 	Timpani A# 	34 Metronome Bell 	64
47 (B) 	@ 	Timpani B 	34 Guitar Fret Noise 	64
48 (C) 	@ 	Timpani c 	34 Guitar Cutting Noise Up 	64
49 (C#) 	@ 	Timpani c# 	34 Guitar Cutting Noise Down 	64
50 (D) 	@ 	Timpani d 	34 String Slap of Double Bass 	64
51 (D#) 	@ 	Timpani d# 	34 Fl.Key Click 	64
52 (E) 	@ 	Timpani e 	34 Laughing 	64
53 (F) 	@ 	Timpani f 	34 Scream 	64
54 (F#) 	@ 	@ 	Punch 	64
55 (G) 	@ 	@ 	Heart Beat 	64
56 (G#) 	@ 	@ 	Footsteps 1 	64
57 (A) 	@ 	Concert Cymbal 2 	34 Footsteps 2 	64
58 (A#) 	@ 	@ 	Applause 	64
59 (B) 	@ 	Concert Cymbal 1 	34 Door Creaking 	64
60 (MID C) 	@ 	@ 	Door 	64
61 (C#) 	@ 	@ 	Scratch 	64
62 (D) 	@ 	@ 	Wind Chimes 	64
63 (D#) 	@ 	@ 	Car-Engine 	64
64 (E) 	@ 	@ 	Car-Stop 	64
65 (F) 	@ 	@ 	Car-Pass 	64
66 (F#) 	@ 	@ 	Car-Crash 	64
67 (G) 	@ 	@ 	Siren 	64
68 (G#) 	@ 	@ 	Train 	64
69 (A) 	@ 	@ 	Jetplane 	64
70 (A#) 	@ 	@ 	Helicopter 	64
71 (B) 	@ 	@ 	Starship 	64
72 (C) 	@ 	@ 	Gun Shot 	64
73 (C#) 	@ 	@ 	Machine Gun 	64
74 (D) 	@ 	@ 	Lasergun 	64
75 (D#) 	@ 	@ 	Explosion 	64
76 (E) 	@ 	@ 	Dog 	64
77 (F) 	@ 	@ 	Horse-Gallop 	64
78 (F#) 	@ 	@ 	Birds 	64
79 (G) 	@ 	@ 	Rain 	64
80 (G#) 	@ 	@ 	Thunder 	64
81 (A) 	@ 	@ 	Wind 	64
82 (A#) 	@ 	@ 	Seashore 	64
83 (B) 	@ 	@ 	Stream 	64
84 (C) 	@ 	@ 	Bubble 	64
85 (C#) 	@ 	@ 	---
86 (D) 	@ 	@ 	---
87 (D#) 	@ 	@ 	---
88 (E) 	--- 	Applause 	64 ---
Notes: 	---:Does not sound
@ :Use Standard Set Instrument
[EXC]:Instruments that have same EXC numbers do not sound simultaneously.
Program Change messages in consumer documentation are normally one-based; therefore, the decimal value of PC #1 presented here
(Standard Set) is equivalent to 00H.
