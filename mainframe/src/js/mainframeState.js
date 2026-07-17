const EVENT_CLIPS_CHANGED = 'clipsChanged';
const EVENT_MAPPINGS_CHANGED = 'mappingsChanged';
const EVENT_CHANNEL_CHANGED = 'channelChanged';
const EVENT_SEARCH_CHANGED = 'searchChanged';
const EVENT_ROLE_FILTER_CHANGED = 'roleFilterChanged';
const EVENT_SORT_MODE_CHANGED = 'sortModeChanged';

/**
 * MainframeState — centralized UI state for the Mainframe application.
 *
 * Follows AKVJ's AppState pattern: extends EventTarget for event-based
 * communication, provides subscribe() returning an unsubscribe function,
 * and uses private fields for encapsulation.
 *
 * @extends EventTarget
 */
class MainframeState extends EventTarget {
	/** @type {Array<{clipId: string, meta: object, hasSprite: boolean}>} */
	#clips = [];
	/** @type {Array<{channel: number, note: number, velocity: number, clipId: string}>} */
	#mappings = [];
	#channel = 1;
	#searchQuery = '';
	#roleFilter = '';
	#sortMode = 'name';

	#dispatchStateEvent(eventName, detail) {
		this.dispatchEvent(new CustomEvent(eventName, { detail }));
	}

	/**
	 * @param {Array<{clipId: string, meta: object, hasSprite: boolean}>} clips
	 */
	set clips(clips) {
		this.#clips = clips;
		this.#dispatchStateEvent(EVENT_CLIPS_CHANGED, { clips });
	}

	/**
	 * @returns {Array<{clipId: string, meta: object, hasSprite: boolean}>}
	 */
	get clips() {
		return this.#clips;
	}

	/**
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} mappings
	 */
	set mappings(mappings) {
		this.#mappings = mappings;
		this.#dispatchStateEvent(EVENT_MAPPINGS_CHANGED, { mappings });
	}

	/**
	 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string}>}
	 */
	get mappings() {
		return this.#mappings;
	}

	/**
	 * @param {number} channel - DAW channel number (1–16)
	 */
	set channel(channel) {
		if (this.#channel !== channel) {
			this.#channel = channel;
			this.#dispatchStateEvent(EVENT_CHANNEL_CHANGED, { channel });
		}
	}

	/**
	 * @returns {number}
	 */
	get channel() {
		return this.#channel;
	}

	/**
	 * @param {string} query - Lowercased search query
	 */
	set searchQuery(query) {
		if (this.#searchQuery !== query) {
			this.#searchQuery = query;
			this.#dispatchStateEvent(EVENT_SEARCH_CHANGED, { searchQuery: query });
		}
	}

	/**
	 * @returns {string}
	 */
	get searchQuery() {
		return this.#searchQuery;
	}

	/**
	 * @param {string} roleFilter - Role filter value
	 */
	set roleFilter(roleFilter) {
		if (this.#roleFilter !== roleFilter) {
			this.#roleFilter = roleFilter;
			this.#dispatchStateEvent(EVENT_ROLE_FILTER_CHANGED, { roleFilter });
		}
	}

	/**
	 * @returns {string}
	 */
	get roleFilter() {
		return this.#roleFilter;
	}

	/**
	 * @param {string} sortMode - Sort mode identifier
	 */
	set sortMode(sortMode) {
		if (this.#sortMode !== sortMode) {
			this.#sortMode = sortMode;
			this.#dispatchStateEvent(EVENT_SORT_MODE_CHANGED, { sortMode });
		}
	}

	/**
	 * @returns {string}
	 */
	get sortMode() {
		return this.#sortMode;
	}

	/**
	 * Subscribe to state changes.
	 * @param {string} eventName - The name of the event to subscribe to
	 * @param {Function} callback - The callback function to invoke when the event is dispatched
	 * @returns {Function} Unsubscribe function to remove the event listener
	 */
	subscribe(eventName, callback) {
		this.addEventListener(eventName, callback);
		return () => this.removeEventListener(eventName, callback);
	}

	/**
	 * Reset state to initial values. Does NOT dispatch events.
	 * Intended for test isolation and teardown.
	 */
	reset() {
		this.#clips = [];
		this.#mappings = [];
		this.#channel = 1;
		this.#searchQuery = '';
		this.#roleFilter = '';
		this.#sortMode = 'name';
	}
}

const mainframeState = new MainframeState();

/**
 * Create a fresh MainframeState instance for testing isolation.
 * @returns {MainframeState}
 */
export function createMainframeState() {
	return new MainframeState();
}

export {
	MainframeState,
	mainframeState as default,
	EVENT_CLIPS_CHANGED,
	EVENT_MAPPINGS_CHANGED,
	EVENT_CHANNEL_CHANGED,
	EVENT_SEARCH_CHANGED,
	EVENT_ROLE_FILTER_CHANGED,
	EVENT_SORT_MODE_CHANGED
};
