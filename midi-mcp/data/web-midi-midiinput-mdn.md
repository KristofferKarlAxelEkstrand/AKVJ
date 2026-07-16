---
title: MIDIInput Interface (MDN Reference)
protocol: web-midi
source: https://developer.mozilla.org/en-US/docs/Web/API/MIDIInput
sourceType: online
sha256: b3eb6c2b5f5703221f971fa8c971845c91ee2d422249dceee25e9394d974f32f
extractedAt: 2026-07-16T12:53:59.045Z
summary: MDN reference for MIDIInput: the midimessage event and receiving MIDI messages.
---
# MIDIInput Interface (MDN Reference)

# MIDIInput

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

Want more browser support for this feature? Tell us why.

- Learn more
- See full compatibility

<?>

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The MIDIInput interface of the Web MIDI API receives messages from a MIDI input port.

## Instance properties

This interface doesn't implement any specific properties, but inherits properties from MIDIPort.

## Instance methods

This interface doesn't implement any specific methods, but inherits methods from MIDIPort.

### Events

midimessage

Fired when the current port receives a MIDI message.

## Examples

In the following example the name of each MIDIInput is printed to the console. Then, midimessage events are listened for on all input ports. When a message is received the MIDIMessageEvent.data property is printed to the console.

js

```
<code>inputs.forEach((input) => {
  console.log(input.name); /* inherited property from MIDIPort */
  input.onmidimessage = (message) => {
    console.log(message.data);
  };
});
</code>
```

## Specifications

Specification

Web MIDI API<?> # midiinput-interface<?>

## Browser compatibility

## Help improve MDN

  Learn how to contribute

This page was last modified on Feb 28, 2023 by MDN contributors.

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
