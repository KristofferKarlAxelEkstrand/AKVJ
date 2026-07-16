---
title: MIDI Visual Control (MVC)
docId: RP-050
protocol: midi1
source: .midi-raw-data/rp50 MIDI Visual Control.pdf
sourceType: local
pages: 17
sha256: 20e25b3be841b4f37dcfaba33c07d76a2d9fb8a8e6ad7a95e0749bc3eacc0bdb
extractedAt: 2026-07-16T12:54:10.275Z
summary: MMA/AMEI Recommended Practice RP-050: MIDI Visual Control (MVC).
---
# MIDI Visual Control (MVC)

## Page 1

Document version 1.0
February 15, 2011
Published by:
The MIDI Manufacturers Association
Los Angeles, CA

## Page 2

RP-050 MIDI Visual Control Specification
Copyright ©2010-2011 MIDI Manufacturers Association Incorporated (MMA)
All rights reserved. No part of this publication may be reproduced or transmitted in any form or by
any means, electronic or mechanical, including information storage and retrieval systems, without
the written permission of MIDI Manufacturers Association Incorporated (MMA).
Printed 2011
MMA
POB 3173
La Habra CA 90632-3173
www.midi.org
Table of Contents
1 	Overview ....................................................................................................................................1
1.1 	Design Concepts ...............................................................................................................2
2 	Functions....................................................................................................................................3
2.1 	Selecting/Triggering Display of Visual Content .................................................................3
2.1.1 	Program Change Message.......................................................................................3
2.1.2 	Note On/Off...............................................................................................................4
2.2 	Manipulating the Current Image ........................................................................................5
2.2.1 	Control Change Message .........................................................................................5
2.2.2 	Channel Pressure (Aftertouch) Message .................................................................6
2.2.3 	Pitch Bend Message .................................................................................................7
2.2.4 	Reset All Controllers Message [Required for Slave] ................................................7
2.3 	Mode & Parameter Settings ..............................................................................................8
2.3.1 	Universal System Exclusive Format .........................................................................8
2.3.2 	MIDI Visual Control “Data Set” .................................................................................8
2.3.3 	Set Parameter Message .........................................................................................10
2.3.4 	MIDI Visual Control ON [Required].........................................................................10
2.3.5 	MIDI Visual Control OFF [Required] .......................................................................11
2.3.6 	Clip Control Rx. MIDI Channel................................................................................11
2.3.7 	Effect Control Rx. MIDI Channel.............................................................................11
2.3.8 	Note Message Enabled ..........................................................................................11
2.3.9 	Playback Speed Control Range..............................................................................12
3 	Instrument Design Recommendations ......................................................................................13
3.1 	Master (transmitter) .........................................................................................................13
3.1.1 	MIDI Visual Control ON/OFF Button.......................................................................13
3.1.2 	MIDI Visual Control ON/OFF Indicator ...................................................................13
3.1.3 	Changing / Triggering Display of Visual Content....................................................13
3.2 	Slave (receiver) ...............................................................................................................13
3.2.1 	Upon Reception of MIDI Visual Control ON ...........................................................14
4 	Logo Usage Requirements........................................................................................................15
4.1 	Compliance......................................................................................................................15
4.2 	Logo.................................................................................................................................15

## Page 3

1 	Overview
This specification defines a way for MIDI to be used for control of visual presentation devices or
systems. MIDI has expanded far beyond its original intention of being a control language for
musical instruments. The robust nature of MIDI and wide support makes MIDI a suitable control
system for visual performance or presentation devices.
Furthermore, video has become a common component of musical performances in many venues. It
makes sense to use MIDI as a way to tie musical performance to visual performance.
When performing on a MIDI Visual Control compatible MIDI musical instrument, not only can sound
be controlled, but images can be controlled as well. As a result, MIDI Visual Control makes it
possible to create visual effects that are synchronized with a musical performance.
Just as you can control a sound generator from the performance control section of your MIDI
instrument to create music, you can use MIDI Visual Control to control a visual source by playing
back video material or switching Visual Elements such as Still Pictures, Video Clips, and Live
Cameras.
The performance control section, the sound generator, and the visual source may all be included in
a single physical device that is able to handle both music and video, or you can use MIDI to
connect different devices together to construct your own system. The MIDI Visual Control data is
sent via MIDI.

