/**
 * key-map.json leaf shapes and override field validation.
 * Leaves are either a bare clipId string or `{ clipId, ...overrides }`.
 */

import { SYNC_MODES, SYNC_LENGTH_PRESETS, TRIGGER_TYPES } from './clipSchema.js';

/** Override keys allowed on mapping object leaves (akvj ClipLoader shallow-merges these). */
export const MAPPING_OVERRIDE_KEYS = Object.freeze(['triggerType', 'triggerGroup', 'sync', 'syncLength', 'syncBeats', 'beatsPerBar']);

/**
 * Parse a nested key-map leaf into clipId + optional overrides.
 * @param {unknown} leaf
 * @returns {{ ok: true, clipId: string, overrides: Record<string, unknown>|null } | { ok: false, error: string }}
 */
export function parseMappingLeaf(leaf) {
	if (typeof leaf === 'string') {
		return { ok: true, clipId: leaf, overrides: null };
	}
	if (leaf && typeof leaf === 'object' && !Array.isArray(leaf)) {
		const { clipId, ...rest } = leaf;
		if (typeof clipId !== 'string') {
			return { ok: false, error: `mapping object leaf must include string clipId, got ${JSON.stringify(leaf)}` };
		}
		const overrides = Object.keys(rest).length > 0 ? rest : null;
		return { ok: true, clipId, overrides };
	}
	return { ok: false, error: `mapping leaf must be a clipId string or object with clipId, got ${JSON.stringify(leaf)}` };
}

/**
 * Serialize flat entry back to a nested leaf (string or object).
 * @param {string} clipId
 * @param {Record<string, unknown>|null|undefined} overrides
 * @returns {string|Record<string, unknown>}
 */
export function serializeMappingLeaf(clipId, overrides) {
	if (!overrides || typeof overrides !== 'object' || Object.keys(overrides).length === 0) {
		return clipId;
	}
	return { clipId, ...overrides };
}

/**
 * Validate override fields on a mapping object leaf (same rules as meta.json subsets).
 * @param {Record<string, unknown>|null|undefined} overrides
 * @returns {string[]}
 */
export function collectMappingOverrideErrors(overrides) {
	if (overrides === null || overrides === undefined) {
		return [];
	}
	if (typeof overrides !== 'object' || Array.isArray(overrides)) {
		return ['overrides must be a plain object'];
	}

	const errors = [];
	for (const key of Object.keys(overrides)) {
		if (!MAPPING_OVERRIDE_KEYS.includes(key)) {
			errors.push(`unknown mapping override "${key}" (allowed: ${MAPPING_OVERRIDE_KEYS.join(', ')})`);
		}
	}

	if (overrides.triggerType !== undefined) {
		if (typeof overrides.triggerType !== 'string' || !TRIGGER_TYPES.includes(overrides.triggerType)) {
			errors.push(`triggerType must be one of ${TRIGGER_TYPES.join(', ')} (got ${overrides.triggerType})`);
		}
	}
	if (overrides.triggerGroup !== undefined && overrides.triggerGroup !== null && typeof overrides.triggerGroup !== 'string' && typeof overrides.triggerGroup !== 'number') {
		errors.push('triggerGroup must be a string, number, or null');
	}

	if (overrides.sync !== undefined) {
		if (typeof overrides.sync !== 'string' || !SYNC_MODES.includes(overrides.sync)) {
			errors.push(`sync must be one of: ${SYNC_MODES.join(', ')} (got ${overrides.sync})`);
		}
	}
	if (overrides.sync === 'beat' && overrides.syncLength === undefined) {
		errors.push('syncLength is required when sync is "beat"');
	}
	if (overrides.syncLength !== undefined) {
		if (typeof overrides.syncLength !== 'string' || !SYNC_LENGTH_PRESETS.includes(overrides.syncLength)) {
			errors.push(`syncLength must be one of: ${SYNC_LENGTH_PRESETS.join(', ')} (got ${overrides.syncLength})`);
		}
	}
	if (overrides.syncBeats !== undefined) {
		if (typeof overrides.syncBeats !== 'number' || overrides.syncBeats <= 0) {
			errors.push(`syncBeats must be a positive number (got ${overrides.syncBeats})`);
		}
	}
	if (overrides.beatsPerBar !== undefined) {
		if (typeof overrides.beatsPerBar !== 'number' || overrides.beatsPerBar <= 0 || !Number.isInteger(overrides.beatsPerBar)) {
			errors.push(`beatsPerBar must be a positive integer (got ${overrides.beatsPerBar})`);
		}
	}
	if (overrides.syncLength === 'custom' && (overrides.syncBeats === undefined || typeof overrides.syncBeats !== 'number' || overrides.syncBeats <= 0)) {
		errors.push('syncBeats is required when syncLength is "custom"');
	}

	return errors;
}

/**
 * Resolve clipId from a flat mapping entry that may use legacy `clipId` object mistake.
 * @param {object} entry
 * @returns {{ ok: true, clipId: string, overrides: Record<string, unknown>|null } | { ok: false, error: string }}
 */
export function parseFlatMappingEntry(entry) {
	if (!entry || typeof entry !== 'object') {
		return { ok: false, error: 'mapping entry must be an object' };
	}
	if (typeof entry.clipId === 'string') {
		const overrides =
			entry.overrides && typeof entry.overrides === 'object' && !Array.isArray(entry.overrides) && Object.keys(entry.overrides).length > 0
				? entry.overrides
				: null;
		return { ok: true, clipId: entry.clipId, overrides };
	}
	return parseMappingLeaf(entry.clipId);
}
