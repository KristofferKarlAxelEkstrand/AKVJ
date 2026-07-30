import '../scss/ClipList.scss';
import { ClipCategory } from './ClipCategory.js';
import { ClipInstance } from './ClipInstance.js';
import { resolveTriggerType } from './clipSchema.js';
import { SORT_MODE, DEFAULT_SORT_MODE } from './sortMode.js';
import { DEFAULT_CLIP_ROLE } from './clipRole.js';

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
	#sortMode = DEFAULT_SORT_MODE;
	#pianorollFilters = {};
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

	/**
	 * @param {object} filters
	 */
	set pianorollFilters(filters) {
		this.#pianorollFilters = filters && typeof filters === 'object' ? filters : {};
		this.#render();
	}

	get pianorollFilters() {
		return this.#pianorollFilters;
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

		const filteredClips = this.#filterAndSortClips();
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

	#filterAndSortClips() {
		const filters = this.#pianorollFilters;
		const clipIdFilter = (filters.clipId || '').toLowerCase();
		const triggerTypeFilter = filters.triggerType || '';
		const pianoRollRoleFilter = filters.role || '';
		const filtered = this.#loadedClips.filter(clip => {
			const clipRole = clip.meta.role || DEFAULT_CLIP_ROLE;
			if (this.#roleFilter && clipRole !== this.#roleFilter) {
				return false;
			}
			if (clipIdFilter && !clip.clipId.toLowerCase().includes(clipIdFilter)) {
				return false;
			}
			if (triggerTypeFilter && resolveTriggerType(clip.meta.triggerType) !== triggerTypeFilter) {
				return false;
			}
			// Same default as library chip path — omitted/empty role is "clip".
			if (pianoRollRoleFilter && clipRole !== pianoRollRoleFilter) {
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
				case SORT_MODE.clipId:
					return clipA.clipId.localeCompare(clipB.clipId);
				case SORT_MODE.role:
					return (clipA.meta.role || '').localeCompare(clipB.meta.role || '');
				case SORT_MODE.frames:
					return (clipA.meta.frames ?? clipA.meta.numberOfFrames ?? 0) - (clipB.meta.frames ?? clipB.meta.numberOfFrames ?? 0);
				case SORT_MODE.name:
				default:
					return (clipA.meta.name || clipA.clipId).localeCompare(clipB.meta.name || clipB.clipId);
			}
		});

		return filtered;
	}
}

customElements.define('akvj-clip-list', ClipList);

export default ClipList;
