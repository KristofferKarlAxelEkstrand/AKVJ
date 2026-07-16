/**
 * One-time knowledge-base build step for the MIDI MCP server.
 *
 * Reads every .pdf/.html in the repo-root .midi-raw-data/ folder plus the
 * curated online sources in sources.json, extracts structured markdown, and
 * writes the committed corpus to midi-mcp/data/ (docs + catalog.json).
 *
 * - Duplicate documents are skipped via content hashing (byte and text level).
 * - Online passes never fail the run: network errors warn to stderr and skip.
 * - All logging goes to stderr (repo rule for MCP-adjacent scripts).
 *
 * Usage: npm run midi:extract  (from repo root; idempotent, regenerates data/)
 */

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlTitle, htmlToText } from '../lib/htmlToText.js';
import { cleanPages, detectTitle, extractPdfPages, pagesToMarkdown } from '../lib/pdfToMarkdown.js';
import { detectProtocol, parseDocId, parseVersion } from '../lib/protocol.js';
import { serializeFrontMatter } from '../lib/frontMatter.js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPO_DIR = path.dirname(ROOT_DIR);
const RAW_DIR = path.join(REPO_DIR, '.midi-raw-data');
const CACHE_DIR = path.join(ROOT_DIR, '.cache');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SOURCES_FILE = path.join(ROOT_DIR, 'sources.json');

const DOWNLOAD_TIMEOUT_MS = 60_000;

/**
 * Curated titles for local files whose cover sheets only carry MMA/AMEI
 * boilerplate (verified against each document's first-page content).
 */
const LOCAL_TITLES = {
	ca18: 'File Reference System Exclusive Message',
	ca28: 'Extension 00-01 to File Reference SysEx Message',
	ca31: 'CC #88 High Resolution Velocity Prefix',
	'ca33-5-pin-din-electrical-spec': 'MIDI 1.0 5-Pin DIN Electrical Specification',
	'rp32-xmf-patch-prefix-meta-event': 'XMF Patch Type Prefix Meta-Event',
	rp46public: 'Mobile Phone Control Message Specification',
	rp49public: 'Three Dimensional Sound Controllers',
	'rp50-midi-visual-control': 'MIDI Visual Control (MVC)',
	'dls-level-1': 'Downloadable Sounds Level 1 Specification',
	'dls-level-2': 'Downloadable Sounds Level 2 Specification',
	dls1v11b: 'Downloadable Sounds Level 1 Specification',
	'dls2amd2-all-a-pub': 'Downloadable Sounds Level 2.2 Specification',
	'extensible-music-format': 'eXtensible Music Format (XMF) Specification',
	xmf: 'eXtensible Music Format (XMF) Specification',
	'xmf-12-all-pub': 'eXtensible Music Format (XMF) Specification',
	'mobile-dls': 'Mobile Downloadable Sounds Specification',
	'mdls-public': 'Mobile Downloadable Sounds Specification',
	'scalable-polyphony-midi': 'Scalable Polyphony MIDI (SP-MIDI) Specification',
	'spmidi-all-1-0b': 'Scalable Polyphony MIDI (SP-MIDI) Specification and Device Profiles',
	'mobile-phone-control-message': 'Mobile Phone Control Message Specification',
	'mobile-musical-interface': 'Mobile Musical Interface Specification',
	'mobile-musical-instrument': 'Mobile Musical Interface Specification',
	'rp48amd1-spec': 'Mobile Musical Interface Specification',
	'trs-connectors': 'MIDI over TRS Connectors Specification',
	'rp54-specification-for-use-of-trs-connectors-with-midi-devices': 'MIDI over TRS Connectors Specification',
	'ieee-1394-firewire': 'MIDI over IEEE-1394 (FireWire) Specification',
	'rp27v10-spec-1394': 'MIDI over IEEE-1394 (FireWire) Specification',
	'rp27v10-spec': 'MIDI over IEEE-1394 (FireWire) Specification'
};

const BOILERPLATE_TITLE_PATTERN = /technical standards board|confirmation of approval|letter of agreement|published by/i;

