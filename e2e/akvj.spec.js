import { test, expect } from '@playwright/test';

/**
 * E2E tests for the AKVJ VJ engine.
 * Verifies custom element mounts, canvas renders, and no console errors.
 */

const consoleErrors = [];

test.beforeEach(({ page }) => {
	consoleErrors.length = 0;
	page.on('console', msg => {
		if (msg.type() === 'error') {
			consoleErrors.push(msg.text());
		}
	});
});

test.afterEach(() => {
	// Filter out Web MIDI API errors (expected in environments without MIDI hardware)
	const realErrors = consoleErrors.filter(
		err => !err.includes('Web MIDI') && !err.includes('navigator.requestMIDIAccess')
	);
	expect(realErrors, `Console errors: ${realErrors.join('; ')}`).toEqual([]);
});

test('akvj custom element mounts and canvas exists', async ({ page }) => {
	await page.goto('http://127.0.0.1:8888/');
	const vjElement = page.locator('adventure-kid-video-jockey');
	await expect(vjElement).toBeAttached();
	const canvas = vjElement.locator('canvas').first();
	await expect(canvas).toBeVisible();
});

test('akvj canvas has correct dimensions (240x135)', async ({ page }) => {
	await page.goto('http://127.0.0.1:8888/');
	const canvas = page.locator('adventure-kid-video-jockey canvas').first();
	await expect(canvas).toHaveAttribute('width', '240');
	await expect(canvas).toHaveAttribute('height', '135');
});

test('akvj page has no unexpected console errors on load', async ({ page }) => {
	await page.goto('http://127.0.0.1:8888/');
	await page.waitForTimeout(1000);
	const realErrors = consoleErrors.filter(
		err => !err.includes('Web MIDI') && !err.includes('navigator.requestMIDIAccess')
	);
	expect(realErrors).toEqual([]);
});
