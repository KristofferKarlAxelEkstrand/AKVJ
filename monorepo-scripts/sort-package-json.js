import fs from 'node:fs';
import path from 'node:path';

const STANDARD_ORDER = ['name', 'version', 'description'];

/**
 * Sort a package.json object's keys with standard npm field order.
 * @param {object} pkg - Parsed package.json content
 * @returns {object} Sorted package.json object
 */
function sortPackageJson(pkg) {
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

const files = findPackageJsonFiles();
let changedCount = 0;

for (const file of files) {
	const raw = fs.readFileSync(file, 'utf8');
	const pkg = JSON.parse(raw);
	const sorted = sortPackageJson(pkg);
	const output = JSON.stringify(sorted, null, '\t') + '\n';

	if (output !== raw) {
		fs.writeFileSync(file, output);
		changedCount++;
		console.log(`Sorted: ${path.relative(process.cwd(), file)}`);
	} else {
		console.log(`Already sorted: ${path.relative(process.cwd(), file)}`);
	}
}

console.log(`\n${changedCount} file(s) changed, ${files.length - changedCount} already sorted.`);
