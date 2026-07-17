import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Mainframe UI.
 * Verifies clip catalog loads, tabs work, and no console errors occur.
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
	expect(consoleErrors, `Console errors: ${consoleErrors.join('; ')}`).toEqual([]);
});

test('mainframe loads and shows library tab by default', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('AKVJ Mainframe');
	await expect(page.locator('#panel-library')).toBeVisible();
	await expect(page.locator('#panel-upload')).toBeHidden();
	await expect(page.locator('#panel-mapping')).toBeHidden();
});

test('clip library renders clip items or empty state', async ({ page }) => {
	await page.goto('/');
	await page.locator('#refresh-library').click();
	const clipList = page.locator('akvj-clip-list');
	await expect(clipList).toBeVisible();
	const listItems = clipList.locator('li');
	const itemCount = await listItems.count();
	if (itemCount > 0) {
		await expect(listItems.first()).toContainText(/frames:/);
	} else {
		await expect(clipList).toContainText('No clips');
	}
});

test('tab navigation switches between Library, Upload, and Mapping', async ({ page }) => {
	await page.goto('/');

	await page.locator('[data-tab="upload"]').click();
	await expect(page.locator('#panel-upload')).toBeVisible();
	await expect(page.locator('#panel-library')).toBeHidden();

	await page.locator('[data-tab="mapping"]').click();
	await expect(page.locator('#panel-mapping')).toBeVisible();
	await expect(page.locator('#panel-upload')).toBeHidden();

	await page.locator('[data-tab="library"]').click();
	await expect(page.locator('#panel-library')).toBeVisible();
	await expect(page.locator('#panel-mapping')).toBeHidden();
});

test('upload tab has drag-and-drop zone and config fields', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="upload"]').click();
	await expect(page.locator('#drop-zone')).toBeVisible();
	await expect(page.locator('#upload-clip-id')).toBeVisible();
	await expect(page.locator('#upload-target-width')).toHaveValue('240');
	await expect(page.locator('#upload-target-height')).toHaveValue('135');
	await expect(page.locator('#upload-playback')).toHaveValue('loop');
	await expect(page.locator('#upload-frame-rate')).toHaveValue('12');
});

test('staging preview element is present in upload tab', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="upload"]').click();
	await expect(page.locator('akvj-staging-preview')).toBeVisible();
});

test('clip sort dropdown has all options', async ({ page }) => {
	await page.goto('/');
	const sortSelect = page.locator('#clip-sort');
	await expect(sortSelect).toBeVisible();
	const options = sortSelect.locator('option');
	await expect(options).toHaveCount(4);
	await expect(options.nth(0)).toHaveAttribute('value', 'name');
	await expect(options.nth(1)).toHaveAttribute('value', 'clipId');
	await expect(options.nth(2)).toHaveAttribute('value', 'role');
	await expect(options.nth(3)).toHaveAttribute('value', 'frames');
});
