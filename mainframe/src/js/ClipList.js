const API = '/api';

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
	#activePreviewPlayers = new Map();

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

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.#stopAllPreviewPlayers();
		this.replaceChildren();
	}

	#stopAllPreviewPlayers() {
		for (const player of this.#activePreviewPlayers.values()) {
			player.stop();
		}
		this.#activePreviewPlayers.clear();
	}

	#render() {
		this.#stopAllPreviewPlayers();
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

		for (const clip of filteredClips) {
			this.append(this.#createClipListItem(clip));
		}
	}

	#filterClips() {
		const filtered = this.#clips.filter(clip => {
			const clipRole = clip.meta.role || '';
			if (this.#roleFilter && clipRole !== this.#roleFilter) {
				return false;
			}
			if (!this.#searchQuery) {
				return true;
			}
			const clipIdMatch = clip.clipId.toLowerCase().includes(this.#searchQuery);
			const roleMatch = clipRole.toLowerCase().includes(this.#searchQuery);
			return clipIdMatch || roleMatch;
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

	#createClipListItem(clip) {
		const li = document.createElement('li');

		const img = document.createElement('img');
		img.alt = clip.clipId;
		img.src = clip.hasSprite ? `${API}/clips/${encodeURIComponent(clip.clipId)}/sprite?t=${performance.now()}` : '';

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

		const previewButton = document.createElement('button');
		previewButton.type = 'button';
		previewButton.className = 'clip-preview';
		previewButton.textContent = 'Preview';
		previewButton.disabled = !clip.hasSprite;
		previewButton.addEventListener('click', () => this.#toggleClipPreview(li, clip));

		const editButton = document.createElement('button');
		editButton.type = 'button';
		editButton.className = 'clip-edit';
		editButton.textContent = 'Edit';
		editButton.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('clipedit', { bubbles: true, detail: { clipId: clip.clipId, clip, listItem: li } }));
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

		actions.append(previewButton, editButton, mapButton, deleteButton);
		li.append(img, clipInfo, actions);
		return li;
	}

	#toggleClipPreview(li, clip) {
		const existingPlayer = li.querySelector('.clip-preview-player');
		if (existingPlayer) {
			this.#stopPreviewPlayer(clip.clipId);
			existingPlayer.remove();
			return;
		}
		const player = this.#createClipPreviewPlayer(clip);
		li.append(player);
	}

	#stopPreviewPlayer(clipId) {
		const player = this.#activePreviewPlayers.get(clipId);
		if (player) {
			player.stop();
			this.#activePreviewPlayers.delete(clipId);
		}
	}

	#createClipPreviewPlayer(clip) {
		const container = document.createElement('div');
		container.className = 'clip-preview-player';

		const canvas = document.createElement('canvas');
		canvas.width = 240;
		canvas.height = 135;
		canvas.className = 'clip-preview-canvas';
		const ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;

		const controls = document.createElement('div');
		controls.className = 'clip-preview-controls';

		const frameLabel = document.createElement('span');
		frameLabel.className = 'clip-preview-frame-label';
		frameLabel.textContent = 'Loading…';

		const playPauseButton = document.createElement('button');
		playPauseButton.type = 'button';
		playPauseButton.className = 'clip-preview-play';
		playPauseButton.textContent = 'Pause';

		const stopButton = document.createElement('button');
		stopButton.type = 'button';
		stopButton.textContent = 'Stop';
		stopButton.addEventListener('click', () => {
			this.#stopPreviewPlayer(clip.clipId);
			container.remove();
		});

		const scrubSlider = document.createElement('input');
		scrubSlider.type = 'range';
		scrubSlider.className = 'clip-preview-scrub';
		scrubSlider.min = 0;
		scrubSlider.max = 0;
		scrubSlider.value = 0;
		scrubSlider.disabled = true;

		const speedSelect = document.createElement('select');
		speedSelect.className = 'clip-preview-speed';
		for (const speed of [0.25, 0.5, 1, 2, 4]) {
			const option = document.createElement('option');
			option.value = String(speed);
			option.textContent = `${speed}×`;
			if (speed === 1) {
				option.selected = true;
			}
			speedSelect.append(option);
		}

		controls.append(frameLabel, playPauseButton, stopButton, speedSelect);
		container.append(canvas, controls, scrubSlider);

		const clipMetadata = clip.meta;
		const frameCount = clipMetadata.frames ?? clipMetadata.numberOfFrames ?? 1;
		const framesPerRow = clipMetadata.framesPerRow ?? 1;
		const playbackMode = clipMetadata.playback ?? (clipMetadata.loop === false ? 'once' : 'loop');
		const frameRatesForFrames = clipMetadata.frameRatesForFrames || { 0: 15 };
		const defaultFrameRate = frameRatesForFrames[0] ?? 15;

		const spriteUrl = `${API}/clips/${encodeURIComponent(clip.clipId)}/sprite?t=${performance.now()}`;
		const spriteImage = new Image();
		spriteImage.crossOrigin = 'anonymous';

		let currentFrame = 0;
		let lastFrameTime = 0;
		let animationFrameId = null;
		let isPlaying = false;
		let playbackSpeed = 1;
		let isScrubbing = false;

		function getFrameInterval(frameIndex) {
			const fps = frameRatesForFrames[frameIndex] ?? defaultFrameRate;
			return 1000 / fps / playbackSpeed;
		}

		function drawCurrentFrame() {
			if (!spriteImage.complete || !spriteImage.naturalWidth) {
				return;
			}
			const frameWidth = spriteImage.naturalWidth / framesPerRow;
			const frameHeight = spriteImage.naturalHeight / Math.ceil(frameCount / framesPerRow);
			const col = currentFrame % framesPerRow;
			const row = Math.floor(currentFrame / framesPerRow);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(spriteImage, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);
			frameLabel.textContent = `Frame ${currentFrame + 1} / ${frameCount}`;
			if (!isScrubbing) {
				scrubSlider.value = String(currentFrame);
			}
		}

		function setPlaying(playing) {
			isPlaying = playing;
			playPauseButton.textContent = playing ? 'Pause' : 'Play';
			if (playing) {
				lastFrameTime = 0;
				if (animationFrameId === null) {
					animationFrameId = requestAnimationFrame(animate);
				}
			}
		}

		function animate(timestamp) {
			if (!isPlaying) {
				animationFrameId = null;
				return;
			}
			if (lastFrameTime === 0) {
				lastFrameTime = timestamp;
			}
			const elapsed = timestamp - lastFrameTime;
			if (elapsed >= getFrameInterval(currentFrame)) {
				lastFrameTime = timestamp;
				currentFrame++;
				if (currentFrame >= frameCount) {
					if (playbackMode !== 'once') {
						currentFrame = 0;
					} else {
						currentFrame = frameCount - 1;
						setPlaying(false);
						frameLabel.textContent = `Frame ${currentFrame + 1} / ${frameCount} (finished)`;
						drawCurrentFrame();
						return;
					}
				}
				drawCurrentFrame();
			}
			animationFrameId = requestAnimationFrame(animate);
		}

		playPauseButton.addEventListener('click', () => {
			if (isPlaying) {
				setPlaying(false);
			} else {
				if (currentFrame >= frameCount - 1 && playbackMode === 'once') {
					currentFrame = 0;
				}
				setPlaying(true);
			}
		});

		scrubSlider.addEventListener('input', () => {
			isScrubbing = true;
			currentFrame = Number(scrubSlider.value);
			drawCurrentFrame();
		});

		scrubSlider.addEventListener('change', () => {
			isScrubbing = false;
		});

		speedSelect.addEventListener('change', () => {
			playbackSpeed = Number(speedSelect.value);
		});

		spriteImage.onload = () => {
			scrubSlider.max = String(Math.max(0, frameCount - 1));
			scrubSlider.disabled = false;
			setPlaying(true);
			drawCurrentFrame();
		};

		spriteImage.onerror = () => {
			frameLabel.textContent = 'Failed to load sprite';
			scrubSlider.disabled = true;
		};

		spriteImage.src = spriteUrl;

		const player = {
			stop() {
				isPlaying = false;
				if (animationFrameId !== null) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
			}
		};
		this.#activePreviewPlayers.set(clip.clipId, player);

		return container;
	}

	/**
	 * Append an edit form element to a specific clip list item.
	 * Called by parent when handling `clipedit` event.
	 * @param {string} clipId
	 * @param {HTMLElement} formElement
	 */
	attachEditForm(clipId, formElement) {
		for (const li of this.children) {
			const existingForm = li.querySelector('.clip-edit-form');
			if (existingForm) {
				existingForm.remove();
				return;
			}
		}
		// Find the li for this clipId and append the form
		for (const li of this.children) {
			const img = li.querySelector('img');
			if (img && img.alt === clipId) {
				li.append(formElement);
				return;
			}
		}
	}
}

customElements.define('akvj-clip-list', AkvjClipList);

export default AkvjClipList;
