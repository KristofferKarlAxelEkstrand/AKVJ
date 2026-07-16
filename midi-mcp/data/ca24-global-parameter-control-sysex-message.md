---
title: Global Parameter Control
docId: CA-024
protocol: midi1
source: .midi-raw-data/ca24 Global Parameter Control SysEx Message.pdf
sourceType: local
pages: 5
sha256: df26b1877c1a6085c274dc43769da6ceca995a85ec584c49622062768863e2f8
extractedAt: 2026-07-16T12:54:08.711Z
summary: MMA/AMEI Confirmation of Approval CA-024: Global Parameter Control.
---
# Global Parameter Control

## Page 1

MMA Technical Standards Board/
AMEI MIDI Committee
Confirmation of Approval of New MIDI Message
Date of issue: 3/05/99 Originated by: MMA
Reference TSBB Item #: 150 Volume #: 22 (revised)
Title: Global Parameter Control
CA#: 24__
Related item(s): General MIDI Level 2, Universal Real-Time System Exclusive messages
Abstract:
This proposal allows the editing of global parameters in a device using Universal Real-Time System
Exclusive messages. These global parameters may include effects parameters, system control parameters,
or other non-channel-specific parameters. Because there may be more than one instance of an object
containing global parameters in the same device, and these multiple instances may have similar parameters
or even contain additional objects in an object hierarchy, an optional mechanism is provided for uniquely
identifying the "slot" within the object hierarchy containing the global parameters.
When coupled with specific recommended practices for parameters and values, these messages will provide
common parameter editing among a variety of playback devices.
Background:
Per channel parameter control is currently achieved using Non Registered Parameters (NRPNs). There is no
specification for system-wide device control, other than a few System Exclusive messages (SysEx) such as
"Master Volume". Different operating modes of devices (such as General MIDI 2) will adopt standardized
Parameters in Recommended Practice documents.
In addition, using a standardized System Exclusive (SysEx) message will make it easier for various
controllers and control applications to develop "drivers" for different MIDI devices.
Details:
GLOBAL PARAMETER CONTROL [Universal Real-Time SysEx]
F0 7F <device ID> 04 05 sw pw vw [[sh sl] ... ] [pp vv] ... F7
<device ID> ID of Target Device (7F = all devices)
sw Slot Path Length.
The number of 2-byte entries in the slot path. Can be
zero if no slot path is needed (top-level
parameters).
pw Parameter ID Width.
The number of bytes used for the <pp> field.
vw Value Width.
The number of bytes used for the <vv> field.

## Page 2

(optional) Variable length slot path (Length set by <sw> field):
sh Slot Number MSB.
A value of 1 here in a slot path of length 1 is
reserved for GM2 (see comments).
sl Slot Number LSB.
Variable length parameter-value pair list (terminated by EOX):
pp Parameter ID, MSB first.
Width set by <pw> field.
vv Parameter Value, LSB first.
Width set by <vw> field.
The variable length slot path is used to identify the object within the device where the parameters reside. For
example, in a device with two identical effects processors, the slot path would identify which effect
processor is supposed to receive the message. If there is no ambiguity (i.e. the parameters are unique toplevel parameters), the slot path is not needed, and Slot Path Length (sw)is set to zero.
Multiple parameter-value pairs may be embedded in a message. If the device receives an unrecognizable or
inappropriate parameter for a slot, only that parameter-value pair should be ignored.
Comments:
In general, parameters can be classified as either type selects or type-specific parameters. The typespecific parameters for a slot may change as the type select for the slot is changed, so a dependency
exists between them. For example, the type select for an effect slot capable of providing different effects
types may have various type-specific parameters depending on the selected effect. It is recommended that
the values for these parameters be reset to their type-specific defaults whenever the type is changed. To
reset the parameters for an already selected type, reselect the same type. If type changes normally causes
audible dropouts or other artifacts, but other edits do not, a type reselect should not cause these dropouts.
This message is a Universal Real-Time SysEx message, but some parameters may not be real-time edits.
For example, some older effects processors cannot change effects without causing audible dropouts or
other artifacts. In these situations, it is suggested that type changes be treated as if the message were a
Non-Real-Time edit. These edits should be sent at the beginning of musical sections, during quiet
passages, or after effect sends have been muted and the current effect has stopped sounding. Other
parameter edits that do not cause audible dropouts or other artifacts can be sent at any time.
In order to provide a simple mechanism for identifying and avoiding confusion with General MIDI Level 2
(GM2) Global Parameter Control messages, all messages with Slot Path Length = 1 and Slot Path Number
MSB = 1 shall be reserved for use only by GM2. All other systems shall not use this combination of values.
Example Message:
The following example shows how the GLOBAL PARAMETER CONTROL message could be used for
addressing the parameters of a hypothetical insert effect in a midi-controlled mixer. For this example, the
mixer channels are addressed with the first entry in the slot path. The insert effects on a channel are
addressed by the second entry in the slot path. The slot path MSB’s for each entry are used to distinguish
between mixer main channels vs. mixer submix channels, and insert effects vs. built-in effects. The
message shows how parameter 4 of insert effect 3 (inserts use MSB=2) used by mixer channel 71 (47H)
(main channels use MSB=1) is addressed:

