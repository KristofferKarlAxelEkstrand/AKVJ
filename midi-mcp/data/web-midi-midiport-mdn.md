---
title: MIDIPort Interface (MDN Reference)
protocol: web-midi
source: https://developer.mozilla.org/en-US/docs/Web/API/MIDIPort
sourceType: online
sha256: db28269f90cb1ac670ec8793108d1d0986081060d2ea3a966cf272427b815b1f
extractedAt: 2026-07-16T12:53:59.093Z
summary: MDN reference for MIDIPort: state/connection properties, open()/close(), and the statechange event.
---
# MIDIPort Interface (MDN Reference)

# MIDIPort

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

Want more browser support for this feature? Tell us why.

- Learn more
- See full compatibility

<?>

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The MIDIPort interface of the Web MIDI API represents a MIDI input or output port.

A MIDIPort instance is created when a new MIDI device is connected. Therefore it has no constructor.

## Instance properties

MIDIPort.id Read only

Returns a string containing the unique ID of the port.

MIDIPort.manufacturer Read only

Returns a string containing the manufacturer of the port.

MIDIPort.name Read only

Returns a string containing the system name of the port.

MIDIPort.type Read only

Returns a string containing the type of the port, one of:

"input"

The MIDIPort is an input port.

"output"

The MIDIPort is an output port.

MIDIPort.version Read only

Returns a string containing the version of the port.

MIDIPort.state Read only

Returns a string containing the state of the port, one of:

"disconnected"

The device that this MIDIPort represents is disconnected from the system.

"connected"

The device that this MIDIPort represents is currently connected.

MIDIPort.connection Read only

Returns a string containing the connection state of the port, one of:

"open"

The device that this MIDIPort represents has been opened and is available.

"closed"

The device that this MIDIPort represents has not been opened, or has been closed.

"pending"

The device that this MIDIPort represents has been opened but has subsequently disconnected.

## Instance methods

This interface also inherits methods from EventTarget.

MIDIPort.open()

Makes the MIDI device connected to this MIDIPort explicitly available, and returns a Promise which resolves once access to the port has been successful.

MIDIPort.close()

Makes the MIDI device connected to this MIDIPort unavailable, changing the state from "open" to "closed". This returns a Promise which resolves once the port has been closed.

## Events

statechange

Called when an existing port changes its state or connection.

## Examples

 <?>

### List ports and their information

The following example lists input and output ports, and displays information about them using properties of MIDIPort.

js

```
<code>function listInputsAndOutputs(midiAccess) {
  for (const entry of midiAccess.inputs) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}'] id:'${input.id}' manufacturer: '${input.manufacturer}' name: '${input.name}' version: '${input.version}'`,
    );
  }

  for (const entry of midiAccess.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id: '${output.id}' manufacturer: '${output.manufacturer}' name: '${output.name}' version: '${output.version}'`,
    );
  }
}
</code>
```

### Add available ports to a select list

The following example takes the list of input ports and adds them to a select list, in order that a user can choose the device they want to use.

js

```
<code>inputs.forEach((port, key) => {
  const opt = document.createElement("option");
  opt.text = port.name;
  document.getElementById("port-selector").add(opt);
});
</code>
```

## Specifications

Specification

Web MIDI API<?> # MIDIPort<?>

## Browser compatibility

## Help improve MDN

  Learn how to contribute

This page was last modified on Jun 23, 2025 by MDN contributors.

View this page on GitHub • Report a problem with this content

Your blueprint for a better internet.

MDN

- About
- Blog
- Mozilla careers
- Advertise with us
- MDN Plus
- Product help

Contribute

- MDN Community
- Community resources
- Writing guidelines
- MDN Discord
- MDN on GitHub

Developers

- Web technologies
- Learn web development
- Guides
- Tutorials
- Glossary
- Hacks blog

- Website Privacy Notice
- Telemetry Settings
- Legal
- Community Participation Guidelines

Portions of this content are ©1998–2026 by individual mozilla.org contributors. Content available under a Creative Commons license.
