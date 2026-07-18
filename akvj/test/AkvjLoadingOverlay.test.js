// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import appState, { EVENT_PROJECT_LOAD_START, EVENT_PROJECT_LOAD_COMPLETE, EVENT_PROJECT_LOAD_ERROR } from '../src/js/core/AppState.js';
// Side-effect import registers <akvj-loading-overlay> for createElement.
import '../src/js/ui/AkvjLoadingOverlay.js';

describe('akvj-loading-overlay', () => {
	/** @type {HTMLElement} */
	let overlay;

	beforeEach(() => {
		appState.reset();
		for (const stale of document.querySelectorAll('akvj-loading-overlay')) {
			stale.remove();
		}
		// Use createElement so Vitest vmThreads' shared customElements registry
		// always yields the registered constructor (not a cross-realm `new`).
		overlay = document.createElement('akvj-loading-overlay');
		document.body.append(overlay);
	});

	afterEach(() => {
		overlay?.remove();
		appState.reset();
	});

	test('connectedCallback renders progress bar DOM', () => {
		expect(overlay.querySelector('.progress-bar')).not.toBeNull();
		expect(overlay.querySelector('.progress-fill')).not.toBeNull();
		expect(overlay.querySelector('.progress-bar').contains(overlay.querySelector('.progress-fill'))).toBe(true);
	});

	test('EVENT_PROJECT_LOAD_START shows overlay and resets fill width', () => {
		const fill = overlay.querySelector('.progress-fill');
		fill.style.width = '50%';

		appState.projectSwitching = true;

		expect(overlay.hasAttribute('visible')).toBe(true);
		expect(overlay.isVisible).toBe(true);
		expect(fill.style.width).toBe('0%');
	});

	test('EVENT_PROJECT_LOAD_COMPLETE hides overlay', () => {
		appState.projectSwitching = true;
		expect(overlay.isVisible).toBe(true);

		appState.dispatchProjectLoadComplete('default');

		expect(overlay.hasAttribute('visible')).toBe(false);
		expect(overlay.isVisible).toBe(false);
	});

	test('EVENT_PROJECT_LOAD_ERROR hides overlay', () => {
		appState.projectSwitching = true;
		expect(overlay.isVisible).toBe(true);

		appState.dispatchProjectLoadError('default', 'fail');

		expect(overlay.hasAttribute('visible')).toBe(false);
		expect(overlay.isVisible).toBe(false);
	});

	test('disconnectedCallback unsubscribes and clears DOM', () => {
		expect(overlay.querySelector('.progress-bar')).not.toBeNull();
		overlay.remove();

		expect(overlay.childNodes).toHaveLength(0);
		expect(overlay.querySelector('.progress-bar')).toBeNull();

		appState.projectSwitching = true;
		expect(overlay.hasAttribute('visible')).toBe(false);
		expect(overlay.isVisible).toBe(false);
	});

	test('subscribes to all three PROJECT_LOAD events on connect', () => {
		const subscribeSpy = vi.spyOn(appState, 'subscribe');
		const fresh = document.createElement('akvj-loading-overlay');
		document.body.append(fresh);

		const eventNames = subscribeSpy.mock.calls.map(call => call[0]);
		expect(eventNames).toEqual(expect.arrayContaining([EVENT_PROJECT_LOAD_START, EVENT_PROJECT_LOAD_COMPLETE, EVENT_PROJECT_LOAD_ERROR]));
		expect(eventNames.filter(name => name === EVENT_PROJECT_LOAD_START || name === EVENT_PROJECT_LOAD_COMPLETE || name === EVENT_PROJECT_LOAD_ERROR)).toHaveLength(3);

		fresh.remove();
		subscribeSpy.mockRestore();
	});
});