## Page 4

1.1 	Design Concepts
• 	Control over some commonly used features of visual presentation are controlled by
commonly used MIDI messages of Note On/Off, Program Change and Bank Select,
Control Change, and Pitch Bend.
• 	Extended functions and detailed control over visual elements are implemented using
Universal System Exclusive messages.
• 	MIDI Visual Control uses a Master and Slave relationship. In general the Master device is a
controller sending messages. A Slave device (usually a video output device) receives
messages and changes visual content output based on the messages received.
• 	For Channel messages of MIDI Visual Control, the Master and Slave must be assigned to
the same MIDI Channel.
• 	SysEx messages of MIDI Visual Control have a “Device ID” address in the message.
Devices may have a user assignable Device ID so that multiple MIDI Visual Control
devices can be independently addressed on one MIDI connection.
• 	Before any MIDI Visual Control messages are communicated, a Master device must send
a “MIDI Visual Control On” message (Section 2.3.4) to the Slave. This message is a
System Exclusive message which can be appended with further parameters to configure
the response of the Slave device.
• 	MIDI Visual Control devices are not required to implement every feature of the
specification. Every device must support the “MIDI Visual Control On” and “MIDI Visual
Control Off” messages. Slave devices must also respond to the “Reset All Controllers”
message. All other messages are optional and may be supported or not according to the
needs and features of each device.
• 	If a Master or Slave device implements any feature of MIDI Visual Control, it must support
the message that is the Default assignment for that feature. It is strongly recommended
that Slave devices also support all alternate assignable messages associated with that
feature.

## Page 5

2 	Functions
2.1 	Selecting/Triggering Display of Visual Content
There are 2 ways to select and trigger the display of specific visual elements:
• 	Program Change message (optionally with Bank Select message)
• 	Note On message (followed by Note Off message).
The choice of image, animation, movie, sprite, or other visual element that is displayed depends on
the specification of and/or contents in the receiving device.
Master
The designer of a Master device may decide whether to send Program Change messages
(optionally with Bank Select) or Note On/Off messages, or both, according to the implementation
needs of the particular device. For example: changing images on the Slave device may be initiated
by pressing notes on a keyboard or changing the patch on the Master device.
Slave
If a Slave has the ability to change visual content or source, it must respond to Program Changes
to select and trigger the display of specific visual elements.
A Slave must also respond to Note On messages to select and trigger display of visual elements
when the Slave has received the Note Message Enabled message (Section 2.3.8).
The type of image control assigned to each program change or note number is up to the Slave
device itself.
2.1.1 	Program Change Message
Program Change
CnH ppH
n 	= MIDI Channel number: 0H–FH (Ch. 1–16)
Determined by CCM parameter (Section 2.3.6); Default CCM is 0H
pp 	= image number (or source): 00H–7FH (1–128)
Slave
When receiving Program Change messages the Slave device will change things such as image
clips or image source, according to its own design. If there is no image available at the
corresponding location for the received Program Change the Slave should ignore the message.
2.1.1.1 	Bank Select Message [Optional]
Bank Select MSB
BnH 00H mmH
Bank Select LSB
BnH 20H llH
n 	= MIDI Channel number: 0H–FH (Ch. 1–16)
Determined by CCM parameter (Section 2.3.6); Default CCM is 0H
mm 	= image bank number MSB: 00H–7FH (1–128)
ll 	= image bank number LSB: 00H–7FH (1–128)

## Page 6

