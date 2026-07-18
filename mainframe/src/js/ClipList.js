import '../scss/ClipList.scss';
import { ClipCategory } from './ClipCategory.js';
import { ClipInstance } from './ClipInstance.js';

/**
 * AkvjClipList — custom element encapsulating the clip library list.
 * Renders clip items with thumbnails, metadata, and action buttons.
 * Dispatches `clipedit`, `clipdelete`, `clipmap` events (bubbles: true)
 * with `{ detail: { clipId } }` for the parent to handle.
 *
 * @fires AkvjClipList#clipedit - CustomEvent with `{ detail: { clipId, clip } }`
 * @fires AkvjClipList#clipdelete - CustomEvent with `{ detail: { clipId } }`
 * @fires AkvjClipList#clipmap - CustomEvent with `{ detail: { clipId } }`
 */
class AkvjClipList extends HTMLElement {
	/** @type {Array<{clipId: string, meta: object, hasSprite: boolean, pipelineReady: boolean}>} */
	#clips = [];
	#searchQuery = '';
	#roleFilter = '';
	#sortMode = 'name';
	#category = '';

	/**
	 * @param {Array<{clipId: string, meta: object, hasSprite: boolean, pipelineReady: boolean}>} clips
	 */
	set clips(clips) {
		this.#clips = clips;
		this.#render();
	}

	get clips() {
		return this.#clips;
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
	 * @param {string} category - Selected category (empty string = folder view)
	 */
	set category(category) {
		this.#category = category;
		this.#render();
	}

	get category() {
		return this.#category;
	}

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	#render() {
		this.replaceChildren();

		if (this.#clips.length === 0) {
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
		const filtered = this.#clips.filter(clip => {
			const clipCategory = clip.meta.category || 'uncategorized';
			if (this.#category && clipCategory !== this.#category) {
				return false;
			}
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

customElements.define('akvj-clip-list', AkvjClipList);

export default AkvjClipList;
