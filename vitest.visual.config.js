import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	test: {
		globals: true,
		include: ['test/visual/**/*.test.js'],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{ browser: 'chromium' }],
			headless: true,
			screenshotDirectory: 'test/visual/__screenshots__',
			expect: {
				toMatchScreenshot: {
					resolveScreenshotPath: ({ root, arg, browserName, platform, ext }) => `${root}/test/visual/__screenshots__/${arg}-${browserName}-${platform}${ext}`,
					resolveDiffPath: ({ root, arg, browserName, platform, ext }) => `${root}/test/visual/__diffs__/${arg}-${browserName}-${platform}${ext}`,
					comparatorOptions: {
						threshold: 0.1,
						allowedMismatchedPixels: 10
					}
				}
			}
		}
	}
});
