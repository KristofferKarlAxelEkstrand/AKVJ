import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		exclude: ['test/visual/**', 'test/smoke/**', '**/node_modules/**', '**/dist/**'],
		pool: 'vmThreads',
		testTimeout: 30000,
		fileParallelism: false
	}
});