The Bank Select message is used for selecting sets of images, which expands the number of
available image clips or sources that can be selected using the Program Change message.
Master
A Master will transmit Bank Select MSB (most significant byte) and LSB (least significant byte)
messages, always in that order and always as a set. Immediately following the transmission of the
Bank Select message, a Program Change message must be sent in order to select the image. If
there is no need to change the image bank, transmission of Bank Select messages can be omitted.
Slave
On the Slave side, images are not changed just by receiving only the Bank Select message. The
images will be changed only after reception of the Program Change.
The product designer may decide the response of the Slave device to Bank Select messages,
according to the implementation needs of the device. If the device does not support multiple banks
of images, it may ignore Bank Select messages.
2.1.2 	Note On/Off
Note On
9nH kkH vvH
Note Off
8nH kkH vvH
n 	= MIDI Channel number: 0H–FH (Ch. 1–16)
Determined by CCM parameter (Section 2.3.6); Default CCM is 0H
kk 	= note number: 00H–7FH (0–127)
vv 	= Velocity: 00H–7FH (0–127) (Note On vv=“00” functions as Note Off Message)
Master
Using the Note On/Off Message is optional. If used, the following rules apply:
• 	Before the Master Device sends Note On/Off messages for Changing/Triggering Display of
Visual Content, the Master must send the Note Message Enabled message (Section
2.3.8).
• 	The Master must always send Note On and Note Off as pairs..
Slave
Note On/Off messages do not select/trigger visual content on slave devices until they are enabled
using the Note Message Enabled message (Section 2.3.8).
When a valid Note On message is received by a Slave device, the Slave changes the image
source or plays an image clip assigned to the corresponding Note Number. Slaves must only
respond to Note On messages with Note Numbers in the range specified in the Note Message
Enabled message. If the Slave has no content assigned for the Note number that is received, the
Slave must ignore the message.
Slave recognition of Note Off messages is optional. MIDI Visual Control does not define any
specific usage of a Note Off message.
The Velocity value of the Note On/Off can be used by the Slave to control any parameter (i.e. is
undefined).

## Page 7

