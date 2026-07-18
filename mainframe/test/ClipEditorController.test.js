// @vitest-environment jsdom

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClipEditorController } from '../src/js/ClipEditorController.js';
import { SYNC_LENGTH_PRESETS } from '../src/js/clipSchema.js';
import '../src/js/ClipFrame.js';
import '../src/js/ClipFrames.js';
import '../src/js/ClipNameInput.js';

function mountEditorDom({ mockClipFrames = true } = {}) {
	document.body.innerHTML = `
		<form id="clip-editor-form">
			<input id="clip-editor-clip-id" />
			<span id="clip-editor-clip-id-hint"></span>
			<h2 id="clip-editor-heading"></h2>
			<button type="submit" id="clip-editor-submit"></button>
			<clip-name-input id="clip-editor-name" name="name"></clip-name-input>
			<select id="clip-editor-role"><option value=""></option><option value="bitmask">bitmask</option></select>
			<input id="clip-editor-target-width" value="240" />
			<input id="clip-editor-target-height" value="135" />
			<select id="clip-editor-scale-mode"><option value="fit">fit</option></select>
			<input id="clip-editor-placement-x" type="number" value="0" />
			<input id="clip-editor-placement-y" type="number" value="0" />
			<select id="clip-editor-playback"><option value="loop">loop</option></select>
			<input id="clip-editor-retrigger" type="checkbox" checked />
			<select id="clip-editor-trigger-type"><option value="momentary">momentary</option></select>
			<input id="clip-editor-trigger-group" />
			<div id="clip-editor-bit-depth-field"><input id="clip-editor-bit-depth" value="1" /></div>
			<input id="clip-editor-frame-duration-beats" />
			<button type="button" id="clip-editor-new"></button>
			<button type="button" id="clip-frames-clear"></button>
			<div id="clip-editor-drop-zone"></div>
			<input id="clip-editor-files" type="file" />
			<div id="clip-editor-status"></div>
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
			<select id="clip-frames-global-bake-scale">
				<option value="">—</option>
				<option value="fit" selected>fit</option>
				<option value="cover">cover</option>
				<option value="stretch">stretch</option>
				<option value="none">none</option>
				<option value="custom">custom</option>
			</select>
			<label id="clip-frames-global-custom-size" hidden>
				<input id="clip-frames-global-custom-width" type="number" value="240" />
				<input id="clip-frames-global-custom-height" type="number" value="135" />
			</label>
			<button type="button" id="clip-frames-set-all-bake-scale">Set scale</button>
			<select id="clip-editor-sync">
				<option value="free" selected>Free</option>
				<option value="beat">Beat synced</option>
			</select>
			<div id="clip-editor-sync-beat-fields" hidden>
				<select id="clip-editor-sync-length">
					<option value="1/4 beat">1/4 beat</option>
					<option value="1 bar" selected>1 bar</option>
					<option value="custom">custom</option>
				</select>
				<label id="clip-editor-sync-beats-field" hidden>
					<input id="clip-editor-sync-beats" type="number" />
				</label>
				<input id="clip-editor-beats-per-bar" type="number" value="4" />
			</div>
		</form>
		<clip-frames id="clip-frames"></clip-frames>
		<akvj-staging-preview id="clip-editor-staging-preview"></akvj-staging-preview>
	`;
	const clipFrames = document.getElementById('clip-frames');
	if (mockClipFrames) {
		clipFrames.clearAll = vi.fn();
		clipFrames.loadFrames = vi.fn();
		clipFrames.getDurationsMs = vi.fn(() => []);
		clipFrames.getBakeConfigs = vi.fn(() => []);
		clipFrames.areBakeConfigsUniform = vi.fn(() => true);
		clipFrames.setAllBakeConfigs = vi.fn();
	}
	const preview = document.getElementById('clip-editor-staging-preview');
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
		expect(document.getElementById('clip-editor-submit').textContent).toBe('Create sprite & save');
		expect(document.getElementById('clip-editor-clip-id').readOnly).toBe(false);
	});

	test('updateStagingPreview forwards staged per-frame durationsMs to the preview', async () => {
		const preview = document.getElementById('clip-editor-staging-preview');
		const clipFrames = document.getElementById('clip-frames');
		clipFrames.getDurationsMs = vi.fn(() => [250, 750]);

		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bindEventListeners();

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
		controller.bindEventListeners();

		const nameInput = document.getElementById('clip-editor-name');
		const idInput = document.getElementById('clip-editor-clip-id');
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
		controller.bindEventListeners();
		await controller.hydrate('legacy-clip');

		const nameInput = document.getElementById('clip-editor-name');
		const idInput = document.getElementById('clip-editor-clip-id');
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
		const preview = document.getElementById('clip-editor-staging-preview');
		preview.loadFrames = vi.fn();

		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bindEventListeners();

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
		expect(document.getElementById('clip-frames').getDurationsMs()).toEqual([1000, 1000]);

		globalInput.value = '250';
		setAll.click();
		expect(document.getElementById('clip-frames').getDurationsMs()).toEqual([250, 250]);
		expect(globalInput.value).toBe('250');
	});

	test('FPS preset applies the same ms as Set all (1000/fps) and disables when mixed', async () => {
		mountEditorDom({ mockClipFrames: false });
		const preview = document.getElementById('clip-editor-staging-preview');
		preview.loadFrames = vi.fn();

		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bindEventListeners();

		await controller.stageSelectedFiles([
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' })
		]);

		const fpsSelect = document.getElementById('clip-frames-fps-preset');
		const applyFps = document.getElementById('clip-frames-apply-fps-preset');
		const expectedMs = Math.round(1000 / 24);

		fpsSelect.value = '24';
		applyFps.click();
		expect(document.getElementById('clip-frames').getDurationsMs()).toEqual([expectedMs, expectedMs]);
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
		expect(document.getElementById('clip-frames').getDurationsMs()).toEqual([twelveMs, twelveMs]);
		expect(fpsSelect.disabled).toBe(false);
	});

	test('sync mode toggle shows beat fields; custom beats only for custom length', () => {
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bindEventListeners();

		const lengthOptions = [...document.getElementById('clip-editor-sync-length').options].map(option => option.value);
		expect(lengthOptions).toEqual([...SYNC_LENGTH_PRESETS]);

		const beatFields = document.getElementById('clip-editor-sync-beat-fields');
		const customField = document.getElementById('clip-editor-sync-beats-field');
		const sync = document.getElementById('clip-editor-sync');
		const syncLength = document.getElementById('clip-editor-sync-length');

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
		const preview = document.getElementById('clip-editor-staging-preview');
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bindEventListeners();

		await controller.stageSelectedFiles([
			new File(['a'], 'f0.png', { type: 'image/png' }),
			new File(['b'], 'f1.png', { type: 'image/png' }),
			new File(['c'], 'f2.png', { type: 'image/png' }),
			new File(['d'], 'f3.png', { type: 'image/png' })
		]);

		preview.loadFrames.mockClear();
		const sync = document.getElementById('clip-editor-sync');
		sync.value = 'beat';
		document.getElementById('clip-editor-sync-length').value = '1 bar';
		document.getElementById('clip-editor-beats-per-bar').value = '4';
		sync.dispatchEvent(new Event('change', { bubbles: true }));

		// 4 frames × 1 beat each @ 120 BPM → 500ms
		expect(preview.loadFrames.mock.calls.at(-1)[6]).toEqual([500, 500, 500, 500]);

		preview.loadFrames.mockClear();
		document.getElementById('clip-editor-beats-per-bar').value = '3';
		document.getElementById('clip-editor-beats-per-bar').dispatchEvent(new Event('change', { bubbles: true }));
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
		controller.bindEventListeners();
		setStatus.mockClear();

		await controller.hydrate('missing-clip');

		expect(errorSpy).toHaveBeenCalled();
		expect(String(errorSpy.mock.calls.at(-1)[0])).toMatch(/not found|Failed|404|error/i);
		const lastStatusCall = setStatus.mock.calls.at(-1);
		expect(lastStatusCall?.[1]).toBe('');

		vi.unstubAllGlobals();
	});

	function apiFetchMock(routeHandler) {
		return vi.fn(async (url, options = {}) => {
			const href = String(url);
			if (href.startsWith('data:')) {
				return {
					ok: true,
					blob: async () => new Blob(['x'], { type: 'image/png' })
				};
			}
			return routeHandler(href, options);
		});
	}

	function jsonOk(body = {}) {
		return { ok: true, status: 200, json: async () => body };
	}

	function makeController(overrides = {}) {
		const controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(async () => {}),
			router: { navigate: vi.fn(), replace: vi.fn() },
			...overrides
		});
		controller.bindEventListeners();
		return controller;
	}

	describe('submit()', () => {
		test('create POSTs /clips, updates chrome, and replaces route', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const infoSpy = vi.spyOn(messages, 'info');
			const onLibraryChanged = vi.fn(async () => {});
			const replace = vi.fn();

			vi.stubGlobal(
				'fetch',
				apiFetchMock(async (href, options) => {
					expect(href).toBe('/api/clips');
					expect(options.method).toBe('POST');
					return jsonOk({ clipId: 'neon-skull' });
				})
			);

			const controller = makeController({ onLibraryChanged, router: { navigate: vi.fn(), replace } });
			await controller.stageSelectedFiles([new File(['a'], 'f0.png', { type: 'image/png' })]);
			document.getElementById('clip-editor-clip-id').value = 'neon-skull';
			document.getElementById('clip-editor-target-width').value = '300';
			document.getElementById('clip-editor-target-height').value = '160';

			await controller.submit();

			expect(onLibraryChanged).toHaveBeenCalledOnce();
			expect(replace).toHaveBeenCalledWith('/clip/edit/neon-skull', { invokeHandler: false });
			expect(document.getElementById('clip-editor-clip-id').readOnly).toBe(true);
			expect(document.getElementById('clip-editor-submit').textContent).toBe('Save clip');
			expect(infoSpy).toHaveBeenCalledWith('Saved clip neon-skull');
			vi.unstubAllGlobals();
		});

		test('create with empty clip ID reports error and skips API', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const errorSpy = vi.spyOn(messages, 'error');
			const fetchMock = apiFetchMock(async () => jsonOk({}));
			vi.stubGlobal('fetch', fetchMock);

			const controller = makeController();
			await controller.stageSelectedFiles([new File(['a'], 'f0.png', { type: 'image/png' })]);
			document.getElementById('clip-editor-clip-id').value = '   ';

			await controller.submit();

			expect(errorSpy).toHaveBeenCalledWith('Clip ID is required');
			expect(fetchMock.mock.calls.filter(([url]) => String(url).startsWith('/api/'))).toHaveLength(0);
			vi.unstubAllGlobals();
		});

		test('create with zero staged frames reports error and skips API', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const errorSpy = vi.spyOn(messages, 'error');
			const fetchMock = apiFetchMock(async () => jsonOk({}));
			vi.stubGlobal('fetch', fetchMock);

			const controller = makeController();
			document.getElementById('clip-editor-clip-id').value = 'empty-clip';
			await controller.submit();

			expect(errorSpy).toHaveBeenCalledWith('Cannot save with zero frames — add at least one image');
			expect(fetchMock).not.toHaveBeenCalled();
			vi.unstubAllGlobals();
		});

		test('editing + dirty frames PUTs /frames and clears dirty for meta-only follow-up', async () => {
			const methods = [];
			vi.stubGlobal(
				'fetch',
				apiFetchMock(async (href, options) => {
					if (href.includes('/frames') && (!options.method || options.method === 'GET')) {
						return jsonOk({
							frames: ['data:image/png;base64,aaa'],
							durationsMs: [1000],
							meta: { name: 'Legacy', playback: 'loop', frameWidth: 240, frameHeight: 135, scaleMode: 'fit' },
							source: 'sprite'
						});
					}
					methods.push({ href, method: options.method, body: options.body });
					return jsonOk({});
				})
			);

			const controller = makeController();
			await controller.hydrate('legacy-clip');
			await controller.stageSelectedFiles([new File(['b'], 'extra.png', { type: 'image/png' })]);
			await controller.submit();

			expect(methods.some(call => call.method === 'PUT' && call.href.endsWith('/clips/legacy-clip/frames'))).toBe(true);

			methods.length = 0;
			document.getElementById('clip-editor-name').value = 'Renamed Only';
			await controller.submit();
			expect(methods).toHaveLength(1);
			expect(methods[0].method).toBe('PUT');
			expect(methods[0].href).toBe('/api/clips/legacy-clip');
			expect(methods[0].href).not.toContain('/frames');
			vi.unstubAllGlobals();
		});

		test('editing + size/scale change PUTs /frames', async () => {
			const methods = [];
			vi.stubGlobal(
				'fetch',
				apiFetchMock(async (href, options) => {
					if (href.includes('/frames') && (!options.method || options.method === 'GET')) {
						return jsonOk({
							frames: ['data:image/png;base64,aaa'],
							durationsMs: [1000],
							meta: { name: 'Sized', playback: 'loop', frameWidth: 240, frameHeight: 135, scaleMode: 'fit' },
							source: 'sprite'
						});
					}
					methods.push({ href, method: options.method });
					return jsonOk({});
				})
			);

			const controller = makeController();
			await controller.hydrate('sized-clip');
			document.getElementById('clip-editor-target-width').value = '320';
			await controller.submit();

			expect(methods.some(call => call.method === 'PUT' && call.href.endsWith('/clips/sized-clip/frames'))).toBe(true);
			vi.unstubAllGlobals();
		});

		test('editing + clean meta-only PUTs /clips/{id} without frames', async () => {
			const methods = [];
			vi.stubGlobal(
				'fetch',
				apiFetchMock(async (href, options) => {
					if (href.includes('/frames') && (!options.method || options.method === 'GET')) {
						return jsonOk({
							frames: ['data:image/png;base64,aaa'],
							durationsMs: [1000],
							meta: { name: 'Clean', playback: 'loop', frameWidth: 240, frameHeight: 135, scaleMode: 'fit' },
							source: 'sprite'
						});
					}
					methods.push({ href, method: options.method, body: options.body });
					return jsonOk({});
				})
			);

			const controller = makeController();
			await controller.hydrate('clean-clip');
			document.getElementById('clip-editor-name').value = 'Still Clean';
			await controller.submit();

			expect(methods).toHaveLength(1);
			expect(methods[0]).toMatchObject({ href: '/api/clips/clean-clip', method: 'PUT' });
			const body = JSON.parse(methods[0].body);
			expect(body.frames).toBeUndefined();
			expect(body.name).toBe('Still Clean');
			vi.unstubAllGlobals();
		});

		test('API non-ok reports error outcome', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const errorSpy = vi.spyOn(messages, 'error');
			vi.stubGlobal(
				'fetch',
				apiFetchMock(async () => ({
					ok: false,
					status: 500,
					json: async () => ({ error: 'server blew up' })
				}))
			);

			const controller = makeController();
			await controller.stageSelectedFiles([new File(['a'], 'f0.png', { type: 'image/png' })]);
			document.getElementById('clip-editor-clip-id').value = 'boom-clip';
			await controller.submit();

			expect(errorSpy).toHaveBeenCalledWith('server blew up');
			vi.unstubAllGlobals();
		});

		test('extended fields error aborts submit without API call', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const errorSpy = vi.spyOn(messages, 'error');
			const fetchMock = apiFetchMock(async () => jsonOk({}));
			vi.stubGlobal('fetch', fetchMock);

			const controller = makeController();
			await controller.stageSelectedFiles([new File(['a'], 'f0.png', { type: 'image/png' })]);
			document.getElementById('clip-editor-clip-id').value = 'sync-clip';
			document.getElementById('clip-editor-sync').value = 'beat';
			document.getElementById('clip-editor-sync-length').value = 'custom';
			document.getElementById('clip-editor-sync-beats').value = '';
			document.getElementById('clip-editor-sync').dispatchEvent(new Event('change', { bubbles: true }));

			await controller.submit();

			expect(errorSpy).toHaveBeenCalledWith('Custom beats is required when sync length is custom');
			expect(fetchMock.mock.calls.filter(([url]) => String(url).startsWith('/api/'))).toHaveLength(0);
			vi.unstubAllGlobals();
		});

		test('post-submit updates loaded size so a later name-only save is meta PUT', async () => {
			const methods = [];
			vi.stubGlobal(
				'fetch',
				apiFetchMock(async (href, options) => {
					if (href.includes('/frames') && (!options.method || options.method === 'GET')) {
						return jsonOk({
							frames: ['data:image/png;base64,aaa'],
							durationsMs: [1000],
							meta: { name: 'Sized', playback: 'loop', frameWidth: 240, frameHeight: 135, scaleMode: 'fit' },
							source: 'sprite'
						});
					}
					methods.push({ href, method: options.method });
					return jsonOk({});
				})
			);

			const controller = makeController();
			await controller.hydrate('post-submit-clip');
			document.getElementById('clip-editor-target-width').value = '300';
			await controller.submit();
			expect(methods.at(-1).href).toContain('/frames');

			methods.length = 0;
			document.getElementById('clip-editor-name').value = 'After Size Save';
			await controller.submit();
			expect(methods).toEqual([{ href: '/api/clips/post-submit-clip', method: 'PUT' }]);
			vi.unstubAllGlobals();
		});
	});

	describe('hydrate success', () => {
		test('populates form, sets editing chrome, and loads frames from sprite source', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const infoSpy = vi.spyOn(messages, 'info');
			const clipFrames = document.getElementById('clip-frames');

			vi.stubGlobal(
				'fetch',
				apiFetchMock(async () =>
					jsonOk({
						frames: ['data:image/png;base64,aaa', 'data:image/png;base64,bbb'],
						durationsMs: [250, 750],
						meta: {
							name: 'Hydrated Clip',
							playback: 'loop',
							frameWidth: 320,
							frameHeight: 180,
							scaleMode: 'fit',
							role: 'bitmask'
						},
						source: 'sprite'
					})
				)
			);

			const controller = makeController();
			await controller.hydrate('hydrated-clip');

			expect(document.getElementById('clip-editor-clip-id').value).toBe('hydrated-clip');
			expect(document.getElementById('clip-editor-clip-id').readOnly).toBe(true);
			expect(document.getElementById('clip-editor-submit').textContent).toBe('Save clip');
			expect(document.getElementById('clip-editor-name').value).toBe('Hydrated Clip');
			expect(document.getElementById('clip-editor-target-width').value).toBe('320');
			expect(document.getElementById('clip-editor-target-height').value).toBe('180');
			expect(document.getElementById('clip-editor-role').value).toBe('bitmask');
			expect(clipFrames.loadFrames).toHaveBeenCalled();
			expect(infoSpy.mock.calls.some(call => String(call[0]).includes('sprite'))).toBe(true);
			vi.unstubAllGlobals();
		});

		test('stale hydrate response is ignored by generation guard', async () => {
			let releaseSlow;
			const slowReady = new Promise(resolve => {
				releaseSlow = resolve;
			});

			vi.stubGlobal(
				'fetch',
				apiFetchMock(async href => {
					if (href.includes('slow-clip')) {
						await slowReady;
						return jsonOk({
							frames: ['data:image/png;base64,slow'],
							durationsMs: [1000],
							meta: { name: 'Slow', playback: 'loop', frameWidth: 100, frameHeight: 50, scaleMode: 'fit' },
							source: 'sprite'
						});
					}
					return jsonOk({
						frames: ['data:image/png;base64,fast'],
						durationsMs: [1000],
						meta: { name: 'Fast', playback: 'loop', frameWidth: 200, frameHeight: 100, scaleMode: 'fit' },
						source: 'raw'
					});
				})
			);

			const controller = makeController();
			const slowPromise = controller.hydrate('slow-clip');
			await controller.hydrate('fast-clip');
			releaseSlow();
			await slowPromise;

			expect(document.getElementById('clip-editor-clip-id').value).toBe('fast-clip');
			expect(document.getElementById('clip-editor-name').value).toBe('Fast');
			expect(document.getElementById('clip-editor-target-width').value).toBe('200');
			vi.unstubAllGlobals();
		});
	});

	describe('GIF expansion', () => {
		test('animated GIF expands into multiple frames with durations', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const infoSpy = vi.spyOn(messages, 'info');
			const clipFrames = document.getElementById('clip-frames');

			vi.stubGlobal(
				'fetch',
				apiFetchMock(async (href, options) => {
					if (href === '/api/expand-gif' && options.method === 'POST') {
						return jsonOk({
							animated: true,
							frames: ['data:image/png;base64,g0', 'data:image/png;base64,g1', 'data:image/png;base64,g2'],
							durationsMs: [40, 80, 120]
						});
					}
					return jsonOk({});
				})
			);

			const controller = makeController();
			await controller.stageSelectedFiles([new File(['gif'], 'anim.gif', { type: 'image/gif' })]);

			expect(infoSpy).toHaveBeenCalledWith('Expanded animated GIF into 3 frames');
			expect(clipFrames.loadFrames).toHaveBeenCalled();
			const frames = clipFrames.loadFrames.mock.calls.at(-1)[0];
			expect(frames).toHaveLength(3);
			expect(frames.map(frame => frame.durationMs)).toEqual([40, 80, 120]);
			vi.unstubAllGlobals();
		});

		test('non-animated GIF falls through to normal staging', async () => {
			const clipFrames = document.getElementById('clip-frames');
			vi.stubGlobal(
				'fetch',
				apiFetchMock(async (href, options) => {
					if (href === '/api/expand-gif' && options.method === 'POST') {
						return jsonOk({ animated: false });
					}
					return jsonOk({});
				})
			);

			const controller = makeController();
			await controller.stageSelectedFiles([new File(['gif'], 'still.gif', { type: 'image/gif' })]);

			expect(clipFrames.loadFrames).toHaveBeenCalled();
			const frames = clipFrames.loadFrames.mock.calls.at(-1)[0];
			expect(frames).toHaveLength(1);
			expect(frames[0].durationMs).toBe(1000);
			vi.unstubAllGlobals();
		});

		test('GIF expansion API error reports and stages no frames', async () => {
			const { messages } = await import('../src/js/mainframeState.js');
			const errorSpy = vi.spyOn(messages, 'error');
			const clipFrames = document.getElementById('clip-frames');

			vi.stubGlobal(
				'fetch',
				apiFetchMock(async href => {
					if (href === '/api/expand-gif') {
						return { ok: false, status: 400, json: async () => ({ error: 'bad gif' }) };
					}
					return jsonOk({});
				})
			);

			const controller = makeController();
			clipFrames.loadFrames.mockClear();
			await controller.stageSelectedFiles([new File(['gif'], 'bad.gif', { type: 'image/gif' })]);

			expect(errorSpy).toHaveBeenCalledWith('bad gif');
			expect(clipFrames.loadFrames).not.toHaveBeenCalled();
			vi.unstubAllGlobals();
		});
	});
});

