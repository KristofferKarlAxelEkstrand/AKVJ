/**
 * Print an offender list and exit with code 1.
 * @param {string} headline
 * @param {string[]} files
 * @param {string} [hint]
 */
export function failWithOffenders(headline, files, hint) {
	console.error(headline);
	for (const file of files) {
		console.error(`- ${file}`);
	}
	if (hint) {
		console.error(hint);
	}
	process.exit(1);
}
