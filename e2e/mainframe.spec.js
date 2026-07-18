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
	await expect(page.locator('#panel-clip-editor')).toBeHidden();
	await expect(page.locator('#panel-mapping')).toBeHidden();
});

test('clip library renders clip items or empty state', async ({ page }) => {
	await page.goto('/');
	await page.locator('#refresh-library').click();
	const clipList = page.locator('akvj-clip-list');
	await expect(clipList).toBeVisible();
	const listItems = clipList.locator('clip-instance');
	const itemCount = await listItems.count();
	if (itemCount > 0) {
		await expect(listItems.first()).toContainText(/frames:/);
	} else {
		await expect(clipList).toContainText('No clips');
	}
});

test('tab navigation switches between Library, Clip editor, and Mapping', async ({ page }) => {
	await page.goto('/');

	await page.locator('[data-tab="editor"]').click();
	await expect(page.locator('#panel-clip-editor')).toBeVisible();
	await expect(page.locator('#panel-library')).toBeHidden();

	await page.locator('[data-tab="mapping"]').click();
	await expect(page.locator('#panel-mapping')).toBeVisible();
	await expect(page.locator('#panel-clip-editor')).toBeHidden();

	await page.locator('[data-tab="library"]').click();
	await expect(page.locator('#panel-library')).toBeVisible();
	await expect(page.locator('#panel-mapping')).toBeHidden();
});

test('clip editor tab has drag-and-drop zone and config fields', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="editor"]').click();
	await expect(page.locator('#clip-editor-drop-zone')).toBeVisible();
	await expect(page.locator('#clip-editor-clip-id')).toBeVisible();
	await expect(page.locator('#clip-editor-target-width')).toHaveValue('240');
	await expect(page.locator('#clip-editor-target-height')).toHaveValue('135');
	await expect(page.locator('#clip-editor-playback')).toHaveValue('loop');
	await expect(page.locator('#clip-frames-fps-preset')).toHaveValue('12');
});

test('staging preview element is present in clip editor tab', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="editor"]').click();
	await expect(page.locator('akvj-staging-preview')).toBeVisible();
});

test('clip sort choices has all options', async ({ page }) => {
	await page.goto('/');
	const sortChoices = page.locator('#clip-sort');
	await expect(sortChoices).toBeVisible();
	const options = sortChoices.locator('sort-choice');
	await expect(options).toHaveCount(4);
	await expect(options.nth(0)).toHaveText('Name');
	await expect(options.nth(1)).toHaveText('ID');
	await expect(options.nth(2)).toHaveText('Role');
	await expect(options.nth(3)).toHaveText('Frames');
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
	test.skip(rowCount === 0, 'No mapping rows — seed key-map for this project');
	const firstRow = tableRows.first();
	await expect(firstRow.locator('td').nth(0)).toContainText(/\d+/);
	await expect(firstRow.locator('td').nth(1)).toContainText(/\d+/);
	await expect(firstRow.locator('td').nth(2)).toContainText(/\d+/);
	await expect(firstRow.locator('td').nth(3)).not.toBeEmpty();
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

test('clip edit opens clip editor panel with form fields', async ({ page }) => {
	await page.goto('/');
	await page.locator('#refresh-library').click();
	const clipList = page.locator('akvj-clip-list');
	const listItems = clipList.locator('clip-instance');
	await expect(listItems.first()).toBeVisible({ timeout: 15000 });
	const itemCount = await listItems.count();
	test.skip(itemCount === 0, 'No clips in library — seed default project clips');

	await listItems.first().locator('.clip-edit').click();
	await expect(page.locator('#panel-clip-editor')).toBeVisible();
	await expect(page.locator('#clip-editor-form')).toBeVisible();
	await expect(page.locator('#clip-editor-name')).toBeVisible();
	await expect(page.locator('#clip-editor-playback')).toBeVisible();
	await expect(page.locator('#clip-editor-submit')).toBeVisible();
	await expect(page.locator('#clip-editor-submit')).toHaveText(/Save clip|Create sprite & save/);
});

test('mapping table remove button dispatches removal', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	const mappingTable = page.locator('akvj-mapping-table');
	await expect(mappingTable).toBeVisible();
	const tableRows = mappingTable.locator('tbody tr');
	const rowCount = await tableRows.count();
	test.skip(rowCount === 0, 'No mapping rows — seed key-map for this project');

	const removeButton = tableRows.first().locator('button', { hasText: 'Remove' });
	await expect(removeButton).toBeVisible();
	await removeButton.click();
	await expect(tableRows).toHaveCount(rowCount - 1);
});

test('mainframe page has no unexpected console errors on load', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('AKVJ Mainframe');
	await expect(page.locator('#panel-library')).toBeVisible();
	expect(consoleErrors, `Console errors: ${consoleErrors.join('; ')}`).toEqual([]);
});
