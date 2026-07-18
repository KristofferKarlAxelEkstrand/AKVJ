// @vitest-environment node

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, API } from '../src/js/apiClient.js';

describe('apiClient', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	test('successful response returns parsed JSON', async () => {
		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ clipId: 'neon' })
		});
		await expect(api('/clips')).resolves.toEqual({ clipId: 'neon' });
		expect(fetch).toHaveBeenCalledWith(
			`${API}/clips`,
			expect.objectContaining({
				headers: expect.objectContaining({ 'Content-Type': 'application/json' })
			})
		);
	});

	test('non-ok with { error } throws Error(error)', async () => {
		fetch.mockResolvedValue({
			ok: false,
			status: 400,
			json: async () => ({ error: 'Clip ID is required' })
		});
		await expect(api('/clips', { method: 'POST' })).rejects.toThrow('Clip ID is required');
	});

	test('non-ok unparseable body throws HTTP status', async () => {
		fetch.mockResolvedValue({
			ok: false,
			status: 502,
			json: async () => {
				throw new Error('not json');
			}
		});
		await expect(api('/clips')).rejects.toThrow('HTTP 502');
	});

	test('request includes Content-Type application/json by default', async () => {
		fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
		await api('/health');
		const [, options] = fetch.mock.calls[0];
		expect(options.headers['Content-Type']).toBe('application/json');
	});

	test('custom headers are merged with defaults', async () => {
		fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
		await api('/clips', { headers: { 'X-Test': '1' } });
		const [, options] = fetch.mock.calls[0];
		expect(options.headers).toEqual({
			'Content-Type': 'application/json',
			'X-Test': '1'
		});
	});
});
