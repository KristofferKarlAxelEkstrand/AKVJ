---
title: MIDIOutput Interface (MDN Reference)
protocol: web-midi
source: https://developer.mozilla.org/en-US/docs/Web/API/MIDIOutput
sourceType: online
sha256: 2a60ae151410e66ffe4bedb25a2dddd6638c9da386a3131418b7d46cb8e8e66b
extractedAt: 2026-07-16T12:53:59.059Z
summary: MDN reference for MIDIOutput: send() with optional timestamp, clear(), and message validity.
---
# MIDIOutput Interface (MDN Reference)

# MIDIOutput

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

Want more browser support for this feature? Tell us why.

- Learn more
- See full compatibility

<?>

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The MIDIOutput interface of the Web MIDI API provides methods to add messages to the queue of an output device, and to clear the queue of messages.

## Instance properties

This interface doesn't implement any specific properties, but inherits properties from MIDIPort.

## Instance methods

This interface also inherits methods from MIDIPort.

MIDIOutput.send()

Queues a message to be sent to the MIDI port.

MIDIOutput.clear()

Clears any pending send data from the queue.

## Examples

The following example sends a middle C immediately on MIDI channel 1.

js

```
<code>function sendMiddleC(midiAccess, portID) {
  const noteOnMessage = [0x90, 60, 0x7f]; // note on, middle C, full velocity
  const output = midiAccess.outputs.get(portID);
  output.send(noteOnMessage); // sends the message.
}
</code>
```

## Specifications

Specification

Web MIDI API<?> # MIDIOutput<?>

## Browser compatibility

## Help improve MDN

  Learn how to contribute

This page was last modified on Mar 8, 2024 by MDN contributors.

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
