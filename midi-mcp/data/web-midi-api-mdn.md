---
title: Web MIDI API (MDN Reference)
protocol: web-midi
source: https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
sourceType: online
sha256: de651adf8e75aa79ea94132532e574502e1eb1a1bf5082501bd6f86505eeca98
extractedAt: 2026-07-16T12:53:59.006Z
summary: MDN's practical Web MIDI API reference: interfaces, availability, security requirements, and usage examples.
---
# Web MIDI API (MDN Reference)

# Web MIDI API

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

Want more browser support for this feature? Tell us why.

- Learn more
- See full compatibility

<?>

Secure context: This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

The Web MIDI API connects to and interacts with Musical Instrument Digital Interface (MIDI) Devices.

The interfaces deal with the practical aspects of sending and receiving MIDI messages. Therefore, the API can be used for musical and non-musical uses, with any MIDI device connected to your computer.

## Interfaces

MIDIInputMap

Represents all of the available MIDI input ports.

MIDIOutputMap

Represents all of the available MIDI output ports.

MIDIAccess

Provides the methods to list input and output devices, and to access an individual device.

MIDIPort

Represents an individual MIDI port.

MIDIInput

Provides a method for dealing with MIDI messages from an input port.

MIDIOutput

Queues messages to the linked MIDI port. Messages can be sent immediately or after a specified delay.

MIDIMessageEvent

The event passed to the MIDIInput midimessage event.

MIDIConnectionEvent

The event passed to the MIDIAccess statechange and MIDIPort statechange events, when a port becomes available or unavailable.

## Security requirements

Access to the API is requested using the navigator.requestMIDIAccess() method.

- The method must be called in a secure context.
- Access may be gated by the midi HTTP Permission Policy.
- The user must explicitly grant permission to use the API through a user-agent specific mechanism, or have previously granted permission. Note that if access is denied by a permission policy it cannot be granted by a user permission.

The permission status can be queried using the Permissions API method navigator.permissions.query(), passing a permission descriptor with the midi permission and (optional) sysex property:

js

```
<code>navigator.permissions.query({ name: "midi", sysex: true }).then((result) => {
  if (result.state === "granted") {
    // Access granted.
  } else if (result.state === "prompt") {
    // Using API will prompt for permission
  }
  // Permission was denied by user prompt or permission policy
});
</code>
```

## Examples

 <?>

### Gaining access to the MIDI port

The navigator.requestMIDIAccess() method returns a promise that resolves to a MIDIAccess object, which can then be used to access a MIDI device. The method must be called in a secure context.

js

```
<code>let midi = null; // global MIDIAccess object
function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
}

function onMIDIFailure(msg) {
  console.error(`Failed to get MIDI access - ${msg}`);
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
</code>
```

### Listing inputs and outputs

In this example the list of input and output ports are retrieved and printed to the console.

js

```
<code>function listInputsAndOutputs(midiAccess) {
  for (const entry of midiAccess.inputs) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` +
        ` version:'${input.version}'`,
    );
  }

  for (const entry of midiAccess.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
}
</code>
```

### Handling MIDI Input

This example prints all MIDI input messages to the console.

js

```
<code>function onMIDIMessage(event) {
  let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
  for (const character of event.data) {
    str += `0x${character.toString(16)} `;
  }
  console.log(str);
}

function startLoggingMIDIInput(midiAccess) {
  midiAccess.inputs.forEach((entry) => {
    entry.onmidimessage = onMIDIMessage;
  });
}
</code>
```

## Specifications

Specification

Web MIDI API<?>

## Browser compatibility

 <?>

### api.Navigator.requestMIDIAccess

### http.headers.Permissions-Policy.midi

### api.Permissions.permission_midi

## See also

- Introduction to Web MIDI
- Making Music in the Browser

## Help improve MDN

  Learn how to contribute

This page was last modified on May 15, 2026 by MDN contributors.

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