## Page 3

F0 7F <device ID> 04 05 02 01 02 01 47 02 03 04 vl vh ... F7
<device ID> ID of Target Device (7F = all devices)
02 Slot Path Length = 2
01 Parameter ID Width = 1
02 Value Width = 2
01 Slot Path 1 MSB = 1 (Main mix channels use MSB = 1)
47 Slot Path 1 LSB = 47H (Main mix channel 71)
02 Slot Path 2 MSB = 2 (Insert effects use MSB = 2)
03 Slot Path 2 LSB = 3 (Insert effect 3)
04 Parameter to be controlled = 4
vl Value LSB for the parameter
vh Value MSB for the parameter
Example of Recommended Practice for Reverb and Chorus Parameters
(from General MIDI Level 2)
On today's music synthesizers, Reverb and Chorus are the two most widely used effects. The
Recommended Practice , General MIDI 2, seeks to define a set of messages that will allow modifications to
commonly used parameters for Reverb and Chorus. Although this R/P is for General MIDI 2 devices, other
recommended practices may wish to include the same set of parameters. The R/P from GM2 is repeated
here for illustration only.
The send levels to the Reverb and Chorus effects are controlled with Control Changes #91 and #93,
respectively, as defined in Item #153 with the units given in Item GM2. The Global Parameter Control
Universal Real-Time SysEx Message can be used to control the system-wide parameters of the Effects
units.
Slot 0101: Reverb
F0 7F <device ID> 04 05 01 01 01 01 01 [pp vv] ... F7
<device ID> ID of target device (7F = all devices)
01 Slot Path Length = 1
01 Parameter ID Width = 1
01 Value Width = 1
01 Slot Path MSB = 1 (Effect 0101: Reverb)
01 Slot Path LSB = 1
pp Parameter to be controlled.
vv Value for the parameter.
pp = 0 : Reverb Type
The names for each Reverb Type are provided as examples of reverb designs, and they are not intended to
define the effect algorithms. Each Reverb Type may have certain distinctive acoustical characteristics
associated with that size of a space, such as early reflections or a unique frequency response. Care should
be exercised to avoid compatibility problems. While the same general algorithm may be used for several or
all of the different Reverb Types, it must be possible to set the Reverb Time. When a Reverb Type is

## Page 4

selected, the default Reverb Time from the table below for that Reverb Type should be set. On General MIDI
2 devices, Reverb Type 4 (Large Hall) is the recommended initial setting.
0: Small Room A small size room with a length of 5m or so.
1: Medium Room A medium size room with a length of 10m or so.
2: Large Room A large size room suitable for live performances.
3: Medium Hall A medium size concert hall.
4: Large Hall A large size concert hall suitable for a full orchestra.
8: Plate A plate reverb simulation.
pp = 1 : Reverb Time
val = ln(rt) / 0.025 + 40
Rt is the time in seconds (0.36 - 9.0) for which the low frequency portion of the original sound declines by -
60dB. The default values for each reverb type are listed below.
Type Time
0 44 (1.1s)
1 50 (1.3s)
2 56 (1.5s)
3 64 (1.8s)
4 64 (1.8s)
8 50 (1.3s)
Slot 0102: Chorus
F0 7F <device ID> 04 05 01 01 01 01 02 [pp vv] ... F7
<device ID> ID of target device (7F = all devices)
01 Slot Path Length = 1
01 Parameter ID Width = 1
01 Value Width = 1
01 Slot Path MSB = 1 (Effect 0102: Chorus)
02 Slot Path LSB = 2
pp Parameter to be controlled.
vv Value for the parameter.
pp = 0 : Chorus Type
Sets Chorus parameters as listed below.
Type Feedback Mod Rate Mod Depth Rev Send
0: Chorus 1 0 (0%) 3 (0.4Hz) 5 (1.9ms) 0 (0%)
1: Chorus 2 5 (4%) 9 (1.1Hz) 19 (6.3ms) 0 (0%)
2: Chorus 3 8 (6%) 3 (0.4Hz) 19 (6.3ms) 0 (0%)
3: Chorus 4 16 (12%) 9 (1.1Hz) 16 (5.3ms) 0 (0%)
4: FB Chorus 64 (49%) 2 (0.2Hz) 24 (7.8ms) 0 (0%)
5: Flanger 112 (86%) 1 (0.1Hz) 5 (1.9ms) 0 (0%)
Each parameter's definition assumes an algorithm that modulates the delay time of the effect-send line. The
modulation waveform and stereo output are implementation dependent. On General MIDI 2 devices, Chorus

## Page 5

Type 2 (Chorus 3) is the recommended initial setting.
pp = 1 : Mod Rate
mr = val * 0.122
Mr is the modulation frequency in Hz.
pp = 2 : Mod Depth
md = (val + 1) / 3.2
Md is the peak-to-peak swing of the modulation in ms.
pp = 3 : Feedback
fb = val * 0.763
Fb is the amount of feedback from Chorus output in percent.
pp = 4 : Send to Reverb
ctr = val * 0.787
Ctr is the send level from Chorus to Reverb in percent.
