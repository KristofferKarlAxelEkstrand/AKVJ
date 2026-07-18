/**
 * ChoiceItem — shared option base for listbox-style choice chips.
 *
 * Subclasses set `static changeRequestEvent` and may alias `choiceValue`.
 *
 * @fires ChoiceItem#choicechangerequest - `{ detail: { value } }` (bubbles); event name overridden by subclass
 */
class ChoiceItem extends HTMLElement {
	static changeRequestEvent = 'choicechangerequest';

	#value = '';
	#selected = false;
	#abort = null;

	/**
	 * @param {string} value
	 */
	set choiceValue(value) {
		this.#value = value;
	}

	get choiceValue() {
		return this.#value;
	}

	/**
	 * @param {boolean} selected
	 */
	set selected(selected) {
		this.#selected = selected;
		this.classList.toggle('is-selected', selected);
		this.setAttribute('aria-selected', selected ? 'true' : 'false');
	}

	get selected() {
		return this.#selected;
	}

	connectedCallback() {
		this.#abort?.abort();
		this.#abort = new AbortController();
		const { signal } = this.#abort;

		this.setAttribute('role', 'option');
		if (!this.hasAttribute('tabindex')) {
			this.tabIndex = -1;
		}

		this.addEventListener(
			'click',
			() => {
				this.dispatchEvent(
					new CustomEvent(this.constructor.changeRequestEvent, {
						bubbles: true,
						detail: { value: this.#value }
					})
				);
			},
			{ signal }
		);

		this.addEventListener(
			'keydown',
			event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					this.click();
				}
			},
			{ signal }
		);
	}

	disconnectedCallback() {
		this.#abort?.abort();
		this.#abort = null;
	}
}

export { ChoiceItem };
