/**
 * Ranked in-memory search across the MIDI knowledge base.
 *
 * Curated reference docs (tier "reference") rank above raw extracted specs
 * (tier "spec") because they answer quick factual lookups best; within a
 * tier, docs rank by match density. Each result carries the nearest page or
 * heading anchor so agents can follow up with a focused read_spec_doc call.
 */

const DEFAULT_MAX_RESULTS = 8;
const DEFAULT_CONTEXT_LINES = 2;
const MAX_SNIPPETS_PER_DOC = 2;
const MAX_SNIPPET_CHARS = 700;
const TIER_RANK = { reference: 0, spec: 1 };

/**
 * Search loaded docs for a query string (case-insensitive substring match).
 *
 * @param {Array<{ name: string, title: string, protocol: string, tier: string, lines: string[] }>} docs
 * @param {object} options
 * @param {string} options.query - Text to find (e.g. "Note On", "SysEx ID")
 * @param {string} [options.protocol] - Restrict to one protocol tag
 * @param {string} [options.tier] - Restrict to "reference" or "spec"
 * @param {number} [options.maxResults]
 * @param {number} [options.contextLines]
 * @returns {Array<object>} Ranked results with snippets and anchors
 */
export function searchDocs(docs, { query, protocol, tier, maxResults = DEFAULT_MAX_RESULTS, contextLines = DEFAULT_CONTEXT_LINES }) {
	const needle = String(query ?? '').toLowerCase();
	if (needle.length === 0) {
		return [];
	}
	const cellPattern = buildCellPattern(query);
	const scored = [];
	for (const doc of docs) {
		if (protocol && doc.protocol !== protocol) {
			continue;
		}
		if (tier && doc.tier !== tier) {
			continue;
		}
		const matchLines = findMatchLines(doc.lines, needle);
		if (matchLines.length === 0) {
			continue;
		}
		// A table cell that IS the query (e.g. "| Note On |") marks the doc
		// that defines the term — rank those definition rows first.
		const cellMatches = matchLines.filter(index => cellPattern.test(doc.lines[index]));
		scored.push({ doc, matchLines: cellMatches.length > 0 ? [...cellMatches, ...matchLines.filter(index => !cellMatches.includes(index))] : matchLines, cellMatchCount: cellMatches.length });
	}
	scored.sort((a, b) => {
		const tierDiff = (TIER_RANK[a.doc.tier] ?? 9) - (TIER_RANK[b.doc.tier] ?? 9);
		if (tierDiff !== 0) {
			return tierDiff;
		}
		if (a.cellMatchCount !== b.cellMatchCount) {
			return b.cellMatchCount - a.cellMatchCount;
		}
		return matchDensity(b) - matchDensity(a);
	});
	const results = [];
	for (const { doc, matchLines } of scored) {
		for (const lineIndex of pickSnippetLines(matchLines)) {
			results.push(buildResult(doc, lineIndex, matchLines.length, contextLines));
			if (results.length >= maxResults) {
				return results;
			}
		}
	}
	return results;
}

function buildCellPattern(query) {
	const escaped = String(query ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`\\|\\s*${escaped}\\s*\\|`, 'i');
}

function findMatchLines(lines, needle) {
	const matches = [];
	for (const [index, line] of lines.entries()) {
		if (line.toLowerCase().includes(needle)) {
			matches.push(index);
		}
	}
	return matches;
}

function matchDensity({ doc, matchLines }) {
	return matchLines.length / Math.max(doc.lines.length, 1);
}

function pickSnippetLines(matchLines) {
	if (matchLines.length <= MAX_SNIPPETS_PER_DOC) {
		return matchLines;
	}
	// First hit plus one from the densest cluster further in
	const picks = [matchLines[0]];
	const middle = matchLines[Math.floor(matchLines.length / 2)];
	if (middle !== picks[0]) {
		picks.push(middle);
	}
	return picks;
}

function buildResult(doc, lineIndex, totalMatches, contextLines) {
	const start = Math.max(0, lineIndex - contextLines);
	const end = Math.min(doc.lines.length, lineIndex + contextLines + 1);
	let snippet = doc.lines.slice(start, end).join('\n').trim();
	if (snippet.length > MAX_SNIPPET_CHARS) {
		snippet = `${snippet.slice(0, MAX_SNIPPET_CHARS)}…`;
	}
	return {
		doc: doc.name,
		title: doc.title,
		protocol: doc.protocol,
		tier: doc.tier,
		anchor: findAnchor(doc.lines, lineIndex),
		line: lineIndex + 1,
		totalMatches,
		snippet
	};
}

function findAnchor(lines, lineIndex) {
	for (let index = lineIndex; index >= 0; index--) {
		const heading = lines[index].match(/^#{1,6}\s+(.+)$/);
		if (heading) {
			return heading[1].trim();
		}
	}
	return undefined;
}
