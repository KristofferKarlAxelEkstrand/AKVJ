import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Fullscreen from '../src/js/utils/Fullscreen.js';

describe('Fullscreen', () => {
	let fullscreen;
	let addEventListenerSpy;
	let removeEventListenerSpy;

	beforeEach(() => {
		fullscreen = new Fullscreen();
		addEventListenerSpy = vi.spyOn(document, 'addEventListener');
		removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
	});

	afterEach(() => {
		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
	});

	test('setup registers keydown and dblclick listeners', () => {
		fullscreen.setup();

		expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		expect(addEventListenerSpy).toHaveBeenCalledWith('dblclick', expect.any(Function));
	});

	test('destroy removes keydown and dblclick listeners', () => {
		fullscreen.setup();
		fullscreen.destroy();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', expect.any(Function));
	});

	test('destroy is idempotent (calling twice does not throw)', () => {
		fullscreen.setup();
		fullscreen.destroy();

		expect(() => fullscreen.destroy()).not.toThrow();
	});

	test('keydown Enter calls preventDefault and toggles fullscreen', () => {
		fullscreen.setup();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const event = { key: 'Enter', repeat: false, preventDefault: vi.fn() };
		document.dispatchEvent(new KeyboardEvent('keydown', event));

		// Can't easily dispatch with preventDefault mock; test handler directly
		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: 'Enter', repeat: false, preventDefault: vi.fn() };
		handler(mockEvent);

		expect(mockEvent.preventDefault).toHaveBeenCalled();
		expect(requestFullscreenSpy).toHaveBeenCalled();

		delete document.documentElement.requestFullscreen;
	});

	test('keydown Space calls preventDefault and toggles fullscreen', () => {
		fullscreen.setup();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: ' ', repeat: false, preventDefault: vi.fn() };
		handler(mockEvent);

		expect(mockEvent.preventDefault).toHaveBeenCalled();
		expect(requestFullscreenSpy).toHaveBeenCalled();

		delete document.documentElement.requestFullscreen;
	});

	test('keydown with repeat=true does nothing', () => {
		fullscreen.setup();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: 'Enter', repeat: true, preventDefault: vi.fn() };
		handler(mockEvent);

		expect(mockEvent.preventDefault).not.toHaveBeenCalled();
		expect(requestFullscreenSpy).not.toHaveBeenCalled();

		delete document.documentElement.requestFullscreen;
	});

	test('keydown with unrelated key does nothing', () => {
		fullscreen.setup();

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: 'a', repeat: false, preventDefault: vi.fn() };
		handler(mockEvent);

		expect(mockEvent.preventDefault).not.toHaveBeenCalled();
	});

	test('toggle exits fullscreen when already fullscreen', () => {
		fullscreen.setup();

		const exitFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => document.documentElement
		});
		Object.defineProperty(document, 'exitFullscreen', {
			configurable: true,
			value: exitFullscreenSpy
		});

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: 'Enter', repeat: false, preventDefault: vi.fn() };
		handler(mockEvent);

		expect(exitFullscreenSpy).toHaveBeenCalled();

		delete document.exitFullscreen;
	});

	test('dblclick triggers toggle', () => {
		fullscreen.setup();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const dblclickHandler = addEventListenerSpy.mock.calls.find(c => c[0] === 'dblclick')[1];
		dblclickHandler();

		expect(requestFullscreenSpy).toHaveBeenCalled();

		delete document.documentElement.requestFullscreen;
	});
});
