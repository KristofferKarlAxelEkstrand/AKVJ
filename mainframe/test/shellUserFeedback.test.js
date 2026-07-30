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

	test('reportFailedClipOpen falls back for null, string, empty object, and empty message', () => {
		const spy = vi.spyOn(messages, 'error');
		const fallback = 'Failed to open clip';
		for (const error of [null, undefined, 'boom', {}, { message: '' }]) {
			spy.mockClear();
			reportFailedClipOpen(error);
			expect(spy).toHaveBeenCalledWith(fallback);
		}
	});

	test('reportFailedClipDelete routes through messages.error', () => {
		const spy = vi.spyOn(messages, 'error');
		reportFailedClipDelete('neon-skull', new Error('403'));
		expect(spy).toHaveBeenCalledWith('Failed to delete clip "neon-skull": 403');
	});

	test('reportFailedClipDelete includes string detail and Unknown error for nullish', () => {
		const spy = vi.spyOn(messages, 'error');
		reportFailedClipDelete('neon-skull', 'disk full');
		expect(spy).toHaveBeenCalledWith('Failed to delete clip "neon-skull": disk full');
		spy.mockClear();
		reportFailedClipDelete('neon-skull', null);
		expect(spy).toHaveBeenCalledWith('Failed to delete clip "neon-skull": Unknown error');
		spy.mockClear();
		reportFailedClipDelete('neon-skull', undefined);
		expect(spy).toHaveBeenCalledWith('Failed to delete clip "neon-skull": Unknown error');
	});

	test('reportBootApiError routes through messages.error', () => {
		const spy = vi.spyOn(messages, 'error');
		reportBootApiError(new Error('ECONNREFUSED'));
		expect(spy).toHaveBeenCalledWith('API error: ECONNREFUSED');
	});

	test('reportBootApiError stringifies non-Error values via String(error ?? Unknown error)', () => {
		const spy = vi.spyOn(messages, 'error');
		reportBootApiError('timeout');
		expect(spy).toHaveBeenCalledWith('API error: timeout');
		spy.mockClear();
		reportBootApiError(null);
		expect(spy).toHaveBeenCalledWith('API error: Unknown error');
		spy.mockClear();
		reportBootApiError(undefined);
		expect(spy).toHaveBeenCalledWith('API error: Unknown error');
	});
});
