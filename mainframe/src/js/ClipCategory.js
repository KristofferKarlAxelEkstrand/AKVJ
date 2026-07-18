import '../scss/ClipCategory.scss';

/**
 * ClipCategory — container element that groups clips by category.
 * Renders a category header and holds <clip-instance> children.
 */
class ClipCategory extends HTMLElement {
	#categoryName = '';

	/**
	 * @param {string} name - Category display name
	 */
	set categoryName(name) {
		this.#categoryName = name;
		this.#renderHeader();
	}

	get categoryName() {
		return this.#categoryName;
	}

	connectedCallback() {
		this.#renderHeader();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	#renderHeader() {
		const existing = this.querySelector('.clip-category-header');
		if (existing) {
			existing.textContent = this.#categoryName;
			return;
		}
		const header = document.createElement('h3');
		header.className = 'clip-category-header';
		header.textContent = this.#categoryName;
		this.append(header);
	}
}

customElements.define('clip-category', ClipCategory);

export { ClipCategory };
