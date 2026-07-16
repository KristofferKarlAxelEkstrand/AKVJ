---
title: XMF Patch Type Prefix Meta-Event
docId: RP-032
protocol: midi1
source: .midi-raw-data/rp32 XMF Patch Prefix Meta Event.pdf
sourceType: local
pages: 1
sha256: 0a8bf71f1cbfae122fee6bb192e9f8437c67b69491d9c8917b44b6c5a54b20db
extractedAt: 2026-07-16T12:54:10.015Z
summary: eXtensible Music Format (XMF) specification: file format combining Standard MIDI Files with Downloadable Sounds and other multimedia data.
---
# XMF Patch Type Prefix Meta-Event

## Page 1

XMF Patch Type Prefix Meta-Event
October 10, 2001 Page 1
AMEI/MMA
Recommended Practice RP-032
SMF Meta-Event for XMF Patch Type Prefix
[Abstract]
XMF Type 0 and Type 1 files contain Standard MIDI Files (SMF). Each SMF Track in such XMF files may be
designated to use either standard General MIDI 1 or General MIDI 2 instruments supplied by the player, or custom
DLS instruments supplied via the XMF file. This document defines a new SMF Meta-Event to be used for this
purpose.
[XMF Patch Type Prefix Meta-Event]
The XMF Patch Type Prefix Meta-Event is defined as follows:
FF 60 <len> <param>
In a Type 0 or Type 1 XMF File, this meta-event specifies how to interpret subsequent Program Change and
Bank Select messages appearing in the same SMF Track: as General MIDI 1, General MIDI 2, or DLS. In the
absence of an initial XMF Patch Type Prefix Meta-Event, General MIDI 1 (instrument set and system behavior)
is chosen by default.
In a Type 0 or Type 1 XMF File, no SMF Track may be reassigned to a different instrument set (GM1, GM2, or
DLS) at any time. Therefore, this meta-event should only be processed if it appears as the first message in an
SMF Track; if it appears anywhere else in an SMF Track, it must be ignored.
<param> = 0x01 General MIDI 1. GM1 is chosen by default, so starting an SMF Track with this metaevent selecting GM1 is redundant, but still permitted. Instruments will be automatically
supplied and managed by the player, not supplied in the XMF file. Syntax: [FF 60 01
01]
<param> = 0x02 General MIDI 2. The SMF Track has been written to take advantage of the General MIDI
2 instrument set and/or controller responses. Instruments will be automatically supplied
and managed by the player, not supplied in the XMF file. If GM2 is not available, GM1
will be used. Syntax: [FF 60 01 02]
<param> = 0x03 DLS. The SMF Track has been written for the custom DLS instruments supplied via the
XMF file. Instruments will be supplied via the XMF file, not supplied by the player. Syntax: [FF
60 01 03]
[Relationship to System Exclusive Messages]
In a Type 0 XMF File or a Type 1 XMF File, no SMF Track may be reassigned to a different instrument set (GM1,
GM2, or DLS) at any time after the initial XMF Patch Type Prefix Meta-Event. Therefore, the SysEx messages
GM1 System On, GM2 System On, Turn DLS On, Turn DLS Off and GM System Off should never appear in the
same SMF Track as an XMF Patch Type Prefix Meta-Event, and must be ignored by players if they do appear.
MIDI Manufacturers Association
Los Angeles CA
www.midi.org
