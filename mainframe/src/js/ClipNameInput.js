import '../scss/ClipNameInput.scss';

/**
 * Clean a human-readable clip display name: trim leading spaces, collapse
 * consecutive whitespace to a single space. Trailing spaces are trimmed when
 * `trimTrailing` is true (typically on blur / submit).
 * Accents and casing are preserved.
 *
 * @param {unknown} raw
 * @param {{ trimTrailing?: boolean }} [options]
 * @returns {string}
 */
export function cleanDisplayName(raw, { trimTrailing = false } = {}) {
	let value = String(raw ?? '').replace(/^\s+/, '').replace(/[^\S\n]+/g, ' ');
	if (trimTrailing) {
		value = value.replace(/\s+$/, '');
	}
	return value;
}

/**
 * ClipNameInput — self-cleaning name field (light DOM).
 * Owns trim + collapse-spaces; exposes `.value` for the cleaned name.
 *
 * @fires ClipNameInput#namechange - CustomEvent `{ detail: { value } }` after cleaning
 * @element clip-name-input
 */
class ClipNameInput extends HTMLElement {
	#input = null;
	#abort = null;

	static get observedAttributes() {
		return ['placeholder', 'disabled'];
	}

	connectedCallback() {
		this.#abort = new AbortController();
		this.#render();
	}

	disconnectedCallback() {
		this.#abort?.abort();
		this.#abort = null;
		this.replaceChildren();
		this.#input = null;
	}

	attributeChangedCallback(name, _old, value) {
		if (!this.#input) {
			return;
		}
		if (name === 'placeholder') {
			this.#input.placeholder = value ?? '';
		}
		if (name === 'disabled') {
			this.#input.disabled = value !== null;
		}
	}

	/**
	 * @returns {string}
	 */
	get value() {
		return this.#input ? cleanDisplayName(this.#input.value, { trimTrailing: true }) : '';
	}

	/**
	 * @param {string} next
	 */
	set value(next) {
		if (!this.#input) {
			this.#render();
		}
		this.#input.value = cleanDisplayName(next, { trimTrailing: true });
	}

	#render() {
		const previous = this.#input?.value ?? '';
		this.replaceChildren();

		this.#input = document.createElement('input');
		this.#input.type = 'text';
		this.#input.name = this.getAttribute('name') || 'name';
		this.#input.placeholder = this.getAttribute('placeholder') || '';
		this.#input.disabled = this.hasAttribute('disabled');
		this.#input.autocomplete = 'off';
		this.#input.value = previous;
		this.#input.setAttribute('aria-label', this.getAttribute('aria-label') || 'Clip name');

		const { signal } = this.#abort;
		this.#input.addEventListener('input', () => this.#onInput(), { signal });
		this.#input.addEventListener('blur', () => this.#onBlur(), { signal });

		this.append(this.#input);
	}

	#onInput() {
		const before = this.#input.value;
		const cleaned = cleanDisplayName(before, { trimTrailing: false });
		if (cleaned !== before) {
			const cursor = this.#input.selectionStart;
			const delta = before.length - cleaned.length;
			this.#input.value = cleaned;
			if (typeof cursor === 'number') {
				const nextPos = Math.max(0, cursor - delta);
				this.#input.setSelectionRange(nextPos, nextPos);
			}
		}
		this.dispatchEvent(
			new CustomEvent('namechange', {
				bubbles: true,
				detail: { value: cleanDisplayName(this.#input.value, { trimTrailing: false }) }
			})
		);
	}

	#onBlur() {
		const cleaned = cleanDisplayName(this.#input.value, { trimTrailing: true });
		if (cleaned !== this.#input.value) {
			this.#input.value = cleaned;
			this.dispatchEvent(
				new CustomEvent('namechange', {
					bubbles: true,
					detail: { value: cleaned }
				})
			);
		}
	}
}

if (!customElements.get('clip-name-input')) {
	customElements.define('clip-name-input', ClipNameInput);
}

export { ClipNameInput };
