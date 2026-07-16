---
title: MIDI Machine Control
docId: RP-013
version: 1.0
protocol: midi1
source: .midi-raw-data/RP-013_v1-0_MIDI_Machine_Control_Specification_96-1-4 (1).pdf
sourceType: local
pages: 110
sha256: 7383f2cd7aae088cba37dea0a787571ad0b9e7e9a5e187d4c61705beaef3f264
extractedAt: 2026-07-16T12:54:08.230Z
summary: MIDI Machine Control (MMC) specification for transport control of recording equipment.
---
# MIDI Machine Control

## Page 1

MIDI
	Machine
	Control
	1.0

## Page 2

MMA0016 I RP013
Copyright
©
MIDI
Manufacturers Association
ALL
RIGHTS RESERVED.
NO
PART OF
THIS DOCUMENT MAY BE REPRODUCED
IN
ANY FORM
OR BY
ANY MEANS.
ELECTRONIC
OR
MECHANICAL, 	INCLUDING 	INFORMATION
STORAGE 	AND 	RETRIEVAL
SYSTEMS, 	WITHOUT
PERMISSION IN WRITING FROM THE MIDI MANUFACTURERS ASSOCIATION.
MMA
POB 3173
La Habra CA 90632-3173

## Page 3

MIDI
Machine
Control
Recommended
Practice
	1.00
January. 1992
CONTENTS
1 	INTRODUCTION
Numeric Conventions
2 	GENERAL STRUCTURE
Universal System Exclusive Format
Open Loop vs. Closed Loop
Handshaking
Device Identification
Commands
Responses
Extension Sets
Data Lengths
Segmentation
Error Handling
Command Message Syntax
Response Message
Syntax
3 	STANDARD SPECIFICATIONS
Standard
Time
Code
	.
Standard Short Time Code
Standard User Bits
Drop Frame Notes
Standard Speed
Standard Track Bitmap
Motion Control States and Processes
Motion Control State (MCS)
Motion Control Process (MC?)
4 	INDEX LIST
Message
Types
Abbreviations
Used
Guideline Minimum Sets
Commands
Responses and Information Fields 	_
Commands and Information Fields according to Type
Read and Write
Transport Control
Local Time Code
Synchronization
Generator
RP—013
\lO‘O‘LlIM-FAAWNNt—Ii—I
l4
l4 	'
l4
l7

## Page 4

MIDI
Time
Code
Time Code Mathematics
Procedures
Event Triggers
Communications
5 	DETAILED COMMAND DESCRIPTIONS
	STOP
02 	PLAY
03 	DEFERRED PLAY
04 	FAST FORWARD
	REm
06 	RECORD S'IROBE
07 	RECORD EXIT
08 	RECORD PAUSE
09 	PAUSE
0A 	EJECT
OB 	CHASE
0C 	COMMAND ERROR RESET
0D 	MMC RESET
4O 	WRITE
41 	MASKED WRITE
42 	READ
43 	UPDATE
	LOCATE
45 	VARIABLE PLAY
46 	SEARCH
	SHUTTLE
48‘
	STEP
49 	ASSIGN SYSTEM MASTER
4A 	GENERATOR COMMAND
43 	MIDI TIME CODE COMMAND
4C 	MOVE
4D 	ADD
4E
	SUBTRACT
4F 	DROP FRAME ADJUST
50 	PROCEDURE
	EVENT
	GROUP
53 	COMMAND SEGMENT
54 	DEFERRED VARIABLE PLAY
55 	RECORD STROBE VARIABLE
7C 	WAIT
7F 	RESUME
	DETAILED
RESPONSE
8;
INFORMATION FIELD DESCRIPTIONS
01 	SELECTED TIME CODE
02 	SELECTED MASTER CODE -
03 	REQUESTED OFFSET
04 	ACTUAL OFFSET
05 	LOCK DEVIATION
06 	GENERATOR TIME CODE
II
l9
l9

## Page 5

0A
OB
OD
0E
0F
2A
2C
2D
2E
2F
4 l
4A
4B
4C
4D
41?.
4F
5A
5B
5C
5D
MIDI
TIME
CODE
INPUT
GPO / LOCATE POINT
GPl
GP2
GP3
GP4
GPS
GP6
GP7
Short SELECTED TIME CODE
Short SELECTED MASTER CODE
Short REQUESTED OFFSET
Short ACTUAL OFFSET
Short LOCK DEVIATION
Short GENERATOR TIME CODE
Short MIDI TIME CODE INPUT
Short GPO / LOCATE POINT
Short GPl
Short GP2
Short
GP3
Shon GP4
Short
GPS
Short GP6
Short GP7
SIGNATURE
UPDATE RATE
RESPONSE ERROR
COMMAND ERROR
COMMAND ERROR LEVEL
TIME STANDARD
SELECIED TIME CODE SOURCE
SELECTED TIME CODE USERBITS
MOTION CONTROL TALLY
VELOCITY TALLY
STOP MODE
FAST MODE
RECORD MODE
RECORD STATUS
TRACK RECORD STATUS
TRACK RECORD READY
GLOBAL MONITOR
RECORD MONITOR
TRACK SYNC MONITOR
TRACK INPUT MONITOR
STEP LENGTH
PLAY SPEED REFERENCE
FIXED SPEED
LIFTER DEFEAT
CONTROL DISABLE
RESOLVED PLAY MODE
CHASE MODE
GENERATOR COMMAND TALLY
GENERATOR SET UP
GENERATOR USERBITS
III

## Page 6

5E
	MIDI TIME
CODE
COMMAND
TALLY
5F 	MIDI TIME CODE SET UP
60 	PROCEDURE RESPONSE
61 	EVENT RESPONSE
62 	TRACK MUTE
	VITC
INSERT
ENABLE
64 	RESPONSE SEGMENT
65 	FAILURE
7C
	WAIT
7F 	RESUME
Appendix A 	EXAMPLES
Example 	1
Example
Example
Appendix B 	TIME CODE STATUS IMPLEMENTATION TABLES
01 	SELECTED TIME CODE
02 	SELECTED MASTER CODE
03 	REQUESTED OFFSET
04 	ACTUAL OFFSET
05 	LOCK DEVIATION
06 	GENERATOR TIME CODE
07 	MIDI TIME CODE INPUT
O8-0F 	GPO lhru GP7
Appendix
C
	SIGNATURE
TABLE
Command Bitmap Array
Response/Information Field Bitmap Array
Appendix
D
	MIDI
MACHINE
CONTROL
and
MTC CUEING
Comparison of MIDI Machine Control and MTC Cueing event specifications
Review of MTC Cueing messages, and their relationship to MMC
Appendix E 	DETERMINATION OF RECEIVE BUFFER SIZE
Operation of WAIT in a Simple "Closed Loop"
External MIDI Mergers
IV

## Page 7

INTRODUCTION
MIDI
Machine Control
is
general
purpose
protocol
which
initially
allows
MIDI
systems
to communicate
with
and
to control some of the more uaditional audio recording and production syStems. Applications may range from a
simple interface through
which
single
tape
recorder
can
be
instructed to
PLAY,
STOP,
FAST
FORWARD
or
REWIND,
to
complex communications
with
large.
time
code
based
and
synchronized
systems
audio and
video
recorders.
digital
recording
systems and
sequencers.
Considerable expansion
MIDI
Machine
Control protocol
is
realizable in
future,
and
many diverse audio,
visual
and
mixed
media devices
may
thus
be
brought
together
under a single general purpose control umbrella.
The
set
Commands
and
Responses
is
modelled
on
Audio
Tape
Recorder
section
ESbus
standard. The
intention
is that command translation
between
MIDI
Machine
Control
specification
and
ESbus
standard
will
be
relatively
straight
forward,
being
based
on
same
operating
principles.
On
other
hand,
it
has
been
assumed
that
translation
will
involve
more
than
table
look-up,
and
considerable
variation
will
be
found in
data
specification
and
other communications
details. 	In
essence
MIDI
Machine
Control
rs
intended
to
communicate easily
with
devices which are designed to execute the same set of operations as are defmed'm the ESbus standard.
By contrast with ESbus and other control protocols. MIDI Machine Control does not require that a Controlling
device
have
intimate knowledge
devices
which
it
is
controlling.
In
simpler applications,
Controller
will
implement
set
commands
deemed
"reasonable"
by
its
designers, and the
Controlled
Devices
will
apply
their
own intelligence to determine the best way to respond to commands received. At the same time, Controllers of
much greater
complexity
can
be
designed around
MIDI
Machine
Control,
and
applications
are
expected
to extend
from the very basic to the fully professional.
NUMERIC CONVENTIONS
All numeric quantities in this text should be assumed to be mama. unless otherwise noted.
All bit fields will be shown with the most significant bit first.
2 	GENERAL STRUCTURE
UNIVERSAL SYSTEM EXCLUSIVE FORMAT
MIDI Machine Control uses two Universal Real Time System Exclusive ID numbers (sub-ID 1's), one for
Commands (transmissions from Controller to Controlled Device), and one for Responses (transmissions from
Controlled Device to Controller).
Throughout this document, "mcc" and "mcr" will be used to denote the Machine Control Command and Machine
Control
Response
sub-ID
l's
respectively. 	The
resulting Real
Time
System Exclusives
are
as
follows:
F0 	7?
<device_ID>
	<mcc> 	<commands
	.
	.
	.
	>
F7
F0
	71-“
<device_ID>
	<mcr>
	<responses
	. 	.
	.
	>
F7
NOTES:
1.
	More
than one command (or
response) can be
transmitted in
a Sysex.
2.
	The number
bytes in
"commands" or "responses"
field must not exceed 48.
3. 	sysex‘s must always be closed with an F7 as soon as all currently prepared information has been
transmitted.
4. 	Actual values for 	<mcc> 	and 	<mcr> 	are 	06hex 	and 	07hex 	respectively.

## Page 8

. 	OPEN LOOP vs. CLOSED LOOP
MIDI Machine Control has been specifically designed for operation in both open and closed loop systems.
W 	a single cable connects the Controller's MIDI Out to the Controlled Device's MIDI In.
m 	an additional cable connects the Controlled Device's MIDI Out back to the Controller’s
MIDI In, allowing full duplex communication.
A Controller should power up expecting a closed loop. If, after issuing a command which expects a response, no
response arrives within 2 seconds. then the loop can be assumed to be open.
Switching between these two states within the Controller may be represented as follows:
CLOSED_LOOP_STATE
(default
	at
power
	up)
<<< —————
Request 	response(s) 	from 	I
	controlled
device
	I
I
| 	l
Response 	time-out 	(2'sec) 	Arrival 	of 	a 	response
I
OPEN_LOOP_STATE
l
I
l
I
	If
	Controller
wishes
	to
I
	detect
	further
changes
	in
l
	state 	of
	loop,
	then
I 	it 	should 	transmit 	a 	request
I 	for 	a 	response 	(any 	response)
I
	at
	some
	regular
	interval.
|
	Subsequent
	time-outs, 	while
I 	waiting 	for 	responses 	to
I 	arrive, 	should 	be
I
	transparent 	to 	the
	operation
I
	Controller.
I
HANDSHAKING
Data flow is controlled. as required. by two simple messages:
WAIT: 	"Please hold transmissions, my buffer is filling, etc"
and 	RESUME: 	"Please resume transmissions. my buffer is ready to receive again".
Each message
must
be
transmitted
as
only
message
in its particular
System
Exclusive. Handshaking from
Controller
will
be sent to the
"all-call"
address,
while handshaking Responses
from
Controlled Device
will
be
identified by the device's own ID
number. 	(See
next section, "Device Identification".)
The four possible permutations of the WAIT and RESUME messages are:
k)

## Page 9

WW: 	we:
F0
	71-"
<all__call=7F>
<mcc> 	<WAIT>
F7
	F0
	7F
<device_ID>
	<mcr>
	<WAIT>
F7
F0
	7F
<all__ca.ll=7F>
<mcc>
	<RE$UME>
F7
	F0
	7F
<device_ID>
	<mcr>
	<RESUME>
F7
Correct operation of the WAIT handshake requires a certain minimum size for the MIDI receive buffer in an MMC
device. Refer to Appendix E, "Determination of Receive Buffer Size".
DEVICE IDENTIFICATION
Depending on context, <dev:l ce_ID> is either a destination or a source address:
Commands: 	<devi ce_ID> = DESTINATION device address
Responses: 	<devi ce_ID> = SOURCE device address
ggmmand
strings
are
most
often
addressed
to
one
device
at
time.
For
example.
to
command
two
machines
to
play, transmit:
F0 	7F 	<device_ID=machine 	1> 	<mcc> 	<PLAY> 	F7
F0
	7F
<devi
ce_ID=mach.ine
2>
	<mcc>
	<PLAY>
F7
Group device__ID's are available for Commands. The previous example could be transmitted as:
F0
	7F
<devi
ce_ID=group
>
	<mcc>
	<PLAY>
F7,
where
"group
1"
consists
machines
and
2.
The "all-call" deviceJD (7F) may also be used for commands, and is useful for system wide "broadcasts".
m strings, on the other hand, are always identified with a single device only.
The
requirements
(a)
that
Controller
be
able to recognize
device_ID
as
source.
and
(b)
that
Controlled
Device
be prepared-to recognize Group device_ID's, are unique to MIDI Machine Control, not being found in other
Universal System Exclusive implementations.
Before
fully
interpreting
<devi
ce_ID>
byte, parsing
routines
will
need
to
look
at
<sub-ID#1
>,
which
follows <devi ce_ID>, in order to first determine that the Sysex contains Machine Control messages.
A
typical
system
will
consist
Controller
attached
to
one
or
more
Controlled
Devices.
Responses
from
multiple
Controlled Devices
will
have to be
merged
at some
point, preferably
within
Controller itself.
using
multiple
MIDI IN‘s. 	.
An
external
MIDI
merging device
is
likely
to
work satisfactorily
in most
cases,
but
delays
in
activation and
delivery
WAIT
handshake may
cause some
problems where
MIDI
bandwidth
is
heavily utilized.
(See
also
Appendix E "Determination of Receive Buffer Size".)
Although not recommended.
it
is
possible that commands
from
more
than one
Controller could
be merged and
distributed to
multiple Controlled Devices,
with
device responses merged and fed back to the more titan one
Controllers. 	As
all
Controllers would
be
receiving all
responses
from all Controlled
Devices,
it
is
important that
each
Controller
be
prepared to receive device
responses
which
were
in fact requested by another Controller.
Reliable error handling may have
to
be
sacrificed when
multiple Controllers
are connected in this way. Some
method should
be
provided
so
that
error detection may be
disabled at each
Controller,
assuming that error detection
has been
implemented in
first
place. Refer to the
COMMAND
ERROR Information Field description
for error
handling details.

## Page 10

COMMANDS
Commands
are
messages
from
Controller
to
Controlled
Device, or
to
group
Controlled
Devices. Each
command has a command code between 01 and 7 7 hex. and may be followed by one or more data bytes.
(Command
0 0
is
reserved
for
extensions,
and
thru
71-"
are
reserved
for
handshaking.)
RESPONSES
Responses are messages from a Controlled Device to a Controller, and are usually transmitted in reaction to a
command.
Conceptually, within the Controlled Device, data that is to be accessible to the Controller is maintained in an array
of Information Fields (or internal "registers"). For example, the device's current time code may be found in the five
byte Information Field called SELECTED TIME CODE; or the operating mode of its time code generator may be
found in the three byte Field called GENERATOR SET UP.
Each Information Field has a name between 01 and 77 hex (00 is reserved for extensions, and 78 thru 7F are
reserved
for
handshaking).
Most responses consist simply of an Information Field name followed by the data contained within that Field.
The READ and WRITE commands provide the Controller's primary access to the Controlled Device's Information
Fields (each Information Field description indicates whether it is "read only" or "read/write"able).
For example, a READ command and response, where " <SELECTED 	TIME 	CODE>" represents the hexadecimal
name of that Information Field:
Command: 	F0 	71-" 	<device_ID> 	<mcc> 	<READ> 	<count=01> 	<SELECTED 	TIME 	CODE> 	F7
Response: 	F0 	71" 	<device__ID> 	<mcr> 	<SELECTED 	TIME 	CODE) 	hr mn 	sc 	fr 	st 	F7
A
WRITEto
Information Field GENERATOR
SET UP:
Command: 	F0 	7F 	<devi ce_ID> 	<mcc>
<WRITE>
	<count=05>
<GENERATOR
	SET
UP>
	<count=03>
	<datal
>
	<da
ta2>
	<da
ta3>
F7
Response: 	none required
NOTE:
When an Information Field is listed as "read/write"able, then a READ will return data which reflects 3mg;
Mus at the device. 	This may or may not correspond to the data which was most recently written
using the WRITE command.
EXTENSION SETS
Command 00 and Response/Information Field name 00 are reserved for m extension sets:
00 	01 	First Command or Information Field at first extension level.
0 0 	0 0 	01 	First Command or Information Field at second extension level.
At
this time, no extended functions have been
defined. 	Nevertheless, to accommodate future extensions to
MIDI
Machine Control, parsing routines must always check
for extensions wherever Command or Response/Information
Field names are encountered in a data stream.

## Page 11

DATA LENGTHS
Since
multiple
Machine Control
messages
(i.e. Commands
or
Responses/Information
Fields)
may
be
transmitted
within a single Sysex, and since the set of messages must be extendable in the future, it is necessary that any
receiving device be able to determine the length of any received message, whether that message is known to the
devige
or
not.
Therefore,
large number
Commands
and
Information
Fields include
byte
count,
while
remainder,
in
order
to preserve bus bandwidth (particularly on the Response MIDI cable), have their length implied by the Hex value of
their name byte.
COMMANDS:
0 0 	_ 	reserved for extensions
01 	thru 	31“ 	0 data bytes
4 0 	thru 	7 7 	Variable data, preceded by <count> byte
78 	thru 	71" 	0 data ("handshake")
RESPONSES/INFORMATION FIELDS:
0 0 	reserved for extensions
01 	thru 	.11“ 	5 data bytes (standard time code fields)
20 	thru 	3F 	2 data bytes ("short" time code fields)
4 0 	thru 	7 7 	Variable data, preceded by <count> byte
78 	thru 	71" 	0 data ("handshake")
NOTES:
-
	l._
	-
	Extension
sets
will
follow
this
same
format. For
example,
Extended
Response
would
be
. 	followed by 2 data bytes.
2.-
	Variable
length
data is
form
<count>
	<da
ta
	. 	. 	.
	>,
Where
<count>
does
not
include
count byte
itself.
	-
3.
	It
is
possible that
variable
length
field
could
be
extended
in
length in
future
versions
this
specification,
'
but currently
defined contents
will
not
be
altered.
For
example,
<count=04>
	<aa
bb 	cc
	dd>
may
be
extended,
if
required,
to become
<count=0
7>
	<aa
	bb 	cc 	dd
xx
yy
	zz>,
but
definition
bytes <aa 	bb 	cc 	dd> will remain unchanged.
4. 	Variable length fields appear in three different formats in the text:
(i)
	pre-defined length
e.g.
<count=03>
	<pp
qq
rr>
(ii)
	length
only
partially
defined
due to
possible
use
extension
sets
for
Command
or Information
Field names within the data area e.g. <count=02+ext> 	<name1 	name2>.
(iii) 	adjustable lengths e.g. <count=vari abl e>.
SEGMENTATION
There
will
be some cases
where
message
(or
string
messages) is too long to
fit
into
maximum
length
MMC
System
Exclusive
data
field
(48 bytes). 	Such messages
may be
divided into
segments and
transmitted piece
by
piece across multiple System Exclusives. 	.
Messages received in this way will be interpreted exactly as if they had arrived all in the same sysex.
Two specific
messages
support the segmentation process:
COMMAND SEGMENT
and RESPONSE SEGMENT.
Each operates by embedding
segment
the larger
message
within its own data
field. 	In addition,
first byte
that field
contains
segment down counter, together with
flag (40hex) which marks the
"first"
segment. 	(The
receiving device
can
therefore examine the
first segment and ascertain how many more segments are to
be
transmitted.) 	The last segment will always have the down count byte set to zero.

## Page 12

For
example,
command
suing
aa
bb
cc
dd
ee
ff
h):
	jj
kk
mm(one large
command
or
a‘string
of smaller commands) would normally be transmitted as follows:
F0
	71“
<device_ID>
	<mcc>
aa
bb
cc
dd
ee
ff
gg
hh
	jj
kk
mm
F7
Exactly the same result could be achieved using segmentation:
F0
	7?
	<device__ID>
	<mcc>
	<COIWAND
SEGMENT>
	<count=05>
	42 	aa
bb
	cc
	dd
F7
F0 	7F 	<device__ID> 	<mcc> 	<COMMAND 	SEGMENT> 	<count=05> 	01 	ee 	ff 	gg 	hh 	F7
F0 	71" 	<device__ID> 	<mcc> 	<COMMAND 	SEGMENT> 	<count=04> 	00 	jj 	kk 	mm 	F7
ERROR HANDLING
A RESPONSE ERROR message is transmitted from the Controlled Device to the Controller whenever a READ or
UPDATE command requests data contained in an Information Field which is not supported by the device. In this
way, the Controller will always receive at least one response for every data request that it makes, that is, it will
always receive either the requested data or a RESPONSE ERROR message.
More details may be found in the descriptions of READ, UPDATE and RESPONSE ERROR.
Command errors. in contrast to response errors, are handled by the Information Fields COMMAND ERROR and
COMMAND
ERROR
LEVEL,
as
well
as
the handshake
message
COMMAND
ERROR RESET.
All
three
these
messages must be implemented if command error handling is to be supported.
In its default state, a Controlled Device will attempt to ignore all command errors and to continue processing only
those commands which arrive error-free. This method is most suited to "open loop" and other very basic systems.
The more
"intelligent" Controller
can,
however,
enable
either
some
or all
defined command errors by
writing
to the COMMAND ERROR LEVEL field. Whenever an "enabled" error occurs. the Controlled Device halts all
command processing and transmits the COMMAND ERROR message back to the Controller. giving details of the
error and references to the command which caused it. The Controller must then issue a COMMAND ERROR
RESET before normal operation can be resumed.
COMMAND MESSAGE SYNTAX
<command message> ::= F0 7F <destination> <mcc> <command string> F7
<destination> ::= <device
address>
l
<group
address>
l
<all
call
address>
<device address> ::=00 l 01 	l...| 7E
<group address> ::=00 l 01 	I...l 7E
<all call
address>
::= 7F
<mcc> ::= 06
[sub-ID
for
MIDI
Machine Control
Commands]
<command string> ::= <command>
l
<command string> <command>
<command> ::= <command_code_0>
I <command_code_variable> <count> <command data>
l
<handshake>
<command_code_0> ::=
l
l...l
3F
l
00<command_code_0>
<command_code_variable> ::= 40 | 41 	I...l 77 l 00<command_code_variable>
<handshake> ::= 78
l
l...l
7F
I
00<handshake>

## Page 13

3:3
3;»:
:3
it
RESPONSE MESSAGE SYNTAX
<response message> ::= F0 7F <source> <mcr> <response string> F7
<source>
::=
<device
address>
<device address> ::=00 	I 	01 	I...I 	7E
<mcr> ::=
[subaID
l
for
MIDI
Machine Control
Responses]
«espouse string> ::= <response> I <response string> <responsc>
<response> ::= <info_field_name_5> <standard 5-byte time code dala>
I <info_fleld_name_2> <2-byte short time code data>
I
<info_field_name_variable> <coum>
<info_field
data>
l
<handshake>
<info_field_name_5> ::= 01 	I 	02 	I...I 	IF I 	00<info_field_name_5>
<info_field__name_2> ::= 20 	I 	21 	I...I 	3F 	| OO<info_fieId_name_2>
<info_fieId_namc_variabIe> ::= 40 	| 	41 	I...I 	77 	I 	00<info_field_name_vafiable>
‘<h'andshak’e> ::= 78 	I 	79 	I...| 	7F l 	00<handshake>

## Page 14

