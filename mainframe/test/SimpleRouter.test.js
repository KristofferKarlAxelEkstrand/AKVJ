// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimpleRouter } from '../src/js/SimpleRouter.js';

describe('SimpleRouter', () => {
	/** @type {SimpleRouter} */
	let router;

	beforeEach(() => {
		router = new SimpleRouter();
	});

	afterEach(() => {
		router.stop();
		window.history.replaceState({}, '', '/');
	});

	test('add registers a route handler', () => {
		const handler = vi.fn();
		router.add('/library', handler);
		router.start();
		expect(handler).not.toHaveBeenCalled();
	});

	test('start invokes handler for current path', () => {
		window.history.replaceState({}, '', '/library');
		const handler = vi.fn();
		router.add('/library', handler);
		router.start();
		expect(handler).toHaveBeenCalledWith('/library', {});
	});

	test('navigate pushes history and invokes handler', () => {
		window.history.replaceState({}, '', '/');
		const libraryHandler = vi.fn();
		router.add('/library', libraryHandler);
		router.start();

		router.navigate('/library');
		expect(libraryHandler).toHaveBeenCalledWith('/library', {});
		expect(window.location.pathname).toBe('/library');
	});

	test('navigate to unregistered route calls notFound handler', () => {
		window.history.replaceState({}, '', '/');
		const notFound = vi.fn();
		router.setNotFound(notFound);
		router.start();

		router.navigate('/nonexistent');
		expect(notFound).toHaveBeenCalledWith('/nonexistent');
	});

	test('popstate triggers route handler', () => {
		window.history.replaceState({}, '', '/');
		const libraryHandler = vi.fn();
		router.add('/library', libraryHandler);
		router.start();

		router.navigate('/library');
		libraryHandler.mockClear();

		window.history.back();
		// popstate is async in jsdom — simulate it
		window.dispatchEvent(new PopStateEvent('popstate'));
	});

	test('replace updates URL without adding history entry', () => {
		window.history.replaceState({}, '', '/library');
		const mappingHandler = vi.fn();
		router.add('/key-map', mappingHandler);
		router.start();

		router.replace('/key-map');
		expect(window.location.pathname).toBe('/key-map');
		expect(mappingHandler).toHaveBeenCalledWith('/key-map', {});
	});

	test('parameterized route matches and passes params', () => {
		window.history.replaceState({}, '', '/clip/edit/neon-skull');
		const handler = vi.fn();
		router.add('/clip/edit/:clipId', handler);
		router.start();
		expect(handler).toHaveBeenCalledWith('/clip/edit/neon-skull', { clipId: 'neon-skull' });
	});

	test('exact route takes precedence over parameterized route', () => {
		const exactHandler = vi.fn();
		const paramHandler = vi.fn();
		router.add('/clip/edit', exactHandler);
		router.add('/clip/edit/:clipId', paramHandler);
		router.start();

		router.navigate('/clip/edit');
		expect(exactHandler).toHaveBeenCalledWith('/clip/edit', {});
		expect(paramHandler).not.toHaveBeenCalled();

		exactHandler.mockClear();
		router.navigate('/clip/edit/my-clip');
		expect(paramHandler).toHaveBeenCalledWith('/clip/edit/my-clip', { clipId: 'my-clip' });
		expect(exactHandler).not.toHaveBeenCalled();
	});

	test('decodes URI components in params', () => {
		const handler = vi.fn();
		router.add('/clip/edit/:clipId', handler);
		router.start();
		router.navigate('/clip/edit/hello%20world');
		expect(handler).toHaveBeenCalledWith('/clip/edit/hello%20world', { clipId: 'hello world' });
	});

	test('replace can update URL without invoking handler', () => {
		const handler = vi.fn();
		router.add('/clip/edit/:clipId', handler);
		router.start();
		handler.mockClear();

		router.replace('/clip/edit/created-clip', { invokeHandler: false });
		expect(window.location.pathname).toBe('/clip/edit/created-clip');
		expect(handler).not.toHaveBeenCalled();
	});

	test('legacy /clip/new/:clipId style paths can be matched as parameterized routes', () => {
		const handler = vi.fn();
		router.add('/clip/new/:clipId', handler);
		router.start();
		router.navigate('/clip/new/neon-skull');
		expect(handler).toHaveBeenCalledWith('/clip/new/neon-skull', { clipId: 'neon-skull' });
	});

	test('currentPath returns location.pathname', () => {
		window.history.replaceState({}, '', '/clip/edit');
		expect(router.currentPath).toBe('/clip/edit');
	});

	test('stop removes popstate listener', () => {
		window.history.replaceState({}, '', '/library');
		const handler = vi.fn();
		router.add('/library', handler);
		router.start();
		expect(handler).toHaveBeenCalledTimes(1);

		router.stop();

		// After stop, popstate should not trigger handler again
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	test('multiple routes work independently', () => {
		const libraryHandler = vi.fn();
		const uploadHandler = vi.fn();
		const mappingHandler = vi.fn();

		router.add('/library', libraryHandler);
		router.add('/clip/edit', uploadHandler);
		router.add('/key-map', mappingHandler);
		router.start();

		router.navigate('/clip/edit');
		expect(uploadHandler).toHaveBeenCalledWith('/clip/edit', {});
		expect(libraryHandler).not.toHaveBeenCalled();
		expect(mappingHandler).not.toHaveBeenCalled();

		router.navigate('/key-map');
		expect(mappingHandler).toHaveBeenCalledWith('/key-map', {});
	});
});
