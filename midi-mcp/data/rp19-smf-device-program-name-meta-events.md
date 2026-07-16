---
title: Recommended Practice (RP-019) SMF Device Name and Program Name Meta Events
docId: RP-019
protocol: midi1
source: .midi-raw-data/rp19 SMF Device & Program Name Meta-events.pdf
sourceType: local
pages: 1
sha256: 485a3121e417294c0bd8bd07275bcfa7f4e9ff2b515668586a20e5146de50b6e
extractedAt: 2026-07-16T12:54:09.830Z
summary: MMA/AMEI Recommended Practice RP-019: Recommended Practice (RP-019) SMF Device Name and Program Name Meta Events.
---
# Recommended Practice (RP-019) SMF Device Name and Program Name Meta Events

## Page 1

Recommended Practice (RP-019)
SMF Device Name and Program Name Meta Events
These two new Meta Events can be used to allow a single Standard MIDI File to address multiple devices, enabling more than
16 MIDI Channels of playback. The use of device names instead of cable numbers allows free relocation of devices. Also, if
the MIDI File were used in a completely different context, having the device name would provide a valuable hint in
reorchestration.
Under this RP:
1) A new Meta Event 09 called Device Name Meta Event is used for the purpose of naming the device to be used
on a track.
FF 09 len text 	DEVICE NAME
The Device Name is the name of the device that this track is intended to address. It will often be the model name of a
synthesizer, but can be any string which uniquely identifies a particular device in a given setup. There should only be one
Device Name (Meta Event 09) per track, and it should appear at the beginning of a track before any events which are
sendable (i.e., it should be grouped with the text events before the proposed Program Name [Meta Event 08 - see below] and
before bank select and program change messages). This will ensure that each track can only address one device.
2) A new text Meta Event called Program Name, names the program referenced by the immediately following
sequence of bank select and program change messages.
FF 08 len text 	PROGRAM NAME
One purpose of this event is to aid in reorchestration; since one non-General-MIDI device's piano can be another one's drum
kit; knowing the intended program name can be an important clue.
The Program Name is the name of the program called up by the immediately following sequence of bank select and program
change messages. The channel for the program change is identified by the bank select and program change messages. The
Program Name Meta Event may appear anywhere in a track, but should only be used in conjunction with optional bank
selects and a program change. There may be more than one Program Name Meta Events in a track.
Use in Type 0 and Type 1 SMF
Each track of a MIDI File can contain one MIDI stream, including SysEx and up to 16 channels. The Device Name Meta Event
is used to label each track in a MIDI File with a text label.
If a Type 1 Standard MIDI File contains MIDI data for several devices, the data for each device is contained in a separate
track, each with a different Device Name Meta Event. It is possible to have any number of tracks which address the same
Device Name; however, each track can only address one device, as noted above.
Since a Type 0 Standard MIDI File has only one track, it can have only one Device Name Meta Event.
Recommendation Regarding Device Naming
There are many ways MIDI Files are used, and the Device Name Meta Events may be used as appropriate. For MIDI Files
which are used by a single user on a single computer between many programs, Device Name Meta Events are a useful way of
preserving the information between programs. The names make perfect sense within the context of that user's system,
especially with systems that keep track of where the devices are actually located.
When a single user's MIDI File is used on another computer, the Device Names often will not match the devices on that other
computer. In this case, it's handy having the original Device Names stored as text in the track so that the user or an
intelligent software package can make the best decision about what device the track should play on the second computer.
When MIDI Files are authored for widespread distribution to unknown studio setups, generic names indicating the type of
desired instrument (the synth if SysEx is included, or the sound if it isn't) are useful Device Names, or Device Names may be
omitted entirely, especially if the entire file contains fewer than 16 channels.
When MIDI Files are authored for widespread distribution to run on a specific type of system, the system manufacturer can
choose to use a textual representation of numbers ("0", "1", etc.) as Device Name labels, or the manufacturer can
recommend more specific names ("FM", "Wave", etc.).
RP-019 Approved by MMA 4/10/98 / Approved by AMEI 5/7/99. Contents Copyright 1999 MIDI Manufacturers Association
Incorporated. All rights reserved. No part of this text may be reproduced in any form or by any means electronic or
mechanical without express permission in writing from the MIDI Manufacturers Association.
Page 1 of 1