3 	STANDARD SPECIFICATIONS
STANDARD TIME CODE (types {ff} and {50):
This is the "full" form of the Time Code specification, and always contains exactly 5 bytes of data.
Two forms of Time Code subframe data are defined:
The
first
(labelled {
ff
}),
contains subframe
data
exactly
as
described
in
MIDI
Cueing
specification
i.e.
fractional frames measured in 1/100 frame units.
The
second
form
(labelled
{st
})
substitutes
time
code
"status"
data
in
place
subframes.
When processing
time
code data from a tape. for example, it is often useful to know whether "real" time code data is being received, or
simply time data updated by the tape transport's tachometer pulses during a high speed wind.
Refer also to Appendix B "Time Code Status Implementation Tables" for exact usage of all the embedded status bits
within each MMC time code Information Field.
hr 	mn 	sc 	fr 	{ff/st}
hr: Hours and type: 0 	ct 	hhhhh
tt = time type:
00 = 24 frame
01 = 25 frame
1 0 = 30 drop frame
11 = 30 frame
hhhhh = hours (0-23 decimal. encoded as 00-17 hex)
mn = Minutes: 0 	c 	mmmmmm
c = color frame flag (copied from bit in time code stream):
0 = non color frame
1 = color framed code
mmmmmm = minutes (0-59 decimal, encoded as 00-38 hex)
sci= Seconds: 0 	I: 	555555
k
=
"blank"
bit
0 = normal
1 = time code data has never been loaded into this Information Field
(i.e. since power up or an MMC RESET)
Set numeric time code value to all zeroes.
ssssss = seconds (0-59 decimal, encoded as 00-33 hex)
fr: Frames. byte 5 ident and sign: 0 	g 	i 	fffff
g= sign:
0 = positive
1 = negative (where signed time code is permitted)
i = final byte identification:
0 = subframes
l = status
fffff = frames (0-29 decimal. encoded as OO-lD hex)
If final byte = subframes (i = 0):
ff
= fractional frames:
bbbbbbb
(0-99 decimal. encoded
as
00-63 hex)

## Page 15

If final byte = status (1'. = 1):
st = code status: 0 	e 	v 	d n 	xxx
e = estimated code flag:
0 = normal time code
1 = tach or control track updated code
v= invalid code (ignore if e=I):
0 = this time code number has passed internal validation tests
1 = validity of this time code number cannot be confirmed
d = video field 1 identification:
0 = no field information in this frame
1 = first frame in 4 or 8 field video sequence
:2 = "no time code" flag:
0 = time code has been detected at the time code reader input
1 = time code has me; been read since power up or an MMC RESET
xxx
=
reserved
- must
be
set
to
000.
STANDARD SHORT TIME CODE:
This
shortened
format
may
be
used
for
repetitive
response
modes
(see the
UPDATE
command),
where
Controller
instructs
Controlled
Device
to
transmit
data
from
certain
Information Field
whenever
it
changes.
The
majority
such
transmissions
will
contain
some
form
time
code,
and
most
these
will
involve
change
in
only
frames
portion
when compared
with
previous transmission.
In other words, once
an
initial
time code
value
has
been
transmitted,
it
is subsequently
only
necessary
to transmit Hours,
Minutes
and
Seconds data
when
change
takes
place in
any
them (i.e.
once
every
second).
The
"Short"
Time
Code
format
therefore contains
only
Frames and Subframes data, and is identical to the frames and subframes portion of the "full" format:
fr
	{Stlff}
The major advantage of the "short" form is the preservation of response line bandwidth.
NOTES:
1.
	For every
byte time
code
Information Field
name
in
the range
Olh-IFh,
there
is
corresponding
byte
"short" time
code
field with
its
name
in
the range
21h-‘3I-‘h.
For example, 06h
is
GENERATOR
TIME
CODE and 26h is Short GENERATOR TIME CODE.
2. 	The "short" forms are not individually described in the "Detailed Response and Information Field
Descriptions"
section.
The format
each.
however. may easily
be
deduced
from
description
corresponding "standard" form.
STANDARD USER BITS:
til
	:12
	U3
	U4 	US
	U6 	U7
	u8 	u9
ul
= Binary Group
I: 	0000aaaa
u2
= Binary Group 2:
	0000bbbb
u3
= Binary Group
3:
	0000cccc
u4
=
Binary Group 4:
	0000dddd
u5 =
Binary Group
5:
	0000eeee
u6=
Binary Group 6:
	0000ffff
u
= Binary Group 7:
	0000gggg

## Page 16

NOTES:
as = Binary Group 8: 	0000hhhh
u9=Flagsz 	00000tji
t = "secondary" time code bit
0 = standard userbits
1 = user bits contain "secondary" time code
j
=
Binary
Group
Flag
(SMPTE
time
code
bit
59;
EBU
bit
43)
i
=
Binary
Group
Flag
(SMP'IE
time
code
bit
43;
EBU
bit
27)
Refer to
appropriate
SMPTE
and/or
EBU
standards
for definition
"Binary
Groups"
and
"Binary Group Flags".
2.
	Time
code
may
be
occasionally
encoded
in
userbits
(t
=
I).
If
so,
time
code
will
be
in
BCD form
specified by SNEPTE/EBU for normal time code (complete with the various SMP'IE/EBU status flags as
required), and loaded as follows:
aaaa = Frames units
bbbb = Frames tens
cccc = Seconds units
dddd = Seconds tens
eeee = Minutes units
ffff = Minutes tens
9999 = Hours units
hhhh
=
Hours
tens
	_
3. 	If the Binary Group nibbles 1-8 are used to carry 8-bit information, they should be reassembled as four
8-bit characters in the order hhhhgggg 	ffffeeee 	ddddcccc 	bbbbaaaa.
4. 	Display order for the userbits digits will also be hhhhgggg 	ffffeeee 	ddddcccc 	bbbbaaaa.
DROP FRAME NOTES
1. 	When writing to time code Information Fields, the drop-frame or non-drop-frame status of the data being
written may be overridden by the status of the SELECTED TIME CODE.
For example, if a tape recorder is reading drop-frame code from its tape, it will show drop-frame status in
the SELECTED TIME CODE field. If a Controller subsequently loads the GPO/LOCATE POINT with a
NON-drop—frame number and executes a LOCATE to GPO, then the GPO/LOCATE POINT will be
interpreted as a drop-frame number, like SELECTED TIME CODE, with no attempt being made to
perform any transformations.
2.
	Furthermore,
if
the above
GPO/LOCATE
POINT
number had
in
fact
been
loaded
with
non-existent dropfrarne number (e.g. 00:22:00:00), then the next higher valid number would have been used (in this case,
00:22:00:02).
3. 	Calculation of m, or simply the mathematical difference between two time codes, can cause confusion
when one or both of the numbers is drop-frame.
For the purposes of this specification, 	-fr 	n 	m 	r 	h 	l 	fir 	nv rt 	n n- 	-f 	m
mtgrg
fset
calculations
are
performed. Results
Offset calculation
will
then be expressed
as
nondrop-frame quantities.
To convert from drop-frame
to non-drop-frame, subuact the
number
frames that have been "dropped"
since the reference point
00200200200.
For example. to convert the drop-frame number
to non-
'drop-frame, subtract 40 frames, giving
00221258222.
The number 40 is produced by the fact that 2 frames
were "dropped" at each of the minute marks 01 thru 09, 11 thru 19, 21 and 22.

## Page 17

STANDARD SPEEDr
This three byte format is used by the VARIABLE PLAY. DEFERRED VARIABLE PLAY, RECORD STROBE
VARIABLE, SEARCH and SHUTTLE Commands, as well as by the VELOCITY TALLY Information Field.
It implies no specific resolution for speed control or velocity measurement internal to any Controlled Device.
sh 	sm 	.51
sh = Nominal Integer pan of speed value: 0 	g 	555 	ppp
g
= sign
(1 =
reverse)
=
shift
left
count
(see
below)
ppp = most signific bits of integer multiple of play-speed
sm = MSB of nominal fractional part of speed value: 0 	qqqqqqq
= LSB
nominal fractional part
speed
value:
rrrrrrr
Speed values per shift left count:
BINARY
REPRESENTATION 	USEABLE
	RANGES
	(DECIMAL)
Integer 	multiple 	Fractional 	part 	Integer 	Fractional
E5; 	of
play-speed
play-speed
	range
	resolution
0 0
	ppp
	.
	qqqqqqqrrrrrrr
	o
-7
/
1 6
8 4
	pppq
	.
	qqqqqqrrrrrrr
	0-15
	1/8192
	pppqq
	-
	qqqqqrrrrrrr
	0—31
	1/4096
	pppqqq
	.
	qqqqrrrrrrr
	0-63
	1/2048
	pppqqqq
	.
	qqqrrrrrrr
	0—127"
	1/1024-
	pppqqqqq
	.
	qqrrrrrrr
	0—255
	1/512
	pppqqqqqq
	.
	qrrrrrrr
-
0-511
	1/256
	pppqqqqqqq
	.
	rrrrrrr
	‘
	0-1023
	1/128
STANDARD
TRACK BITMAP:
This
variable length
field
contains
single
bit
for
each
audio
or
video *uack"
supported
by
Controlled Device.
A bit
value
indicates
an
active
state,
while
0 indicates
an
inactive
state.
All
unused
or
reserved
bits must
be
reset to O. The Standard Track Bitmap may be logically extended to 317 tracks before sysex segmentation” is
required.
The Standard Track Bitmap is currently used by the Information Fields TRACK RECORD READY, TRACK
RECORD STATUS. TRACK SYNC MONITOR, TRACK INPUT MONITOR and TRACK MUTE. 	.
mm
as a
Response. the
Controlled Device
need
transmit only
as
many bytes
the Standard
Track Bitmap
as
are required.
Any
track not included in
Response u'ansmission
will
be assumed
to
be
inactive, with
its
bit
reset to
zero. As
the Standard Track Bitmap
is
always preceded
by
byte count,
count
00 may
be used
if
all
tracks
are
inactive.
flhgn
written to by
WRITE
command, uacks not included in
transmission
will
have
their individual bits
reset
to zero (u-ack inactive). 	A Byte count of 00 may be used if all tracks are to be reset.
Specific bits within
the Standard Track Bitmap may also be
modified by using the
MASKED WRITE command.
1]

## Page 18

r0 	r1 	1'2 	.
r0 	Bitmap 0: 0 	gfedcba
=
Video
I: = reserved (must be zero)
c = Time Code Track (dedicated)
d = Aux Track A
(e.g. analog guide tiacks. etc.)
e = Aux Track B 	'
f = Track 1 	(stereo left/ monaural)
-
	g
= Track
(stereo
right)
r1
	Bitmap
1:
nmlkjih
h = Track 3
i = Track 4
j
=
Track
k = Track 6
1 = Track 7
m:
Track
n
=
Track
r2
	Bitmap
2:
Tracks
10-16
:3
	Bitmap
3:
Tracks
17-23
:4 	Bitmap 4: Tracks 24-30
r5 	Bitmap 5: Tracks 31-37
:6 	Bitmap 6: Tracks 38-44
r7 	Bitmap 7: Tracks 45-51
1-8
	Bitmap
8:
Tracks
52-58
r9 	Bitmap 9: Tracks 59-65
etc
MOTION CONTROL STATES AND PROCESSES:
MQTIQN CQNTRQL STA I E {M525 1;
Basic transpon
commands such
as
PLAY,
STOP,
FAST FORWARD
and
REWIND
will
each
move the
Controlled
Device to
new
and
mutually exclusive motion
state. These commands are
therefore
collectively labelled
as
"Motion Control
State" commands. 	Each
MCS command
causes a
transition into
new transport
state and cancels
the previous Motion Control State.
Receipt
directly
issued MCS command
will
also
automatically terminate
an
active Motion Control
Process
(MCP). as described below (exceptions are the DEFERRED PLAY and DEFERRED VARIABLE PLAY
commands when received during a LOCATE MCP).
MCS commands may be either:
(i) 	directly issued by this command set.
or 	(ii) 	indirectly
issued as steps in
execution
Motion Control Process (see
below),
or
	(iii)
	initiated elsewhere, for example, at the control panel
the device itself.

## Page 19

Motion Control State activity is tallied in the "Most recently activated Motion Control State" (ms) byte of the
MOTION CONTROL TALLY Information Field. The device's success in achieving the requested state is tallied'1n
the same field, in the "Status and success levels" (55) byte.
All Motion Control State commands are marked "(MCS)" in the Index List and»"(MCS command)"in the command
descriptions.
Currently defined MCS commands are:
STOP
PAUSE
PLAY
DEFERRED PLAY
VARIABLE PLAY
DEFERRED VARIABLE PLAY
FAST FORWARD
REWIND
SEARCH
SHUTTLE
STEP
FJECT
MTIN 	LPR
Motion Control Processes (such as LOCATE and CHASE) are overriding control commands that cause the
Controlled Device to automatically issue it's own Motion Control State commands to achieve the desired result.
Motion Control Processes are mutually exclusive and are commanded by MCP commands.
Receipt of an MCP command will override any previously received MCS command.
MCP commands may be either:
(i) 	directly issued by this command set,
or 	(ii) 	initiated elsewhere, for example, at the control panel of the device itself.
Motion Control Process activities are tallied in the "Most recently activated Motion Control Process" (mp) byte of
the MOTION CONTROL TALLY Information Field. The device's success in executing the requested process is
tallied in the same field, in the "Status and success levels" (55) byte.
In addition, during
Motion
Control
Process,
each
automatically activated
Motion Control
State
will
be registered
in the MOTION CONTROL TALLY Information Field in the manner described in the previous section.
All Motion Control Process commands are marked "(MCP)" in the Index List and "(MCP command)" in the
command descriptions.
Currently defined MCP commands are:
LOCATE
CHASE

## Page 20

4 	INDEX LIST
MESSAGE TYPES
Each Command or Response/Information Field in the Index List has been assigned a Type designation as follows:
Comm 	Support for communications e.g. WAIT, RESUME, GROUP.
Ctrl 	Directly affects operation of the "transport" e.g. PLAY, STOP, TRACK RECORD READY, etc.
Evnt 	Timed event triggering.
Gen 	Time code generator interface.
I/O 	READ and WRITE Commands, error handling, etc.
Sync 	, 	Used for time code synchronizing. Includes "master" time code fields.
Math 	Time code mathematics.
MTC 	MIDI Time Code input/output controls.
Proc 	Definition and execution of PROCEDURES (pre-defined command sequences).
Time 	Information Fields directly related to the device's own time code stream.
ABBREVIATIONS USED
ATR 	Audio Tape Recorder
{ff} 	Time code contains "subframes" (see Section 3. Standard Specifications).
MCP 	Motion Control Process *
MCS 	Motion Control State "'
MMC 	MIDI Machine Control
r 	Information Field is READ only.
RW 	Information Field is READ/WRITE capable.
{ st} 	Time code contains “status" (see Section 3, Standard Specifications).
V’I'R 	Video Tape Recorder
*
	Each
motion control
command in
Index
List
is tagged
"(MCS)"
or
"(MCP)",
which
indicates whether
it
'
will
initiate
Motion Control
State
or
Motion
flgnm!
Prmgss, respectively. Refer
to
Section
3,
"Standard Specifications". for an explanation of these terms.
GUIDELINE MINIMUM SETS
MIDI Machine Control does not specify an absolute minimum set of Commands and Responses/Information Fields
which must be implemented in any device.
However,
as
an
aid to understanding which commands
and responses
may
be
important
in
different
situations,
four
Guideline Minimum Sets of Commands and Responses/Infonnation Fields have been created:
#1 	Simple transport: no time code reader; "open loop" communications only.
#2
	Basic transport; no
time
code reader; "closed loop" communications possible.
#3 	Advanced transport; time
code reader
included; "closed
loop" communications; event
triggering functions;
track by track record control.
#4 	Basic synchronizer; "closed loop" communications.
Guideline Minimum
Sets are in no way intended to restrict
the scope
operations
any device. They are
offered
only to help engineers trying to learn about MMC and perhaps looking to implement it for the first time.
Assignment of any particular Command or Response/Information Field to a Guideline Minimum Set may be found
in the far right hand column of
the Index
List

## Page 21

Particular
note
should
be
taken
SIGNATURE
Information
Field.
This
field
contains
complete
bit
map
ALL Commands and Response/Infannation Fields supported by a Controlled Device. A Controller may. by
interrogating the device's SIGNATURE, tailor its communications to exactly match the functions supported.
Implementation
this
SIGNATURE
field
is therefore
highly
recommended.
AW
should also be published by its manufacturer, using the format outlinfl in the SIGNA I L1R_E Information Field
COMMANDS
Number
of data 	Guideline
Hex 	Comm_a_nd 	Tyne 	bvtes 	Min. Sets
00 	reserved for extensions 	1234
01 	STOP (MCS) 	Ctrl 	- 	1 234
02 	PLAY (MCS) 	Ctrl 	- 	—234
03 	DEFERRED PLAY (MCS) 	Ctrl 	- 	1234
04 	FAST FORWARD (MCS) 	Ctrl 	- 	1234
05 	' 	REWIND (MCS) 	Ctrl 	- 	, 	1234
06 	RECORD STROBE 	Ctrl 	- 	1 234
07 	RECORD EXIT 	Ctrl 	- 	1 234
	RECORD PAUSE
	Ctrl
	-
	—---
09 	PAUSE (MCS) 	Ctrl 	- 	---—
0A 	EJECT (MCS) 	Ctrl 	- 	----
OB 	, 	. 	CHASE (MCP) 	' 	Sync 	- 	-—-4
0C 	COMMAND ERROR RESET 	1/0 	- 	—234
0D 	‘ 	MMC RESET 	Ctrl 	- 	1 234
’ 	40 	WRITE 	. 	1/0 	n 	.1234
4] 	. -- . 	MASKED WRITE 	1/0 	in 	--3-
42 	READ 	I/O 	n 	-234
43 	UPDATE 	[/0 	n 	-234
	LOCATE
(MCP)
	Ctrl
	'
n
45 	' 	VARIABLE PLAY (MCS) 	Ctrl 	3 	-234
46 	SEARCH (MCS) 	Ctrl 	3 	--34
	SHUTTLE (MCS)
	Ctrl
	----
48 	STEP (MCS) 	Ctrl 	l 	----
49 	ASSIGN SYSTEM MASTER 	Sync 	I 	----
4A 	GENERATOR COMMAND 	Gen 	1 	----
43 	MIDI TIME CODE COMMAND 	MTC 	1 	----
4C
	MOVE
	,
	'
	Math
4D 	ADD 	Math 	3 	-234
4E 	SUBT'RACT 	Math
	-234
4F 	DROP
FRAME ADJUST 	Math
	--34
‘50 	PROCEDURE 	Proc 	n 	--34
	EVENT
	‘
	Evnt
	n
	--34
52 	GROUP 	Comm 	n 	-234
53 	COMMAND SEGMENT 	Comm 	n 	-234
54 	DEFERRED VARIABLE PLAY (MCS) 	Ctrl 	3 	-234
	RECORD STROBE
VARIABLE 	Ctrl
	----
7C
	WAIT 	Comm 	-
	'
	-234
7F 	RESUME 	Comm
	- 	—234

## Page 22

RESPONSES AND INFORMATION FIELDS
Number
of data 	Read] 	Guideline
Hg;
	Resmnseflnfgnngtion Field
Name
	Tvoe
	bfles
	Wrigg
	Min,
59g:
	reserved
for
extensions
	--—-
01 	SELECTED TIME CODE { st } 	Time 	5 	RW 	1234
	SELECTED MASTER
CODE
{st}
	Sync
	r
	---4
	REQUESTED
OFFSET
{ff}
	Sync
	RW
	———4
04 	ACTUAL OFFSET I ff} 	Sync 	5 	r 	---4
	LOCK
DEVIATION
{
ff}
	_
	Sync
	r
	—-—4
	GENERATOR
TIME
CODE
{st}
	Gen
	RW
	—-—-
	MIDI
TIME
CODE
INPUT
(st
}
	MTC
	r
	----
08 	GPO / LOCATE POINT {ff} 	Math 	5 	RW 	1234
09 	GP] {ff} 	Math 	5 	RW 	-234
0A 	' 	6P2 {ff} 	5 	Math 	5 	RW 	-234
OB 	GP3 { ff} 	Math 	5 	RW 	-234
0C
	GP4
{ff}
	Math
	RW
	-—--
0D
	GP5
{ff}
	Math
	RW
	----
0E 	GP6
{ff}
	Math
	RW
	---—
0F
	GP7
{ff}
	Math
	RW
	—---
21 thru 2F 	SHORT forms of 01 thru 0F 	2 	r 	-234
40 	SIGNATURE 	I/O 	' 	n 	r 	4234
	UPDATE RATE
	1/0
	RW
	-234
42 	RESPONSE ERROR 	I/O 	n 	- 	—234
	COMMAND
ERROR
	I/O
	n
	r
	-234
	COMMAND
ERROR
LEVEL 	I/O
	RW
	-234
	TIME
STANDARD
	Time
	RW
	-234
46 	SELECTED TIME CODE SOURCE 	Time 	1 	RW 	----
47 	SELECTED TIME CODE USERBITS 	Time 	9 	r 	----
48 	MOTION CONTROL TALLY 	Ctr] 	3 	r 	-234
49 	VELOCITY TALLY 	Ctr] 	3 	r 	---—
4A
	STOP
MODE 	Ctr]
	RW
	—---
4B 	FAST MODE 	Ctr] 	1 	RW 	----
4C
	RECORD MODE 	Ctr]
	RW
	—234
4D 	RECORD STATUS 	Ctr]
	,
	l
	r
	—234
4B
	TRACK
RECORD STATUS 	Ctr]
	n
	r 	—-3-
4F
	TRACK
RECORD
READY
	Ctr]
	n
	RW
	--3-
50 	GLOBAL MONITOR 	Ctr] 	1 	RW 	--3-
	RECORD MONITOR 	Ctr]
	RW
	—---
	TRACK
SYNC
MONITOR
	.
	Cu']
	n
	RW
	----
	TRACK INPUT MONTTOR 	Ctr]
	n
	RW
	---—
	STEP
LENGTH 	Ctr]
	RW
	----
55 	PLAY SPEED REFERENCE 	Ctr] 	' 	1 	RW 	-23-
	FIXED
SPEED
	Ctrl
	RW
	----
	LIFTER DEFEAT 	Cu]
	RW
	—---
58 	CONTROL DISABLE 	Ctr] 	] 	RW 	---4
59 	RESOLVED PLAY MODE 	Sync 	1 	RW 	-—-4
5A 	CHASE MODE 	Sync 	1 	RW 	---4
5B 	GENERATOR COMMAND TALLY
	Gen 	2
	r
	----
5C 	GENERATOR SET UP 	Gen
	RW 	-——-
5D 	GENERATOR USERBITS 	Gen 	9 	RW
	----
l6

## Page 23

5E
5F
7C
MIDI TIME CODE COMMAND TALLY
MIDI TIME CODE SET UP
PROCEDURE RESPONSE
EVENT
RESPONSE
TRACK MUTE
VITC INSERT ENABLE
RESPONSE
SEGMENT
FAILURE
WAIT
RESUME
MTC
MTC
Proc
Evnt
Cu'l
Comm
Ctrl
==U5=3=IHN
Comm
Comm
	-
COMMANDS
AND
INFORMATION
FIELDS ACCORDING TO
TYPE
W
Commands:
0C 	COMMAND ERROR RESET
	WRITE
	MASKED WRITE
	READ
43 	UPDATE
Information Fields:
40 	SIGNATURE
41 	UPDATE RATE
42 	RESPONSE ERROR
43 	COMMAND ERROR
	COMMAND
ERROR
LEVEL
'gu.
WEED
Commands:
01 	STOP (MCS)
02 	PLAY (MCS)
03 	. 	DEFERRED PLAY (MCS)
04 	FAST FORWARD (MCS)
05 	REm (MCS)
06 	RECORD STROBE
07 	RECORD EXIT
08 	RECORD PAUSE
09 	PAUSE (MCS)
0A 	EJECT (MCS)
0D 	MMC RESET
	LOCATE (MCP)
	VARIABLE PLAY
(MCS)
46 	SEARCH (MCS)
	SHUTTLE (MCS)
48 	STEP
(MCS)
54 	DEFERRED VARIABLE PLAY (MCS)
55 	RECORD STROBE VARIABLE
InformaLion Fields:
	MOTION CONTROL TALLY
49 	VELOCITY TALLY

## Page 24

4A
4B
4C
4D
4E
4F
5 l
STOP MODE
FAST MODE
RECORD MODE
RECORD STATUS
TRACK RECORD STATUS
TRACK RECORD READY
GLOBAL MONITOR
RECORD
MONITOR
TRACK SYNC MONITOR
TRACK INPUT MONITOR
STEP LENGTH
PLAY SPEED REFERENCE
FIXED SPEED
LIFTER DEFEAT
CONTROL DISABLE
TRACK MUTE
FAILURE
LQQQ‘ IZJME QzflE 	(1i 	9)
Information
Fields:
SELECTED
TIME
CODE (
st}
Short
SELECTED
TIME
CODE
{
st}
TIME STANDARD
SELECTED TIME CODE SOURCE
SELECTED TIME CODE USERBITS
HR
	NIZATI 	N
Commands:
OB
CHASE (MCP)
ASSIGN SYSTEM MASTER
Information Fields:
5A
W
Command:
4A
SELECTED MASTER CODE {st}
REQUESTED OFFSET {ff}
ACTUAL
OFFSET {
ff
}
LOCK DEVIATION {ff}
Short
SELECTED MASTER CODE
{st}
Short REQUESTED OFFSET { ff)
Short
ACTUAL
OFFSET
{ff}
Short LOCK DEVIATION {ff}
RESOLVED
PLAY
MODE
CHASE MODE
GENERATOR COMMAND
Information Fields:
5B
5C
5D
DE
GENERATOR TIME
CODE
(st)
Short GENERATOR TIME
CODE
(5:)
GENERATOR COMMAND TALLY
GENERATOR SET UP
GENERATOR USERBITS
VITC INSERT ENABLE

## Page 25

Command:
43 	MIDI TIME CODE COMMAND
Information Fields:
	MIDI TIME
CODE
INPUT
{
st)
	Short
MIDI
TIME
CODE
INPUT
(
st}
5E 	MIDI TIME CODE COMMAND TALLY
5F 	MIDI TIME CODE SET U?
W
Commands:
4C 	MOVE
4D 	ADD
4E 	SUBTRACT
4F
	DROP
FRAME
ADJUST
Information
Fields:
	GPO
/
LOCATE POINT
(ff)
	GP]
{
ff}
0A
	GPZ
{
ff}
OB
	GP3
{
ff}
0C 	GP4 	{ ff )
OD 	GPS
{
ff)
0E 	GP6 	{ ff }
OF
	GP7
{
ff}
	Short
GPO
/
LOCATE POINT
{
ff}
29 	Short GPl {ff}
2A 	Short GP2 {ff}
23 	Short GP3 {ff}
2C: 	Short GP4 (ff)
2D
	Short
GPS
(ff)
2E 	Short GP6
{ff}
2F 	Short GP7
{ff}
W
Command:
50 	PROCEDURE
Information Field:
60 	PROCEDURE RESPONSE
EVEN] 	[BIQQER§ 	(Evnfl
Command:
5]
	EVENT
Information Field:
61 	EVENT RESPONSE
M
	N 	mm
Commands:
52 	GROUP
53 	COMMAND SEGMENT
7C 	WAIT
7F 	RESUME
Information Fields:
64 	RESPONSE SEGMENT
7C
	WAIT
7F 	RESUME
l9

## Page 26

5 	DETAILED COMMAND DESCRIPTIONS
Messages from the CONTROLLER to the CONTROLLED DEVICE.
Reserved for extensions
STOP
(MCS
command)
Stop
as
soon
as
possible.
Output monitoring is controlled by the STOP MODE Information Field. if supported.
STOP will be cancelled by the receipt of another MCS or MCP command.
Recording [rehearsing]
tracks
W.
01 	STOP
PLAY 	(MCS command)
Enter playback mode.
PLAY will be cancelled by the receipt of another MCS or MCP'command.
02 	PLAY
NOTE“
Recording [rehearsing] tracks WW upon receipt of the
PLAY command. 	lf that action is desired. then transmit <RECORD EXIT> <PLAY>.
DEFERRED PLAY (MCS command)
Identical to the PLAY command. with the exception that if the device is currently executing a LOCATE
(MCP), then PLAY mode will not be invoked until the LOCATE is completed.
Receipt of any other MCS or MCP command will cancel DEFERRED PLAY.
When received while a LOCATE is in progress. the "MC? Success Level" field of the MOTION
CONTROL TALLY Information Field must be set to indicate "Actively locating with Deferred Play
pending" for the duration of the LOCATE.
When the LOCATE has concluded:
(i)
	An automatic
PLAY (MCS) command
will
be issued;
(ii)
	The
MOTION CONTROL
TALLY
"MCS command" byte
will
switch to
"PLAY";
(iii) 	The MOTION CONTROL TALLY "MCP command" byte will become "No MCP's currently
active", clearing both the LOCATE and Deferred Play indications.
If the device is not executing or does not support the LOCATE command, then it should immediately enter
playback mode.
03 	DEFERRED PLAY

## Page 27

NOTES: 	_
1. 	If a device is to support only a sing]; Play command, then DEFERRED PLAY is recommended.
In the open loop case, it will not be possible for a Controller to simulate the operation of this
command, as no "locate complete" status will be available. On the other hand, an immediate
PLAY may be re-created by issuing STOP followed by DEFERRED PLAY.
2- 	Recording [rehearsing] tracks WW Upon receipt of the
DEFERRED PLAY command. 	If that action is desired, then transmit <RECORD EXIT>
<DEFERRED
PLAY>.
FAST FORWARD 	(MCS command)
Move forward at maximum possible speed.
Output monitoring is controlled by the FAST MODE Information Field, if supported.
FAST FORWARD will be cancelled by the receipt of another MCS or MCP command.
Recording
[rehearsing]
tracks
exit
frgm
r3931
[rem-arse].
0 4 	FAST FORWARD
REWIND 	(MCS command)
M0ve in reverse direction at maximum possible speed.
Output monitoring is controlled by the FAST MODE Information Field, if supported.
REWIND will be cancelled by the receipt of another MCS or MCP command.
Recording [rehearsing] tracks W.
05 	REWIND
RECORD STROBE
Switches
Controlled Device into
or out
record
or
rehearse.
according to
setting
RECORD
MODE Information Field. 	RECORD STROBE will be honored under two conditions only:
NDITI 	N
I'
Controlled Device already Playing:
If the Controlled Device is already playing 	' 	" 	r 	n I 	IV 	I 	n 	n 	l 	"
MQTIQN QQNTRQL
TALLY
Infgnnatjgn Figld
is
PLAY gr VARIABLE PLAY),
then
RECORD
STROBE
will
cause
record [rehearse] entry on
all
tracks which
are
presently in
record ready state, and
cause record [rehearse]
exit
on any cun'ently recording [rehearsing] tracks
which
are
no longer record
ready. 	*1‘8‘9

## Page 28

mm
Controlled
Device
Stopped:
If, when RECORD STROBE is received, the Controlled Device is completely stopped as a result of an
explicit STOP or PAUSE command 	i 	i 	"M 	M 	n 	n 	l 	m
MQTIQN CONTROL TALLY Information Field is STQP gr PA USE; Iii] the "MCS success level" §t§
"ggmplgtgly stopmd"; and liiil the "Most recently activated Motion Control Process" byte is gt to "No
W then:
(i)
(ii)
NOTES:
"' l.
*3.
An automatic PLAY (MCS) command will be issued; ‘3‘4
At
an
appropriate
point
in
start up
phase
device,
record
[rehearse]
entry
will
occur
on
all
tracks which are presently in a record ready state. ’15
0 6 	RECORD STROBE
Tracks are switched in and out of the record ready state using the TRACK RECORD READY
Information Field.
It is recommended that, for new Controlled Device designs based on MMC, no recording
[rehearsing] should take place following a RECORD STROBE command unless at least one track
is in a record ready state.
Among existing non-MMC devices, however, it is quite common that, given that record [rehearse]
has been enabled (for example by setting the appropriate value in the RECORD MODE
Information Field), recording [rehearsing] will be initiated even if no tracks are in a record ready
state when the command to record [rehearse] is received. Such operation remains permissible
under MMC,- provided that the resultant status is correctly indicated by including the "No Tracks
Active" bit in the RECORD STATUS lnfonnation Field.
' Under CONDITION 2, an automatic PLAY (MCS) command will be issued only under the $1112?
r
PA
	n
' i
n
	ifr
	.
At
no other
time
does
RECORD STROBE
have
any
implications
, regarding play mode or playing speed.
*4.
*5.
*8.
I"9.
Also
under
CONDITION
2, the
automatic
PLAY
(MCS)
command
will
be issued
whether
or not
any tracks
are
in
record ready
state. and
whether or not
RECORD MODE
has
been
specified.
The existence
"record-pause"
condition
will
not affect
operation
RECORD STROBE.
(Refer to the RECORD PAUSE and PAUSE command descriptions.)
Devices which support and have their RECORD MODE set to "VTR:Insert" or "VTR:Assemble",
are expected to produce clean and correctly timed transitions into record [rehearse] under both
Conditions 1 and 2 outlined above. 	When starting from STOP or PAUSE mode (Condition 2). it
will
usually
be necessary to
wait until
device's start up phase
has been
completed
before
recording [rehearsing] is attempted.
A
Controlled Device
will
ignore
any
RECORD STROBE command which
is
received
while
it
is
neither already in play mode nor completely stopped as described.
Under
CONDITION
1,
"Controlled Device already
Playing",
it
is
not
necessary
for
PLAY or
VARIABLE PLAY
command to have
been
"successful" before RECORD STROBE is accepted.
If,
however.
the desired
play motion
has
not
yet
been
achieved when RECORD STROBE is
received,
it
may
be necessary
for
device to defer
the onset
recording until
an
appropriate
point in its start up phase.
Note also that, under
CONDITION
1,
recording is not inhibited by
Motion Control
Process
activity.

## Page 29

