/**
 * Event-based state management for AKVJ
 * Provides centralized state with event notifications for loose coupling
 */
class AppState extends EventTarget {
	constructor() {
		super();
		this._adventureKidVideoJockey = null;
		this._midiConnected = false;
		this._animationsLoaded = false;
	}

	set adventureKidVideoJockey(element) {
		const oldValue = this._adventureKidVideoJockey;
		this._adventureKidVideoJockey = element;

		if (oldValue !== element) {
			this.dispatchEvent(
				new CustomEvent('adventureKidVideoJockeyChanged', {
					detail: { oldValue, newValue: element }
				})
			);
		}
	}

	get adventureKidVideoJockey() {
		return this._adventureKidVideoJockey;
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
	 * Emit a custom event for any component to listen to
	 */
	emit(eventName, detail = null) {
		this.dispatchEvent(new CustomEvent(eventName, { detail }));
	}

	/**
	 * Subscribe to state changes
	 */
	subscribe(eventName, callback) {
		this.addEventListener(eventName, callback);
		return () => this.removeEventListener(eventName, callback);
	}
}

const appState = new AppState();

export default appState;
