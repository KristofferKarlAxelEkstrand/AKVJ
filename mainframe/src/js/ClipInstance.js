import '../scss/ClipInstance.scss';
import { API_BASE_PATH } from './apiClient.js';
import { MIME_AKVJ_CLIP_ID } from './PianoKey.js';

/**
 * ClipInstance — individual clip display element with thumbnail, metadata, and actions.
 *
 * @fires ClipInstance#clipedit - CustomEvent with `{ detail: { clipId, clip } }`
 * @fires ClipInstance#clipdelete - CustomEvent with `{ detail: { clipId } }`
 * @fires ClipInstance#clipmap - CustomEvent with `{ detail: { clipId } }`
 */
class ClipInstance extends HTMLElement {
	#clip = null;
	#showMapAction = true;
	#boundDragStart = this.#handleDragStart.bind(this);

	/**
	 * @param {{clipId: string, meta: object, hasSprite: boolean, pipelineReady: boolean}} clip
	 */
	set clip(clip) {
		this.#clip = clip;
		this.#render();
	}

	get clip() {
		return this.#clip;
	}

	/**
	 * @param {boolean} show - Whether to show the Map action button (default: true)
	 */
	set showMapAction(show) {
		this.#showMapAction = show;
		this.#render();
	}

	get showMapAction() {
		return this.#showMapAction;
	}

	connectedCallback() {
		this.addEventListener('dragstart', this.#boundDragStart);
		this.#render();
	}

	disconnectedCallback() {
		this.removeEventListener('dragstart', this.#boundDragStart);
		this.replaceChildren();
	}

	#render() {
		this.replaceChildren();
		if (!this.#clip) {
			return;
		}

		const clip = this.#clip;

		const img = document.createElement('img');
		img.alt = clip.clipId;
		img.src = clip.hasSprite ? `${API_BASE_PATH}/clips/${encodeURIComponent(clip.clipId)}/sprite?t=${performance.now()}` : '';
		img.className = 'clip-instance-img';

		const clipInfo = document.createElement('p');
		clipInfo.className = 'clip-meta';
		const title = document.createElement('strong');
		title.textContent = clip.meta.name || clip.clipId;
		clipInfo.append(title);
		if (clip.meta.name && clip.meta.name !== clip.clipId) {
			const clipIdLabel = document.createElement('span');
			clipIdLabel.className = 'clip-id-label';
			clipIdLabel.textContent = ` (${clip.clipId})`;
			clipInfo.append(clipIdLabel);
		}
		clipInfo.append(document.createTextNode(` · frames: ${clip.meta.frames ?? clip.meta.numberOfFrames ?? '?'} · role: ${clip.meta.role || 'clip'}${clip.meta.bitDepth ? ` · ${clip.meta.bitDepth}-bit` : ''}${clip.pipelineReady === false ? ' · incomplete' : ''}`));

		const actions = document.createElement('div');
		actions.className = 'clip-actions';

		const editButton = document.createElement('button');
		editButton.type = 'button';
		editButton.className = 'clip-edit';
		editButton.textContent = 'Edit';
		editButton.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('clipedit', { bubbles: true, detail: { clipId: clip.clipId, clip } }));
		});

		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.className = 'clip-delete';
		deleteButton.textContent = 'Delete';
		deleteButton.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('clipdelete', { bubbles: true, detail: { clipId: clip.clipId } }));
		});

		const mapButton = document.createElement('button');
		mapButton.type = 'button';
		mapButton.className = 'clip-map';
		mapButton.textContent = 'Map';
		mapButton.disabled = !clip.pipelineReady;
		mapButton.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('clipmap', { bubbles: true, detail: { clipId: clip.clipId } }));
		});

		actions.append(editButton);
		if (this.#showMapAction) {
			actions.append(mapButton);
		}
		actions.append(deleteButton);
		this.append(img, clipInfo, actions);

		this.draggable = true;
		this.dataset.clipId = clip.clipId;
	}

	/**
	 * @param {DragEvent} event
	 */
	#handleDragStart(event) {
		if (event.target.closest('button')) {
			event.preventDefault();
			return;
		}
		const clipId = this.#clip?.clipId;
		if (!clipId || !event.dataTransfer) {
			event.preventDefault();
			return;
		}
		event.dataTransfer.setData(MIME_AKVJ_CLIP_ID, clipId);
		event.dataTransfer.setData('text/plain', clipId);
		event.dataTransfer.effectAllowed = 'copy';
	}
}

customElements.define('clip-instance', ClipInstance);

export { ClipInstance };