/** Curated summaries for local files whose names/covers don't explain themselves. */
const LOCAL_SUMMARIES = {
	'control-change-messages': 'MIDI.org table of all 128 MIDI 1.0 Control Change numbers (data bytes) and their assigned functions.',
	'expanded-midi-1-0-messages-list': 'Expanded MIDI 1.0 messages list organized by status byte, including all channel and system messages.',
	'expanded-messages-list': 'Expanded MIDI 1.0 messages list organized by status byte, including all channel and system messages.',
	'summary-of-midi': 'Compact summary table of all MIDI 1.0 messages: status bytes, data bytes, and descriptions.',
	'sysex-id-table': 'Table of assigned System Exclusive manufacturer IDs (1-byte and 3-byte).',
	'universal-system-exclusive-messages': 'Table of Universal SysEx messages (non-real-time 0x7E and real-time 0x7F): sub-IDs and message formats.',
	'midi-1-0-universal-system-exclusive-messages': 'Table of Universal SysEx messages (non-real-time 0x7E and real-time 0x7F): sub-IDs and message formats.',
	'gml-v1': 'General MIDI Lite specification: a GM subset for mobile and resource-limited devices.',
	'general-midi-level-2': 'General MIDI Level 2 (GM2) specification: extended instrument set, controller behavior, and universal SysEx requirements.',
	'standards-that-incorporate-midi': 'Overview of standards outside the MMA that incorporate MIDI.',
	'specs-midi-org': 'MIDI.org specifications index page listing the MIDI standards catalog.',
	'dls-proprietary-chunk-ids': 'Registered proprietary chunk IDs for the Downloadable Sounds (DLS) format.',
	'midi-tuning': 'MIDI Tuning (updated specification): SysEx messages for retuning notes in real time.',
	'midi-chart-v2': 'MIDI implementation chart template (version 2) for documenting device MIDI support.',
	'midi-show-control': 'MIDI Show Control (MSC) specification for controlling entertainment/show equipment.',
	'standard-midi-files': 'Standard MIDI Files 1.0 (SMF) specification: chunks, header format, track events, and meta-events.',
	'general-midi-system-level-1': 'General MIDI System Level 1 (GM1) specification: required instrument set, drum map, and controller support.',
	'midi-time-code': 'MIDI Time Code (MTC) specification: quarter-frame messages, full messages, and SMPTE time distribution.',
	'midi-machine-control': 'MIDI Machine Control (MMC) specification for transport control of recording equipment.',
	'dls-level-1': 'Downloadable Sounds Level 1 specification: sound data format and synthesizer features for MIDI playback.',
	dls1v11b: 'Downloadable Sounds Level 1 specification: sound data format and synthesizer features for MIDI playback.',
	'dls-level-2': 'Downloadable Sounds Level 2 specification: extended sound format and synthesis capabilities for modern MIDI.',
	'dls2amd2-all-a-pub': 'Downloadable Sounds Level 2.2 specification: extended sound format and synthesis capabilities for modern MIDI.',
	'extensible-music-format': 'eXtensible Music Format (XMF) specification: file format combining Standard MIDI Files with Downloadable Sounds and other multimedia data.',
	xmf: 'eXtensible Music Format (XMF) specification: file format combining Standard MIDI Files with Downloadable Sounds and other multimedia data.',
	'xmf-12-all-pub': 'eXtensible Music Format (XMF) specification: file format combining Standard MIDI Files with Downloadable Sounds and other multimedia data.',
	'mobile-dls': 'Mobile Downloadable Sounds specification: Downloadable Sounds format optimized for mobile applications.',
	'mdls-public': 'Mobile Downloadable Sounds specification: Downloadable Sounds format optimized for mobile applications.',
	'scalable-polyphony-midi': 'Scalable Polyphony MIDI (SP-MIDI) specification: content playback adapts to available polyphony of playback device.',
	'spmidi-all-1-0b': 'Scalable Polyphony MIDI (SP-MIDI) specification: content playback adapts to available polyphony of playback device.',
	'mobile-phone-control-message': 'Mobile Phone Control Message specification: Universal Real Time System Exclusive messages for controlling non-musical device capabilities.',
	rp46public: 'Mobile Phone Control Message specification: Universal Real Time System Exclusive framework for controlling non-musical capabilities in mobile phone-oriented player devices such as vibrators and LEDs.',
	'mobile-musical-interface': 'Mobile Musical Interface specification: mapping mobile phone keypads (numeric and QWERTY) to musical instrument playing interfaces.',
	'mobile-musical-instrument': 'Mobile Musical Interface specification: mapping mobile phone keypads (numeric and QWERTY) to musical instrument playing interfaces.',
	'rp48amd1-spec': 'Mobile Musical Interface specification: mapping mobile phone keypads (numeric and QWERTY) to musical instrument playing interfaces.',
	'trs-connectors': 'MIDI over TRS Connectors specification: wiring and circuitry for MIDI 1.0 over tip-ring-sleeve connectors.',
	'rp54-specification-for-use-of-trs-connectors-with-midi-devices': 'MIDI over TRS Connectors specification: wiring and circuitry for MIDI 1.0 over tip-ring-sleeve connectors.',
	'ieee-1394-firewire': 'MIDI over IEEE-1394 (FireWire) specification: MIDI Media Adaptation Layer for FireWire transport (part of AM824 Protocol, IEC 61883-6).',
	'rp27v10-spec-1394': 'MIDI over IEEE-1394 (FireWire) specification: MIDI Media Adaptation Layer for FireWire transport (part of AM824 Protocol, IEC 61883-6).',
	'rp27v10-spec': 'MIDI over IEEE-1394 (FireWire) specification: MIDI Media Adaptation Layer for FireWire transport (part of AM824 Protocol, IEC 61883-6).'
};

