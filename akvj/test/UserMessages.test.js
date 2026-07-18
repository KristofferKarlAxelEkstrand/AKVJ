// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import appState, { createAppState, EVENT_USER_MESSAGE } from '../src/js/core/AppState.js';
import '../src/js/ui/UserMessage.js';
import '../src/js/ui/UserMessages.js';

describe('AppState user message API', () => {
	test('showUserMessage dispatches EVENT_USER_MESSAGE', () => {
		const state = createAppState();
		let detail = null;
		state.subscribe(EVENT_USER_MESSAGE, event => {
			detail = event.detail;
		});
		state.error('boom');
		expect(detail).toEqual({ type: 'error', text: 'boom' });
		state.warn('careful');
		expect(detail).toEqual({ type: 'warning', text: 'careful' });
		state.info('hi');
		expect(detail).toEqual({ type: 'info', text: 'hi' });
	});

	test('ignores empty text', () => {
		const state = createAppState();
		let called = false;
		state.subscribe(EVENT_USER_MESSAGE, () => {
			called = true;
		});
		state.info('   ');
		expect(called).toBe(false);
	});

	test('normalizes invalid type to info', () => {
		const state = createAppState();
		let detail = null;
		state.subscribe(EVENT_USER_MESSAGE, event => {
			detail = event.detail;
		});
		state.showUserMessage({ type: 'bogus', text: 'hello' });
		expect(detail).toEqual({ type: 'info', text: 'hello' });
	});
});

describe('user-messages / user-message', () => {
	/** @type {HTMLElement} */
	let host;

	beforeEach(() => {
		appState.reset();
		// Remove any stale <user-messages> elements left by prior test files
		for (const stale of document.querySelectorAll('user-messages')) {
			stale.remove();
		}
		host = document.createElement('user-messages');
		document.body.append(host);
	});

	afterEach(() => {
		host.remove();
		appState.reset();
	});

	test('renders a message from appState.error and OK dismisses it', async () => {
		appState.error('MIDI access failed');
		await Promise.resolve();

		expect(host.hidden).toBe(false);
		expect(host.messageCount).toBe(1);
		const message = host.querySelector('user-message');
		expect(message).not.toBeNull();
		expect(message.getAttribute('role')).toBe('alertdialog');
		expect(message.textContent).toContain('MIDI access failed');

		message.querySelector('.user-message-ok').click();
		expect(host.messageCount).toBe(0);
		expect(host.hidden).toBe(true);
	});

	test('Esc dismisses the top message', async () => {
		appState.info('first');
		appState.warn('second');
		await Promise.resolve();
		expect(host.messageCount).toBe(2);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(host.messageCount).toBe(1);
		expect(host.querySelector('user-message').textContent).toContain('first');
	});

	test('stacks newest on top and dismisses independently', async () => {
		appState.info('older');
		appState.error('newer');
		await Promise.resolve();

		expect(host.messageCount).toBe(2);
		const nodes = [...host.querySelectorAll('user-message')];
		expect(nodes[0].textContent).toContain('newer');
		expect(nodes[1].textContent).toContain('older');
		expect(nodes[0].getAttribute('role')).toBe('alertdialog');
		expect(nodes[1].getAttribute('role')).toBe('dialog');

		nodes[1].querySelector('.user-message-ok').click();
		expect(host.messageCount).toBe(1);
		expect(host.querySelector('user-message').textContent).toContain('newer');
	});

	test('info uses dialog role; warning uses alertdialog', async () => {
		appState.info('notice');
		await Promise.resolve();
		expect(host.querySelector('user-message').getAttribute('role')).toBe('dialog');

		host.querySelector('.user-message-ok').click();
		appState.warn('heads up');
		await Promise.resolve();
		expect(host.querySelector('user-message').getAttribute('role')).toBe('alertdialog');
	});
});
