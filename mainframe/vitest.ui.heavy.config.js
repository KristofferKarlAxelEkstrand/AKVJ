import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: __dirname,
	test: {
		globals: true,
		environment: 'jsdom',
		css: true,
		include: ['test/AkvjMainframe.test.js', 'test/PianoRoll.test.js', 'test/StagingPreview.test.js', 'test/PreviewClip.test.js'],
		pool: 'forks',
		forks: {
			singleFork: true
		},
		isolate: false,
		testTimeout: 60000,
		fileParallelism: false
	}
});