async function main() {
	const started = Date.now();
	await rm(DATA_DIR, { recursive: true, force: true });
	await mkdir(DATA_DIR, { recursive: true });
	await mkdir(CACHE_DIR, { recursive: true });

	const seenByteHashes = new Set();
	const seenTextHashes = new Set();
	const usedNames = new Set();
	const catalog = [];

	// Online sources first: their curated titles/summaries beat filename guesses,
	// and byte/text dedupe then folds identical local copies into them.
	for (const source of await loadSources()) {
		const buffer = await download(source.url);
		if (!buffer) {
			continue;
		}
		await processDocument({ buffer, fileName: path.basename(new URL(source.url).pathname) || source.name, source, sourceType: 'online', seenByteHashes, seenTextHashes, usedNames, catalog });
	}

	for (const fileName of await listRawFiles()) {
		const buffer = await readFile(path.join(RAW_DIR, fileName));
		await processDocument({ buffer, fileName, sourceType: 'local', seenByteHashes, seenTextHashes, usedNames, catalog });
	}

	catalog.sort((a, b) => a.name.localeCompare(b.name));
	await writeFile(path.join(DATA_DIR, 'catalog.json'), `${JSON.stringify(catalog, null, '\t')}\n`, 'utf8');

	const counts = {};
	for (const entry of catalog) {
		counts[entry.protocol] = (counts[entry.protocol] ?? 0) + 1;
	}
	console.error(
		`midi-mcp extract: ${catalog.length} docs written to data/ in ${((Date.now() - started) / 1000).toFixed(1)}s (${Object.entries(counts)
			.map(([key, value]) => `${key}: ${value}`)
			.join(', ')})`
	);
}

async function processDocument({ buffer, fileName, source, sourceType, seenByteHashes, seenTextHashes, usedNames, catalog }) {
	const byteHash = sha256(buffer);
	if (seenByteHashes.has(byteHash)) {
		console.error(`skip (duplicate bytes): ${fileName}`);
		return;
	}
	seenByteHashes.add(byteHash);

	let extracted;
	try {
		extracted = await extractContent(buffer, fileName, source?.url);
	} catch (error) {
		console.error(`skip (extraction failed): ${fileName} — ${error.message}`);
		return;
	}
	if (extracted.body.trim().length === 0) {
		console.error(`skip (no text content): ${fileName}`);
		return;
	}

	const textHash = sha256(extracted.body.replace(/\s+/g, ' '));
	if (seenTextHashes.has(textHash)) {
		console.error(`skip (duplicate content): ${fileName}`);
		return;
	}
	seenTextHashes.add(textHash);

	const meta = buildMeta({ extracted, fileName, source, sourceType });
	const name = uniqueName(source?.name ?? slugify(stripExtension(fileName)), usedNames);
	const frontMatter = { title: meta.title, docId: meta.docId, version: meta.version, protocol: meta.protocol, source: meta.source, sourceType, unofficial: source?.unofficial ? true : undefined, pages: extracted.pages, sha256: byteHash, extractedAt: new Date().toISOString(), summary: meta.summary };
	await writeFile(path.join(DATA_DIR, `${name}.md`), serializeFrontMatter(frontMatter, `# ${meta.title}\n\n${extracted.body}`), 'utf8');
	catalog.push({ name, ...frontMatter });
	console.error(`extracted: ${name} (${meta.protocol}, ${extracted.pages ?? '?'} pages, from ${sourceType})`);
}

async function extractContent(buffer, fileName, url) {
	const kind = contentKind(fileName, buffer);
	if (kind === 'pdf') {
		const { pages } = await extractPdfPages(buffer);
		const cleaned = cleanPages(pages).map(sanitizeText);
		return { body: pagesToMarkdown(cleaned), detectedTitle: detectTitle(cleaned), pages: cleaned.length };
	}
	const text = buffer.toString('utf8');
	if (kind === 'html') {
		return { body: sanitizeText(htmlToText(text)), detectedTitle: cleanHtmlTitle(htmlTitle(text)), pages: undefined };
	}
	// Plain text (e.g. IETF RFCs): pass through, lightly normalized
	void url;
	return {
		body: sanitizeText(text)
			.replace(/\n{3,}/g, '\n\n')
			.trim(),
		detectedTitle: undefined,
		pages: undefined
	};
}

