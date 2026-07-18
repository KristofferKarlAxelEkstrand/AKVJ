import { api } from './apiClient.js';
import { generateClipId } from './generateClipId.js';
import { partitionImageFiles, formatSkippedFilesMessage, shouldAttemptGifExpand } from './acceptedImageFiles.js';
import { durationsMsToFrameRates, fpsToMs, DEFAULT_FALLBACK_FPS } from './frameTiming.js';
import { editClipPath, resolveClipEditRoute } from './clipEditorRoute.js';
import { editorValuesFromMeta, metaPatchFromEditor, optionalMetaFromEditor, parseFrameDurationBeats } from './editorMeta.js';
import { DEFAULT_BEATS_PER_BAR, DEFAULT_SYNC_MODE, SYNC_LENGTH_PRESETS } from './clipSchema.js';
import { expandSyncToFrameDurationBeats, frameDurationBeatsToPreviewMs } from './syncTiming.js';
import mainframeState, { messages } from './mainframeState.js';

const FPS_PRESETS = [6, 12, 15, 24, 25, 30];
/** Default length preset when beat-synced (must be in SYNC_LENGTH_PRESETS). */
const DEFAULT_SYNC_LENGTH = '1 bar';

/**
 * Owns shared clip editor staging state, hydrate, and create/update submit branching.
 * DOM ids match the upload panel in `index.html`.
 */
export class ClipEditorController {
	/** @type {File[]} */
	#stagedFiles = [];
	/** @type {number[]} */
	#stagedDurationsMs = [];
	/** @type {string[]} */
	#stagedFrameUrls = [];
	/** @type {string|null} */
	#editingClipId = null;
	#framesDirty = false;
	#loadedFrameWidth = 240;
	#loadedFrameHeight = 135;
	#loadedScaleMode = 'fit';
	#hydrateGeneration = 0;
	/** Last uniform per-frame duration (ms); used when re-applying after a mixed state. */
	#lastUniformDurationMs = 1000;
	/** Last FPS preset used for Apply FPS. */
	#lastFpsPreset = DEFAULT_FALLBACK_FPS;
	#globalDurationInput;
	#globalDurationApply;
	#fpsPresetSelect;
	#fpsPresetApply;

	/**
	 * @param {object} options
	 * @param {(statusElement: HTMLElement, message: string, kind?: string) => void} options.setStatus
	 * @param {() => Promise<void>} options.onLibraryChanged
	 * @param {{ navigate: Function, replace: Function }} options.router
	 */
	constructor({ setStatus, onLibraryChanged, router }) {
		this.#setStatus = setStatus;
		this.#onLibraryChanged = onLibraryChanged;
		this.#router = router;

		this.#uploadForm = document.getElementById('upload-form');
		this.#dropZone = document.getElementById('drop-zone');
		this.#fileInput = document.getElementById('upload-files');
		this.#fileListContainer = document.getElementById('file-list');
		this.#uploadClipIdInput = document.getElementById('upload-clip-id');
		this.#uploadClipIdHint = document.getElementById('upload-clip-id-hint');
		this.#clipEditorHeading = document.getElementById('clip-editor-heading');
		this.#uploadSubmitButton = document.getElementById('upload-submit');
		this.#clipFramesElement = document.getElementById('clip-frames');
		this.#stagingPreview = document.getElementById('staging-preview');
		this.#statusElement = document.getElementById('upload-status');
		this.#globalDurationInput = document.getElementById('clip-frames-global-duration');
		this.#globalDurationApply = document.getElementById('clip-frames-set-all-duration');
		this.#fpsPresetSelect = document.getElementById('clip-frames-fps-preset');
		this.#fpsPresetApply = document.getElementById('clip-frames-apply-fps-preset');
	}

	#setStatus;
	#onLibraryChanged;
	#router;
	#uploadForm;
	#dropZone;
	#fileInput;
	#fileListContainer;
	#uploadClipIdInput;
	#uploadClipIdHint;
	#clipEditorHeading;
	#uploadSubmitButton;
	#clipFramesElement;
	#stagingPreview;
	#statusElement;

