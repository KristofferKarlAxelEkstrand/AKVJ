import { UserMessage } from './UserMessage.js';
import appState, { EVENT_USER_MESSAGE } from '../core/AppState.js';

/**
 * UserMessages — stacked centered modal host for user-message items.
 *
 * Newest messages appear on top. Show-all stacking (not a one-at-a-time queue).
 * Esc dismisses the top message. Subscribes to AppState EVENT_USER_MESSAGE.
 *
 * @element user-messages
 */
class UserMessages extends HTMLElement {
	/** @type {Array<{ id: string, type: string, text: string }>} */
	#items = [];
	#stack = null;
	#unsubscribe = null;
	#boundKeydown = this.#handleKeydown.bind(this);
	#boundFocusIn = this.#handleFocusIn.bind(this);
	#idSeq = 0;

	connectedCallback() {
		this.#renderShell();
		this.hidden = true;
		this.#unsubscribe = appState.subscribe(EVENT_USER_MESSAGE, event => {
			this.#enqueue(event.detail);
		});
		document.addEventListener('keydown', this.#boundKeydown, true);
		document.addEventListener('focusin', this.#boundFocusIn, true);
	}

	disconnectedCallback() {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
		document.removeEventListener('keydown', this.#boundKeydown, true);
		document.removeEventListener('focusin', this.#boundFocusIn, true);
		this.replaceChildren();
		this.#stack = null;
		this.#items = [];
	}

	/**
	 * @returns {number}
	 */
	get messageCount() {
		return this.#items.length;
	}

	/**
	 * @param {{ type?: string, text?: string }} detail
	 */
	#enqueue(detail) {
		const text = String(detail?.text ?? '').trim();
		if (!text) {
			return;
		}
		this.#idSeq += 1;
		this.#items.unshift({
			id: `msg-${this.#idSeq}`,
			type: detail?.type || 'info',
			text
		});
		this.#renderStack();
	}

	#dismiss(id) {
		this.#items = this.#items.filter(item => item.id !== id);
		this.#renderStack();
	}

	#renderShell() {
		this.replaceChildren();
		const backdrop = document.createElement('div');
		backdrop.className = 'user-messages-backdrop';
		backdrop.addEventListener('click', event => {
			if (event.target === backdrop && this.#items.length > 0) {
				this.#dismiss(this.#items[0].id);
			}
		});
		this.#stack = document.createElement('div');
		this.#stack.className = 'user-messages-stack';
		backdrop.append(this.#stack);
		this.append(backdrop);
	}

	#renderStack() {
		if (!this.#stack) {
			this.#renderShell();
		}
		this.#stack.replaceChildren();
		this.hidden = this.#items.length === 0;
		this.classList.toggle('is-open', this.#items.length > 0);

		for (const item of this.#items) {
			const message = new UserMessage();
			message.dataset.messageId = item.id;
			message.setMessage({ type: item.type, text: item.text });
			message.addEventListener('dismiss', () => this.#dismiss(item.id));
			this.#stack.append(message);
		}

		if (this.#items.length > 0) {
			queueMicrotask(() => {
				const top = this.#stack?.querySelector('user-message');
				top?.focusOk?.();
			});
		}
	}

	#handleKeydown(event) {
		if (this.#items.length === 0) {
			return;
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.#dismiss(this.#items[0].id);
			return;
		}
		if (event.key === 'Tab') {
			this.#trapTab(event);
		}
	}

	#trapTab(event) {
		const top = this.#stack?.querySelector('user-message');
		if (!top) {
			return;
		}
		const focusable = top.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
		if (focusable.length === 0) {
			event.preventDefault();
			return;
		}
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	#handleFocusIn(event) {
		if (this.#items.length === 0 || this.hidden) {
			return;
		}
		const top = this.#stack?.querySelector('user-message');
		if (top && !top.contains(event.target)) {
			top.focusOk?.();
		}
	}
}

if (!customElements.get('user-messages')) {
	customElements.define('user-messages', UserMessages);
}

export { UserMessages };
export default UserMessages;
