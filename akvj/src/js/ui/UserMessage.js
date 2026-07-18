import { USER_MESSAGE_TYPES } from '../core/AppState.js';

/**
 * UserMessage — one dismissible modal message (light DOM).
 *
 * @fires UserMessage#dismiss - CustomEvent when OK is pressed or dismiss() is called
 * @element akvj-user-message
 */
class UserMessage extends HTMLElement {
	#type = 'info';
	#text = '';
	#okButton = null;
	#abortController = null;

	/**
	 * @param {{ type?: string, text?: string }} options
	 */
	setMessage({ type = 'info', text = '' } = {}) {
		this.#type = USER_MESSAGE_TYPES.has(type) ? type : 'info';
		this.#text = String(text ?? '');
		this.dataset.type = this.#type;
		if (this.isConnected) {
			this.#render();
		}
	}

	get type() {
		return this.#type;
	}

	get text() {
		return this.#text;
	}

	connectedCallback() {
		this.#abortController = new AbortController();
		this.#render();
	}

	disconnectedCallback() {
		this.#abortController?.abort();
		this.#abortController = null;
		this.replaceChildren();
	}

	/**
	 * Focus the OK button (called by the host for the top message).
	 */
	focusOk() {
		this.#okButton?.focus();
	}

	dismiss() {
		this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true }));
	}

	#render() {
		this.replaceChildren();
		const isAlert = this.#type === 'error' || this.#type === 'warning';
		this.setAttribute('role', isAlert ? 'alertdialog' : 'dialog');
		this.setAttribute('aria-modal', 'true');
		this.dataset.type = this.#type;

		const titleId = `user-message-title-${Math.random().toString(36).slice(2, 9)}`;
		const title = document.createElement('h2');
		title.id = titleId;
		title.className = 'user-message-title';
		title.textContent = this.#type === 'error' ? 'Error' : this.#type === 'warning' ? 'Warning' : 'Notice';
		this.setAttribute('aria-labelledby', titleId);

		const body = document.createElement('p');
		body.className = 'user-message-body';
		body.textContent = this.#text;
		if (!isAlert) {
			body.setAttribute('aria-live', 'polite');
		}

		this.#okButton = document.createElement('button');
		this.#okButton.type = 'button';
		this.#okButton.className = 'user-message-ok';
		this.#okButton.textContent = 'OK';
		this.#okButton.addEventListener('click', () => this.dismiss(), { signal: this.#abortController.signal });

		this.append(title, body, this.#okButton);
	}
}

if (!customElements.get('akvj-user-message')) {
	customElements.define('akvj-user-message', UserMessage);
}

export { UserMessage };
export default UserMessage;
