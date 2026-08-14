import defaultAppState from '../core/AppState.js';
import defaultSettings from '../core/settings.js';
import { DEFAULT_MAX_MIDI_MESSAGE_LENGTH, MAX_MIDI_MESSAGE_BYTE } from '../core/midiConstants.js';

const SYSTEM_REAL_TIME_THRESHOLD = 0xf8;
const CHANNEL_NIBBLE_MASK = 0xf;
const DISABLED_DEVICE_IDS_STORAGE_KEY = 'akvj.midi.uncheckedDeviceIds';

/**
 * MIDI module - Handles Web MIDI API and device management only
 * Dispatches parsed MIDI events through app state for loose coupling
 * Supports hot-plug: devices can be connected/disconnected at runtime
 */
class Midi {
	#midiAccess = null;
	#connectedInputs = new Map();
	#disabledDeviceIds = new Set();
	#boundHandleMIDIMessage = this.#handleMIDIMessage.bind(this);
	#boundHandleStateChange = this.#handleStateChange.bind(this);
	#initializationPromise = Promise.resolve();
	#isDestroyed = false;
	#appState;
	#settings;
	#storage;

	constructor({ appState = defaultAppState, settings = defaultSettings, storage = globalThis.localStorage } = {}) {
		this.#appState = appState;
		this.#settings = settings;
		this.#storage = storage;
		this.#loadDisabledDeviceIds();
		this.#initializeMIDIAccess();
	}

	get ready() {
		return this.#initializationPromise;
	}

