---
title: MIDIConnectionEvent Interface (MDN Reference)
protocol: web-midi
source: https://developer.mozilla.org/en-US/docs/Web/API/MIDIConnectionEvent
sourceType: online
sha256: 30d2a848ee255f9fbefb68760ca4ead47aa1e4de7248fb8a1f697ea32a6fea4a
extractedAt: 2026-07-16T12:53:59.106Z
summary: MDN reference for MIDIConnectionEvent: hot-plug connect/disconnect notifications via statechange.
---
# MIDIConnectionEvent Interface (MDN Reference)

# MIDIConnectionEvent

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

Want more browser support for this feature? Tell us why.

- Learn more
- See full compatibility

<?>

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The MIDIConnectionEvent interface of the Web MIDI API is the event passed to the statechange event of the MIDIAccess interface and the statechange event of the MIDIPort interface. This occurs any time a new port becomes available, or when a previously available port becomes unavailable. For example, this event is fired whenever a MIDI device is either plugged in to or unplugged from a computer.

## Constructor

MIDIConnectionEvent()

Creates a new MIDIConnectionEvent object.

## Instance properties

MIDIConnectionEvent.port Read only

Returns a reference to a MIDIPort instance for a port that has been connected or disconnected.

## Examples

The Navigator.requestMIDIAccess() method returns a promise that resolves with a MIDIAccess object. When a port changes state, a MIDIConnectionEvent is passed to statechange event. Information about the port can then be printed to the console.

js

```
<code>navigator.requestMIDIAccess().then((access) => {
  access.onstatechange = (event) => {
    console.log(event.port.name, event.port.manufacturer, event.port.state);
  };
});
</code>
```

## Specifications

Specification

Web MIDI API<?> # midiconnectionevent-interface<?>

## Browser compatibility

## Help improve MDN

  Learn how to contribute

This page was last modified on Sep 6, 2023 by MDN contributors.

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
