import '../scss/SortChoices.scss';
import { ChoiceList } from './ChoiceList.js';
import { SortChoice } from './SortChoice.js';
import { DEFAULT_SORT_MODE } from './sortMode.js';

export { DEFAULT_SORT_MODE };

/**
 * SortChoices — horizontal container of SortChoice elements.
 *
 * @fires SortChoices#sortchange - CustomEvent with `{ detail: { sortMode } }`
 */
class SortChoices extends ChoiceList {
	static ItemClass = SortChoice;
	static changeRequestEvent = 'sortchangerequest';
	static changeEvent = 'sortchange';
	static detailKey = 'sortMode';
	static ariaLabel = 'Sort clips';
	static defaultValue = DEFAULT_SORT_MODE;

	/**
	 * @param {string} mode - Sort key
	 */
	set sortMode(mode) {
		this.value = mode;
	}

	get sortMode() {
		return this.value;
	}
}

customElements.define('sort-choices', SortChoices);

export { SortChoices };
