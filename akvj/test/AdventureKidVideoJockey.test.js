import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { installRAFMocks, restoreRAFMocks, createMockCanvasContext } from './utils/rendererFixture.js';
import { waitForEvent } from './utils/waitForEvent.js';
import AdventureKidVideoJockey from '../src/js/core/AdventureKidVideoJockey.js';
import appState, { EVENT_PROJECT_SWITCH_REQUESTED, EVENT_PROJECT_LOAD_COMPLETE, EVENT_PROJECT_LOAD_ERROR, EVENT_CLIP_LOAD_ERROR, EVENT_MIDI_CONTROL_CHANGE, EVENT_VIDEO_JOCKEY_READY } from '../src/js/core/AppState.js';
import settings from '../src/js/core/settings.js';
import ClipLoader from '../src/js/visuals/ClipLoader.js';
import LayerManager from '../src/js/visuals/LayerManager.js';
import Renderer from '../src/js/visuals/Renderer.js';

// Captured before any spy replaces it, so a test can opt back into the real
// teardown behaviour while the suite-wide mock stays a no-op.
const realDestroyClips = ClipLoader.prototype.destroyClips;

describe('AdventureKidVideoJockey', () => {
	let rafMocks;
	let originalCreateElement;
	/** @type {import('vitest').MockInstance[]} */
	let spies;

	beforeEach(() => {
		rafMocks = installRAFMocks();
		appState.reset();
		spies = [];

		spies.push(vi.spyOn(ClipLoader.prototype, 'loadClips').mockResolvedValue({}));
		spies.push(vi.spyOn(ClipLoader.prototype, 'fetchActiveProjectId').mockResolvedValue(null));
		spies.push(vi.spyOn(ClipLoader.prototype, 'loadClipsFromProject').mockResolvedValue({ 'new-clip': {} }));
		spies.push(vi.spyOn(ClipLoader.prototype, 'fetchProjectsIndex').mockResolvedValue([{ id: 'proj-a' }, { id: 'proj-b' }]));
		spies.push(vi.spyOn(ClipLoader.prototype, 'destroyClips').mockImplementation(() => {}));
		spies.push(vi.spyOn(console, 'error').mockImplementation(() => {}));
		spies.push(vi.spyOn(console, 'warn').mockImplementation(() => {}));

		originalCreateElement = document.createElement.bind(document);
		document.createElement = tagName => {
			if (tagName === 'canvas') {
				const canvas = originalCreateElement('canvas');
				const mockCtx = createMockCanvasContext();
				canvas.getContext = () => mockCtx;
				canvas.width = 0;
				canvas.height = 0;
				return canvas;
			}
			return originalCreateElement(tagName);
		};
	});

	afterEach(() => {
		// Tear down any hosts left connected after a failed assertion so MIDI /
		// project-switch listeners cannot leak into the next test.
		for (const host of document.querySelectorAll('adventure-kid-video-jockey')) {
			host.disconnectedCallback?.();
			host.remove();
		}
		restoreRAFMocks(rafMocks);
		document.createElement = originalCreateElement;
		for (const spy of spies) {
			spy.mockRestore();
		}
		appState.reset();
	});

	/**
	 * @returns {Promise<AdventureKidVideoJockey>}
	 */
	async function connectReadyElement() {
		const element = new AdventureKidVideoJockey();
		const ready = waitForEvent(appState, EVENT_VIDEO_JOCKEY_READY);
		// Append so connectedCallback runs and afterEach can find/tear down the host.
		document.body.append(element);
		await ready;
		return element;
	}

	test('is registered as a custom element', () => {
		expect(customElements.get('adventure-kid-video-jockey')).toBeDefined();
	});

	test('connectedCallback sets canvas dimensions from settings', async () => {
		const element = await connectReadyElement();

		const canvas = element.querySelector('canvas');
		expect(canvas).not.toBeNull();
		expect(canvas.width).toBe(settings.canvas.width);
		expect(canvas.height).toBe(settings.canvas.height);
		element.disconnectedCallback();
	});

	test('connectedCallback subscribes to midi and project-switch-requested events', async () => {
		const subscribeSpy = vi.spyOn(appState, 'subscribe');
		const element = await connectReadyElement();

		const subscribedEvents = subscribeSpy.mock.calls.map(c => c[0]);
		expect(subscribedEvents).toContain('midiNoteOn');
		expect(subscribedEvents).toContain('midiNoteOff');
		expect(subscribedEvents).toContain(EVENT_MIDI_CONTROL_CHANGE);
		expect(subscribedEvents).toContain(EVENT_PROJECT_SWITCH_REQUESTED);

		subscribeSpy.mockRestore();
		element.disconnectedCallback();
	});

	test('midiNoteOn event triggers layerManager noteOn routing', async () => {
		const noteOnSpy = vi.spyOn(LayerManager.prototype, 'noteOn');
		const element = await connectReadyElement();

		appState.dispatchMIDINoteOn(0, 60, 100);
		expect(noteOnSpy).toHaveBeenCalledWith(0, 60, 100);

		noteOnSpy.mockRestore();
		element.disconnectedCallback();
	});

	test('midiNoteOff event triggers layerManager noteOff routing', async () => {
		const noteOffSpy = vi.spyOn(LayerManager.prototype, 'noteOff');
		const element = await connectReadyElement();

		appState.dispatchMIDINoteOff(0, 60);
		expect(noteOffSpy).toHaveBeenCalledWith(0, 60);

		noteOffSpy.mockRestore();
		element.disconnectedCallback();
	});

	test('handleControlChange routing: CC events reach layerManager', async () => {
		const ccSpy = vi.spyOn(LayerManager.prototype, 'handleControlChange');
		const element = await connectReadyElement();

		appState.dispatchMIDIControlChange(2, 10, 64);
		expect(ccSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: { channel: 2, controller: 10, value: 64 }
			})
		);

		ccSpy.mockRestore();
		element.disconnectedCallback();
	});

	test('disconnectedCallback tears down MIDI event listeners', async () => {
		const noteOnSpy = vi.spyOn(LayerManager.prototype, 'noteOn');
		const element = await connectReadyElement();

		appState.dispatchMIDINoteOn(0, 60, 100);
		expect(noteOnSpy).toHaveBeenCalledTimes(1);

		element.disconnectedCallback();
		noteOnSpy.mockClear();
		appState.dispatchMIDINoteOn(0, 61, 100);
		expect(noteOnSpy).not.toHaveBeenCalled();

		noteOnSpy.mockRestore();
	});

	test('disconnectedCallback is safe to call when already disconnected', async () => {
		const element = await connectReadyElement();
		element.disconnectedCallback();
		expect(() => element.disconnectedCallback()).not.toThrow();
	});

	test('dispatches videoJockeyReady event after setup', async () => {
		const element = new AdventureKidVideoJockey();
		const ready = waitForEvent(appState, EVENT_VIDEO_JOCKEY_READY);
		element.connectedCallback();
		await ready;
		element.disconnectedCallback();
	});

	test('handles no-canvas-context gracefully', async () => {
		const originalGetContext = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = () => null;

		const element = new AdventureKidVideoJockey();
		const ready = waitForEvent(appState, EVENT_VIDEO_JOCKEY_READY);
		expect(() => element.connectedCallback()).not.toThrow();
		await ready;

		HTMLCanvasElement.prototype.getContext = originalGetContext;
		element.disconnectedCallback();
	});

	test('disconnectedCallback cleans up without errors after successful setup', async () => {
		const element = await connectReadyElement();
		expect(() => element.disconnectedCallback()).not.toThrow();
	});

	test('loadClips error path: dispatches clipLoadError and sets clipsLoaded false', async () => {
		ClipLoader.prototype.loadClips.mockRejectedValueOnce(new Error('network down'));

		const errorPromise = waitForEvent(appState, EVENT_CLIP_LOAD_ERROR);
		const element = new AdventureKidVideoJockey();
		const ready = waitForEvent(appState, EVENT_VIDEO_JOCKEY_READY);
		element.connectedCallback();

		const errorEvent = await errorPromise;
		await ready;

		expect(appState.clipsLoaded).toBe(false);
		expect(errorEvent.detail.url).toBe(settings.performance.clipsJsonUrl);
		expect(errorEvent.detail.error).toBe('network down');

		element.disconnectedCallback();
	});

	describe('project switching', () => {
		test('handleProjectSwitch with { projectId } loads clips and completes', async () => {
			const element = await connectReadyElement();
			const freezeSpy = vi.spyOn(Renderer.prototype, 'freeze');
			const unfreezeSpy = vi.spyOn(Renderer.prototype, 'unfreeze');
			const setClipsSpy = vi.spyOn(LayerManager.prototype, 'setClips');
			const complete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);

			appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'proj-b' } }));
			const event = await complete;

			expect(event.detail.projectId).toBe('proj-b');
			expect(ClipLoader.prototype.loadClipsFromProject).toHaveBeenCalledWith('proj-b');
			expect(freezeSpy).toHaveBeenCalled();
			expect(unfreezeSpy).toHaveBeenCalled();
			expect(setClipsSpy).toHaveBeenCalled();
			expect(appState.activeProjectId).toBe('proj-b');
			expect(appState.projectSwitching).toBe(false);

			freezeSpy.mockRestore();
			unfreezeSpy.mockRestore();
			setClipsSpy.mockRestore();
			element.disconnectedCallback();
		});

		test('switchProject clears active clips, mask, and effects before installing new catalog', async () => {
			const mockClipA = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), destroy: vi.fn(), isFinished: false };
			const mockMask = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), destroy: vi.fn(), bitDepth: 1, isFinished: false };
			// Boot-time catalog, so the component holds a real prior catalog to destroy.
			const priorCatalog = {
				0: { 60: { 0: mockClipA } },
				[settings.channelMapping.mixer]: { 60: { 0: mockMask } }
			};

			let layerManager;
			const originalSetClips = LayerManager.prototype.setClips;
			const setClipsSpy = vi.spyOn(LayerManager.prototype, 'setClips').mockImplementation(function (clips) {
				layerManager = this;
				return originalSetClips.call(this, clips);
			});
			const clearClipsSpy = vi.spyOn(LayerManager.prototype, 'clearClips');
			const destroySpy = ClipLoader.prototype.destroyClips;
			destroySpy.mockImplementation(realDestroyClips);
			ClipLoader.prototype.loadClips.mockResolvedValueOnce(priorCatalog);
			const element = await connectReadyElement();

			try {
				expect(layerManager).toBeDefined();

				layerManager.noteOn(0, 60, 100);
				layerManager.noteOn(settings.channelMapping.mixer, 60, 127);
				layerManager.noteOn(settings.channelMapping.mixedOutputEffects, 0, 127);
				layerManager.noteOn(settings.channelMapping.globalEffects, 0, 127);

				expect(layerManager.getLayerGroupA().getActiveClips()).toContain(mockClipA);
				expect(layerManager.getMaskManager().getCurrentMask()).toBe(mockMask);
				expect(layerManager.getEffectsManager().hasMixedOutputEffects()).toBe(true);
				expect(layerManager.getEffectsManager().hasGlobalEffects()).toBe(true);

				clearClipsSpy.mockClear();
				destroySpy.mockClear();

				const complete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);
				appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'proj-b' } }));
				await complete;

				expect(clearClipsSpy).toHaveBeenCalled();
				expect(destroySpy).toHaveBeenCalledWith(priorCatalog);
				expect(mockClipA.destroy).toHaveBeenCalled();
				expect(mockMask.destroy).toHaveBeenCalled();
				expect(clearClipsSpy.mock.invocationCallOrder[0]).toBeLessThan(destroySpy.mock.invocationCallOrder[0]);

				expect(layerManager.getLayerGroupA().getActiveClips()).toEqual([]);
				expect(layerManager.getLayerGroupB().getActiveClips()).toEqual([]);
				expect(layerManager.getLayerGroupC().getActiveClips()).toEqual([]);
				expect(layerManager.getMaskManager().getCurrentMask()).toBeNull();
				expect(layerManager.getEffectsManager().hasMixedOutputEffects()).toBe(false);
				expect(layerManager.getEffectsManager().hasGlobalEffects()).toBe(false);
			} finally {
				setClipsSpy.mockRestore();
				clearClipsSpy.mockRestore();
				element.disconnectedCallback();
			}
		});

		test('MIDI note on/off and CC are ignored while a project switch is in flight', async () => {
			const element = await connectReadyElement();
			const noteOnSpy = vi.spyOn(LayerManager.prototype, 'noteOn');
			const noteOffSpy = vi.spyOn(LayerManager.prototype, 'noteOff');
			const ccSpy = vi.spyOn(LayerManager.prototype, 'handleControlChange');

			let resolveLoad;
			ClipLoader.prototype.loadClipsFromProject.mockImplementationOnce(
				() =>
					new Promise(resolve => {
						resolveLoad = resolve;
					})
			);

			try {
				appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'proj-a' } }));
				await vi.waitFor(() => {
					expect(appState.projectSwitching).toBe(true);
				});

				noteOnSpy.mockClear();
				noteOffSpy.mockClear();
				ccSpy.mockClear();

				appState.dispatchMIDINoteOn(0, 60, 100);
				appState.dispatchMIDINoteOff(0, 60);
				appState.dispatchMIDIControlChange(0, 16, 64);

				expect(noteOnSpy).not.toHaveBeenCalled();
				expect(noteOffSpy).not.toHaveBeenCalled();
				expect(ccSpy).not.toHaveBeenCalled();

				const complete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);
				resolveLoad({ 'clip-a': {} });
				await complete;

				expect(appState.projectSwitching).toBe(false);
				appState.dispatchMIDINoteOn(0, 61, 100);
				expect(noteOnSpy).toHaveBeenCalledWith(0, 61, 100);
			} finally {
				if (appState.projectSwitching && typeof resolveLoad === 'function') {
					resolveLoad({});
					await Promise.resolve();
				}
				noteOnSpy.mockRestore();
				noteOffSpy.mockRestore();
				ccSpy.mockRestore();
				element.disconnectedCallback();
			}
		});

		test('handleProjectSwitch with { note } resolves from projects index then switches', async () => {
			const element = await connectReadyElement();
			const complete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);

			appState.dispatchProjectSelection(1);
			const event = await complete;

			expect(ClipLoader.prototype.fetchProjectsIndex).toHaveBeenCalled();
			expect(ClipLoader.prototype.loadClipsFromProject).toHaveBeenCalledWith('proj-b');
			expect(event.detail.projectId).toBe('proj-b');

			element.disconnectedCallback();
		});

		test('resolveProjectIdFromNote refetches index so new projects appear without reload', async () => {
			const element = await connectReadyElement();
			ClipLoader.prototype.fetchProjectsIndex.mockResolvedValueOnce([{ id: 'proj-a' }]);
			ClipLoader.prototype.loadClipsFromProject.mockClear();

			const firstComplete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);
			appState.dispatchProjectSelection(0);
			await firstComplete;
			expect(ClipLoader.prototype.loadClipsFromProject).toHaveBeenCalledWith('proj-a');

			ClipLoader.prototype.fetchProjectsIndex.mockResolvedValueOnce([{ id: 'proj-a' }, { id: 'proj-b' }]);
			ClipLoader.prototype.loadClipsFromProject.mockClear();

			const secondComplete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);
			appState.dispatchProjectSelection(1);
			const event = await secondComplete;

			expect(ClipLoader.prototype.fetchProjectsIndex).toHaveBeenCalledTimes(2);
			expect(ClipLoader.prototype.loadClipsFromProject).toHaveBeenCalledWith('proj-b');
			expect(event.detail.projectId).toBe('proj-b');

			element.disconnectedCallback();
		});

		test('handleProjectSwitch when already switching is a no-op', async () => {
			const element = await connectReadyElement();

			let resolveLoad;
			ClipLoader.prototype.loadClipsFromProject.mockReturnValueOnce(
				new Promise(resolve => {
					resolveLoad = resolve;
				})
			);

			appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'proj-a' } }));
			// Second request while first is in flight
			appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'proj-b' } }));

			await Promise.resolve();
			expect(ClipLoader.prototype.loadClipsFromProject).toHaveBeenCalledTimes(1);
			expect(ClipLoader.prototype.loadClipsFromProject).toHaveBeenCalledWith('proj-a');

			const complete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);
			resolveLoad({ 'clip-a': {} });
			await complete;

			element.disconnectedCallback();
		});

		test('handleProjectSwitch when projectId equals current is a no-op', async () => {
			const element = await connectReadyElement();
			const complete = waitForEvent(appState, EVENT_PROJECT_LOAD_COMPLETE);
			appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'proj-a' } }));
			await complete;

			ClipLoader.prototype.loadClipsFromProject.mockClear();
			appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'proj-a' } }));
			await Promise.resolve();
			expect(ClipLoader.prototype.loadClipsFromProject).not.toHaveBeenCalled();

			element.disconnectedCallback();
		});

		test('handleProjectSwitch when resolved projectId is null is a no-op', async () => {
			const element = await connectReadyElement();
			ClipLoader.prototype.fetchProjectsIndex.mockResolvedValueOnce([]);
			ClipLoader.prototype.loadClipsFromProject.mockClear();

			appState.dispatchProjectSelection(99);
			await Promise.resolve();
			await Promise.resolve();

			expect(ClipLoader.prototype.loadClipsFromProject).not.toHaveBeenCalled();
			element.disconnectedCallback();
		});

		test('resolveProjectIdFromNote returns null on fetch failure', async () => {
			const element = await connectReadyElement();
			ClipLoader.prototype.fetchProjectsIndex.mockRejectedValueOnce(new Error('index missing'));
			ClipLoader.prototype.loadClipsFromProject.mockClear();

			appState.dispatchProjectSelection(0);
			await Promise.resolve();
			await Promise.resolve();

			expect(ClipLoader.prototype.loadClipsFromProject).not.toHaveBeenCalled();
			element.disconnectedCallback();
		});

		test('switchProject error path: unfreezes, dispatches projectLoadError, shows user message', async () => {
			const element = await connectReadyElement();
			const unfreezeSpy = vi.spyOn(Renderer.prototype, 'unfreeze');
			ClipLoader.prototype.loadClipsFromProject.mockRejectedValueOnce(new Error('load failed'));

			const errorPromise = waitForEvent(appState, EVENT_PROJECT_LOAD_ERROR);
			const messagePromise = waitForEvent(appState, 'userMessage');

			appState.dispatchEvent(new CustomEvent(EVENT_PROJECT_SWITCH_REQUESTED, { detail: { projectId: 'bad-proj' } }));

			const errorEvent = await errorPromise;
			const messageEvent = await messagePromise;

			expect(errorEvent.detail).toEqual({ projectId: 'bad-proj', errorMessage: 'load failed' });
			expect(messageEvent.detail.type).toBe('error');
			expect(messageEvent.detail.text).toContain('bad-proj');
			expect(unfreezeSpy).toHaveBeenCalled();
			expect(appState.projectSwitching).toBe(false);

			unfreezeSpy.mockRestore();
			element.disconnectedCallback();
		});
	});
});
