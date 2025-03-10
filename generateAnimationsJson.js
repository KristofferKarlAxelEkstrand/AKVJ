import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const aniPath = path.join(__dirname, './src/public/animations');
const outputFilePath = path.join(__dirname, './src/public/animations/animations.json');

// Function to get subfolders
const getSubfolders = dir => {
	return fs.readdirSync(dir).filter(file => {
		return fs.statSync(path.join(dir, file)).isDirectory();
	});
};

// Generate JSON
const generateAnimationsJson = () => {
	const channels = getSubfolders(aniPath);
	const obj = {};

	for (const channel of channels) {
		const channelPath = path.join(aniPath, channel);
		obj[channel] = getSubfolders(channelPath);

		for (const note of obj[channel]) {
			const notePath = path.join(channelPath, note);

			const pngFile = fs.readdirSync(notePath).filter(file => path.extname(file) === '.png')[0];
			const jsonFile = fs.readdirSync(notePath).filter(file => path.extname(file) === '.json')[0];

			let jsonContent = {};

			if (jsonFile) {
				const jsonFilePath = path.join(notePath, jsonFile);
				const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
				jsonContent = JSON.parse(jsonData);
			}

			const src = { png: pngFile, ...jsonContent };

			obj[channel][note] = src;
		}
	}

	const jsonContent = JSON.stringify(obj, null, 3);

	fs.writeFileSync(outputFilePath, jsonContent, 'utf8');
	console.log(`JSON file has been saved to ${outputFilePath}`);
};

// Run the function
generateAnimationsJson();
