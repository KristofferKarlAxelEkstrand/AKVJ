import appState from '../core/AppState.js';
import settings from '../core/settings.js';

const SYSTEM_REAL_TIME_THRESHOLD = 0xf8;
const CHANNEL_NIBBLE_MASK = 0xf;

/**
 * MIDI module - Handles Web MIDI API and device management only
 * Dispatches parsed MIDI events through app state for loose coupling
 * Supports hot-plug: devices can be connected/disconnected at runtime
 */
class Midi {
	#midiAccess = null;
	#connectedInputs = new Map();
	#boundHandleMIDIMessage = this.#handleMIDIMessage.bind(this);
	#boundHandleStateChange = this.#handleStateChange.bind(this);
	#setupPromise = Promise.resolve();
	#destroyed = false;

	constructor() {
		this.#setup();
	}

	get ready() {
		return this.#setupPromise;
	}

	#setup() {
		if (this.#isSupported()) {
			this.#setupPromise = this.#requestAccess();
		} else {
			if (import.meta.env.DEV) {
				console.log('WebMIDI is not supported in this browser.');
			}
		}
	}

	#isSupported() {
		return !!navigator.requestMIDIAccess;
	}

	async #requestAccess() {
		try {
			const midiAccess = await navigator.requestMIDIAccess();
			if (this.#destroyed) {
				return;
			}
			this.#midiAccess = midiAccess;
			this.#handleMIDISuccess(this.#midiAccess);
		} catch (error) {
			if (this.#destroyed) {
				return;
			}
			this.#handleMIDIFailure(error);
		}
	}
	#handleMIDISuccess(midiAccess) {
		if (import.meta.env.DEV) {
			console.log('WebMIDI supported');
		}
		this.#setupMIDIInputs(midiAccess);
		this.#setupStateChangeListener(midiAccess);
		this.#updateConnectionState();
	}

	#handleMIDIFailure(error) {
		console.error('Failed to get MIDI access:', error);
		try {
			appState.midiConnected = false;
		} catch (error) {
			console.warn('Failed to set appState.midiConnected = false on MIDI failure:', error);
		}
	}

	/**
	 * Listen for MIDI device connect/disconnect events
	 */
	#setupStateChangeListener(midiAccess) {
		try {
			if (typeof midiAccess.addEventListener === 'function') {
				midiAccess.addEventListener('statechange', this.#boundHandleStateChange);
			} else {
				midiAccess.onstatechange = this.#boundHandleStateChange;
			}
		} catch (error) {
			console.warn('Failed to set up statechange listener:', error);
		}
	}

	#handleStateChange(event) {
		const { port } = event;

		if (port && port.type === 'input') {
			if (port.state === 'connected') {
				this.#connectInput(port);
			} else if (port.state === 'disconnected') {
				this.#disconnectInput(port);
			}
		}

		this.#updateConnectionState();
	}

	/**
	 * Set up all currently available MIDI inputs
	 */
	#setupMIDIInputs(midiAccess) {
		for (const input of midiAccess.inputs.values()) {
			this.#connectInput(input);
		}
	}

	/**
	 * Connect a single MIDI input device
	 */
	#connectInput(input) {
		if (this.#connectedInputs.has(input.id)) {
			return; // Already connected
		}

		try {
			if (typeof input.addEventListener === 'function') {
				input.addEventListener('midimessage', this.#boundHandleMIDIMessage);
			} else {
				input.onmidimessage = this.#boundHandleMIDIMessage;
			}
		} catch (error) {
			console.warn('Failed to attach midimessage handler for input:', input?.id, error);
		}
		this.#connectedInputs.set(input.id, input);
		if (import.meta.env.DEV) {
			console.log(`MIDI connected: ${input.name}`);
		}
	}

	/**
	 * Disconnect a single MIDI input device
	 */
	#disconnectInput(input) {
		if (!this.#connectedInputs.has(input.id)) {
			return; // Not connected
		}

		try {
			if (typeof input.removeEventListener === 'function') {
				input.removeEventListener('midimessage', this.#boundHandleMIDIMessage);
			} else {
				input.onmidimessage = null;
			}
		} catch (error) {
			console.warn('Failed to clear midimessage handler for input:', input?.id, error);
		}
		this.#connectedInputs.delete(input.id);
		if (import.meta.env.DEV) {
			console.log(`MIDI disconnected: ${input.name}`);
		}
	}

	/**
	 * Update app state based on connected devices
	 */
	#updateConnectionState() {
		try {
			appState.midiConnected = this.#connectedInputs.size > 0;
		} catch (error) {
			console.warn('Failed to update appState.midiConnected state:', error);
		}
	}

	/**
	 * Returns a list of names of currently connected MIDI input devices.
	 *
	 * @public
	 * @returns {string[]} Array of connected MIDI input device names.
	 * @description
	 * This method is part of the public API contract. It provides external access
	 * to the names of currently connected MIDI input devices, without exposing
	 * internal state or device objects.
	 */
	getConnectedDevices() {
		return Array.from(this.#connectedInputs.values()).map(input => input.name ?? input.id ?? 'unknown');
	}

	#handleMIDIMessage(message) {
		if (!message?.data || message.data.length === 0) {
			return;
		}

		const statusByte = message.data[0];

		if (statusByte >= SYSTEM_REAL_TIME_THRESHOLD) {
			this.#handleSystemRealTime(statusByte);
			return;
		}

		this.#handleChannelMessage(message.data);
	}

	#handleSystemRealTime(statusByte) {
		const { systemRealTime } = settings.midi;
		switch (statusByte) {
			case systemRealTime.clock:
				appState.dispatchMIDIClock(performance.now());
				break;
			case systemRealTime.start:
				appState.dispatchMIDIStart();
				break;
			case systemRealTime.continue:
				appState.dispatchMIDIContinue();
				break;
			case systemRealTime.stop:
				appState.dispatchMIDIStop();
				break;
			default:
				break;
		}
	}

	#handleChannelMessage(messageData) {
		const { channelMessageMinLength: minimumMessageLength } = settings.midi;
		if (messageData.length < minimumMessageLength) {
			return;
		}

		const statusByte = messageData[0];
		const [, firstDataByte, secondDataByte] = messageData;
		const command = statusByte >> 4;
		const channel = statusByte & CHANNEL_NIBBLE_MASK;

		this.#dispatchChannelMessage(command, channel, firstDataByte, secondDataByte);
	}

	#dispatchChannelMessage(command, channel, firstDataByte, secondDataByte) {
		const { commands } = settings.midi;
		switch (command) {
			case commands.noteOn:
				this.#handleNoteOn(channel, firstDataByte, secondDataByte);
				break;
			case commands.noteOff:
				appState.dispatchMIDINoteOff(channel, firstDataByte);
				break;
			case commands.controlChange:
				appState.dispatchMIDIControlChange(channel, firstDataByte, secondDataByte);
				break;
			default:
				break;
		}
	}

	#handleNoteOn(channel, note, velocity) {
		if (velocity > 0) {
			appState.dispatchMIDINoteOn(channel, note, velocity);
		} else {
			appState.dispatchMIDINoteOff(channel, note);
		}
	}

	/**
	 * Clean up all MIDI event listeners and disconnect all inputs.
	 *
	 * @public
	 * @returns {void}
	 * @description
	 * Removes midimessage handlers from all connected inputs, clears the
	 * statechange listener from midiAccess, and resets appState.midiConnected.
	 * Safe to call multiple times. Used for teardown in tests and HMR.
	 */
	destroy() {
		this.#destroyed = true;
		for (const input of this.#connectedInputs.values()) {
			this.#disconnectInput(input);
		}
		this.#connectedInputs.clear();
		this.#removeStateChangeListener();

		try {
			appState.midiConnected = false;
		} catch (error) {
			console.warn('Failed to reset appState.midiConnected during cleanup:', error);
		}
	}

	#removeStateChangeListener() {
		if (!this.#midiAccess) {
			return;
		}
		try {
			if (typeof this.#midiAccess.removeEventListener === 'function') {
				this.#midiAccess.removeEventListener('statechange', this.#boundHandleStateChange);
			} else {
				this.#midiAccess.onstatechange = null;
			}
		} catch (error) {
			console.warn('Failed to remove statechange handler:', error);
		}
		this.#midiAccess = null;
	}
}

export default Midi;
