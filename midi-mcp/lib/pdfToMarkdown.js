/**
 * PDF → page-anchored markdown extraction for spec documents.
 *
 * Uses pdf-parse v2 per-page output so every extracted doc keeps "## Page N"
 * anchors — search results stay citeable ("M2-104-UM, page 45") and agents
 * can read the exact pages around a hit.
 */

import { PDFParse } from 'pdf-parse';

const HEADER_FOOTER_MIN_PAGES = 4;
const HEADER_FOOTER_RATIO = 0.5;
const HEADER_FOOTER_MAX_LENGTH = 90;

/**
 * Extract per-page text from a PDF buffer.
 *
 * @param {Buffer|Uint8Array} buffer
 * @returns {Promise<{ pages: string[], totalPages: number }>}
 */
export async function extractPdfPages(buffer) {
	const parser = new PDFParse({ data: new Uint8Array(buffer) });
	try {
		const result = await parser.getText();
		const pages = Array.isArray(result.pages) && result.pages.length > 0 ? result.pages.map(page => String(page.text ?? '')) : [String(result.text ?? '')];
		return { pages, totalPages: pages.length };
	} finally {
		await parser.destroy();
	}
}

/**
 * Clean extracted pages: drop repeated headers/footers and bare page numbers,
 * re-join hyphenated line breaks, and normalize whitespace.
 *
 * @param {string[]} pages
 * @returns {string[]}
 */
export function cleanPages(pages) {
	const repeated = findRepeatedLines(pages);
	return pages.map(page => cleanPage(page, repeated));
}

/**
 * Render cleaned pages as markdown with "## Page N" anchors.
 * Empty pages are skipped.
 *
 * @param {string[]} pages
 * @returns {string}
 */
export function pagesToMarkdown(pages) {
	const sections = [];
	for (const [index, page] of pages.entries()) {
		const text = page.trim();
		if (text.length === 0) {
			continue;
		}
		sections.push(`## Page ${index + 1}\n\n${text}`);
	}
	return sections.join('\n\n');
}

/**
 * Guess a document title from the first page of extracted text: the first
 * reasonably title-shaped lines before the body starts.
 *
 * @param {string[]} pages
 * @returns {string|undefined}
 */
export function detectTitle(pages) {
	const firstPage = pages.find(page => page.trim().length > 0);
	if (!firstPage) {
		return undefined;
	}
	const lines = firstPage
		.split('\n')
		.map(line => line.replace(/\s+/g, ' ').trim())
		.filter(line => line.length > 0);
	// MMA/AMEI approval cover sheets carry an explicit "Title:" field — best source
	for (const line of lines.slice(0, 20)) {
		const titled = line.match(/^Title:\s*(.{3,90})$/i);
		if (titled) {
			return titled[1].trim();
		}
	}
	const titleLines = [];
	for (const line of lines.slice(0, 8)) {
		if (!isTitleLine(line)) {
			if (titleLines.length > 0) {
				break;
			}
			continue;
		}
		titleLines.push(line);
		if (titleLines.join(' ').length > 60 || titleLines.length >= 3) {
			break;
		}
	}
	const title = titleLines.join(' ').trim();
	return title.length >= 8 ? title : undefined;
}

function isTitleLine(line) {
	if (line.length < 3 || line.length > 90) {
		return false;
	}
	if (/^(page \d|©|copyright|\d{1,4}$|version \d|document version|revised )/i.test(line)) {
		return false;
	}
	// Title lines are mostly letters, digits, and light punctuation
	return /^[\w\s.,:;&()/'"–—-]+$/.test(line) && /[a-z]/i.test(line);
}

function findRepeatedLines(pages) {
	if (pages.length < HEADER_FOOTER_MIN_PAGES) {
		return new Set();
	}
	const counts = new Map();
	for (const page of pages) {
		const seen = new Set();
		for (const line of page.split('\n')) {
			const key = normalizeLine(line);
			if (key.length === 0 || key.length > HEADER_FOOTER_MAX_LENGTH || seen.has(key)) {
				continue;
			}
			seen.add(key);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
	}
	const threshold = Math.max(HEADER_FOOTER_MIN_PAGES - 1, Math.ceil(pages.length * HEADER_FOOTER_RATIO));
	const repeated = new Set();
	for (const [key, count] of counts) {
		if (count >= threshold) {
			repeated.add(key);
		}
	}
	return repeated;
}

function cleanPage(page, repeatedLines) {
	const kept = [];
	for (const line of page.split('\n')) {
		const key = normalizeLine(line);
		if (repeatedLines.has(key)) {
			continue;
		}
		if (/^\s*(page\s+)?\d{1,4}\s*$/i.test(line)) {
			continue;
		}
		kept.push(line.trimEnd());
	}
	return kept
		.join('\n')
		.replace(/([A-Za-z]{2,})-\n([a-z])/g, '$1$2')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function normalizeLine(line) {
	// Page numbers inside running headers/footers vary per page — mask digits
	// so the shared part still counts as repeated.
	return line.replace(/\s+/g, ' ').replace(/\d+/g, '#').trim();
}
