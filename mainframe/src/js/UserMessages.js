import '../scss/UserMessages.scss';
import { UserMessage } from './UserMessage.js';
import mainframeState, { EVENT_USER_MESSAGE } from './mainframeState.js';

/**
 * UserMessages — stacked centered modal host for user-message items.
 *
 * Newest messages appear on top. Show-all stacking (not a one-at-a-time queue).
 * Esc dismisses the top message. Subscribes to mainframeState EVENT_USER_MESSAGE.
 *
 * @element user-messages
 */
class UserMessages extends HTMLElement {
	/** @type {Array<{ id: string, type: string, text: string }>} */
	#messages = [];
	#messageStackElement = null;
	#unsubscribe = null;
	#boundKeydown = this.#handleKeydown.bind(this);
	#boundFocusIn = this.#handleFocusIn.bind(this);
	#nextMessageId = 0;

	connectedCallback() {
		this.#renderShell();
		this.hidden = true;
		this.#unsubscribe = mainframeState.subscribe(EVENT_USER_MESSAGE, event => {
			this.#pushMessage(event.detail);
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
		this.#messageStackElement = null;
		this.#messages = [];
	}

	/**
	 * @returns {number}
	 */
	get messageCount() {
		return this.#messages.length;
	}

	/**
	 * @param {{ type?: string, text?: string }} detail
	 */
	#pushMessage(detail) {
		const text = String(detail?.text ?? '').trim();
		if (!text) {
			return;
		}
		this.#nextMessageId += 1;
		this.#messages.unshift({
			id: `msg-${this.#nextMessageId}`,
			type: detail?.type || 'info',
			text
		});
		this.#renderStack();
	}

	#dismiss(id) {
		this.#messages = this.#messages.filter(item => item.id !== id);
		this.#renderStack();
	}

	#renderShell() {
		this.replaceChildren();
		const backdrop = document.createElement('div');
		backdrop.className = 'user-messages-backdrop';
		backdrop.addEventListener('click', event => {
			if (event.target === backdrop && this.#messages.length > 0) {
				this.#dismiss(this.#messages[0].id);
			}
		});
		this.#messageStackElement = document.createElement('div');
		this.#messageStackElement.className = 'user-messages-stack';
		backdrop.append(this.#messageStackElement);
		this.append(backdrop);
	}

	#renderStack() {
		if (!this.#messageStackElement) {
			this.#renderShell();
		}
		this.#messageStackElement.replaceChildren();
		this.hidden = this.#messages.length === 0;
		this.classList.toggle('is-open', this.#messages.length > 0);

		for (const item of this.#messages) {
			const message = new UserMessage();
			message.dataset.messageId = item.id;
			message.setMessage({ type: item.type, text: item.text });
			message.addEventListener('dismiss', () => this.#dismiss(item.id));
			this.#messageStackElement.append(message);
		}

		if (this.#messages.length > 0) {
			queueMicrotask(() => {
				const top = this.#messageStackElement?.querySelector('user-message');
				top?.focusOk?.();
			});
		}
	}

	#handleKeydown(event) {
		if (this.#messages.length === 0) {
			return;
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.#dismiss(this.#messages[0].id);
			return;
		}
		if (event.key === 'Tab') {
			this.#trapTab(event);
		}
	}

	#trapTab(event) {
		const top = this.#messageStackElement?.querySelector('user-message');
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
		if (this.#messages.length === 0 || this.hidden) {
			return;
		}
		const top = this.#messageStackElement?.querySelector('user-message');
		if (top && !top.contains(event.target)) {
			top.focusOk?.();
		}
	}
}

if (!customElements.get('user-messages')) {
	customElements.define('user-messages', UserMessages);
}

export { UserMessages };
