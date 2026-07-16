/**
 * Protocol tagging for MIDI specification documents.
 *
 * Every document in the knowledge base is tagged with exactly one protocol
 * family so agents can filter searches ("midi1" vs "midi2" vs "web-midi").
 */

export const PROTOCOLS = Object.freeze(['midi1', 'midi2', 'web-midi', 'general']);

const WEB_MIDI_PATTERN = /web[\s_-]?midi/i;

const MIDI2_DOC_ID_PATTERN = /(^|[\s_-])m2-\d/i;

const MIDI2_PATTERN = /(^|[\s_-])m2-\d|universal[\s_-]?midi[\s_-]?packet|(^|[\s_-])ump([\s_-]|$)|midi[\s_-]?ci([\s_-]|$)|midi[\s_-]?2|property[\s_-]?exchange/i;

const MIDI1_PATTERN = /(^|[\s_-])m1[\s_-]|midi[\s_-]?1|(^|[\s_-])ca-?\d+|(^|[\s_-])rp-?\d+|rfc[\s_-]?6295|rtp[\s_-]?midi|control[\s_-]?change|sys[\s_-]?ex|system[\s_-]?exclusive|general[\s_-]?midi|(^|[\s_-])gml?([\s_-]|$)|standard[\s_-]?midi[\s_-]?file|(^|[\s_-])smf([\s_-]|$)|time[\s_-]?code|machine[\s_-]?control|show[\s_-]?control|tuning|midi10|midi[\s_-]?chart|messages|dls|downloadable[\s_-]?sounds|instrument[\s_-]?controller|parameter[\s_-]?control|modulation[\s_-]?depth|ble[\s_-]?midi|bluetooth|extensible[\s_-]?music|xmf|(^|[\s_-])xmf([\s_-]|$)|mobile[\s_-]?midi|mobile[\s_-]?dls|mobile[\s_-]?musical|(^|[\s_-])sp[\s_-]?midi|scalable[\s_-]?polyphony|phone[\s_-]?control|trs|firewire|ieee[\s_-]?1394/i;

/**
 * Detect the protocol family for a document from its file name or title.
 * Explicit tags (e.g. from sources.json) should always take precedence —
 * pass them via the `explicit` argument.
 *
 * @param {string} name - File name, slug, or title to classify
 * @param {string} [explicit] - Explicit protocol tag that overrides heuristics
 * @returns {string} One of PROTOCOLS
 */
export function detectProtocol(name, explicit) {
	if (explicit && PROTOCOLS.includes(explicit)) {
		return explicit;
	}
	const value = String(name ?? '');
	if (WEB_MIDI_PATTERN.test(value)) {
		return 'web-midi';
	}
	// "General MIDI 2" (GM2) is a MIDI 1.0-family standard — check before the
	// midi2 heuristics, which would otherwise trip on the "MIDI 2" in its title.
	if (/general[\s_-]?midi/i.test(value) && !MIDI2_DOC_ID_PATTERN.test(value)) {
		return 'midi1';
	}
	if (MIDI2_PATTERN.test(value)) {
		return 'midi2';
	}
	if (MIDI1_PATTERN.test(value)) {
		return 'midi1';
	}
	return 'general';
}

/**
 * Parse an official MMA/AMEI document id (e.g. "M2-104-UM", "RP-001", "CA-033")
 * from a file name, if present.
 *
 * @param {string} fileName
 * @returns {string|undefined} Normalized doc id, or undefined when absent
 */
export function parseDocId(fileName) {
	const value = String(fileName ?? '');
	const match = value.match(/(?:^|[\s_-])(m[12]-\d{3}(?:-\d{3})?-?u?m?|rp-?\d{1,3}(?:-\d{1,3})?|ca-?\d{1,3})(?=[\s_.-]|$)/i);
	if (!match) {
		return undefined;
	}
	let id = match[1].toUpperCase();
	// Normalize "RP15"/"CA33" to "RP-015"/"CA-033" style used by MIDI.org
	const short = id.match(/^(RP|CA)-?(\d{1,3})$/);
	if (short) {
		id = `${short[1]}-${short[2].padStart(3, '0')}`;
	}
	return id;
}

/**
 * Parse a version string from a spec file name (e.g. "_v1-1-2_" → "1.1.2").
 *
 * @param {string} fileName
 * @returns {string|undefined}
 */
export function parseVersion(fileName) {
	const value = String(fileName ?? '');
	const match = value.match(/[\s_-]v?(\d+(?:[-.]\d+){1,3})(?=[\s_.]|$)/i);
	if (!match) {
		return undefined;
	}
	return match[1].replaceAll('-', '.');
}
