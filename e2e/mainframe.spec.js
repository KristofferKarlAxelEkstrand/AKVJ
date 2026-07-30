import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePngPath = path.resolve(__dirname, '../projects/default/clips/single-frame/sprite.png');

const E2E_TIMEOUT_MS = 15000;

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
	await expect(page).toHaveTitle('AKVJ Mainframe');
	await expect(page.locator('#panel-library')).toBeVisible();
	await expect(page.locator('#panel-clip-editor')).toBeHidden();
	await expect(page.locator('#panel-mapping')).toBeHidden();
});

test('clip library renders clip items or empty state', async ({ page }) => {
	await page.goto('/');
	await page.locator('#refresh-library').click();
	const clipList = page.locator('#clip-list');
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

	await expect(page.locator('.mainframe-header')).toBeVisible();
	await expect(page.locator('.mainframe-brand')).toBeVisible();

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

test('settings route shows header and settings panel', async ({ page }) => {
	await page.goto('/settings');
	await expect(page.locator('.mainframe-header')).toBeVisible();
	await expect(page.locator('.mainframe-brand')).toBeVisible();
	await expect(page.locator('#panel-settings')).toBeVisible();
	await expect(page.locator('#panel-library')).toBeHidden();
});

test('projects route mounts project-chooser with API-fed options', async ({ page }) => {
	await page.goto('/projects');
	await expect(page.locator('#panel-projects')).toBeVisible();
	await expect(page.locator('#project-chooser')).toBeAttached();
	const select = page.locator('.project-chooser-select');
	await expect(select.locator('option')).not.toHaveCount(0);
	await expect(select.locator('option[value="default"]')).toHaveCount(1);
	await expect(page.locator('.project-chooser-active-id')).not.toBeEmpty();
});

test('tab navigation round-trips Library, Projects, and Settings', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#panel-library')).toBeVisible();

	await page.locator('[data-tab="projects"]').click();
	await expect(page.locator('#panel-projects')).toBeVisible();
	await expect(page.locator('#panel-library')).toBeHidden();
	await expect(page.locator('#panel-settings')).toBeHidden();

	await page.locator('[data-tab="settings"]').click();
	await expect(page.locator('#panel-settings')).toBeVisible();
	await expect(page.locator('#panel-projects')).toBeHidden();

	await page.locator('[data-tab="library"]').click();
	await expect(page.locator('#panel-library')).toBeVisible();
	await expect(page.locator('#panel-settings')).toBeHidden();
});

test('projects create, activate switch, and delete cleanup', async ({ page }) => {
	const unique = `E2E ${Date.now()}`;
	const projectId = unique
		.toLowerCase()
		.trim()
		.replace(/[\s_]+/g, '-')
		.replace(/[^a-z0-9-]/g, '');

	await page.goto('/projects');
	const chooser = page.locator('#project-chooser');
	const select = chooser.locator('.project-chooser-select');
	const activeId = chooser.locator('.project-chooser-active-id');
	const status = page.locator('#projects-status');

	await expect(select.locator('option')).not.toHaveCount(0);

	await chooser.locator('.project-chooser-name').fill(unique);
	await chooser.locator('.project-chooser-create button', { hasText: 'Create' }).click();
	await expect(status).toContainText(`Created project ${projectId}`, { timeout: E2E_TIMEOUT_MS });
	await expect(activeId).toContainText(`(${projectId})`);
	await expect(select).toHaveValue(projectId);

	await select.selectOption('default');
	await expect(status).toContainText('Active project: default', { timeout: E2E_TIMEOUT_MS });
	await expect(activeId).toContainText('(default)');

	await select.selectOption(projectId);
	await expect(status).toContainText(`Active project: ${projectId}`, { timeout: E2E_TIMEOUT_MS });

	page.once('dialog', dialog => dialog.accept());
	await chooser.locator('.project-chooser-delete').click();
	await expect(status).toContainText(`Deleted project ${projectId}`, { timeout: E2E_TIMEOUT_MS });
	await expect(select.locator(`option[value="${projectId}"]`)).toHaveCount(0);
	await expect(activeId).toContainText('(default)');
});

test('clip editor tab has drag-and-drop zone and config fields', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="editor"]').click();
	await expect(page.locator('#clip-editor-drop-zone')).toBeVisible();
	await expect(page.locator('#clip-editor-clip-id')).toBeVisible();
	await expect(page.locator('#clip-editor-target-width')).toHaveValue('240');
	await expect(page.locator('#clip-editor-target-height')).toHaveValue('135');
	await expect(page.locator('#clip-editor-playback')).toHaveValue('loop');
	await expect(page.locator('#clip-frames-global-duration-ms')).toHaveValue('');
	await expect(page.locator('#clip-frames-global-duration-ms')).toBeDisabled();
	await expect(page.locator('#clip-editor-sync')).toHaveValue('free');
});

test('clip editor global duration is populated when a frame is staged', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="editor"]').click();

	await page.locator('#clip-editor-files').setInputFiles(samplePngPath, { force: true });
	await expect(page.locator('#clip-frames clip-frame')).toHaveCount(1, { timeout: E2E_TIMEOUT_MS });

	await expect(page.locator('#clip-frames-global-duration-ms')).toHaveValue('1000');
	await expect(page.locator('#clip-frames-global-duration-ms')).toBeEnabled();
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

