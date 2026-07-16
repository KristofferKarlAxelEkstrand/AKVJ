/**
 * Knowledge-base catalog: merges the generated spec corpus (midi-mcp/data/),
 * the curated reference docs (midi-mcp/reference/), and the repo's reviewed
 * MIDI docs (docs/) into one in-memory index the MCP server searches.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontMatter } from './frontMatter.js';

/**
 * Repo docs indexed in place (tier "reference") — curated, reviewed content
 * that answers most quick lookups without touching the raw spec corpus.
 */
const REPO_DOCS = [
	{ name: 'midi-protocol-guide', file: 'docs/midi-protocol-guide.md', title: 'MIDI Protocol Guide', protocol: 'midi1', summary: 'Practical MIDI 1.0 protocol guide: message types, channel voice messages, system messages, data format, timing, and best practices.' },
	{ name: 'midi-controller-reference', file: 'docs/midi-controller-reference.md', title: 'MIDI Controller (CC) Reference', protocol: 'midi1', summary: 'All 128 MIDI Control Change numbers with descriptions, plus channel mode messages (CC 120–127).' },
	{ name: 'usb-midi-and-midi2-reference', file: 'docs/usb-midi-and-midi2-reference.md', title: 'USB-MIDI and MIDI 2.0 Reference', protocol: 'midi2', summary: 'USB-MIDI packet format and MIDI 2.0 overview: UMP, MIDI-CI, higher resolution, and translation basics.' },
	{ name: 'web-midi-api-guide', file: 'docs/web-midi-api-guide.md', title: 'Web MIDI API Guide', protocol: 'web-midi', summary: 'Web MIDI API usage guide: requestMIDIAccess, MIDIInput/MIDIOutput, permissions, quirks, and browser support.' },
	{ name: 'how-to-program-midi', file: 'docs/how-to-program-midi.md', title: 'How to Program MIDI for AKVJ', protocol: 'general', summary: 'AKVJ-specific MIDI programming: DAW setup and the channel-to-layer-group mapping used by this project.' }
];

/**
 * Load the full knowledge base into memory.
 *
 * @param {object} [options]
 * @param {string} [options.rootDir] - midi-mcp directory (defaults relative to this file)
 * @param {string} [options.repoDir] - repository root (for docs/)
 * @returns {Promise<{ docs: Array<object>, byName: Map<string, object>, missingData: boolean }>}
 */
export async function loadCatalog({ rootDir, repoDir } = {}) {
	const root = rootDir ?? path.dirname(path.dirname(new URL(import.meta.url).pathname));
	const repo = repoDir ?? path.dirname(root);
	const docs = [];
	const specDocs = await loadSpecDocs(path.join(root, 'data'));
	docs.push(...specDocs.docs);
	docs.push(...(await loadReferenceDir(path.join(root, 'reference'))));
	docs.push(...(await loadRepoDocs(repo)));
	const byName = new Map(docs.map(doc => [doc.name, doc]));
	return { docs, byName, missingData: specDocs.missing };
}

/**
 * Compact catalog listing (no text bodies) for list tools/resources.
 *
 * @param {Array<object>} docs
 * @param {{ protocol?: string, tier?: string }} [filter]
 * @returns {Array<object>}
 */
export function listDocs(docs, { protocol, tier } = {}) {
	return docs
		.filter(doc => (!protocol || doc.protocol === protocol) && (!tier || doc.tier === tier))
		.map(({ name, title, docId, version, protocol: docProtocol, tier: docTier, summary, source, pages, unofficial }) => ({
			name,
			title,
			...(docId ? { docId } : {}),
			...(version ? { version } : {}),
			protocol: docProtocol,
			tier: docTier,
			...(summary ? { summary } : {}),
			...(source ? { source } : {}),
			...(pages ? { pages } : {}),
			...(unofficial ? { unofficial } : {})
		}));
}

/** Message returned by tools when the generated corpus has not been built. */
export const MISSING_DATA_MESSAGE = 'The extracted spec corpus (midi-mcp/data/) is missing. Run "npm run midi:extract" from the repo root to build it (requires .midi-raw-data/ and/or network access), then restart this MCP server.';

async function loadSpecDocs(dataDir) {
	let catalog;
	try {
		catalog = JSON.parse(await readFile(path.join(dataDir, 'catalog.json'), 'utf8'));
	} catch {
		return { docs: [], missing: true };
	}
	const docs = [];
	for (const entry of catalog) {
		try {
			const markdown = await readFile(path.join(dataDir, `${entry.name}.md`), 'utf8');
			const { body } = parseFrontMatter(markdown);
			docs.push(makeDoc({ ...entry, tier: 'spec' }, body));
		} catch (error) {
			console.error(`midi-mcp: skipping unreadable data doc "${entry.name}": ${error.message}`);
		}
	}
	return { docs, missing: false };
}

async function loadReferenceDir(referenceDir) {
	let files;
	try {
		files = await readdir(referenceDir);
	} catch {
		return [];
	}
	const docs = [];
	for (const file of files.filter(name => name.endsWith('.md')).sort()) {
		try {
			const markdown = await readFile(path.join(referenceDir, file), 'utf8');
			const { meta, body } = parseFrontMatter(markdown);
			const name = path.basename(file, '.md');
			docs.push(makeDoc({ name, title: meta.title ?? name, protocol: meta.protocol ?? 'general', summary: meta.summary, source: `midi-mcp/reference/${file}`, tier: 'reference' }, body));
		} catch (error) {
			console.error(`midi-mcp: skipping unreadable reference doc "${file}": ${error.message}`);
		}
	}
	return docs;
}

async function loadRepoDocs(repoDir) {
	const docs = [];
	for (const entry of REPO_DOCS) {
		try {
			const markdown = await readFile(path.join(repoDir, entry.file), 'utf8');
			docs.push(makeDoc({ name: entry.name, title: entry.title, protocol: entry.protocol, summary: entry.summary, source: entry.file, tier: 'reference' }, markdown));
		} catch (error) {
			console.error(`midi-mcp: skipping missing repo doc "${entry.file}": ${error.message}`);
		}
	}
	return docs;
}

function makeDoc(meta, text) {
	return { ...meta, text, lines: text.split('\n') };
}
