/**
 * Event-based state management for AKVJ
 * Provides centralized state with event notifications for loose coupling
 * Handles all inter-module communication without direct references
 */
class AppState extends EventTarget {
	constructor() {
		super();
		this._midiConnected = false;
		this._animationsLoaded = false;
	}

	set midiConnected(connected) {
		const oldValue = this._midiConnected;
		this._midiConnected = connected;

		if (oldValue !== connected) {
			this.dispatchEvent(
				new CustomEvent('midiConnectionChanged', {
					detail: { connected }
				})
			);
		}
	}

	get midiConnected() {
		return this._midiConnected;
	}

	set animationsLoaded(loaded) {
		const oldValue = this._animationsLoaded;
		this._animationsLoaded = loaded;

		if (oldValue !== loaded) {
			this.dispatchEvent(
				new CustomEvent('animationsLoadedChanged', {
					detail: { loaded }
				})
			);
		}
	}

	get animationsLoaded() {
		return this._animationsLoaded;
	}

	/**
	 * Subscribe to state changes
	 */
	subscribe(eventName, callback) {
		this.addEventListener(eventName, callback);
		return () => this.removeEventListener(eventName, callback);
	}

	/**
	 * Dispatch MIDI note on event with parsed data
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 * @param {number} velocity - MIDI velocity (0-127)
	 */
	dispatchMIDINoteOn(channel, note, velocity) {
		this.dispatchEvent(
			new CustomEvent('midiNoteOn', {
				detail: { channel, note, velocity }
			})
		);
	}

	/**
	 * Dispatch MIDI note off event with parsed data
	 * @param {number} channel - MIDI channel (0-15)
	 * @param {number} note - MIDI note (0-127)
	 */
	dispatchMIDINoteOff(channel, note) {
		this.dispatchEvent(
			new CustomEvent('midiNoteOff', {
				detail: { channel, note }
			})
		);
	}

	/**
	 * Notify that the video jockey component is ready
	 */
	notifyVideoJockeyReady() {
		this.dispatchEvent(new CustomEvent('videoJockeyReady'));
	}
}

const appState = new AppState();

export default appState;