function buildMeta({ extracted, fileName, source, sourceType }) {
	const docId = source?.docId ?? parseDocId(fileName);
	const version = source?.version ?? parseVersion(fileName);
	const slug = slugify(stripExtension(fileName));
	const detected = extracted.detectedTitle && !BOILERPLATE_TITLE_PATTERN.test(extracted.detectedTitle) ? extracted.detectedTitle : undefined;
	const title = source?.title ?? LOCAL_TITLES[slug] ?? detected ?? prettifyFileName(fileName);
	const protocol = detectProtocol(`${fileName} ${title}`, source?.protocol);
	const summary = source?.summary ?? lookupLocalSummary(fileName) ?? deriveSummary({ title, docId });
	return { docId, version, title, protocol, summary, source: sourceType === 'online' ? source.url : `.midi-raw-data/${fileName}` };
}

function lookupLocalSummary(fileName) {
	const slug = slugify(stripExtension(fileName));
	for (const [key, summary] of Object.entries(LOCAL_SUMMARIES)) {
		if (slug.includes(key)) {
			return summary;
		}
	}
	return undefined;
}

function deriveSummary({ title, docId }) {
	if (docId && /^(CA|RP)-/.test(docId)) {
		return `MMA/AMEI ${docId.startsWith('CA') ? 'Confirmation of Approval' : 'Recommended Practice'} ${docId}: ${title}.`;
	}
	return `MIDI specification document: ${title}.`;
}

async function loadSources() {
	try {
		const parsed = JSON.parse(await readFile(SOURCES_FILE, 'utf8'));
		return Array.isArray(parsed.sources) ? parsed.sources : [];
	} catch (error) {
		console.error(`warning: could not read sources.json (${error.message}) — online pass skipped`);
		return [];
	}
}

async function listRawFiles() {
	try {
		const files = await readdir(RAW_DIR);
		return files.filter(name => /\.(pdf|html?)$/i.test(name)).sort();
	} catch {
		console.error(`warning: ${RAW_DIR} not found — local pass skipped (online sources still cover the core specs)`);
		return [];
	}
}

async function download(url) {
	const cachePath = path.join(CACHE_DIR, slugify(url));
	try {
		return await readFile(cachePath);
	} catch {
		// Not cached yet
	}
	try {
		console.error(`downloading: ${url}`);
		const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS), redirect: 'follow' });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const buffer = Buffer.from(await response.arrayBuffer());
		await writeFile(cachePath, buffer);
		return buffer;
	} catch (error) {
		console.error(`warning: download failed, skipping ${url} — ${error.message}`);
		return undefined;
	}
}

function contentKind(fileName, buffer) {
	if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') {
		return 'pdf';
	}
	if (/\.pdf$/i.test(fileName)) {
		return 'pdf';
	}
	const head = buffer.subarray(0, 512).toString('utf8').trimStart().toLowerCase();
	if (/\.html?$/i.test(fileName) || head.startsWith('<!doctype html') || head.startsWith('<html')) {
		return 'html';
	}
	return 'text';
}

function cleanHtmlTitle(title) {
	return title?.replace(/\s*[–|-]\s*MIDI\.org.*$/i, '').trim() || undefined;
}

function prettifyFileName(fileName) {
	return stripExtension(fileName)
		.replace(/[_-]+/g, ' ')
		.replace(/\s*\(\d+\)\s*$/, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function stripExtension(fileName) {
	// Also drop "(1)"-style copy markers so duplicate downloads slug cleanly
	return fileName.replace(/\.(pdf|html?|txt)$/i, '').replace(/\s*\(\d+\)\s*$/, '');
}

function slugify(value) {
	return String(value)
		.toLowerCase()
		.replace(/https?:\/\//, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120);
}

function uniqueName(base, usedNames) {
	let name = base.length > 0 ? base : 'doc';
	let suffix = 2;
	while (usedNames.has(name)) {
		name = `${base}-${suffix}`;
		suffix += 1;
	}
	usedNames.add(name);
	return name;
}

function sanitizeText(text) {
	// Committed corpus must be clean UTF-8 with LF endings and no control chars
	return (
		String(text)
			.replace(/\r\n?/g, '\n')
			// eslint-disable-next-line no-control-regex
			.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
	);
}

function sha256(input) {
	return createHash('sha256').update(input).digest('hex');
}

main().catch(error => {
	console.error(`midi-mcp extract failed: ${error.stack ?? error.message}`);
	process.exitCode = 1;
});
