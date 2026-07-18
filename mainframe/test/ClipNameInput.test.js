// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { cleanDisplayName } from '../src/js/ClipNameInput.js';

describe('cleanDisplayName', () => {
	test('collapses consecutive spaces and trims leading', () => {
		expect(cleanDisplayName('Jag      är bäst')).toBe('Jag är bäst');
		expect(cleanDisplayName('  hello')).toBe('hello');
	});

	test('preserves accents and case', () => {
		expect(cleanDisplayName('Älskling')).toBe('Älskling');
	});

	test('trims trailing only when requested', () => {
		expect(cleanDisplayName('hello ', { trimTrailing: false })).toBe('hello ');
		expect(cleanDisplayName('hello ', { trimTrailing: true })).toBe('hello');
	});
});

describe('clip-name-input', () => {
	/** @type {HTMLElement} */
	let element;

	beforeEach(() => {
		element = document.createElement('clip-name-input');
		element.setAttribute('placeholder', 'Name');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('cleans live on input', () => {
		const input = element.querySelector('input');
		input.value = 'Jag      är bäst';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(input.value).toBe('Jag är bäst');
		expect(element.value).toBe('Jag är bäst');
	});

	test('trims trailing spaces on blur', () => {
		const input = element.querySelector('input');
		input.value = 'Hello ';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(input.value).toBe('Hello ');
		input.dispatchEvent(new Event('blur', { bubbles: true }));
		expect(element.value).toBe('Hello');
	});

	test('fires namechange with cleaned value', () => {
		let detail = null;
		element.addEventListener('namechange', event => {
			detail = event.detail;
		});
		const input = element.querySelector('input');
		input.value = '  A   B  ';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(detail.value).toBe('A B ');
	});
});
