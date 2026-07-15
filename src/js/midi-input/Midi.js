import appState from '../core/AppState.js';
import settings from '../core/settings.js';

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

	constructor() {
		this.#init();
	}

	#init() {
		if (this.#isSupported()) {
			this.#requestAccess();
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
			this.#midiAccess = await navigator.requestMIDIAccess();
			this.#onMIDISuccess(this.#midiAccess);
		} catch (error) {
			this.#onMIDIFailure(error);
		}
	}
	#onMIDISuccess(midiAccess) {
		if (import.meta.env.DEV) {
			console.log('WebMIDI supported');
		}
		this.#setupMIDIInputs(midiAccess);
		this.#setupStateChangeListener(midiAccess);
		this.#updateConnectionState();
	}

	#onMIDIFailure(error) {
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
		const { commands, systemRealTime, channelMessageMinLength: minimumMessageLength } = settings.midi;

		// Handle System Real-Time messages (single-byte, no channel)
		// These are high-priority timing messages and should be processed first
		if (statusByte >= 0xf8) {
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
					// Other system real-time messages (0xFE Active Sensing, 0xFF Reset)
					break;
			}
			return;
		}

		// Channel messages require at least 3 bytes (for Note and CC)
		if (message.data.length < minimumMessageLength) {
			return;
		}

		const [, firstDataByte, secondDataByte] = message.data;
		const command = statusByte >> 4;
		const channel = statusByte & 0xf;

		switch (command) {
			case commands.noteOn:
				if (secondDataByte > 0) {
					appState.dispatchMIDINoteOn(channel, firstDataByte, secondDataByte);
				} else {
					appState.dispatchMIDINoteOff(channel, firstDataByte);
				}
				break;
			case commands.noteOff:
				appState.dispatchMIDINoteOff(channel, firstDataByte);
				break;
			case commands.controlChange:
				// firstDataByte = controller number, secondDataByte = value
				appState.dispatchMIDIControlChange(channel, firstDataByte, secondDataByte);
				break;
			default:
				break;
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
		// Disconnect all inputs using the shared disconnect path
		for (const input of this.#connectedInputs.values()) {
			this.#disconnectInput(input);
		}
		this.#connectedInputs.clear();

		// Remove statechange listener from midiAccess
		if (this.#midiAccess) {
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

		// Reset connection state
		try {
			appState.midiConnected = false;
		} catch (err) {
			console.warn('Failed to reset appState.midiConnected during cleanup:', err);
		}
	}
}

const midi = new Midi();

export default midi;
