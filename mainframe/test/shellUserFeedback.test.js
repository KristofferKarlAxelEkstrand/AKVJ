import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import mainframeState, { messages, EVENT_USER_MESSAGE } from '../src/js/mainframeState.js';
import { reportBootApiError, reportFailedClipDelete, reportFailedClipOpen } from '../src/js/shellUserFeedback.js';

describe('shellUserFeedback', () => {
	/** @type {string[]} */
	let texts;

	beforeEach(() => {
		texts = [];
		mainframeState.subscribe(EVENT_USER_MESSAGE, event => {
			texts.push(event.detail.text);
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('reportFailedClipOpen routes through messages.error (not alert/setStatus)', () => {
		const spy = vi.spyOn(messages, 'error');
		reportFailedClipOpen(new Error('clip gone'));
		expect(spy).toHaveBeenCalledWith('clip gone');
		expect(texts.at(-1)).toBe('clip gone');
	});

	test('reportFailedClipDelete routes through messages.error', () => {
		const spy = vi.spyOn(messages, 'error');
		reportFailedClipDelete('neon-skull', new Error('403'));
		expect(spy).toHaveBeenCalledWith('Failed to delete clip "neon-skull": 403');
	});

	test('reportBootApiError routes through messages.error', () => {
		const spy = vi.spyOn(messages, 'error');
		reportBootApiError(new Error('ECONNREFUSED'));
		expect(spy).toHaveBeenCalledWith('API error: ECONNREFUSED');
	});
});
