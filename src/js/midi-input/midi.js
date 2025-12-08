import appState from '../core/AppState.js';
import settings from '../core/settings.js';

/**
 * MIDI module - Handles Web MIDI API and device management only
 * Dispatches parsed MIDI events through app state for loose coupling
 * Supports hot-plug: devices can be connected/disconnected at runtime
 */
class MIDI {
	#midiAccess = null;
	#connectedInputs = new Map();
	#boundHandleMIDIMessage = this.#handleMIDIMessage.bind(this);
	#boundStateChange = this.#handleStateChange.bind(this);
	#messageMinLength = settings.midi.messageMinLength;
	#commandNoteOn = settings.midi.commands.noteOn;
	#commandNoteOff = settings.midi.commands.noteOff;
	#commandControlChange = settings.midi.commands.controlChange;
	#systemClock = settings.midi.systemRealTime.clock;
	#systemStart = settings.midi.systemRealTime.start;
	#systemContinue = settings.midi.systemRealTime.continue;
	#systemStop = settings.midi.systemRealTime.stop;

	constructor() {
		this.#init();
	}

	#init() {
		if (this.#isSupported()) {
			this.#requestAccess();
		} else {
			console.log('WebMIDI is not supported in this browser.');
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
		console.log('WebMIDI supported');
		this.#setupMIDIInputs(midiAccess);
		this.#setupStateChangeListener(midiAccess);
		this.#updateConnectionState();
	}

	#onMIDIFailure(error) {
		console.error('Failed to get MIDI access:', error);
		try {
			appState.midiConnected = false;
		} catch (err) {
			console.warn('Failed to set appState.midiConnected = false on MIDI failure:', err);
		}
	}

	/**
	 * Listen for MIDI device connect/disconnect events
	 */
	#setupStateChangeListener(midiAccess) {
		try {
			if (typeof midiAccess.addEventListener === 'function') {
				midiAccess.addEventListener('statechange', this.#boundStateChange);
			} else {
				midiAccess.onstatechange = this.#boundStateChange;
			}
		} catch (err) {
			console.warn('Failed to set up statechange listener:', err);
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
		console.log(`MIDI connected: ${input.name}`);
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
		console.log(`MIDI disconnected: ${input.name}`);
	}

	/**
	 * Update app state based on connected devices
	 */
	#updateConnectionState() {
		try {
			appState.midiConnected = this.#connectedInputs.size > 0;
		} catch (err) {
			console.warn('Failed to update appState.midiConnected state:', err);
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

		const status = message.data[0];

		// Handle System Real-Time messages (single-byte, no channel)
		// These are high-priority timing messages and should be processed first
		if (status >= 0xf8) {
			try {
				switch (status) {
					case this.#systemClock:
						appState.dispatchMIDIClock(performance.now());
						break;
					case this.#systemStart:
						appState.dispatchMIDIStart();
						break;
					case this.#systemContinue:
						appState.dispatchMIDIContinue();
						break;
					case this.#systemStop:
						appState.dispatchMIDIStop();
						break;
					default:
						// Other system real-time messages (0xFE Active Sensing, 0xFF Reset)
						break;
				}
			} catch (error) {
				console.error('Error dispatching System Real-Time event:', error);
			}
			return;
		}

		// Channel messages require at least 3 bytes (for Note and CC)
		if (message.data.length < this.#messageMinLength) {
			return;
		}

		const [, note, velocity] = message.data;
		const command = status >> 4;
		const channel = status & 0xf;

		try {
			switch (command) {
				case this.#commandNoteOn:
					if (velocity > 0) {
						appState.dispatchMIDINoteOn(channel, note, velocity);
					} else {
						appState.dispatchMIDINoteOff(channel, note);
					}
					break;
				case this.#commandNoteOff:
					appState.dispatchMIDINoteOff(channel, note);
					break;
				case this.#commandControlChange:
					// note = controller number, velocity = value
					appState.dispatchMIDIControlChange(channel, note, velocity);
					break;
				default:
					break;
			}
		} catch (error) {
			console.error('Error dispatching MIDI event:', error);
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
		// Disconnect all inputs
		for (const input of this.#connectedInputs.values()) {
			try {
				if (typeof input.removeEventListener === 'function') {
					input.removeEventListener('midimessage', this.#boundHandleMIDIMessage);
				} else {
					input.onmidimessage = null;
				}
			} catch (error) {
				console.warn('Failed to clear midimessage on input:', input?.id, error);
			}
		}
		this.#connectedInputs.clear();

		// Remove statechange listener from midiAccess
		if (this.#midiAccess) {
			try {
				if (typeof this.#midiAccess.removeEventListener === 'function') {
					this.#midiAccess.removeEventListener('statechange', this.#boundStateChange);
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

const midi = new MIDI();

export default midi;
