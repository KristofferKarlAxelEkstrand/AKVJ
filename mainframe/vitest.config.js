import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UI_TEST_FILES = ['test/AkvjMainframe.test.js', 'test/PianoRoll.test.js', 'test/StagingPreview.test.js', 'test/ClipList.test.js', 'test/ProjectChooser.test.js', 'test/SortChoices.test.js', 'test/MappingTable.test.js', 'test/RoleChoices.test.js', 'test/SimpleRouter.test.js', 'test/ClipNameInput.test.js', 'test/PreviewClip.test.js', 'test/ClipFramesUploadPanel.test.js'];

export default defineConfig({
	root: __dirname,
	test: {
		globals: true,
		environment: 'node',
		exclude: ['**/node_modules/**', '**/dist/**', '**/server/**', '**/smoke/**', 'test/visual/**', ...UI_TEST_FILES],
		pool: 'forks',
		forks: {
			singleFork: true
		},
		testTimeout: 60000,
		hookTimeout: 60000,
		fileParallelism: false
	}
});
