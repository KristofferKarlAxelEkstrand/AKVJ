// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/SortChoice.js';
import '../src/js/SortChoices.js';

describe('SortChoices', () => {
	/** @type {import('../src/js/SortChoices.js').SortChoices} */
	let element;

	beforeEach(() => {
		element = document.createElement('sort-choices');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('choices setter renders sort-choice children', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		const choices = element.querySelectorAll('sort-choice');
		expect(choices.length).toBe(2);
		expect(choices[0].textContent).toBe('Name');
		expect(choices[1].textContent).toBe('Frames');
	});

	test('default sortMode is name', () => {
		expect(element.sortMode).toBe('name');
	});

	test('first choice is selected by default when sortMode matches', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		const selected = element.querySelector('sort-choice.is-selected');
		expect(selected).not.toBeNull();
		expect(selected.sortValue).toBe('name');
	});

	test('sortMode setter updates selection', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];
		element.sortMode = 'frames';

		const selected = element.querySelector('sort-choice.is-selected');
		expect(selected.sortValue).toBe('frames');
	});

	test('clicking a choice dispatches sortchange event', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		let eventDetail = null;
		element.addEventListener('sortchange', event => {
			eventDetail = event.detail;
		});

		const choices = element.querySelectorAll('sort-choice');
		choices[1].click();

		expect(eventDetail.sortMode).toBe('frames');
	});

	test('clicking a choice updates sortMode', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		element.querySelectorAll('sort-choice')[1].click();
		expect(element.sortMode).toBe('frames');
	});

	test('clicking a choice updates visual selection', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		element.querySelectorAll('sort-choice')[1].click();

		const selected = element.querySelectorAll('sort-choice.is-selected');
		expect(selected.length).toBe(1);
		expect(selected[0].sortValue).toBe('frames');
	});

	test('keyboard Enter triggers click', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		const choice = element.querySelectorAll('sort-choice')[1];
		choice.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

		expect(element.sortMode).toBe('frames');
	});

	test('keyboard Space triggers click', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		const choice = element.querySelectorAll('sort-choice')[1];
		choice.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

		expect(element.sortMode).toBe('frames');
	});

	test('uses roving tabindex — only selected option is tabbable', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];

		const choices = element.querySelectorAll('sort-choice');
		expect(choices[0].tabIndex).toBe(0);
		expect(choices[1].tabIndex).toBe(-1);

		element.sortMode = 'frames';
		expect(choices[0].tabIndex).toBe(-1);
		expect(choices[1].tabIndex).toBe(0);
	});

	test('arrow keys move focus between options', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' },
			{ value: 'role', label: 'Role' }
		];

		const choices = [...element.querySelectorAll('sort-choice')];
		choices[0].focus();
		choices[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

		expect(document.activeElement).toBe(choices[1]);
		expect(choices[1].tabIndex).toBe(0);
		expect(choices[0].tabIndex).toBe(-1);
	});

	test('choices setter replaces previous choices', () => {
		element.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'frames', label: 'Frames' }
		];
		element.choices = [
			{ value: 'clipId', label: 'ID' },
			{ value: 'role', label: 'Role' }
		];

		const choices = element.querySelectorAll('sort-choice');
		expect(choices.length).toBe(2);
		expect(choices[0].textContent).toBe('ID');
	});

	test('cleans up on disconnect', () => {
		element.choices = [
			{ value: 'name', label: 'Name' }
		];
		element.remove();
		expect(element.children.length).toBe(0);
	});
});
