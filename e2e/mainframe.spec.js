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

test('mapping table view loads and displays mapping entries or empty state', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	await expect(page.locator('#panel-mapping')).toBeVisible();
	const mappingTable = page.locator('akvj-mapping-table');
	await expect(mappingTable).toBeVisible();
	await expect(mappingTable.locator('.mapping-summary')).toBeVisible();
	const tableRows = mappingTable.locator('tbody tr');
	const rowCount = await tableRows.count();
	if (rowCount > 0) {
		const firstRow = tableRows.first();
		await expect(firstRow.locator('td').nth(0)).toContainText(/\d+/);
		await expect(firstRow.locator('td').nth(1)).toContainText(/\d+/);
		await expect(firstRow.locator('td').nth(2)).toContainText(/\d+/);
		await expect(firstRow.locator('td').nth(3)).not.toBeEmpty();
	}
});

test('mapping table has correct column headers', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	const mappingTable = page.locator('akvj-mapping-table');
	await expect(mappingTable).toBeVisible();
	const headers = mappingTable.locator('thead th');
	await expect(headers).toHaveCount(5);
	await expect(headers.nth(0)).toHaveText('Channel');
	await expect(headers.nth(1)).toHaveText('Note');
	await expect(headers.nth(2)).toHaveText('Velocity');
	await expect(headers.nth(3)).toHaveText('Clip');
});

test('mapping add form fields are present with correct defaults', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	await expect(page.locator('#map-channel')).toHaveValue('1');
	await expect(page.locator('#map-note')).toHaveValue('0');
	await expect(page.locator('#map-velocity')).toHaveValue('0');
	await expect(page.locator('#map-clip-id')).toBeVisible();
	await expect(page.locator('#add-mapping')).toBeVisible();
});

test('metadata editing opens clip editor form with fields', async ({ page }) => {
	await page.goto('/');
	await page.locator('#refresh-library').click();
	const clipList = page.locator('akvj-clip-list');
	const listItems = clipList.locator('li');
	const itemCount = await listItems.count();
	if (itemCount > 0) {
		const firstEditButton = listItems.first().locator('.clip-edit');
		await firstEditButton.click();
		const editorForm = listItems.first().locator('.clip-edit-form');
		await expect(editorForm).toBeVisible();
		await expect(editorForm.locator('input[name="name"]')).toBeVisible();
		await expect(editorForm.locator('input[name="frames"]')).toBeVisible();
		await expect(editorForm.locator('input[name="framesPerRow"]')).toBeVisible();
		await expect(editorForm.locator('select[name="playback"]')).toBeVisible();
		await expect(editorForm.locator('button', { hasText: 'Save metadata' })).toBeVisible();
	}
});

test('mapping table remove button dispatches removal', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	const mappingTable = page.locator('akvj-mapping-table');
	await expect(mappingTable).toBeVisible();
	const tableRows = mappingTable.locator('tbody tr');
	const rowCount = await tableRows.count();
	if (rowCount > 0) {
		const removeButton = tableRows.first().locator('button', { hasText: 'Remove' });
		await expect(removeButton).toBeVisible();
		await removeButton.click();
		await expect(tableRows).toHaveCount(rowCount - 1);
	}
});

test('mainframe page has no unexpected console errors on load', async ({ page }) => {
	await page.goto('/');
	await page.waitForTimeout(1000);
	expect(consoleErrors, `Console errors: ${consoleErrors.join('; ')}`).toEqual([]);
});
