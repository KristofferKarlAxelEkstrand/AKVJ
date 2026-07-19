import '../scss/ClipList.scss';
import { ClipCategory } from './ClipCategory.js';
import { ClipInstance } from './ClipInstance.js';

/**
 * ClipList — custom element encapsulating the clip library list.
 * Renders clip items with thumbnails, metadata, and action buttons.
 * Dispatches `clipedit`, `clipdelete`, `clipmap` events (bubbles: true)
 * with `{ detail: { clipId } }` for the parent to handle.
 *
 * @fires ClipList#clipedit - CustomEvent with `{ detail: { clipId, clip } }`
 * @fires ClipList#clipdelete - CustomEvent with `{ detail: { clipId } }`
 * @fires ClipList#clipmap - CustomEvent with `{ detail: { clipId } }`
 */
class ClipList extends HTMLElement {
	/** @type {Array<{clipId: string, meta: object, hasSprite: boolean, pipelineReady: boolean}>} */
	#loadedClips = [];
	#searchQuery = '';
	#roleFilter = '';
	#sortMode = 'name';
	#showMapAction = true;

	/**
	 * @param {Array<{clipId: string, meta: object, hasSprite: boolean, pipelineReady: boolean}>} clips
	 */
	set clips(clips) {
		this.#loadedClips = clips;
		this.#render();
	}

	get clips() {
		return this.#loadedClips;
	}

	/**
	 * @param {boolean} show - Whether to show the Map action button on child ClipInstances (default: true)
	 */
	set showMapAction(show) {
		this.#showMapAction = show;
		this.#render();
	}

	get showMapAction() {
		return this.#showMapAction;
	}

	/**
	 * @param {string} query
	 */
	set searchQuery(query) {
		this.#searchQuery = query;
		this.#render();
	}

	get searchQuery() {
		return this.#searchQuery;
	}

	/**
	 * @param {string} filter
	 */
	set roleFilter(filter) {
		this.#roleFilter = filter;
		this.#render();
	}

	get roleFilter() {
		return this.#roleFilter;
	}

	/**
	 * @param {string} mode
	 */
	set sortMode(mode) {
		this.#sortMode = mode;
		this.#render();
	}

	get sortMode() {
		return this.#sortMode;
	}

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	#render() {
		this.replaceChildren();

		if (this.#loadedClips.length === 0) {
			const empty = document.createElement('li');
			empty.textContent = 'No clips in the bucket yet.';
			this.append(empty);
			return;
		}

		const filteredClips = this.#filterClips();
		if (filteredClips.length === 0) {
			const noMatch = document.createElement('li');
			noMatch.textContent = `No clips match "${this.#searchQuery}".`;
			this.append(noMatch);
			return;
		}

		const grouped = this.#groupByCategory(filteredClips);
		for (const [categoryName, clips] of grouped) {
			const categoryElement = new ClipCategory();
			categoryElement.categoryName = categoryName;
			for (const clip of clips) {
				const instance = new ClipInstance();
				instance.clip = clip;
				instance.showMapAction = this.#showMapAction;
				categoryElement.append(instance);
			}
			this.append(categoryElement);
		}
	}

	/**
	 * Group clips by category, preserving sort order within each group.
	 * @param {Array} clips
	 * @returns {Map<string, Array>}
	 */
	#groupByCategory(clips) {
		const grouped = new Map();
		for (const clip of clips) {
			const categoryName = clip.meta.category || 'uncategorized';
			if (!grouped.has(categoryName)) {
				grouped.set(categoryName, []);
			}
			grouped.get(categoryName).push(clip);
		}
		return grouped;
	}

	#filterClips() {
		const filtered = this.#loadedClips.filter(clip => {
			const clipRole = clip.meta.role || 'clip';
			if (this.#roleFilter && clipRole !== this.#roleFilter) {
				return false;
			}
			if (!this.#searchQuery) {
				return true;
			}
			const clipIdMatch = clip.clipId.toLowerCase().includes(this.#searchQuery);
			const roleMatch = clipRole.toLowerCase().includes(this.#searchQuery);
			const nameMatch = (clip.meta.name || '').toLowerCase().includes(this.#searchQuery);
			return clipIdMatch || roleMatch || nameMatch;
		});

		filtered.sort((clipA, clipB) => {
			switch (this.#sortMode) {
				case 'clipId':
					return clipA.clipId.localeCompare(clipB.clipId);
				case 'role':
					return (clipA.meta.role || '').localeCompare(clipB.meta.role || '');
				case 'frames':
					return (clipA.meta.frames ?? clipA.meta.numberOfFrames ?? 0) - (clipB.meta.frames ?? clipB.meta.numberOfFrames ?? 0);
				case 'name':
				default:
					return (clipA.meta.name || clipA.clipId).localeCompare(clipB.meta.name || clipB.clipId);
			}
		});

		return filtered;
	}
}

customElements.define('akvj-clip-list', ClipList);

export default ClipList;
