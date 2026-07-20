import { vi } from 'vitest';

/**
 * Minimal mock of `http.ServerResponse` for handler unit tests.
 * @returns {{ statusCode?: number, headers: Record<string, string>, body?: string, writeHead: Function, end: Function, setHeader: Function }}
 */
export function createMockResponse() {
	return {
		statusCode: undefined,
		headersSent: false,
		headers: {},
		body: undefined,
		writeHead: vi.fn(function writeHead(status, headers) {
			this.statusCode = status;
			this.headersSent = true;
			Object.assign(this.headers, headers || {});
		}),
		end: vi.fn(function end(body) {
			this.body = body;
			queueMicrotask(() => this.emit?.('finish'));
			for (const listener of this._finishListeners || []) {
				queueMicrotask(listener);
			}
		}),
		on: vi.fn(function on(event, listener) {
			if (event === 'finish') {
				(this._finishListeners ??= []).push(listener);
			}
			return this;
		}),
		setHeader: vi.fn(function setHeader(name, value) {
			this.headers[name] = value;
		})
	};
}
