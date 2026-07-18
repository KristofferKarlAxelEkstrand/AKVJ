import '../scss/ClipInstance.scss';

/**
 * ClipInstance — individual clip display element with thumbnail, metadata, and actions.
 *
 * @fires ClipInstance#clipedit - CustomEvent with `{ detail: { clipId, clip } }`
 * @fires ClipInstance#clipdelete - CustomEvent with `{ detail: { clipId } }`
 * @fires ClipInstance#clipmap - CustomEvent with `{ detail: { clipId } }`
 * @fires ClipInstance#clipsaved - CustomEvent (bubbles)
 */
class ClipInstance extends HTMLElement {
	#clip = null;

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

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
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
		img.src = clip.hasSprite ? `/api/clips/${encodeURIComponent(clip.clipId)}/sprite?t=${performance.now()}` : '';
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

		actions.append(editButton, mapButton, deleteButton);
		this.append(img, clipInfo, actions);
	}
}

customElements.define('clip-instance', ClipInstance);

export { ClipInstance };
