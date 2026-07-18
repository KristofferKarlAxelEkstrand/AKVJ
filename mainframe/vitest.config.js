import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		exclude: ['**/node_modules/**', '**/dist/**', '**/server/**', '**/smoke/**', 'test/visual/**'],
		pool: 'threads',
		testTimeout: 30000,
		fileParallelism: true
	}
});
