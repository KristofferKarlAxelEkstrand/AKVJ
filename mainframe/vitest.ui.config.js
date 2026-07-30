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
		include: ['test/ClipList.test.js', 'test/ProjectChooser.test.js', 'test/SortChoices.test.js', 'test/MappingTable.test.js', 'test/RoleChoices.test.js', 'test/SimpleRouter.test.js', 'test/ClipNameInput.test.js', 'test/ClipFramesPanel.test.js', 'test/ChoiceList.test.js'],
		pool: 'forks',
		forks: {
			singleFork: true
		},
		isolate: false,
		testTimeout: 60000,
		fileParallelism: false
	}
});
