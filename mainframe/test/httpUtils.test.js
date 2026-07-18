// @vitest-environment node

import { EventEmitter } from 'events';
import { describe, test, expect, vi } from 'vitest';
import { readBody, sendJson, applyCors, MAX_BODY_BYTES } from '../server/httpUtils.js';
import { createMockResponse } from './utils/mockHttp.js';

function createMockRequest(chunks = []) {
	const req = new EventEmitter();
	req.destroy = vi.fn();
	queueMicrotask(() => {
		for (const chunk of chunks) {
			req.emit('data', Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		req.emit('end');
	});
	return req;
}

describe('readBody', () => {
	test('resolves with Buffer when body is under the limit', async () => {
		const req = createMockRequest(['hello', ' ', 'world']);
		const body = await readBody(req, 1024);
		expect(body.toString('utf8')).toBe('hello world');
	});

	test('rejects and destroys the request when body exceeds maxBytes', async () => {
		const req = createMockRequest([Buffer.alloc(100, 1)]);
		await expect(readBody(req, 50)).rejects.toThrow(/exceeds 50 bytes/);
		expect(req.destroy).toHaveBeenCalled();
	});

	test('resolves with an empty Buffer for an empty body', async () => {
		const req = createMockRequest([]);
		const body = await readBody(req);
		expect(Buffer.isBuffer(body)).toBe(true);
		expect(body.length).toBe(0);
	});

	test('defaults maxBytes to MAX_BODY_BYTES', () => {
		expect(MAX_BODY_BYTES).toBe(32 * 1024 * 1024);
	});
});

describe('sendJson', () => {
	test('sets Content-Type, Content-Length, status, and JSON body', () => {
		const res = createMockResponse();
		sendJson(res, 201, { ok: true, id: 'a' });
		expect(res.writeHead).toHaveBeenCalledWith(
			201,
			expect.objectContaining({
				'Content-Type': 'application/json; charset=utf-8',
				'Content-Length': expect.any(Number)
			})
		);
		expect(JSON.parse(res.body)).toEqual({ ok: true, id: 'a' });
		expect(res.end).toHaveBeenCalledOnce();
	});
});

describe('applyCors', () => {
	test('sets ACAO and Vary for allowed origins', () => {
		const res = createMockResponse();
		applyCors({ headers: { origin: 'http://127.0.0.1:9999' } }, res);
		expect(res.headers['Access-Control-Allow-Origin']).toBe('http://127.0.0.1:9999');
		expect(res.headers.Vary).toBe('Origin');
		expect(res.headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
		expect(res.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
	});

	test('omits ACAO for disallowed origins but still sets ACAM/ACAH', () => {
		const res = createMockResponse();
		applyCors({ headers: { origin: 'http://evil.example' } }, res);
		expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
		expect(res.headers.Vary).toBeUndefined();
		expect(res.headers['Access-Control-Allow-Methods']).toBe('GET, PUT, POST, DELETE, OPTIONS');
		expect(res.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
	});

	test('sets ACAM and ACAH when origin is missing', () => {
		const res = createMockResponse();
		applyCors({ headers: {} }, res);
		expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
		expect(res.headers['Access-Control-Allow-Methods']).toBeTruthy();
		expect(res.headers['Access-Control-Allow-Headers']).toBeTruthy();
	});
});
