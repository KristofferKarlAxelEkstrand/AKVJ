import { vi } from 'vitest';

/**
 * Create a mock clip with spied methods for LayerGroup / integration tests.
 * @param {string} [id='mock']
 * @returns {{ id: string, play: Function, renderToContext: Function, stop: Function, reset: Function, dispose: Function, isFinished: boolean }}
 */
export function createMockClip(id = 'mock') {
	return {
		id,
		play: vi.fn(),
		renderToContext: vi.fn(),
		stop: vi.fn(),
		reset: vi.fn(),
		dispose: vi.fn(),
		isFinished: false
	};
}