2.2 	Manipulating the Current Image
MIDI Pitch Bend, Channel Pressure (Aftertouch), and certain Control Change messages may be
used to manipulate the current visual element, such as to change the brightness, color, intensity, or
control the time between images, etc.
Master
Masters may use any appropriate physical controller (such as Pitch Bender, Aftertouch, Modulation
Wheel, knobs, faders, etc.) to transmit the defined MIDI messages for manipulating the current
image. The Master device is not required to implement every message that MIDI Visual Control
supports.
Slave
The default assignment of MIDI messages to MIDI Visual Control parameters is shown below. The
assignments can also be changed using System Exclusive Messages (Section 2.3). Slave devices
are not required to implement every type of message that MIDI Visual Control supports.
2.2.1 	Control Change Message
Control Change
BnH ccH vvH
n 	= MIDI Channel number: 0H–FH (Ch. 1–16); Default= 0H
For Bank Select MSB and LSB:
Determined by CCM parameter (Section 2.3.6)
For Other Controllers:
Determined by CCM parameter (Section 2.3.6) if assigned to Clip Control
Determined by ECM parameter (Section 2.3.7) if assigned to Effect Control
cc 	= Controller number (“CC#”): 00H–77H (0–119)
(Note: CC# 0, 32 are used for Bank Select only)
vv 	= Value: 00H–7FH (0–127)
The default assignments of MIDI CC# to MIDI Visual Control parameters are shown below.
Default CC# Assignments
CC #
Hex 	Dec
MIDI Visual Control
Parameter
00H 	0 	Bank Select MSB*
05H 	5 	Dissolve Time MSB
20H 	32 	Bank Select LSB*
25H 	37 	Dissolve Time LSB
47H 	71 	Effect Control 1
49H 	73 	Effect Control 2
4AH 	74 	Effect Control 3
*described in Section 2.1.1.1

## Page 8

2.2.1.1 	Dissolve Time
The MIDI Controllers #05 (MSB) and #37 (LSB) are assigned to Dissolve Time by default. The
Dissolve Time parameter controls the overlap time when changing images. The resulting change
from these Controllers depends on the features and implementation of the Slave Device.
The MIDI receive Channel for Dissolve Time can be set with the Clip Control Channel (CCM)
parameter (Section 2.3.6).
2.2.1.2 	Effect Control
The MIDI Controllers #71, 73, and 74 are assigned to Effect Control by default. The resulting
change from these Controllers depends on the features and implementation of the Slave Device.
Typically, Effect Control messages will control parameters of the Color Space of the Slave. There is
no direct mapping between Color Space implementations commonly used by video devices, but the
same 3 messages are used regardless of the color space of that device. The table below shows
the function of each Effect Control in each Color Space.
The Slave device may also use Effect Control messages to control any other parameter (Custom
Effect). Or, a Slave may use one or more Effect Control messages to control color space
parameters while using another Effect Control message to control a custom effect. (For example, a
Slave may use Effect Control 1 to control frequency of a strobe effect, Effect Control 2 to control
Hue, and Effect Control 3 to control Brightness.)
The MIDI receive Channel for Effect Control can be set with the Effect Control Channel (ECM)
parameter (Section 2.3.7).
Function of Effect Controls In Each Color Space Type (or Custom Use)
Color Space	Message
RGB 	HSB 	YCbCr
Custom Use
Effect Control 1 Red 	Saturation 	Cr –
Chroma Red
Device Dependent
Effect Control 2 Blue 	Hue 	Cb –
Chroma Blue
Device Dependent
Effect Control 3 Green 	Brightness 	Y - Luma 	Device Dependent
2.2.2 	Channel Pressure (Aftertouch) Message
Channel Pressure (Aftertouch)
DnH vvH
n 	= MIDI Channel number: 0H–FH (Ch. 1–16); Default= 0H
Determined by CCM parameter (Section 2.3.6) if assigned to Clip Control
Determined by ECM parameter (Section 2.3.7) if assigned to Effect Control
vv 	= Channel Pressure Value: 00H-7FH (0-127)
The Channel Pressure (Aftertouch) message has no default usage and may be used to manipulate
any control that is accessible on the slave device.

## Page 9

2.2.3 	Pitch Bend Message
Pitch Bend Change
EnH llH mmH
n 	= MIDI Channel number: 0H–FH (Ch. 1–16); Default= 0H
Determined by CCM parameter (Section 2.3.6) if assigned to Clip Control
Determined by ECM parameter (Section 2.3.7) if assigned to Effect Control
mm,ll = Pitch Bend Value MSB, LSB: 00 00H–40 00H–7F 7FH (-8192–0–+8191)
By default, the Pitch Bend message controls the speed of image playback (Playback Speed
parameter). The relation between pitch bend value and playback speed can be set using the
Playback Speed Control Range message (Section 2.3.9). Typically the center value (0) is for
normal speed, positive (+) values accelerate (speed up image playback) and negative (-) values
decelerate (slow down image playback).
The MIDI receive Channel for playback speed can be set with the Clip Control Channel (CCM)
parameter (Section 2.3.6).
2.2.4 	Reset All Controllers Message [Required for Slave]
Channel Mode Message
BnH 79H 00H
n 	= MIDI Channel number: 0H–FH (Ch. 1–16); Default= 0H
Determined by CCM parameter (Section 2.3.6) if assigned to Clip Control
Determined by ECM parameter (Section 2.3.7) if assigned to Effect Control
If the Clip Control MIDI receive Channel and the Effect Control MIDI receive Channel are set to
different Channels, then the Reset All Controllers message must be sent on both Channels.
If a Slave receives the MIDI Reset All Controllers message the slave shall reset the following MIDI
Visual Control parameters to these default values:
Parameter 	Default value
Dissolve Time 	0 sec.
Playback Speed 	Normal
Effect-1 	Normal
Effect-2 	Normal
Effect-3 	Normal

## Page 10

2.3 	Mode & Parameter Settings
MIDI System Exclusive Messages are used to:
• 	enable/disable MIDI Visual Control operation in devices that operate in other modes;
• 	enable/disable response to certain messages in Slave devices (if supported);
• 	set MIDI receive Channels and other aspects for certain messages.
2.3.1 	Universal System Exclusive Format
MIDI Visual Control Messages comply with the MIDI Universal System Exclusive Format:
Universal System Exclusive
FOH 7EH Dev OCH 01H {. . .} F7H
FOH 	= System Exclusive Status
7EH 	= Universal System Exclusive Non Realtime Header
DEV 	= Device ID (00-7F; MVC Default = 00H)
0CH 	= Sub-ID#1 (MIDI Visual Control)
01H 	= Sub-ID#2 (MVC Command Set ID; 01H=”Version 1.0”)
{. . .} 	= MIDI Visual Control “Data Set” (See Section 2.3.2 below)
F7H 	= End of System Exclusive (“EOX”)
2.3.1.1 	Device ID (“DEV”)
When MIDI Visual Control information is transmitted via system exclusive messages the Device ID
included within the message is used to determine whether the message should be recognized by a
specific device. This means that the Device ID of messages transmitted by the Master device must
match the Device ID being recognized by the Slave device.
The Device ID of the Slave unit shall be 00H by default. If the device allows the Device ID to be
changed, the device may store the user-edited Device ID setting. Device ID “7F” is used to indicate
that all devices should respond.
2.3.2 	MIDI Visual Control “Data Set”
The MIDI Visual Control Data Set is comprised of an address for the data, the actual data to be
transmitted, and a check sum:
[ADDR]: This is the address of the data to be transmitted. If transmitting multiple items of data, this
will be the address of the starting data. Each byte of data has a 3 Byte address in the range 10H
00H 00H to 10H 7FH 7FH. In the future, if it becomes necessary to add parameters for MIDI Visual
Control, addresses will be assigned from this range. (New parameters may be added only by
AMEI/MMA). See Section 2.3.2.1 (Parameter Address Map) for the addresses for specific
parameters.
[DATA]: This is the actual parameter data to be transmitted. If the parameters to be set have
consecutive addresses, without any reserved addresses between them, multiple data items may be
transmitted in the same message. However, if there are 128 or more bytes, the data must be
divided into packets of less than 128 bytes and transmitted with a time interval of at least 20 ms.
SUM: This is a value that produces a lower seven bits of zero when the [ADDR], [DATA], and
checksum itself are summed.
2.3.2.1 	Parameter Address Map
The following table describes the addresses that are used for MIDI Visual Control settings.
MSN means “most significant Nibble”, or the upper 4 bits of a byte. LSN means “least significant
Nibble”, or the lower 4 bits of a byte. These are combined to create the 8-bit byte.

## Page 11

PARAMETER ADDRESS MAP
[DATA]
[ADDR]
Address Parameter Range of
value
Default
value
Notes
System Preference Area
10H 00H 00H 	MIDI Visual Control ON/OFF 	00H–01H 	- 	0=Off, 1=On
10H 00H 01H 	CCM (Clip Control Rx MIDI Ch.) 	00H–10H 	00H 	0=Ch. 1, F=Ch. 16, 10h=Off
10H 00H 02H 	ECM (Effect Control Rx MIDI Ch.) 	00H–10H 	00H 	0=Ch. 1, F=Ch. 16, 10h=Off
10H 00H 03H 	NME (Note Message Enabled) 	00H–01H 	00H 	See Section 2.3.8
10H 00H 04H
:
10H 0FH 7FH
System Preference
Reserved Area - 	- 	Reserved
Clip Control Assignment Area
10H 10H 00H 	Playback Speed Ctrl Assign MSN 	00H–0FH 	0EH
10H 10H 01H 	Playback Speed Ctrl Assign LSN 	00H–0FH 	00H
10H 10H 02H 	Dissolve Time Ctrl Assign MSN 	00H–0FH 	00H
10H 10H 03H 	Dissolve Time Ctrl Assign LSN 	00H–0FH 	05H
4 bit MSN + 4 bit LSN = 8 bit data.
D0H = Aftertouch
E0H = Pitch Bend Change
FFH = No Assignment
01H-1FH, 40H-5FH = CC#
All other values reserved.
10H 10H 04H
:
10H 1FH 7FH
Clip Control Assignment
Reserved Area - 	- 	Reserved
Effect Control Assignment Area
10H 20H 00H 	Effect Control 1 Assign MSN 	00H–0FH 	04H
10H 20H 01H 	Effect Control 1 Assign LSN 	00H–0FH 	07H
10H 20H 02H 	Effect Control 2 Assign MSN 	00H–0FH 	04H
10H 20H 03H 	Effect Control 2 Assign LSN 	00H–0FH 	09H
10H 20H 04H 	Effect Control 3 Assign MSN 	00H–0FH 	04H
10H 20H 05H 	Effect Control 3 Assign LSN 	00H–0FH 	0AH
4 bit MSN + 4 bit LSN = 8 bit data.
D0H = Aftertouch
E0H = Pitch Bend Change
FFH = No Assignment
01H-1FH, 40H-5FH = CC#
All other values reserved.
10H 20H 06H
:
10H 2FH 7FH
Effect Control Assignment
Reserved Area - 	- 	Reserved
Clip Control Preference Area
10H 30H 00H 	Reserved 	- 	- 	Reserved
10H 30H 01H 	Playback Speed Ctrl Range 	00H–7FH 	00H 	See Section 2.3.9
10H 30H 02H 	Keyboard Range Lower 	00H–7FH 	24H 	See Section 2.3.8.1
10H 30H 03H 	Keyboard Range Upper 	00H–7FH 	54H 	See Section 2.3.8.1
10H 30H 04H
:
10H 30H 7FH
Clip Control Preference
Reserved Area - 	- 	Reserved
Reserved Area
10H 40H 00H
:
10H 7FH 7FH
Reserved 	- 	- 	Reserved

## Page 12

2.3.3 	Set Parameter Message
Parameters can be set individually or as consecutive addresses (without any reserved addresses
between them) as shown in the examples, below.
Single Parameter Examples:
Example 1
F0H 7EH 00H 0CH 01H {[10H 00H 00H] 01H} SUM F7H
{[10H 00H 00H] = System Preference Area: MVC On/Off
01H} 	= Set MVC On
Example 2
F0H 7EH 00H 0CH 01H {[10H 30H 01H] 02H} SUM F7H
{[10H 30H 01H] = Clip Control Preference Area:
Playback Speed Ctrl Range
02H} 	= Set 02H Range
Consecutive Parameters Example:
F0H 7EH 00H 0CH 01H {[10H 00H 01H] 0EH 0EH} SUM F7H
{[10H 00H 01H] = System Preference Area: CCM
0EH 	= Set Clip Ctrl Rx MIDI Ch (15)
0EH} 	= Set Effect Ctrl Rx MIDI Ch (15)
2.3.4 	MIDI Visual Control ON [Required]
Master
The Master must set MVC On before beginning to transmit any MIDI Visual Control messages.
F0H 7EH DEV 0CH 01H {[10H 00H 00H] 01H} SUM F7H
{[10H 00H 00H] = System Preference Area: MVC On/Off
01H} 	= MVC On
Note: One or more additional parameters from the System Preference Area (only) may also be
set using the MIDI Visual Control ON message (consecutive addresses only), as shown below.
Example:
F0H 7EH DEV 0CH 01H {[10H 00H 00H] 01H CCM ECM NME} SUM F7H
{[10H 00H 00H] = System Preference Area: MVC On/Off
01H 	= MVC On
CCM 	= Clip Control Rx MIDI Channel ( 0=1, F=16, 10H=Off )
ECM 	= Effect Control Rx MIDI Channel ( 0=1, F=16, 10H=Off)
NME} 	= Note Message Enabled ( 0=Off, 1=On)
Slave

## Page 13

When the Slave device that operates in other modes receives the “MVC On” mode message it will
enable response to MIDI Visual Control messages.
The Slave will also reset all MIDI Visual Control parameters to the default values as shown in
section 2.2.4 and perform all the same processes as having received a “Reset All Controllers”. If
the MIDI Visual Control On message contains added parameters then the Slave’s parameters are
set to the received values instead of their default values.
2.3.5 	MIDI Visual Control OFF [Required]
Master
The Master transmits this to indicate that it is finished sending MIDI Visual Control messages.
F0H 7EH DEV 0CH 01H {[10H 00H 00H] 00H} SUM F7H
{[10H 00H 00H] = System Preference Area: MVC On/Off
00H} 	= MVC Off
Slave
The Slave device will exit MIDI Visual Control mode and stop responding to MIDI Visual Control
messages.
2.3.6 	Clip Control Rx. MIDI Channel
This parameter tells the slave which MIDI Channel to listen to for Clip Control messages
(Selecting/Triggering Display, Playback Speed, Dissolve Time). The default value is 0H.
2.3.7 	Effect Control Rx. MIDI Channel
This parameter tells the slave which MIDI Channel to listen to for Effect Control messages. The
default value is 0H.
2.3.8 	Note Message Enabled
Although Bank Select and Program Change messages are always enabled to be used to change
images, this switch allows Note On/Off messages to also be used to change images.
• 	OFF (0): Note messages will not be used for video control.
• 	Assignable (1): Only note messages in the range specified by the Keyboard Range Lower
parameter and Keyboard Range Upper parameter will be used for image control according
to the specifications of the Slave device (see Section 2.3.8.1 below).
2.3.8.1 	Keyboard Lower/ Upper Range Parameters
When the Note Message Enabled parameter is set to “Assignable (1),” these parameters further
specify the range of notes used for image control. The values are MIDI Note Numbers (where 60 =
Middle C).
Example: Keyboard Range Lower = 1CH (28); Keyboard Range Upper = 28H (40)
If the Keyboard Range Lower and Keyboard Range Upper parameters are not set, the Default
range shall be used (24H/54H).
Master
If the keyboard range requirement of the Master device differs from the default, the Keyboard

## Page 14

Range Lower parameter and Keyboard Range Upper parameter must be transmitted to the Slave
device, so that only the note messages in the specified range will be used for image control.
Slave
When the Slave device receives note messages in this range, it will optimally allocate image
presets for the specified range, and perform video control operations, according to the
specifications of that device. Note messages outside this range must be ignored.
2.3.9 	Playback Speed Control Range
This parameter sets the range of response when controlling the playback speed with a MIDI
Continuous Controller assigned to that purpose using the "Playback Speed Ctrl Assign MSN" and
"Playback Speed Ctrl Assign LSN" parameters.
The rows of the table represent different possible ranges of playback speeds.
The first column represents the data value sent via the "Playback Speed Control Range"
Message in order to select the desired range
The second column represents the intended Playback speed when the control (slider or pitch
bender) is set to its minimum. Note: 0.0 = playback paused, negative numbers = reverse playback.
The third column represents the intended Playback speed when the control is at the center of its
range.
The fourth column represents the intended Playback speed when the control is set to its maximum.
Minimum 	Center 	Maximum 	Notes
======= 	====== 	======= 	==================
7 bit: 	00H 	40H 	7FH 	(-64 -- 0 -- +63)
14 bit: 	00H 00H 	40H 00H 	7FH 7FH 	(-8192 -- 0 -- +8191)
Multiple of Original Playback Speed
00H 	0.0 	1.0 	2.0 	(default)
01H 	0.5 	1.0 	2.0
02H 	0.0 	1.0 	4.0
03H 	0.5 	1.0 	4.0
04H 	0.0 	1.0 	8.0
05H 	0.5 	1.0 	8.0
06H 	0.0 	1.0 	16.0
07H 	0.5 	1.0 	16.0
08H 	0.0 	1.0 	32.0
09H 	0.5 	1.0 	32.0
0AH - 13H 	- 	- 	- 	(reserved)
14H 	0.0 	2.0 	4.0
15H 	0.0 	4.0 	8.0
16H 	0.0 	8.0 	16.0
17H 	0.0 	16.0 	32.0
18H - 1DH 	- 	- 	- 	(reserved)
1EH 	-2.0 	1.0 	4.0
1FH 	-6.0 	1.0 	8.0
20H - 7FH 	- 	- 	- 	(reserved)

## Page 15

3 	Instrument Design Recommendations
3.1 	Master (transmitter)
A MIDI Visual Control Master device should include switches and indicators as described below.
3.1.1 	MIDI Visual Control ON/OFF Button
A MIDI Visual Control Master device should include a MIDI Visual Control ON/OFF button on its
operating panel to turn ON and OFF the MIDI Visual Control function.
The MIDI Visual Control ON/OFF Button operations are as follows:
• 	Turn ON: Send “MIDI Visual Control ON” message. Send some System Exclusive
messages, for environment setting, if required.
• 	Turn OFF: Send “MIDI Visual Control OFF” message to the external video equipment.
If the product is designed to be connected to a video device, inform the user of this fact. One good
way of doing this is by displaying a message on the screen of the product when turning on MIDI
Visual Control.
If a dedicated MIDI Visual Control ON/OFF button cannot be provided, it is acceptable to have an
existing button double as the MIDI Visual Control ON/OFF button, or to provide for control within
the display screen.
3.1.2 	MIDI Visual Control ON/OFF Indicator
An electronic musical instrument that functions as a MIDI Visual Control Master device should
include a MIDI Visual Control ON/OFF indicator. A blue LED indicator is recommended in or near
the MIDI Visual Control ON/OFF button, The LED lights when MIDI Visual Control is turned on and
goes out when MIDI Visual Control in turned off. We recommend the following three display
methods:
• 	A self-illuminating MIDI Visual Control ON/OFF button.
• 	An LED placed near the MIDI Visual Control ON/OFF button.
• 	The status may be displayed in a display screen such as LCD.
3.1.3 	Changing / Triggering Display of Visual Content
With an instrument that has some controllers such as pads or registration buttons, we recommend
using the pads or buttons to transmit bank select messages or program change messages to
perform control operations such as switching images.
In the case of the keyboard products without pads or registration buttons, we recommend using the
leftmost or rightmost octave (12 keys) of the keyboard (using note messages to perform control
operations such as switching images). The product designer may decide whether to allow this to be
switched on/off by a setting on the keyboard, depending on the implementation needs of the
particular product. Depending on the specifications of the keyboard, it is also conceivable that this
key range be more or less than one octave, or that it be set specifically for the product.
In most cases, when keys are assigned for image control they should not be used for conventional
playing of sounds.
3.2 	Slave (receiver)
A device that functions as a MIDI Visual Control Slave device does not require any specific
switches or knobs.. The Slave will be managed by the information from the MIDI Visual Control
Master device.

## Page 16

Note: In some cases it may be useful to provide a user selectable operation on the Slave that
allows the user to turn OFF the Slave’s MIDI Visual Control function.
3.2.1 	Upon Reception of MIDI Visual Control ON
• 	Light the MIDI Visual Control ON/OFF indicator (if such indicator exists).

## Page 17

4 	Logo Usage Requirements
4.1 	Compliance
The term MIDI Visual Control may only be used in conjunction with products that comply with this
specification.
4.2 	Logo
The following logo may be licensed for use in conjunction with products that comply with this
specification. The logo is recommended for inclusion on product packaging, in marketing materials,
and on device control panels.
The logo is the property of the MIDI Manufacturers Association (MMA) and Association of Musical
Electronics Industry (AMEI) and may not be used without written license.
Please contact MMA or AMEI for the license.
