/**
 * Single source for turning a human display name into a path-safe id fragment.
 * Used for both clip ids (browser) and project ids (server).
 */

/**
 * Slugify a display name into a path-safe segment.
 * Folds diacritics ("Jag är bäst" → "jag-ar-bast"), turns separators into single
 * hyphens ("A_B C" → "a-b-c") and drops everything else.
 * @param {unknown} name
 * @returns {string}
 */
export function slugifyPathSegment(name) {
	return String(name ?? '')
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[øØ]/g, 'o')
		.replace(/[æÆ]/g, 'ae')
		.replace(/ß/g, 'ss')
		.toLowerCase()
		.trim()
		.replace(/[\s_]+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}
