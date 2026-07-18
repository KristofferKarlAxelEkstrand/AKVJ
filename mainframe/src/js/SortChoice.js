import '../scss/SortChoice.scss';
import { ChoiceItem } from './ChoiceItem.js';

/**
 * SortChoice — individual clickable sort option with selected state.
 *
 * @fires SortChoice#sortchangerequest - CustomEvent with `{ detail: { value } }` (bubbles)
 */
class SortChoice extends ChoiceItem {
	static changeRequestEvent = 'sortchangerequest';

	/**
	 * @param {string} value - Sort key value
	 */
	set sortValue(value) {
		this.choiceValue = value;
	}

	get sortValue() {
		return this.choiceValue;
	}
}

customElements.define('sort-choice', SortChoice);

export { SortChoice };