describe('ClipEditorController global bake scale', () => {
	/** @type {ClipEditorController} */
	let controller;
	/** @type {HTMLElement} */
	let clipFrames;
	/** @type {HTMLElement} */
	let preview;
	/** @type {HTMLSelectElement} */
	let bakeScaleSelect;
	/** @type {HTMLButtonElement} */
	let bakeScaleApply;
	/** @type {HTMLElement} */
	let bakeCustomSize;

	beforeEach(() => {
		mountEditorDom({ mockClipFrames: false });
		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();
		clipFrames = document.getElementById('clip-frames');
		preview = document.getElementById('clip-editor-staging-preview');
		bakeScaleSelect = document.getElementById('clip-frames-global-bake-scale');
		bakeScaleApply = document.getElementById('clip-frames-set-all-bake-scale');
		bakeCustomSize = document.getElementById('clip-frames-global-custom-size');
		controller = new ClipEditorController({
			setStatus: vi.fn(),
			onLibraryChanged: vi.fn(),
			router: { navigate: vi.fn(), replace: vi.fn() }
		});
		controller.bindEventListeners();
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	test('empty staging disables bake select and apply', () => {
		expect(bakeScaleSelect.disabled).toBe(true);
		expect(bakeScaleApply.disabled).toBe(true);
		expect(bakeCustomSize.hidden).toBe(true);
	});

	test('staging frames enables bake controls; Set scale applies cover to all and refreshes preview', async () => {
		const files = [
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' })
		];
		await controller.stageSelectedFiles(files);

		expect(bakeScaleSelect.disabled).toBe(false);
		expect(bakeScaleApply.disabled).toBe(false);
		expect(bakeScaleSelect.value).toBe('fit');
		expect(clipFrames.areBakeConfigsUniform()).toBe(true);

		preview.loadFrames.mockClear();
		bakeScaleSelect.value = 'cover';
		bakeScaleApply.click();

		expect(clipFrames.getBakeConfigs().every(config => config.scaleMode === 'cover')).toBe(true);
		expect(clipFrames.areBakeConfigsUniform()).toBe(true);
		expect(bakeScaleSelect.value).toBe('cover');
		expect(preview.loadFrames).toHaveBeenCalled();
		const bakeConfigsArg = preview.loadFrames.mock.calls.at(-1)[8];
		expect(bakeConfigsArg.every(config => config.scaleMode === 'cover')).toBe(true);
	});

	test('non-uniform bake configs disable and blank the global select; Apply stays enabled', async () => {
		await controller.stageSelectedFiles([
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' })
		]);

		const scaleSelect = clipFrames.querySelector('clip-frame .clip-frame-scale');
		scaleSelect.value = 'stretch';
		scaleSelect.dispatchEvent(new Event('change', { bubbles: true }));

		expect(clipFrames.areBakeConfigsUniform()).toBe(false);
		expect(bakeScaleSelect.disabled).toBe(true);
		expect(bakeScaleSelect.value).toBe('');
		expect(bakeScaleApply.disabled).toBe(false);
		expect(bakeCustomSize.hidden).toBe(true);
	});

	test('custom mode shows global custom size fields; non-custom hides them', async () => {
		await controller.stageSelectedFiles([new File(['a'], 'frame0.png', { type: 'image/png' })]);

		bakeScaleSelect.value = 'custom';
		bakeScaleSelect.dispatchEvent(new Event('change'));
		expect(bakeCustomSize.hidden).toBe(false);

		bakeScaleSelect.value = 'fit';
		bakeScaleSelect.dispatchEvent(new Event('change'));
		expect(bakeCustomSize.hidden).toBe(true);
	});
});
