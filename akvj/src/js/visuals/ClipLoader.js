/**
 * ClipLoader - Loads clip assets via per-project key-map.json + clips.json catalog,
 * then builds the nested {channel: {note: {velocityThreshold: Clip}}} tree used by LayerGroup.
 * Project resolution is delegated to ProjectCatalog.
 */
import Clip from './Clip.js';
import settings from '../core/settings.js';
import { normalizeClipMetadata, SAFE_ID_PATTERN } from './clipMetadata.js';
import ProjectCatalog from './ProjectCatalog.js';

const DEFAULT_MAX_CONCURRENT_LOADS = 8;
const DEFAULT_PROJECT_ID = 'default';
const MAX_CLIP_FILENAME_LENGTH = 255;

/** Allowed key-map leaf override keys (mirrors mainframe/shared/mappingLeaf.js — no cross-package import). */
const MAPPING_OVERRIDE_KEYS = Object.freeze(['triggerType', 'triggerGroup', 'sync', 'syncLength', 'syncBeats', 'beatsPerBar']);

class ClipLoader {
	#projectCatalog;

	/**
	 * @param {ProjectCatalog} [projectCatalog] - Injected for testing; created internally by default
	 */
	constructor(projectCatalog) {
		this.#projectCatalog = projectCatalog ?? new ProjectCatalog();
	}

	/**
	 * Sanitize clip file name - prevents path traversal and ensures a safe filename.
	 * Hardened against additional malicious patterns including null bytes,
	 * consecutive dots, leading/trailing dots and spaces, and unicode attacks.
	 */
	#sanitizeFileName(filename) {
		if (!filename || typeof filename !== 'string') {
			return '';
		}

		// Reject null bytes and other control characters
		for (let i = 0; i < filename.length; i++) {
			const charCode = filename.charCodeAt(i);
			if (charCode <= 31 || charCode === 127) {
				console.warn('ClipLoader: invalid file name (contains control characters)', filename);
				return '';
			}
		}

		// Reject excessively long filenames (DoS protection)
		if (filename.length > MAX_CLIP_FILENAME_LENGTH) {
			console.warn('ClipLoader: invalid file name (exceeds maximum length)', filename);
			return '';
		}

		// Reject leading/trailing dots and spaces
		if (/^[.\s]|[.\s]$/.test(filename)) {
			console.warn('ClipLoader: invalid file name (has leading/trailing dots or spaces)', filename);
			return '';
		}

		// Reject consecutive dots (path traversal attempt)
		if (/\.\./.test(filename)) {
			console.warn('ClipLoader: invalid file name (contains consecutive dots)', filename);
			return '';
		}

		// Reject path separators
		if (/[/\\]/.test(filename)) {
			console.warn('ClipLoader: invalid file name (contains path separators)', filename);
			return '';
		}

		const filenameMatch = filename.match(/^([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?\.(png|jpg|jpeg|gif))$/i);
		if (!filenameMatch) {
			console.warn('ClipLoader: invalid file name (must be alphanumeric with .png/.jpg/.jpeg/.gif extension)', filename);
			return '';
		}
		return filenameMatch[1];
	}