test('library piano roll mounts in filter mode with key-bed', async ({ page }) => {
	await page.goto('/');
	const libraryRoll = page.locator('#library-piano-roll');
	await expect(libraryRoll).toBeVisible();
	await expect(libraryRoll.locator('key-bed')).toBeVisible();
	await expect(libraryRoll).toHaveAttribute('mode', 'filter');
	await expect(libraryRoll.locator('.piano-roll-mode-button[data-mode="filter"]')).toHaveClass(/is-active/);
	await expect(libraryRoll.locator('.piano-roll-mode-button[data-mode="filter"]')).toHaveAttribute('aria-selected', 'true');
});

test('mapping piano roll mounts in edit mode with key-bed', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	const mappingRoll = page.locator('#mapping-piano-roll');
	await expect(mappingRoll).toBeVisible();
	await expect(mappingRoll.locator('key-bed')).toBeVisible();
	await expect(mappingRoll).toHaveAttribute('mode', 'edit');
	await expect(mappingRoll.locator('.piano-roll-mode-button[data-mode="edit"]')).toHaveClass(/is-active/);
});

test('mapping piano roll can switch to filter mode', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	const mappingRoll = page.locator('#mapping-piano-roll');
	await mappingRoll.locator('.piano-roll-mode-button[data-mode="filter"]').click();
	await expect(mappingRoll).toHaveAttribute('mode', 'filter');
	await expect(mappingRoll.locator('.piano-roll-filter-view')).not.toHaveAttribute('hidden');
	await expect(mappingRoll.locator('.piano-roll-filter-controls')).toBeVisible();
});

test('mapping piano roll can switch to play mode', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	const mappingRoll = page.locator('#mapping-piano-roll');
	await mappingRoll.locator('.piano-roll-mode-button[data-mode="play"]').click();
	await expect(mappingRoll).toHaveAttribute('mode', 'play');
	await expect(mappingRoll.locator('.piano-roll-play-view')).not.toHaveAttribute('hidden');
	const velocitySlider = mappingRoll.locator('.piano-roll-velocity-slider');
	await expect(velocitySlider).toBeVisible();
	await expect(velocitySlider).toHaveAttribute('min', '0');
	await expect(velocitySlider).toHaveAttribute('max', '127');
});

test('library piano roll can switch to play mode', async ({ page }) => {
	await page.goto('/');
	const libraryRoll = page.locator('#library-piano-roll');
	await libraryRoll.locator('.piano-roll-mode-button[data-mode="play"]').click();
	await expect(libraryRoll).toHaveAttribute('mode', 'play');
	await expect(libraryRoll.locator('.piano-roll-play-view')).not.toHaveAttribute('hidden');
	const velocitySlider = libraryRoll.locator('.piano-roll-velocity-slider');
	await expect(velocitySlider).toBeVisible();
	await expect(velocitySlider).toHaveAttribute('min', '0');
	await expect(velocitySlider).toHaveAttribute('max', '127');
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
	} else {
		await expect(mappingTable.locator('.mapping-summary-count')).toHaveText('0 mappings');
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

test('clip edit opens clip editor panel with form fields', async ({ page }) => {
	await page.goto('/');
	await page.locator('#refresh-library').click();
	const clipList = page.locator('akvj-clip-list');
	const listItems = clipList.locator('clip-instance');

	await page.waitForFunction(() => document.querySelectorAll('#clip-list clip-instance').length > 0, { timeout: E2E_TIMEOUT_MS }).catch(() => {});
	const itemCount = await listItems.count();
	test.skip(itemCount === 0, 'No clips in library — seed default project clips');

	await expect(listItems.first()).toBeVisible({ timeout: E2E_TIMEOUT_MS });

	await listItems.first().locator('.clip-edit').click();
	await expect(page.locator('#panel-clip-editor')).toBeVisible();
	await expect(page.locator('#clip-editor-form')).toBeVisible();
	await expect(page.locator('#clip-editor-name')).toBeVisible();
	await expect(page.locator('#clip-editor-playback')).toBeVisible();
	await expect(page.locator('#clip-editor-submit')).toBeVisible();
	await expect(page.locator('#clip-editor-submit')).toHaveText(/Save clip|Create sprite & save/);
});

test('mapping table add and remove button lifecycle', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-tab="mapping"]').click();
	const mappingTable = page.locator('akvj-mapping-table');
	await expect(mappingTable).toBeVisible();

	const clipOptions = page.locator('#map-clip-id option');
	await expect(clipOptions).not.toHaveCount(0);

	const tableRows = mappingTable.locator('tbody tr');
	const initialCount = await tableRows.count();

	await page.locator('#map-channel').fill('1');
	await page.locator('#map-note').fill('99');
	await page.locator('#map-velocity').fill('0');
	const clipId = await clipOptions.first().getAttribute('value');
	await page.locator('#map-clip-id').selectOption(clipId);
	await page.locator('#add-mapping').click();

	await expect(tableRows).toHaveCount(initialCount + 1);

	const addedRow = tableRows.filter({ has: page.locator('td:nth-child(2)', { hasText: '99' }) });
	await addedRow.locator('button', { hasText: 'Remove' }).click();

	await expect(tableRows).toHaveCount(initialCount);
});

test('mainframe page has no unexpected console errors on load', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('AKVJ Mainframe');
	await expect(page.locator('#panel-library')).toBeVisible();
	expect(consoleErrors, `Console errors: ${consoleErrors.join('; ')}`).toEqual([]);
});
