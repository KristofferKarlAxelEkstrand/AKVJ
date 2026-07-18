/**
 * SimpleRouter — minimal vanilla JS client-side router using the History API.
 *
 * Supports static routes (e.g. `/library`, `/clip/edit`) and parameterized
 * routes (e.g. `/clip/edit/:clipId`). Exact matches take precedence over patterns.
 *
 * Handlers receive `(path, params)` where `params` is an object of named
 * dynamic segments (empty for static routes).
 *
 * @example
 * const router = new SimpleRouter();
 * router.add('/library', () => showView('library'));
 * router.add('/clip/edit', () => showNewEditor());
 * router.add('/clip/edit/:clipId', (_path, { clipId }) => openEditor(clipId));
 * router.start();
 */
export class SimpleRouter {
	/** @type {Map<string, Function>} */
	#exactRoutes = new Map();
	/** @type {Array<{ regex: RegExp, names: string[], handler: Function }>} */
	#paramRoutes = [];
	#notFoundHandler = null;
	#boundHandlePopState = null;

	/**
	 * Register a route handler.
	 * @param {string} path - URL path; use `:name` for a dynamic segment
	 * @param {Function} handler - Called as `handler(path, params)`
	 */
	add(path, handler) {
		if (path.includes(':')) {
			const names = [];
			const escaped = path
				.split('/')
				.map(segment => {
					if (segment.startsWith(':') && segment.length > 1) {
						names.push(segment.slice(1));
						return '([^/]+)';
					}
					return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				})
				.join('/');
			this.#paramRoutes.push({
				regex: new RegExp(`^${escaped}$`),
				names,
				handler
			});
			return;
		}
		this.#exactRoutes.set(path, handler);
	}

	/**
	 * Register a fallback handler for unmatched routes.
	 * @param {Function} handler - Called as `handler(path)`
	 */
	setNotFound(handler) {
		this.#notFoundHandler = handler;
	}

	/**
	 * Start listening to browser history events.
	 */
	start() {
		this.#boundHandlePopState = () => this.#handleRoute();
		window.addEventListener('popstate', this.#boundHandlePopState);
		this.#handleRoute();
	}

	/**
	 * Stop listening to browser history events.
	 */
	stop() {
		if (this.#boundHandlePopState) {
			window.removeEventListener('popstate', this.#boundHandlePopState);
			this.#boundHandlePopState = null;
		}
	}

	/**
	 * Navigate to a path. Pushes a new history entry and invokes the route handler.
	 * @param {string} path
	 */
	navigate(path) {
		window.history.pushState({}, '', path);
		this.#handleRoute();
	}

	/**
	 * Replace the current history entry without adding a new one.
	 * @param {string} path
	 * @param {{ invokeHandler?: boolean }} [options] - When `invokeHandler` is false, only update the URL
	 */
	replace(path, options = {}) {
		const { invokeHandler = true } = options;
		window.history.replaceState({}, '', path);
		if (invokeHandler) {
			this.#handleRoute();
		}
	}

	/**
	 * Get the current path from the URL.
	 * @returns {string}
	 */
	get currentPath() {
		return window.location.pathname;
	}

	#handleRoute() {
		const path = this.currentPath;
		const exactHandler = this.#exactRoutes.get(path);
		if (exactHandler) {
			exactHandler(path, {});
			return;
		}

		for (const route of this.#paramRoutes) {
			const match = route.regex.exec(path);
			if (!match) {
				continue;
			}
			/** @type {Record<string, string>} */
			const params = {};
			route.names.forEach((name, index) => {
				params[name] = decodeURIComponent(match[index + 1]);
			});
			route.handler(path, params);
			return;
		}

		if (this.#notFoundHandler) {
			this.#notFoundHandler(path);
		}
	}
}
