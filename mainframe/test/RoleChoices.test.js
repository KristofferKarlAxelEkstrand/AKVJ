// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/RoleChoice.js';
import '../src/js/RoleChoices.js';

describe('RoleChoices', () => {
	/** @type {import('../src/js/RoleChoices.js').RoleChoices} */
	let element;

	beforeEach(() => {
		element = document.createElement('role-choices');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('choices setter renders role-choice children', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];

		const choices = element.querySelectorAll('role-choice');
		expect(choices.length).toBe(3);
		expect(choices[0].textContent).toBe('All');
		expect(choices[1].textContent).toBe('Clip');
		expect(choices[2].textContent).toBe('Bitmask');
	});

	test('default roleFilter is empty string', () => {
		expect(element.roleFilter).toBe('');
	});

	test('All choice is selected by default when roleFilter is empty', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];

		const selected = element.querySelector('role-choice.is-selected');
		expect(selected).not.toBeNull();
		expect(selected.roleValue).toBe('');
	});

	test('roleFilter setter updates selection', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];
		element.roleFilter = 'bitmask';

		const selected = element.querySelector('role-choice.is-selected');
		expect(selected.roleValue).toBe('bitmask');
	});

	test('clicking a choice dispatches rolechange event', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];

		let eventDetail = null;
		element.addEventListener('rolechange', event => {
			eventDetail = event.detail;
		});

		const choices = element.querySelectorAll('role-choice');
		choices[2].click();

		expect(eventDetail.roleFilter).toBe('bitmask');
	});

	test('clicking a choice updates roleFilter', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];

		element.querySelectorAll('role-choice')[1].click();
		expect(element.roleFilter).toBe('clip');
	});

	test('clicking a choice updates visual selection', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];

		element.querySelectorAll('role-choice')[1].click();

		const selected = element.querySelectorAll('role-choice.is-selected');
		expect(selected.length).toBe(1);
		expect(selected[0].roleValue).toBe('clip');
	});

	test('keyboard Enter triggers click', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];

		const choice = element.querySelectorAll('role-choice')[2];
		choice.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

		expect(element.roleFilter).toBe('bitmask');
	});

	test('keyboard Space triggers click', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];

		const choice = element.querySelectorAll('role-choice')[1];
		choice.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

		expect(element.roleFilter).toBe('clip');
	});

	test('choices setter replaces previous choices', () => {
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'bitmask', label: 'Bitmask' }
		];
		element.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' }
		];

		const choices = element.querySelectorAll('role-choice');
		expect(choices.length).toBe(2);
		expect(choices[1].textContent).toBe('Clip');
	});

	test('cleans up on disconnect', () => {
		element.choices = [{ value: '', label: 'All' }];
		element.remove();
		expect(element.children.length).toBe(0);
	});
});
