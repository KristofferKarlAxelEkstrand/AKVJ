const EVENT_CLIPS_CHANGED = 'clipsChanged';
const EVENT_MAPPINGS_CHANGED = 'mappingsChanged';
const EVENT_CHANNEL_CHANGED = 'channelChanged';
const EVENT_SEARCH_CHANGED = 'searchChanged';
const EVENT_ROLE_FILTER_CHANGED = 'roleFilterChanged';
const EVENT_SORT_MODE_CHANGED = 'sortModeChanged';
const EVENT_CATEGORY_CHANGED = 'categoryChanged';
const EVENT_PROJECTS_CHANGED = 'projectsChanged';
const EVENT_ACTIVE_PROJECT_CHANGED = 'activeProjectChanged';
const EVENT_USER_MESSAGE = 'userMessage';

const USER_MESSAGE_TYPES = new Set(['error', 'warning', 'info']);

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
	/** @type {Array<{id: string, name: string}>} */
	#projects = [];
	#activeProjectId = 'default';
	#channel = 1;
	#searchQuery = '';
	#roleFilter = '';
	#sortMode = 'name';
	#category = '';

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
	 * @param {string} category - Selected category (empty string = folder view)
	 */
	set category(category) {
		if (this.#category !== category) {
			this.#category = category;
			this.#dispatchStateEvent(EVENT_CATEGORY_CHANGED, { category });
		}
	}

	/**
	 * @returns {string}
	 */
	get category() {
		return this.#category;
	}

	/**
	 * @param {Array<{id: string, name: string}>} projects
	 */
	set projects(projects) {
		this.#projects = Array.isArray(projects) ? projects : [];
		this.#dispatchStateEvent(EVENT_PROJECTS_CHANGED, { projects: this.#projects });
	}

	/**
	 * @returns {Array<{id: string, name: string}>}
	 */
	get projects() {
		return this.#projects;
	}

	/**
	 * @param {string} projectId
	 */
	set activeProjectId(projectId) {
		const nextId = projectId || 'default';
		if (this.#activeProjectId !== nextId) {
			this.#activeProjectId = nextId;
			this.#dispatchStateEvent(EVENT_ACTIVE_PROJECT_CHANGED, { activeProjectId: nextId });
		}
	}

	/**
	 * @returns {string}
	 */
	get activeProjectId() {
		return this.#activeProjectId;
	}

	/**
	 * Raise a user-facing modal message (consumed by `<user-messages>`).
	 * @param {{ type?: 'error'|'warning'|'info', text: string }} options
	 */
	showUserMessage({ type = 'info', text } = {}) {
		const normalizedType = USER_MESSAGE_TYPES.has(type) ? type : 'info';
		const messageText = String(text ?? '').trim();
		if (!messageText) {
			return;
		}
		this.#dispatchStateEvent(EVENT_USER_MESSAGE, { type: normalizedType, text: messageText });
	}

	/**
	 * @param {string} text
	 */
	error(text) {
		this.showUserMessage({ type: 'error', text });
	}

	/**
	 * @param {string} text
	 */
	warn(text) {
		this.showUserMessage({ type: 'warning', text });
	}

	/**
	 * @param {string} text
	 */
	info(text) {
		this.showUserMessage({ type: 'info', text });
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
		this.#projects = [];
		this.#activeProjectId = 'default';
		this.#channel = 1;
		this.#searchQuery = '';
		this.#roleFilter = '';
		this.#sortMode = 'name';
		this.#category = '';
	}
}

const mainframeState = new MainframeState();

/**
 * Programmatic entry point for user messages (routes through MainframeState events).
 */
const messages = {
	/**
	 * @param {{ type?: 'error'|'warning'|'info', text: string }} options
	 */
	show(options) {
		mainframeState.showUserMessage(options);
	},
	/**
	 * @param {string} text
	 */
	error(text) {
		mainframeState.error(text);
	},
	/**
	 * @param {string} text
	 */
	warn(text) {
		mainframeState.warn(text);
	},
	/**
	 * @param {string} text
	 */
	info(text) {
		mainframeState.info(text);
	}
};

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
	messages,
	EVENT_CLIPS_CHANGED,
	EVENT_MAPPINGS_CHANGED,
	EVENT_CHANNEL_CHANGED,
	EVENT_SEARCH_CHANGED,
	EVENT_ROLE_FILTER_CHANGED,
	EVENT_SORT_MODE_CHANGED,
	EVENT_CATEGORY_CHANGED,
	EVENT_PROJECTS_CHANGED,
	EVENT_ACTIVE_PROJECT_CHANGED,
	EVENT_USER_MESSAGE
};
