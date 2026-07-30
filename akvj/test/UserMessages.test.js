// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import appState, { createAppState, EVENT_USER_MESSAGE, USER_MESSAGE_TYPES } from '../src/js/core/AppState.js';
// Side-effect import registers <akvj-user-messages> for createElement.
import '../src/js/ui/UserMessages.js';

describe('AppState user message API', () => {
	test('showUserMessage dispatches EVENT_USER_MESSAGE', () => {
		const state = createAppState();
		let detail = null;
		state.subscribe(EVENT_USER_MESSAGE, event => {
			detail = event.detail;
		});
		state.showError('boom');
		expect(detail).toEqual({ type: 'error', text: 'boom' });
		state.showWarning('careful');
		expect(detail).toEqual({ type: 'warning', text: 'careful' });
		state.showInfo('hi');
		expect(detail).toEqual({ type: 'info', text: 'hi' });
	});

	test('ignores empty text', () => {
		const state = createAppState();
		let called = false;
		state.subscribe(EVENT_USER_MESSAGE, () => {
			called = true;
		});
		state.showInfo('   ');
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

	test('exports USER_MESSAGE_TYPES for consumers', () => {
		expect(USER_MESSAGE_TYPES.has('error')).toBe(true);
		expect(USER_MESSAGE_TYPES.has('warning')).toBe(true);
		expect(USER_MESSAGE_TYPES.has('info')).toBe(true);
		expect(USER_MESSAGE_TYPES.has('bogus')).toBe(false);
	});
});

describe('akvj-user-messages / akvj-user-message', () => {
	/** @type {HTMLElement & { messageCount?: number }} */
	let host;

	beforeEach(() => {
		appState.reset();
		// Use createElement against the shared customElements registry. Vitest
		// vmThreads can leave a first-defined CE class from another realm; `new
		// UserMessages()` then throws Invalid constructor. AppState is resolved
		// via globalThis.__AKVJ_APP_STATE__, so cross-realm instances still work.
		for (const stale of document.querySelectorAll('akvj-user-messages')) {
			stale.remove();
		}
		host = document.createElement('akvj-user-messages');
		document.body.append(host);
	});

	afterEach(() => {
		host?.remove();
		appState.reset();
	});

	test('renders a message from appState.error and OK dismisses it', async () => {
		appState.showError('MIDI access failed');
		await Promise.resolve();

		expect(host.hidden).toBe(false);
		expect(host.messageCount).toBe(1);
		const message = host.querySelector('akvj-user-message');
		expect(message).not.toBeNull();
		expect(message.getAttribute('role')).toBe('alertdialog');
		expect(message.textContent).toContain('MIDI access failed');

		message.querySelector('.user-message-ok').click();
		expect(host.messageCount).toBe(0);
		expect(host.hidden).toBe(true);
	});

	test('Esc dismisses the top message', async () => {
		appState.showInfo('first');
		appState.showWarning('second');
		await Promise.resolve();
		expect(host.messageCount).toBe(2);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(host.messageCount).toBe(1);
		expect(host.querySelector('akvj-user-message').textContent).toContain('first');
	});

	test('stacks newest on top and dismisses independently', async () => {
		appState.showInfo('older');
		appState.showError('newer');
		await Promise.resolve();

		expect(host.messageCount).toBe(2);
		const nodes = [...host.querySelectorAll('akvj-user-message')];
		expect(nodes[0].textContent).toContain('newer');
		expect(nodes[1].textContent).toContain('older');
		expect(nodes[0].getAttribute('role')).toBe('alertdialog');
		expect(nodes[1].getAttribute('role')).toBe('dialog');

		nodes[1].querySelector('.user-message-ok').click();
		expect(host.messageCount).toBe(1);
		expect(host.querySelector('akvj-user-message').textContent).toContain('newer');
	});

	test('info uses dialog role; warning uses alertdialog', async () => {
		appState.showInfo('notice');
		await Promise.resolve();
		expect(host.querySelector('akvj-user-message').getAttribute('role')).toBe('dialog');

		host.querySelector('.user-message-ok').click();
		appState.showWarning('heads up');
		await Promise.resolve();
		expect(host.querySelector('akvj-user-message').getAttribute('role')).toBe('alertdialog');
	});
});
