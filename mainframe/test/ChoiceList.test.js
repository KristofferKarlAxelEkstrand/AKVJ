// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChoiceList } from '../src/js/ChoiceList.js';
import { ChoiceItem } from '../src/js/ChoiceItem.js';

class TestChoiceItem extends ChoiceItem {
	static changeRequestEvent = 'testchoicechangerequest';
}

class TestChoiceList extends ChoiceList {
	static ItemClass = TestChoiceItem;
	static changeRequestEvent = 'testchoicechangerequest';
	static changeEvent = 'testchoicechange';
	static detailKey = 'value';
	static ariaLabel = 'Test choices';
	static defaultValue = 'a';
}

if (!customElements.get('test-choice-item')) {
	customElements.define('test-choice-item', TestChoiceItem);
}
if (!customElements.get('test-choice-list')) {
	customElements.define('test-choice-list', TestChoiceList);
}

/**
 * @param {HTMLElement} target
 * @param {string} key
 * @returns {KeyboardEvent}
 */
function press(target, key) {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	target.dispatchEvent(event);
	return event;
}

describe('ChoiceList keyboard navigation', () => {
	/** @type {TestChoiceList} */
	let list;

	beforeEach(() => {
		list = document.createElement('test-choice-list');
		document.body.append(list);
		list.choices = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' },
			{ value: 'c', label: 'C' }
		];
	});

	afterEach(() => {
		list.remove();
	});

	test('ArrowRight / ArrowDown move focus forward and wrap', () => {
		const items = [...list.querySelectorAll('test-choice-item')];
		const focusSpies = items.map(item => vi.spyOn(item, 'focus'));

		expect(press(items[0], 'ArrowRight').defaultPrevented).toBe(true);
		expect(items.map(item => item.tabIndex)).toEqual([-1, 0, -1]);
		expect(focusSpies[1]).toHaveBeenCalled();

		press(items[1], 'ArrowDown');
		expect(items.map(item => item.tabIndex)).toEqual([-1, -1, 0]);

		press(items[2], 'ArrowRight');
		expect(items.map(item => item.tabIndex)).toEqual([0, -1, -1]);
	});

	test('ArrowLeft / ArrowUp move focus backward and wrap', () => {
		const items = [...list.querySelectorAll('test-choice-item')];
		expect(press(items[0], 'ArrowLeft').defaultPrevented).toBe(true);
		expect(items.map(item => item.tabIndex)).toEqual([-1, -1, 0]);

		press(items[2], 'ArrowUp');
		expect(items.map(item => item.tabIndex)).toEqual([-1, 0, -1]);
	});

	test('Home and End jump to first and last item', () => {
		const items = [...list.querySelectorAll('test-choice-item')];
		expect(press(items[1], 'End').defaultPrevented).toBe(true);
		expect(items.map(item => item.tabIndex)).toEqual([-1, -1, 0]);

		expect(press(items[2], 'Home').defaultPrevented).toBe(true);
		expect(items.map(item => item.tabIndex)).toEqual([0, -1, -1]);
	});

	test('non-navigation keys do not preventDefault or move focus', () => {
		const items = [...list.querySelectorAll('test-choice-item')];
		const before = items.map(item => item.tabIndex);
		expect(press(items[0], 'a').defaultPrevented).toBe(false);
		expect(press(items[0], 'Tab').defaultPrevented).toBe(false);
		expect(items.map(item => item.tabIndex)).toEqual(before);
	});

	test('keydown from a non-ItemClass child is ignored', () => {
		const items = [...list.querySelectorAll('test-choice-item')];
		const spacer = document.createElement('span');
		spacer.tabIndex = 0;
		list.append(spacer);
		const before = items.map(item => item.tabIndex);

		const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
		spacer.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(items.map(item => item.tabIndex)).toEqual(before);
	});

	test('choicechangerequest updates value and fires change event', () => {
		let detail = null;
		list.addEventListener('testchoicechange', event => {
			detail = event.detail;
		});
		const items = [...list.querySelectorAll('test-choice-item')];
		items[2].click();
		expect(list.value).toBe('c');
		expect(detail).toEqual({ value: 'c' });
		expect(items[2].selected).toBe(true);
	});
});

describe('ChoiceItem', () => {
	/** @type {TestChoiceItem} */
	let item;

	beforeEach(() => {
		item = document.createElement('test-choice-item');
		item.choiceValue = 'x';
		item.textContent = 'X';
		document.body.append(item);
	});

	afterEach(() => {
		item.remove();
	});

	test('Enter and Space click the item', () => {
		const clickSpy = vi.spyOn(item, 'click');
		item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
		expect(clickSpy).toHaveBeenCalledTimes(2);
	});

	test('selected toggles aria and class', () => {
		item.selected = true;
		expect(item.getAttribute('aria-selected')).toBe('true');
		expect(item.classList.contains('is-selected')).toBe(true);
		item.selected = false;
		expect(item.getAttribute('aria-selected')).toBe('false');
		expect(item.classList.contains('is-selected')).toBe(false);
	});

	test('disconnectedCallback aborts listeners — reconnect does not double-fire click', () => {
		let fires = 0;
		item.addEventListener('testchoicechangerequest', () => {
			fires += 1;
		});
		item.click();
		expect(fires).toBe(1);

		item.remove();
		document.body.append(item);
		item.click();
		expect(fires).toBe(2);
	});
});
