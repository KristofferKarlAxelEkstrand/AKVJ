---
title: MIDI 1.0 5-Pin DIN Electrical Specification
docId: CA-033
protocol: midi1
source: .midi-raw-data/ca33 5 PIn DIN Electrical Spec.pdf
sourceType: local
pages: 6
sha256: c798234e23e21c1eee663e3d1dfb6daec0ee58d0459b748a21764a32ba072371
extractedAt: 2026-07-16T12:54:08.810Z
summary: MMA/AMEI Confirmation of Approval CA-033: MIDI 1.0 5-Pin DIN Electrical Specification.
---
# MIDI 1.0 5-Pin DIN Electrical Specification

## Page 1

MMA Technical Standards Board/
AMEI MIDI Committee
Confirmation of Approval for MIDI Standard
(CA-033) MIDI 1.0 Electrical Specification Update [2014]
Abstract:
This document updates the MIDI 1.0 Electrical Specification to include 3.3-volt signaling and optional RF
grounding. 	This document replaces the Hardware section of the MIDI 1.0 Detailed Specification (Document
Version 4.2), which is included in the MMA publication "The Complete MIDI 1.0 Detailed Specification".
Background:
When the MIDI 1.0 Specification was written, 5-volt signaling was the industry standard for electronic circuits.
The standard MIDI transmitter circuit in the Specification requires the use of 5 volts. 	However, today’s
industry standard is 3.3 volts, so there is a significant advantage in cost and complexity of newly-developed
devices to adapt the MIDI transmitter circuit for 3.3-volt signaling.
In addition, the Specification requires that pin 2 of the MIDI In jack not be connected to ground to avoid
ground loops. The MIDI cable shield thus depends on the ground from Pin 2 of the MIDI Out or MIDI Thru
jack. 	This works well for audio frequency signals. 	However, it is less effective for high frequency (e.g. RF)
interference. 	An optional solution to improve RF performance is to connect pin 2 of the MIDI In jack to the
local device ground through a small-valued capacitor. 	This maintains the ground-loop isolation at audio
frequencies while providing a low-impedance path to ground at radio frequencies.
Further, compliance with Electro-Magnetic Interference / Electro-Magnetic Compatibility (EMI/EMC)
regulations may require filtering of RF interference on signal pins of the MIDI jacks as well. 	This update to
the Specification adds optional ferrite bead RF filters to the signal pins. The update also adds optional
grounding provisions for the grounding shield connectors on the MIDI jacks.
Please refer to The Complete MIDI 1.0 Detailed Specification for more information on the subject matter.
Details:
See the attached document.

## Page 2

HARDWARE
The hardware MIDI interface operates at 31.25 (+/- 1%) Kbaud, asynchronous, with a start bit, 8 data
bits (D0 to D7), and a stop bit. 	This makes a total of 10 bits for a period of 320 microseconds per
serial byte. 	The start bit is a logical 0 (current ON) and the stop bit is a logical 1 (current OFF).
Bytes are sent LSB first.
MIDI Circuit:
The MIDI circuit is a 5mA current loop; logical 0 is current ON. 	One output shall drive one and only
one input. 	To avoid ground loops, and subsequent data errors, the transmitter circuitry and receiver
circuitry are internally separated by an opto-isolator (a light emitting diode and a photo sensor which
share a single, sealed package). 	Sharp PC-900V and HP 6N138 opto-isolators have been found
acceptable. 	Other high-speed opto-isolators may be satisfactory. 	The receiver must require less than
5 mA to turn on. 	Rise and fall times should be less than 2 microseconds.
In addition to a MIDI In and MIDI Out circuit, a MIDI Thru output may be provided if needed, which
provides a direct copy of data received at the MIDI In jack. 	When MIDI Thru information is obtained
from a MIDI In signal, transmission may occasionally be performed incorrectly due to signal
degradation of the rising and falling edges of the data signal caused by the response time of the optoisolator. 	These timing errors will tend to add up in the wrong direction as more devices are chained
between MIDI Thru and MIDI In jacks. 	The result is that, regardless of circuit quality, there is a limit
to the number of devices that can be chained (series connected) in this fashion. 	For long chain lengths
(more than three instruments), higher speed opto-isolators should help to avoid additive rise- and falltime errors that can affect pulse-width duty-cycle. 	The MIDI Thru circuit is shown in the same
schematic as the MIDI In circuit (Figure 2).
Pin 2 must be tied to ground on the MIDI transmitter
only.
The buffer between the UART transmitter and R C is
optional and system-dependent.
The UART is configured with 8 data bits, no parity, and 1
stop bit, or 8-N-1.
The resistor values depend on the transmission signaling
voltage, VTX, as detailed below.
The optional ferrite beads are 1k-ohm at 100MHz such as
MMZ1608Y102BT or similar.
V TX 	+5V ± 10% 	+3.3V ± 5%
RA 	220Ω 5% 0.25W 	33Ω 5% 0.5W
RC 	220Ω 5% 0.25W 	10Ω 5% 0.25W
Figure 1 – MIDI OUT Circuit
The buffer shown in the MIDI Out circuit driving RC is optional and system-dependent, and if present,
may be implemented as an IC gate or transistor or a combination.