'.
Viv,"
,,
07 	RECORD EXIT
Causes a record exit on all currently recording tracks.
07 	_ 	RECORD EXIT
RECORD PAUSE
Causes the Controlled Device to enter "record-pause" mode provided that a PAUSE mode is already in
effect
(i.e. that the
most
recent
Motion
Control
State is
PAUSE).
*4
No actual recording is initiated by RECORD PAUSE. but the device is placed in a state from which a
transition into record mode can be made quickly and smoothly.
All "record ready" track Outputs are switched to monitor their respective Inputs.
A
Controlled Device which
supp_orts
RECORD PAUSE
command must
fully
implement
"record-
" 	ri 	hr 	n 	PA 	E 	mmni
11 	ll 	vi 	whih 	n 	i 	mmnm 	nvern 	" 	r-
Once in "record-pause", the effect of further commands is as follows:
PAUSE: 	- 	No change
RECORD PAUSE: 	No change
RECORD EXIT: 	Cancellation of “record-pause". return to PAUSE
‘ 	RECORD STROBE: 	Smooth resumption of Play and Record. 	*6
RECORD STROBE VARIABLE: 	Smooth resumption of Variable Speed Play and
Record. *6
Any other MCS or MCP command: 	Exit "record-pause" mode prior to further action. *7
';§:§cord-pause" is tallied in the RECORD STATUS Information Field.
08 	RECORD PAUSE
NOTES: 	-
1. 	RECORD PAUSE is the only way to enter "record-pause" from a non-record PAUSE without
initiating motion.
2. 	RECORD PAUSE in itself will not produce a PAUSE.
3. 	The command sequence 	<PAUSE> 	<RE'CORD 	PA USE> 	will always produce a paused state,
and. if implemented, the "record-pause" condition.
*4. 	It is not necessary for the PAUSE command to have been "successful" in order for a RECORD
PAUSE command to be accepted. Therefore, after receiving a 	<PA USE» 	<RECORD 	PAUSE»
command sequence, it may be necessary for the Controlled Device to defer the onset of "recordpause" until all motion has ceased following the PAUSE command. RECORD PAUSE must notcause any actual recording to take place.
5. 	RECORD PAUSE will be ignored by a Controlled Device if its Motion Control State is not
already "PAUSE".
*6. 	Refer also to the RECORD STROBE and RECORD STROBE VARIABLE command definitions.
*7. 	This category includes PLAY. DEFERRED PLAY, VARIABLE PLAY and DEFERRED
VARIABLE PLAY, none of which will cause recording to take place following a RECORD
PAUSE.
8. 	No "rehearse-pause" mode is currently supponed.

## Page 30

0A
OB
PAUSE 	(MCS command)
Stop as soon as possible. 	_
V'I'R's and other visual devices stop "with picture".
The transport mechanism should be left in a state such that start up time will be minimized.
PAUSE will be cancelled by the receipt of another MCS or MCP command.
Recording tracks exit from record, with one exception: if (and only if) a device supports the RECORD
PAUSE command, and if the PAUSE command is received while recording is taking place, then the
"record-pause"
condition
will
be
invoked.
(Please
refer
to
RECORD PAUSE command
description).
Rehearsing tracks always exit from rehearse.
09 	PAUSE
NOTES:
' l. 	Repetition of the PAUSE command will 99; produce the pause/play toggling action found on
some cassette type VTR's.
2. 	To prevent head clogging, VTR's may switch to a "without picture" state after a pre-determined
time-out period. A subsequent PAUSE command will cause a return of the picture.
3. 	The PAUSE command implies an automatic "standby on" or "ready" command for devices which
have this capability.
4.
	Devices
which
do
not
normally
support
separate pause
function may
still
implement
PAUSE
Command by substituting a STOP. However, MOTION CONTROL TALLY must indicate
PAUSE.
EJECT 	(MCS command)
Removeable media devices eject media (cassette or disk etc.) from the transport mechanism.
When used as a tally'm the MOTION CONTROL TALLY Information Field, EJECI' indicates a lack of
media which'is irrecoverable without operator intervention.
Recording [rehearsing] tracks 9i from reggrg “£t
0A 	EJECT
NOTE:
EIECT
may
be used
as a
tally
by devices
which do not
normally support EJECT
as a
command.
For example,
reel-to-reel device should show
an
EJECT
tally
when its
tape has
run
off
end
the reel. ,
CHASE 	(MCP command)
Causes the Controlled Device to attempt to follow, establish and maintain synchronism with the
SELECTED MASTER CODE. When
SELECTED MASTER CODE is detected to be
in "play" mode,
Controlled Device should play
and attempt to synchronize.
At
other times, the
Controlled Device
should simply attempt to
position itself
so that, should the
SELECTED MASTER CODE enter "play"
mode. synchronism can be
achieved in
minimum possible time.

## Page 31

.1
	0C
:OD
Synchronism is to be achieved between the Controlled Device's SELECTED TIME CODE and the
SELECTED MASTER CODE with an offset specified by the REQUESTED OFFSET Information Field
using the formula:
REQUESTED OFFSET = SELECTED TIME CODE - SELECTED MASTER CODE.
If,
when
CHASE
command
is
received,
"blank"
bit
in
REQUESTED OFFSET
Information
Field
is
set
(Le.
time
code
value
has
never
been
loaded
into
it),
then
"Blank
time
code"
COMMAND
ERROR will be generated. and Chase Status will be set to "Failure".
The
same
error
will
be
generated
if
Controlled Device
is
unable,
through
its
own
actions, to
eliminate
"blank" bit in either SELECTED TIME CODE or SELECTED MASTER CODE.
The CHASE MODE Information Field defines the type of synchronization which is to take place.
CHASE will be cancelled by the receipt of another MCP or MCS command.
OB 	CHASE
COMMAND ERROR RESET
Resets the "Error halt" flag in the COMMAND ERROR Information Field. allowing resumption of
command processing in the Controlled Device. Refer to the COMMAND ERROR and COMMAND
ERROR LEVEL Information Field descriptions.
0C 	' 	COMMAND ERROR RESET
MMC RESET
Resets the Controlled Device's MIDI Machine Control communications channel to its power up condition;
plus:
(a) 	empties the UPDATE list;
(b) 	deletes all PROCEDURES;
(c) 	deletes all EVENT's;
(d) 	clears all GROUP assignments;
(e) 	clears the COMMAND ERROR field, including the "Error halt" flag;
(f) 	‘ 	resets COMMAND ERROR LEVEL to zero ("All errors disabled");
(g) 	sets all time code Information Field flags to their default state.
as outlined in Appendix B;
(h)
	resets the
