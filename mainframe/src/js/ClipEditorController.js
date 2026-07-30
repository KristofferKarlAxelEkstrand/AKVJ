import { api } from './apiClient.js';
import { generateClipId } from './generateClipId.js';
import { partitionImageFiles, formatSkippedFilesMessage, shouldAttemptGifExpand } from './acceptedImageFiles.js';
import { DEFAULT_FRAME_DURATION_MS, DEFAULT_FALLBACK_FRAME_DURATION_MS } from './frameTiming.js';
import { editClipPath, resolveClipEditRoute } from './clipEditorRoute.js';
import { editorValuesFromMeta, metaPatchFromEditor, optionalMetaFromEditor } from './editorMeta.js';
import { DEFAULT_BEATS_PER_BAR, DEFAULT_SYNC_MODE, SYNC_LENGTH_PRESETS, resolvePlacement, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_SCALE_MODE } from './clipSchema.js';
import { FRAME_BAKE_SCALE_MODES, resolveFrameBakeConfig } from './frameBake.js';
import mainframeState, { messages } from './mainframeState.js';

/** Default length preset when beat-synced (must be in SYNC_LENGTH_PRESETS). */
const DEFAULT_SYNC_LENGTH = '1 bar';

/**
 * Owns shared clip editor staging state, hydrate, and create/update submit branching.
 * DOM ids match the clip editor panel in `index.html`.
 */
export class ClipEditorController {
	/** @type {File[]} */
	#stagedFiles = [];
	/** @type {number[]} */
	#stagedDurationsMs = [];
	/** @type {ReturnType<typeof resolveFrameBakeConfig>[]} */
	#stagedBakeConfigs = [];
	/** @type {string[]} */
	#stagedFrameUrls = [];
	/** @type {string|null} */
	#editingClipId = null;
	#framesDirty = false;
	#loadedFrameWidth = DEFAULT_FRAME_WIDTH;
	#loadedFrameHeight = DEFAULT_FRAME_HEIGHT;
	#loadedScaleMode = DEFAULT_SCALE_MODE;
	#hydrateGeneration = 0;
	/** Last uniform per-frame duration (ms); used when re-applying after a mixed state. */
	#lastUniformDurationMs = DEFAULT_FRAME_DURATION_MS;
	/** Last uniform bake scale (for re-apply after mixed). */
	#lastUniformBakeScale = DEFAULT_SCALE_MODE;
	#lastUniformBakeWidth = DEFAULT_FRAME_WIDTH;
	#lastUniformBakeHeight = DEFAULT_FRAME_HEIGHT;
	#globalDurationMsInput;
	#globalDurationMsApply;
	#globalBakeScaleSelect;
	#globalBakeCustomSize;
	#globalBakeCustomWidth;
	#globalBakeCustomHeight;
	#globalBakeScaleApply;

	/**
	 * @param {object} options
	 * @param {(statusElement: HTMLElement, message: string, statusClass?: string) => void} options.setStatus
	 * @param {() => Promise<void>} options.onLibraryChanged
	 * @param {{ navigate: Function, replace: Function }} options.router
	 */
	constructor({ setStatus, onLibraryChanged, router }) {
		this.#setStatus = setStatus;
		this.#onLibraryChanged = onLibraryChanged;
		this.#router = router;

		this.#clipEditorForm = document.getElementById('clip-editor-form');
		this.#dropZone = document.getElementById('clip-editor-drop-zone');
		this.#fileInput = document.getElementById('clip-editor-files');
		this.#clipIdInput = document.getElementById('clip-editor-clip-id');
		this.#clipIdHint = document.getElementById('clip-editor-clip-id-hint');
		this.#clipEditorHeading = document.getElementById('clip-editor-heading');
		this.#submitButton = document.getElementById('clip-editor-submit');
		this.#stagingPreview = document.getElementById('clip-editor-staging-preview');
		this.#statusElement = document.getElementById('clip-editor-status');
		this.#globalDurationMsInput = document.getElementById('clip-frames-global-duration-ms');
		this.#globalDurationMsApply = document.getElementById('clip-frames-set-all-duration-ms');
		this.#globalBakeScaleSelect = document.getElementById('clip-frames-global-bake-scale');
		this.#globalBakeCustomSize = document.getElementById('clip-frames-global-custom-size');
		this.#globalBakeCustomWidth = document.getElementById('clip-frames-global-custom-width');
		this.#globalBakeCustomHeight = document.getElementById('clip-frames-global-custom-height');
		this.#globalBakeScaleApply = document.getElementById('clip-frames-set-all-bake-scale');
	}

	#setStatus;
	#onLibraryChanged;
	#router;
	#clipEditorForm;
	#dropZone;
	#fileInput;
	#clipIdInput;
	#clipIdHint;
	#clipEditorHeading;
	#submitButton;
	#stagingPreview;
	#statusElement;
	#clipFramesListenersAttached = false;

