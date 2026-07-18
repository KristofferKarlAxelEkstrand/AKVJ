/**
 * ChoiceList — shared listbox base with roving tabindex + arrow-key navigation.
 *
 * Subclasses configure ItemClass, events, detailKey, ariaLabel, and defaultValue.
 *
 * @fires ChoiceList#choicechange - detail key from `static detailKey`
 */
class ChoiceList extends HTMLElement {
	static ItemClass = null;
	static changeRequestEvent = 'choicechangerequest';
	static changeEvent = 'choicechange';
	static detailKey = 'value';
	static ariaLabel = 'Choices';
	static defaultValue = '';

	#value;
	#abort = null;

	constructor() {
		super();
		this.#value = this.constructor.defaultValue;
	}

	/**
	 * @param {string} value
	 */
	set value(value) {
		this.#value = value;
		this.#updateSelection();
	}

	get value() {
		return this.#value;
	}

	/**
	 * @param {Array<{value: string, label: string}>} choices
	 */
	set choices(choices) {
		const ItemClass = this.constructor.ItemClass;
		this.replaceChildren();
		for (const choice of choices) {
			const item = new ItemClass();
			item.choiceValue = choice.value;
			item.textContent = choice.label;
			if (choice.value === this.#value) {
				item.selected = true;
			}
			this.append(item);
		}
		this.#syncTabIndex();
	}

	connectedCallback() {
		this.#abort?.abort();
		this.#abort = new AbortController();
		const { signal } = this.#abort;

		this.setAttribute('role', 'listbox');
		this.setAttribute('aria-label', this.constructor.ariaLabel);
		this.setAttribute('aria-orientation', 'horizontal');

		this.addEventListener(
			this.constructor.changeRequestEvent,
			event => {
				this.#value = event.detail.value;
				this.#updateSelection();
				this.dispatchEvent(
					new CustomEvent(this.constructor.changeEvent, {
						bubbles: true,
						detail: { [this.constructor.detailKey]: this.#value }
					})
				);
			},
			{ signal }
		);

		this.addEventListener('keydown', event => this.#onKeyDown(event), { signal });
		this.#updateSelection();
	}

	disconnectedCallback() {
		this.#abort?.abort();
		this.#abort = null;
		this.replaceChildren();
	}

	#items() {
		const ItemClass = this.constructor.ItemClass;
		return [...this.children].filter(child => child instanceof ItemClass);
	}

	#updateSelection() {
		for (const item of this.#items()) {
			item.selected = item.choiceValue === this.#value;
		}
		this.#syncTabIndex();
	}

	#syncTabIndex() {
		const items = this.#items();
		if (items.length === 0) {
			return;
		}
		let focusIndex = items.findIndex(item => item.selected);
		if (focusIndex < 0) {
			focusIndex = items.findIndex(item => item.tabIndex === 0);
		}
		if (focusIndex < 0) {
			focusIndex = 0;
		}
		items.forEach((item, index) => {
			item.tabIndex = index === focusIndex ? 0 : -1;
		});
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	#onKeyDown(event) {
		const ItemClass = this.constructor.ItemClass;
		if (!(event.target instanceof ItemClass)) {
			return;
		}

		const items = this.#items();
		const index = items.indexOf(event.target);
		if (index < 0 || items.length === 0) {
			return;
		}

		let nextIndex = index;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			event.preventDefault();
			nextIndex = (index + 1) % items.length;
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			nextIndex = (index - 1 + items.length) % items.length;
		} else if (event.key === 'Home') {
			event.preventDefault();
			nextIndex = 0;
		} else if (event.key === 'End') {
			event.preventDefault();
			nextIndex = items.length - 1;
		} else {
			return;
		}

		items.forEach((item, itemIndex) => {
			item.tabIndex = itemIndex === nextIndex ? 0 : -1;
		});
		items[nextIndex].focus();
	}
}

export { ChoiceList };
