// @vitest-environment node

import { EventEmitter } from 'events';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('child_process', () => ({
	spawn: vi.fn()
}));

import { spawn } from 'child_process';
import { handlePostPipeline } from '../server/handlers/misc.js';
import { createMockResponse } from './utils/mockHttp.js';

function mockChild({ code = 0, stdout = 'pipeline ok', stderr = '' } = {}) {
	const child = new EventEmitter();
	child.stdout = new EventEmitter();
	child.stderr = new EventEmitter();
	spawn.mockReturnValue(child);
	queueMicrotask(() => {
		if (stdout) {
			child.stdout.emit('data', Buffer.from(stdout));
		}
		if (stderr) {
			child.stderr.emit('data', Buffer.from(stderr));
		}
		child.emit('close', code);
	});
	return child;
}

describe('handlePostPipeline', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns 200 with ok/output/code when the pipeline exits 0', async () => {
		mockChild({ code: 0, stdout: 'Done in 0.1s' });
		const res = createMockResponse();
		await handlePostPipeline({}, res);
		expect(spawn).toHaveBeenCalled();
		expect(res.statusCode).toBe(200);
		expect(JSON.parse(res.body)).toEqual({
			ok: true,
			output: 'Done in 0.1s',
			code: 0
		});
	});

	test('returns 500 with ok:false when the pipeline exits non-zero', async () => {
		mockChild({ code: 1, stdout: '', stderr: 'Validation failed' });
		const res = createMockResponse();
		await handlePostPipeline({}, res);
		expect(res.statusCode).toBe(500);
		expect(JSON.parse(res.body)).toEqual({
			ok: false,
			output: 'Validation failed',
			code: 1
		});
	});
});
