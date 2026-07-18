#!/usr/bin/env node
/**
 * Sort package.json keys with a small, intentional field order.
 *
 * Decision (Task 127 / epic §S3 option b): keep this custom sorter (built-ins only)
 * instead of the npm `sort-package-json` package. Prefer name/version/description
 * first; remaining keys are sorted alphabetically. Wire via:
 *   npm run format:sort-package-json   (write)
 *   npm run check:package-json         (CI / --check)
 */
import fs from 'node:fs';
import path from 'node:path';

/** Keys pinned to the top of each package.json (everything else A–Z). */
const STANDARD_ORDER = ['name', 'version', 'description'];

/**
 * Sort a package.json object's keys with standard npm field order.
 * @param {object} pkg - Parsed package.json content
 * @returns {object} Sorted package.json object
 */
export function sortPackageJson(pkg) {
	const sorted = {};

	for (const key of STANDARD_ORDER) {
		if (key in pkg) {
			sorted[key] = pkg[key];
		}
	}

	const remainingKeys = Object.keys(pkg)
		.filter(key => !STANDARD_ORDER.includes(key))
		.sort();

	for (const key of remainingKeys) {
		sorted[key] = pkg[key];
	}

	return sorted;
}

/**
 * Find all package.json files in the repo (root + workspaces).
 * @returns {string[]} Absolute paths to package.json files
 */
function findPackageJsonFiles() {
	const root = process.cwd();
	const files = [path.join(root, 'package.json')];

	const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
	const workspaces = rootPkg.workspaces || [];
	for (const workspace of workspaces) {
		const workspacePkg = path.join(root, workspace, 'package.json');
		if (fs.existsSync(workspacePkg)) {
			files.push(workspacePkg);
		}
	}

	return files;
}

function main() {
	const checkOnly = process.argv.includes('--check');
	const files = findPackageJsonFiles();
	let changedCount = 0;
	const unsorted = [];

	for (const file of files) {
		const raw = fs.readFileSync(file, 'utf8');
		const pkg = JSON.parse(raw);
		const sorted = sortPackageJson(pkg);
		const output = `${JSON.stringify(sorted, null, '\t')}\n`;
		const relative = path.relative(process.cwd(), file);

		if (output !== raw) {
			changedCount++;
			unsorted.push(relative);
			if (!checkOnly) {
				fs.writeFileSync(file, output);
				console.log(`Sorted: ${relative}`);
			}
		} else if (!checkOnly) {
			console.log(`Already sorted: ${relative}`);
		}
	}

	if (checkOnly) {
		if (unsorted.length === 0) {
			console.log('package.json key order check passed.');
			return;
		}
		console.error(`package.json key order check failed: ${unsorted.length} file(s) need sorting.`);
		for (const file of unsorted) {
			console.error(`- ${file}`);
		}
		console.error('Run: npm run format:sort-package-json');
		process.exit(1);
	}

	console.log(`\n${changedCount} file(s) changed, ${files.length - changedCount} already sorted.`);
}

main();
