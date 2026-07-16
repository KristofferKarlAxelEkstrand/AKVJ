---
title: Recommended Practice (RP-017) SMF Lyric Meta Event Definition
docId: RP-017
protocol: midi1
source: .midi-raw-data/rp17 SMF Lyric Events Definition.pdf
sourceType: local
pages: 2
sha256: a14840ed42ba3eafd21bde64801ad3215dbd44afd54b895ac7578d49025dbe02
extractedAt: 2026-07-16T12:54:09.801Z
summary: MMA/AMEI Recommended Practice RP-017: Recommended Practice (RP-017) SMF Lyric Meta Event Definition.
---
# Recommended Practice (RP-017) SMF Lyric Meta Event Definition

## Page 1

Recommended Practice (RP-017)
SMF Lyric Meta Event Definition
This is a recommended practice (RP) defining a common implementation for the use of Lyric Meta Events within a Standard
MIDI File. The Standard MIDI Files 1.0 document does not clearly define how to place text within the Lyric Meta Events, with
the result that several companies have implemented lyric events in incompatible ways.
This RP meets the requirement that Lyric Meta Events contain only ASCII characters, but defines the use and meaning of
certain characters as well as how to implement the placement of text in the Lyric Meta Event in a manner suitable for both
"Notation" and "Karaoke" applications.
Under this RP:
1) Each syllable is an individual Lyric Meta Event.
The original SMF document first provides guidelines about all text Meta events, then more specifically about the Lyric Meta
event:
"A lyric to be sung - Generally, each syllable will be a separate lyric event which begins at the event time."
2) Use Space (ASCII 20 hex) as a Delimiter at the end of every word.
When song lyrics are typed, it is natural to insert a space between words, so this is the natural sign for the end of a word. If
a Lyric Meta Event does NOT end with a space it is then known that the next lyric event following is a continuation of the
same word.
3) Use Punctuation as follows:
Punctuation marks (commas, question marks, etc.) should be placed only at the end of a syllable event and before the Space
delimiting the end of every word. The last event in a sentence would thus include the characters in the last syllable of the last
word, then a period (full stop) or other punctuation, and then a space character.
4) Use Carriage Return (0D) as end of line signal
Generally used after the end of a phrase or a sentence, which also is often the end of a musical phrase. For display function
like Karaoke applications, this generally signifies the end of a displayed line of text. Keeping this application in mind, the
number of syllable characters between each CR event should be considered. The Carriage Return should not be used with any
other ASCII Characters in a single Lyric Meta Event.
5) Use Line Feed (0A) as end of paragraph signal
Generally used at the end of a section such as Phrase, Verse, Bridge or Chorus. For display function like Karaoke applications,
this generally signifies when to refresh the screen with a new set of lyrics. Keeping this application in mind, the number of
lines between each LF event and the timing of this event should be considered. The Line Feed should not be used with any
other ASCII Characters in a single Lyric Meta Event.
6) Use Hyphenation as follows:
Scoring or Printing application software may insert hyphens between syllables within their native format as necessary for
correct notation (this would commonly be on the end of a syllable that does not end with a space). However, these inserted
hyphens between syllables would NOT be within the Lyric Meta event. Hyphens should only appear within a Lyric Meta Event
if they are used to create grammatically correct language (usually between two words, like "sixty-four", or "jack-o-lantern").
Example: The sentence "Each syllable in sixty-four is an individual Lyric Meta Event" would in some applications be written as
"Each syl-la-ble in six-ty-four is an in-di-vi-dual Ly-ric Me-ta E-vent" and would be embedded in a Standard MIDI File as:
3:01:000 <Meta>Lyric "Each "
3:02:000 <Meta>Lyric "syl"
3:03:000 <Meta>Lyric "la"
3:04:000 <Meta>Lyric "ble "
4:01:000 <Meta>Lyric "in "
4:02:000 <Meta>Lyric "six"
4:03:000 <Meta>Lyric "ty-"
4:04:000 <Meta>Lyric "four "
5:01:000 <Meta>Lyric "is "
5:02:000 <Meta>Lyric "an "
5:03:000 <Meta>Lyric "in"
5:04:000 <Meta>Lyric "di"
6:01:000 <Meta>Lyric "vi"
6:02:000 <Meta>Lyric "dual "
6:03:000 <Meta>Lyric "Ly"
6:04:000 <Meta>Lyric "ric "
7:01:000 <Meta>Lyric "Me"
7:02:000 <Meta>Lyric "ta "
7:03:000 <Meta>Lyric "E"
Page 1 of 2

## Page 2

7:04:000 <Meta>Lyric "vent. "
8:01:000 <Meta>Lyric "[CR]"
8:02:000 <Meta>Lyric "[LF]"
7) Melisma Event
A Lyric Meta Event that contains no characters does not end the current word and does not specify a new syllable; it
therefore specifies a melisma. This indicates that the syllable in the previous Lyric Meta Event should continue to be sung.
This RP also includes the following additional recommendations:
1) Placement of the First Lyric Meta Event
It is recommended that a Lyric Meta Event be placed at the beginning of the Standard MIDI File (Bar 1, Beat 1, Tick 0). This
event would act as a flag to turn on Lyrics functions in some playback devices that may operate in various modes. Currently,
some companies place copyright notices here so that they appear in the lyric display. Some companies have also used this
location to provide a language description (such as "English, "French", or "Japanese"). In the future, other setup information
such as character set definition may be found here. (The use of this initial event should be further defined in a later
proposal.)
2) Number of Characters before a Line Return
Some lyrics display devices and applications ("Lyric Players") have a limited number of characters that they can display at
one time. It is recommended that a Carriage Return be included within 40 characters and the Carriage Return should be on a
word boundary. However, if the 40 character limit is exceeded, the Lyric Player should not stop unintentionally.
3) Reserved ASCII Characters
Only certain characters can be reliably and consistently read and displayed on a wide range of display devices. Additionally,
there are some characters which may need to be defined for some special control purposes in the future (for example, escape
codes to select different language sets).
The following is the list of characters which are accepted for use:
A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
a b c d e f g h i j k l m n o p q r s t u v w x y z 0 1 2 3 4 5 6 7 8 9
. ( period ) , (comma) ! " ' ? # $ & * + - / : ; = % @ ^ ` ~ _ | ( ) < >
[SPACE] (as delimiter at the end of a word) [CR] (as end of line signal)
[LF] (as end of paragraph signal]
The following characters are currently planned to be used in a subsequent proposal as escape codes for multi language
support so it is best to avoid the use of these characters:
\ [ ] { }
RP-017 Approved by MMA 11/14/97 / Approved by AMEI 10/3/97. Contents Copyright 1997 MIDI Manufacturers Association
Incorporated. All rights reserved. No part of this text may be reproduced in any form or by any means electronic or
mechanical without express permission in writing from the MIDI Manufacturers Association.
Page 2 of 2
