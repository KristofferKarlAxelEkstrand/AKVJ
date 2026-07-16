#!/usr/bin/env node
/**
 * MIDI Protocol MCP server (stdio).
 *
 * Exposes a two-tier MIDI knowledge base to AI coding agents:
 * - tier "reference": curated quick-answer docs (repo docs/ + midi-mcp/reference/)
 * - tier "spec": the extracted spec corpus in midi-mcp/data/ (built by npm run midi:extract)
 *
 * CRITICAL: stdout is the JSON-RPC stream — never use console.log in this
 * process. All diagnostics go through console.error.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listDocs, loadCatalog, MISSING_DATA_MESSAGE } from './lib/catalog.js';
import { searchDocs } from './lib/search.js';
import { htmlToText } from './lib/htmlToText.js';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FETCH_TIMEOUT_MS = 10_000;
const FETCH_MAX_BYTES = 2 * 1024 * 1024;
const READ_DEFAULT_MAX_CHARS = 20_000;

const SERVER_INSTRUCTIONS = ['MIDI specification knowledge base. Docs are tagged by protocol: "midi1" (MIDI 1.0, SMF, GM, MTC, MMC, SysEx tables), "midi2" (UMP, MIDI-CI, Property Exchange, Profiles), "web-midi" (W3C Web MIDI API), or "general".', 'Two tiers: "reference" docs are curated quick-answer guides and tables — search these first for factual lookups (status bytes, CC numbers, API behavior). "spec" docs are the full extracted text of official specifications — use them for authoritative wording and deep dives; results cite "## Page N" anchors you can pass to read_spec_doc as a page range.', 'Typical flow: search_spec_data → read_spec_doc for surrounding pages → fetch_online_resource only to verify against live web sources.'].join(' ');

const { docs, byName, missingData } = await loadCatalog({ rootDir: ROOT_DIR });
const packageJson = JSON.parse(await readFile(path.join(ROOT_DIR, 'package.json'), 'utf8'));

const server = new McpServer({ name: 'midi-spec', version: packageJson.version }, { instructions: SERVER_INSTRUCTIONS });

server.registerResource('parsed-list', 'midi://parsed/list', { title: 'MIDI knowledge base catalog', description: 'All docs in the MIDI knowledge base: name, title, protocol (midi1/midi2/web-midi/general), tier (reference/spec), and summary.', mimeType: 'application/json' }, async uri => ({
	contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(catalogPayload(), null, 2) }]
}));

server.registerResource(
	'parsed-read',
	new ResourceTemplate('midi://parsed/read/{filename}', {
		list: undefined,
		complete: {
			filename: value =>
				docs
					.map(doc => doc.name)
					.filter(name => name.startsWith(value))
					.slice(0, 50)
		}
	}),
	{ title: 'Read a MIDI knowledge base doc', description: 'Full text of one doc by catalog name (see midi://parsed/list).', mimeType: 'text/markdown' },
	async (uri, { filename }) => {
		const doc = byName.get(String(filename));
		if (!doc) {
			throw new Error(unknownDocMessage(String(filename)));
		}
		return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: doc.text }] };
	}
);

server.registerTool(
	'search_spec_data',
	{
		title: 'Search MIDI specifications',
		description: 'Search the MIDI knowledge base (MIDI 1.0, MIDI 2.0/UMP/MIDI-CI, Web MIDI API). Returns ranked snippets with doc name and page/heading anchor; curated reference docs rank first. Filter with protocol (midi1|midi2|web-midi|general) and tier (reference|spec).',
		inputSchema: {
			query: z.string().min(1).describe('Text to find, e.g. "Note On", "SysEx ID", "requestMIDIAccess", "JR Timestamp"'),
			protocol: z.enum(['midi1', 'midi2', 'web-midi', 'general']).optional().describe('Restrict to one protocol family'),
			tier: z.enum(['reference', 'spec']).optional().describe('reference = curated quick answers, spec = full official spec text'),
			maxResults: z.number().int().min(1).max(30).optional().describe('Maximum snippets to return (default 8)'),
			contextLines: z.number().int().min(0).max(10).optional().describe('Lines of context around each match (default 2)')
		},
		annotations: { readOnlyHint: true }
	},
	async ({ query, protocol, tier, maxResults, contextLines }) => {
		if (docs.length === 0) {
			return textResult(MISSING_DATA_MESSAGE);
		}
		const results = searchDocs(docs, { query, protocol, tier, maxResults, contextLines });
		if (results.length === 0) {
			const hint = missingData ? ` Note: ${MISSING_DATA_MESSAGE}` : ' Try a shorter or alternative term (e.g. "Note On" instead of "note-on message").';
			return textResult(`No matches for "${query}"${protocol ? ` in protocol ${protocol}` : ''}.${hint}`);
		}
		return textResult(results.map(formatSearchResult).join('\n\n---\n\n'));
	}
);

server.registerTool(
	'read_spec_doc',
	{
		title: 'Read a MIDI spec doc',
		description: 'Read one doc from the knowledge base by catalog name. For paged spec docs, pass pages like "45" or "44-46" (matching the "## Page N" anchors from search results). Long docs are chunked — use offset to continue.',
		inputSchema: {
			name: z.string().min(1).describe('Catalog doc name, e.g. "m2-104-um-ump-and-midi-2-0-protocol-specification"'),
			pages: z
				.string()
				.regex(/^\d+(-\d+)?$/)
				.optional()
				.describe('Page or page range, e.g. "45" or "44-46"'),
			offset: z.number().int().min(0).optional().describe('Character offset to continue reading a long doc'),
			maxChars: z.number().int().min(100).max(100_000).optional().describe(`Maximum characters to return (default ${READ_DEFAULT_MAX_CHARS})`)
		},
		annotations: { readOnlyHint: true }
	},
	async ({ name, pages, offset = 0, maxChars = READ_DEFAULT_MAX_CHARS }) => {
		const doc = byName.get(name);
		if (!doc) {
			return textResult(unknownDocMessage(name));
		}
		let text = doc.text;
		if (pages) {
			text = extractPages(doc, pages);
			if (text === undefined) {
				return textResult(`Doc "${name}" has no pages ${pages}. It has ${doc.pages ?? 'no'} page anchors; omit "pages" to read by offset.`);
			}
		}
		const slice = text.slice(offset, offset + maxChars);
		const remaining = text.length - offset - slice.length;
		const suffix = remaining > 0 ? `\n\n[…truncated — ${remaining} more characters; call again with offset=${offset + slice.length}]` : '';
		return textResult(`${formatDocHeader(doc)}\n\n${slice}${suffix}`);
	}
);

server.registerTool(
	'list_spec_docs',
	{
		title: 'List MIDI spec docs',
		description: 'List knowledge-base docs with title, protocol, tier, and summary. Filter with protocol (midi1|midi2|web-midi|general) and/or tier (reference|spec).',
		inputSchema: {
			protocol: z.enum(['midi1', 'midi2', 'web-midi', 'general']).optional(),
			tier: z.enum(['reference', 'spec']).optional()
		},
		annotations: { readOnlyHint: true }
	},
	async ({ protocol, tier }) => {
		if (docs.length === 0) {
			return textResult(MISSING_DATA_MESSAGE);
		}
		return textResult(JSON.stringify(listDocs(docs, { protocol, tier }), null, 2));
	}
);

server.registerTool(
	'fetch_online_resource',
	{
		title: 'Fetch an online resource',
		description: 'Fetch a public http(s) URL (e.g. MDN, W3C, midi.org) and return its readable text content. Use to verify or supplement the local spec data against live sources. HTML is converted to text; 10s timeout, 2MB cap.',
		inputSchema: {
			url: z.string().url().describe('Absolute http(s) URL to fetch')
		},
		annotations: { readOnlyHint: true, openWorldHint: true }
	},
	async ({ url }) => {
		const parsed = new URL(url);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return textResult(`Only http(s) URLs are supported, got "${parsed.protocol}".`);
		}
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'follow', headers: { 'user-agent': 'akvj-midi-mcp/1.0 (spec verification)', accept: 'text/html,text/plain,application/xhtml+xml' } });
			if (!response.ok) {
				return textResult(`Fetch failed: HTTP ${response.status} ${response.statusText} for ${url}`);
			}
			const raw = Buffer.from(await response.arrayBuffer());
			if (raw.byteLength > FETCH_MAX_BYTES) {
				return textResult(`Response too large (${raw.byteLength} bytes > ${FETCH_MAX_BYTES} cap): ${url}`);
			}
			const contentType = response.headers.get('content-type') ?? '';
			const body = raw.toString('utf8');
			const text = contentType.includes('html') || /^\s*<(!doctype|html)/i.test(body) ? htmlToText(body) : body;
			return textResult(`Fetched ${url} (${contentType || 'unknown content type'}):\n\n${text.slice(0, 80_000)}`);
		} catch (error) {
			return textResult(`Fetch failed for ${url}: ${error.message}`);
		}
	}
);

function catalogPayload() {
	if (docs.length === 0) {
		return { error: MISSING_DATA_MESSAGE, docs: [] };
	}
	return { count: docs.length, docs: listDocs(docs) };
}

function formatSearchResult(result) {
	const location = [result.anchor ? `§ ${result.anchor}` : undefined, `line ${result.line}`].filter(Boolean).join(', ');
	return `**${result.title}** (${result.doc} — ${result.protocol}, ${result.tier}, ${location}; ${result.totalMatches} match${result.totalMatches === 1 ? '' : 'es'})\n${result.snippet}`;
}

function formatDocHeader(doc) {
	const parts = [doc.title, doc.docId, doc.version ? `v${doc.version}` : undefined, doc.protocol, doc.tier].filter(Boolean);
	return `# ${parts.join(' — ')}\nSource: ${doc.source ?? 'n/a'}${doc.unofficial ? ' (unofficial mirror)' : ''}`;
}

function extractPages(doc, pagesSpec) {
	const [first, last = first] = pagesSpec.split('-').map(Number);
	const pattern = /^## Page (\d+)$/gm;
	const sections = [];
	let match;
	let previous;
	while ((match = pattern.exec(doc.text)) !== null) {
		if (previous) {
			previous.end = match.index;
		}
		previous = { page: Number(match[1]), start: match.index, end: doc.text.length };
		sections.push(previous);
	}
	const wanted = sections.filter(section => section.page >= first && section.page <= last);
	if (wanted.length === 0) {
		return undefined;
	}
	return doc.text.slice(wanted[0].start, wanted.at(-1).end).trim();
}

function unknownDocMessage(name) {
	const suggestions = docs
		.map(doc => doc.name)
		.filter(candidate => candidate.includes(name.toLowerCase().slice(0, 12)))
		.slice(0, 5);
	const hint = suggestions.length > 0 ? ` Did you mean: ${suggestions.join(', ')}?` : ' Use list_spec_docs to see available names.';
	return `Unknown doc "${name}".${missingData ? ` ${MISSING_DATA_MESSAGE}` : hint}`;
}

function textResult(text) {
	return { content: [{ type: 'text', text }] };
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`midi-spec MCP server running (stdio) — ${docs.length} docs loaded${missingData ? ' [data/ missing — run npm run midi:extract]' : ''}`);
