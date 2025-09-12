# Web MIDI API Guide

A practical guide to using the Web MIDI API for real-time music applications in the browser.

## Table of Contents

1. [What is the Web MIDI API?](#what-is-the-web-midi-api)
2. [Browser Support](#browser-support)
3. [Getting Started](#getting-started)
4. [Core Concepts](#core-concepts)
5. [Practical Examples](#practical-examples)
6. [Security and Permissions](#security-and-permissions)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Resources](#resources)

## What is the Web MIDI API?

The Web MIDI API is a web standard that allows web applications to interact with MIDI devices connected to your computer. It enables browsers to:

- **Send and receive MIDI messages** to/from hardware and software MIDI devices
- **Control external instruments** like synthesizers, drum machines, and controllers
- **Build music applications** that work with professional MIDI equipment
- **Create real-time interactive experiences** for live performance

### Why Use Web MIDI API?

**Traditional Approach Problems:**

- Desktop applications required installation
- Limited cross-platform compatibility
- Complex driver management
- No web-based sharing or collaboration

**Web MIDI API Benefits:**

- **Zero Installation**: Works directly in the browser
- **Cross-Platform**: Same code works on Windows, Mac, Linux
- **Real-Time Performance**: Low-latency MIDI communication
- **Web Integration**: Combine with other web technologies
- **Easy Sharing**: Send links to MIDI applications

## Browser Support

### Currently Supported

- **Chrome/Chromium**: Full support since version 43 (2015)
- **Edge**: Full support since Chromium-based version
- **Opera**: Full support since version 33

### Not Supported

- **Firefox**: No support (as of 2024)
- **Safari**: Limited/experimental support
- **Mobile Browsers**: Generally not supported

### Checking Support

```javascript
if (navigator.requestMIDIAccess) {
	console.log('Web MIDI API is supported');
} else {
	console.log('Web MIDI API not supported - use Chrome/Chromium');
}
```

## Getting Started

### Basic Setup

```javascript
// Request MIDI access
navigator.requestMIDIAccess().then(onMIDISuccess).catch(onMIDIFailure);

function onMIDISuccess(midiAccess) {
	console.log('MIDI Access granted');

	// List available inputs
	for (let input of midiAccess.inputs.values()) {
		console.log('MIDI Input:', input.name);
	}

	// List available outputs
	for (let output of midiAccess.outputs.values()) {
		console.log('MIDI Output:', output.name);
	}
}

function onMIDIFailure(error) {
	console.error('Failed to get MIDI access:', error);
}
```

### Request with System Exclusive Access

```javascript
// For advanced features like device configuration
navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess).catch(onMIDIFailure);
```

## Core Concepts

### MIDIAccess Object

The main entry point that provides access to MIDI inputs and outputs.

```javascript
interface MIDIAccess {
    readonly inputs: MIDIInputMap;     // Available input devices
    readonly outputs: MIDIOutputMap;   // Available output devices
    readonly sysexEnabled: boolean;    // System exclusive access
    onstatechange: function;           // Device connection changes
}
```

### MIDI Ports

Represent individual MIDI devices.

```javascript
interface MIDIPort {
    readonly id: string;           // Unique identifier
    readonly manufacturer: string; // Device manufacturer
    readonly name: string;         // Device name
    readonly type: 'input' | 'output';
    readonly version: string;      // Device version
    readonly state: 'connected' | 'disconnected';
    readonly connection: 'open' | 'closed' | 'pending';
}
```

### MIDI Input

Receives MIDI messages from external devices.

```javascript
interface MIDIInput extends MIDIPort {
    onmidimessage: function;  // Message receive handler
}
```

### MIDI Output

Sends MIDI messages to external devices.

```javascript
interface MIDIOutput extends MIDIPort {
    send(data: Uint8Array, timestamp?: number): void;
}
```

## Practical Examples

### Example 1: Listen to MIDI Input

```javascript
navigator.requestMIDIAccess().then(midiAccess => {
	// Get first available input
	const input = midiAccess.inputs.values().next().value;

	if (input) {
		input.onmidimessage = handleMIDIMessage;
		console.log('Listening to:', input.name);
	} else {
		console.log('No MIDI input devices found');
	}
});

function handleMIDIMessage(event) {
	const [status, note, velocity] = event.data;
	const timestamp = event.timeStamp;

	console.log('MIDI Message:', {
		status: status.toString(16),
		note: note,
		velocity: velocity,
		timestamp: timestamp
	});

	// Decode message type
	const messageType = status & 0xf0;
	const channel = status & 0x0f;

	switch (messageType) {
		case 0x90: // Note On
			console.log(`Note On: Channel ${channel}, Note ${note}, Velocity ${velocity}`);
			break;
		case 0x80: // Note Off
			console.log(`Note Off: Channel ${channel}, Note ${note}, Velocity ${velocity}`);
			break;
		case 0xb0: // Control Change
			console.log(`Control Change: Channel ${channel}, Controller ${note}, Value ${velocity}`);
			break;
	}
}
```

### Example 2: Send MIDI Output

```javascript
navigator.requestMIDIAccess().then(midiAccess => {
	const output = midiAccess.outputs.values().next().value;

	if (output) {
		// Send Note On (Channel 0, Note 60 [Middle C], Velocity 127)
		output.send([0x90, 60, 127]);

		// Send Note Off after 1 second
		setTimeout(() => {
			output.send([0x80, 60, 0]);
		}, 1000);
	}
});
```

### Example 3: MIDI Device Monitor

```javascript
class MIDIMonitor {
	constructor() {
		this.midiAccess = null;
		this.init();
	}

	async init() {
		try {
			this.midiAccess = await navigator.requestMIDIAccess();
			this.setupDeviceMonitoring();
			this.setupInputs();
			console.log('MIDI Monitor initialized');
		} catch (error) {
			console.error('MIDI initialization failed:', error);
		}
	}

	setupDeviceMonitoring() {
		this.midiAccess.onstatechange = event => {
			console.log(`Device ${event.port.state}: ${event.port.name}`);
			if (event.port.type === 'input' && event.port.state === 'connected') {
				this.setupInput(event.port);
			}
		};
	}

	setupInputs() {
		for (let input of this.midiAccess.inputs.values()) {
			this.setupInput(input);
		}
	}

	setupInput(input) {
		input.onmidimessage = event => {
			this.logMessage(input.name, event);
		};
	}

	logMessage(deviceName, event) {
		const [status, data1, data2] = event.data;
		console.log(`${deviceName}: ${status.toString(16)} ${data1} ${data2}`);
	}
}

// Usage
const monitor = new MIDIMonitor();
```

### Example 4: Virtual Piano

```javascript
class VirtualPiano {
	constructor() {
		this.output = null;
		this.currentChannel = 0;
		this.init();
	}

	async init() {
		try {
			const midiAccess = await navigator.requestMIDIAccess();
			this.output = midiAccess.outputs.values().next().value;

			if (!this.output) {
				console.warn('No MIDI output available');
				return;
			}

			this.createPianoKeys();
			console.log('Virtual Piano ready');
		} catch (error) {
			console.error('Piano initialization failed:', error);
		}
	}

	createPianoKeys() {
		const piano = document.createElement('div');
		piano.className = 'piano';

		// Create white keys (C, D, E, F, G, A, B)
		const whiteKeys = [60, 62, 64, 65, 67, 69, 71]; // Middle C octave

		whiteKeys.forEach(note => {
			const key = document.createElement('button');
			key.className = 'piano-key white';
			key.textContent = this.getNoteName(note);

			key.addEventListener('mousedown', () => this.playNote(note, 127));
			key.addEventListener('mouseup', () => this.stopNote(note));
			key.addEventListener('mouseleave', () => this.stopNote(note));

			piano.appendChild(key);
		});

		document.body.appendChild(piano);
	}

	playNote(note, velocity) {
		if (this.output) {
			// Note On message
			this.output.send([0x90 | this.currentChannel, note, velocity]);
		}
	}

	stopNote(note) {
		if (this.output) {
			// Note Off message
			this.output.send([0x80 | this.currentChannel, note, 0]);
		}
	}

	getNoteName(midiNote) {
		const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		return notes[midiNote % 12];
	}
}

// Usage
const piano = new VirtualPiano();
```

## Security and Permissions

### Permission Model

The Web MIDI API uses a permission-based security model:

1. **User Activation Required**: Must be triggered by user interaction
2. **Explicit Permission**: Browser prompts user for MIDI access
3. **Per-Origin Basis**: Permission granted per website domain
4. **Persistent Permission**: Once granted, permission persists for the origin

### Security Considerations

```javascript
// Always check if MIDI access was granted
navigator
	.requestMIDIAccess()
	.then(midiAccess => {
		if (midiAccess.inputs.size === 0 && midiAccess.outputs.size === 0) {
			console.warn('MIDI access granted but no devices available');
		}
	})
	.catch(error => {
		if (error.name === 'NotAllowedError') {
			console.error('User denied MIDI access');
		} else if (error.name === 'NotSupportedError') {
			console.error('MIDI not supported in this browser');
		}
	});
```

### System Exclusive (SysEx) Messages

- Require special permission: `{ sysex: true }`
- Used for device-specific configuration
- Higher security restrictions
- May trigger additional user prompts

## Error Handling

### Common Error Types

```javascript
navigator.requestMIDIAccess().catch(error => {
	switch (error.name) {
		case 'NotAllowedError':
			console.error('MIDI access denied by user');
			break;
		case 'NotSupportedError':
			console.error('MIDI not supported in this browser');
			break;
		case 'SecurityError':
			console.error('MIDI access blocked by security policy');
			break;
		case 'AbortError':
			console.error('MIDI access request was aborted');
			break;
		default:
			console.error('Unknown MIDI error:', error);
	}
});
```

### Robust Error Handling Pattern

```javascript
class MIDIManager {
	constructor() {
		this.isSupported = false;
		this.isEnabled = false;
		this.midiAccess = null;
	}

	async initialize() {
		// Check browser support
		if (!navigator.requestMIDIAccess) {
			throw new Error('Web MIDI API not supported. Use Chrome/Chromium.');
		}

		this.isSupported = true;

		try {
			this.midiAccess = await navigator.requestMIDIAccess();
			this.isEnabled = true;
			return this.midiAccess;
		} catch (error) {
			this.handleMIDIError(error);
			throw error;
		}
	}

	handleMIDIError(error) {
		const errorMessages = {
			NotAllowedError: 'Please allow MIDI access when prompted',
			NotSupportedError: 'MIDI not supported - try Chrome/Chromium',
			SecurityError: 'MIDI blocked by browser security',
			AbortError: 'MIDI request was cancelled'
		};

		const message = errorMessages[error.name] || `MIDI error: ${error.message}`;
		console.error(message);

		// Show user-friendly error message
		this.showErrorToUser(message);
	}

	showErrorToUser(message) {
		// Implementation depends on your UI framework
		alert(message); // Simple example
	}
}
```

## Best Practices

### Performance Optimization

```javascript
// 1. Minimize message processing overhead
function optimizedMIDIHandler(event) {
	const data = event.data;

	// Quick status byte check
	const status = data[0];
	if (status < 0x80) return; // Ignore running status

	// Use switch for performance
	switch (status & 0xf0) {
		case 0x90: // Note On
			handleNoteOn(data[1], data[2], status & 0x0f);
			break;
		case 0x80: // Note Off
			handleNoteOff(data[1], data[2], status & 0x0f);
			break;
		// ... other cases
	}
}

// 2. Batch MIDI output for efficiency
class MIDIBatchSender {
	constructor(output) {
		this.output = output;
		this.messageQueue = [];
		this.scheduledTime = null;
	}

	queueMessage(data, time) {
		this.messageQueue.push({ data, time });
		this.scheduleFlush();
	}

	scheduleFlush() {
		if (this.scheduledTime) return;

		this.scheduledTime = requestAnimationFrame(() => {
			this.flushMessages();
			this.scheduledTime = null;
		});
	}

	flushMessages() {
		const now = performance.now();

		this.messageQueue.forEach(({ data, time }) => {
			this.output.send(data, time || now);
		});

		this.messageQueue.length = 0;
	}
}
```

### Memory Management

```javascript
class MIDIApp {
	constructor() {
		this.inputs = new Map();
		this.outputs = new Map();
	}

	async initialize() {
		this.midiAccess = await navigator.requestMIDIAccess();
		this.setupDevices();

		// Listen for device changes
		this.midiAccess.onstatechange = this.handleStateChange.bind(this);
	}

	setupDevices() {
		// Setup inputs
		for (let input of this.midiAccess.inputs.values()) {
			input.onmidimessage = this.handleMIDIMessage.bind(this);
			this.inputs.set(input.id, input);
		}

		// Setup outputs
		for (let output of this.midiAccess.outputs.values()) {
			this.outputs.set(output.id, output);
		}
	}

	handleStateChange(event) {
		const port = event.port;

		if (port.state === 'disconnected') {
			// Clean up references
			if (port.type === 'input') {
				port.onmidimessage = null;
				this.inputs.delete(port.id);
			} else {
				this.outputs.delete(port.id);
			}
		}
	}

	destroy() {
		// Clean up all event listeners
		for (let input of this.inputs.values()) {
			input.onmidimessage = null;
		}

		this.inputs.clear();
		this.outputs.clear();

		if (this.midiAccess) {
			this.midiAccess.onstatechange = null;
		}
	}
}
```

### Timing and Synchronization

```javascript
// High-precision timing for MIDI events
class MIDIScheduler {
	constructor(output) {
		this.output = output;
		this.scheduleAhead = 25.0; // 25ms lookahead
		this.scheduleInterval = 25.0; // 25ms scheduling interval
		this.nextNoteTime = 0.0;
		this.isRunning = false;
	}

	start() {
		this.nextNoteTime = performance.now();
		this.isRunning = true;
		this.schedule();
	}

	schedule() {
		if (!this.isRunning) return;

		const currentTime = performance.now();

		while (this.nextNoteTime < currentTime + this.scheduleAhead) {
			// Schedule next event
			this.scheduleNote(this.nextNoteTime);
			this.nextNoteTime += 500; // 500ms intervals
		}

		setTimeout(() => this.schedule(), this.scheduleInterval);
	}

	scheduleNote(time) {
		// Send MIDI message at precise time
		this.output.send([0x90, 60, 100], time);
		this.output.send([0x80, 60, 0], time + 100); // Note off 100ms later
	}

	stop() {
		this.isRunning = false;
	}
}
```

## Troubleshooting

### Common Issues and Solutions

**Issue: "Web MIDI API not supported"**

- **Solution**: Use Chrome, Chromium, or Edge browser
- **Check**: `navigator.requestMIDIAccess` exists

**Issue: Permission denied**

- **Solution**: Ensure request is triggered by user interaction
- **Check**: Call from click handler, not on page load

**Issue: No MIDI devices found**

- **Solution**: Check device connections and drivers
- **Check**: Device shows up in OS MIDI settings

**Issue: Messages not received**

- **Solution**: Verify `onmidimessage` handler is set
- **Check**: Device is actually sending MIDI data

**Issue: High latency**

- **Solution**: Use timestamp parameter in `send()`
- **Check**: Minimize processing in message handlers

### Debug Utilities

```javascript
// MIDI message debugger
class MIDIDebugger {
	static logMessage(event, deviceName = 'Unknown') {
		const [status, data1, data2] = event.data;
		const timestamp = event.timeStamp.toFixed(2);

		const messageType = this.getMessageType(status);
		const channel = (status & 0x0f) + 1;

		console.log(`[${timestamp}ms] ${deviceName} - ${messageType} Ch${channel}: ${data1} ${data2}`);
	}

	static getMessageType(status) {
		const types = {
			0x80: 'Note Off',
			0x90: 'Note On',
			0xa0: 'Poly Pressure',
			0xb0: 'Control Change',
			0xc0: 'Program Change',
			0xd0: 'Channel Pressure',
			0xe0: 'Pitch Bend',
			0xf0: 'System Message'
		};

		return types[status & 0xf0] || 'Unknown';
	}

	static createMonitor() {
		navigator.requestMIDIAccess().then(midiAccess => {
			for (let input of midiAccess.inputs.values()) {
				input.onmidimessage = event => {
					this.logMessage(event, input.name);
				};
				console.log(`Monitoring: ${input.name}`);
			}
		});
	}
}

// Usage: MIDIDebugger.createMonitor();
```

### Performance Monitoring

```javascript
// Monitor MIDI performance
class MIDIPerformanceMonitor {
	constructor() {
		this.messageCount = 0;
		this.lastTimestamp = 0;
		this.averageLatency = 0;
		this.maxLatency = 0;
	}

	monitorInput(input) {
		input.onmidimessage = event => {
			this.recordMessage(event);
			// Forward to actual handler
			this.handleMessage(event);
		};
	}

	recordMessage(event) {
		this.messageCount++;

		const now = performance.now();
		const latency = now - event.timeStamp;

		this.averageLatency = (this.averageLatency + latency) / 2;
		this.maxLatency = Math.max(this.maxLatency, latency);

		if (this.messageCount % 100 === 0) {
			console.log(`MIDI Stats: ${this.messageCount} messages, ` + `Avg latency: ${this.averageLatency.toFixed(2)}ms, ` + `Max latency: ${this.maxLatency.toFixed(2)}ms`);
		}
	}

	handleMessage(event) {
		// Your actual message handling code
	}
}
```

## Resources

### Official Documentation

- [W3C Web MIDI API Specification](https://www.w3.org/TR/webmidi/)
- [MDN Web MIDI API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)

### Tools and Libraries

- **Jazz-MIDI**: Polyfill for older browsers
- **WebMidi.js**: High-level wrapper library
- **Tone.js**: Audio framework with MIDI support
- **MIDI.js**: JavaScript MIDI file player

### MIDI Specifications

- [MIDI 1.0 Specification](https://midi.org/specifications)
- [General MIDI Standard](https://midi.org/specifications/midi-1-0-specifications)

### Browser Support Status

- [Can I Use: Web MIDI API](https://caniuse.com/midi)
- [Chrome Platform Status](https://chromestatus.com/feature/4906022618988544)

### Testing Tools

- **MIDI-OX** (Windows): MIDI monitoring and testing
- **SnoizeMIDI** (macOS): MIDI monitor application
- **Virtual MIDI Piano Keyboard**: Software MIDI controller

---

_This guide covers the essential aspects of the Web MIDI API for practical development. For the most current information, always refer to the official specifications and browser documentation._
