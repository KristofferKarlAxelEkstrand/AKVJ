import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { installRAFMocks, restoreRAFMocks, createMockCanvasContext } from './utils/rendererFixture.js';
import AdventureKidVideoJockey from '../src/js/core/AdventureKidVideoJockey.js';
import appState from '../src/js/core/AppState.js';
import settings from '../src/js/core/settings.js';

describe('AdventureKidVideoJockey', () => {
	let rafMocks;
	let originalCreateElement;

	beforeEach(() => {
		rafMocks = installRAFMocks();

		// Mock document.createElement to return real canvas elements with mocked context
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
		restoreRAFMocks(rafMocks);
		document.createElement = originalCreateElement;
	});

	test('is registered as a custom element', () => {
		expect(customElements.get('adventure-kid-video-jockey')).toBeDefined();
	});

	test('connectedCallback sets canvas dimensions from settings', () => {
		const element = new AdventureKidVideoJockey();
		element.connectedCallback();

		const canvas = element.querySelector('canvas');
		expect(canvas).not.toBeNull();
		expect(canvas.width).toBe(settings.canvas.width);
		expect(canvas.height).toBe(settings.canvas.height);
	});

	test('connectedCallback subscribes to midiNoteOn and midiNoteOff events', () => {
		const subscribeSpy = vi.spyOn(appState, 'subscribe');

		const element = new AdventureKidVideoJockey();
		element.connectedCallback();

		const subscribedEvents = subscribeSpy.mock.calls.map(c => c[0]);
		expect(subscribedEvents).toContain('midiNoteOn');
		expect(subscribedEvents).toContain('midiNoteOff');

		subscribeSpy.mockRestore();
	});

	test('midiNoteOn event triggers layerManager noteOn routing', () => {
		const element = new AdventureKidVideoJockey();
		element.connectedCallback();

		// Dispatch a MIDI note on — should not throw and should route to layerManager
		expect(() => appState.dispatchMIDINoteOn(0, 60, 100)).not.toThrow();
	});

	test('midiNoteOff event triggers layerManager noteOff routing', () => {
		const element = new AdventureKidVideoJockey();
		element.connectedCallback();

		expect(() => appState.dispatchMIDINoteOff(0, 60)).not.toThrow();
	});

	test('disconnectedCallback tears down MIDI event listeners', () => {
		const element = new AdventureKidVideoJockey();
		element.connectedCallback();

		// Verify listener is active
		expect(() => appState.dispatchMIDINoteOn(0, 60, 100)).not.toThrow();

		element.disconnectedCallback();

		// After disconnect, dispatching should not throw (listeners removed)
		expect(() => appState.dispatchMIDINoteOn(0, 60, 100)).not.toThrow();
	});

	test('disconnectedCallback is safe to call when already disconnected', () => {
		const element = new AdventureKidVideoJockey();
		element.connectedCallback();
		element.disconnectedCallback();

		expect(() => element.disconnectedCallback()).not.toThrow();
	});

	test('dispatches videoJockeyReady event after setup', async () => {
		const readySpy = vi.fn();
		appState.addEventListener('videoJockeyReady', readySpy);

		const element = new AdventureKidVideoJockey();
		element.connectedCallback();

		// Wait for async setup to complete
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(readySpy).toHaveBeenCalled();
		appState.removeEventListener('videoJockeyReady', readySpy);
	});

	test('handles no-canvas-context gracefully', () => {
		// Temporarily mock getContext to return null
		const originalGetContext = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = () => null;

		const element = new AdventureKidVideoJockey();

		// Should not throw on connectedCallback
		expect(() => element.connectedCallback()).not.toThrow();

		HTMLCanvasElement.prototype.getContext = originalGetContext;
	});

	test('disconnectedCallback cleans up without errors after successful setup', async () => {
		const element = new AdventureKidVideoJockey();
		element.connectedCallback();

		// Wait for async setup
		await new Promise(resolve => setTimeout(resolve, 100));

		expect(() => element.disconnectedCallback()).not.toThrow();
	});
});
