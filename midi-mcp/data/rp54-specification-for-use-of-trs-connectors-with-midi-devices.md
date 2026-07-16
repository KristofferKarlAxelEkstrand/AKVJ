---
title: MIDI over TRS Connectors Specification
docId: RP-054
protocol: midi1
source: .midi-raw-data/rp54 Specification for Use of TRS Connectors with MIDI Devices.pdf
sourceType: local
pages: 2
sha256: cf38ae8d80f64bc31fc7e80400deca3cd49624432fb27d422cbd0cc70f43bb53
extractedAt: 2026-07-16T12:54:10.294Z
summary: MIDI over TRS Connectors specification: wiring and circuitry for MIDI 1.0 over tip-ring-sleeve connectors.
---
# MIDI over TRS Connectors Specification

## Page 1

Page 1 of 2
(C) 2017-18 MIDI Manufacturers Association / AMEI
MMA Technical Standards Board/
AMEI MIDI Committee
Letter of Agreement for Recommend Practice
Specification for use of TRS Connectors with MIDI Devices [RP-054]
Abstract:
This document defines how to wire “TRS” (tip-ring-sleeve) connectors for use with MIDI devices, and
describes the necessary device circuitry and cable specifications to support MIDI communication over
the TRS connection.
Background:
The inclination towards smaller hardware devices has made it increasingly difficult to make use of DIN
connectors for MIDI In/Out in the past few years. Many manufacturers have chosen to use 2.5mm or
3.5mm “TRS” connectors instead. But since there was no specification for wiring a TRS MIDI
connection, the situation exists where two devices may not have chosen the same wiring scheme, so
compatibility between devices is not known. By specifying the pin-out for the TRS connection, and also
the connectors for the adapter cable, we can ensure greater interoperability between TRS and DIN MIDI
devices.
Details:
(1) Pin-out Correspondence:
The following TRS to DIN drawing illustrates the wiring for a female TRS connector in comparison to a
female MIDI-DIN connector (it is expected that devices will use female TRS connectors).
Notes:
The MIDI In/Out circuitry should be implemented in accordance with the MIDI 1.0 Electrical
Specification Update [2014] (MMA/AMEI CA-033).
Because TRS connectors are often used for other (non-MIDI) purposes, manufacturers are strongly
advised to add protection circuitry (e.g. to handle the case when a DC-coupled headphone driver is
connected to a MIDI output).

## Page 2

MMA/AMEI Letter of Agreement for Recommended Practice 	RP# _054
Page 2 of 2
(C) 2017-18 MIDI Manufacturers Association / AMEI
(2) Connector Size:
2.5mm TRS connectors are recommended.
Note: If any other connector size is used, the remainder of this specification still applies.
(3) Cables
All cables shall use shielded twisted pairs, as defined for a MIDI cable.
The following drawing shows how to implement a male TRS to female MIDI-DIN adapter cable:
Notes:
Adapter cables shall have a maximum length of 2 meters.
Direct connection between two TRS-equipped devices using cables designed for use with audio
equipment is not acceptable because the wires are not twisted pair and are typically individually
shielded.
Originated By: MMA 	Reference MMA TSB Item #: 215 	Version #: 0.941
TSBB #: 	n/a 	Last Revised: 	05/17/2018
MMA Approval Date: 06/08/2018 	AMEI Approval Date: 07/18/2018
Related Items: MIDI Electrical Specification Update (2014)
