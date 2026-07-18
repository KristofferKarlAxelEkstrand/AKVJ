import '../scss/RoleChoice.scss';
import { ChoiceItem } from './ChoiceItem.js';

/**
 * RoleChoice — individual clickable role option with selected state.
 *
 * @fires RoleChoice#rolechangerequest - CustomEvent with `{ detail: { value } }` (bubbles)
 */
class RoleChoice extends ChoiceItem {
	static changeRequestEvent = 'rolechangerequest';

	/**
	 * @param {string} value - Role filter value
	 */
	set roleValue(value) {
		this.choiceValue = value;
	}

	get roleValue() {
		return this.choiceValue;
	}
}

customElements.define('role-choice', RoleChoice);

export { RoleChoice };
