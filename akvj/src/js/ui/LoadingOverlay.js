/**
 * AkvjLoadingOverlay - Simple centered loading bar overlay.
 *
 * Subscribes to AppState PROJECT_LOAD_* events (show on start, hide on complete/error).
 * Styles are scoped under the `akvj-loading-overlay` host tag in
 * `akvj/src/css/loading-overlay.css` (light DOM, no Shadow DOM).
 *
 * @element akvj-loading-overlay
 */
import appState, { EVENT_PROJECT_LOAD_START, EVENT_PROJECT_LOAD_COMPLETE, EVENT_PROJECT_LOAD_ERROR } from '../core/AppState.js';

class AkvjLoadingOverlay extends HTMLElement {
	#progressBar = null;
	#progressFill = null;
	#isVisible = false;
	#unsubscribers = [];

	constructor() {
		super();
		this.#progressBar = document.createElement('div');
		this.#progressBar.className = 'progress-bar';

		this.#progressFill = document.createElement('div');
		this.#progressFill.className = 'progress-fill';
		this.#progressBar.appendChild(this.#progressFill);
	}

	connectedCallback() {
		this.#render();
		this.#unsubscribers.push(appState.subscribe(EVENT_PROJECT_LOAD_START, () => this.#show()));
		this.#unsubscribers.push(appState.subscribe(EVENT_PROJECT_LOAD_COMPLETE, () => this.#hide()));
		this.#unsubscribers.push(appState.subscribe(EVENT_PROJECT_LOAD_ERROR, () => this.#hide()));
	}

	disconnectedCallback() {
		for (const unsubscribe of this.#unsubscribers) {
			unsubscribe();
		}
		this.#unsubscribers = [];
		this.replaceChildren();
	}

	#render() {
		this.replaceChildren();
		this.appendChild(this.#progressBar);
	}

	#show() {
		this.#isVisible = true;
		this.setAttribute('visible', '');
		if (this.#progressFill) {
			this.#progressFill.style.width = '0%';
		}
	}

	#hide() {
		this.#isVisible = false;
		this.removeAttribute('visible');
	}

	/**
	 * Whether the overlay is currently visible.
	 * @returns {boolean}
	 */
	get isVisible() {
		return this.#isVisible;
	}
}

if (!customElements.get('akvj-loading-overlay')) {
	customElements.define('akvj-loading-overlay', AkvjLoadingOverlay);
}

export default AkvjLoadingOverlay;
