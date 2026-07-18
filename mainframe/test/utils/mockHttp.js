import { vi } from 'vitest';

/**
 * Minimal mock of `http.ServerResponse` for handler unit tests.
 * @returns {{ statusCode?: number, headers: Record<string, string>, body?: string, writeHead: Function, end: Function, setHeader: Function }}
 */
export function createMockResponse() {
	return {
		statusCode: undefined,
		headers: {},
		body: undefined,
		writeHead: vi.fn(function writeHead(status, headers) {
			this.statusCode = status;
			Object.assign(this.headers, headers || {});
		}),
		end: vi.fn(function end(body) {
			this.body = body;
		}),
		setHeader: vi.fn(function setHeader(name, value) {
			this.headers[name] = value;
		})
	};
}
