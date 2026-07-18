import { test, expect } from '@playwright/test';

/**
 * E2E tests for the AKVJ VJ engine.
 * Verifies custom element mounts, canvas renders, and no console errors.
 */

test.use({ baseURL: 'http://127.0.0.1:8888' });

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
	const realErrors = consoleErrors.filter(err => !err.includes('Web MIDI') && !err.includes('navigator.requestMIDIAccess'));
	expect(realErrors, `Console errors: ${realErrors.join('; ')}`).toEqual([]);
});

test('akvj custom element mounts and canvas exists', async ({ page }) => {
	await page.goto('/');
	const vjElement = page.locator('adventure-kid-video-jockey');
	await expect(vjElement).toBeAttached();
	const canvas = vjElement.locator('canvas').first();
	await expect(canvas).toBeVisible();
});

test('akvj canvas has correct dimensions (240x135)', async ({ page }) => {
	await page.goto('/');
	const canvas = page.locator('adventure-kid-video-jockey canvas').first();
	await expect(canvas).toHaveAttribute('width', '240');
	await expect(canvas).toHaveAttribute('height', '135');
});

test('akvj render loop is running (canvas pixels are being drawn)', async ({ page }) => {
	await page.goto('/');

	const canvas = page.locator('adventure-kid-video-jockey canvas').first();
	await expect(canvas).toBeVisible();

	// Poll until the render loop paints opaque pixels (alpha 255).
	// A fresh canvas is fully transparent (alpha 0); the loop clears to #000000.
	await expect
		.poll(async () => {
			return page.evaluate(() => {
				const canvasElement = document.querySelector('adventure-kid-video-jockey canvas');
				if (!canvasElement) {
					return false;
				}
				const ctx = canvasElement.getContext('2d');
				if (!ctx) {
					return false;
				}
				const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
				return imageData.data[3] === 255;
			});
		})
		.toBe(true);
});

test('akvj page has no unexpected console errors on load', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('adventure-kid-video-jockey canvas').first()).toBeVisible();
	const realErrors = consoleErrors.filter(err => !err.includes('Web MIDI') && !err.includes('navigator.requestMIDIAccess'));
	expect(realErrors).toEqual([]);
});
