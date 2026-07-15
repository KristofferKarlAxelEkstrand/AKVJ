import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		exclude: ['test/visual/**', '**/node_modules/**', '**/dist/**']
	}
});
