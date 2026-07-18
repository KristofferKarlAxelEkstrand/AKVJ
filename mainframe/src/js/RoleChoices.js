import '../scss/RoleChoices.scss';
import { ChoiceList } from './ChoiceList.js';
import { RoleChoice } from './RoleChoice.js';

/**
 * RoleChoices — horizontal container of RoleChoice elements.
 *
 * @fires RoleChoices#rolechange - CustomEvent with `{ detail: { roleFilter } }`
 */
class RoleChoices extends ChoiceList {
	static ItemClass = RoleChoice;
	static changeRequestEvent = 'rolechangerequest';
	static changeEvent = 'rolechange';
	static detailKey = 'roleFilter';
	static ariaLabel = 'Filter by role';
	static defaultValue = '';

	/**
	 * @param {string} filter - Role filter value
	 */
	set roleFilter(filter) {
		this.value = filter;
	}

	get roleFilter() {
		return this.value;
	}
}

customElements.define('role-choices', RoleChoices);

export { RoleChoices };