MCP
command
tally
byte in
MOTION CONTROL
TALLY
Information
Field to 	7Fhex 	("No MCP‘s currently active”);
(i) 	cancels any command sysex de-segmentation which may be in progress.
R 	T m 	d 	ll MM 	n 	11 	vi
0D 	MMC RESET

## Page 32

WRITE
Loads data into the specified Information Field(s).
The WRITE command is followed by one or more strings each consisting of an Information Field name
together with the complete data which is to be loaded into that Information Field.
Information Field data formats must be exactly as defined in "Detailed Response and Information Field
Descriptions".
The specified Information Field must be writeable.
4 0 	WRITE
<count=variab1
e>
	Byte
count
following
information
<name>
	Writeable
Information Field
name
<data
. .
>
	Format defined by
Information Field
name.
<name> 	More 	<name> 	<data . . > 	pairs as required . 	.
<data..>
MASKED WRITE
Allows specific bits to be altered in a bitmap style Information Field (see Note ‘1).
To be "mask-writeable". the Information Field must be in the <count> 	<data> format, and the bitmap
must begin immediately after the <cotmt> byte.
41 	MASKED WRITE
<count=04+ext> 	Byte count of following data.
<name> 	Mask-writeable Information Field
Name *1
<byte
	#> 	Byte number
target byte
within
bitmap.
Byte
is the
first
byte
after
the <count> field in the mask-writeable Information Field
definition.
	.
<mask>
	One's
in this
mask
indicate which bits
will
be
changed
in
target
bitmap byte.
<data>
	New
data
for
target bitmap
byte.
NOTES:
*1. 	The only mask-writeable Information Fields currently defined are those which employ the.
Standard Track Bitmap (see Section 3 "Standard Specifications").
2. 	The "all one's" value for both 	<mask> 	and 	<data> 	is, of course, 75'.
READ
Requests transmission of the contents of the specified Information Field(s).
If
an
Information Field
is
unsupported by the
Controlled Device,
then
RESPONSE ERROR
message
will
be generated. 	(Refer to the RESPONSE ERROR lnforrnation Field description.)
42 	READ
<count=vari abl
e> 	Byte count (not including command and count).
<n ame> 	Information Field name(s)

## Page 33

UPDATE
FORMAT 1 - UPDATE [BEGIN]
UPDATE [BEGIN] causes a Controlled Device to irn_mediat§ly:
(i) 	transmit the contents of the specified Information Field(s);
and 	(ii) 	add the specified Information Field name(s) to an internal UPDATE "list". I"l
Following
this,
at
intervals
no
more
frequent
than
that
swified
by
UPDATE
RATE
Infgrmatign Field,
the Controlled Device will:
(iii)
	rte-transmit
contents
any
Information
Fields in
internal
UPDATE
"list"
if
those
contents
have changed
and have
become
different
to
the contents most
recently
transmitted as a result of the UPDATE command. 	*2*3
If
any
specified
Information
Fields
are
unsupported
by
Controlled Device
(or
are
undefined, or
are
defined
as
having
"no
access"), then
RESPONSE
ERROR
message
will
be
generated
naming
field(s) in
error.
(Valid
names
in
same
UPDATE
[BEGIN]
request
will
be
added
to
UPDATE
"list"
in
usual
way.) The RESPONSE ERROR
message
will
be
transmitted
once,
without
re-transmissions.
*4
The
internal
"list"
Information
Fields being
UPDA'I'E'd by
Controlled Device
is
cumulative
with
each
UPDATE command.
If
requested
Information Field
is a
time
code
field,
then the
first
(immediate)
UPDATE
response
will
always
be
in
full
WM
(S-byte)
format,
while
subsequent responses
will
use
SW
(2-byte) format
whenever appropriate.
(See
Section
3,
"Standard
Specifications
- Standard Short Time Code".)
Use UPDATE [END] to delete items from the "list".
An MMC RESET will completely clear the "list", and halt all UPDATE responses.
43 	UPDATE [BEGIN]
<count=va ri abl e> 	Byte count (not including command and count).
00 	"BEGIN" sub-command.
<name> 	Information Field
name(s)
*5
NOTES:
*1.
	If
newly
requested
Information Field
name
is
already contained in
internal
UPDATE "list",
then
an
immediate transmission
the contents
that
field
will
occur
as
expected. 	The internal
"list"
will
not
change.
”'2.
	If
an
Information Field
value
has
changed more than once since the last
UPDATE
transmission.
then only the most recent value will be transmitted.
*3.
	If
an
Information Field
value
has
changed more than once since the
last
UPDATE
transmission,
but
has
reverted to the same
value last transmitted, then no new
UPDA'I'E
response
will
be
required.
*4. 	Refer also to the RESPONSE ERROR Information Field description.
*5. 	Time
code
Information Field
names may
be
specified either by their STANDARD TIME CODE
names (01
thru 1F),
or by their corresponding
STANDARD SHORT TIME CODE
names (21 thru
3F). Resulting UPDATE actions will be identical in either case.

## Page 34

FORMAT 2 - UPDATE [END]
The Controlled Device must delete the specified Information Field(s) from its UPDATE "list", and
discontinue automatic re-transmissions of their contents.
No errors will be generated if the specified narne(s) cannot be found in the current UPDATE list.
43 	UPDATE [END]
<count=va ri able> 	Byte count (not including command and count).
01 	"END” sub-command
<name> 	Information Field
name(s).
7F anywhere in this list will discontinue al_l UPDATE's.
NOTES: 	v
I. 	An MMC RESET command will always empty the UPDATE "list" and cause all UPDATE
activity to cease.
2. 	An UPDATE command which specifies any sub-command other than [BEGIN] or [END]. will
cause an "Unrecognized sub-command" COMMAND ERROR.
LOCATE 	(MCP command)
FORMAT l - LOCATE [-I/FJ
Causes the Controlled Device to move to the time code position contained in the selected Information
Field, in
accordance
with
SELECTED
TIME
CODE.
*1'2
If
"blank"
bit
in
target
Information
Field
is set
(i.e.
time
code value
has
never
been loaded
into
it),
then a "Blank time cOde" COMMAND ERROR will be generated, and the "MCP Success level" in the
MOTION CONTROL TALLY Information Field will be set to "Failure".
With
exception
theDEFERRED
PLAY
(MCS)
and
DEFERRED
VARIABLE PLAY
(MCS)
commands, LOCATE [HP] will be cancelled by the receipt of any other MCS or MCP command.
	LOCATE [I/F]
<count=02+ext> 	Byte count (count=02 where extensions are not used).
00 	"HF" sub-command
<name> 	Valid
Information Field
names are:
00 = reserved for extensions
08 = GPO / LOCATE POINT
=
GPI
0A = GP2
013 = GP3
0C = GP4
DD = GPS
02: = GP6
0?
= GP7
FORMAT 2 - LOCATE [TARGET]
Causes the Controlled Device to move to the time code position specified in the command data. in
accordance with the SELECTED TIME CODE.
With the exception of the DEFERRED PLAY (MCS) and DEFERRED VARIABLE PLAY (MCS)
commands, LOCATE [TARGET] will
be cancelled by the receipt of
any other MCS or MCP command.

## Page 35

4 4 	LOCATE [TARGET]
<count=06>
	Byte
count.
01 	"TARGET" sub-command
1:: 	mn 	sc 	fr 	ff 	Standard Time Specification with subframes (type {ff})
NOTES:
*1. 	LOCATE [I/F] requires that at least one of the general purpose registers GPO thru GP7 be
supported.
*2. 	Once a LOCATE [I/F] has been initiated, any subsequent changes to the specified Information
Field
will
have no
effect
on
Locating
process.
In
other words.
locate
point
time
is read
from
general purpose
register
when the
Lgx2ATE
command
is
received,
and
moved
to
some
other unspecified internal locate point register.
3. 	Devices which do not have the capability to locate with subframe accuracy should ignore any
subframes data in the locate point field.
4.
	At
conclusion
any locating action.
if
Controlled Device
supports
PAUSE command,
then
PAUSE
mode
should
be entered.
Otherwise,
LOCATE
should
be
concluded
with
normal STOP command, with monitoring possibly specified by the STOP MODE Field.
5. 	Refer also to the descriptions of the DEFERRED PLAY and DEFERRED VARIABLE PLAY
commands.
6. 	A LOCATE command which specifies any sub-command other than [I/F] or [TARGET] will
cause an "Unrecognized sub-command" COMMAND ERROR.
VARIABLE PLAY 	(MCS command)
Enter continuously variable playback mode with the direction and speed specified.
'If’the
requested
speed
value
exceeds the
capabilities
Controlled Device,
then
it
should
play
at
its
.
searest
available
speed".
VARIABLE PLAY will be cancelled by the receipt of another MCS or MCP command.
45 	VARIABLE PLAY
<count=03>
	Byte count.
	'
sh 	sm 	51 	Standard Speed Specification
NOTE:
Recording [rehearsing] tracks
	n
	m 	i
	xi 	fr
m
r
	r 	r
h
	upon
receipt
VARIABLE PLAY command. 	If that action is desired, then transmit <RECORD EXIT>
<VARIABLE PLAY>.
SEARCH 	(MCS command)
Causes the
Controlled Device to move
with
specified direction
and
velocity.
Output monitoring must be enabled, but need only be of sufficient quality that recorded material is
recognizable.
If
the requested speed value exceeds the
capabilities
the device, then the device should move at its
"nearest available speed". In the extreme case, a
device which implements only
fixed
speed search in
each direction can still be said to support the SEARCH command.

## Page 36

SEARCH
will
be
cancelled
by
receipt
another
MCS
or
MCP
command.
Recording [rehearsing] tracks W.
4 6 	SEARCH
<count=03>
	Byte
count.
sh 	sm 	51 	Standard Speed Specification
NOTE:
A device which outputs both picture and audio is only required to monitor picture during a
SEARCH. Concurrent audio monitoring remains at the discretion of the equipment manufacturer.
SHUTTLE
(MCS command)
Causes the Controlled Device to travel at specified direction and velocity without necessarily reproducing
audio or picture.
If the requested speed value exceeds the capabilities of the device, then the device should move at its
"nearest available speed".
SHUTTLE will be cancelled by the receipt of another MCS or MCP command.
Recording [rehearsing]
tracks
exit
from record
lrehgrsel.
4 7 	SHUTTLE
<count=03>
	Byte
count.
512 	sm 	51 	Standard Speed Specification
STEP 	(MCS command)
Causes the
Controlled Device
to
move
specified distance
forward or
backward,
with
respect
to
its
current
position. Successive commands are cumulative until next MCS or MCP command other than STEP.
Visual
devices must
provideat
least
visual
monitoring during
the STEP
movement (audio is
optional). and
must maintain picture after completion of the STEP (similar to a PAUSE mode).
Audio devices must provide audio monitoring during the STEP, and. if the device has digital "looping"
capability, should continue to loop after the STEP has been completed.
Sequencers should enable MIDI outputs during the STEP, and should refrain from turning Notes off at
completion of the STEP.
In all cases. monitoring should return to "normal" after cancellation of the STEP mode by another MCS or
MCP command.
The distance
to
be
moved is measured
in units
which
are
defined in
STEP
LENGTH Information Field.
The default unit is one video field (1/2 frame).
48 	STEP
<count=01>
	Byte count.
<steps>
	Number
STEP
LENGTH's:
	9 	53.5555
g = sign (1 = reverse)
ssssss = quantity
ASSIGN SYSTEM MASTER
Most
"chase" synchronization systems require definition
"master" device. Other devices may then
follow (chase) and synchronize to the time code from this device.
The assignment
a system master may cause appropriate distribution
that "master" device's time code
within the system. 	Devices receiving such code will normally load it directly or indirectly into their

## Page 37

4A
4B
SELECTED MASTER CODE fields. No panicuhr method of time code distribution or operation is
specified by this command. 	'
The assignment of a master time code stream also provides a reference time within which all system-wide
timed events may be consistently located.
Reaction
to
ASSIGN SYSTEM MASTER
is governed
by
following
truth
table:
Own 	<device_ID> 	Device 	already
= 	command 	data? 	system 	master? 	ACTION
none
Release
	system
master
	status
Set
	up 	as
	new
	system
master
Continue 	as 	system 	master
KKZZ
	NZKZ
The A 	SIGN SYSTEM MASTER me 	must be transmit 	via 	"All-Call" device ID 	.
A group device_ID may not be assigned as system master.
4.9 	ASSIGN SYSTEM MASTER
<count=01
>
	Byte count.
<devi
ce_
ID>
	Idem
assigned
device.
71-" = dis-assign any previously assigned master,
leaving no master assigned.
GENERATOR
COMMAND
Controls the running state of the time code generator.
See also the GENERATOR SET UP Information Field.
is .
w
	4A 	GENERATOR
COMMAND
<count=01>
	Byte count.
nn 	. 	Action:
' 	00 = Stop
01 = Run, frame locked if and as required by the
GENERATOR SET UP Information Field
02 = Copy/Jam: While running, transfer Source Time Code
into the GENERATOR TIME CODE register. as
specified by
GENERATOR SET UP
Information
Field.
MIDI TIME CODE COMMAND
Controls the production of MIDI time code.
See also the MIDI TIME CODE SET UP Information Field.
43 	MIDI TIME CODE COMMAND
<count=01
> 	Byte count.
nn 	Action:
00 = Off
02 = Follow
time code defined by the
MIDI TIME CODE
SET UP Information Field.

## Page 38

4C
4D
MOVE
Transfer
contents
Same
Information Field
to
Destination
Information Field.
Valid destination Information Fields are the Read/Writeable fields in the S-data-byte group (names 01 thru
IF).
Valid source Information Fields are all of the S-data-byte group (names 01 thru 1F).
Subframes should
be
assumed to
be
zero
in
all
sources
not
usually containing
subframes
(type {
st
}).
Subframe data will be lost if the source contains subframes (type {ff }) while the destination does not
(type
(st}).
4C 	MOVE
<count=02+ext>
	Byte
count
(not
including
command
and
count).
<destina
ti
on> 	Valid
destination
Information Field
name.
<source>
	Valid
source
Information Field
name.
NOTES:
1. 	All embedded time code status flags (see Section 3 "Standard Specifications") will be transferred
from
the Source
field
to
Destination
Field,
with
the exceptions that:
(a) 	When MOVE'ing from an {st} type field to an { ff} field, set bit i = 0 as well as
subframes = 00;
(b) 	When MOVE'ing from an {ff} field to an { st ) field, set bits:
1' = 1. e = 0. v: 0, d= 0/1 as determined, and n = 1.
2. 	The MOVE command may be used to instantaneously capture the value of a moving time code
stream. For Example, to MOVE the current SELECTED TIME CODE to the LOCATE point
register GPO; or to trap the current ACTUAL OFFSET by MOVE'ing it to the REQUESTED
OFFSET.
ADD
Add the contents of two source Information Fields, and place the result in a destination Information Field:
[Destination] = [Source #1] + [Source #2]
The result will be a valid time code number between 00:00:00:00.00 and +/-23:59:59:nn.99, where nn
depends on the frame rate used for the calculation. (Whether or not a negative result is permitted depends
on the characteristics of the destination Information Field.)
The result will always be expressed as a non-drop-frame QuantityI regardless of the droplnon-drop status of
Wm
Valid destination Information Fields are the Read/Writeable fields in the 5-data-byte group (01 thru 1F).
Valid source Infonnation Fields are all of the S-data-byte group (names 01 thru 1F).
It is permissible that the destination Field be the same as one of the source Fields. Care must be exercised
so
that
such source data is
not destroyed before the
calculation
is
complete.
Subframes should be assumed to be zero in all sources not usually containing subframes (0136 {st )).
Subframe
data
will
be
lost
if
either
source contains subframes (type
{
ff
})
while
destination does
not
(WC
(5“)-
40 	ADD
<count=03+ext> 	Byte count (not including command and count).
<destina
ti
on> 	Valid destination Information Field name.
<source 	#1 > 	' 	Valid source Information Field name.
<source 	#2> 	Valid source Information Field name.

## Page 39

4E
4F
NOTES:
1. 	The frame rate and drop-frame status of each of the source fields is established entirely by the
time code status bits embedded within those fields. 	The TIME STANDARD Information Field
has no bearing on this calculation.
. 	2. 	Embedded time code status flags of an { ff} type Destination field (see Section 3 "Standard
Specifications") will be set up as follows:
tt (time type) 	Same as m, with the exception that if Source #1
specifies drop-frame, then the Destination will be converted to
non-drop-frame.
c (color frame) 	0
k
(blank)
(sign)
	Set
by
result
calculation.
If
Destination
field
does
not
allow signed negative data, then any negative result must first
be added to "24 hours" to produce a positive value.
.
(final
byte
id)
	‘
3. 	Embedded time code status flags of an {st} type Destination field (see Section 3 "Standard
Specifications") will be set up as follows:
tt, c, k, g 	Same as {ff} field
1' (final byte id) 	1
e
(estimated code)
v
(invalid
code)
d (video field 1) 	0/1 as determined
n (no time code) 	1
4.
	It
is expected that
many devices
will
be
capable
performing mixed
frame drop
and
non-drop
calculations.
Very
few, however,
will
produce correct
results
with
other frame
rate mis-matches.
5. 	Calculations involving drop frame code which “cross" the 24 hour boundary may produce
unpredictable results.
SUBTRACT
Subtract the contents of one source Information Field from that of the other, and place the result in a
destination Information Field:
[Destination] = [Source #1] - [Source #2]
All the conditions for the ADD command apply also to the SUBTRACT command.
4E
	SUBTRACT
<count=03+ext>
<destination>
<source 	#l>
<source 	#2>
Byte count (not including command and count).
Valid
destination Information Field
name.
Valid
source
Information Field
name.
Valid source Information Field name.
DROP FRAME ADJUST
Convert the contents of the named lnforrnation Field into drgpjrgme format (see "Drop Frame Notes" in
the "Standard Specifications" section).
Take no action if the contents are not currently expressed in 30 frame. non-drop-fi'arne format.
May be used after ADD or SUB'I'RACT to produce a drop frame result.
Valid lnfonnation Fields are the Read/Writeable fields in the 5-data-byte group (names
0] thru 1F).

## Page 40

4F
	DROP
FRAME ADJUST
<count=01
+ext>
	Byte
count (not
including
command
and
count).
<name>
	Valid
Information Field
name
NOTE:
Frame
rate and
drop frame
status
named
Information Field
is
established
entirely
by
time
code status bits contained within that field. 	The TIME STANDARD Information Field has no
bearing on this calculation.
PROCEDURE
A
Procedure
is
string
commands defined
by
Controller
and
stored
within
Controlled Device.
It
may subsequently
be
executed
by
transmission
single
PROCEDURE
[EXECUTE]
command.
FORMAT
l
-
PROCEDURE
[ASSEMBLE]:
Assembles a string of commands for execution at a later time.
Procedures
are
retained
until
receipt
PROCEDURE
[DELETE] or
MMC
RESET
command.
Re-definition of an already defined procedure implies that the previous definition first be deleted.
The commands contained within a procedure must be pre-checked for "MAJOR" and
"IMPLEMENTATION" errors when the procedure is assembled. If these embedded commands contain
such errors, then: 	*1
(i) 	the procedure will be discarded;
(ii)
error
will
be
recorded in the
COMMAND
ERROR'Information Field;
and 	(iii) 	the PROCEDURE [ASSEMBLE] error flag will be set (also in the COMMAND
ERROR Information
Field).
Any attempt to define a procedure which will overflow whatever procedure storage area is available will
generate a "PROCEDURE buffer overflow" error in the COMMAND ERROR Information Field.
5 0 	PROCEDURE [ASSEMBLE]
<count=va
ri
able>
	Byte count.
00 	"ASSEMBLE" sub-command.
<procedure>
	Procedure Name in
the range
00 thru
75'.
71“
is reserved.
<command
	#1
. .
>
	Any MMC
commands except;
<command
	#2.
.
>
	(i)
	another PROCEDURE
[ASSEMBLE]; 	*2
<command
	#3.
.
>
	or
	(ii)
PROCEDURE [EXECUTE] with
the same
procedure name
as
is
being defined.
*3
NOTES:
*1. 	"MAJOR" and "IMPLEMENTATION" errors are described in the COMMAND ERROR
Information Field definition. 	Refer also to NOTE 2 of that definition.
*2. 	A "Nested PROCEDURE [ASSEMBLE]" error would be generated.
*3. 	A "Recursive PROCEDURE [EXECUTE]" error would
be generated.

## Page 41

FORMAT 2 - PROCEDURE [DELETE]:
Delete
previously
defined
sequence
commands.
With
exception
"delete
all
PROCEDURES"
version
this
command. any attempt
to
delete
an
undefined
procedure
will
cause
an
"Undefined
PROCEDURE" error in the COMMAND ERROR Information Field.
5 0 	PROCEDURE [DELETE]
<count=02>
	~
Byte
count.
01 	"DELETE" sub-command.
<procedure>
	Procedure
Name
in
the range
thru
7E.
7? means W.
FORMAT 3 - PROCEDURE [SET]:
Establishes the name of the procedure which will appear in the next READ of the PROCEDURE
RESPONSE Information Field. With the exception of the "set all PROCEDURE'S" version of this
command, specification
an
undefined procedure
will
cause
an
"Undefined PROCEDURE" error
in
COMMAND ERROR Information Field.
5 0 	PROCEDURE [SET]
<count=02>
	Byte
count.
02 	"SET" sub-command.
<procedure>
	Procedure Name
in
the range
thru
7E.
71" means 5;] a]! PREEDL] E's.
FORMAT 4 - PROCEDURE [EXECUTE]:
Irrgmediately execute
the named
procedure.
Any
attempt
to execute
an
undefined procedure
will
cause
an
"Undefined PROCEDURE"
error
in the
COMMAND
ERROR
Information Field.
50 	PROCEDURE [EXECUTE]
<count=02>
	Byte count.
03 	"EXECUTE" sub-command.
<procedure> 	Procedure Name in the range 00 thru 75‘.
71-"
is reserved.
NOTES:
1. 	An MMC RESET command will always delete an Procedures.
2. 	A PROCEDURE command which specifies any sub-command other than [ASSEMBLE],
[DELETE],
[SET] or
[EXECUTE].
will
cause an
"Unrecognized sub-command"
COMMAND
ERROR.
3.
	Examples
PROCEDURE [ASSEMBLE]
and
PROCEDURE [EXECUTE]
commands may
be
found in Note 8 of the EVENT [DEFINE] command description.

## Page 42

51 	EVENT
FORMAT l - EVENT [DEFINE]
Allows any single MIDI Machine Comm] command to be executed by the Controlled Device at a specified
trigger time, relative to a specified time code stream.
Re-definition
an
already
defined Event
implies
that
previous
definition
first
be
deleted.
Any attempt to define an Event which will overflow whatever Event storage area is available will generate
an "EVENT buffer overflow” error in the COMMAND ERROR Information Field.
Similarly, if the requested "trigger source" Information Field is unavailable for any reason, an "EVENT
trigger source unavailable or unsupported" error will be generated. and the Event will be discarded.
The command contained within the Event must be pre-checked for "MAJOR" and "IMPLEMENTATION"
errors when the Event is defined. 	If this embedded command contains such errors, then: 	‘9
(i) 	the Event will be discarded;
(ii)
error
will
be
recorded
in
COMMAND
ERROR
Information Field:
and 	(iii) 	the EVENT [DEFINE] error flag will be set
(also in the COMMAND ERROR Information Field).
51 	EVENT [DEFINE]
<coun
t
-va
:1 abl
e>
	Byte
count.
00 	"DEFINE" sub-command.
<event> 	Event Name in the range 00 thru 75.
v 	7F is reserved.
<f.1
.395» 	Event control
flags:
k
	0 	a
dd
dd = Direction modes:
00 = Trigger only while moving forwards.
01 = Trigger only while-moving in reverse.
1 0 = Trigger while moving in either direction.
a = "All speeds" flag:
0 = Trigger only when trigger time is equaled while
moving at fixed or variable play-speed.
1 = Trigger immediately upon recognizing that the
trigger time has been equaled or passed,
while moving at any speed.
k = "Non-delete" flag:
= Big}: Event definitign immediately upon ming
MW
= Event definition
remains in event queue
after
being triggered. 	*8
<tri
gger 	source)
	Information Field
name
time
code stream
relative
to
which
event
is to be triggered: 	*4
00 = reserved for extensions
01 = SELECTED TIME CODE *5
02 = SELECTED MASTER CODE
06: GENERATOR TIME CODE
0 7: MIDI TIME CODE INPUT
<name> 	Name
Information Field containing the
trigger time:
*3
00: reserved for extensions
08 = GPO / LOCATE POINT
09 = GP]
GA = GPZ
OB = GP3
= 6P4

## Page 43

OD = GPS
05‘ = GP6
01-" = 6P7
<command.
.
>
	Any
single command plus
data
as
required,
with
exception
of:
*6
(i) 	another EVENT [DEFINE]; *10
or 	(ii) 	a PROCEDURE [ASSEMBLE]. * ll
NOTES:
1. 	The EVENT command requires that at least one of the general purpose registers GPO thru GP7 be
supported.
2. 	Any subsequent changes to the specified trigger time register will have no effect on the Event. In
other words, the trigger time is read from the general purpose register WW,
and moved an unspecified internal Event trigger time area. 	An EVENT RESPONSE will always
send back the time from this internal area.
*3. 	Whether or not to support subfrarne accurate Event triggering remains at the discretion of the
device manufacturer.
*4.
	Typical
trigger
sources
will
be
SELECTED
TIME
CODE
or SELECTED MASTER CODE.
Limitations may occur in some devices which only support a single trigger source (probably
SELECTED TIME CODE). Other devices may support multiple trigger sources, but only
implement
subframe
triggering
for
one
or
more
them.
*5. 	If no time code is present, and SELECTED TIME CODE is always updated by tachometer pulses.
then it may not provide an ideal trigger source, as its numeric sequence can be discontinuous.
This problem may be circumvented by defining Events which may be triggered at "All speeds"
.,
	(refer
to the
EVENT
command
decription).
*6. 	In order to execute multiple commands at a time. the command PROCEDURE [EXECUTE]
should be used.
7.1:; 	It is important that MIDI Machine Control commands which may require advance triggering
’ 	should be detected within the Controlled Device, and their trigger times advanced accordingly (for
example,
RECORD STROBE
must
allow for
record ramp up delays).
This action should be
transparent to the Controller.
*8. 	Example of an Event in the "Non-delete" mode:
Consider a simple "looping" action where a tape machine is to begin playing from location "A"
and continue up to point "B", at which time it must locate back to "A" and start again:
F0
	71-"
<devi ce_ID>
	<mcc>
<WRITE> 	<count=0C>
<GP
0>
	<5—byte
loop
start
	time
	"A
">
<GP1> 	<5—byte 	loop 	end 	time 	”B">
<PROCEDURE> 	<count=06> 	<[ASSEMBLE] > 	<procedure_name>
<LOCATE> 	<count=01> 	<GPO>
<DEFERRED
PLAY>
<EVENT> 	<count=09> 	< [DEFINE] > 	<event_name>
<flags=4 0> 	(SELECTED 	TIME 	CODE> 	<GP1>
<PROCEDURE> 	<count=02> 	< [EXECUTE] > 	<procedure_name>
(PROCEDURE) 	<count=02> 	<[EXECUTE] > 	<procedure_name>
F7 	’
*9. 	"MAJOR" and "IMPLEMENTATION" errors are described in the COMMAND ERROR
Information Field definition. Refer also to NOTE 2 of that definition.
*10. 	A "Nested EVENT [DEFINE]" error would be generated. 	.
*11. 	A "PROCEDURE [ASSEMBLE] within EVENT [DEFINE] " error would be generated.

## Page 44

FORMAT 2 - EVENT [DELETE]
Delete a previously defined Event.
With the exception of the "delete all EVENTS" version of this command, any attempt to delete an
undefined event will cause an "Undefined EVENT" error in the COMMAND ERROR Information Field.
51 	EVENT [DELETE]
<count=02>
	Byte
count.
01 	"DELETE" sub-command.
<event>
	'
	Event
Name in
the range
thru
7E.
' 	71' means W-
FORMAT 3 ~ EVENT [SET]
Establishes the name of the Event which will appear in the next READ of the EVENT RESPONSE
Information Field.
With
exception
the "set
all
EVENTS"
version
this command,
specification
an
undefined
Event
will
cause an
"Undefined
EVENT“
error
in
COMMAND
ERROR
Information Field.
51 	EVENT [SET]
<count=02>
	Byte
count.
02 	"SET" sub-command.
<event> 	Event Name in the range 00 thru 73.
'
	7?
means
55:;
all
EVEN];
FORMAT 4 - EVENT [TEST]
Immediately execute the command contained in the named Event, as if a trigger had occured.
n 	l 	v
Any attempt to test an undefined Event will cause an "Undefined EVENT" error in the COMMAND
ERROR Information Field.
.51 	EVENT [TEST]
<count=02>
	Byte count.
03 	"TEST" sub-command.
<event> 	Event Name in the range 00 thru 75
7?
is reserved.
NOTES:
1. 	An MMC RESET command will always delete all Events.
2. 	An EVENT command which specifies any sub-command other than [DEFINE], [DELETE],
[SET] or [TEST],
will
cause an
"Unrecognized sub-command"
COMMAND
ERROR.

## Page 45

52 	GROUP
FORMAT l - GROUP [ASSIGN]
The Controlled Device is to become assigned to the indicated Group if the device's <devi ce_ID>
appears in the received list of device_lD's.
Once assigned, the Controlled Device is to honour all commands received via the Group device_ID in
addition to those received through its own device_ID.
A Group assignment is retained until receipt of an MMC RESET or an appropriate GROUP [DIS-
ASSIGN] command.
Group
wsignment
is
cumulative
with
each
GROUP
[ASSIGN]
message.
For
example,
to
add
new
device
to an already existing group. a Controller may simply transmit a GROUP [ASSIGN] listing only the new
device.
Any attempt to assign the device to more groups than it can accomodate will produce a "Group buffer
overflow" error in the COMMAND ERROR Information Field. 	"3
52 	GROUP [ASSIGN]
<coun
t
=va
ri
abl
e>
	Byte
count
(not including
command
and
count).
0 0 	"ASSIGN" sub-command.
<group>
	Group
number
-
any unused
device_ID
may
be assigned
as
group
number, with the exception of 7F.
<devi
ce_ID>
	List
devices
which
are
to begin responding
to
Group number
. .
(devi ce_ID>
FORMAT 2 - GROUP [DIS-ASSIGN]
The
Controlled Device should remove
itself
from
indicated Group
if
the device's
<devi
ce_ID>
appears in the received list of device_lD's.
52 	GROUP [DIS-ASSIGN]
<count=variab1
e>
	Byte
count.
01 	"DIS-ASSIGN" sub-command.
<group>
	Group number
7F= dis-assign from afl groups.
<devi
ce_ID>
	List
devices
which
are
to
be
dis-assigned
from
Group number
. .
<devi ce_ID> 	7F anywhere in this list will dis-assign fl devices. *4
NOTES:
1. 	An MMC RESET command will always delete afl Group assignments.
2. 	GROUP [ASSIGN] and [DIS-ASSIGN'J messages will normally be transmitted via the "all-call"
device_ID (<devi ce_ID> = 71-").
*3. 	It is recommended that a Controlled Device should accommodate being assigned to at least 16
groups at any one time.
*4.
	When dis-assigning
an
entire group, the
"list
devices"
will
normally contain only
single entry
(71“). For example, to dis-assign all devices from all groups, the Controller transmits:
F0 	7F 	7F 	<mCC> 	<GROUP>
	<count=03>
	71-"
	71“
F7
5. 	A GROUP command which specifies any sub-command other titan [ASSIGN] or [DIS-ASSIGN],
will cause an "Unrecognized sub-command" COMMAND ERROR.

## Page 46

COMMAND SEGMENT
Allows a command (or a string of commands), which is greater in length than the maximum MMC System
Exclusive data field length (48 bytes), to be divided into segments and transmitted piece by piece across
multiple
System
Exclusives.
Commands received by a Controlled Device in this way will be executed exactly as if they had arrived all
in the same sysex.
COMMAND
SEGMENT
must
always
be
first
command
in its sysexI
and
there
must
be
no
other
-.
commands in the sysex save those which are contained within the body of CQMMAND SEGMENT itself.
Segment divisions need not fall on command boundaries. Partial commands, which may occur at the end
of a COMMAND SEGMENT sysex, must be detected by the Controlled Device so that command
processing may
be
correctly
resumed when the
next
segment
arrives.
A Controlled Device will generate a "Segmentation Error", one of the "MAJOR ERRORS" defined in the
COMMAND ERROR Information Field, under any of the following conditions:
(a) 	COMMAND SEGMENT not first command in sysex;
or 	(b) 	Byte count not exactly equal to number of bytes remaining in sysex;
or 	(c) 	A "subsequent" segment is received without receiving a "first" segment;
or
	(d)
	Segments are
received
out
order;
	/
De-segmentation will be cancelled upon the occurrence of a Segmentation Error.
With the exception of WAIT} or RESUME messages, if a non-segmented (i.e. normal) sysex is received by
Controlled Device
when
"subsequent" segment sysex was
expected,
it
will
be
processed
normally,
and
de-segmentation will be cancelled.
Refer also to Section 2 "General Structure" - "Segmentation".
53 	COMMAND SEGMENT
<count =va ri abl e> 	Byte count (command string segment length + I)
51' 	Segment Identification: 0 	f 	ssssss
' 	f: 	' 	1 = first segment
0 = subsequent segment
ssssss = segment number (down count, last=0 0 0 0 00)
<. . comman ds . . > 	Command string segment
DEFERRED VARIABLE PLAY 	(MCS command)
Identical to the
VARIABLE PLAY
command,
with
exception that
if
device is currently executing
LOCATE (MCP),
then
VARIABLE PLAY
mode
will
not
be
invoked until
LOCATE
is completed.
Receipt of any other MCS or MCP command will cancel DEFERRED VARIABLE PLAY.
When received while a LOCATE is in progress, the "MCP Success Level" field of the MOTION
CONTROL TALLY Information Field will be set to indicate "Actively locating with Deferred m
Play pending" for the duration of the LOCATE.

## Page 47

ss_
When the LOCATE has concluded:
(i) 	An automatic VARIABLE PLAY (MCS) command will be issued, and the device will enter
continuously variable playback mode with the direction and speed specified (If the requested
speed value exceeds the capabilities of the Controlled Device, then it should play at its "nearest
available speed");
(ii) 	The MOTION CONTROL TALLY "MCS command" byte will switch to "VARLABLE PLAY";
(iii) 	The MOTION CONTROL TALLY "MCP command” byte will become "No MCP's currently
active", clearing both the LOCATE and Deferred Variable Play indications.
If the device is not executing or does not support the LOCATE command, then it should immediately enter
variable playback mode.
54 	DEFERRED VARIABLE PLAY
<count=03>
	Byte
count.
sh 	sm 	51 	Standard Speed Specification
NOTE:
Recording [rehearsing] tracks WWW upon receipt of the
DEFERRED VARIABLE PLAY command. 	If that action is desired, then transmit
<RECORD
EXIT>
(DEFERRED
VARIABLE
PLAY>.
RECORD STROBE VARIABLE
Switches the Controlled Device into or out of record or rehearSe, according to the setting of the RECORD
MODE Information Field. RECORD STROBE VARIABLE will be honored under two conditions onlyé
5:95 9111193 I; 	Controlled Device already Playing:
If theControlled Device is alreadyplaying 	i 	h 	"M 	n 	'v 	M 	in 	ntrl
N 	NTR 	LTALLYInfn'n 	inFil 	i 	PAY 	V 	PAY,thenRECORD
STROBE VARIABLE will cause record [rehearse] entry on all tracks which are presently in a record ready
state.
and
cause
record [rehearse]
exit
on any
currently recording [rehearsing] tracks
that
are
no
longer
record ready. *2‘9'10
W Controlled Device Stopped:
If when RECORD STROBE VARIABLE [5 received, the Controlled Device'ts completely stopped as a
result of an eXPliciI STOP or PAUSE command W
in the MOTION CONTROL TALL'Y Information Field ts STOP or PAUSE; [ii] the "MCS success level"
"N 	M 	P' 	, then:
(i) 	An automatic VARIABLE PLAY (MCS) command will be issued, and the device will enter
continuously variable playback mode with the direction and speed specified. (If the requested
speed value exceeds the capabilities of the Controlled Device, then it should play at its "nearest
available speed"); 	*4’5
(ii) 	I 	At an appropriate point in the varispeed start up phase of the device, record [rehearse] entry will
occur on all tracks which are presently in a
record ready state.
*2*6

## Page 48

55 	RECORD STROBE VARIABLE
<count=03> 	Byte count. 	.
sh 	sm 	5]. 	Standard Speed Specification
NOTES:
1. 	The recording [rehearsing] characteristics of RECORD STROBE VARIABLE are identical to
those
RECORD STROBE
command. 	The
only
difference
between the
two
commands
lies
in
nature
play
mode
command
which
is
invoked
automatically
if
Controlled
Device
W
RECORD STROBE
VARIABLE
will
therefore
be used
if
variable
speed
recording [rehearsing] must be achieved from a standing start.
*2. 	Tracks are switched in and out of the record ready state using the TRACK RECORD READY
lnforrnation Field.
3. 	It is recommended that, for new Controlled Device designs based on MMC, no recording
[rehearsing] should take place following a RECORD STROBE VARIABLE command unless at
least one track is in a rectord ready state.
Among existing non-MMC devices, however. it is quite common that, given that record [rehearse]
has been enabled (for example by setting the appropriate value in the RECORD MODE
Information Field), recording [rehearsing] will be initiated even if no cracks are in a record ready
state when the command to record [rehearse] is received. 	Such operation remains permissible
under MMC, provided that the resultant status is correctly indicated by including the "No Tracks
Active" bit in the RECORD STATUS Information Field.
*4. 	Under CONDITION 2, an automatic VARIABLE PLAY (MCS) command will be issued SL1!
under the STS 2? or PA! [SE ggnditigns smgifigg. At no other time does RECORD STROBE
VARIABLE have any implications regarding play mode or playing speed.
*5. 	Also under CONDITION 2, the automatic VARIABLE PLAY (MCS) command will be issued
whether or not
any tracks
are
in
record
ready
state, and
whether
or not
RECORD
MODE
has
been specified.
*6. 	The existence of a "record-pause" condition will not affect the operation of RECORD STROBE
VARIABLE. 	(Refer to the RECORD PAUSE and PAUSE command descriptions.)
7. 	Devices which support and have their RECORD MODE set to "VTR:Insert" or "VTRzAssemble",
are expected to produce clean and correctly timed transitions into record [rehearse] under both‘
Conditions I and 2 outlined above. 	When starting from STOP or PAUSE mode (Condition 2), it
will usually be necessary to wait until the device's start up phase has been completed before
recording [rehearsing] is attempted.
8. 	A Controlled Device will ignore any RECORD STROBE VARIABLE command which is
received while it is neither already in play mode nor completely stopped as described.
*9. 	Under CONDITION 1, "Controlled Device already Playing", it is not necessary for the PLAY or
VARIABLE PLAY
command
to have been
"successful" before
RECORD STROBE
VARIABLE
is accepted. If, however, the desired play motion has not yet been achieved when RECORD
STROBE VARIABLE is received, it may be necessary for the device to defer the onset of
recording until an appropriate point in its start up phase.
*10.
	Note also that, under
CONDITION
1,
recording is not inhibited
by
Motion Control
Process
activity.

## Page 49

7C 	WAIT
Signals the Controlled Device that the Controller's receive buffer is filling (or that the Controller is
otherwise unavailable), and that Machine Control Response transmissions must be discontinued until
receipt
RESUME from
Controller.
Any
Response
transmission
which
is
currently
in
progress
will
be allowed to proceed up to its normal End of System Exclusive (F7). Transmission of subsequent
Responses
may
resume
after
receipt
RESUME from
Controller.
The Responses WAIT and RESUME, however, are mt inhibited by the WAIT Command. Neither is
transmission of the WAIT Command itself inhibited by receipt of a WAIT Response.
A Controlled Device must guarantee:
(i) 	to recognize the receipt of a WAIT message within IQ milliseconds after the arrival of
the End of System Exclusive (F7) of that WAIT message;
and 	(ii) 	to then halt all transmissions at the next available MMC System Exclusive boundary
(up to 53 bytes. the maximum MMC sysex length. may therefore have to be
transmitted before the halt can take effect).
The WAIT command is always the only command in its Sysex, and is directed to the "all-call" address
i.e. 	F0 	71’ 	7F 	<mcc> 	<WAIT> 	F7.
' NOTES:
7C 	WAIT
1. 	Correct operation of the WAIT command requires a certain minimum size for the MIDI receive
buffer in the Conuoller. Refer to Appendix E. "Determination of Receive Buffer Size".
2. 	Additional WAIT commands may be transmitted by 3 Controller should its receive buffer
continue to fill.
'
	RESUME
Signifies that the Controller is ready to receive Machine Control Responses from the Controlled Device.
The
default (power
up)
state
is "ready
to
receive".
The
RESUME
command
is
used
primarily
to
allow
Controlled Device to
resume transmissions
after
WAIT.
Transmission
RESUME
Command
is
not inhibited
by
receipt
WAIT
Response.
The
RESUME
command
is
always
only
command
in
its Sysex, and is
directed
to the
"all-call"
address
i.e. 	F0 	7F 	71-" 	<mcc> 	<RESUME> 	F7.
75‘ 	RESUME

## Page 50

6 	DETAILED RESPONSE & INFORMATION FIELD DESCRIPTIONS
Messages from CONTROLLED DEVICE to CONTROLLER.
Reserved for extensions
SELECTED TIME CODE [read/write]
Contains the time code normally used to reference the Controlled Device's current position. (It may also be
referred to as "Self“ code, or "Slave" time code.)
The Information Field SELECTED TIME CODE SOURCE determines the source of this time code. 	It is
selected from Longitudinal Time Code (LTC), Vertical Interval Time Code (VITC). and the "tape counter"
found on most tape machines.
01 	SELECTED TIME CODE
hr
run
	so
fr
st
	Standard
Time
Specification
with
status
(type
{st
})
NOTES:
1. 	More details concerning time code choices may be found in the SELECTED TIME CODE
SOURCE Information Field description.
2. 	The SELECTED TIME CODE status byte will indicate whether or not the current time code has
been updated by Tachometer or Control Track pulses, for example, during fast wind modes.
3. 	If no time code is available at all. then SELECTED TIME CODE will be equivalent to the "tape
counter" which is found on most tape machines, usually updated by Tachometer or Control Track
pulses. For compatibility in time code systems, this "tape counter" must count in hours, minutes,
'
seconds and frames.
The time
code mode
for
this counter
will
normally
be
determined
either
by
the TIME STANDARD Information Field, if supported, or by some other form of locally
adjustable default. If, however, the Controller WRITE‘s a value into SELECTED TIME CODE,
then the time code mode will be determined by the 	tt 	(time type) field in the WRITE data.
Negatively signed values of SELECTED TIME CODE are not permitted.
4. 	SELECTED TIME CODE is specified as WRITE-capable in order to adequately support the
above "tach only" mode of operation. In this case, setting the SELECTED TIME CODE
"counter" to a new value is an accepted operational procedure. However, when time code is
available from the tape, WRITE'ing a new value to this Field may produce unexpected results.
5. 	It is not expected that synchronization will be attempted unless "real" time code is available in
SELECTED TIME CODE 	(i.e. time code status bit n = 0).
6.
	Refer
to
Appendix
B.
"Time
Code Status
Implementation Tables"
for
exact
usage
all
embedded
time code status bits as they apply to SELECTED TIME CODE.
Refer to Section 3, "Standard Specifications", for definition of these bits.
SELECTED MASTER CODE 	[read only]
Contains the time value
the time code
relative to which all synchronization operations are to take place
(see the CHASE command). 	How this time code an'ives at the Controlled Device is not specified.
02 	SELECTED MASTER CODE
hr
mn
	sc
	fr
st: 	Standard Time Specification with status (type
{st))

## Page 51

NOTES:
1.
	Future
versions
MIDI
Machine
Control specification
may
provide
method
selecting
this
MASTER CODE from a number of specific time code sources.
2.
	Refer to
Appendix
B.
"Time
Code
Status
Implementation Tables"
for
exact
usage
all
embedded
time
code
stams
bits
as
they
apply
to
SELECTED
MASTER
CODE.
Refer
to
Section
3.
"Standard
Specifications".
for definition
these
bits.
REQUESTED OFFSET [read/write]
Contains
desired
time
offset
between
SELECTED
TIME
CODE
and
SELECTED
MASTER
CODE for use with the CHASEcommand. and is def'med as follows:
REQUESTED OFFSET = SELECTED TIME CODE -. SELECTED MASTER CODE
[Example: If the Controlled Device is to lead the Master Device by one minute, then
REQUESTED OFFSET = 00:01 :00:00.00 ]
This offset
represents the
desired
difference in
frames between the master
and
slave
positions.
and
is
REQUESTED OFFSET
may
be
expressed
in
any
positive
or
negative
range.
MMC
devices
will
interpret
an'offset of +23:00:00:00.00, for example, as being equivalent to one of -Ol:00.00:00.00.
03 	REQUESTED OFFSET
hr
run
	so
fr
it
	Standard
Time
Specification
with
subframes (type.
If!»
Refer to Appendix B.
"Time
Code Status
Implementation Tables"
for
exact
usage
all
embedded
“9? 	time code status bits as they apply to REQUESTED OFFSET.
Refer to Section 3. "Standard
Specifications".
for
definition
these
bits.
:55;
‘cL.
ACTUAL OFFSET [read only]
For synchronization purposes. this field contains the actual time difference between the current values of
SELECTED MASTER CODE and SELECTED TIME CODE. where:
ACTUAL OFFSET = SELECTED TIME CODE - SELECTED MASTER CODE
(Example: If Controlled Device leads MastEr Device by one minute. then the ACTUAL OFFSET is
00:01:00:00.00]
	-
	V
This offset represents the difference in frames between the slave and master positions and is aim
W-
ACTUAL OFFSET must be expressed in the range +/-12:00:00:00.00. based on the "time code
equivalence" of numbers such as 01:00:00:00.00 and +23:00:00:00.00.
04 	' 	ACTUAL OFFSET
hr
run
	so
fr 	ff
	Standard Time Specification with
subframes (type
(ff})
NOTE:
Refer to Appendix 3. "Time Code Status Implementation Tables" for exact usage of all embedded
time code status bits 3 they apply to ACTUAL OFFSET.
Refer to Section 3. "Standard Specifications". for definition of these bits.

## Page 52

LOCK DEVIATION [read only]
For synchronization purposes, this field contains the time difference between the position of the Controlled
Device's SELECTED TIME CODE and the SELECTED MASTER CODE after adjustment by the
REQUEs OFFSET:
LOCK DEVIATION = ACTUAL OFFSET - REQUESTED OFFSET
or
LOCK DEVIATION = SELECTED TIME CODE - SELECTED MASTER CODE - REQ’D OFFSET
LOCK DEVIATION is always 2 WM and must be expressed in the range
+/-12:00:00:00.00.
05 	LOCK DEVIATION
hr mn 	sc 	fr 	ff 	Standard Time Specification with subfiames (type {ff})
NOTE:
Refer to
Appendix
B.
"Time
Code Status
Implementation Tables"
for
exact
usage
all
embedded
time code status bits as they apply to LOCK DEVIATION. ‘
Refer to Section 3, "Standard Specifications", for definition of these bits.
GENERATOR TIME CODE 	[read/write]
Contains the current time code value being generated by the time code generator.
06 	GENERATOR TIME CODE
hr mn 	sc 	1": 	st: 	Standard Time Specification with status (type (52:1)
NOTE:
Refer to Appendix B, "Time Code Status Implementation Tables" for exact usage of all embedded
time code status bits as they apply to GENERATOR TIME CODE.
Refer to Section 3. "Standard Specifications", for definition of these bits.
MIDI TIME CODE INPUT 	[read only]
Contains the most recent incoming MIDI Time Code value.
0 7 	MIDI TIME CODE INPUT
hr
mn
	sc
	fr
st
	Standard
Time Specification with
status
(type
{st})
NOTE:
Refer to Appendix B, "Time Code Status Implementation Tables" for exact usage of all embedded
time code status bits
as
they apply to
MIDI TIME CODE INPUT.
Refer to Section 3, "Standard Specifications", for definition of these bits.

## Page 53

0A
OB
‘0C 	'
0D
0E
0F
2A
2B
2C
2D
2F
2F
GPO / LOCATE POINT [read/write]
General
Purpose
time
code
and
calculation
register
0.
08 	GPO / LOCATE POINT
hr run 	so 	fr 	ff 	Standard Time Specification with subframes (type {ff})
NOTES:
1.
	The
LOCATE [I/F]
command specifies that
General Purpose
register must contain
its target
location
time.
Similarly.
EVENT
command
takes
its
trigger time
from
General
Purpose
register.
Therefore,
WW
if
either
LOCATE
or the EVENT commands are to be used.
2. 	General Purpose registers may be employed to capture moving time code "on the fly" (for
example
by
MOVE'ing
SELECTED
TIME
CODE
to
GPn).
This
can
also remove the
need
for
Controller
to always
read
back
actual
time
code values. thus
facilitating
operation
in
"open
loop" mode.
Signed time code is permitted in a General Purpose register.
Refer to
Appendix
B,
"Time
Code
Status
Implementation Tables"
for
exact
usage
all
embedded
time code status bits as they apply to the General Purpose registers.
Refer to Section 3. "Standard Specifications", for definition of these bits.
3‘5”
GPl
[read/write]
GPZ 	[read/write]
GP3 	[read/write]
GP4 	[read/write]
GPS
[read/write]
GP6
[read/write]
GP7 	[read/write]
General Purpose time code and calculation registers 1 thru 7.
(See notes for General Purpose register 0)
<name> 	GP]
thru
GP7
hr mn 	sc 	fr 	ff 	Standard Time Specification with subframes (type { ff))
Short SELECTED TIME CODE 	[read only]
Short SELECTED MASTER CODE 	[read only]
Short REQUESTED OFFSET 	[read only]
Short ACTUAL OFFSET [read only]
Short LOCK DEVIA'I‘ION
[read only]
Short GENERATOR TIME CODE 	[read only]
Short
MIDI TIME
CODE
INPUT 	[read only]
Short
GPO
/ LOCATE POINT [read only]
Short
01’]
[read only]
Short
GPZ [read only]
Short GP3 [read only]
Short GP4 [read only]
Short
GPS 	[read only]
Short GP6 [read only]
Short GP7 	[read only]

## Page 54

Refer to Section 3, "Standard Specifications", for definition of "Standard Short Time Code".
In each case, refer also to the corresponding 5-byte time code Information Field for description of data
content.
<name>
	Short
time
code
Information Field
name
fr
	{st
I
ff
}
	Standard
Short
Time
Code
Specification
SIGNATURE [read only]
Dual bitmap array of (a) all Command functions and (b) all Responses/Infonnation Fields supported by the
. 	Controlled Device.
In all cases. bits are set to 1 if the corresponding functions are supported, or partially supported.
The §IGNATURE Information Field for a atrglled Device must be published by its manufacturer, using
the format shown in Note *5.
4 0 	SIGNATURE
<count=variabl
e>
	Byte count
all
subsequent
data.
*1
vi 	MMC Version implemented by the device; integer part, convened to
binary. For the current version 	vi=01.
vf
	MMC
Version
implemented by
device;
fractional part. 00
thru
99,
converted to
binary
(00-
63h).
	For current version,
	vf=00.
Va 	reserved, must be set to 00 (MMC version extension)
vb 	reserved. must be set to 00 (MMC version extension)
<coun
t_1
>
	Byte count
for
WM!
c0 	Command bitmap 0: Commands 00 thru 06: 0 	gfedcba
a = Command 00
b = Command 01
c
= Command 02
d = Command 03
e = Command 04
f = Command 05
g = Command 06
c1 	Command bitmap 01: Commands 07 thru 0D 	-
c2
	Command bitmap 02: Commands 0E thru
c3
	Command bitmap
03: Commands
thru 13
c4 	Command bitmap 18: Commands 1C thru IF: 0000 	dcba
a = command 1C
b
= command
ID
c
= Command
d
= Command
IF
C5 	Command bitmap 05: 	Commands 20 thru 26
c6
	Command bitmap 06: 	Commands 27 thru 2D
c7
	Command bitmap
O7:
Commands 2E thru
c0 	Command bitmap 08: Commands 35 thru 33
c9 	Command bitmap O9: Commands 3C thru 3F

## Page 55

* NOTES:
cl 0 	Command bitmap 10: Commands 40 thru 46
all 	Command biunap ll: Commands 47 thru 4D
c12 	Command bitmap 12: Commands 4E thru 54
CL? 	Command bitmap 13: Commands 55 thru SB
cl 4 	Command bitmap l4: Commands 5C thru 5F
cl 5 	Command bitmap 15: Commands 60 thru 66
cl 6 	Command bitmap 16: Commands 67 thru 6D
cl 7 	Command bitmap l7: Commands 6E thru 74
c1 8 	Command bitmap 17: Commands 75 thru 7B
c1 9 	Command bitmap l7: Commands 7C thru 7F
c20 	thru 	c39 	Command bitmaps 20 thru 39:
Extended commands 00 01 thru 00 7F
c4 0 	thru 	c59 	Command bitmaps 40 thru 59:
Extended commands 00 oo 01 thru 00 00 7F
<coun
t_2>
	Byte count
for
MW!
:0 	thru 	:1 .9 	Response/Infonnation Field bitmaps 00 thru 19:
Responses and Information Fields 00 thru 7F
:20 	thru 	:39 	Response/Infonnation Field bitmaps 20 thru 39:-
Extended
Responses
and
lnfonnation
Fields 00
thru
7F
:4 0 	thru 	:59 	Response/Information Field bitmaps 40 thru 59:
'
	Extended
Responses and
Information
Fields
thru
00 00 7F
The
maximum
value
far
<count>.
when both extension
sets
are
fully
supported,
is
75'.
Transmit as only many bytes in each array as are required.
Commands
and
Responses/Information Fields not included in
transmission
are assumed
to
be
unsupported.
In addition to this SIGNATURE, all devices should support the MIDI Inquiry message.
When published, the SIGNATURE will appear in the following format:
vi
	vf
	va
	vb
<count_l>
c0 	cl 	c2 	c3 	c4 	c5 	c6 	c7> 	c8 	c9
c10
	cll
	c12
	cl3 	cl4
	c15 	c16 	c17 	c18 	c19
c20
	c21
	c22
em.
<counq_2>
r0 	r1 	r2 	r3 	r4 	r5 	r6 	r7 	r8 	:9
r10 	r11 	r12 	r13 	r14 	r15 	r16 	r17 	r18 	r19
r20 	r21 	r22 	em.
(Refer also to Appendix C "Signature Table".)
All
Controlled Devices
will
show Command 	00
as
being supported, and
will
have the
capability
to correctly parse extended commands, even if none are supported.
Response
00,
on the
other hand,
will
always
be
shown
as
unsupported in
current version. 	In
future versions, the Response
	00 	bit will
be the
logical "OR" of all extended Response bits.

## Page 56

UPDATE
RATE 	[read/write]
Establishes a minimum time between repetitive UPDATE transmission cycles.
Refer to the UPDATE command description.
	UPDATE RATE
<count=01>
	Byte
count.
<interva1> 	Minimum time interval between repetitive UPDATE transmissions
expressed as a 7 bit frame count.
Default interval is one frame ( <in t erval =01 >).
RESPONSE ERROR 	[no access]
Every READ or UPDATE request for a particular Information Field must generate a response from the
Controlled
Device.
If,
however,
requested
Information Field
is:
(a)
	unsupported
by
Controlled Device.
or 	(b) 	undefined within MMC.
or 	(c) 	defined by MMC as having "no access".
then a RESPONSE ERROR message will be substituted for the expected Information Field response.
A READ command with a list ofn	" 	" different Information Fields will be treated as "rt" different requests,
all of which must be responded to. The same is true for the UPDATE command.
If desired, several unsupported Information Field names may be gathered into a single RESPONSE
ERROR message.
Although an UPDATE command would normally produce repeated Information Field responses for each
request, a RESPONSE ERROR for an unsupported request will be sent only once.
	'
RESPONSE ERROR
«man
I:
=va
ri
abl
e>, 	Byte count
(not including
command
and
count).
<name> 	Information Field
name(s)
NOTES:
1. 	A Controller can be assured that. as a result of this message. every request for data will produce
some kind of response under normal circumstances.
2. 	The following example presents a possible sequence of responses to a READ of three information
fields, two of which are unsupported by the device ("BADJ" and "BAD2"), and the third of which
is supported (" GOOD"):
Command:
F0 	71“ 	<devi ce__ ID> 	<mcc> 	<READ> 	<count=03> 	(BADl > 	<BA02> 	<GOOD> 	F7
Responses: 	,
F0 	72-" 	<devi ce_ID> 	<mcr> 	«RESPONSE 	ERROR> 	<count=01 > 	<BAD1 > 	F7
F0 	75‘ 	<devi ce_ID> 	<mcr> 	<RESPONSE 	ERROR> 	<count=01 > 	<8ADZ> 	F7
F0 	7F
<devi ce_ID>
	<mcr>
	<GOOD>
	<.
.
da
ta
. .
>
F7

## Page 57

COMMAND
ERROR 	[read
only]
This
reSponse
will
be
transmitted by
Controlled
Device:
(a) 	when
requested
by
READ
command
from
Controller;
or
	(b) 	automatically.
whenever
an
"enabled"
error
occurs.
Errors
are
"enabled"
by
setting
COMMAND
ERROR
LEVEL
Information
Field.
If
error
code
newly
detected
error
is
W
COMMAND
ERROR
LEVEL
value.
then that
error
is
enabled.
If
W,
error
is
disabled.
4 .3 	COMMAND ERROR
<count=04+ext +count_1>
Byte count
<flags> 	Error flag bits: 0 	gfedcba
a = Error Halt flag
0 = false (condition after a COMMAND ERROR
RESET. MMC RESET or power up)
1 = Error halt in effect:
Set by the occurrence of an "enabled" error.
All
commands received
after
that
which
caused the error will have been discarded;
No further
commands
will
be
processed
until
COMMAND
ERROR
RESET
is
received.
b = PROCEDURE [ASSEMBLE] error flag:
0 = false
L
=
Error
found
while
pre-checking commands
embedded in a Procedure assembly.
c = EVENT [DEFINE] error flag:
0 = false
1 = Error found while pie-checking an embedded
Event command.
d = 0
e = Unsolicited COMMAND ERROR response flag:
0 = This transmission in response to a READ .
request.
1 = This transmission unsolicited, and caused by
occurrence of an "enabled" error and the
consequent setting
Error
halt flag.
1’: Previous COMMAND ERROR transmission flag:
=
COMMAND
ERROR
field
not transmitted since
most recent error
was recorded
in
it.
(Reset to
after
each
error occurrence.)
=
COMMAND
ERROR
field (with
most recent
error) has been transmitted previously.
(Set to
whenever
COMMAND
ERROR
is
transmitted, whether unsolicited or not).
9 = 0
<1
evel>
	Current setting
COMMAND
ERROR
LEVEL Information Field.
<error> 	Error code:
00 = reserved for extensions
thru
75' (see
COMMAND ERROR CODE LIST below)
7? = No errors since power up or MMC RESET.

## Page 58

<coun t_1 > 	Byte count of following offset and command string. 	-
(For
"Receive
buffer overflow"
and
"Command
Sysex
length"
errors, or if ee = 71", set <count_l > = 00 and omit
<offset> and <command 	string>.)
<offset> 	Offset relative to the start of <command 	string> of the byte which
caused the error (<offset=00> for first byte of string).
Set to 7? if byte position is unavailable or undefined due to
the nature of the error.
<command 	string> 	Command which caused the most recent error. 	(Must be included in its
entirety. with the exception that truncation may occur where
command
is
too
large
for
the response
Sysex,
or
where
length is uncertain due to the nature of the error.):
<command name>
or 	<command name> <count> <command data>
COMMAND ERROR CODE LIST:
Error codes are classified in much the same way as are MMC commands and responses. Code 0 0 is
reserved for extensions. Properties exhibited by any particular error class will be inherited by the
corresponding extended class. For example, error codes 00 	20 thru 0 0 	31" will be classified as
IMMEDIATE OPERATIONAL ERRORS, the same as codes 20 thru 3F.
Reaction to any "enabled" error within a Controlled Device is the same, whatever the error:
Update the COMMAND ERROR Information Field;
Set the "Error halt" flag:
Automatically transmit the COMMAND ERROR field:
Discard all commands received after that which caused the error;
' Discard and do not process any funher commands until the "Error halt" flag has been
reset
(either
by
COMMAND
ERROR RESET
or
an
MMC
RESET).
Reaction to'a "disabled" error'depends on the error classification,‘and is in each case described below.
MAJOR ERRORS
= Receive
buffer
Overflow
02 = Command Sysex length error (EOX or status byte not at legal
message boundary)
03 = Command
<count>
error (inconsistent
with
Sysex
length)
04 =
Information Field
<count>
error during
WRITE
(inconsistent
with Sysex length)
05 = Illegal Group name (7?)
06 = Illegal Procedure name (71“)
0 7 = Illegal Event name (7F)
08 = Illegal name extension beyond 2nd level
(Le. 00 	00 	00 received where a "name" was expected)
09 = Segmentation
Error
(see
COMMAND SEGMENT
Command
description)
R 	in 	"i 	l"M 	RERRRi 	fllw-
Update the COMMAND ERROR Information Field (do not set the "Error halt" flag);
Discontinue all parsing of the cunent Sysex;
Do not execute any command containing an error;
Continue normal operations as soon as possible.

## Page 59

IMMEDIATE OPERATIONAL ERRORS
(Commands
embedded
within
PROCEDURE
or
an
EVENT
will
not
cause
these
errors
until the procedure or event is actually executed.) *2
20 = UPDATE list overflow
=
GROUP
buffer overflow
22 = Undefined PROCEDURE
23 = PROCEDURE buffer overflow
24 = Undefined EVENT
25 = EVENT buffer overflOw
26: Blank time code
'n 	"i 	l" 	MEDIA'I‘EPRA 	NALRR 	' 	flw'
Update the COMMAND ERROR Information Field (do not set the "Error halt" flag);
Continue parsing the current Sysex at the next message boundary;
Do not execute the command containing the error.
IMPLEMENTATION ERRORS
4 0 = Unsupported command
41 = Unrecognized sub-command
42 = Unrecognized command data
43 =
Unsupponed
Information Field
name
in
command
data area
= Unsupported
Information Field
name
in
READ or UPDATE
request
within
PROCEDURE
	.
45 = EVENT trigger source unavailable or unsupported
4 6 = Nested PROCEDURE [ASSEMBLE]
4 7 = Recursive PROCEDURE [EXECUTE]
4 8 = Nested EVENT [DEFINE]
49 = PROCEDURE [ASSEMBLE] within EVENT [DEFINE]
60 = Attempted WRITE to unsupported Information Field
61 = Attempted WRITE to Information Field which is "read only" (by
definition or implementation)
62 = Unrecognized Information Field data during WRITE
= Unsupported
Information Field
name
in Information Field
data
field during WRITE
‘n 	“i 	I"IMPLEM 	NTA 	RRi 	llw'
Update the COMMAND ERROR Information Field (do not set the "Error halt" flag);
Continue parsing the current Sysex at the next message boundary;
Do not execute the
command containing
error;
If the error is found while pre--checking commands which are embedded in a Procedure
or Event definition, then discard that definition and continue parsing at the next
message boundary AFTER the PROCEDURE [ASSEMBLE] or EVENT
[DEFINE] command itself.

## Page 60

NOTES:
1. 	After power up or an MMC RESET, the COMMAND ERROR Information Field will assume the
following
state:
<count=04>
	<flags=00>
	<1
eve].
=0 0>
	<error=
7F>
<coun
t_1 -00>
*2. 	To clarify some PROCEDURE and EVENT error handling details, consider the following
example in which an EVENT is defined within a PROCEDURE:
F0
	71-"
<devi
ce_ID>
	<mcc>
<PROCEDURE> 	<count=0A> 	<[ASSEmI-J'] > 	<procedure_name>
<EVENT> 	<count=06> 	<[DEFINEJ > 	<even t_name>
<fl
ags=0
0> 	<SELECTED
	TIME
CODE>
	<6?
6)
<RECORD 	STROBE>
F7
(a) 	If the procedure definition is longer than the available procedure memory, then a
"PROCEDURE buffer overflow" error will be generated.
(b) 	By comparison, even if the embedded EVENT definition would overflow available
EVENT space, an "EVENT buffer overflow” will not occur when the procedure is
defined. but may do so when the procedure is eventually executed.
(c) 	If 	<procedure_name> 	contained 	7Fhex, then an "Illegal Procedure name" error
would
be
generated.
(d)
	If
<even t_name>
contained
	7Fhex,
then
an
"Illegal
Event
name"
error would
be
	'
generated, and the PROCEDURE [ASSEMBLE] error flag would be set, as the error
occurred while pre-checking the EVENT command which is embedded within the
procedure.
(e) 	If register 	<GP 6> 	were not supported by the device, then an "Unsupported Information
Field
name
in
command
data area"
error
would
be
generated.
In addition, both
PROCEDURE
[ASSEMBLE]
and
EVENT
[DEFINE]
error
flags
would
be
set.
COMMAND ERROR LEVEL 	[read/write]
Command Errors are "enabled" by the setting of the COMMAND ERROR LEVEL Information Field. If
the error code of a newly detected error is 13W the COMMAND ERROR LEVEL value,
then that error is enabled. 	If Wan, the error is disabled.
The default condition, after power up or an MMC RESET, is "All errors disabled“.
44 	COMMAND ERROR LEVEL
<count=01
>
	Byte count.
vv 	Level:
00 = All errors disabled 	(Default)
01 thru 75': SeleCLive error enabling (refer to the
COMMAND
ERROR
Information Field description).
71“
=
All
errors enabled
NOTES:
1. 	An extension set error code is compared on the basis of its final (non—zero) byte only.
2. 	When operating in an "open loop" configuration. it is recommended that errors be disabled.
3. 	COMMAND ERROR LEVEL will typically be used to enable errors according to their
. classification. For example, a level of 1? will enable all "Major" errors; 21“ will enable "Major"
and "Operational" errors; etc.
4. 	Refer also to the
COMMAND ERROR Information Field
and the
COMMAND ERROR RESET
Command descriptions.

## Page 61

45 	TIME STANDARD [read/write]
Contains
nominal time
code type
to
be used
by
Controlled
Device.
No default value is specified.
4 5 	TIME STANDARD
<count=01
> 	Byte
count.
<type>
	Frame
count
encoded
as: 0
	t t
	0 0 0
0 0
ct = time type:
00 = 24 frame
01 = 25 frame
1 0 = 30 drop frame
11 = 30 frame
NOTES:
1. 	For each of the MMC time code Information Fields, this nominal setting may be overridden by
specific
occurrences.
For
example,
SELECTED
TIME
CODE
will
use
frame
rate
received by
time
code reader;
GENERATOR
TIME
CODE
may
be set
to
different
frame rate
when
new time code value is loaded; etc.
Refer
to
Appendix
B.
"Time
Code
Status
Implementation Tables"
for
usage
tt’(time
type)
bits which are embedded in each time code Information Field.
2. 	For a "clean" change of time standard, the following command sequence is recommended:
<MMC 	RESET) 	<TIME 	STANDARD> 	<count=01> 	<type>
46 	SELECTED TIME CODE SOURCE [read/write]
Selects the source of time code to be presented in the SELECTED TIME CODE lnforrnation Field.
Devices without access to time code should default to the "tape counter" selection. Otherwise,
Longitudinal Time Code (LTC) should be used as the default.
4 6 	SELECTED TIME CODE SOURCE 	_
<count=01
> 	Byte
count.
	.
53 	Source identification:
00 = Longitudinal Time Code (LTC) 	*1 *2
01 = Vertical Interval Time Code (VITC) 	*2 *3
02 = "Tape Counter" 	*2
04 = Auto VITC/LTC *2 *3 *4
_ 71" = As defined locally [write only]
NOTES:
*1. 	Local implementations
of Pilot
Tone
or
Bi-Phase
readers
should present synthesized
time code
as
Longitudinal Time Code (LTC).
*2. 	LTC, VITC and Auto VI'I‘C/LTC may be updated by Tachometer or Control Track pulses in the
absence of the selected code, for example, during fast wind modes.
*3. 	Where VI'I'C is not available. then default to LTC when either Vl'I'C or Auto VITC/LTC are
selected.
*4. 	Automatic VITC/LTC switchover characteristics are to be
determined locally.

## Page 62

SELECTED
TIME
CODE USERBITS [read
only]
Contains the userbits most
recently
extracted
from
SELECTED
TIME
CODE.
The Information Field SELECTED TIME CODE SOURCE determines the source of these userbits.
	SELECTED
TIME
CODE
USERBI’I‘S
<count=09> 	Byte count (not including command and count).
ul
	thru
	Standard
Userbits
Specification
MOTION CONTROL TALLY [read only]
Tallies: 	(a) 	the current "Motion Control State" of the Controlled Device,
and specifies its success in achieving that state,
and 	(b) 	the current "Motion Control Process" of the Controlled Device,
and specifies its success at accomplishing that process.
Motion Control
States and Processes
are
described
in
Section
"Standard
Specifications".
	MOTION
CONTROL
TALLY
<count=03+ext>
	Byte count (not including
command
and
count).
Most recently activated Motion Control State:
00 = reserved for extensions
01 = STOP
02 = PLAY
04 = FAST FORWARD
05 = REWIND
09 = PAUSE
0A = EJECT
45 = VARIABLE PLAY
4 6 = SEARCH
4 7
= SHUTTLE
4 8 = STEP
Most recently activated Motion Control Process:
00 = reserved for extensions
015 = CHASE
44 = LOCATE
7F= No MCP's currently active *1
Status and success levels: 0 	bbb 	0 	aaa
aaa = MCS Success level (see below)
bbb = MCP Success level (see below)
SS
Vl'"M 	lvl"l'rhv' 	M 	m 	n
STOP: 	000 = Transition in progress
001 = Completely stopped
01 0 = Failure
011 = Deduced motion 	*2

## Page 63

FAST FORWARD, REWIND, PLAY (unresolved):
0 0 0 = Transition in progress
0 01 == Requested motion achieved
01 0 = Failure
011 = Deduced motion *2
Resolved PLAY: 0 0 0 = Transition in progress
001 = Playing and resolved (servo lock)
01 0 = Failure
1 01 = Playing but not resolved
PAUSE: 	000 = Transition in progress
0 01 = Completely stopped
01 0 = Failure
EJECT: 	000 = Transition in progress
'
=
Media
ejected/unloaded
= Failure
VARIABLE PLAY. SEARCH. SHUTTLE:
00 0 = Transition in progress
001 = Requested motion achieved
01 0 = Failure
STEP: 	000 = Transition in progress
0 01 = STEP completed. holding position
= Failure
1 00 = STEP in progress
V
	i
	"M
	v
I
"
	h
	v
	'
	n
LOCATE: 	000: Actively locating
001: Locate complete 	transport stopped at the requested locate point
01 0: Failure
1 00 = Actively locating with Deferred Play pending ’3
=
Actively
locating
with
Deferred Variable Play pending
*4
CHASE: 	’ 	000 = Actively attempting to synchronize in play mode
001 = Successfully synchronized (play mode only)
= Failure
	'
1 00 = Actively moving and chasing the master in non-play mode (typically
high speed wind mode etc.)
1 1 0 = Parked *5
NOTES:
*1. 	The MC? command tally must return to this inactive state when the current MCP has been
terminated by receipt of an MCS command (with the exception that LOCATE will not be
terminated by DEFERRED PLAY or DEFERRED VARIABLE PLAY). It will also be the
» condition after power up or an MMC RESET.
The "MC? Success level" must always be reset to 	000 	while there are "No MCP's currently
active".

## Page 64

4A
*2.
	If
synchronizer
or
other interface
is
interposed between
Controller
and the
actual transport,
then
commands
issued
outside
that
interface
(for
example
by
operator
at
transport
itself)
may not be directly monitored by the interface, but may be successfully deduced. The deduced
motion will be reported in the MCS Command tally.
*3.
	Refer
to
DEFERRED
PLAY
command
description.
*4. 	Refer to the DEFERRED VARIABLE PLAY command description.
*5.
	Parked
status,
valid only
during
CHASE MCP,
indicates that
slave
(chasing)
machine
is
stopped
and
ready to
synchronize
with
master
device.
This
is useful
when
the master
device
has
been
LOCATE'd
to
certain
position,
and
Controller
must
ascertain
whether
or
not
slave has "caught up". The "stopped" condition is not sufficient in this case. as the slave may pass
through that state while aligning itself with the master position.
6. 	MCS and MCP commands which cause "MAJOR" or "IMPLEMENTATION" COMMAND
ERROR's must never appear in the "Most recently activated" bytes of this Information Field.
(Refer to the COMMAND ERROR Information Field for definitions of these terms).
On the other hand, an MCS or MCP command which encounters an "IMMEDIATE
OPERATIONAL" COMMAND ERROR will appear in MOTION CONTROL TALLY, but with a
"Success level" set to "Failure".
7. 	Any attempt to execute MCS or MCP commands when the most recent MCS command is EJEC'I'
will likely result in failure. Ejected media will typically require operator intervention before
normal operation can be resumed.
VELOCITY
TALLY
[read
only]
Tallies
actual transport
velocity
at
all
times,
and is
independent
prevailing Motion Control
State
and/or Process. 	'
49 	' 	VELOCITY TALLY
<count=03> 	Byte count.
sh 	em 	51 	Standard Speed Specification
STOP MODE 	[read/write]
Determines whether the Controlled Device should attempt to provide monitoring of recorded material
while stopped as a result of a STOP command.
4A 	STOP MODE '
<count=01>
	Byte count.
cc 	Mode code:
0 0 = Disable monitoring.
01 = Enable monitoring.*l
7F = As defined locally [Default/write only]
NOTES:
*1. 	With monitoring enabled, the STOP command is
effectively convened
to
PAUSE, with
exception that there is no support for the "record-pause" mode, and that recording tracks will
always exit from record.

## Page 65

4B
2. 	A Controlled Device which cannot provide monitoring while stopped need not support STOP
MODE.
3. 	' 	STOP MODE affords a Controller the opportunity to apply the STOP command universally to all
devices. assuming that STOP MODE has been set up in accordance with the operator‘s
preferences.
Changing STOP MODE will not affect a stopped condition which has already been established.
STOP MODE governs all STOP commands received explicitly from the Controller. It does not
apply to commands issued from the device's control panel. Neither does it apply to STOP
commands issued automatically timing the execution of a "Motion Control Process" (MCP), with
the exception that any MCP which leaves the device in a stopped state at the end of its processing,
must at
that
time honor
STOP
MODE
setting.
5".“
6. 	STOP MODE may be used to force V'I'R's to produce pictttre while stopped. This would also
prevent cassette-style V'I'R's from "unthreading" at each STOP command.
FAST MODE 	[read/write]
Determines whether the Controlled Device should attempt to provide monitoring of recorded material
during the execution of subsequent FAST FORWARD or REWIND commands from the Controller.
	FAST MODE
€count=01
> 	Byte
count.
cc
	Mode
code:
00 a Move at maximum velocity. without monitoring.
01 = Move at maximum velocity attainable with monitoring of
sufficient quality that recorded material is recognizable.
7?: As defined locally [Default/write only] 	'
NOTES:
1.
	A
device
need
only
support
FAST MODE
if
two monitoring
alternatives
are
in fact available
while
fast
motion
is
taking
place.
2. 	Changing this field will not affect a FAST FORWARD or REWIND operation which is already in
progress.
3. 	FAST MODE governs only those FAST FORWARD and REWIND commands received explicitly
from
Controller.
It
does
not apply
to
commands
issued
from
the device's
control
panel,
nor
does it apply to FAST FORWARD and REWIND commands issued automatically during the
execution
"Motion
Control
Process"
(MCP).
4.
	FAST MODE
may
be used
to force V'I'R's to produce picture
while winding
tape.
This
would
also prevent cassette-style
VTR's from "unthneading" before
initiating
fast
motion.
5.
	Ifa
device outputs both picture
and
audio. then
pictttre monitoring
alone must
follow
requirements
FAST MODE. Concurrent audio monitoring remains at the
discretion
'
.
	equipment manufacturer.
6.
	FAST MODE
should not
be used
to control
an
ATR's
Tape
Lifter
mechanism unless
audio outputs
can
be
restricted to comfortable listening levels. requiring
no external attenuation.
(Dynamic
lifter
control, without
regard to
output level, is
provided elsewhere in
MIDI
Machine
Control.)
A’I'R's without
capability
controlled monitoring
at
wind
speeds
should not support
FAST
MODE.

## Page 66

4C 	RECORD MODE 	[read/write]
Selects the mode of subsequent operation of the RECORD STROBE or RECORD STROBE VARIABLE
commands.
Changing this
Field
while
tracks
are
already Recording
[or
Rehearsing]
will
m1 affect
those
tracks.
4C 	RECORD MODE
<count=01
>
	Byte
count.
dd 	Mode:
. 	00 = Disabled
01 = ATRzRecord 	VTRzlnsert 	*1
02 = ATR:Record 	VTRzAssemble
04 = Rehearse
05 = ATRzRecord 	VTR2Ctash/Full Record
71-" = As selected locally [Default/write only]
"ATR:Record":
Record
onall
tracks
specified by
TRACK
RECORD
READY
Information Field.
"Rehearse":
All
monitoring
functions
mimic
those
produced by
"01
ATRzRecord/V'I'Rzlnsert"
mode
record operation. without actually erasing old material or recording new. 	*2
"VTRzlnsert":
Assumes that
recording
is to take
place on
tape
which
has
been
pre-recorded
with
Control Track
information.
The Control Track will be preserved during recording.
Clean
and
correctly timed transitions
will
be
achieved between
previously
recorded
material
and
the new material about the record punch in and punch out locations.
Recording
channels are
determined by
TRACK
RECORD
READY Information Field.
“V'l'RzAssemble”:
	.
The
Control
Track
and
all
program ghanngls
will
be
recorded upon.
‘3’4
A
clean.
correctly timed transition
will
be
achieved between
previously
recorded material
and
new
material
at the
record punch in location only,
assuming that
previously
recorded material already
exists at that location.
"VTR:Crash/Full Record":
Control Track and 31mm will be recorded upon. 	*3
No attempt
will
be
made to
achieve clean
transitions
or
to match
Control Track
timing
between
previously recorded material and new material.
NOTES:
*1 	Most recording
will
be
performed in
"01 ATR:Record/VTR:Insert" RECORD MODE.
’2.
	On
many
devices. the
delay between receipt
RECORD STROBE command and the actual
onset
rehearsing may
be
slightly different
to the
delay between
RECORD STROBE
and actual
recording.
*3. 	The TRACK RECORD READY Information Field, if supported, will not be affected by the
selection
"V'I'RzAssemble" or "VTR:Crash/Full Record" modes. 	These modes
will.
however,
override all TRACK RECORD READY settings. and force recording on all tracks plus the
Control Track.
*4. 	MMC
does not currently support
"track selectable" VTR:Asscmble mode.
5. 	VTR modes "Insert". "Assemble" and "Crash/Full Record" may be used by non-VTR devices
which employ similar Control Track schemes.

## Page 67

4E
4F
RECORD STATUS [read only]
Reflects'actual record and rehearse operations taking place at the Controlled Device.
4D
	’
	RECORD
STATUS
<count=01 > 	Byte count.
	Status:
d
c
b
aaaa
aaaa = Current Record/Rehearse activity (Hex digit):
0 = No Record/Rehearse
1 = ATR:Recording 	VTR:Insert Recording
2 = 	V'I'R:Assemble Recording *1
4 = Rehearsing
5 = 	VTR:Crash/Full Record *1
6 = Record-Pause
b = Local Record inhibit flag (1 = inhibited) 	I"2
c = Local Rehearse inhibit flag (1 = inhibited) "2
d = No Tracks Active (i.e recording or rehearsing); 	*3
Negative-OR
all
TRACK
RECORD
STATUS
bits;
Only valid when aaaa is non-zero.
NOTES:
*1. 	While RECORD STATUS indicates "VTRzAssemble Recording" or "VTR:Crash/Full Record",
the TRACK RECORD STATUS Information Field will indicate that all available tracks are
recording. 	,
’2. 	"Local inhibit" flags may be set due to operator action or due to record tab orientation in casseues
,
	or
disks
etc.
*3'5-4 	"No Tracks Active", when set to a 1 , indicates that despite the record [rehearse] status shown in
-‘v
:33“
aaaa, no tracks are actually recording [rehearsing]. Whether or not this condition can arise is
.
	device-dependent.
’
A
Controller
may choose to
ignore this
bit, or
to
interpret
condition
as
~~ 	x2 	"non-reco 	" ["non-rehearse"].
' TRACK RECORD STATUS [react only]
Contains bitmap of the tracks that are currently recording [or rehearsing]. Whether recording or rehearsing
is
tallied by
RECORD STATUS lnfon'nation Field.
In all cases. the appropriate bit is set to 1 if the track is recording [rehearsing]. Unused bits must be zero.
The Controlled Device need transmit only as many bytes of this response as are required. 	Tracks not
included in
Response
transmission
will
be
msumed
_n_Qt
to
be
recording [rehearsing].
A
Byte count
may be used if no tracks are recording [rehearsing].
4E 	TRACK RECORD STATUS
<coun t =vari abl e> 	Byte count.
r0 	r1 	r2 	. 	. 	Standard Track Bitmap (see Section 3).
TRACK RECORD READY [read/write]
A "track" is moved into a "record ready" State when its bit is set to 1 in this track bitmap.
Upon receipt of the next RECORD STROBE or RECORD STROBE VARIABLE command, if recording
or rehearsing is enabled in the RECORD MODE Information Field, tracks which are "record ready" but
are

## Page 68

not
recording
[or
rehearsing]
will
enter record
[or
rehearse],
while
tracks
which
are
recording
[rehearsing]
but
are
not
"record ready"
will
exit
record
[rehearse].
Changing this
Information
Field
will
not in
itself
cause
tracks to
enter
or
to
exit
record
[or
rehearse].
When read as a Response. the Controlled Device need transmit only as many bytes as are required. 	Tracks
not included in
Response
transmission
will
be
assumed
not
to
be
in
TRACK
RECORD
READY
state.
A Byte count of 00 may be used if no tracks are in a ready state.
W by a WRITE command, tracks not included in the transmission will be set to the W
state.
A
Byte
count
may
be
used
if
all
tracks
are
to
be
disabled.
4? 	TRACK RECORD READY
<count =vari able> 	Byte count of following bitmap.
r0 	r1 	r2 	. 	. 	Standard Track Bitmap (see Section 3).
NOTES: 	-
1. 	Before any recording or rehearsing can take place, Record or Rehearse must also be enabled in the
RECORD MODE lnfonnation Field.
2. 	TRACK RECORD READY will not be affected by the selection of "VTR:Assemble" or
"VTR:Crash/Full Record" in the RECORD MODE Information Field. These modes will,
however, override all TRACK RECORD READY settings, and force recording on all tracks plus
the Control Track.
3. 	The MASKED WRITE command may be used to change individual bits in the TRACK RECORD
READY Information Field.
GLOBAL MONITOR 	[read/write]
Selects Playback or lnputmonitor modes for all tracks.
Two playback modes are defined:
(a) 	"Synchronous" mode will be regarded as "normal" playback for a majority of devices. The term is
derived from the fact that playback signals are synchronous with any new signals being recorded;
(b) 	"Repro" mode is commonly implemented in ATR's by the use of a separate tape head optimized
for
playback
as
opposed to
recording. The physical
separation
Repro
head
from
Record
head causes the playback signal to be out of sync with signals being recorded.
GLOBAL MONITOR may be overridden on a uack by u'ack basis by the settings of the TRACK SYNC
MONITOR, TRACK INPUT MONITOR and TRACK MUTE lnfonnation Fields.
5 0 	GLOBAL MONITOR
<coun
t
=01
>
	Byte count.
dd 	Mode:
0 0 = Playback ["Synchronous"] 	(Default)
01 = Input / Full EB
02 = Playback ["Repro"] 	*2
7F = As selected locally [write only]
NOTES:
1.
	Although many ATR's regard "Repro"
as
their native playback mode, the
"Synchronous" mode
must become
default mode when the
device is addressed
by
MIDI
Machine Control. 	This
will
provide a uniform approach for all Controlled Devices.
*2.
	If
"Repro" mode is
not supported, then use
"Synchronous" playback.

## Page 69

RECORD MONITOR [read/write]
SeleCts the conditions under which track Inputs are to be monitored at their respective Outputs during
Record operations.
Applies only
to
those
tracks
selected
for
"Synchronous" playback.
Such
selections
are
made
either at
device's control panel or by writing to the GLOBAL MONITOR or TRACK SYNC MONITOR
Information Fields, if supported.
A
track
designated
for
time
code
will
not
be
affected
by
RECORD
MONITOR
setting.
51 	RECORD MONITOR
<count=01>
	Byte
count.
dd 	Mode:
00 = Record Only
= Record
or Non-Play
02 = Record or Record-Ready
75':
As
selected
locally [Default/write only]
‘ "Record Only":
All
tracks that
are
set
to
monitor
Synchronous Playback
will
monitor
Input,
only
when
recording.
Upon
conclusion
record operation,
those tracks
will
revert
back
to
Synchronous Playback.
"Record or Non-Play":
All
tracks that are
set
to
monitor
Synchronous Playback
will
monitor input
when
recording. Upon
conclusion
record operation.
those
tracks
will
revert back to Synchronous Playback.
In
addition, all Record Ready tracks will monitor Input when not in PLAY mode.
"Record or Record-Ready":
All tracks that are set to monitor Synchronous Playback, and are set to Record Ready or are
Recording, will monitor Input.
‘ 	NOTES:
1.
	RECORD
MONITOR
is
typically
applied
to
audio
tracks
only.
'- 	2 = 	Reiteration. in table form, of the three RECORD MONITOR settings:
Record 	Ready 	Record 	Ready
and 	Play 	and 	Non-play 	RECORDING
00 	Record 	Only: 	Sync 	Sync 	Input
01 	Record 	or 	Non-Play: 	Sync 	Input 	Input
02 	Record 	or 	Record-Ready: 	Input 	Input 	Input
3. 	Actual monitoring may be overridden by the TRACK INPUT MONITOR and/or TRACK MUTE
Information Fields.
TRACK SYNC MONITOR 	[read/write]
Selects individual tracks that will present "Synchronous“ playback on their respective outputs.
(Refer to the GLOBAL MONITOR Information Field for a description of "S ynchronous" playback.)
TRACK
SYNC MONITOR
will
always oven'ide the
GLOBAL MONITOR
setting
for
tracks selected,
but will itself be oven-idden by the TRACK INPUT MONITOR and TRACK MUTE Information Fields.
For any particular track, these overrides may be tabulated as follows (x="don't care"):
TRACK 	SYNC 	TRACK 	INPUT 	TRACK
MONITOR
bit
	MONITOR
bit
	MUTE
	bit
	Resultant 	monitoring
	:
	O
	As
	defined
by
	GLOBAL 	MONITOR
l 	0 	0 	"Synchronous" 	playback
x 	l 	0 	Input
x 	x 	1 	Mute
_63

## Page 70

When rad as a Response, the Controlled Device need transmit only as many bytes of TRACK SYNC
MONITOR as are required. Tracks not included in a Response transmission will be assumed net to be
individually selected for "Synchronous" playback. A Byte mum of 00 may be used if no tracks are
individually selected.
When
written
t9
by
WRITE
command,
tracks
not included
in
transmission
will
have
their
individual
TRACK SYNC MONITOR bits reset to zero. A Byte count of 00 may be used if all tracks are to be reset.
52 	TRACK
SYNC
MONITOR
<courit=vari abl e> 	Byte count of following bitmap.
r0 	r1 	r2 	. 	. 	Standard Track Bitmap (see Section 3).
NOTES:
1. 	TRACK SYNC MONITOR is intended as an adjunct to the "Repro" playback mode in the
GLOBAL MONITOR Information Field, and allows combinations of tracks in "Repro" and u'acks
in "Sync" playback. This type of functionality is traditionally associated with AIR audio ducks.
2. 	The RECORD MONITOR Information Field will further govern "Synchronous" track monitoring
during record operations.
3. 	The MASKED WRITE command may be used to change individual bits in the TRACK SYNC
MONITOR
Information
Field.
4.
	A READ or UPDATE
will
return
TRACK SYNC MONITOR
setting
only,
and
may
not
reflect
the final track monitoring configuration which results from the combination of GLOBAL
MONITOR, TRACK SYNC MONITOR, TRACK INPUT MONITOR and TRACK MUTE.
TRACK INPUT'MONITOR 	[read/write]
Selectsindividual tracks that will monitor Input signals at their respective Outputs.
TRACK INPUT MONITOR will always override both the TRACK SYNC MONITOR and GLOBAL
MONITOR Information Field settings, but will itself be overridden by the TRACK MUTE Information
Field. For any particular track. these overrides may be tabulated as follows (x="don‘t care"):
'TRACK 	SYNC 	TRACK 	INPUT 	TRACK
MONITOR
bit
	MONITOR
bit
	MUTE
	bit
	Resultant 	monitoring
	:
O 	0 	0 	As 	defined 	by 	GLOBAL 	MONITOR
l 	0 	0 	"Synchronous" 	playback
x 	1 	0 	Input
x 	x 	1 	Mute
When
me!
as a
Response. the
Controlled Device
need
transmit only
as
many bytes
TRACK INPUT
MONITOR as are required. Tracks not included in a Response transmission will be assumed mt to be
selected for individual Input monitoring. A Byte count of 00 may be used if no tracks are individually
selected.
When written
t9 by
WRITE
command, tracks not included in
transmission
will
have
their individual
TRACK INPUT MONITOR
bits
reset to zero.
A
Byte count
00 may
be used
if
all
tracks are to
be
reset.
53 	TRACK INPUT MONITOR
<count=vari able>
	Byte count
of following bitmap.
r0 	r1 	r2 	. 	. 	Standard Track Biunap (see Section 3).

## Page 71

rss
NOTES.
1. 	The MASKED WRITE command may be used to change individual bits tn the TRACK INPUT
MONITOR Information Field.
2. 	A READ or UPDATE will return the TRACK INPUT MONITOR setting only, and may not
reflect the final track monitoring configuration which results from the combination of GLOBAL
MONITOR, TRACK SYNC MONITOR, TRACK INPUT MONITOR and TRACK MUTE.
STEP
LENGTH 	[read/write]
Defines
distance
unit
used
by
STEP
Command.
The
STEP
LENGTH
is
in turn
measured
in
1/100's
time
code
frame.
54 	STEP LENGTH
<count=01> 	Byte count.
nn 	Number of frames/100 in the STEP unit.
Default value = 32hex (frame/2).
PLAY
SPEED
REFERENCE
[read/write]
Determines whether a Controlled Device should control its speed internally when in standard PLAY mode,
or allow direct play-speed control from an external source.
The contents of this field will be ignored during internal execution of CHASE or "Free Resolve" PLAY
MODE. as play-speed is then under the control of the internal synchronization procedures.
55 	PLAY SPEED REFERENCE
#5 	<count=01 > 	' 	Byte count.
4:: 	Reference:
0 0 = Internal
01 = External
7F: As selected locally [Default/write only]
FIXED SPEED 	[read/write]
Selects a nominal fixed play-speed for a Controlled Device which supports more than one speed. All other
velocity measurements will be calculated relative to this fixed speed.
5 6
	FIXED
SPEED
<count
=01 > 	Byte count.
PP
	‘
	Speed:
3F = next lower speed
4 0 = Medium, or "standar " speed
41 = next higher
speed
7F = As Selected locally [Default/write only]

## Page 72

NOTES:
1.
	If
WRITE
command contains
an
out-of-range
speed
value,
then the nearest
available
speed
will
be enabled.
	v
2. 	Speed values must be assigned contiguously.
3. 	Examples:
(a)
	A
three
speed
ATR
might
equate
3F, 40
and
with
its
Low,
Medium
and
High
speeds
respectively. When written, all values in the range 00 thru 35‘ would in fact produce
Low speed, and values 41 thru 75‘ would produce High speed.
(b) 	A VHS video deck may equate 4 0 with its normal speed, and provide 3F and 31-: as
alternative lower speeds for extended playing time.
LIFTER DEFEAT [read/write]
Defeats the tape lifter mechanism of a controlled reel-to-reel device, allowing tape contact with the heads.
5 7 	LlI-‘I'ER DEFEAT
<count=01> 	Byte count.
cc 	Control:
0 0 = No defeat (Default)
01 = Defeat
71-" = As selected locally [write only]
NOTE:
Many AT'R's will produce excessive audio monitoring levels when lifters are defeated.
CONTROL DISABLE {read/write]
When disabled,
Controlled Device
will
ignore
all
Commands
and
all WRITE's
involving
"Transport
Control" (Ctrl) and "Synchronization" (Sync) message types, whether received directly from the Controller
or as a result of Procedure or Event execution (see Section 4,1ndex List, for message type definitions). 	All
other message types will remain active.
The Controller is thereby denied any direct control of the device itself, but may continue to monitor
(READ) all Information Fields.
58 	CONTROL DISABLE
<count=01 > 	Byte count.
cc 	Control:
00 = Enable (Default)
01 = Disable 	.
7F= As selected locally [write only]
NOTES:
1.
	This Information Field
will
typically
be
implemented by synchmnizers and
other interfaces which
may
be
interposed between the
Controller
and the target device. The effect then is that the
synchronizer will disable its control outputs, leaving the target device totally free of external
control.
2. 	The CONTROL DISABLE Information Field itself will m; be disabled.

## Page 73

SA
RESOLVED PLAY MODE [read/write]
Selects the manner in which the Controlled Device establishes it's nominal fixed speed forward operation, '
when commanded
by
PLAY
command.
	RESOLVED
PLAY
MODE
<count=01
> 	Byte
count.
dd 	Mode:
00 = Normal,
not resolved
01 = Free Resolve Mode
7F:
As
selected
locally [Default/write only]
"Normal":
Achieve PLAY as defined by the PLAY SPEED REFERENCE. No relationship is implied to any
time code or other frame reference. 	‘
"Free
Resolve
Mode":
Achieve
PLAY
in
manner that resolves
frame
edges
SELECTED
TIME
CODE to
locally defined Frame Reference, data independent, maintaining resolve data independent. 	*1
NOTES:
*1. 	Future versions of the MIDI Machine Control Specification may allow selection of this Frame
Reference from. for example, a video reference signal, or simply the sync word of the incoming
SELECTED MASTER CODE.
2. 	This Information Field need not be supported by devices which are inherently self-resolving (e.g.
most V'TR's).
CHASE MODE 	[read/write]
.
Selects
manner
in which
Controlled Device
achieves,
and
maintains synchronization
between its
SELECTED TIME CODE and the SELECTED MASTER CODE, when commanded by the CHASE
command.
5A
	CHASE MODE
<courtt=01
> 	Byte
count.
dd 	Mode:
00 = Absolute Standard Mode
01 = Absolute Resolve Mode
7F = As selected locally [Default/write only]
"Absolute Standard Mode":
Achieve synchronism to the
SELECTED MASTER CODE
data dependent,
maintain synchronism
data dependent.
"Absolute
Resolve
Mode":
Achieve synchronism
to
SELECTED MASTER CODE
data dependent,
maintain synchronism
data independent.
NOTE:
Resolving, or locking "data independent", is simply a matter of synchronizing the SELECTED
TIME CODE frame edges to an appropriate master Frame Reference. The actual numeric values
of the time codes used while resolving are ignored. (Future versions of MIDI Machine Control
may allow selection of this Frame Reference from, for example, a video reference signal, or
simply
the sync word of
the incoming SELECTED MASTER CODE.)

## Page 74

5B
	GENERATOR
COMMAND
TALLY
[read
only]
Tallies
running
state
time
code
generator
<count=02>
SS
GENERATOR
COMMAND
TALLY
Byte count.
Most
recent
generator command:
00 = Stop
=
Run
=
Copy/Jam
Status
(bit:
if
status
true)
and
success
level:
0 	0
	ch
	aaa
aaa
=
Success
level:
000 = Transition in progress
001 = Successful
01 0 = Failure
22 = Loss of Time Code Source data (during Copy/Jam)
c
= Loss
External
Frame Sync Reference
5C
	GENERATOR
SET
UP
[read/write]
Controls
operating
modes
time
code
generator.
5C
<count=03+ext>
<reference>
<source>
<copy/jam>
GENERATOR
SET
UP
Byte count (not including command and count).
Generator Frame Sync References: 	0 	yyy 	0 	nnn
' mm = Frame Sync Reference for Run mode:
0 00 = Internal crystal: "Standard" mode 	‘1
001 = Locally defined eXtemal Frame 	Reference
01 0 = lntemal crystal: "Drop A" mode 	*1
011 = lntemal crystal: "Drop B" mode ’1
111 = As locally defined [write only]
yyy = Frame Sync Reference for Copy/Jam mode:
000 = Time Code Source frame edges
001 = Locally defined external Frame Reference
111 = As locally defined [write only]
Time Code Source for Copy/Jam:
0 0 = reserved for extensions
01 = SELECTED TIME CODE (Default)
02 = SELECTED MASTER CODE
7F = As locally defined [write only]
Copy/Jam mode:
0 0
=
If
Time
Code Source
copied GENERATOR
TIME CODE stops or disappears, then the
GENERATOR TIME CODE should also stop.
01 =
If
Time Code Source
the copied GENERATOR
TIME CODE
stops or disappears. then the
GENERATOR TIME CODE should continue to run
with no interruption in the number stream (also called
W mode).

## Page 75

NOTES:
*1 	Internal Crystal Rate Table:
GENERATOR
TIME
CODE
	time 	type
	(tt)
man 	24 	25 	30D? 	30
000 	(Standard) 	24 	25 	29.97 	'30
	(Drop
A) 	24
	29.97 	29.97
	(Drop
B)
	23.976 	24.975
	29.97 	29.97
2. 	Future versions of MMC may provide support for generator color framing.
5D 	GENERATOR USERBITS 	[read/write]
Contains the current userbit contents being generated by the time code generator.
SD
<count=09>
ul 	thru 	U9
GENERATOR
USERBITS
Byte count.
Standard
Userbits
Specification
‘
	‘
	5E
	Mi’DI
TIME
CODE
COMMAND
TALLY
[read
only]
Tallies the-running state of MIDI Time Code generator.
SE
<count=02>
mm
55'
MIDI TIME CODE COMMAND TALLY
Byte count.
Most recent MIDI time code command:
00 = Off
02 = Follow time code
Status: 0 	0000 	aaa
aaa = Success level:
000 = Transition in progress
001 = Successful
01 0 = Failure

## Page 76

5F 	MIDI TIME CODE SET UP 	[read/write]
Controls
operating
modes
MIDI
time
code generator.
51"
<count-02+ext>
<flags>
<SOUIC6>
NOTES:
*1
MIDI TIME CODE SET UP
Byte
count (not
including
command
and
count).
MTC
flags:
	gfedcba
a = "Transmit while stopped" flag:
0 = Inhibit MTC transmission when Time Code
Source is detected to have stopped
1 = Continue transmission when source has stopped.
with data type specified by bit b.
b = "Stopped" data type, if enabled by bit a:
0 = Quarter frame messages with no frame
incrementing.
1 = Full Messages transmitted at regular. but
unspecified, intervals.
c
= "Transmit
while
fast"
flag:
0 = Inhibit MTC transmission when Time Code
Source is detected be moving at a rate
higher than at least twice its nominal frame
rate.
1 = When source is moving faster than at least twice
its nominal frame rate. continue
transmission with data type specified by bit
d.
d = "Fast" data type, if enabled by bit c:
' 	0 = Quarter frame messages. *1
1 = Full Messages transmitted at regular, but
unspecified, intervals. ~
e = "Transmit userbits" flag:
0 = Inhibit MTC transmission of userbits.
1 = Transmit UserBits Message whenever userbits
contents change. or at regular. unspecified,
intervals.
f = MMC Response cable mute flag:
0 = MIDI Time Code, when operating, will be
transmitted on the MMC Response cable
1 = MIDI Time Code will m be transmitted on the
MMC Response cable, but may appear at
other, unspecified, MIDI Out ports.
9 = 0
Time Code Source:
= reserved
for
extensions
01 = SELECTED TIME CODE
02 =
SELECTED MASTER CODE
=
GENERATOR TIME
CODE
0 7
=
MIDI TIME
CODE
INPUT
(produces a "soft-THRU" mode)
71“: As locally defined [write only]
In order to adequately track a high speed Time Code Source, and to guarantee correct MTC
reception, these quarter frame messages should:
7O

## Page 77

(a)
	run
at the
nominal
frame
rate;
and 	(b) 	be transmitted in "bursts", where each "burst" consists of several time code
frames incrementing in a normal frame sequence.
2. 	The "time type" flags (2: t) of the transmitted MIDI Time Code will be the same as those of the
Time Code Source.
PROCEDURE RESPONSE [read only] I
Allows the Controller to read back any, or all, of the assembled Procedures. The name of the Procedure to
be read back must first be established by the PROCEDURE [SET] command.
. If the PROCEDURE [SET] command specified "set all PROCEDURES", then a separate PROCEDURE
RESPONSE will be transmitted for each Procedure currently assembled within the Controlled Device.
See also the PROCEDURE Command.
60 	PROCEDURE RESPONSE
<count=va ri abl e> 	Byte count (not including command and count).
<procedure>
	Procedure
Name
in
range
thru 75.
7? = invalid Procedure set
(i.e either
PROCEDURE [SET]
command
was
never
issued.
or
it
specified
an
undefined Procedure,
or
there
are
currently
no
Procedures
defined.)
No further data required 	(<coun t=01 >).
<command 	#1 . . > 	‘
<command 	#2 . . >
<command 	#3. .>
EVENT RESPONSE 	[read only]
Allows the Controller to read back any, or all. of the defined Events. The name of the Event to be read
back must first be established by the EVENT [SET] command. 	_
If the EVENT [SET] command specified "set all EVENTS", then a separate EVENT RESPONSE will be
transmitted
for
each
Event currently defined
within
Controlled
Device.
See also the EVENT Command.
61 	EVENT RESPONSE
<count=vari abl e> 	Byte count of following bytes.
<event>
	Event Name in
the range
00 thru
7E.
71-“
=
invalid Event
set
	.
(i.e either the EVENT [SET] command was never
issued, or it specified an undefined Event, or there
are currently no Events defined.)
No further data required (<count=01>).
<flags>
	Event control flags
(see the
EVENT [DEFINE] command
for bit
definitions.)
<t n' gger 	source>
	Information Field
name
time code stream
relative
to
which the event
is to be triggered
(see the
EVENT [DEFINE] command).
hr
mn
	sc
	fr 	ff
	Event time (type
{ff}).
<command.
.
> 	Single command plus data.

## Page 78

TRACK MUTE 	[read/write]
Selects individual tracks that will have their Output signals muted.
v
rri
	l
	h
r
m
ni
	'
mm
as a
Response,
Controlled
Device
need
transmit
only
as
many
bytes
TRACK MUTE
as
are required. Tracks not included in a Response transmission will be assumed rm to be selected for
individual muting. 	A Byte count of 00 may be used if no tracks are muted.
When written [9 by a WRITE command, tracks not included in the transmission will have their individual
TRACK MUTE bits reset to zero (track unmuted). 	A Byte count of 00 may be used if all tracks are to be
unmuted.
62 	TRACK MUTE
<count=vari
able>
	Byte
count
following
bitmap.
r0 , r1 	r2 	. ‘ . 	Standard Track Bitmap (see Section 3). 	*2
NOTES:
	.
l. 	' 	The MASKED WRITE command may be used to change individual bits in the TRACK MUTE
Information Field.
*2. 	TRACK MUTE is directed primarily at audio tracks. The "Video" bit will normally be zero.
VITC INSERT ENABLE [read/write]
Selects
whether
or not Vertical Interval Time
Code
is to
be
embedded
in
video signal
which
is
received
at the Controlled Device's video input, If that video is subsequently to berecorded. then the VITC
infomation will be recorded along with it.
VITC is derived from the Device's time code generator, and is therefore controlled also by the
GENERATOR COMMAND and the GENERATOR SET UP Information Field. 	*1
63 	VITC INSERT ENABLE
<count=03>
	Byte
count.
cc 	i 	Control:
00 = Disable
01 = Enable
71-" = As selected locally [Default/write only]
M 	First horizontal line number for VITC insertion;
OAhex thru tex NTSC
06hex
thru
Max
PAL
71" = As selected locally [Default/write only]
h2 	Second (non-adjacent) horizontal line number for VITC insertion,
where 	122 	> 	hi +1.
0Chex thru 1 4hex NTSC
08hex thru 1 6hex PAL
71-"
= As selected
locally [Default/write only]
NOTES:
*1. 	The 	<reference> 	data in the GENERATOR SET UP Information Field may be internally
overridden when VITC is enabled. as the generator must then be referenced to video.

## Page 79

RESPONSE SEGMENT 	[no access]
Allows a response (or a string of responses), which is greater in length than the maximum MMC System
Exclusive
data
field
length (48 bytes),
to
be
divided into
segments
and
transmitted piece
by
piece
across
multiple
System
Exclusives.
Responses
received
by
Controller
in
this
way
will
be
treated
exactly
as
if
they
had
arrived
all in
same sysex.
RESPONSE SEGMENT must always be the first resmnse in its sysex, and there must m n9 other
res 	nses in the 	sex 	ve th 	se which are contained within the 	of RESPONSE SEGMENTi 	If.
Segment divisions need not fall on response boundaries. Partial responses. which may occur at the end of a
RESPONSE SEGMENT sysex. must be detected by the Controller so that response processing may be
correctly resumed when the next segment arrives.
With
exception
of WAIT
or RESUME
messages,
if
non-segmented
(i.e. normal)
sysex
is
received by
a Controller when a "subsequent" segment sysex from the same Controlled Device was expected, it will be
processed
normally,
and
de-segmentation
for
that device
will
be
cancelled.
*1
Refer
to Section
"General Structure"
-
"Segmentation"
for further
explanation
and
examples.
64 	RESPONSE SEGMENT
<count=vari abl e> 	Byte count (response string segment length + I)
51' 	Segment Identification: 0 	f 	535555
f: 	1 = first segment
0 = subsequent segment
ssssss = segment number (down count, last= 0 0 0 0 0 0)
<.
.
responses.
.
> 	Response
suing
segment.
NOTE:
*1. 	A Controller must maintain separate de-segmentation processes for each of the Controlled
Devices which are attached to it.
FAILURE 	[no access]
Warns
catastrophic
failure
Controlled Device
Le. a
failure which requires local operator
intervention.
65 	FAILURE
<count>
	Byte count
(<count=0>
if
no data).
<data
	. 	.
	>
	ASCII
data
for
optional display at the
Controller (may
be
truncated to
fit display size).

## Page 80

7C
7F
WAIT 	[no access]
The WAIT Response signals the Controller that the Controlled Device's receive buffer is filling (or that the
Device is otherwise busy), and that Machine Control Command transmissions must be discontinued until
receipt of a RESUME from the Controlled Device. Any Command transmission which is currently in
progress will be allowed to proceed up to its normal End of System Exclusive (F7). Transmission of
subsequent Commands may resume after receipt of a RESUME from the Controlled Device.
The Commands WAIT and RESUME. however. are not inhibited by the WAIT Response. Neither is
transmission of the WAIT Response itself inhibited by receipt of a WAIT Command.
A Controller must guarantee:
(i)
	to
recognize
receipt
WAIT
message
within
MW
after
arrival
the End of System Exclusive (F7) of that WAIT message;
and 	(ii) 	to then halt all transmissions at the next available MMC System Exclusive boundary
(up to 53 bytes. the maximum MMC sysex length. may therefore have to be
transmitted before the hall can take effect).
The WAIT Response is transmitted as the only response in its Sysex
i.e. 	F0 	7F 	<devi ce_ID> 	<mcr> 	<WAIT> F7.
70 	WAIT
NOTES:
1. 	Correct operation of the WAIT response requires a certain minimum size for the MIDI receive
buffer in the Controlled Device. Refer to Appendix E, "Determination of Receive Buffer Size".
2.
	Additional WAIT
responses
may
be
transmitted
by
Controlled Device
should
its receive
buffer
continue to fill.
RESUME 	[no access]
Signal to the Controller that the Controlled Device is ready to receive Machine Control Commands. The
default (power up) state is "ready to receive".
The
RESUME
Response
is used
primarily
to
allow
Controller
to
resume transmissions
after
WAIT.
Transmission of the RESUME Response is m inhibited by the receipt of a WAIT Command.
The RESUME Response is transmitted as the only response in its Sysex
i.e. 	F0 	71’ 	<device__ID> 	<mcr> 	<RE$UME> 	F7.
71-"
	'
	RESUME

## Page 81

Appendix
	A 	EXAMPLES
EXAMPLE 	1
A very basic tape transport has been manufactured which supports the Commands: 	<STOP>
<DEFERRED 	PLAY> 	<FAST 	FORWARD) 	<REWIND> 	<RECORD 	STROBE> 	(RECORD 	EXIT>
<MMC
RESET)
	<WRITE> 	<LOCATE>
	<MOVE>;
and the
Information
Fields:
	<SELECTED
	TIME
CODE>
<GPO/LOCATE
POINT>.
The manufacturer has published the device's SIGNATURE: 	01 	00 	00 	00
0C
	00 	00
	00 	00
1 l 	20
02 	02
Communication
is
in
"open
loop"
mode
only.
The transport
accepts
commands at its
MIDI
In
port,
but
provides
no
responses
at its
MIDI
Out. The machine‘s
device_ID
is
dipswitch
selectable, and
has
been set
to
hex.
The following command sequence is typical of "open loop" style MMC operation:
Play:
F0 	7F 	01 	<mcc> 	<DEFERRED 	PLAY> 	F7
Stop:
F0 	7F 	01 	<mcc> 	<STOP> 	F7
Reset 'counter' to all zeroes, 30 frame:
F0 	7F 	01 	<mcc> 	<WRITE> 	<count=06> 	<SELECTED 	TIME 	CODE> 	60 	00 	00 	20 	00 	F7
Fast forward:
F0 	7F 	01 	<mcc> 	<FAST 	FORWARD) 	F7
Stop:
F0 	7F 	01 	<mcc> 	<STOP> 	F7
Establish a locate point:
F0 	7F 	01 	<mcc> 	<MOVE> 	<count=02> 	<GPO/LOCATE 	POINT> 	<SELECTED 	TIME 	CODE> 	F7
Play:
F0 	7F 	01 	<mcc> 	<DEFERRED-PLAY> 	F7
Punch into record:
F0 	7F 	01 	<mcc> 	<RECORD 	STROBE> 	F7
Punch out of record:
F0
	7F
	<mcc>
	<RECORD
EXIT> 	F7
Return to locate point
and
play:
F0
	7F 	01
	<mcc>
<LOCATE> 	<count=02> 	<[I/F]> 	<GPO/LOCATE 	POINT> 	<DEFERRED 	PLAY>
F7
RetumtoZero:
F0
	71-"
	01 	<mcc> 	<LOCATE>
	<count=06> 	<[TARGET]> 	60 	00 	00 	00 	00 	F7

## Page 82

EXAMPLE 2
MIDI
Machine
Control
and
MIDI
Time
Code
are
combined
in
this
two
part example.
Control
single device
by
a computer based Sequencer will typically follow one of these formats.
Ex
m
	2A' 	w'
	'
	v
|
	MMC
Commands
	l	l 	I
|
	|
-------------------------------
>|
	I
l
	Sequencer
	|
	.
	I
	Controlled
	l
l
	l
	MTC
	l
	|
	I
	Device
	I
|
	l<
---------
|
	Time
Code
	l<
-------
|
	I
|
	l
	.
	l
	->
MTC
	l
	Time
	I
	|
|
	Converter
	l
	Code
	.
l
The unusual feature of this hook up is that the Sequencer knows the exact tape time code position of the Controlled
Device (via MTC), whereas the device itself does not. In most cases. the device will rely on tachometer pulses to
update its internal 	<SELECTED 	TIME 	CODE> 	register.
MMC
communication
is
once again in
"open
loop"
mode
only.
The transport
is
identical
to that
Example
I,
and
accepts
commands at
its
MIDI
In port while providing
no
responses
at
its
MIDI
Out.
Its.
device_ID
has
been
set
to 01hex. Commands from the Sequencer to the device will be shown towards the left side of the page, and MIDI
Time
Code
from
Converter
towards
right.
The
Sequencer
is assumed
to'be
operated using
mouse and
keyboard.
' 	The Sequencer always- issues an MMC Reset at the beginning of the session:
F0
	71-“
	<mcc>
	<MMC
RESET>
F7
	’
The operator clicks the "Remote Machine PLAY" button on the Sequencer
screen.
As
the Sequencer supports the
convention that this button may also be
used to punch out of record, it transmits the following message:
F0 	71-" 	01 	<mcc> 	<RECORD 	EXIT> 	<DEFERRED 	PLA to 	F7
The Sequencer begins interpreting MIDI Time Code. After a short stabilization
period. frame 01:02:03:04
(3O
frames/sec,
non-drop)
is
received:
F1 	04 	. 	. 	Fl 	10 	. 	. 	Fl 	23 	. 	. 	F1 	30 	.
Fl 	42 	. 	. 	Fl 	50 	. 	. 	F1 	61 	. 	. 	F1 	76 	.
F1 	06 	.
Immediately after receiving the frames digit of the next two-frame MTC
"wor 	the Sequencer forces the current MTC time back into the Controlled
Device's time code register:
F0 	7F 	01 	<mcc> 	<WRITE> 	<count=06>
<5ELECTED 	TIME
CODE> 	61
	02 	03
F7
The operator clicks "Remote Machine RECORD". The Sequencer
internally
saves the current MTC time (01:02:13z20), and sends the command:
F0
	71“ 	01
	<mcc>
	<RECORD 	STROBE> 	F7

## Page 83

Operator
clicks
"Remote Machine
PLAY"
to
punch
out
record:
F0
	7F
	<mcc>
	<RECORD
EXIT>
	<DEFERRED
PLAY> 	F7
Operator clicks "Remote Machine STOP":
F0 	71“ 	01 	<mcc> 	<STOP> 	F7
Operator requests that the Sequencer review the material recorded on the
Remote Machine. The Sequencer locates the device to 01:02:08:20, five
seconds prior to the previously stored record punch in point:
F0 	7? 	01 	<mcc>
<LOCATE>
	<count=06>
	<[TARGETJ>
	02 	08
<DEFERRED 	PLAY>
F7
NOTES:
1.
	There
will
usually
be
some
drift
between
MIDI
Time
Code
and the
tachometer updated values
maintained
by
device. The extent
this
drift
will
depend
not
only
on
mechanical
condition
device. but
also on the possibility that the time code has been recorded slightly "off-speed".
In
order to minimize
effect
drift,
Sequencer may, at
regular intervals, force
most recently
received
MIDI
Time
Code
back
into
device's
	<SELECTED
	TIME
CODE>
register.
Care
should
be
exercised so that only valid and current time code values are used.
2.
	Despite taking
above
precaution.
some
positioning
errors
during
execution
LOCATE
command
may be unavoidable.
3. 	Using the EVENT command to punch in and out of record may be problematic when the device is
operating from tach pulses only.
|
	MMC
Commands.
	I
|
-------------------------------
>l
|
I 	.
l 	Sequencer 	' 	I 	l 	Controlled
I 	| 	MTC 	(and 	MC 	Responses) 	*3 	| 	Device
l
	|<
-------------------------------
l
	*2
I
This example
represents
considerable
improvement over example
2A.
Here
device
itself
performs
time
code to MTC conversion, and therefore has access to exact time code positioning information.
Commands from the controller to the device will be shown towards the left side of the page, and Responses and
MIDI
Time
Code from
device towards the
right. The
Controlled Device conforms to Guideline Minimum
Set
#3, with the addition of MIDI Time de command and information fields. 	Its device_ID is shown as 	<1 dent).
The Sequencer always
issues an
MMC
Reset at the
beginning
the session:
F0 	7F
<ident>
	<mcc>
	<MMC
RESET>
F7
It then checks the device’s capabilities:
F0 	7F
<ident>
	<mcc> 	<READ>
	<count=01>
	<SIGNATURE> 	F7

## Page 84

The machine replies:
F0
	71-"
<ident>
<mcr>
<SIGNATURE>
<count=2E>
	00 	00 	00
<count_1 =1 4>
7F 	61 	00 	00 	00 	00 	00 	00 	00 	00
7F 	70 	7F 	00 	00 	00 	00 	00 	00 	09
<count_2=1 4>
02 	1E 	00 	00 	00 	02 	13 	00 	00 	00
3F 	62 	07 	01 	0C 	37 	00 	00 	00 	09
F7
The Sequencer sets the Command Error Level for "Major" and "Immediate
Operational" errors only, and sets up the MIDI Time Code generator/converter:
F0 	71-“ 	<ident> 	<mcc>
<WRITE>
	«want-03>
(COMMAND
ERROR
LEVEL>
	<count=01>
3F
<WRITE>
	<count=04>
<MIDI 	TIME 	CODE 	SET 	UP> 	<count=02>
	<SELECTED
	TIME
CODE>
F7
The operator requests Play. 	The Sequencer also requests that MIDI Time Code
be turned on:
F0 	7F 	<1 dent> 	<mcc>
<RECORD
EXIT)
	<PLAY>
(MIDI
	TIME
CODE 	COMMAND>
	<count-01>
F7
MIDI Time Code 03:02:20z28 (drop frame) arrives at the Sequencer's MIDI In:
F1 	0C 	. 	. 	El 	11 	. 	. 	F1 	24 	. 	. 	F1 	31
F1 	42 	. 	. 	F1 	50 	. 	. 	F1 	63 	. 	. 	F1 	74 	. 	.
The Sequencer checks that the device's internal copy of the current time code is
in fact
the same
as
received
MTC:
F0 	71“ 	<ident> 	<mcc>
<READ? 	<count-01> 	<SELECTED 	TIME 	CODE»
F7
The device responds in the middle of the MTC frame 03:02:21:00~01:
F1 	00
	.
	.
	Fl
	.
	.
	F1
	. 	.
	Fl
F1 	42 	. 	.
F0
	7F
<i dent>
	<mcr>
<SELECTED
	TIME
CODE)
	43 	02 	15 	21 	00
F7
» 	. 	. 	F1 	50 	. 	. 	F1 	63 	. 	. 	F1 	74 	. 	.
The operator "marks" on the fly a record punch in time of 03:02:27z08, which
the Sequencer saves internally.
Some time later, the operator marks a record out point of 03:02:41: 15, which the
Sequencer also saves.

## Page 85

The operator then requests that the Sequencer rewind the transport and put it
into record between the marked punch in and punch out points. RecOrding is to
occur
on tracks
and
only.
The
Sequencer
initiates
locate
action,
with
MIDI
Time
Code
turned
off,
and
monitors MOTION CONTROL TALLY until the locate is complete:
F0
	7F
<ident>
	<mcc>
<MTDI
	TIME
CODE
COMMAND)
	<count=01>
<LOCATE>
	<count=06>
	<[TARGET]
>
l
<UPDATE> 	<count=02>
<[BEGIN]>
	<MOTION
CONTROL
	TALLY>
F7
The device responds immediately, showing that locating has begun in the
reverse (rewind) direction:
F0
	7?
<ident>
	<mcr>
	V
<MOTION 	CONTROL 	TALLY> 	<count=03>
<REWIND> 	<LOCATE> 	01
F7
The device may pass through several different stages in the course of the locate:
F0 	7F 	<ident> 	<mcr>
<MOTION 	CONTROL 	TALLY) 	<count=03>
<EAST
FORWARD>
	<LOCATE>
F7
F0 	7F 	<ident> 	<mcr>
<MOT1'ON 	CONTROL 	TALLY> 	<count=03>
(EAST 	FORWARD> 	<LOCATE> 	01
F7
F0
	71-"
<ident>
	<mcr>
	_
(MOTION 	CONTROL 	TALLY> 	<count=03>
<STOP> 	<LOCATE> 	00
F7
F0
	75'
<ident>
	<mcr>
<MOTION 	CONTROL 	IALLY) 	<count=03>
<STOP> 	<LOCATE> 	11
F7
After receiving the above "Locate complete" tally, the Sequencer ceases
monitoring MOTION CONTROL TALLY, and then checks that the device ha
indeed located to the correct position:
F0
	7F
	<ident>
	<mcc>
<UPDATE>
	<count=02> 	<[END]>
	7F
<READ>
	<count=01>
	<SELECTED 	TIME
CODE>
F7
79,

## Page 86

The device's response, although representing a locate error of three frames, is
deemed by the Sequencer to be satisfactory.
F0
	7F
<i
dent>
	<mcr>
(SELECTED 	TIME
CODE>
	16 	25
F7
The Sequencer now sets up all subsequent record activities, and chooses to
monitor the RECORD STATUS information field in order to update its screen
display:
F0
	7F
<ident>
	<mcc>
<WRI TE> 	<count=0F>
<TRACK
RECORD
READY>
	<count=01>
<GP1>
	43 	02
	IE
	08 	00
<GP2>
	43 	02
	0F 	00
	'
<EVENT> 	<count=06> 	<[DEFINE] > 	<event #=01 >
<flag5=00> 	<SELECTED 	TIME 	CODE> 	<GP1>
(RECORD 	STROBE>
<EVENT> 	<count=06> 	<[DEFINE] > 	<event#=02>
<flags=00> 	<SELECTED 	TIME 	CODE> 	<GP2>
<RECORD 	EXIT>
<UPDATE> 	<COunt=02> 	<[BEGIN]> 	<RECORD 	STATUS>
F7
The device immediately returns RECORD STATUS ("not recording"):
F0 	7F 	<ident> 	<mcr> 	(RECORD 	STATUS> 	<count=01> 	00 	F7
Finally, a Play command is issued.» with MIDI Time Code tnmed on:
'
F0
	71-"
<i
dent>
	<mcc>
<PLAY>
<MIDI 	TIME 	CODE 	COMMAND> 	<count=01> 	02
F7
At
record punch
in
point
(03:02:27:08),
device inserts
"recording"
status
between MTC messages: 	*1
Fl
	.
F0 	7F 	<ident> 	<mcr>
<RECORD 	STATUS> 	<count=01> 	01
F7
F110. 	.FlZB..F131
F1
	. 	.
	F1
	.
	.
	Fl
	.
	.
	F1
Similarly, "not recording"
is
returned at
punch out
point
(03:02:41215): 	*1
F1 	0E 	. 	. 	Fl 	10 	. 	. 	Fl 	29 	. 	. 	Fl 	31
F1 	42
F0
	7F
<i dent>
	<mcr>
<RECORD
STATUS)
	<count=01>
F7
F1
	. 	.
	Fl
	.
	.
	F1

## Page 87

At the conclusion of recording, the transport is stopped. MIDI Time Code is
turned off, as is monitoring of RECORD STATUS. and all necks are returned to
the "record not ready” state:
F0
	7?
<1
dent>
	<mcc>
<5
TOP>
<MIDI
	TIME
CODE
COWD>
	<count=01>
<UPDATE> 	<count-02> 	<[END] > 	7F
<WRITE> 	<count=02>
<TRACK 	RECORD 	READY) 	<count-00>
F
NOTES:
*1
	Although
it
is
essentially
responsibility
Controller
(Sequencer)
to
keep
MIDI
response
line
free
traffic
during
those
periods
when
MTC timing
is
critical,
an
intelligent Controlled
Device
will
make
every attempt to prevent MMC Responses from causing jitter in the MTC messages.
*2.
	Whole
systems
machines
could
be
operated
using this
configuration.
An intelligent
translator
would
be
required which would represent such a system as a single virtual machine.
*3.
	An
additional
MIDI
In
port
at
Sequencer
would
make
possible operations
similar
to
this example
while
using
an
external
Time
Code to
MTC
converter.
Control
over
MTC
generation
would
be
lost
however.
and
the device would still need to be equipped with an internal time code reader.
I
	MMC
Commands
	|	I 	l
l
	I
-------------------------------
>l
	I
I 	Sequencer 	l 	' 	. 	| 	Controlled 	I
I 	I 	MMC 	Responses 	l 	Device 	l
I 	l< ------------------------------- l 	I
l 	“3" 	I 	| 	l
I,“
	I
	MTC
	l
	I
	l.
	I
‘ I 	I< --------- I 	Time 	Code 	l< ------- I 	I
I
	l
	I
	->
MTC
	I
	Time
	I
	I
| 	Converter 	|
|

## Page 88

EXAMPLE 3
This example represents a far more complex situation than the previous two. The controlled devices are two
identical synchronizers (or tape transports with embedded synchronizers), and the controller is capable of initiating
some basic automated "edit" sequences. as well as displaying time code and other transport related status.
Communications are "closed loop". The controller's MIDI Out is fed to the MIDI In of both devices, using one
device's MIDI Thru. The MIDI Outputs from the two devices are fed to separate MIDI Inputs at the controller.
One of the devices has been designated as the "Master" for synchronization purposes, and its device_ID has been set
to Olhex. The other device, the "Slave", has a device_ID of 02hex. All actions associated with assigning this
Master, and the associated routing of "Master Time Code" to the Slave synchronizer, are assumed to have taken
place at the devices themselves, and are not in this instance the concern of the MIDI system.
Each device supports the following Commands:
(STOP> 	(PLAY> 	(DEFERRED 	PLAY> 	<EA$T 	FORWARD> 	<REWIND> 	(RECORD 	STROBE>
(RECORD 	EXIT> 	<CHASE> 	<COMMAND 	ERROR 	RESET> 	<MMC 	RESET> 	<WRITE> 	(READ)
(UPDATE> 	<LOCATE> 	<VARIABLE 	PLAY) 	<MOVE> 	<ADD> 	(SUBTRACT> 	<DROP 	FRAME 	ADJUST>
(PROCEDURE> 	<EVENT> 	<GROUP> 	(COMMAND 	SEGMENT> 	<DEFERRED 	VARIABLE 	PLAY> 	(WAIT)
(RESUME>
Each device supports the following Responses/Information Fields:
(SELECTED 	TIME 	CODE) 	<SELECTED 	MASTER 	CODE> 	<REQUESTED 	OFFSET> 	<ACTUAL 	OFFSET)
(LOCK 	DEVIATION> 	<GPO/LOCATE 	POINT> 	<GP1> 	<GP2> 	<GP3> 	(Short 	time 	codes>
<$IGNATURE> 	<UPDATE 	RATE> 	<RESPONSE 	ERROR> 	<COMMAND 	ERROR>
<COMMAND 	ERROR 	LEVEL) 	<TIME 	STANDARD> 	<MOTION 	CONTROL 	£ALLY> 	(RECORD 	MODE>
(RECORD
SflATUS>
	<CONTROL
DISABLE>
	(RESOLVED
PLAY
MODE>
	(CHASE
MODE>
<PROCEDURE 	RESPONSE) 	<EVENT 	RESPONSE> 	(RESPONSE 	SEGMENT> 	(RAILURE> 	(WAIT>
<RESUME>
The
published
SIGNATURE
for
each
device
is
as
follows:
01 	00 	00 	00
14'
7F 	71 	00 	00 	00 	00 	00 	00 	00 	00
3D 	60 	7F 	00 	00 	00 	00 	00 	00 	09
35 	1E 	00 	00 	00 	3E 	13 	00 	00 	00
3F 	62 	00 	38 	00 	33 	00 	00 	00 	09
Commands from the controller to the devices will be shown towards the left side of the page. and Responses from
the devices towards the right. Master and Slave Responses are distinguished by their respective device_lD's (third
byte of the Sysex).
The
control
methods shown
here are
constructed
mainly
to demonstrate the
power
and
flexibility of MIDI
Machine
Control. and certainly do not represent the only, or even the best, approach to the task.
The
Controller first
clears
all previous settings, and establishes
group consisting
both the master and slave:
F0
	71-"
<a1
—ca.ll=7z='> 	<mcc>
(MMC 	RESET>
<GROUP> 	<count=04> 	<[ASSIGN]> 	<group=7C> 	01 	02
F7

## Page 89

The
Controller
sets
30 frame
time
standard
in
both devices.
and enables
all
command
errors:
F0 	71-" 	<group= 7C> 	<mcc>
<WRITE> 	<count=06>
<TIME
STANDARD>
	<count=01>
<COMMAND 	ERROR 	LEVEL> 	<count-01> 	<all=7F>
F7
	.
The
operator initiates
Play
on the
Master
and then on the
Slave.
(Note that this is not yet a CHASE operation): ,
F0
	75'
<master=01>
	<mcc> 	<PLAY>
F7
F0
	75‘
<51
ave=02>
	<mcc> 	<PLAY>
F7
The
Controller
requests
continuous updating
both
time
codes and
motion
tallies
from
both devices:
F0 	7F 	<group=7C> 	<mcc>
<UPDATE>
<count=03> 	<[BEGIN]>
(SELECTED 	TIME 	CODE)
<MOTION
CONTROL
TALLY)
F7
Both master and slave respond with full 5 byte time code and tallies:
Master is PLAYing at 00:22:05: 12 (00: 16:05:0C hex).
Slave is PLAYing at 10:01:58z28 (0A:01:3A:1C hex).
F0 	71“ 	<master=01> 	<mcr>
<SELECTED
	TIME
CODE>
	05 	2C 	00
	“
<MOTION
CONTROL
	TALLY)
<count=03>
	<PLAY> 	7F
	01'
F7
F0 	7? 	<slave=02> 	<mcr>
<SELECTED 	TIME 	CODE> 	6A 	01 	3A 	3C 	00
<MOTION
CONTROL
	TALLY)
	<count=03>
	<PLAY> 	7F
F7
The next time
code
from
the master
(00:22:05:
13) is
in "short" form,
as
only
frames have changed. There has been no change at all in the MOTION 	'
CONTROL TALLY:
F0
	7F
<master=01>
	<mcr>
<Short 	SELECTED 	TIME 	CODE> 	2D 	00
F7
Next slave code (10:01:58z29):
F0
	71-"
<slave=02>
	<mcr>
(Short 	SELECTED 	TIME 	CODE> 	3D 	00
F7
\
More master (00:22:05: 14) and slave (10:01:59200) times . . notice that the slave
has seen a change in its "seconds", and has transmitted the entire 5 bytes of time
code:
F0 	7F
<master=01> 	<mcr>
<5):
ort
	SELECTED 	TIME
CODE> 	25‘
	0 0
F7

## Page 90

F0
	7F
<slave=02>
	<mcr>
<SELECTED
	TIME
CODE> 	6A
	3B
F7
If the Controller's buffer were now filling up, it would transmit a WAIT request:
F0
	7F
<all
-call=
7F)
	<mcc> 	<WAIT>
F7
Buffer clear:
(all uansmissions halted)
F0 	7F 	<all-Call=7F> 	<mCC> 	<RESUME> 	F7
Operator
Stops the master:
F0
	7F
<master=01>
	<mcc>
Operator
Stops the slave:
More master (00:22:05: 16) and slave (10:01:59:02) time codes:
F0 	71-" 	<master=01> 	<mcr>
<Short 	SELECTED 	TIME 	CODE> 	30 	00
F7
F0 	7F 	<slave=02> 	<mcr>
<Short
	SELECTED
	TIME
CODE>
F7
<STOP>
F7
The master tally changes to reflecta "stopped" condition:
F0
	7F
<master=01>
	<mcr>
<MOTION
CONTROL
	TALLY>
	<count=03>
	<STOP>
	7F
F7
More slave time code (10:01:59:03):
F0
	71-"
<slave=02>
	<mcr>
(Short
	SELECTED
	TIME
CODE>
F7
Slave at 10:01:59204:
F0 	7F
<slave=02>
	<mcr>
<Short 	SELECTED 	TIME 	CODE> 	24 	00
F7
F0
	7F
	<51ave=02>
	<mcc>
	<STOP>
F7
The slave tally shows "stopped":
F0 	7F
<slave=02> 	<mcr>
<MOTION 	CONTROL
	TALLY) 	<count=03>
	<STOP> 	7F 	01
F7

## Page 91

Operator
requests
that
current difference
between
master
and
slave
positions become the slave's synchronization offset:
F0
	75'
<slave=02>
	<mcc>
<MOVE> 	<count=02>
<REQUESTED 	OFFSET> 	<ACTUAL 	OFFSET>
F7
The Controller reads back the offset for display purposes:
F0 	7F 	<slave-02> 	<mcc>
<READ> 	<count=01 > 	<REQUESTED 	OFFSET>
F7
The slave responds with an offset of 09:39:53:18.00 (09:27:35:12.00 hex):
F0 	7F 	<slave-02> 	<mcr>
<REQUESTED 	OFFSET> 	69 	27 	35 	12 	00
F7
Operator pushes the "slave chase" button:
F0
	7F
<slave=02>
	<mcc>
	<CHASE>
F7
The
slave
tally
adjusts,
showing
chase
mode.
"stopped"
and
"parked"
status:
F0
	7? 	<51
ave-02>
	<mcr>
	'
<MOTION
CONTROL
	TALLY>
	<Count=03>
	<STOP>
	<CflA$E>
F7
OperatorPlays the master (slave follows):
F0 	7F 	<master=01> 	<mcc> 	<PLAY> 	F7
Master (00:22:05z24)
and
slave
(10:01:59:09) return
new
tallies
and
time
codes.
The slave begins its synchronization process:
F0 	7F 	<master=01> 	<mcr>
(Short 	SELECTED 	TIME 	CODE> 	38 	00
<MOTION
CONTROL
	TALLY)
	<count=03>
	<PLAY> 	7F
F7 	'
F0
	7F
<slave=02>
	<mcr>
(Short
	SELECTED
	TIME
CODE>
<MOTION
CONTROL
	TALLY>
	<count=03>
	<PLAY>
	<CHASE> 	01
F7
The operator chooses to observe the slave lock deviation (error) while
synchronization is taking place:
F0
	71-“
<slave=02>
	<mcc>
<UPDATE> 	<count=02> 	<[BEGIN]> 	<LOCK 	DEVIATION>
F7
The slave obliges (deviation = +5.02 frames):
F0 	7F
<slave=02> 	<mcr>
<LOCK
DEVIATION)
	60 	00 	00 	05 	02
F7

## Page 92

More master Lime (00:22:05:25):
F0
	71-"
<master=01>
	<mcr>
<Short 	SELECTED 	TIME 	CODE> 	39 	00
F7
Slave time (10:01:59:10) and deviation (-1.17 frames), not yet synchronized:
F0 	7F 	<51 ave=02> 	<mcr>
<Short
	SELECTED
	TIME
CODE>
2A 	00
<Short 	LOCK 	DEVIATION> 	41 	17
F7
	'
Slave time (10:02:01200), deviation and tally (synchronization achieved):
F0
	7?
<slave=02>
	<mcr>
	,
<SELECTED
	TIME
CODE> 	6A
<Short
	LOCK
DEVIATION)
	00 	00
	.
<MOTION
CONTROL
	TALLY>
	<count=03>
	<PLAY>
	<CHASE>
F7
Wi 	M 	rinl 	h 	lv 	nhrniz 	rnwwih
. 	. 	. 	in 	R 	.
in‘Th 	lr 	rinwill 	rfrm 	nh 	Ivmhin
rmi 	in 	nw 	hlnlhwinifi 	DATER 	n
Operator marks an "IN" point. The Controller captures the current time code by
moving it into the GP] general purpose register/in both the master and slave
machines using the group device__ID:
F0
	7F
<group=7C>
	<mcc>
<MOVE> 	<count=02> 	<GP1> 	<$ELECTED 	TIME 	CODE>
F7
Some time later, the operator marks an "OUT" point, and the Controller captures
to the 6P2 register:
F0
	7F
<group=7C>
	<mcc>
	V
<MOVE> 	<count=02> 	<GP2> 	<SELECTED 	TIME 	CODE)
F7
Th 	r n w 	h 	" 	i " 	rf rm 	to 	i 	l
The
Controller
sets
up events in
slave to punch
into
record at
time in
GP], and to punch out at time 0P2. Both events are to be deleted after being
triggered, and both are to be triggered only by forward motion play-speed time
code.

## Page 93

The Controller also sets the slave‘s record mode and requests an automatic
update of record status:
F0
	71-“
<51ave=02>
	<mcc>
<EVENT> 	<count=06> 	<[DEFINE]> 	<event=¥01>
(flags=00> 	(SELECTED 	TIME 	CODE) 	(GPl)
(RECORD 	STROEE)
<EVENT>
	<count=06>
	<[DEFINE]>
	<event-#02>
(flags=00> 	(SELECTED 	TIME 	CODE) 	(GP2)
(RECORD 	EXIT)
<WRITE> 	<count=03> 	(RECORD 	MODE) 	<count=01> 	01
(UPDATE) 	(count=02> 	([BEGINJ) 	(RECORD 	STATUS)
F7
The slave immediately returns its current (non) record status:
F0 	7?
<slave=02>
<mcr>
(RECORD 	STATUS) 	<count=01> 	00
F7
Next, the Controller sets up the master to (a) locate to a "preroll" point 5
seconds before the record punch in point in GP! (GPO is employed for the
calculation); and (b) trigger an event to cause an automatic stop when the master
reaches a point 2 seconds beyond the punch out point in GPZ (the trigger point
is'set up in 6P3).
F0 	7? 	<master=01 > 	<mcc>
(WRITE)
	<count=06>
	(GPO/LOCATE
POINT)
	60 	00 	05 	00 	00
(SUBTRACT> 	<count=03> 	(GPO/LOCATE 	POINT) 	(GPl) 	(GPO/LOCATE 	POINT)
(LOCATE) 	(count=02> 	([I/F]> 	(GPO/LOCATE 	POINT)
(WRITE)
	<count=06>
	<GP3)
	60 	00
	02 	00 	00
(ADD; 	<count=03> 	<GP3> 	<GP3> 	<GP2>
(EVENT) 	<count=0 6) 	([DEFINE] > 	(event=#01 >
(f1ags=10) 	(SELECTED 	TIME 	CODE) 	(6P3)
<STOP>
F7
In addition to time codes and slave lock deviation, the following master and
slave motion tallies will have been returned, indicating that the master is 	'
locating with the slave chasing:
F0 	7F 	<master=01 > 	<mcr>
(MOTION
CONTROL
	TALLY)
	(count=03>
(REWIND) 	(LOCATE)
F7
F0 	7?
<51ave=02> 	<mcr>
(MOTION
CONTROL
	TALLY)
	<count=03>
(REWIND) 	(CHASE)
F7

## Page 94

Eventually the master will finish locating. but the slave may still be active:
F0
	75'
<master=01>
	<mcr>
(MOTION 	CONTROL 	TALLY> 	<count-03>
<STOP>
	<LOCATE> 	11
F7
F0
	7F
<slave=02>
	<mcr>
(MOTION 	CONTROL 	TALLY> 	<count=03>
<REWIND> 	<CHASE> 	41
F7
Finally. the slave parks with the master:
F0
	7F
<slave=02>
	<mcr>
<MOTION 	CONTROL 	TALLY) 	<count=03>
<STOP> 	<CHASE>
F7 	‘
Upon detecting that the machines have successfully located and parked, the
Controller issues a play to the master, thus initiating the automated series of
events previously loaded:
F0 	7F 	<master=01> 	<mcc> 	<PLAY> 	F7
_ 	Master plays, slave attempts to synchronize:
F0
	7F
<ma$ter=01>
	<mcr>
(MOTION
CONTROL
	TALLY)
	<count=03>
	<PLAY>
	7F 	01
F7
F0 	7F 	<slave=02> 	<mcr>
(MOTION
CONTROL
'TALLY>
	<count=03>r
<PLAY>
	<CHASE> 	01
F7
Eventually, the slave is synchronized:
F0 	7? 	<slave=02> 	<m¢r>
<MOTION
CONTROL
	TALLY)
	<count=03>
	<PLAY>
	<CHASE>
F7
The slave punches
into record at
pre-artanged
point
(and deletes
Event #01):
F0 	7?
<slave=02>
	<mcr>
<RECORD
STATUS)
	<count=01>
F7
Some time later, the slave punches out (and deletes Event #02):
F0 	7F
<slave=02>
	<mcr>
<RECORD
STATUS>
	<count=01>
F7

## Page 95

Two
seconds
after
punch
out,
the master
stops,
causing
the slave
also
to
stop
and park:
F0
	7?
<master=01>
	<mcr>
'
	{MOTION
CONTROL
	TALLY>
	<count=03>
	<STOP> 	7F
F7
F0
	7F
<51ave=02>
	<mcr>
<MOTION
CONTROL
	TALLY>
	<count=03>
	<STOP> 	<CHASE>
F7
At the end of the session, the Controller mutes all update responses and disables
both machines: 	'
F0
	7F
<group=
7C>
	<mcc>
<UPDATE> 	<count-02> 	<[END] > 	<a11-7F>
<WRITE>
	<count=03>
<CONTROL
DISABLE>
	<count=01>
F7
Finally. the operator attempts to manipulate a (non-existent) time code generator
in the master device:
F0
	7F
<master=01>
	<mcc>
<READ> 	<count=01> 	<GENERATOR 	TIME 	CODE)
<GENERATOR 	SET 	UP> 	<count=03>
00 	(SELECTED 	1'11l CODE) 	01
<GENERATOR 	COMMAND> 	<count=01> 	01
F7
The master first responds to the READ of the unsupported GENERATOR TIME
CODE:
F0
	7F
	<master=01>
	<mcr>
(RESPONSE 	ERROR)
	<count=01>
	<GENERATOR
	TIME
CODE>
F7
Then follows notification that the GENERATOR SET UP command is also
unsupported. Since all errors have been ambled by the Controller, the master
will
enter
"Error Halt"
mode,
and the cease
all
command processing. The final
command, GENERATOR COMMAND, will be discarded.
F0
	7F
<master=01
>
	<mcr>
<COMMAND 	ERROR> 	<count=0A>
<f1 ags=ll > 	<1 evel=7F> 	<error=4 0>
<count__l =0 6> 	<offset=00>
<GENBRATOR
SET
UP>
	<count=03>
00 	<SELECTED 	TIME 	CODE) 	01
F7
The
Controller
acknowledges the
COMMAND
ERROR
message, thus
enabling
the master to resume command processing:
F0 	7F
<master=01>
	<mcc>
	<COMMAND 	ERROR
RESET> 	F7

## Page 96

Appendix B
TIME
CODE
STATUS
IMPLEMENTATION
TABLES
Time code status bits are defined in Section 3, "Standard Specifications". Their exact implementation for each
MMC time code Information Field is shown in this Appendix. 	.
Value
after
power
up
or
Time code 	MMC
Status Bits 	; 	RESET 	;
t t (time type) 	TIME
STAN-
DARD or
other
internal
default
c (color frame) 	0
k (blank) 	1
9 (sign) 	0
1: (final byte id) 	1
e (estimated code) 	0
v (invalid code) 	0
d (video field I) 	0
(0/1 if implemented)
n (no time code) 	I
SELECTED TIME CODE [read/write]: 	‘
V
	rin
	'n
If n = 1 (time code never read):
ti: = TIME STANDARD
(or default)
or as loaded with WRITE or
"Math" commands
Hn=m
tt = As read from time code
Hn=h
	c=0
If n = 0: 	c = As read from time code
I: = 0 only after time code has been: -
(a) 	read (from "tape")
or 	(b) 	incremented by tachpulses
or 	(c) 	loaded by WRITE
or 	(d) 	loaded by "Math" command
Otherwise, I: = I
l
e = 1 only if m time code
change came as a result of tachometer
or control track pulse updating.
Set as required.
Set/reset as required, and if
implemented.
n
= 0
MW
mg
frgm "mpg".
Interpretation
time
code
bits
' 	ggntajnm in WRIZI E data 	;
WRITE
to
tt
only
if
bit
:2
=
(time
code never read), else ignore t: t in
WRITE data.
Ignore c in WRITE data
Always set I: = 0 after a WRITE;
Ignore
k
in
WRITE
data.
Ignore g in WRITE data.
Ignore 1' in WRITE data.
Always
set
e
=
after
WRITE;
Ignore e in WRITE data.
Always
set
v
= 0
after
WRITE;
Ignore v in WRITE data.
Ignore d in WRITE data.
Always
set
n
=
after
WRITE;
(i.e. "reset" to "time code never read");
Ignore n in WRITE data.

## Page 97

02 v 	SELECTED MASTER CODE [read only]:
Same
as
SELECTED
TIME
CODE,
with
exception that
WRITE‘s
cannot
occur.
03 	REQUESTED OFFSET [read/write]:
Value after
power up or
Time code 	MMC 	Interpretation of time code bits
5mm:
Big
	:
	RESEI
	;
	Value
dmjng
Norma]
gmrafign:
	;
	confined
in
WRITE
data
	;
tt (time type) 	See next 	Follows tt in SELECTED TIME 	Ignore t t in WRITE data.
column. 	CODE, except that REQUESTED 	(Future versions of MMC may allow
OFFSET will remain w 	some variation here.)
(1:
t=1
1)
when
SELECTED
TIME
CODE is drop-frame ( t t =1 0).
c
(color
frame) 	0
	Ignore
c
in
WRITE
data.
k (blank) 	_ . 	I 	k = 0 only after time code has been: 	Always set I: = 0 after a WRITE;
(a) 	loaded by WRITE 	Ignore k in WRITE data.
or 	(b) 	loaded by "Math" command
Otherwise, I: = I
(sign) 	0
	0/1
as
required
	ox
w WRITE
gbit.
1' (final byte id) 	0 	0 	If i = 0 in WRITE data:
Load
final
data
byte
as
subframes;
Hi: I inWRITEdata:
Ignore final data byte;
Load subframes = 00

## Page 98

04 	ACTUAL OFFSET [read only]:
	LOCK
DEVIATION
[read
only]:
Value after
power “P
01’
	V
Time
code
	MMC
	.
Smyg Bits 	; 	BELT—4 	Valu; gnring Ngrmal gamma]: 	;
tt (time type) 	See next 	Follows tt in SELECTED TIME
column. 	CODE, except that ACTUAL OFFSET
- 	and LOCK DEVIATION will remain
Wm: (tt=l 1) when
SELECTED TIME CODE is dropframc (tt=l 0). 	-
c (color frame) 	0 	0
1: (blank) 	0 	o
(sign)
	0 	0/1
as
required
1 (final byte id) 	0 	o

## Page 99

06 	GENERATOR TIME CODE 	[read/write]:
Value after
power
up
or
Time
code
	MMC
	Interpretation
time
code
bits
Slam:
Bit;
	;
	RESET
	;
	V
	'
	rm
	'
n
	'
	n
	'n
	in
	I
tt
(time
type)
	TIME
	tt
=
TIME
STANDARD
(or
default),
	OK
to
WRITE
to
tt.
Subsequently
STAN- 	or
as
loaded
by
WRITE
or "Math"
	determines the
time
code
counting
DARD or 	commands or by a Copy/Jam from 	mode of the Generator.
other 	another time code source.
internal
default
c (color frame) 	0 	0 	Ignore c in WRITE data.
k (blank) 	0 	o 	' 	Ignore k in WRITE data.
9 (sign) 	. 	0 	0 	Ignore gin WRITE data.
i (final byte id) 	1 	1 	_ 	Ignore i in WRITE data.
e (estimated code) 	0 	O 	Ignore e in WRITE data.
v (invalid code) 	0 	0 	Ignore v in WRITE data.
d (video field I) 	0 	Set/reset as required, and if 	Ignore din WRITE data. 	-
(0/1 if im- 	implemented.
plemented)
n
(no
time
code) 	0 	0 	Ignore
:1
in
WRITE
data.

## Page 100

MIDI TIME
CODE
INPUT
[read
only]:
Value after
power up or
Time code 	MMC
Emu: Bits 	; 	RESET 	; 	V 	l 	'n 	rm 	' 	n
tt (time type) 	TIME 	If n = 1 (time code never read):
STAN- 	ct = TIME STANDARD
DARD
or
	,
	(or
default)
other 	If n = 0:
internal
	tt
= As
read
from
MTC
default
c (color frame) 	0 	0
k (blank) 	I 	k = 0 only after MTC has been
received at the device's MIDI In.
Otherwise. k = I
9 (sign) 	0 	0
.12 (final byte id) 	1 	l
e (estimated code) 	0 	0
v (invalid code) 	0 - 	Set as required.
d (video field 1) 	» 	0 	0
n (no time code) 	I 	“n =0-only after'MTC has been
received at the device‘s MIDI In.
Otherwise, n = 1
(Le. n = k)

## Page 101

thru
0F 	GPO thru GP7 	[read/write]:
Time code
MEAL-.4
tt (time type)
c (color frame)
I: (blank)
9 (sign)
i (final byte: id)
Value after
power
up
or:
MMC
RESET 	,'
TIME
STAN-
DARD or
other
internal
default
V! 	'N
tt
=
As
loaded
with WRITE
or
“Math" commands
c
=
As
loaded
with
WRITE or "Math"
commands
k = 0 only after time code has been:
(a) 	loaded by WRITE
or 	(b) 	loaded by "Math" command
Otherwise. I: = l
9: As loaded with WRITE or "Math"
commands
I
Interpretation of time code bits
' 	ggngjngg in WRITE gala 	;
OKtoWRlTEto tt.
OKtoWRITEtoc.
Always
set
k
=
after
WRITE;
Ignore
k
in
WRITE
data.
OKtoWRITElog. 	'
Ifi=0inWRITEdataz
Load
final
data
byte
as
subframes;
Ifi = 1 in WRITE data:
Ignore final data byte;
Load subframes = 00

## Page 102

Appendix C 	SIGNATURE
TABLE
.JiLtBi 	1’ 	W4 	‘ 	W 	W 	2&m
COMMAND BITMAP ARRAY:
Em
	W
to 	0 6 	05
RECORD
	REWIND
STROBE
cl
	0D
	0C
MMC RESET 	COMMAND
ERROR RESEI‘
c2 	1 4 	l 3
c3
	IE
	1A
c4 	- 	-
c5
c6
	2D 	2C
c7 	34 	33
c8 	33 	311
C9 	- 	-
ell)
. SEARCH 	VARIABLE
PLAY
cll 	4D 	4 C
ADD 	MOVE
(:12 	54 	53
DEFERRED 	COMMAND
VARIABLE 	SEGMENI'
PLAY
(:13
CM 	- 	-
as 	6 6 	65
cl6
	6D 	6C
€17 	74 	73
as
	7A
cl9 	- 	-
0 4
FAST
FORWARD
CHASE
4 4
LOCATE
MIDI
TIME
CODE
COMMAND
GROUP
5.9
6B
DEFERRED
PLAY
0A
ETECI'
1F
2A
3F
VUPDATE
4A
GENERATOR
COMMAND
	V
EVENT
5F
6A
7F
RESUME
PLAY
0 9
PAUSE
11:7
3E
i READ
4 9
ASSIGN
SYSTEM
MASTER
5 0
PROCEDURE
5E
7E
STOP
0 8
RECORD
PAUSE
0F
1 6
ID
2F
3D
1 MASKED
‘
WRITE
STEP
4 F
DROP FRAME
ADJUST
5D
6F
7D
(userved)
0 7
RECORD EXIT
01?
1C
2E
3C
SHUTTLE
4E
SUBTRACT
5 5
RECORD
STROBE
VARIABLE
5C
6E
7C
WAIT

## Page 103

RESPONSE/INFORMATION FIELD BITMAP ARRAY:
1m: 	1w	4 h
r0 	0 6
GENERATOR
TIME CODE
r1 	0D
GPS
r2 	1 4
r3 	18
r4 	-
r5 	26
Short
GENERATOR
TIME CODE
r6 	2D;-
Shoi'i’GPs
1'7 	34
r8 	38
1'9 	-
r10 	4 6
SELECTED
TIME CODE
SOURCE
r11 	4D
RECORD
STATUS
r12 - 	54
STEP LENGTH
0 5
LOCK
DEVIATION
0C
6P4
1A
2 5
Short LOCK
DEVIATION
2C
Shon 6P4
3A
4 5
TIME
STANDARD
4 C
RECORD
MODE
TRACK INPUT
MONITOR
Bi; 5 1232M 	51140913)
0 4
ACTUAL
OFFSET
OB
6P3
2 4
Short ACTUAL
OFFSET
Short 0P3
4 4
COMMAND
ERROR
LEVEL
4 B
FAST MODE
TRACK SYNC
MONITOR
Bi; 3 (98h)
0 3
REQUESTED
OFFSET
0A
6P2
1F
Short
REQUESTED
OFFSET
2A
Shon GP2
3F
4 3
COMMAND
ERROR
4A
STOP MODE
5 1
RECORD
MONITOR
Bi121flh1
SEI£CTED
MASTER
CODE
GP]
IE
Short
SELECTED
MASTER
CODE
Short GPI 	V
3B
4 2
RESPONSE
ERROR
VELOCITY
TALLY
5 0
GLOBAL
MONITOR
W
SELECTED
TIME CODE
GPO / LOCATE
POINT
OF
0P7
1D
Shon
SEIECTED
TIME CODE
Short
GPO/
LOCATE
POINT
2F
Shot! GP7
3D
UPDATE
RATE
4 8
MOTION
CONTROL
TA LLY
4F
TRACK
RECORD
READY
mum;
0 0
(reserved)
0 7
MIDI TIME
CODE INPUT
OE
GP6
1C
2 0
(reserved)
2 7
Short MIDI
TIME CODE
INPUT
25'
Short GP6
3C
4 0
SIGNATURE
4 7
SELECTED
TIME CODE
USERBITS
4 E
TRACK
RECORD
STATUS

## Page 104

41:8 	W
r13
	SB
GENERATOR
COMMAND
TALLY
r14 	-
r15 	66
r16 	60
r17 	74
r18 	73
r19
	-
Bi; 5 (29h)
5A
CHASE MODE
FAILURE
6C
7A
B114 (mm
RESOLVED
PLAY MODE
RESPONSE
SEGMENT
6B
7.9
BM (98!”
CONTROL
DISABLE,
51"
MIDI TIME
CODE SET UP
VlTC INSERT
ENABLE
6A
7F
RESUME
W
DEFEAT
55'
MIDI TIME
CODE
COMMAND
TALLY
.62
TRACK MUTE
7E
Bi;
(92m
5 6
FIXED SPEED
SD
GENERATOR
USERBITS
EVENT
RESPONSE
6F
7D
Bi 	1
5 5
PLAY SPEED
REFERENCE
5C
GENERATOR
SET
UP
PROCEDURE
RESPONSE
6E
7C
WAIT

## Page 105

Appendix D 	MIDI MACHINE CONTROL and MTC CUEING
It is anticipated that some devices will implement both MIDI Machine Control and MTC Cueing. In such cases, it
may
be
expedient to
merge
MMC
Events
with
MTC
Cueing
Event
List.
In an effort to be both self-contained and adaptable to ESbus methods, MIDI Machine Comm] has not adopted MTC
Cueing as its means of triggering events.
This section will attempt to define those areas where MIDI Machine Control and MTC Cueing overlap, as well as
those where they do not.
Comparison
MIDI
Machine
Control
and
MTC
Cueing
event
Specifications:
MID] Machine aml 	;
MMC "Events" trigger other MMC commands
only.
Events are defined by the EVENT command.
Each event is unique, and is identified by a
single
7-bit
name.
Edeh
Event
definition
specifies
source
time code stream against which the Event should
be triggered.
Events contain additional flags for triggering at
other
than
play
speeds,
and when
moving
forward or reverse or either.
For compatibility with ESbus. each event may
optionally be deleted after being triggered.
No overall event enable/disable is provided.
Error trapping checks for "Illegal Event name".
"Undefined
EVENT", "EVENT buffer
overflow",
and performs complete
pre—checking
the command which is to
be executed at the
EVENT trigger time.
MTC Cueing
MTC
"Events"
trigger
event
sequences.
cues,
and track punch in and out.
Events
are
defined by
MTC
Set-Up
messages.
The same event number can be triggered at
different times. and each Event List item is
therefore
identified
by
combination
trigger
time and event number.
No
time
code
source is
specified, but
is
assumed
to be MIDI Time Code.
No motion variations or restrictions are
specified.
Events are not deleted when triggering occurs.
Event enable/disable commands
turn all
events
on and off without affecting the Event List itself.
No error trapping is provided.

## Page 106

Review
MTC
Cueing
messages,
and
their
relationship
to
MMC:
	Punch
In
points
	Punch
Out
points
	Delete
Punch
In
point
04 	Delete Punch Out point
These MTC messages are functionally duplicated by MIDI Machine Control commands, although exact
translation
is
awkward.
	.
The following example illustrates a translation of the MTC Punch In message into MMC commands:
MTC
Cueing:
	F0
	75'
<chan>
	hr
mn
	sc
fr
ff
sl
	sm
F7
(where 	51 	sm=track number)
MMC: 	F0
	7F
<device__ID>
<mcc>
<PROCEDURE> 	<count=09> 	<[ASSEMBLE]> 	<procedure_name>
<MASKED 	WRITE> 	<count=04>
<TRACK
RECORD
READY>
	<byte
	#>
	<mask>
	<data=7F>
(RECORD 	STROBE)
<WRITE>
	<count=06>
	<GPO>
hr
mn
	sc
	fr
ff
<EVENT> 	<count=09> 	<[DEFINE]> 	<event_name>
<flags=40> 	(MIDI 	TIME 	CODE 	INPUT> 	<GPO>
<PROCEDURE>
	<count=02>
	<[EXECUTEJ>
	<procedure_name>
F7
05 	Event Start points
06 	Event Stop points
0 7 	Event Start points with additional info.
08 	Event Stop points with additional info.
09 	Delete Event Start point
0A 	Delete Event Stop point
0E 	Event Name in additional info.
The
MTC
Event
Start
and Stop
messages
"imply
that
large
sequence
events
or
continuous event is to
be started or stopped" (MIDI 1.00 Detailed Specification).
MIDI Machine Control has no real equivalent for this style of Event
	Cue
points
0C 	Cue points with additional info.
0D 	Delete Cue point
An MTC
Cue
Point "refers to
individual
event occurrences,
such
as
marking 'hit' points
for
sound
effects,
reference points for editing. and so on" (MIDI 1.00 Detailed Specification). 	.
Although closer in style to the
MMC EVENT
.
these
MTC
Cue points would not appear to be
intended
for
lower level execution
specific machine commands. The "additional info"
area
certainly provides
cumbersome method for defining such commands.
We shall therefore regard MTC Cue points as representing an activity for which MMC has no exact
equivalent.

## Page 107

00 	: 	00 	00 	TimeCodeOlTset
The MTC Cueing Time Code Offset message may be translated literally into the corresponding MMC
command:
MTCCueing: 	F0
<chan>
hr
mn
	sc
fr
ff
00 	00
F7
MMC: 	F0 	71" <device_ID> 	<mcc>
<WRITE>
(count-06>
<REQUESTED
OFFSET>
hr
Inn
	St:
fr
ff
F7
00 	.- 	01 	00 	Enable Event List
00 	: 	02 	00 	Disable EventList
MIDI Machine Control does not currently support such commands for its own EVENTS. 	When received,
these messages should be applied only to those events defined by MTC messages. and should have no
effect on MMC EVENTS at all.
00 	: 	03 	00 	Clear Event List
MIDI
Machine Conuol
provides its
own
methods
for
deleting
events.
When received, this
message
should
also
be
applied
only
to
those events
defined by
MTC
messages,
and
should
have no
effect
on
MMC
EVENTS
at
all.
	'
am“ ‘
0b 	: 	04 	00
	System
Stop
The MTC Cueing System Stop message may be U'anslated into an MMC Event command as follows:
MTC Cueing: 	F0 	75‘ 	<chan> 	04 	00 	hr 	mn 	sc 	fr 	ff 	04 	00 	F7
MMC: 	F0 	71" 	<device_ID> 	<mcc>
<WRITE> 	<count-06> 	<GPO> 	hr mn 	sc 	fr 	ff
<EVENT> 	<count=06> 	<[DEFINE]> 	<event_name>
<flags=50> 	<SE'LECTED 	TII‘E 	CODE) 	<GPO>
<STOP>
F7
‘00 	: 	05 	00 	Event List Request
MIDI Machine Control EVENT'5 may be read back using the EVENT RESPONSE Information Field.
Event List
Request should
cause
transmission
of only
those events defined by
MTC
messages.
MMC
EVENT's should not
be
included.

## Page 108

Appendix E 	DETERMINATION OF RECEIVE BUFFER SIZE
Satisfactory operation of the WAIT handshake requires a certain minimum size for the MIDI receive buffer in an
MMC device. The fact that a MIDI System Exclusive should not be interrupted once its transmission has begun can
cause delays not only in the dispatching of a WAIT message, but also in the cessation of transmissions in response
to a WAIT. 	A receiving device must provide enough buffer space so that buffer overflow will not occur should the
device be receiving full bandwidth MIDI data between the time that it decides to transmit a WAIT and the time that
the received data stream actually comes to a halt.
Complicating matters further. the use of external MIDI merging devices can considerably lengthen WAIT delays,
or. at the very least. make them less predictable.
We shall
first
examine
receive
buffer
requirements
when external
merging
is
not
used.
All
calculations
assume
"worst
case"
scenarios.
'n 	W 	'n 	i 	" 	"'
The
following
diagram
represents
receive and
transmit
activity
at
an
MMC
device
""A.
We shall
assume
that
another
device,
"B",
is
transmitting
at
full
MIDI
bandwidth.
but that device
"A"
may
transmit
at
slower
rate.
Our
objective
is
to
determine
worst
case
minimum
receive
buffer
size
for
device
"A",
when connected
in
basic,
point-to-point, "closed loop" configuration.
Rx: 	<——sysex-1--><--sysex-2--><--sysex-3--><—-sysex—4—-><--sysex-5-—>
1' 	' 	.
Tx: 	<--sysex-'(SA 	bytes ) '-—> 	<WAIT>
Notes : 	' 	l 	2 _ 	p 	3 	4 	5 	'6 	7
Times:
	tA
	tSA 	tPA
	tWA
	ta
	tSB
1. 	A received byte causes device "A"'s receive buffer to fill beyond a predetermined threshold {HA}.
measured in bytes (see point """ in the diagram).
2. 	After a delay, { tA}, device "A" detects that its receive threshold has been crossed.
In this worst
case
example, device
"A"'s
transmitter section
has
just
begun
transmitting
sysex
length
{SA}
bytes. Since transmission
MIDI
sysex
cannot
be
interrupted
once begun,
it will
be necessary
to
wait time { cm} for the completion of this sysex before a WAIT message can be sent.
3.
	At
completion
the sysex, there may
be
short delay,
It”
}
,
while
device
"A"
prepares the
WAIT
message.
4. 	Device
"A"
sends the
WAIT
message,
which
is
itself
6 bytes long, and
which
will
take time (
t
WA}
to
transmit.
5. 	WAIT message completes.

## Page 109

6. 	Meanwhile, over at device "B", there will be a delay. { t 3}, before the arrival of "A"'s WAIT message is
detected. As before, worst case conditions dictate that device "B” has just begun transmission of an
entirely
new
sysex, and cannot
cease
transmitting
until
after
EOX.
7.
	After
further
sysex
length
delay.
{cg},
device
"B"
finally
halts transmissions.
The maximum time, { tmax ), from the crossing of "A"'s receive buffer threshold to the end of "B"'s sysex
transmission is given by:
tmax 	g 	tAmax 	+ 	tSAmax 	+ 	tPAmax 	+ 	tWAmax 	+ 	tax 	+ 	1558
where:
tA,"ax = worst case time for device "A" to recognize that its receive buffer threshold has been crossed;
tSAmax = maximum time for device "A" to transmit a maximum length MMC sysex (53 bytes). Since device "A" is
not
necessarily
transmitting
at
full
MIDI
bandwidth, this time
will
be
greater
than
or
equal to
MIDI
byte
times (one MIDI byte time = .320msec).
tum“
=
maximum
time
taken
by
device
"A"
to prepare
WAIT
message
after conclusion
its
sysex
transmission (quite possibly zero).
tmmax = maximum time for device "A" to transmit a WAIT (once again. greater than or equal to 6 x .320msec).
tB,”ax = lOmsec. We thus establish a fairly generous requirement that W
9f
WAfl
message
within
19mm.
(:53 = 16.96msec. since "B" is transmitting at full bandwidth, with each MIDI byte taking .3520m, and the
maximum MMC sysex length IS 53 bytes (48 data).
Since device “A" is receiving full bandwidth MIDI data for the duration of { tmax} , it follows that we will need at
least { tma'x/ . 320} bytes of available space in "A"'s receive buffer in addition to the {HA} bytes below the
“predetermined threshold". 	The actual value of {HA} need not be specified. but should be large enough so that
reception eta single MMC sysex will not, in the majority of cases, cause a WAIT message to be generated.
One final element, {XA } , represents the number of bytes that routines within device "A" are able to extract from the
receive buffer for further processing during time [ cm”).
The minimum size in bytes. {Z} , of a device's receive buffer is therefore given by:
tAmax 	+ 	tSAmax 	+ 	tPArnax 	+ 	tWAmax 	+ 	26'96
For example, if:
HA = 53
tAmax =
m
tsmx
=
x
(.320 + .100)
= 22.26 (i.e.
ma;
gm!
mtwgn MID!
12m
msmissigns
is
Muses.)
t PAmax=
tWAmax_
—
6 x (.320 +
.100):
2.52
XA-—- 0 (We temporarily ignore XA due to the difficulty of making reliable projecu'ons as to its value.)
	+
22.26
	+ o +
2.52
	+
26.96
z=53+ ----------------------------- -o=245.9

## Page 110

In other words, given the conditions described, basic point to point MMC communications will operate quite
satisfactorily
with
receive
buffer
bytes.
W
The typical use for a merger in an MMC system will be to collect responses from multiple Controlled Devices and
feed them back to a Controller's MIDI In. This connection will have an impact on both Controller and Controlled
Device:
At
Controller:
1. 	' Clearly. for this type of merged connection to work at all, the Controller must not request data from the
attached Controlled Devices in such a way that the maximum bandwidth of its single MIDI In port will be
exceeded.
2.
	At
time
that
Controller
issues
WAIT
command
to
the attached
Controlled
Devices.
merger may
have already buffered up an arbitrary number of bytes which must yet be transmitted back to the
Controller. 	In addition. under worst case conditions, each Controlled Device may have begun the
transmission of a new sysex. and will not react to the WAIT until after transmission of the BOX.
It is therefore difficult to establish a minimum buffer size for which a "buffer overflow" condition will
never
arise.
Receive
buffer
capacities
in
order
bytes, however,
are
expected to
be
adequate
for
Controllers supporting up to five attached devices through a single MIDI In port.
At
Controlled
Device:
In a similar fashion, a WAIT message transmitted by a Controlled Device may be held up at the merger
because sysex's from other devices are already pending transmission back to the Controller.
Increasing the receive buffer size in a Controlled Device to 512 bytes is expected to serve adequately in 	-
systems which externally merge data from up to five Controlled Devices.
