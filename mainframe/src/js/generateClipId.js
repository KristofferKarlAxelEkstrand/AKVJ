import { isValidClipId } from '../../shared/clipId.js';

const ALPHANUM = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const DEFAULT_LENGTH = 4;
const DEFAULT_MAX_ATTEMPTS_PER_LENGTH = 48;

/**
 * @param {Iterable<string|{clipId?: string}>|Set<string>} existingIds
 * @returns {Set<string>}
 */
function toIdSet(existingIds) {
	const set = new Set();
	if (!existingIds) {
		return set;
	}
	for (const entry of existingIds) {
		if (typeof entry === 'string') {
			set.add(entry);
		} else if (entry && typeof entry.clipId === 'string') {
			set.add(entry.clipId);
		}
	}
	return set;
}

/**
 * Slugify a display name to a full path-safe clip id (hyphenated, diacritics folded).
 * Example: "Jag är bäst" → "jag-ar-bast"
 * @param {unknown} name
 * @returns {string}
 */
export function slugifyClipName(name) {
	const slug = String(name ?? '')
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[øØ]/g, 'o')
		.replace(/[æÆ]/g, 'ae')
		.replace(/ß/g, 'ss')
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug;
}

/**
 * Ensure a slug is a valid clip id (not all-digit; starts with alnum).
 * @param {string} slug
 * @returns {string}
 */
function baseIdFromSlug(slug) {
	if (!slug) {
		return '';
	}
	if (/^\d+$/.test(slug)) {
		return `id-${slug}`;
	}
	return slug;
}

/**
 * @param {number} length
 * @param {() => number} random
 * @returns {string}
 */
function randomAlnum(length, random) {
	const chars = [];
	let hasLetter = false;
	for (let i = 0; i < length; i++) {
		const ch = ALPHANUM[Math.floor(random() * ALPHANUM.length)];
		if (ch >= 'a' && ch <= 'z') {
			hasLetter = true;
		}
		chars.push(ch);
	}
	if (!hasLetter) {
		chars[Math.floor(random() * length)] = LETTERS[Math.floor(random() * LETTERS.length)];
	}
	return chars.join('');
}

/**
 * Generate a path-safe clip ID.
 * With a name: full slugified name; collisions append `-2`, `-3`, …
 * Without a name: short random alnum (length grows if the short space is exhausted).
 *
 * @param {object} [options]
 * @param {string} [options.name] - Clip display name for derivation
 * @param {Iterable<string|{clipId?: string}>|Set<string>} [options.existingIds] - IDs already taken
 * @param {number} [options.maxAttemptsPerLength=48] - Random-path retries before growing length
 * @param {() => number} [options.random=Math.random] - RNG in [0, 1) for tests
 * @returns {string}
 */
export function generateClipId({ name = '', existingIds = [], maxAttemptsPerLength = DEFAULT_MAX_ATTEMPTS_PER_LENGTH, random = Math.random } = {}) {
	const taken = toIdSet(existingIds);
	const slug = slugifyClipName(name);

	if (slug) {
		const base = baseIdFromSlug(slug);
		if (isValidClipId(base) && !taken.has(base)) {
			return base;
		}
		for (let n = 2; ; n++) {
			const candidate = `${base}-${n}`;
			if (isValidClipId(candidate) && !taken.has(candidate)) {
				return candidate;
			}
		}
	}

	const attemptsCap = Number.isFinite(maxAttemptsPerLength) && maxAttemptsPerLength > 0 ? Math.floor(maxAttemptsPerLength) : DEFAULT_MAX_ATTEMPTS_PER_LENGTH;
	let length = DEFAULT_LENGTH;
	for (;;) {
		for (let attempt = 0; attempt < attemptsCap; attempt++) {
			const candidate = randomAlnum(length, random);
			if (isValidClipId(candidate) && !taken.has(candidate)) {
				return candidate;
			}
		}
		length += 1;
	}
}
