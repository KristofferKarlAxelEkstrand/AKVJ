/**
 * Minimal YAML frontmatter parsing shared by the workflow scripts.
 *
 * Deliberately not a YAML library: the frontmatter used across this workflow is
 * flat `key: value` pairs plus the occasional inline list, and every consumer
 * (prompt composition, message routing, dashboard) only ever reads scalars and
 * simple lists. Keeping it small keeps the workflow tooling dependency-free.
 */

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Strip surrounding quotes from a scalar value.
 * @param {string} value
 * @returns {string}
 */
function unquote(value) {
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
}

/**
 * Parse a single frontmatter value: inline list (`[a, b]`) or scalar.
 * @param {string} raw
 * @returns {string | string[]}
 */
function parseValue(raw) {
    const value = raw.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
        return value
            .slice(1, -1)
            .split(',')
            .map(item => unquote(item.trim()))
            .filter(Boolean);
    }
    return unquote(value);
}

/**
 * Split a document into its frontmatter data and remaining body.
 *
 * @param {string} content
 * @returns {{data: Record<string, string | string[]>, body: string, hasFrontmatter: boolean}}
 */
export function splitFrontmatter(content) {
    const match = content.match(FRONTMATTER_PATTERN);
    if (!match) {
        return { data: {}, body: content, hasFrontmatter: false };
    }

    /** @type {Record<string, string | string[]>} */
    const data = {};
    let pendingListKey = null;

    for (const line of match[1].split(/\r?\n/)) {
        // Block list continuation:  key:\n  - item
        const listItem = line.match(/^\s*-\s+(.*)$/);
        if (listItem && pendingListKey) {
            const existing = data[pendingListKey];
            const list = Array.isArray(existing) ? existing : [];
            list.push(unquote(listItem[1].trim()));
            data[pendingListKey] = list;
            continue;
        }

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
            continue;
        }

        const key = line.slice(0, colonIndex).trim();
        if (!key) {
            continue;
        }

        const rawValue = line.slice(colonIndex + 1).trim();
        if (rawValue === '') {
            // Either an empty scalar or the header of a block list; the next
            // line decides. Seed as an empty list and downgrade if nothing follows.
            pendingListKey = key;
            data[key] = [];
            continue;
        }

        pendingListKey = null;
        data[key] = parseValue(rawValue);
    }

    // A key seeded for a block list that never received items is an empty scalar.
    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length === 0) {
            data[key] = '';
        }
    }

    return { data, body: content.slice(match[0].length), hasFrontmatter: true };
}

/**
 * Render a frontmatter block. Arrays become inline lists.
 *
 * @param {Record<string, string | number | string[] | undefined>} data
 * @returns {string}
 */
export function renderFrontmatter(data) {
    const lines = ['---'];
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        lines.push(`${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`);
    }
    lines.push('---');
    return lines.join('\n');
}
