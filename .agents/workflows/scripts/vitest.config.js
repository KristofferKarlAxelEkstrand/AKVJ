import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root,
	test: {
		environment: 'node',
		include: ['test/**/*.test.js'],
		// The poller tests spawn real processes and must wait out a poll interval
		// to prove a *non*-wake, so several seconds per test is expected.
		testTimeout: 30000
	}
});
