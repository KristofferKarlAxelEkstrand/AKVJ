// @vitest-environment jsdom

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClipEditorController } from '../src/js/ClipEditorController.js';
import { SYNC_LENGTH_PRESETS } from '../src/js/clipSchema.js';
import '../src/js/ClipFrame.js';
import '../src/js/ClipFrames.js';
import '../src/js/ClipNameInput.js';

function mountEditorDom({ mockClipFrames = true } = {}) {
	document.body.innerHTML = `
		<form id="upload-form">
			<input id="upload-clip-id" />
			<span id="upload-clip-id-hint"></span>
			<h2 id="clip-editor-heading"></h2>
			<button type="submit" id="upload-submit"></button>
			<clip-name-input id="upload-name" name="name"></clip-name-input>
			<select id="upload-role"><option value=""></option><option value="bitmask">bitmask</option></select>
			<input id="upload-target-width" value="240" />
			<input id="upload-target-height" value="135" />
			<select id="upload-scale-mode"><option value="fit">fit</option></select>
			<select id="upload-playback"><option value="loop">loop</option></select>
			<input id="upload-retrigger" type="checkbox" checked />
			<select id="upload-trigger-type"><option value="momentary">momentary</option></select>
			<input id="upload-trigger-group" />
			<div id="upload-bit-depth-field"><input id="upload-bit-depth" value="1" /></div>
			<input id="upload-frame-duration-beats" />
			<button type="button" id="clip-editor-new"></button>
			<button type="button" id="clip-frames-clear"></button>
			<div id="drop-zone"></div>
			<input id="upload-files" type="file" />
			<div id="file-list"></div>
			<div id="upload-status"></div>
			<input id="clip-frames-global-duration" type="number" value="1000" />
			<button type="button" id="clip-frames-set-all-duration">Set all</button>
			<select id="clip-frames-fps-preset">
				<option value="">—</option>
				<option value="6">6</option>
				<option value="12" selected>12</option>
				<option value="15">15</option>
				<option value="24">24</option>
				<option value="25">25</option>
				<option value="30">30</option>
			</select>
			<button type="button" id="clip-frames-apply-fps-preset">Apply FPS</button>
			<select id="upload-sync">
				<option value="free" selected>Free</option>
				<option value="beat">Beat synced</option>
			</select>
			<div id="upload-sync-beat-fields" hidden>
				<select id="upload-sync-length">
					<option value="1/4 beat">1/4 beat</option>
					<option value="1 bar" selected>1 bar</option>
					<option value="custom">custom</option>
				</select>
				<label id="upload-sync-beats-field" hidden>
					<input id="upload-sync-beats" type="number" />
				</label>
				<input id="upload-beats-per-bar" type="number" value="4" />
			</div>
		</form>
		<clip-frames id="clip-frames"></clip-frames>
		<akvj-staging-preview id="staging-preview"></akvj-staging-preview>
	`;
	const clipFrames = document.getElementById('clip-frames');
	if (mockClipFrames) {
		clipFrames.clearAll = vi.fn();
		clipFrames.loadFrames = vi.fn();
		clipFrames.getDurations = vi.fn(() => []);
	}
	const preview = document.getElementById('staging-preview');
	preview.loadFrames = vi.fn();
}