	/**
	 * Lazily resolve the inner <clip-frames> element, which may be created by
	 * <clip-frames-panel> after this controller is constructed.
	 * @returns {HTMLElement|null}
	 */
	get #clipFramesElement() {
		return document.getElementById('clip-frames');
	}

	/**
	 * Attach listeners to the dynamic <clip-frames> element once it exists.
	 * The element is rendered by <clip-frames-panel>, so it may not be
	 * available at construction time.
	 */
	#attachClipFramesListeners() {
		const clipFrames = this.#clipFramesElement;
		if (!clipFrames || this.#clipFramesListenersAttached) {
			return;
		}
		this.#clipFramesListenersAttached = true;

		clipFrames.addEventListener('framesreordered', event => {
			const order = event.detail.indices;
			this.#stagedFiles = order.map(originalIndex => this.#stagedFiles[originalIndex]);
			this.#stagedFrameUrls = order.map(originalIndex => this.#stagedFrameUrls[originalIndex]);
			this.#stagedDurationsMs = order.map(originalIndex => this.#stagedDurationsMs[originalIndex] ?? DEFAULT_FRAME_DURATION_MS);
			this.#stagedBakeConfigs = order.map(originalIndex => this.#stagedBakeConfigs[originalIndex] ?? resolveFrameBakeConfig({}));
			this.#framesDirty = true;
			this.syncGlobalDurationMsControl();
			this.syncGlobalBakeScaleControl();
			this.updateStagingPreview();
		});
		clipFrames.addEventListener('durationchange', () => {
			this.#stagedDurationsMs = clipFrames.getDurationsMs();
			this.#framesDirty = true;
			this.syncGlobalDurationMsControl();
			this.updateStagingPreview();
		});
		clipFrames.addEventListener('bakeconfigchange', () => {
			this.#stagedBakeConfigs = clipFrames.getBakeConfigs();
			this.#framesDirty = true;
			this.syncGlobalBakeScaleControl();
			this.updateStagingPreview();
		});
		clipFrames.addEventListener('frameremove', event => {
			const index = event.detail.frameIndex;
			this.#stagedFiles.splice(index, 1);
			this.#stagedDurationsMs.splice(index, 1);
			this.#stagedBakeConfigs.splice(index, 1);
			if (this.#stagedFrameUrls[index]) {
				URL.revokeObjectURL(this.#stagedFrameUrls[index]);
				this.#stagedFrameUrls.splice(index, 1);
			}
			this.#framesDirty = true;
			this.syncStagedFramesUi();
		});
		clipFrames.addEventListener('framescleared', () => {
			this.clearStagedFrames();
		});
	}

	/** Wire DOM listeners once after construction. */
	bindEventListeners() {
		this.reset();
		this.updateBitDepthVisibility();
		this.#populateSyncLengthOptions();
		this.updateSyncFieldVisibility();

		document.getElementById('clip-editor-role').addEventListener('change', () => this.updateBitDepthVisibility());
		document.getElementById('clip-editor-new').addEventListener('click', () => {
			this.#router.navigate('/clip/edit');
		});
		document.getElementById('clip-frames-clear').addEventListener('click', () => {
			this.clearStagedFrames();
			this.#clipFramesElement?.clearAll();
			this.#clearProgressStatus();
		});

		this.#dropZone.addEventListener('click', () => this.#fileInput.click());
		this.#dropZone.addEventListener('keydown', event => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.#fileInput.click();
			}
		});
		this.#dropZone.addEventListener('dragover', event => {
			event.preventDefault();
			this.#dropZone.classList.add('is-dragover');
		});
		this.#dropZone.addEventListener('dragleave', () => {
			this.#dropZone.classList.remove('is-dragover');
		});
		this.#dropZone.addEventListener('drop', event => {
			event.preventDefault();
			this.#dropZone.classList.remove('is-dragover');
			this.stageSelectedFiles(event.dataTransfer.files);
		});
		this.#fileInput.addEventListener('change', () => {
			this.stageSelectedFiles(this.#fileInput.files);
		});

		for (const id of ['clip-editor-target-width', 'clip-editor-target-height', 'clip-editor-playback', 'clip-editor-scale-mode', 'clip-editor-placement-x', 'clip-editor-placement-y']) {
			document.getElementById(id).addEventListener('change', () => this.updateStagingPreview());
		}
		for (const id of ['clip-editor-placement-x', 'clip-editor-placement-y']) {
			document.getElementById(id).addEventListener('input', () => this.updateStagingPreview());
		}

		for (const id of ['clip-editor-sync', 'clip-editor-sync-length', 'clip-editor-sync-beats', 'clip-editor-beats-per-bar']) {
			const element = document.getElementById(id);
			if (!element) {
				continue;
			}
			element.addEventListener('change', () => {
				this.updateSyncFieldVisibility();
				this.updateStagingPreview();
			});
			if (id === 'clip-editor-sync-beats' || id === 'clip-editor-beats-per-bar') {
				element.addEventListener('input', () => this.updateStagingPreview());
			}
		}

		document.getElementById('clip-editor-name').addEventListener('namechange', () => {
			this.refreshGeneratedClipId();
		});

		this.#attachClipFramesListeners();

		this.#globalDurationMsApply?.addEventListener('click', () => {
			this.applyGlobalDurationMsToAllFrames();
		});
		this.#globalBakeScaleSelect?.addEventListener('change', () => {
			this.#updateGlobalBakeCustomVisibility();
		});
		this.#globalBakeScaleApply?.addEventListener('click', () => {
			this.applyGlobalBakeScaleToAllFrames();
		});

		this.#clipEditorForm.addEventListener('submit', event => {
			event.preventDefault();
			this.submit().catch(error => {
				this.#reportOutcome('error', error.message);
			});
		});
	}

	/**
	 * Clear progressive panel status (`#clip-editor-status`). Outcomes use `messages.*` instead.
	 */
	#clearProgressStatus() {
		this.#setStatus(this.#statusElement, '');
	}

	/**
	 * End in-progress status and show a modal outcome via `<user-messages>`.
	 * @param {'error'|'warn'|'info'} severity
	 * @param {string} text
	 */
	#reportOutcome(severity, text) {
		this.#clearProgressStatus();
		if (severity === 'error') {
			messages.error(text);
		} else if (severity === 'warn') {
			messages.warn(text);
		} else {
			messages.info(text);
		}
	}

	/**
	 * Deep-link open existing clip.
	 * @param {string} clipId
	 */
	open(clipId) {
		this.#router.navigate(editClipPath(clipId));
	}

	reset() {
		this.#editingClipId = null;
		this.#framesDirty = false;
		this.#loadedFrameWidth = DEFAULT_FRAME_WIDTH;
		this.#loadedFrameHeight = DEFAULT_FRAME_HEIGHT;
		this.#loadedScaleMode = DEFAULT_SCALE_MODE;
		this.#clipEditorForm.reset();
		this.#setFormDefaults();
		this.updateBitDepthVisibility();
		this.clearStagedFrames();
		this.#framesDirty = false;
		this.resetClipId();
		this.updateEditorChrome();
		this.#clearProgressStatus();
	}

	/**
	 * URL-driven hydrate for `/clip/edit/:clipId`.
	 * @param {string} clipId
	 */
	async hydrate(clipId) {
		const generation = ++this.#hydrateGeneration;
		const resolved = resolveClipEditRoute(clipId);
		if (resolved.action !== 'edit') {
			this.reset();
			if (resolved.action === 'invalid') {
				this.#reportOutcome('error', resolved.message);
			}
			return;
		}

		this.#setStatus(this.#statusElement, 'Loading clip…');
		try {
			const framesResponse = await api(`/clips/${encodeURIComponent(resolved.clipId)}/frames`);
			if (generation !== this.#hydrateGeneration) {
				return;
			}
			if (!Array.isArray(framesResponse.frames) || framesResponse.frames.length === 0) {
				throw new Error(`Clip "${resolved.clipId}" has no editable frames`);
			}
			this.#applyHydratedClip(resolved.clipId, framesResponse);

			const files = await Promise.all(framesResponse.frames.map((frameDataUrl, index) => dataUrlToFile(frameDataUrl, `frame-${String(index).padStart(4, '0')}.png`)));
			if (generation !== this.#hydrateGeneration) {
				return;
			}
			for (const url of this.#stagedFrameUrls) {
				URL.revokeObjectURL(url);
			}
			this.#stagedFiles = files;
			this.#stagedDurationsMs = (framesResponse.durationsMs || []).map(ms => Number(ms) || DEFAULT_FRAME_DURATION_MS);
			while (this.#stagedDurationsMs.length < this.#stagedFiles.length) {
				this.#stagedDurationsMs.push(DEFAULT_FRAME_DURATION_MS);
			}
			// Bake-time composition is session-only — reopen defaults to fit (already-composited pixels).
			this.#stagedBakeConfigs = this.#stagedFiles.map(() => resolveFrameBakeConfig({ scaleMode: DEFAULT_SCALE_MODE }));
			this.#framesDirty = false;
			this.updateEditorChrome();
			this.syncStagedFramesUi();
			this.#framesDirty = false;
			this.#reportOutcome('info', `Loaded ${this.#stagedFiles.length} frame${this.#stagedFiles.length === 1 ? '' : 's'} from ${framesResponse.source === 'raw' ? 'raw' : 'sprite'}`);
		} catch (error) {
			if (generation !== this.#hydrateGeneration) {
				return;
			}
			try {
				this.reset();
			} catch (resetError) {
				console.warn('Error resetting clip editor after failed hydrate:', resetError);
			}
			this.#reportOutcome('error', error.message);
		}
	}

	/**
	 * Create vs meta-only PUT vs frames PUT.
	 */
	async submit() {
		if (this.#stagedFiles.length === 0) {
			this.#reportOutcome('error', 'Cannot save with zero frames — add at least one image');
			return;
		}
		if (!this.#clipFramesElement) {
			this.#reportOutcome('error', 'Clip frames element is not ready');
			return;
		}
		this.#setStatus(this.#statusElement, this.#editingClipId ? 'Saving…' : 'Uploading…');
		try {
			const name = document.getElementById('clip-editor-name').value || undefined;
			const clipId = this.#clipIdInput.value.trim();
			if (!clipId) {
				this.#reportOutcome('error', 'Clip ID is required');
				return;
			}
			const role = document.getElementById('clip-editor-role').value || undefined;
			const targetWidth = Number(document.getElementById('clip-editor-target-width').value) || undefined;
			const targetHeight = Number(document.getElementById('clip-editor-target-height').value) || undefined;
			const playback = document.getElementById('clip-editor-playback').value;
			const scaleMode = document.getElementById('clip-editor-scale-mode').value;
			const placement = this.#readPlacementFromDom();
			const frameDurationsMs = this.#clipFramesElement.getDurationsMs();
			const extended = this.#readExtendedEditorFields();
			if (extended.error) {
				this.#reportOutcome('error', extended.error);
				return;
			}
			const sizeOrScaleChanged = Number(targetWidth) !== this.#loadedFrameWidth || Number(targetHeight) !== this.#loadedFrameHeight || scaleMode !== this.#loadedScaleMode;

			if (this.#editingClipId) {
				if (this.#framesDirty || sizeOrScaleChanged) {
					const frames = await readFilesAsDataURLs(this.#stagedFiles);
					await api(`/clips/${encodeURIComponent(this.#editingClipId)}/frames`, {
						method: 'PUT',
						body: JSON.stringify({
							name,
							role,
							frames,
							frameDurationsMs,
							targetWidth,
							targetHeight,
							playback,
							scaleMode,
							placement,
							frameBakeConfigs: this.#clipFramesElement.getBakeConfigs(),
							...extended.optional
						})
					});
				} else {
					await api(`/clips/${encodeURIComponent(this.#editingClipId)}`, {
						method: 'PUT',
						body: JSON.stringify(
							metaPatchFromEditor({
								name,
								role,
								playback,
								scaleMode,
								frameWidth: targetWidth,
								frameHeight: targetHeight,
								placement,
								frameDurationsMs,
								retrigger: extended.values.retrigger,
								triggerType: extended.values.triggerType,
								triggerGroup: extended.values.triggerGroup,
								bitDepth: extended.values.bitDepth,
								sync: extended.values.sync,
								syncLength: extended.values.syncLength,
								syncBeats: extended.values.syncBeats,
								beatsPerBar: extended.values.beatsPerBar
							})
						)
					});
				}
				this.#framesDirty = false;
				this.#loadedFrameWidth = Number(targetWidth) || this.#loadedFrameWidth;
				this.#loadedFrameHeight = Number(targetHeight) || this.#loadedFrameHeight;
				this.#loadedScaleMode = scaleMode;
				this.#reportOutcome('info', `Saved clip ${this.#editingClipId}`);
			} else {
				const frames = await readFilesAsDataURLs(this.#stagedFiles);
				await api('/clips', {
					method: 'POST',
					body: JSON.stringify({
						clipId,
						name,
						role,
						frames,
						frameDurationsMs,
						targetWidth,
						targetHeight,
						playback,
						scaleMode,
						placement,
						frameBakeConfigs: this.#clipFramesElement.getBakeConfigs(),
						...extended.optional
					})
				});
				this.#reportOutcome('info', `Saved clip ${clipId}`);
				this.#editingClipId = clipId;
				this.#framesDirty = false;
				this.#loadedFrameWidth = Number(targetWidth) || DEFAULT_FRAME_WIDTH;
				this.#loadedFrameHeight = Number(targetHeight) || DEFAULT_FRAME_HEIGHT;
				this.#loadedScaleMode = scaleMode;
				this.updateEditorChrome();
				this.#router.replace(editClipPath(clipId), { invokeHandler: false });
			}
			await this.#onLibraryChanged();
		} catch (error) {
			this.#reportOutcome('error', error.message);
		}
	}

	async stageSelectedFiles(fileList) {
		const { accepted, rejected } = partitionImageFiles(fileList);

		if (rejected.length > 0) {
			const skipped = formatSkippedFilesMessage(rejected);
			if (accepted.length === 0) {
				this.#reportOutcome('error', skipped);
			} else {
				this.#reportOutcome('warn', skipped);
			}
		}

		if (accepted.length === 0) {
			return;
		}

		if (shouldAttemptGifExpand(accepted)) {
			this.#setStatus(this.#statusElement, 'Expanding GIF…');
			try {
				const image = await readFilesAsDataURLs([accepted[0]]);
				const result = await api('/expand-gif', {
					method: 'POST',
					body: JSON.stringify({ image: image[0] })
				});
				if (result.animated) {
					const expandedFiles = await Promise.all(result.frames.map((frameDataUrl, index) => dataUrlToFile(frameDataUrl, `gif-frame-${String(index).padStart(4, '0')}.png`)));
					const expandedDurations = result.durationsMs.map(ms => Number(ms) || DEFAULT_FALLBACK_FRAME_DURATION_MS);
					this.#stagedFiles = [...this.#stagedFiles, ...expandedFiles];
					this.#stagedDurationsMs = [...this.#stagedDurationsMs, ...expandedDurations];
					this.#stagedBakeConfigs = [...this.#stagedBakeConfigs, ...expandedFiles.map(() => resolveFrameBakeConfig({ scaleMode: this.#lastUniformBakeScale }))];
					this.#framesDirty = true;
					this.syncStagedFramesUi();
					this.#reportOutcome('info', `Expanded animated GIF into ${expandedFiles.length} frames`);
					return;
				}
			} catch (error) {
				this.#reportOutcome('error', error.message);
				return;
			}
		}

		this.#stagedFiles = [...this.#stagedFiles, ...accepted];
		this.#stagedDurationsMs = [...this.#stagedDurationsMs, ...accepted.map(() => DEFAULT_FRAME_DURATION_MS)];
		this.#stagedBakeConfigs = [...this.#stagedBakeConfigs, ...accepted.map(() => resolveFrameBakeConfig({ scaleMode: this.#lastUniformBakeScale }))];
		this.#framesDirty = true;
		this.syncStagedFramesUi();
		if (rejected.length === 0) {
			this.#clearProgressStatus();
		}
	}

	clearStagedFrames() {
		for (const url of this.#stagedFrameUrls) {
			URL.revokeObjectURL(url);
		}
		this.#stagedFrameUrls = [];
		this.#stagedFiles = [];
		this.#stagedDurationsMs = [];
		this.#stagedBakeConfigs = [];
		this.#framesDirty = true;
		this.syncStagedFramesUi();
	}

	/**
	 * Regenerate the clip ID from the current name while creating a new clip.
	 * No-ops when editing an existing clip (ID is immutable after first save).
	 */
	refreshGeneratedClipId() {
		if (this.#editingClipId) {
			return;
		}
		const name = document.getElementById('clip-editor-name')?.value ?? '';
		this.#clipIdInput.value = generateClipId({
			name,
			existingIds: mainframeState.clips
		});
	}

	resetClipId() {
		this.refreshGeneratedClipId();
		this.#clipIdInput.readOnly = false;
	}

	updateEditorChrome() {
		if (this.#editingClipId) {
			this.#clipEditorHeading.textContent = `Edit clip: ${this.#editingClipId}`;
			this.#clipEditorHeading.hidden = false;
			this.#clipIdHint.textContent = '(read-only)';
			this.#clipIdInput.readOnly = true;
			this.#submitButton.textContent = 'Save clip';
		} else {
			this.#clipEditorHeading.textContent = '';
			this.#clipEditorHeading.hidden = true;
			this.#clipIdHint.textContent = '(editable until first save)';
			this.#clipIdInput.readOnly = false;
			this.#submitButton.textContent = 'Create sprite & save';
		}
	}

	updateBitDepthVisibility() {
		const bitDepthField = document.getElementById('clip-editor-bit-depth-field');
		const roleSelect = document.getElementById('clip-editor-role');
		if (!bitDepthField || !roleSelect) {
			return;
		}
		bitDepthField.hidden = roleSelect.value !== 'bitmask';
	}

	/**
	 * Refresh clip-frames + staging preview after staged-file changes.
	 */
	syncStagedFramesUi() {
		const clipFrames = this.#clipFramesElement;
		if (!clipFrames) {
			this.#attachClipFramesListeners();
			return;
		}

		if (this.#stagedFiles.length === 0) {
			this.#stagedDurationsMs = [];
			this.#stagedBakeConfigs = [];
			for (const url of this.#stagedFrameUrls) {
				URL.revokeObjectURL(url);
			}
			this.#stagedFrameUrls = [];
			this.#stagingPreview.loadFrames([]);
			clipFrames.loadFrames([]);
			this.syncGlobalDurationMsControl();
			this.syncGlobalBakeScaleControl();
			return;
		}
		this.updateClipFrames();
		this.updateStagingPreview();
	}

	updateClipFrames() {
		const clipFrames = this.#clipFramesElement;
		if (!clipFrames) {
			this.#attachClipFramesListeners();
			return;
		}

		for (const url of this.#stagedFrameUrls) {
			URL.revokeObjectURL(url);
		}
		this.#stagedFrameUrls = this.#stagedFiles.map(file => URL.createObjectURL(file));
		while (this.#stagedBakeConfigs.length < this.#stagedFiles.length) {
			this.#stagedBakeConfigs.push(resolveFrameBakeConfig({ scaleMode: this.#lastUniformBakeScale }));
		}
		this.#stagedBakeConfigs = this.#stagedBakeConfigs.slice(0, this.#stagedFiles.length);
		const frames = this.#stagedFrameUrls.map((src, index) => ({
			src,
			durationMs: this.#stagedDurationsMs[index] ?? DEFAULT_FRAME_DURATION_MS,
			bakeConfig: this.#stagedBakeConfigs[index]
		}));
		clipFrames.loadFrames(frames);
		this.syncGlobalDurationMsControl();
		this.syncGlobalBakeScaleControl();
	}

	/**
	 * Apply the global bake scale to every staged frame (reset path back to uniform).
	 */
	applyGlobalBakeScaleToAllFrames() {
		if (!this.#clipFramesElement || this.#clipFramesElement.frameCount === 0) {
			return;
		}
		const scaleMode = FRAME_BAKE_SCALE_MODES.includes(this.#globalBakeScaleSelect?.value) ? this.#globalBakeScaleSelect.value : this.#lastUniformBakeScale;
		const width = Number(this.#globalBakeCustomWidth?.value);
		const height = Number(this.#globalBakeCustomHeight?.value);
		const bakeConfig = resolveFrameBakeConfig({
			scaleMode,
			width: Number.isFinite(width) && width > 0 ? width : this.#lastUniformBakeWidth,
			height: Number.isFinite(height) && height > 0 ? height : this.#lastUniformBakeHeight,
			placement: { x: 0, y: 0 }
		});
		this.#clipFramesElement.setAllBakeConfigs(bakeConfig);
		this.#stagedBakeConfigs = this.#clipFramesElement.getBakeConfigs();
		this.#framesDirty = true;
		this.syncGlobalBakeScaleControl();
		this.updateStagingPreview();
	}

	/**
	 * Enable bake-scale controls when all frames match; disable + blank when mixed.
	 */
	syncGlobalBakeScaleControl() {
		const configs = this.#clipFramesElement?.getBakeConfigs?.() ?? [];
		const hasFrames = configs.length > 0;
		const uniform = this.#clipFramesElement?.areBakeConfigsUniform?.() ?? true;

		if (this.#globalBakeScaleSelect) {
			if (!hasFrames) {
				this.#globalBakeScaleSelect.disabled = true;
				this.#globalBakeScaleSelect.value = this.#lastUniformBakeScale;
			} else if (uniform) {
				this.#lastUniformBakeScale = configs[0].scaleMode;
				this.#lastUniformBakeWidth = configs[0].width;
				this.#lastUniformBakeHeight = configs[0].height;
				this.#globalBakeScaleSelect.disabled = false;
				this.#globalBakeScaleSelect.value = configs[0].scaleMode;
				if (this.#globalBakeCustomWidth) {
					this.#globalBakeCustomWidth.value = String(configs[0].width);
				}
				if (this.#globalBakeCustomHeight) {
					this.#globalBakeCustomHeight.value = String(configs[0].height);
				}
			} else {
				this.#globalBakeScaleSelect.disabled = true;
				this.#globalBakeScaleSelect.value = '';
				if (this.#globalBakeCustomWidth) {
					this.#globalBakeCustomWidth.value = '';
				}
				if (this.#globalBakeCustomHeight) {
					this.#globalBakeCustomHeight.value = '';
				}
			}
		}
		if (this.#globalBakeCustomWidth) {
			this.#globalBakeCustomWidth.disabled = !hasFrames || !uniform;
		}
		if (this.#globalBakeCustomHeight) {
			this.#globalBakeCustomHeight.disabled = !hasFrames || !uniform;
		}
		if (this.#globalBakeScaleApply) {
			this.#globalBakeScaleApply.disabled = !hasFrames;
		}
		this.#updateGlobalBakeCustomVisibility();
	}

	#updateGlobalBakeCustomVisibility() {
		if (!this.#globalBakeCustomSize) {
			return;
		}
		const mode = this.#globalBakeScaleSelect?.disabled ? '' : this.#globalBakeScaleSelect?.value;
		this.#globalBakeCustomSize.hidden = mode !== 'custom';
	}

	/**
	 * Apply the global ms field to every staged frame (reset path back to uniform).
	 * When the field is blank/disabled (mixed), falls back to the last uniform value.
	 */
	applyGlobalDurationMsToAllFrames() {
		if (!this.#clipFramesElement || this.#clipFramesElement.frameCount === 0) {
			return;
		}
		const raw = Number(this.#globalDurationMsInput?.value);
		const ms = Number.isFinite(raw) && raw > 0 ? raw : this.#lastUniformDurationMs;
		this.#clipFramesElement.setAllDurationsMs(ms);
		this.#stagedDurationsMs = this.#clipFramesElement.getDurationsMs();
		this.#framesDirty = true;
		this.syncGlobalDurationMsControl();
		this.updateStagingPreview();
	}

	/**
	 * Enable timing controls when all frames match; disable + blank when mixed.
	 * Mixed display choice: blank (not the last uniform value).
	 */
	syncGlobalDurationMsControl() {
		const durations = this.#clipFramesElement?.getDurationsMs?.() ?? [];
		const hasFrames = durations.length > 0;
		const first = hasFrames ? durations[0] : null;
		const uniform = hasFrames && durations.every(duration => duration === first);

		if (this.#globalDurationMsInput) {
			if (!hasFrames) {
				this.#globalDurationMsInput.disabled = true;
				this.#globalDurationMsInput.value = '';
			} else if (uniform) {
				this.#lastUniformDurationMs = first;
				this.#globalDurationMsInput.disabled = false;
				this.#globalDurationMsInput.value = String(first);
			} else {
				this.#globalDurationMsInput.disabled = true;
				this.#globalDurationMsInput.value = '';
			}
		}
		if (this.#globalDurationMsApply) {
			this.#globalDurationMsApply.disabled = !hasFrames;
		}
	}

	updateStagingPreview() {
		const targetWidth = Number(document.getElementById('clip-editor-target-width').value) || DEFAULT_FRAME_WIDTH;
		const targetHeight = Number(document.getElementById('clip-editor-target-height').value) || DEFAULT_FRAME_HEIGHT;
		const playback = document.getElementById('clip-editor-playback').value;
		const scaleMode = document.getElementById('clip-editor-scale-mode').value;
		const placement = this.#readPlacementFromDom();
		const bakeConfigs = this.#clipFramesElement?.getBakeConfigs?.() ?? this.#stagedBakeConfigs;
		this.#stagingPreview.loadFrames(this.#stagedFiles, targetWidth, targetHeight, this.#previewDurationsMs(), playback, scaleMode, placement, bakeConfigs);
	}

	/**
	 * Show beat-sync controls when mode is beat; custom beats only for syncLength=custom.
	 */
	updateSyncFieldVisibility() {
		const sync = document.getElementById('clip-editor-sync')?.value ?? DEFAULT_SYNC_MODE;
		const beatFields = document.getElementById('clip-editor-sync-beat-fields');
		const customField = document.getElementById('clip-editor-sync-beats-field');
		const syncLength = document.getElementById('clip-editor-sync-length')?.value;
		if (beatFields) {
			beatFields.hidden = sync !== 'beat';
		}
		if (customField) {
			customField.hidden = sync !== 'beat' || syncLength !== 'custom';
		}
	}

	/**
	 * Fill `#clip-editor-sync-length` from shared `SYNC_LENGTH_PRESETS` (single source with validation).
	 */
	#populateSyncLengthOptions() {
		const select = document.getElementById('clip-editor-sync-length');
		if (!select) {
			return;
		}
		const previous = select.value;
		select.replaceChildren();
		for (const preset of SYNC_LENGTH_PRESETS) {
			const option = document.createElement('option');
			option.value = preset;
			option.textContent = preset;
			if (preset === DEFAULT_SYNC_LENGTH) {
				option.selected = true;
			}
			select.append(option);
		}
		if (previous && SYNC_LENGTH_PRESETS.includes(previous)) {
			select.value = previous;
		}
	}

	/**
	 * Free mode: staged ms. Beat mode: use base durations (engine handles per-frame timing via frameRatesForFrames).
	 * @returns {number[]}
	 */
	#previewDurationsMs() {
		const base = this.#stagedDurationsMs.length > 0 ? this.#stagedDurationsMs : this.#stagedFiles.map(() => DEFAULT_FRAME_DURATION_MS);
		if (this.#stagedFiles.length === 0) {
			return base;
		}
		const syncFields = this.#readSyncFieldsFromDom();
		if (syncFields.sync !== 'beat') {
			return base;
		}
		// Beat mode: engine handles per-frame timing via frameRatesForFrames and speed multiplier.
		// Preview uses base durations; sync validation ensures syncLength/syncBeats are valid.
		return base;
	}

	/**
	 * @returns {{ sync: string, syncLength: string, syncBeats: number|null, beatsPerBar: number }}
	 */
	#readSyncFieldsFromDom() {
		const sync = document.getElementById('clip-editor-sync')?.value === 'beat' ? 'beat' : 'free';
		const syncLength = document.getElementById('clip-editor-sync-length')?.value || '1 bar';
		const syncBeatsRaw = Number(document.getElementById('clip-editor-sync-beats')?.value);
		const beatsPerBarRaw = Number(document.getElementById('clip-editor-beats-per-bar')?.value);
		return {
			sync,
			syncLength,
			syncBeats: Number.isFinite(syncBeatsRaw) && syncBeatsRaw > 0 ? syncBeatsRaw : null,
			beatsPerBar: Number.isInteger(beatsPerBarRaw) && beatsPerBarRaw > 0 ? beatsPerBarRaw : DEFAULT_BEATS_PER_BAR
		};
	}

	#setFormDefaults() {
		const setValue = (id, value) => {
			const element = document.getElementById(id);
			if (element) {
				element.value = value;
			}
		};
		setValue('clip-editor-target-width', String(DEFAULT_FRAME_WIDTH));
		setValue('clip-editor-target-height', String(DEFAULT_FRAME_HEIGHT));
		setValue('clip-editor-scale-mode', DEFAULT_SCALE_MODE);
		setValue('clip-editor-placement-x', '0');
		setValue('clip-editor-placement-y', '0');
		setValue('clip-editor-playback', 'loop');
		const retrigger = document.getElementById('clip-editor-retrigger');
		if (retrigger) {
			retrigger.checked = true;
		}
		setValue('clip-editor-trigger-type', 'momentary');
		setValue('clip-editor-trigger-group', '');
		setValue('clip-editor-bit-depth', '1');
		setValue('clip-editor-sync', DEFAULT_SYNC_MODE);
		this.#populateSyncLengthOptions();
		setValue('clip-editor-sync-length', DEFAULT_SYNC_LENGTH);
		setValue('clip-editor-sync-beats', '');
		setValue('clip-editor-beats-per-bar', String(DEFAULT_BEATS_PER_BAR));
		this.updateSyncFieldVisibility();
	}

	#applyHydratedClip(clipId, framesResponse) {
		const editorValues = editorValuesFromMeta(framesResponse.meta);
		this.#editingClipId = clipId;
		this.#framesDirty = false;
		this.#clipIdInput.value = clipId;
		document.getElementById('clip-editor-name').value = editorValues.name;
		document.getElementById('clip-editor-role').value = editorValues.role;
		this.#loadedFrameWidth = editorValues.frameWidth;
		this.#loadedFrameHeight = editorValues.frameHeight;
		this.#loadedScaleMode = editorValues.scaleMode;
		document.getElementById('clip-editor-target-width').value = String(this.#loadedFrameWidth);
		document.getElementById('clip-editor-target-height').value = String(this.#loadedFrameHeight);
		document.getElementById('clip-editor-scale-mode').value = this.#loadedScaleMode;
		document.getElementById('clip-editor-placement-x').value = String(editorValues.placement.x);
		document.getElementById('clip-editor-placement-y').value = String(editorValues.placement.y);
		document.getElementById('clip-editor-playback').value = editorValues.playback;
		const retrigger = document.getElementById('clip-editor-retrigger');
		if (retrigger) {
			retrigger.checked = editorValues.retrigger;
		}
		const triggerType = document.getElementById('clip-editor-trigger-type');
		if (triggerType) {
			triggerType.value = editorValues.triggerType;
		}
		const triggerGroup = document.getElementById('clip-editor-trigger-group');
		if (triggerGroup) {
			triggerGroup.value = editorValues.triggerGroup;
		}
		const bitDepth = document.getElementById('clip-editor-bit-depth');
		if (bitDepth) {
			bitDepth.value = String(editorValues.bitDepth);
		}
		const sync = document.getElementById('clip-editor-sync');
		if (sync) {
			sync.value = editorValues.sync;
		}
		const syncLength = document.getElementById('clip-editor-sync-length');
		if (syncLength) {
			syncLength.value = editorValues.syncLength;
		}
		const syncBeats = document.getElementById('clip-editor-sync-beats');
		if (syncBeats) {
			syncBeats.value = editorValues.syncBeats !== null && editorValues.syncBeats !== undefined ? String(editorValues.syncBeats) : '';
		}
		const beatsPerBar = document.getElementById('clip-editor-beats-per-bar');
		if (beatsPerBar) {
			beatsPerBar.value = String(editorValues.beatsPerBar);
		}
		this.updateBitDepthVisibility();
		this.updateSyncFieldVisibility();
	}

	/**
	 * @returns {{ x: number, y: number }}
	 */
	#readPlacementFromDom() {
		return resolvePlacement({
			x: Number(document.getElementById('clip-editor-placement-x')?.value),
			y: Number(document.getElementById('clip-editor-placement-y')?.value)
		});
	}

	#readExtendedEditorFields() {
		const syncFields = this.#readSyncFieldsFromDom();
		if (syncFields.sync === 'beat' && syncFields.syncLength === 'custom' && syncFields.syncBeats === null) {
			return { error: 'Custom beats is required when sync length is custom' };
		}
		const values = {
			retrigger: document.getElementById('clip-editor-retrigger').checked,
			triggerType: document.getElementById('clip-editor-trigger-type').value,
			triggerGroup: document.getElementById('clip-editor-trigger-group').value.trim(),
			role: document.getElementById('clip-editor-role').value || undefined,
			bitDepth: Number(document.getElementById('clip-editor-bit-depth').value),
			sync: syncFields.sync,
			syncLength: syncFields.syncLength,
			syncBeats: syncFields.syncBeats,
			beatsPerBar: syncFields.beatsPerBar
		};
		return { optional: optionalMetaFromEditor(values), values };
	}
}

/**
 * @param {string} dataUrl
 * @param {string} filename
 * @returns {Promise<File>}
 */
async function dataUrlToFile(dataUrl, filename) {
	const response = await fetch(dataUrl);
	const blob = await response.blob();
	return new File([blob], filename, { type: blob.type || 'image/png' });
}

/**
 * @param {File[]} files
 * @returns {Promise<string[]>}
 */
function readFilesAsDataURLs(files) {
	return Promise.all(
		files.map(
			file =>
				new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(String(reader.result));
					reader.onerror = () => reject(reader.error);
					reader.readAsDataURL(file);
				})
		)
	);
}
