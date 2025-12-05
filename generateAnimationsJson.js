import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aniPath = path.join(__dirname, 'src/public/animations');
const outputFilePath = path.join(aniPath, 'animations.json');

const getSubfolders = dir => {
	try {
		return fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isDirectory());
	} catch {
		return [];
	}
};

const getFilesWithExtension = (dir, ext) => {
	try {
		return fs.readdirSync(dir).filter(file => path.extname(file) === ext);
	} catch {
		return [];
	}
};

const parseJsonFile = filePath => {
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch (err) {
		console.error(`  Error parsing ${path.basename(filePath)}: ${err.message}`);
		return {};
	}
};

const generateAnimationsJson = () => {
	console.log(`Building animations from ${aniPath}`);
	const output = {};

	for (const channel of getSubfolders(aniPath)) {
		output[channel] = {};
		console.log(`Channel ${channel}`);

		for (const note of getSubfolders(path.join(aniPath, channel))) {
			output[channel][note] = {};
			console.log(`  Note ${note}`);

			for (const velocity of getSubfolders(path.join(aniPath, channel, note))) {
				const velocityPath = path.join(aniPath, channel, note, velocity);
				const pngFile = getFilesWithExtension(velocityPath, '.png')[0];
				const jsonFile = getFilesWithExtension(velocityPath, '.json')[0];

				const metadata = jsonFile ? parseJsonFile(path.join(velocityPath, jsonFile)) : {};

				output[channel][note][velocity] = { png: pngFile, ...metadata };
				console.log(`    Velocity ${velocity}: ${pngFile}`);
			}
		}
	}

	fs.writeFileSync(outputFilePath, JSON.stringify(output, null, '\t'), 'utf8');
	console.log(`\nSaved to ${outputFilePath}`);
};

generateAnimationsJson();