describe('ClipEditorController', () => {
	beforeEach(() => {
		mountEditorDom();
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	test('open navigates to edit path', () => {
		const navigate = vi.fn();
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate, replace: vi.fn() }
		});
		controller.open('neon-skull');
		expect(navigate).toHaveBeenCalledWith('/clip/edit/neon-skull');
	});

	test('reset clears chrome to new-clip mode', () => {
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.reset();
		expect(document.getElementById('clip-editor-heading').textContent).toBe('');
		expect(document.getElementById('clip-editor-heading').hidden).toBe(true);
		expect(document.getElementById('upload-submit').textContent).toBe('Create sprite & save');
		expect(document.getElementById('upload-clip-id').readOnly).toBe(false);
	});

	test('updateStagingPreview forwards staged per-frame durationsMs to the preview', async () => {
		const preview = document.getElementById('staging-preview');
		const clipFrames = document.getElementById('clip-frames');
		clipFrames.getDurations = vi.fn(() => [250, 750]);

		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();

		const files = [
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' })
		];
		await controller.stageSelectedFiles(files);

		expect(preview.loadFrames).toHaveBeenCalled();
		const firstCall = preview.loadFrames.mock.calls.at(-1);
		expect(firstCall[0]).toHaveLength(2);
		expect(firstCall[3]).toBe(12);
		expect(firstCall[6]).toEqual([1000, 1000]);

		preview.loadFrames.mockClear();
		clipFrames.dispatchEvent(new Event('durationchange', { bubbles: true }));

		expect(preview.loadFrames).toHaveBeenCalledTimes(1);
		const afterDuration = preview.loadFrames.mock.calls[0];
		expect(afterDuration[6]).toEqual([250, 750]);
	});

	test('typing a name live-updates the clip id before save', () => {
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();

		const nameInput = document.getElementById('upload-name');
		const idInput = document.getElementById('upload-clip-id');
		expect(idInput.readOnly).toBe(false);

		nameInput.value = 'Neon Skull';
		nameInput.dispatchEvent(new CustomEvent('namechange', { bubbles: true, detail: { value: 'Neon Skull' } }));
		expect(idInput.value).toBe('neon-skull');
		expect(idInput.readOnly).toBe(false);
	});

	test('editing an existing clip does not regenerate the clip id from the name', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async url => {
				if (String(url).startsWith('data:')) {
					return {
						ok: true,
						blob: async () => new Blob(['x'], { type: 'image/png' })
					};
				}
				return {
					ok: true,
					json: async () => ({
						frames: ['data:image/png;base64,aaa'],
						durationsMs: [1000],
						meta: { name: 'Old Name', playback: 'loop' },
						source: 'sprite'
					})
				};
			})
		);

		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();
		await controller.hydrate('legacy-clip');

		const nameInput = document.getElementById('upload-name');
		const idInput = document.getElementById('upload-clip-id');
		expect(idInput.value).toBe('legacy-clip');
		expect(idInput.readOnly).toBe(true);

		nameInput.value = 'Brand New Name';
		nameInput.dispatchEvent(new CustomEvent('namechange', { bubbles: true, detail: { value: 'Brand New Name' } }));
		expect(idInput.value).toBe('legacy-clip');
		expect(idInput.readOnly).toBe(true);

		vi.unstubAllGlobals();
	});

	test('global duration input disables when mixed and Set all restores uniform', async () => {
		mountEditorDom({ mockClipFrames: false });
		const preview = document.getElementById('staging-preview');
		preview.loadFrames = vi.fn();

		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();

		await controller.stageSelectedFiles([
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' })
		]);

		const globalInput = document.getElementById('clip-frames-global-duration');
		const setAll = document.getElementById('clip-frames-set-all-duration');
		expect(globalInput.disabled).toBe(false);
		expect(globalInput.value).toBe('1000');

		const durationInput = document.querySelector('clip-frame .clip-frame-duration');
		durationInput.value = '400';
		durationInput.dispatchEvent(new Event('change', { bubbles: true }));

		expect(globalInput.disabled).toBe(true);
		expect(globalInput.value).toBe('');

		setAll.click();
		expect(globalInput.disabled).toBe(false);
		expect(globalInput.value).toBe('1000');
		expect(document.getElementById('clip-frames').getDurations()).toEqual([1000, 1000]);

		globalInput.value = '250';
		setAll.click();
		expect(document.getElementById('clip-frames').getDurations()).toEqual([250, 250]);
		expect(globalInput.value).toBe('250');
	});

	test('FPS preset applies the same ms as Set all (1000/fps) and disables when mixed', async () => {
		mountEditorDom({ mockClipFrames: false });
		const preview = document.getElementById('staging-preview');
		preview.loadFrames = vi.fn();

		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();

		await controller.stageSelectedFiles([
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' })
		]);

		const fpsSelect = document.getElementById('clip-frames-fps-preset');
		const applyFps = document.getElementById('clip-frames-apply-fps-preset');
		const expectedMs = Math.round(1000 / 24);

		fpsSelect.value = '24';
		applyFps.click();
		expect(document.getElementById('clip-frames').getDurations()).toEqual([expectedMs, expectedMs]);
		expect(document.getElementById('clip-frames-global-duration').value).toBe(String(expectedMs));
		expect(fpsSelect.disabled).toBe(false);
		expect(fpsSelect.value).toBe('24');

		const durationInput = document.querySelector('clip-frame .clip-frame-duration');
		durationInput.value = '400';
		durationInput.dispatchEvent(new Event('change', { bubbles: true }));
		expect(fpsSelect.disabled).toBe(true);
		expect(fpsSelect.value).toBe('');
		expect(applyFps.disabled).toBe(false);

		fpsSelect.value = '12';
		applyFps.click();
		const twelveMs = Math.round(1000 / 12);
		expect(document.getElementById('clip-frames').getDurations()).toEqual([twelveMs, twelveMs]);
		expect(fpsSelect.disabled).toBe(false);
	});

	test('sync mode toggle shows beat fields; custom beats only for custom length', () => {
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();

		const lengthOptions = [...document.getElementById('upload-sync-length').options].map(option => option.value);
		expect(lengthOptions).toEqual([...SYNC_LENGTH_PRESETS]);

		const beatFields = document.getElementById('upload-sync-beat-fields');
		const customField = document.getElementById('upload-sync-beats-field');
		const sync = document.getElementById('upload-sync');
		const syncLength = document.getElementById('upload-sync-length');

		expect(beatFields.hidden).toBe(true);
		expect(customField.hidden).toBe(true);

		sync.value = 'beat';
		sync.dispatchEvent(new Event('change', { bubbles: true }));
		expect(beatFields.hidden).toBe(false);
		expect(customField.hidden).toBe(true);

		syncLength.value = 'custom';
		syncLength.dispatchEvent(new Event('change', { bubbles: true }));
		expect(customField.hidden).toBe(false);

		sync.value = 'free';
		sync.dispatchEvent(new Event('change', { bubbles: true }));
		expect(beatFields.hidden).toBe(true);
	});

	test('beat sync updates staging preview timing from length / beatsPerBar', async () => {
		const preview = document.getElementById('staging-preview');
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();

		await controller.stageSelectedFiles([
			new File(['a'], 'f0.png', { type: 'image/png' }),
			new File(['b'], 'f1.png', { type: 'image/png' }),
			new File(['c'], 'f2.png', { type: 'image/png' }),
			new File(['d'], 'f3.png', { type: 'image/png' })
		]);

		preview.loadFrames.mockClear();
		const sync = document.getElementById('upload-sync');
		sync.value = 'beat';
		document.getElementById('upload-sync-length').value = '1 bar';
		document.getElementById('upload-beats-per-bar').value = '4';
		sync.dispatchEvent(new Event('change', { bubbles: true }));

		// 4 frames × 1 beat each @ 120 BPM → 500ms
		expect(preview.loadFrames.mock.calls.at(-1)[6]).toEqual([500, 500, 500, 500]);

		preview.loadFrames.mockClear();
		document.getElementById('upload-beats-per-bar').value = '3';
		document.getElementById('upload-beats-per-bar').dispatchEvent(new Event('change', { bubbles: true }));
		// 3 beats total / 4 frames = 0.75 beat → 375ms @ 120 BPM
		expect(preview.loadFrames.mock.calls.at(-1)[6]).toEqual([375, 375, 375, 375]);
	});

	test('hydrate failure reports via messages.error and clears progressive status', async () => {
		const { messages } = await import('../src/js/mainframeState.js');
		const errorSpy = vi.spyOn(messages, 'error');
		const setStatus = vi.fn();

		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				ok: false,
				status: 404,
				json: async () => ({ error: 'not found' })
			}))
		);

		const controller = new ClipEditorController({
			setStatus,
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bind();
		setStatus.mockClear();

		await controller.hydrate('missing-clip');

		expect(errorSpy).toHaveBeenCalled();
		expect(String(errorSpy.mock.calls.at(-1)[0])).toMatch(/not found|Failed|404|error/i);
		const lastStatusCall = setStatus.mock.calls.at(-1);
		expect(lastStatusCall?.[1]).toBe('');

		vi.unstubAllGlobals();
	});
});