## Page 3

31,250 bits/sec
UART Receiver
VTX
RE
RF
N/C	N/C
THRU
RB
RD
V RX 	Optional MIDI Thru Circuit
Choose R E and RF based on V TX in the
same way as described for MIDI Out RA
and R C
Opto-Isolator
such as
PC900V or 6N138
IN
4 	5
4 	5
Do not connect any pins of the MIDI IN jack
directly to ground 	Value of R D
depends on optoisolator and V RX.
Recommended value
is 280Ω for PC900V
with V RX=5V.
D1
1N914
FB3
1K @100MHz
FB4
1K @100MHz
N/C
N/C
Optional ferrite beads to
improve EMI/EMC
performance
FB5
1K @100MHz
FB6
1K @100MHz
Optional ferrite beads to
improve EMI/EMC
performance
Reverse voltage
protection for
opto-isolator
Jack shield – N/C or
optional ground to improve
EMI/EMC performance
Jack shield – N/C or optional small
capacitor (0.1 μF typical) to improve
EMI/EMC performance
Pin 2 – N/C or optional small
capacitor (0.1 μF typical) to
improve RF grounding
Figure 2 – MIDI IN and THRU circuit
MIDI Device Connectors:
The MIDI Out, In, and optional Thru jacks shall be DIN 5-pin (180 degree) female panel-mount
receptacles. 	An example is the SWITCHCRAFT 57PC5F. 	The connectors shall be labeled “MIDI
OUT”, “MIDI IN”, and “MIDI THRU”. 	Note that pins 1 and 3 are not used, and should be left
unconnected in the receiver and transmitter.
Pin 2 of the MIDI In connector shall not have any DC path to the receiver’s ground. 	However, a
connection through a small capacitor (0.1μF typical) to ground is optional for improved high-frequency
(RF) shielding.
The shield connector of the MIDI In jack shall not have any DC path to the receiver’s ground.
However, a connection through a small capacitor (0.1μF typical) to ground is optional for improved
EMI/EMC performance.
The shield connector of the MIDI Out and MIDI Thru jacks may be unconnected (N/C) or connected to
ground for improved EMI/EMC performance.
MIDI Cable:
The MIDI cable shall have a maximum length of fifty feet (15 meters), and shall be terminated on each
end by a corresponding 5-pin DIN male plug such as the SWITCHCRAFT 05GM5M. 	The cable shall
be shielded twisted pair, with the shield connected only to pin 2 at both ends, as illustrated in Figure 3,
below.

## Page 4

Figure 3 – MIDI Cable
Do not connect the MIDI cable shield to the shield barrel of the MIDI plug.
Cable connection to pins 1 and 3 is not required by this specification, but may be present.
Low-Voltage Signaling Details:
The MIDI current loop can run at low-voltage (3.3V) signal levels. 	The MIDI output circuit is the
only affected component for Low-Voltage Signaling. 	It requires changing the output resistors from
220Ω to 33Ω and 10Ω (±5%) and changing the voltage from +5V to +3.3V (±5%).
The schematic diagram in Figure 1, above, supports either +5V or +3.3V signaling.
Low-Voltage Signaling Technical Notes:
The standard MIDI circuit is a current-loop that drives an opto-isolator located in the receiver returning
the current to the transmitter. 	From the viewpoint of the transmitter, the opto-isolator is electrically
identical to an LED in series with a 220Ω resistor. 	The opto-isolators found in some MIDI devices
have an LED maximum forward voltage drop of 1.9V and can require up to 5mA typical1 current drive
for normal operation. 	The actual required current is opto-isolator dependent. 	For example, the
PC900V has a worst-case forward current requirement of 4mA when RD = 280Ω (see Figure 2) and
VRX = 5V.
In order to supply 5mA to this circuit, the transmitter voltage must satisfy the following relationship:
VTX >= VRXDROP = .005*220 + 1.9
This reduces to:
VTX >= VRXDROP = 3.0V
It is required to have short-circuit current-limiting on the MIDI Output as well, which is achieved by
series resistors on each of the two output pins. 	The series resistors are also subject to the IR voltage
drop introduced by the 5 mA current, thus increasing the minimum transmitter voltage. 	The logical
choice is +3.3V as a minimum transmitter voltage. 	The series resistor values should satisfy the
following relationship:
(RA + RC ) = (VTX – VRXDROP ) / .005
1 The original 5V MIDI circuit specified 5mA, which can be derived from the typical total series resistance of 660Ω
(3*220Ω), typical signaling voltage of +5V and the 1.7V maximum forward drop of a 6N138 opto-isolator.

## Page 5

