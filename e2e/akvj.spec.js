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
	const realErrors = consoleErrors.filter(err => !err.includes('Web MIDI') && !err.includes('navigator.requestMIDIAccess'));
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

test('akvj render loop is running (canvas pixels are being drawn)', async ({ page }) => {
	await page.goto('http://127.0.0.1:8888/');

	// Wait for the custom element to mount and the render loop to start
	const canvas = page.locator('adventure-kid-video-jockey canvas').first();
	await expect(canvas).toBeVisible();

	// Give the render loop time to paint frames
	await page.waitForTimeout(1000);

	// Check that the canvas has been painted by the render loop.
	// A fresh canvas has all pixels at RGBA(0,0,0,0) — fully transparent.
	// The render loop clears the canvas to the background color (#000000, opaque)
	// on every frame, so alpha should be 255 after the loop starts.
	const isPainted = await page.evaluate(() => {
		const canvas = document.querySelector('adventure-kid-video-jockey canvas');
		if (!canvas) {
			return false;
		}
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return false;
		}
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		// Check alpha channel of the first pixel — should be 255 if painted
		return imageData.data[3] === 255;
	});
	expect(isPainted, 'Canvas was not painted — render loop may not be running').toBe(true);
});

test('akvj page has no unexpected console errors on load', async ({ page }) => {
	await page.goto('http://127.0.0.1:8888/');
	await page.waitForTimeout(1000);
	const realErrors = consoleErrors.filter(err => !err.includes('Web MIDI') && !err.includes('navigator.requestMIDIAccess'));
	expect(realErrors).toEqual([]);
});