	/**
	 * @param {string} clipId
	 * @returns {string}
	 */
	#sanitizeClipId(clipId) {
		if (!clipId || typeof clipId !== 'string' || !SAFE_ID_PATTERN.test(clipId) || /^\d+$/.test(clipId)) {
			console.warn('ClipLoader: invalid clipId', clipId);
			return '';
		}
		return clipId;
	}

	/**
	 * Load and parse JSON from URL
	 * @param {string} jsonUrl
	 * @returns {Promise<unknown>}
	 */
	async #loadJson(jsonUrl) {
		const fetchUrl = import.meta.env.DEV ? `${jsonUrl}?t=${performance.now()}` : jsonUrl;
		const response = await fetch(fetchUrl);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} for ${jsonUrl}`);
		}
		return response.json();
	}

	/**
	 * Load an image from a source URL
	 */
	#loadImage(imageUrl) {
		return new Promise((resolve, reject) => {
			const image = new Image();
			const crossOrigin = settings.performance?.imageCrossOrigin;
			if (crossOrigin !== null && crossOrigin !== undefined) {
				image.crossOrigin = crossOrigin;
			}
			image.onload = () => {
				if (!this.#validateImageDimensions(image)) {
					reject(new Error(`Image dimensions exceed safe bounds: ${image.width}x${image.height}`));
					return;
				}
				resolve(image);
			};
			image.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
			image.src = imageUrl;
		});
	}

	/**
	 * Validate image dimensions against security limits
	 * @param {HTMLImageElement} image
	 * @returns {boolean}
	 */
	#validateImageDimensions(image) {
		const { maxImageWidth, maxImageHeight, maxTotalPixels } = settings.performance;
		const { width, height } = image;

		if (width > maxImageWidth || height > maxImageHeight) {
			console.warn(`ClipLoader: image dimensions ${width}x${height} exceed maximum allowed ${maxImageWidth}x${maxImageHeight}`);
			return false;
		}

		const totalPixels = width * height;
		if (totalPixels > maxTotalPixels) {
			console.warn(`ClipLoader: image total pixels ${totalPixels} exceed maximum allowed ${maxTotalPixels}`);
			return false;
		}

		return true;
	}

	/**
	 * Create a Clip from clip metadata and loaded image
	 */
	#createClip(image, clipMetadata) {
		try {
			const normalized = normalizeClipMetadata(clipMetadata);
			return new Clip({
				image,
				frameCount: normalized.frames,
				framesPerRow: normalized.framesPerRow,
				playback: normalized.playback,
				frameRatesForFrames: normalized.frameRatesForFrames ?? undefined,
				frameDurationsMs: normalized.frameDurationsMs ?? undefined,
				syncBeats: normalized.syncBeats,
				retrigger: normalized.retrigger,
				bitDepth: normalized.bitDepth,
				triggerType: normalized.triggerType,
				triggerGroup: normalized.triggerGroup,
				scaleMode: normalized.scaleMode,
				scaling: normalized.scaling,
				placement: normalized.placement
			});
		} catch (error) {
			console.error(`ClipLoader: invalid clip metadata for image ${clipMetadata.png}:`, error);
			return null;
		}
	}

	/**
	 * Load a single mapped clip into a MIDI slot.
	 */
	async #loadMappedClip(dawChannel, note, velocityThreshold, clipId, clipMetadata, overrides = null, imageCache = new Map(), projectId = DEFAULT_PROJECT_ID) {
		const validation = this.#validateMappingEntry(dawChannel, note, velocityThreshold, clipId, clipMetadata, projectId);
		if (!validation) {
			return null;
		}
		const { safeClipId, imagePath, codeChannel } = validation;

		try {
			let imagePromise = imageCache.get(safeClipId);
			if (!imagePromise) {
				imagePromise = this.#loadImage(imagePath);
				imageCache.set(safeClipId, imagePromise);
			}
			const image = await imagePromise;
			const mergedMetadata = overrides ? { ...clipMetadata, ...overrides } : clipMetadata;
			const clip = this.#createClip(image, mergedMetadata);
			if (!clip) {
				return null;
			}
			return {
				channel: codeChannel,
				note: String(note),
				velocityThreshold: String(velocityThreshold),
				clip,
				clipId: safeClipId
			};
		} catch (error) {
			console.error(`Error loading clip ${safeClipId} for ${dawChannel}/${note}/${velocityThreshold}:`, error);
			return null;
		}
	}

	/**
	 * Validate a mapping entry and compute safe paths.
	 * @returns {{safeClipId: string, imagePath: string, codeChannel: string}|null}
	 */
	#validateMappingEntry(dawChannel, note, velocityThreshold, clipId, clipMetadata, projectId) {
		if (!this.#validateNumericKeys(dawChannel, note, velocityThreshold)) {
			return null;
		}
		const dawChannelNum = Number(dawChannel);
		if (!this.#validateChannelRange(dawChannelNum)) {
			return null;
		}
		const safeClipId = this.#sanitizeClipId(clipId);
		if (!safeClipId) {
			return null;
		}
		const sanitizedFilename = this.#sanitizeFileName(clipMetadata.png ?? `${safeClipId}.png`);
		if (!sanitizedFilename) {
			return null;
		}
		return this.#buildMappingResult(safeClipId, sanitizedFilename, dawChannelNum, projectId);
	}

	#validateNumericKeys(dawChannel, note, velocityThreshold) {
		if (!/^\d+$/.test(String(dawChannel)) || !/^\d+$/.test(String(note)) || !/^\d+$/.test(String(velocityThreshold))) {
			console.warn('ClipLoader: ignoring clip with non-numeric path keys', { channel: dawChannel, note, velocityThreshold });
			return false;
		}
		return true;
	}

	#validateChannelRange(dawChannelNum) {
		if (dawChannelNum < 1 || dawChannelNum > 16) {
			console.warn('ClipLoader: ignoring mapping with out-of-range DAW channel', dawChannelNum);
			return false;
		}
		return true;
	}

	#buildMappingResult(safeClipId, sanitizedFilename, dawChannelNum, projectId) {
		const normalizedBasePath = settings.performance.clipsBasePath.replace(/\/$/, '');
		const clipsPath = settings.performance.projectClipsPathTemplate.replace('{projectId}', projectId ?? DEFAULT_PROJECT_ID);
		const imagePath = `${normalizedBasePath}${clipsPath}/${safeClipId}/${sanitizedFilename}`;
		const codeChannel = String(dawChannelNum - 1);
		return { safeClipId, imagePath, codeChannel };
	}

	// ── Project resolution (delegated to ProjectCatalog) ──

	/**
	 * Fetch the active project ID. Delegates to ProjectCatalog.
	 * @returns {Promise<string|null>}
	 */
	async fetchActiveProjectId() {
		return this.#projectCatalog.fetchActiveProjectId();
	}

	/**
	 * Fetch the projects index. Delegates to ProjectCatalog.
	 * @returns {Promise<Array<{id: string, name: string}>>}
	 */
	async fetchProjectsIndex() {
		return this.#projectCatalog.fetchProjectsIndex();
	}

	/**
	 * Build the key-map URL for a specific project. Delegates to ProjectCatalog.
	 * @param {string} projectId
	 * @returns {string}
	 */
	buildProjectKeyMapUrl(projectId) {
		return this.#projectCatalog.buildProjectKeyMapUrl(projectId);
	}

	/**
	 * Build the clips.json URL for a specific project. Delegates to ProjectCatalog.
	 * @param {string} projectId
	 * @returns {string}
	 */
	buildProjectClipsJsonUrl(projectId) {
		return this.#projectCatalog.buildProjectClipsJsonUrl(projectId);
	}

	// ── Clip loading ──

	/**
	 * Load all clips from key map + flat catalog URLs.
	 * Uses the active project's clips.json + key-map when available.
	 * @param {string} [clipsJsonUrl] - Flat catalog URL (defaults to settings / active project)
	 * @param {string} [keyMapJsonUrl] - Key map URL (defaults to settings, overridden by active project)
	 * @returns {Promise<Object>} Nested clips object keyed by code channel/note/velocityThreshold
	 */
	async loadClips(clipsJsonUrl = settings.performance.clipsJsonUrl, keyMapJsonUrl = settings.performance.keyMapJsonUrl) {
		const activeProjectId = await this.fetchActiveProjectId();
		const effectiveKeyMapUrl = activeProjectId ? this.buildProjectKeyMapUrl(activeProjectId) : keyMapJsonUrl;
		const effectiveClipsUrl = activeProjectId ? this.buildProjectClipsJsonUrl(activeProjectId) : clipsJsonUrl;
		return this.#loadClipsFromKeyMap(effectiveClipsUrl, effectiveKeyMapUrl, activeProjectId ?? DEFAULT_PROJECT_ID);
	}

	/**
	 * Load clips from a specific project's key-map and clips catalog.
	 * Used for live project switching via MIDI.
	 * @param {string} projectId - Project ID to load
	 * @returns {Promise<Object>} Nested clips object keyed by code channel/note/velocityThreshold
	 */
	async loadClipsFromProject(projectId) {
		const keyMapUrl = this.buildProjectKeyMapUrl(projectId);
		const catalogUrl = this.buildProjectClipsJsonUrl(projectId);
		return this.#loadClipsFromKeyMap(catalogUrl, keyMapUrl, projectId);
	}

	/**
	 * Shared clip-loading path: fetch catalog + key-map, validate, build clip tree.
	 * @param {string} clipsJsonUrl
	 * @param {string} keyMapJsonUrl
	 * @param {string} projectId - Project the assets belong to (used for image paths)
	 * @returns {Promise<Object>}
	 */
	async #loadClipsFromKeyMap(clipsJsonUrl, keyMapJsonUrl, projectId) {
		const [clipsCatalog, keyMap] = await Promise.all([this.#loadJson(clipsJsonUrl), this.#loadJson(keyMapJsonUrl)]);

		if (import.meta.env.DEV) {
			console.log('JSON for clips loaded:', clipsCatalog);
			console.log('Key map loaded:', keyMap);
		}

		if (!keyMap || typeof keyMap !== 'object' || Array.isArray(keyMap)) {
			throw new Error('key-map.json must be a JSON object keyed by channel');
		}
		if (!clipsCatalog || typeof clipsCatalog !== 'object' || Array.isArray(clipsCatalog)) {
			throw new Error('clips.json must be a flat object keyed by clipId');
		}

		const imageCache = new Map();
		const loadTasks = this.#buildLoadTasks(keyMap, clipsCatalog, imageCache, projectId);
		const loadResults = await this.#runBatchedLoads(loadTasks);
		return this.#buildClipsObject(loadResults);
	}

	/**
	 * Build load tasks from the nested key map and the clip catalog.
	 * Supports two mapping value formats:
	 * - String: `"clipId"` (backward compatible)
	 * - Object: `{ clipId, triggerType?, triggerGroup?, sync?, syncLength?, syncBeats?, beatsPerBar? }`
	 * @param {Object} keyMap - Nested {channel: {note: {velocityThreshold: clipId|mappingObject}}}
	 * @param {Object} clipsCatalog - Flat clip metadata catalog
	 * @param {Map} imageCache - Shared per-load image promise cache
	 * @param {string} projectId - Project the assets belong to (used for image paths)
	 * @returns {Function[]} Array of async load functions
	 */
	#buildLoadTasks(keyMap, clipsCatalog, imageCache, projectId) {
		const loadTasks = [];
		const uniqueClips = new Set();
		const maxActiveClips = settings.performance?.maxActiveClips ?? 512;

		for (const [channel, notes] of Object.entries(keyMap)) {
			for (const [note, velocities] of Object.entries(notes)) {
				for (const [velocityThreshold, mappingValue] of Object.entries(velocities)) {
					const { clipId, overrides } = this.#parseMappingValue(mappingValue);

					if (!uniqueClips.has(clipId)) {
						if (uniqueClips.size >= maxActiveClips) {
							console.warn(`ClipLoader: reached maximum active clip limit (${maxActiveClips}) during task generation, skipping remaining clips`);
							return loadTasks;
						}
						uniqueClips.add(clipId);
					}

					const clipMetadata = clipsCatalog[clipId];
					if (!clipMetadata) {
						console.warn('ClipLoader: key-map references unknown clipId', clipId);
						continue;
					}
					loadTasks.push(() => this.#loadMappedClip(channel, note, velocityThreshold, clipId, clipMetadata, overrides, imageCache, projectId));
				}
			}
		}
		return loadTasks;
	}

	/**
	 * Parse a mapping value from key-map.json.
	 * Accepts both string (backward compatible) and object formats.
	 * Unknown override keys are dropped (allowlist matches mainframe MAPPING_OVERRIDE_KEYS).
	 * @param {string|Object} mappingValue - clipId string or { clipId, …overrides }
	 * @returns {{clipId: string, overrides: Object|null}}
	 */
	#parseMappingValue(mappingValue) {
		if (typeof mappingValue === 'string') {
			return { clipId: mappingValue, overrides: null };
		}
		if (mappingValue && typeof mappingValue === 'object' && typeof mappingValue.clipId === 'string') {
			const { clipId, ...rawOverrides } = mappingValue;
			const overrides = this.#filterMappingOverrides(rawOverrides);
			return { clipId, overrides };
		}
		return { clipId: String(mappingValue), overrides: null };
	}

	/**
	 * Keep only allowlisted mapping override keys; drop the rest.
	 * @param {Object} rawOverrides
	 * @returns {Object|null}
	 */
	#filterMappingOverrides(rawOverrides) {
		const filtered = {};
		const droppedKeys = [];
		for (const [key, value] of Object.entries(rawOverrides)) {
			if (MAPPING_OVERRIDE_KEYS.includes(key)) {
				filtered[key] = value;
			} else {
				droppedKeys.push(key);
			}
		}
		if (droppedKeys.length > 0 && import.meta.env.DEV) {
			console.warn('ClipLoader: dropped unknown mapping override keys', droppedKeys);
		}
		return Object.keys(filtered).length > 0 ? filtered : null;
	}

	/**
	 * Run load tasks in batches with a concurrency limit.
	 * @param {Function[]} loadTasks
	 * @returns {Promise<Array>}
	 */
	async #runBatchedLoads(loadTasks) {
		const maxConcurrentLoads = settings.performance?.maxConcurrentClipLoads ?? DEFAULT_MAX_CONCURRENT_LOADS;
		const loadResults = [];
		for (let i = 0; i < loadTasks.length; i += maxConcurrentLoads) {
			const loadBatch = loadTasks.slice(i, i + maxConcurrentLoads).map(loadTask => loadTask());
			const batchResults = await Promise.all(loadBatch);
			loadResults.push(...batchResults);
		}
		return loadResults;
	}

	/**
	 * Build the nested clips object from successful load results.
	 * Enforces maximum active clip limit to prevent resource exhaustion.
	 * @param {Array} loadResults
	 * @returns {Object}
	 */
	#buildClipsObject(loadResults) {
		const clips = {};
		const uniqueClips = new Set();
		const maxActiveClips = settings.performance?.maxActiveClips ?? 512;

		for (const loadResult of loadResults) {
			if (loadResult) {
				const { channel, note, velocityThreshold, clip, clipId } = loadResult;

				if (!uniqueClips.has(clipId)) {
					if (uniqueClips.size >= maxActiveClips) {
						console.warn(`ClipLoader: reached maximum active clip limit (${maxActiveClips}), skipping remaining clips`);
						clip.destroy?.();
						break;
					}
					uniqueClips.add(clipId);
				}

				clips[channel] ??= {};
				clips[channel][note] ??= {};
				clips[channel][note][velocityThreshold] = clip;
			}
		}

		if (uniqueClips.size >= maxActiveClips) {
			console.warn(`ClipLoader: loaded ${uniqueClips.size} unique clips (at maximum limit)`);
		}

		return clips;
	}

	/**
	 * Destroy loaded clips in an external clips object.
	 * @param {Object} clips
	 */
	destroyClips(clips) {
		if (!clips) {
			return;
		}

		for (const channel of Object.values(clips)) {
			for (const note of Object.values(channel)) {
				for (const clip of Object.values(note)) {
					try {
						if (clip && typeof clip.destroy === 'function') {
							clip.destroy();
						}
					} catch (error) {
						console.error('Failed to destroy clip:', error);
					}
				}
			}
		}
	}
}

export default ClipLoader;
