/**
 * Centralized still-image acceptance for clip upload (MIME + extension).
 * Add new formats here so drop-zone, file picker, and filters stay in sync.
 */

/** @type {ReadonlySet<string>} */
export const ACCEPTED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif']);

/** @type {ReadonlySet<string>} */
export const ACCEPTED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif']);

/** Value for `<input accept="…">` and related copy. */
export const ACCEPTED_IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,.png,.jpg,.jpeg,.gif';

/** Short human label for drop-zone / status copy. */
export const ACCEPTED_IMAGE_LABEL = 'PNG, JPG, or GIF';

/**
 * @param {string} [filename]
 * @returns {string} Lowercase extension including the dot, or empty string
 */
export function getFileExtension(filename) {
	const name = String(filename ?? '');
	const dot = name.lastIndexOf('.');
	return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

/**
 * @param {File|{name?: string, type?: string}|null|undefined} file
 * @returns {boolean}
 */
export function isAcceptedImageFile(file) {
	if (!file) {
		return false;
	}
	const mime = String(file.type ?? '')
		.toLowerCase()
		.trim();
	if (ACCEPTED_IMAGE_MIME_TYPES.has(mime)) {
		return true;
	}
	return ACCEPTED_IMAGE_EXTENSIONS.has(getFileExtension(file.name));
}

/**
 * Split a FileList / File array into accepted stills vs rejected files.
 * @param {FileList|Iterable<File>|ArrayLike<File>|null|undefined} fileList
 * @returns {{ accepted: File[], rejected: File[] }}
 */
export function partitionImageFiles(fileList) {
	const accepted = [];
	const rejected = [];
	if (!fileList) {
		return { accepted, rejected };
	}
	for (const file of fileList) {
		if (isAcceptedImageFile(file)) {
			accepted.push(file);
		} else {
			rejected.push(file);
		}
	}
	return { accepted, rejected };
}

/**
 * Status text listing skipped unsupported files.
 * @param {Array<{name?: string}>} rejected
 * @returns {string}
 */
export function formatSkippedFilesMessage(rejected) {
	if (!rejected?.length) {
		return '';
	}
	const names = rejected.map(file => file.name || '(unnamed)').join(', ');
	const noun = rejected.length === 1 ? 'file' : 'files';
	return `Skipped unsupported ${noun}: ${names}`;
}

/**
 * @param {File|{name?: string, type?: string}|null|undefined} file
 * @returns {boolean}
 */
export function isGifFile(file) {
	if (!file) {
		return false;
	}
	const mime = String(file.type ?? '')
		.toLowerCase()
		.trim();
	if (mime === 'image/gif') {
		return true;
	}
	return getFileExtension(file.name) === '.gif';
}

/**
 * Lone-GIF batch eligible for animated expand (animation confirmed server-side).
 * @param {Array<File|{name?: string, type?: string}>} acceptedFiles
 * @returns {boolean}
 */
export function shouldAttemptGifExpand(acceptedFiles) {
	return Array.isArray(acceptedFiles) && acceptedFiles.length === 1 && isGifFile(acceptedFiles[0]);
}
