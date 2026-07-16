---
title: MIDIMessageEvent Interface (MDN Reference)
protocol: web-midi
source: https://developer.mozilla.org/en-US/docs/Web/API/MIDIMessageEvent
sourceType: online
sha256: b8ce7fcc3e9838c18f380a31c9718202e63013b0d7eaf3c46a546a323735dace
extractedAt: 2026-07-16T12:53:59.078Z
summary: MDN reference for MIDIMessageEvent: the data Uint8Array payload and event timing.
---
# MIDIMessageEvent Interface (MDN Reference)

# MIDIMessageEvent

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

Want more browser support for this feature? Tell us why.

- Learn more
- See full compatibility

<?>

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The MIDIMessageEvent interface of the Web MIDI API represents the event passed to the midimessage event of the MIDIInput interface. A midimessage event is fired every time a MIDI message is sent from a device represented by a MIDIInput, for example when a MIDI keyboard key is pressed, a knob is tweaked, or a slider is moved.

## Constructor

MIDIMessageEvent()

Creates a new MIDIMessageEvent object instance.

## Instance properties

This interface also inherits properties from Event.

MIDIMessageEvent.data

A Uint8Array containing the data bytes of a single MIDI message. See the MIDI specification for more information on its form.

## Instance methods

This interface doesn't implement any specific methods, but inherits methods from Event.

## Examples

The following example prints all MIDI messages to the console.

js

```
<code>navigator.requestMIDIAccess().then((midiAccess) => {
  Array.from(midiAccess.inputs).forEach((input) => {
    input[1].onmidimessage = (msg) => {
      console.log(msg);
    };
  });
});
</code>
```

## Specifications

Specification

Web MIDI API<?> # midimessageevent-interface<?>

## Browser compatibility

## Help improve MDN

  Learn how to contribute

This page was last modified on Aug 4, 2024 by MDN contributors.

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
