import appState from './app-state.js';

/**
 * MIDI module - Handles Web MIDI API and device management only
 * Dispatches parsed MIDI events through app state for loose coupling
 * Supports hot-plug: devices can be connected/disconnected at runtime
 */
class MIDI {
	constructor() {
		this.midiAccess = null;
		this.connectedInputs = new Map();
		this.init();
	}

	init() {
		if (this.isSupported()) {
			this.requestAccess();
		} else {
			console.log('WebMIDI is not supported in this browser.');
		}
	}

	isSupported() {
		return !!navigator.requestMIDIAccess;
	}

	async requestAccess() {
		try {
			this.midiAccess = await navigator.requestMIDIAccess();
			this.onMIDISuccess(this.midiAccess);
		} catch (error) {
			this.onMIDIFailure(error);
		}
	}

	onMIDISuccess(midiAccess) {
		console.log('WebMIDI supported');
		this.setupMIDIInputs(midiAccess);
		this.setupStateChangeListener(midiAccess);
		this.updateConnectionState();
	}

	onMIDIFailure(error) {
		console.error('Failed to get MIDI access:', error);
		appState.midiConnected = false;
	}

	/**
	 * Listen for MIDI device connect/disconnect events
	 */
	setupStateChangeListener(midiAccess) {
		midiAccess.onstatechange = event => {
			const port = event.port;

			if (port.type === 'input') {
				if (port.state === 'connected') {
					this.connectInput(port);
				} else if (port.state === 'disconnected') {
					this.disconnectInput(port);
				}
			}

			this.updateConnectionState();
		};
	}

	/**
	 * Set up all currently available MIDI inputs
	 */
	setupMIDIInputs(midiAccess) {
		for (const input of midiAccess.inputs.values()) {
			this.connectInput(input);
		}
	}

	/**
	 * Connect a single MIDI input device
	 */
	connectInput(input) {
		if (this.connectedInputs.has(input.id)) {
			return; // Already connected
		}

		input.onmidimessage = this.handleMIDIMessage.bind(this);
		this.connectedInputs.set(input.id, input);
		console.log(`MIDI connected: ${input.name}`);
	}

	/**
	 * Disconnect a single MIDI input device
	 */
	disconnectInput(input) {
		if (!this.connectedInputs.has(input.id)) {
			return; // Not connected
		}

		input.onmidimessage = null;
		this.connectedInputs.delete(input.id);
		console.log(`MIDI disconnected: ${input.name}`);
	}

	/**
	 * Update app state based on connected devices
	 */
	updateConnectionState() {
		appState.midiConnected = this.connectedInputs.size > 0;
	}

	/**
	 * Get list of connected MIDI input names
	 */
	getConnectedDevices() {
		return Array.from(this.connectedInputs.values()).map(input => input.name);
	}

	handleMIDIMessage(message) {
		const [status, data1, data2] = message.data;
		const command = status >> 4;
		const channel = status & 0xf;
		const note = data1;
		const velocity = data2;

		switch (command) {
			case 9: // Note on
				if (velocity > 0) {
					appState.dispatchMIDINoteOn(channel, note, velocity);
				} else {
					appState.dispatchMIDINoteOff(channel, note);
				}
				break;
			case 8: // Note off
				appState.dispatchMIDINoteOff(channel, note);
				break;
			default:
				break;
		}
	}
}

const midi = new MIDI();

export default midi;
