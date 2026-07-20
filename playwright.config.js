import { defineConfig, devices } from '@playwright/test';

const WEB_SERVER_TIMEOUT_MS = 30000;

/**
 * Playwright E2E test configuration for AKVJ + Mainframe.
 *
 * Tests expect both dev servers to be running:
 *   npm run akvj   (localhost:8888)
 *   npm run mainframe  (localhost:9999 + :7777 API)
 *
 * Or use webServer config to auto-start them.
 */
export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: 'http://127.0.0.1:9999',
		trace: 'on-first-retry',
		console: true
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: [
		{
			command: 'npm run akvj',
			port: 8888,
			timeout: WEB_SERVER_TIMEOUT_MS,
			reuseExistingServer: !process.env.CI
		},
		{
			command: 'npm run mainframe',
			port: 9999,
			timeout: WEB_SERVER_TIMEOUT_MS,
			reuseExistingServer: !process.env.CI
		}
	]
});