Substituting +3.135V (95% of +3.3V) for VTX and solving for (RA + RC ), this reduces to:
(RA + RC ) = 27Ω
The recommended values of 33Ω and 10Ω for RA and RC produce a total resistance of 43Ω, which
reduces the worst-case current to 4.472 mA, assuming a -5% power supply, +5% resistors, and a
forward drop of 1.9V. 	It is not clear, however, that 1.9V can be achieved with only 4.472 mA drive,
as the maximum forward drop occurs at the highest current. 	If the forward drop decreases, the
current through the resistors increases.
With a nominal supply voltage of exactly 3.3V, exact-valued resistors, and a typical forward voltage
drop of 1.4V (for 6N138 at 25°C and approx. 7-8 mA) the circuit obtains forward current of approx.
7.2 mA.
Using +5% maximum voltage and -5% minimum resistance value, the maximum short-circuit current
(to ground) through RA will be:
I MAXSHORT = 3.465 / 31.35
This reduces to:
I MAXSHORT = 0.111A
The maximum short-circuit power dissipation will be:
PMAXSHORT = 0.383W
This requires using a 0.5W resistor or additional current-limiting circuitry. 	The RA resistor is pulling
straight up to a 3.3V power supply, so the 0.5W rating is necessary. 	It is, of course, acceptable to use
parallel resistors to achieve a higher power rating. 	For example, one could use four 0.125W 130Ω
resistors in parallel, producing an equivalent resistance of 32.5Ω and power rating of 0.5W.
It is assumed that the digital buffer driving RC in 3.3V designs is open collector or open drain, which
allows a smaller 0.25W resistor to be used with adequate protection in the event of a MIDI cable
short-circuit. Care must be taken when using digital buffers in 3.3V designs to not exceed the buffer’s
maximum short-circuit current in the event of a MIDI cable short-circuit.
Low-Voltage Signaling Interoperability Issues:
The low-voltage signaling circuit is compatible with all legacy MIDI 1.0 receivers that strictly follow
the specification. 	Products that deviate from or attempt to extend the specification may not be 100%
compatible.2
Possibly incompatible circuit designs include non-opto-isolated receivers and devices that draw power
from Pin 4 through the 220Ω resistor (RA or RE) to +5V.
2 The MMA does not maintain a list of strictly compatible or potentially incompatible MIDI receiver products.

## Page 6

A non-opto-isolated receiver is likely to be voltage-sensitive and the lower signaling voltage may not
adequately drive the receiver above its input high signaling voltage. 	This type of receiver is also a
possible source of ground loops, since the lack of isolation requires tying the grounds together.
Devices that draw power from Pin 4 may fail to operate when pin 4 is tied to +3.3V instead of +5V, as
the power supply circuit may depend on a minimum voltage available that is greater than that supplied
by the +3.3V transmitter. 	This type of receiver is also a possible source of ground loops, since the
power supply must return to the ground of the transmitter. 	If the receiver’s ground is also tied to the
ground of another device, a ground loop may be formed.
(Optional) RF Grounding Details:
The MIDI input circuit is specified to operate with no connection to ground, in order to avoid ground
loops. 	This is good for audio-frequency signals. 	However, the cable inductance raises the
impedance at high (RF) frequencies making the transmitter ground less effective at longer cable
lengths. 	One solution to this is to connect Pin 2 of the MIDI In jack to ground through a small
capacitor. 	The small capacitor provides a low-impedance path to ground for high (RF) frequencies at
the MIDI Receiver side while maintaining immunity to audio-frequency ground loops. 	A capacitor
value of 0.1μF is optionally recommended, which results in an impedance of 0.16Ω3 at 10 MHz;
practically a dead short. 	At 20 kHz the impedance is 79.6Ω, and at 60 Hz the impedance is 26.5kΩ.
The schematic in Figure 2 (above) illustrates the use of the optional RF grounding capacitor.
(Optional) Improved EMI/EMC Performance Details:
The optional ferrite beads FB1-6 shown in Figures 1-2 attenuate RF interference by presenting an
impedance of 1kΩ at 100MHz while having a DC resistance of near zero. 	Although an example
component (MMZ1608Y102BT) is designated, different components may be substituted to tune the
impedance characteristic to the specific product design. 	The ferrite beads are optional and are not
required for proper MIDI functionality. They may be omitted if the product does not need them to
comply with EMC regulations.
If present, the ferrite beads should be placed as close to the jacks as possible. 	The schematics in
Figure 1 and Figure 2 (above) illustrate the use of the optional ferrite beads.
The MIDI 1.0 Detailed Specification (Document Version 4.2) states that “the grounding shield
connector on the MIDI jacks should not be connected to any circuit or chassis ground.” This was
mandated to avoid ground loops between devices when an improperly wired MIDI cable was used (an
improperly wired MIDI cable may have a connection to one or more of the shield barrels of its MIDI
plugs).
However, to improve EMI/EMC performance, it is now permitted, as an option, to connect the
grounding shield connectors on MIDI Out and MIDI Thru jacks to ground. It is also permitted, as an
option, to connect the grounding shield connector of a MIDI In jack to a small capacitor to ground
(0.1μF typical), in order to avoid a ground loop when an improperly wired MIDI cable is connected.
But it is still not permitted to connect the grounding shield connector of a MIDI in jack directly to
ground.
3 To be mathematically correct, the capacitor impedance is imaginary and negative, so the textbook impedance would be
−0.16j Ω. 	In the interest of simplicity, the complex number representation is not used.
