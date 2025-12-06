/**
 * Event-based state management for AKVJ
 * Provides centralized state with event notifications for loose coupling
 * Handles all inter-module communication without direct references
 */
class AppState extends EventTarget {
	#midiConnected = false;
	#animationsLoaded = false;

	set midiConnected(connected) {
		if (this.#midiConnected !== connected) {
			this.#midiConnected = connected;
			this.dispatchEvent(
				new CustomEvent('midiConnectionChanged', {
					detail: { connected }
				})
			);
		}
	}

	get midiConnected() {
		return this.#midiConnected;
	}

	set animationsLoaded(loaded) {
		if (this.#animationsLoaded !== loaded) {
			this.#animationsLoaded = loaded;
			this.dispatchEvent(
				new CustomEvent('animationsLoadedChanged', {
					detail: { loaded }
				})
			);
		}
	}

	get animationsLoaded() {
		return this.#animationsLoaded;
	}

	/**
	 * Subscribe to state changes
	 * @param {string} eventName - The name of the event to subscribe to
	 * @param {Function} callback - The callback function to invoke when the event is dispatched
	 * @returns {Function} Unsubscribe function to remove the event listener
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

	/**
	 * Reset state to initial values.
	 *
	 * This method is intended for use in tests or controlled cleanup scenarios,
	 * where you need to ensure the AppState is in its initial state without
	 * triggering event listeners or causing cascading state updates.
	 *
	 * It does NOT dispatch any change events, by design, to avoid unwanted
	 * side effects during teardown or test isolation.
	 *
	 * Note: Event listeners remain attached after reset. Use the unsubscribe
	 * function returned by subscribe() to remove listeners when needed.
	 *
	 * @example
	 * // In a test setup/teardown:
	 * import appState from './AppState';
	 * beforeEach(() => {
	 *   appState.reset();
	 * });
	 */
	reset() {
		this.#midiConnected = false;
		this.#animationsLoaded = false;
	}
}

const appState = new AppState();

export default appState;
