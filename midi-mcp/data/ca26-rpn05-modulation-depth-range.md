---
title: Modulation Depth Range RPN
docId: CA-026
protocol: midi1
source: .midi-raw-data/ca26 RPN05 Modulation Depth Range.pdf
sourceType: local
pages: 1
sha256: 49be1c7b497827a889374028e789198649ca8d94ae92afc395c66d3929c3ecba
extractedAt: 2026-07-16T12:54:08.737Z
summary: MMA/AMEI Confirmation of Approval CA-026: Modulation Depth Range RPN.
---
# Modulation Depth Range RPN

## Page 1

MMA Technical Standards Board/
AMEI MIDI Committee
Confirmation of Approval of New MIDI Message
Date of issue: 3/02/99 Originated by: MMA
Reference TSBB Item #: 152 Volume #: 22 (revised)
Title: Modulation Depth Range RPN
CA#: 26_
Related item(s): MIDI 1.0 Detailed Specification, General MIDI 2 R/P
Abstract:
This proposal defines Registered Parameter Number (RPN) #05 as Modulation Depth Range to be used to scale
the effective range of Control Change 1 (Modulation Wheel). The correlation between Modulation Depth Range
values and modulation depth is defined by individual manufacturers or MMA/AMEI recommended practices.
Background:
The amount of modulation to apply when the Modulation Wheel is moved has never been defined. As a result, the
Modulation Depth Range, sometimes called Modulation Sensitivity, is controlled in some synthesizers either by
Non-Registered Parameter Numbers (NRPNs) or System Exclusive Messages (Sysex). These methods are not
compatible among all manufacturers, therefore a uniform message is proposed herein which will benefit music
data publishers and musicians by providing predictable and consistent modulation depth response.
Details:
[REGISTERED PARAMETER NUMBER]
MODULATION DEPTH RANGE
LSB MSB Function
========================================
05 00 Modulation Depth Range
Message Format: Bn 64 05 65 00 where n is the MIDI channel number.
This message must be followed by Data Entry, Increment, and Decrement, following the normal rules for
Registered Parameters.
Neither default setting nor definition is given for Modulation Depth values, so it is left to the discretion of the
manufacturer unless specified by a particular RP. See the General MIDI Level 2 Recommended Practice for an
example.
Comment:
The destination parameter for Modulation Wheel is generally Vibrato, but other parameters may be controlled at
the discretion of the manufacturer, or may be defined in specific RPs, using the “Controller Destination Setting”
message.
