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
		fullscreen.enable();

		expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		expect(addEventListenerSpy).toHaveBeenCalledWith('dblclick', expect.any(Function));
	});

	test('destroy removes keydown and dblclick listeners', () => {
		fullscreen.enable();
		fullscreen.destroy();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', expect.any(Function));
	});

	test('destroy is idempotent (calling twice does not throw)', () => {
		fullscreen.enable();
		fullscreen.destroy();

		expect(() => fullscreen.destroy()).not.toThrow();
	});

	test('keydown Enter calls preventDefault and toggles fullscreen', () => {
		fullscreen.enable();

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
		fullscreen.enable();

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
		fullscreen.enable();

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

	test('keydown Space skips when target is an INPUT checkbox', () => {
		fullscreen.enable();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		document.body.appendChild(checkbox);

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: ' ', repeat: false, preventDefault: vi.fn(), target: checkbox };
		handler(mockEvent);

		expect(mockEvent.preventDefault).not.toHaveBeenCalled();
		expect(requestFullscreenSpy).not.toHaveBeenCalled();

		checkbox.remove();
		delete document.documentElement.requestFullscreen;
	});

	test('keydown Enter skips when midi-settings-overlay is in the DOM', () => {
		fullscreen.enable();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const overlay = document.createElement('div');
		overlay.id = 'midi-settings-overlay';
		document.body.appendChild(overlay);

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: 'Enter', repeat: false, preventDefault: vi.fn(), target: document.body };
		handler(mockEvent);

		expect(mockEvent.preventDefault).not.toHaveBeenCalled();
		expect(requestFullscreenSpy).not.toHaveBeenCalled();

		overlay.remove();
		delete document.documentElement.requestFullscreen;
	});

	test('keydown Space skips when debug-overlay has visible class', () => {
		fullscreen.enable();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const debugOverlay = document.createElement('div');
		debugOverlay.id = 'debug-overlay';
		debugOverlay.classList.add('visible');
		document.body.appendChild(debugOverlay);

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: ' ', repeat: false, preventDefault: vi.fn(), target: document.body };
		handler(mockEvent);

		expect(mockEvent.preventDefault).not.toHaveBeenCalled();
		expect(requestFullscreenSpy).not.toHaveBeenCalled();

		debugOverlay.remove();
		delete document.documentElement.requestFullscreen;
	});

	test('keydown Enter skips for contenteditable and role=button targets', () => {
		fullscreen.enable();

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

		const editable = document.createElement('div');
		editable.setAttribute('contenteditable', 'true');
		document.body.appendChild(editable);
		const editableEvent = { key: 'Enter', repeat: false, preventDefault: vi.fn(), target: editable };
		handler(editableEvent);
		expect(editableEvent.preventDefault).not.toHaveBeenCalled();
		editable.remove();

		const buttonRole = document.createElement('div');
		buttonRole.setAttribute('role', 'button');
		document.body.appendChild(buttonRole);
		const roleEvent = { key: 'Enter', repeat: false, preventDefault: vi.fn(), target: buttonRole };
		handler(roleEvent);
		expect(roleEvent.preventDefault).not.toHaveBeenCalled();
		expect(requestFullscreenSpy).not.toHaveBeenCalled();
		buttonRole.remove();

		delete document.documentElement.requestFullscreen;
	});

	test('keydown with unrelated key does nothing', () => {
		fullscreen.enable();

		const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'keydown')[1];
		const mockEvent = { key: 'a', repeat: false, preventDefault: vi.fn() };
		handler(mockEvent);

		expect(mockEvent.preventDefault).not.toHaveBeenCalled();
	});

	test('toggle exits fullscreen when already fullscreen', () => {
		fullscreen.enable();

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
		fullscreen.enable();

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
		dblclickHandler({ target: document.body });

		expect(requestFullscreenSpy).toHaveBeenCalled();

		delete document.documentElement.requestFullscreen;
	});

	test('dblclick skips when midi-settings-overlay is in the DOM', () => {
		fullscreen.enable();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const overlay = document.createElement('div');
		overlay.id = 'midi-settings-overlay';
		document.body.appendChild(overlay);

		const dblclickHandler = addEventListenerSpy.mock.calls.find(c => c[0] === 'dblclick')[1];
		dblclickHandler({ target: document.body });

		expect(requestFullscreenSpy).not.toHaveBeenCalled();

		overlay.remove();
		delete document.documentElement.requestFullscreen;
	});

	test('dblclick skips when debug-overlay has visible class', () => {
		fullscreen.enable();

		const requestFullscreenSpy = vi.fn().mockReturnValue({ catch: vi.fn() });
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => null
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenSpy
		});

		const debugOverlay = document.createElement('div');
		debugOverlay.id = 'debug-overlay';
		debugOverlay.classList.add('visible');
		document.body.appendChild(debugOverlay);

		const dblclickHandler = addEventListenerSpy.mock.calls.find(c => c[0] === 'dblclick')[1];
		dblclickHandler({ target: document.body });

		expect(requestFullscreenSpy).not.toHaveBeenCalled();

		debugOverlay.remove();
		delete document.documentElement.requestFullscreen;
	});
});
