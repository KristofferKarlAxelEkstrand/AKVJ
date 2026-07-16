---
title: MIDIAccess Interface (MDN Reference)
protocol: web-midi
source: https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess
sourceType: online
sha256: b41d236a8f9b5424175e1808d149f4268c24d128dcb462c8a808ed048ad087ba
extractedAt: 2026-07-16T12:53:59.031Z
summary: MDN reference for MIDIAccess: inputs/outputs maps, sysexEnabled, and the statechange event.
---
# MIDIAccess Interface (MDN Reference)

# MIDIAccess

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

Want more browser support for this feature? Tell us why.

- Learn more
- See full compatibility

<?>

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The MIDIAccess interface of the Web MIDI API provides methods for listing MIDI input and output devices, and obtaining access to those devices.

MIDIAccess is a transferable object.

## Instance properties

MIDIAccess.inputs Read only

Returns an instance of MIDIInputMap which provides access to any available MIDI input ports.

MIDIAccess.outputs Read only

Returns an instance of MIDIOutputMap which provides access to any available MIDI output ports.

MIDIAccess.sysexEnabled Read only

A boolean attribute indicating whether system exclusive support is enabled on the current MIDIAccess instance.

### Events

statechange

Called whenever a new MIDI port is added or an existing port changes state.

## Examples

The Navigator.requestMIDIAccess() method returns a promise that resolves with a MIDIAccess object. Information about the input and output ports is returned.

When a port changes state, information about that port is printed to the console.

js

```
<code>navigator.requestMIDIAccess().then((access) => {
  // Get lists of available MIDI controllers
  const inputs = access.inputs.values();
  const outputs = access.outputs.values();

  access.onstatechange = (event) => {
    // Print information about the (dis)connected MIDI controller
    console.log(event.port.name, event.port.manufacturer, event.port.state);
  };
});
</code>
```

## Specifications

Specification

Web MIDI API<?> # midiaccess-interface<?>

## Browser compatibility

## Help improve MDN

  Learn how to contribute

This page was last modified on Oct 20, 2024 by MDN contributors.

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