	#initializeMIDIAccess() {
		if (this.#isSupported()) {
			this.#initializationPromise = this.#requestAccess();
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
			if (this.#isDestroyed) {
				return;
			}
			this.#midiAccess = midiAccess;
			this.#handleMIDISuccess(this.#midiAccess);
		} catch (error) {
			if (this.#isDestroyed) {
				return;
			}
			this.#handleMIDIFailure(error);
		}
	}
	#handleMIDISuccess(midiAccess) {
		if (import.meta.env.DEV) {
			console.log('WebMIDI supported');
		}
		this.#initializeMIDIInputs(midiAccess);
		this.#initializeStateChangeListener(midiAccess);
		this.#updateConnectionState();
		this.#notifyDevicesChanged();
	}

	#handleMIDIFailure(error) {
		console.error('Failed to get MIDI access:', error);
		try {
			this.#appState.midiConnected = false;
		} catch (resetError) {
			console.warn('Failed to set this.#appState.midiConnected = false on MIDI failure:', resetError);
		}
		this.#appState.showError(`MIDI access failed: ${error?.message ?? 'Unknown error'}. Use Chrome/Chromium with MIDI enabled.`);
	}

	/**
	 * Listen for MIDI device connect/disconnect events
	 */
	#initializeStateChangeListener(midiAccess) {
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
		this.#notifyDevicesChanged();
	}

	/**
	 * Initialize all currently available MIDI inputs
	 */
	#initializeMIDIInputs(midiAccess) {
		for (const input of midiAccess.inputs.values()) {
			this.#connectInput(input);
		}
	}

	/**
	 * Connect a single MIDI input device
	 * Enforces maximum device limit to prevent resource exhaustion
	 */
	#connectInput(input) {
		if (this.#connectedInputs.has(input.id)) {
			return; // Already connected
		}

		// Security: Enforce maximum device limit
		const maxMidiDevices = this.#settings.midi?.maxMidiDevices ?? 8;
		if (this.#connectedInputs.size >= maxMidiDevices) {
			console.warn(`Midi: maximum MIDI device limit (${maxMidiDevices}) reached, ignoring connection: ${input.name}`);
			return;
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
			this.#appState.midiConnected = this.#connectedInputs.size > 0;
		} catch (error) {
			console.warn('Failed to update this.#appState.midiConnected state:', error);
		}
	}

	#notifyDevicesChanged() {
		try {
			this.#appState.dispatchMIDIDevicesChanged?.(this.getConnectedDevices());
		} catch (error) {
			console.warn('Failed to dispatch midiDevicesChanged:', error);
		}
	}

	#loadDisabledDeviceIds() {
		this.#disabledDeviceIds = new Set();
		if (!this.#storage || typeof this.#storage.getItem !== 'function') {
			return;
		}
		try {
			const raw = this.#storage.getItem(DISABLED_DEVICE_IDS_STORAGE_KEY);
			if (raw === null || raw === '') {
				return;
			}
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				return;
			}
			for (const id of parsed) {
				if (typeof id === 'string' && id.length > 0) {
					this.#disabledDeviceIds.add(id);
				}
			}
		} catch (error) {
			console.warn('Midi: failed to read disabled device ids from storage, fail-open:', error);
			this.#disabledDeviceIds = new Set();
		}
	}

	#persistDisabledDeviceIds() {
		if (!this.#storage || typeof this.#storage.setItem !== 'function') {
			return;
		}
		try {
			this.#storage.setItem(DISABLED_DEVICE_IDS_STORAGE_KEY, JSON.stringify([...this.#disabledDeviceIds]));
		} catch (error) {
			console.warn('Midi: failed to persist disabled device ids:', error);
		}
	}

	#isDeviceEnabled(deviceId) {
		if (deviceId === null || deviceId === undefined || deviceId === '') {
			return true;
		}
		return !this.#disabledDeviceIds.has(deviceId);
	}

	#resolveDeviceDisplayName(input) {
		return input?.name ?? input?.id ?? 'unknown';
	}

	/**
	 * Returns currently connected MIDI inputs with enable state.
	 *
	 * @public
	 * @returns {{ id: string, name: string, enabled: boolean }[]}
	 */
	getConnectedDevices() {
		return Array.from(this.#connectedInputs.values()).map(input => {
			const id = input.id ?? 'unknown';
			return {
				id,
				name: this.#resolveDeviceDisplayName(input),
				enabled: this.#isDeviceEnabled(input.id)
			};
		});
	}

	/**
	 * Enable or disable a connected MIDI input by id.
	 * Disabled ids are persisted as the disabled set (fail-open).
	 *
	 * @public
	 * @param {string} deviceId
	 * @param {boolean} enabled
	 */
	setDeviceEnabled(deviceId, enabled) {
		if (typeof deviceId !== 'string' || deviceId.length === 0) {
			return;
		}
		if (enabled) {
			this.#disabledDeviceIds.delete(deviceId);
		} else {
			this.#disabledDeviceIds.add(deviceId);
		}
		this.#persistDisabledDeviceIds();
		this.#notifyDevicesChanged();
	}

	#resolveDeviceInfo(message) {
		const target = message?.target;
		const deviceId = target?.id ?? null;
		const deviceName = target ? this.#resolveDeviceDisplayName(target) : null;
		return { deviceId, deviceName };
	}

	#handleMIDIMessage(message) {
		if (!message?.data || message.data.length === 0) {
			return;
		}

		const deviceInfo = this.#resolveDeviceInfo(message);
		if (!this.#isDeviceEnabled(deviceInfo.deviceId)) {
			return;
		}

		// Security: Validate message length before parsing
		const maxMessageLength = this.#settings.midi?.maxMessageLength ?? DEFAULT_MAX_MIDI_MESSAGE_LENGTH;
		if (message.data.length > maxMessageLength) {
			console.warn(`Midi: message length ${message.data.length} exceeds maximum ${maxMessageLength}, ignoring`);
			return;
		}

		// Security: Validate data integrity - check for null bytes and control characters
		for (let i = 0; i < message.data.length; i++) {
			const byte = message.data[i];
			if (typeof byte !== 'number' || byte < 0 || byte > MAX_MIDI_MESSAGE_BYTE || !Number.isInteger(byte)) {
				console.warn(`Midi: invalid byte at index ${i}: ${byte}, ignoring message`);
				return;
			}
		}

		const statusByte = message.data[0];

		if (statusByte >= SYSTEM_REAL_TIME_THRESHOLD) {
			this.#handleSystemRealTime(statusByte);
			return;
		}

		this.#handleChannelMessage(message.data, deviceInfo);
	}

	#handleSystemRealTime(statusByte) {
		const { systemRealTime } = this.#settings.midi;
		switch (statusByte) {
			case systemRealTime.clock:
				this.#appState.dispatchMIDIClock(performance.now());
				break;
			case systemRealTime.start:
				this.#appState.dispatchMIDIStart();
				break;
			case systemRealTime.continue:
				this.#appState.dispatchMIDIContinue();
				break;
			case systemRealTime.stop:
				this.#appState.dispatchMIDIStop();
				break;
			default:
				break;
		}
	}

	#handleChannelMessage(messageData, deviceInfo) {
		const { channelMessageMinLength: minimumMessageLength } = this.#settings.midi;
		if (messageData.length < minimumMessageLength) {
			return;
		}

		const statusByte = messageData[0];
		const [, firstDataByte, secondDataByte] = messageData;
		const command = statusByte >> 4;
		const channel = statusByte & CHANNEL_NIBBLE_MASK;

		this.#dispatchChannelMessage(command, channel, firstDataByte, secondDataByte, deviceInfo);
	}

	#dispatchChannelMessage(command, channel, firstDataByte, secondDataByte, deviceInfo) {
		const { commands } = this.#settings.midi;
		switch (command) {
			case commands.noteOn:
				this.#handleNoteOn(channel, firstDataByte, secondDataByte, deviceInfo);
				break;
			case commands.noteOff:
				this.#appState.dispatchMIDINoteOff(channel, firstDataByte, deviceInfo);
				break;
			case commands.controlChange:
				this.#appState.dispatchMIDIControlChange(channel, firstDataByte, secondDataByte, deviceInfo);
				break;
			default:
				break;
		}
	}

	#handleNoteOn(channel, note, velocity, deviceInfo) {
		if (velocity > 0) {
			if (channel === this.#settings.channelMapping.projectSelection) {
				this.#handleProjectSelection(note);
			} else {
				this.#appState.dispatchMIDINoteOn(channel, note, velocity, deviceInfo);
			}
		} else {
			this.#appState.dispatchMIDINoteOff(channel, note, deviceInfo);
		}
	}

	/**
	 * Handle project selection via MIDI note on the project selection channel.
	 * The note number maps to a project index in the projects index array.
	 * @param {number} note - MIDI note number (0-127), used as project index
	 */
	#handleProjectSelection(note) {
		this.#appState.dispatchProjectSelection(note);
	}

	/**
	 * Clean up all MIDI event listeners and disconnect all inputs.
	 *
	 * @public
	 * @returns {void}
	 * @description
	 * Removes midimessage handlers from all connected inputs, clears the
	 * statechange listener from midiAccess, and resets this.#appState.midiConnected.
	 * Safe to call multiple times. Used for teardown in tests and HMR.
	 */
	destroy() {
		this.#isDestroyed = true;
		for (const input of this.#connectedInputs.values()) {
			this.#disconnectInput(input);
		}
		this.#connectedInputs.clear();
		this.#removeStateChangeListener();

		try {
			this.#appState.midiConnected = false;
		} catch (error) {
			console.warn('Failed to reset this.#appState.midiConnected during cleanup:', error);
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
export { DISABLED_DEVICE_IDS_STORAGE_KEY };
