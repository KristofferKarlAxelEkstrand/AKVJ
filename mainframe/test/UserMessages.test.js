// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import mainframeState, { messages, EVENT_USER_MESSAGE, createMainframeState } from '../src/js/mainframeState.js';
import '../src/js/UserMessage.js';
import '../src/js/UserMessages.js';

describe('messages API / MainframeState user messages', () => {
	test('showUserMessage dispatches EVENT_USER_MESSAGE', () => {
		const state = createMainframeState();
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

	test('messages helper routes through the singleton', () => {
		let detail = null;
		const unsub = mainframeState.subscribe(EVENT_USER_MESSAGE, event => {
			detail = event.detail;
		});
		messages.show({ type: 'error', text: 'failed' });
		expect(detail).toEqual({ type: 'error', text: 'failed' });
		messages.info('ok');
		expect(detail).toEqual({ type: 'info', text: 'ok' });
		unsub();
	});

	test('ignores empty text', () => {
		const state = createMainframeState();
		let called = false;
		state.subscribe(EVENT_USER_MESSAGE, () => {
			called = true;
		});
		state.info('   ');
		expect(called).toBe(false);
	});
});

describe('user-messages / user-message', () => {
	/** @type {HTMLElement} */
	let host;

	beforeEach(() => {
		host = document.createElement('user-messages');
		document.body.append(host);
	});

	afterEach(() => {
		host.remove();
	});

	test('renders a message from messages.error and OK dismisses it', async () => {
		messages.error('Save failed');
		await Promise.resolve();

		expect(host.hidden).toBe(false);
		expect(host.messageCount).toBe(1);
		const message = host.querySelector('user-message');
		expect(message).not.toBeNull();
		expect(message.getAttribute('role')).toBe('alertdialog');
		expect(message.textContent).toContain('Save failed');

		message.querySelector('.user-message-ok').click();
		expect(host.messageCount).toBe(0);
		expect(host.hidden).toBe(true);
	});

	test('Esc dismisses the top message', async () => {
		messages.info('first');
		messages.warn('second');
		await Promise.resolve();
		expect(host.messageCount).toBe(2);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(host.messageCount).toBe(1);
		expect(host.querySelector('user-message').textContent).toContain('first');
	});

	test('stacks newest on top and dismisses independently', async () => {
		messages.info('older');
		messages.error('newer');
		await vi.waitFor(() => expect(host.messageCount).toBe(2));

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
		messages.info('notice');
		await Promise.resolve();
		expect(host.querySelector('user-message').getAttribute('role')).toBe('dialog');

		host.querySelector('.user-message-ok').click();
		messages.warn('heads up');
		await Promise.resolve();
		expect(host.querySelector('user-message').getAttribute('role')).toBe('alertdialog');
	});
});