	/** Wire DOM listeners once after construction. */
	bind() {
		this.reset();
		this.updateBitDepthVisibility();
		this.#populateSyncLengthOptions();
		this.updateSyncFieldVisibility();

		document.getElementById('upload-role').addEventListener('change', () => this.updateBitDepthVisibility());
		document.getElementById('clip-editor-new').addEventListener('click', () => {
			this.#router.navigate('/clip/edit');
		});
		document.getElementById('clip-frames-clear').addEventListener('click', () => {
			this.clearStagedFrames();
			this.#clipFramesElement.clearAll();
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

		for (const id of ['upload-target-width', 'upload-target-height', 'upload-playback', 'upload-scale-mode']) {
			document.getElementById(id).addEventListener('change', () => this.updateStagingPreview());
		}

		for (const id of ['upload-sync', 'upload-sync-length', 'upload-sync-beats', 'upload-beats-per-bar']) {
			const element = document.getElementById(id);
			if (!element) {
				continue;
			}
			element.addEventListener('change', () => {
				this.updateSyncFieldVisibility();
				this.updateStagingPreview();
			});
			if (id === 'upload-sync-beats' || id === 'upload-beats-per-bar') {
				element.addEventListener('input', () => this.updateStagingPreview());
			}
		}

		document.getElementById('upload-name').addEventListener('namechange', () => {
			this.refreshGeneratedClipId();
		});

		this.#clipFramesElement.addEventListener('framesreordered', event => {
			const order = event.detail.indices;
			this.#stagedFiles = order.map(originalIndex => this.#stagedFiles[originalIndex]);
			this.#stagedFrameUrls = order.map(originalIndex => this.#stagedFrameUrls[originalIndex]);
			this.#stagedDurationsMs = order.map(originalIndex => this.#stagedDurationsMs[originalIndex] ?? 1000);
			this.#framesDirty = true;
			this.syncGlobalDurationControl();
			this.updateStagingPreview();
		});
		this.#clipFramesElement.addEventListener('durationchange', () => {
			this.#stagedDurationsMs = this.#clipFramesElement.getDurations();
			this.#framesDirty = true;
			this.syncGlobalDurationControl();
			this.updateStagingPreview();
		});
		this.#clipFramesElement.addEventListener('frameremove', event => {
			const index = event.detail.frameIndex;
			this.#stagedFiles.splice(index, 1);
			this.#stagedDurationsMs.splice(index, 1);
			if (this.#stagedFrameUrls[index]) {
				URL.revokeObjectURL(this.#stagedFrameUrls[index]);
				this.#stagedFrameUrls.splice(index, 1);
			}
			this.#framesDirty = true;
			this.renderFileList();
		});
		this.#clipFramesElement.addEventListener('framescleared', () => {
			this.clearStagedFrames();
		});

		this.#globalDurationApply?.addEventListener('click', () => {
			this.applyGlobalDurationToAllFrames();
		});
		this.#fpsPresetApply?.addEventListener('click', () => {
			this.applyFpsPresetToAllFrames();
		});

		this.#uploadForm.addEventListener('submit', event => {
			event.preventDefault();
			this.submit().catch(error => {
				this.#reportOutcome('error', error.message);
			});
		});
	}

	/**
	 * Clear progressive panel status (`#upload-status`). Outcomes use `messages.*` instead.
	 */
	#clearProgressStatus() {
		this.#setStatus(this.#statusElement, '');
	}

	/**
	 * End in-progress status and show a modal outcome via `<user-messages>`.
	 * @param {'error'|'warn'|'info'} kind
	 * @param {string} text
	 */
	#reportOutcome(kind, text) {
		this.#clearProgressStatus();
		if (kind === 'error') {
			messages.error(text);
		} else if (kind === 'warn') {
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
		this.#loadedFrameWidth = 240;
		this.#loadedFrameHeight = 135;
		this.#loadedScaleMode = 'fit';
		this.#uploadForm.reset();
		this.#setFormDefaults();
		this.updateBitDepthVisibility();
		this.clearStagedFrames();
		this.#framesDirty = false;
		this.resetUploadClipId();
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
			const data = await api(`/clips/${encodeURIComponent(resolved.clipId)}/frames`);
			if (generation !== this.#hydrateGeneration) {
				return;
			}
			if (!Array.isArray(data.frames) || data.frames.length === 0) {
				throw new Error(`Clip "${resolved.clipId}" has no editable frames`);
			}
			this.#applyHydratedClip(resolved.clipId, data);

			const files = await Promise.all(data.frames.map((frameDataUrl, index) => dataUrlToFile(frameDataUrl, `frame-${String(index).padStart(4, '0')}.png`)));
			if (generation !== this.#hydrateGeneration) {
				return;
			}
			for (const url of this.#stagedFrameUrls) {
				URL.revokeObjectURL(url);
			}
			this.#stagedFiles = files;
			this.#stagedDurationsMs = (data.durationsMs || []).map(ms => Number(ms) || 1000);
			while (this.#stagedDurationsMs.length < this.#stagedFiles.length) {
				this.#stagedDurationsMs.push(1000);
			}
			this.#framesDirty = false;
			this.updateEditorChrome();
			this.renderFileList();
			this.#framesDirty = false;
			this.#reportOutcome(
				'info',
				`Loaded ${this.#stagedFiles.length} frame${this.#stagedFiles.length === 1 ? '' : 's'} from ${data.source === 'raw' ? 'raw' : 'sprite'}`
			);
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
		this.#setStatus(this.#statusElement, this.#editingClipId ? 'Saving…' : 'Uploading…');
		try {
			const name = document.getElementById('upload-name').value || undefined;
			const clipId = this.#uploadClipIdInput.value.trim();
			if (!clipId) {
				this.#reportOutcome('error', 'Clip ID is required');
				return;
			}
			const role = document.getElementById('upload-role').value || undefined;
			const targetWidth = Number(document.getElementById('upload-target-width').value) || undefined;
			const targetHeight = Number(document.getElementById('upload-target-height').value) || undefined;
			const playback = document.getElementById('upload-playback').value;
			const scaleMode = document.getElementById('upload-scale-mode').value;
			const frameDurations = this.#clipFramesElement.getDurations();
			const extended = this.#readExtendedEditorFields();
			if (extended.error) {
				this.#reportOutcome('error', extended.error);
				return;
			}
			const sizeOrScaleChanged =
				Number(targetWidth) !== this.#loadedFrameWidth || Number(targetHeight) !== this.#loadedFrameHeight || scaleMode !== this.#loadedScaleMode;

			if (this.#editingClipId) {
				if (this.#framesDirty || sizeOrScaleChanged) {
					const frames = await readFilesAsDataURLs(this.#stagedFiles);
					await api(`/clips/${encodeURIComponent(this.#editingClipId)}/frames`, {
						method: 'PUT',
						body: JSON.stringify({
							name,
							role,
							frames,
							frameDurations,
							targetWidth,
							targetHeight,
							playback,
							scaleMode,
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
								frameRatesForFrames: durationsMsToFrameRates(frameDurations),
								retrigger: extended.values.retrigger,
								triggerType: extended.values.triggerType,
								triggerGroup: extended.values.triggerGroup,
								bitDepth: extended.values.bitDepth,
								frameDurationBeats: extended.frameDurationBeats,
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
						frameDurations,
						targetWidth,
						targetHeight,
						playback,
						scaleMode,
						...extended.optional
					})
				});
				this.#reportOutcome('info', `Saved clip ${clipId}`);
				this.#editingClipId = clipId;
				this.#framesDirty = false;
				this.#loadedFrameWidth = Number(targetWidth) || 240;
				this.#loadedFrameHeight = Number(targetHeight) || 135;
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
					const expandedDurations = result.durationsMs.map(ms => Number(ms) || fpsToMs(12));
					this.#stagedFiles = [...this.#stagedFiles, ...expandedFiles];
					this.#stagedDurationsMs = [...this.#stagedDurationsMs, ...expandedDurations];
					this.#framesDirty = true;
					this.renderFileList();
					this.#reportOutcome('info', `Expanded animated GIF into ${expandedFiles.length} frames`);
					return;
				}
			} catch (error) {
				this.#reportOutcome('error', error.message);
				return;
			}
		}

		this.#stagedFiles = [...this.#stagedFiles, ...accepted];
		this.#stagedDurationsMs = [...this.#stagedDurationsMs, ...accepted.map(() => 1000)];
		this.#framesDirty = true;
		this.renderFileList();
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
		this.#framesDirty = true;
		this.renderFileList();
	}

	/**
	 * Regenerate the clip ID from the current name while creating a new clip.
	 * No-ops when editing an existing clip (ID is immutable after first save).
	 */
	refreshGeneratedClipId() {
		if (this.#editingClipId) {
			return;
		}
		const name = document.getElementById('upload-name')?.value ?? '';
		this.#uploadClipIdInput.value = generateClipId({
			name,
			existingIds: mainframeState.clips
		});
	}

	resetUploadClipId() {
		this.refreshGeneratedClipId();
		this.#uploadClipIdInput.readOnly = false;
	}

	updateEditorChrome() {
		if (this.#editingClipId) {
			this.#clipEditorHeading.textContent = `Edit clip: ${this.#editingClipId}`;
			this.#clipEditorHeading.hidden = false;
			this.#uploadClipIdHint.textContent = '(read-only)';
			this.#uploadClipIdInput.readOnly = true;
			this.#uploadSubmitButton.textContent = 'Save clip';
		} else {
			this.#clipEditorHeading.textContent = '';
			this.#clipEditorHeading.hidden = true;
			this.#uploadClipIdHint.textContent = '(editable until first save)';
			this.#uploadClipIdInput.readOnly = false;
			this.#uploadSubmitButton.textContent = 'Create sprite & save';
		}
	}

	updateBitDepthVisibility() {
		const bitDepthField = document.getElementById('upload-bit-depth-field');
		const roleSelect = document.getElementById('upload-role');
		if (!bitDepthField || !roleSelect) {
			return;
		}
		bitDepthField.hidden = roleSelect.value !== 'bitmask';
	}

	renderFileList() {
		this.#fileListContainer.replaceChildren();
		if (this.#stagedFiles.length === 0) {
			this.#stagedDurationsMs = [];
			this.#stagingPreview.loadFrames([]);
			this.#clipFramesElement.loadFrames([]);
			return;
		}
		for (const file of this.#stagedFiles) {
			const item = document.createElement('div');
			item.className = 'file-list-item';
			const name = document.createElement('span');
			name.textContent = file.name;
			const size = document.createElement('span');
			size.textContent = `${(file.size / 1024).toFixed(1)} KB`;
			item.append(name, size);
			this.#fileListContainer.append(item);
		}
		const count = document.createElement('p');
		count.className = 'file-list-item';
		count.style.fontWeight = 'bold';
		count.textContent = `${this.#stagedFiles.length} frame${this.#stagedFiles.length === 1 ? '' : 's'} staged`;
		this.#fileListContainer.append(count);
		this.updateClipFrames();
		this.updateStagingPreview();
	}

	updateClipFrames() {
		for (const url of this.#stagedFrameUrls) {
			URL.revokeObjectURL(url);
		}
		this.#stagedFrameUrls = this.#stagedFiles.map(file => URL.createObjectURL(file));
		const frames = this.#stagedFrameUrls.map((src, index) => ({
			src,
			duration: this.#stagedDurationsMs[index] ?? 1000
		}));
		this.#clipFramesElement.loadFrames(frames);
		this.syncGlobalDurationControl();
	}

	/**
	 * Apply the global ms field to every staged frame (reset path back to uniform).
	 * When the field is blank/disabled (mixed), falls back to the last uniform value.
	 */
	applyGlobalDurationToAllFrames() {
		if (!this.#clipFramesElement || this.#clipFramesElement.frameCount === 0) {
			return;
		}
		const raw = Number(this.#globalDurationInput?.value);
		const ms = Number.isFinite(raw) && raw > 0 ? raw : this.#lastUniformDurationMs;
		this.#clipFramesElement.setAllDurations(ms);
		this.#stagedDurationsMs = this.#clipFramesElement.getDurations();
		this.#framesDirty = true;
		this.syncGlobalDurationControl();
		this.updateStagingPreview();
	}

	/**
	 * Apply an FPS preset as uniform per-frame ms (same path as Set all / setAllDurations).
	 */
	applyFpsPresetToAllFrames() {
		if (!this.#clipFramesElement || this.#clipFramesElement.frameCount === 0) {
			return;
		}
		const raw = Number(this.#fpsPresetSelect?.value);
		const fps = Number.isFinite(raw) && raw > 0 ? raw : this.#lastFpsPreset;
		const ms = fpsToMs(fps);
		this.#lastFpsPreset = fps;
		this.#clipFramesElement.setAllDurations(ms);
		this.#stagedDurationsMs = this.#clipFramesElement.getDurations();
		this.#framesDirty = true;
		this.syncGlobalDurationControl();
		this.updateStagingPreview();
	}

	/**
	 * Enable timing controls when all frames match; disable + blank when mixed.
	 * Mixed display choice: blank (not the last uniform value).
	 */
	syncGlobalDurationControl() {
		const durations = this.#clipFramesElement?.getDurations?.() ?? [];
		const hasFrames = durations.length > 0;
		const first = hasFrames ? durations[0] : null;
		const uniform = hasFrames && durations.every(duration => duration === first);

		if (this.#globalDurationInput) {
			if (!hasFrames) {
				this.#globalDurationInput.disabled = true;
				this.#globalDurationInput.value = '';
			} else if (uniform) {
				this.#lastUniformDurationMs = first;
				this.#globalDurationInput.disabled = false;
				this.#globalDurationInput.value = String(first);
			} else {
				this.#globalDurationInput.disabled = true;
				this.#globalDurationInput.value = '';
			}
		}
		if (this.#globalDurationApply) {
			this.#globalDurationApply.disabled = !hasFrames;
		}

		if (this.#fpsPresetSelect) {
			if (!hasFrames || !uniform) {
				this.#fpsPresetSelect.disabled = !hasFrames || !uniform;
				this.#fpsPresetSelect.value = '';
			} else {
				this.#fpsPresetSelect.disabled = false;
				const match = FPS_PRESETS.find(fps => Math.round(fpsToMs(fps)) === Math.round(first));
				if (match) {
					this.#fpsPresetSelect.value = String(match);
					this.#lastFpsPreset = match;
				} else {
					this.#fpsPresetSelect.value = '';
				}
			}
		}
		if (this.#fpsPresetApply) {
			this.#fpsPresetApply.disabled = !hasFrames;
		}
	}

	updateStagingPreview() {
		const targetWidth = Number(document.getElementById('upload-target-width').value) || 240;
		const targetHeight = Number(document.getElementById('upload-target-height').value) || 135;
		const playback = document.getElementById('upload-playback').value;
		const scaleMode = document.getElementById('upload-scale-mode').value;
		this.#stagingPreview.loadFrames(
			this.#stagedFiles,
			targetWidth,
			targetHeight,
			DEFAULT_FALLBACK_FPS,
			playback,
			scaleMode,
			this.#previewDurationsMs()
		);
	}

	/**
	 * Show beat-sync controls when mode is beat; custom beats only for syncLength=custom.
	 */
	updateSyncFieldVisibility() {
		const sync = document.getElementById('upload-sync')?.value ?? DEFAULT_SYNC_MODE;
		const beatFields = document.getElementById('upload-sync-beat-fields');
		const customField = document.getElementById('upload-sync-beats-field');
		const syncLength = document.getElementById('upload-sync-length')?.value;
		if (beatFields) {
			beatFields.hidden = sync !== 'beat';
		}
		if (customField) {
			customField.hidden = sync !== 'beat' || syncLength !== 'custom';
		}
	}

	/**
	 * Fill `#upload-sync-length` from shared `SYNC_LENGTH_PRESETS` (single source with validation).
	 */
	#populateSyncLengthOptions() {
		const select = document.getElementById('upload-sync-length');
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
	 * Free mode: staged ms. Beat mode: expand sync → beats → preview ms @ 120 BPM.
	 * @returns {number[]}
	 */
	#previewDurationsMs() {
		const base =
			this.#stagedDurationsMs.length > 0
				? this.#stagedDurationsMs
				: this.#stagedFiles.map(() => 1000);
		if (this.#stagedFiles.length === 0) {
			return base;
		}
		const syncFields = this.#readSyncFieldsFromDom();
		if (syncFields.sync !== 'beat') {
			return base;
		}
		const frames = this.#stagedFiles.length;
		const beats = expandSyncToFrameDurationBeats(
			{
				sync: 'beat',
				syncLength: syncFields.syncLength,
				syncBeats: syncFields.syncBeats,
				beatsPerBar: syncFields.beatsPerBar,
				frameRatesForFrames: durationsMsToFrameRates(base)
			},
			frames
		);
		if (!beats) {
			return base;
		}
		return frameDurationBeatsToPreviewMs(beats);
	}

	/**
	 * @returns {{ sync: string, syncLength: string, syncBeats: number|null, beatsPerBar: number }}
	 */
	#readSyncFieldsFromDom() {
		const sync = document.getElementById('upload-sync')?.value === 'beat' ? 'beat' : 'free';
		const syncLength = document.getElementById('upload-sync-length')?.value || '1 bar';
		const syncBeatsRaw = Number(document.getElementById('upload-sync-beats')?.value);
		const beatsPerBarRaw = Number(document.getElementById('upload-beats-per-bar')?.value);
		return {
			sync,
			syncLength,
			syncBeats: Number.isFinite(syncBeatsRaw) && syncBeatsRaw > 0 ? syncBeatsRaw : null,
			beatsPerBar:
				Number.isInteger(beatsPerBarRaw) && beatsPerBarRaw > 0 ? beatsPerBarRaw : DEFAULT_BEATS_PER_BAR
		};
	}

	#setFormDefaults() {
		const setValue = (id, value) => {
			const element = document.getElementById(id);
			if (element) {
				element.value = value;
			}
		};
		setValue('upload-target-width', '240');
		setValue('upload-target-height', '135');
		setValue('upload-scale-mode', 'fit');
		setValue('upload-playback', 'loop');
		setValue('clip-frames-fps-preset', String(DEFAULT_FALLBACK_FPS));
		const retrigger = document.getElementById('upload-retrigger');
		if (retrigger) {
			retrigger.checked = true;
		}
		setValue('upload-trigger-type', 'momentary');
		setValue('upload-trigger-group', '');
		setValue('upload-bit-depth', '1');
		setValue('upload-frame-duration-beats', '');
		setValue('upload-sync', DEFAULT_SYNC_MODE);
		this.#populateSyncLengthOptions();
		setValue('upload-sync-length', DEFAULT_SYNC_LENGTH);
		setValue('upload-sync-beats', '');
		setValue('upload-beats-per-bar', String(DEFAULT_BEATS_PER_BAR));
		this.updateSyncFieldVisibility();
	}

	#applyHydratedClip(clipId, data) {
		const editorValues = editorValuesFromMeta(data.meta);
		this.#editingClipId = clipId;
		this.#framesDirty = false;
		this.#uploadClipIdInput.value = clipId;
		document.getElementById('upload-name').value = editorValues.name;
		document.getElementById('upload-role').value = editorValues.role;
		this.#loadedFrameWidth = editorValues.frameWidth;
		this.#loadedFrameHeight = editorValues.frameHeight;
		this.#loadedScaleMode = editorValues.scaleMode;
		document.getElementById('upload-target-width').value = String(this.#loadedFrameWidth);
		document.getElementById('upload-target-height').value = String(this.#loadedFrameHeight);
		document.getElementById('upload-scale-mode').value = this.#loadedScaleMode;
		document.getElementById('upload-playback').value = editorValues.playback;
		const retrigger = document.getElementById('upload-retrigger');
		if (retrigger) {
			retrigger.checked = editorValues.retrigger;
		}
		const triggerType = document.getElementById('upload-trigger-type');
		if (triggerType) {
			triggerType.value = editorValues.triggerType;
		}
		const triggerGroup = document.getElementById('upload-trigger-group');
		if (triggerGroup) {
			triggerGroup.value = editorValues.triggerGroup;
		}
		const bitDepth = document.getElementById('upload-bit-depth');
		if (bitDepth) {
			bitDepth.value = String(editorValues.bitDepth);
		}
		const beats = document.getElementById('upload-frame-duration-beats');
		if (beats) {
			beats.value = editorValues.frameDurationBeatsText;
		}
		const sync = document.getElementById('upload-sync');
		if (sync) {
			sync.value = editorValues.sync;
		}
		const syncLength = document.getElementById('upload-sync-length');
		if (syncLength) {
			syncLength.value = editorValues.syncLength;
		}
		const syncBeats = document.getElementById('upload-sync-beats');
		if (syncBeats) {
			syncBeats.value = editorValues.syncBeats !== null && editorValues.syncBeats !== undefined ? String(editorValues.syncBeats) : '';
		}
		const beatsPerBar = document.getElementById('upload-beats-per-bar');
		if (beatsPerBar) {
			beatsPerBar.value = String(editorValues.beatsPerBar);
		}
		this.updateBitDepthVisibility();
		this.updateSyncFieldVisibility();
	}

	#readExtendedEditorFields() {
		const beatsParsed = parseFrameDurationBeats(document.getElementById('upload-frame-duration-beats').value);
		if (!beatsParsed.ok) {
			return { error: beatsParsed.error };
		}
		const syncFields = this.#readSyncFieldsFromDom();
		if (syncFields.sync === 'beat' && syncFields.syncLength === 'custom' && syncFields.syncBeats === null) {
			return { error: 'Custom beats is required when sync length is custom' };
		}
		const values = {
			retrigger: document.getElementById('upload-retrigger').checked,
			triggerType: document.getElementById('upload-trigger-type').value,
			triggerGroup: document.getElementById('upload-trigger-group').value.trim(),
			role: document.getElementById('upload-role').value || undefined,
			bitDepth: Number(document.getElementById('upload-bit-depth').value),
			frameDurationBeats: beatsParsed.value,
			sync: syncFields.sync,
			syncLength: syncFields.syncLength,
			syncBeats: syncFields.syncBeats,
			beatsPerBar: syncFields.beatsPerBar
		};
		return { optional: optionalMetaFromEditor(values), values, frameDurationBeats: beatsParsed.value };
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
