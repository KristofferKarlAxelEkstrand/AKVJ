# AKVJ - Adventure Kid Video Jockey

A VJ application focused on pixel and 8-bit graphics, built with Web MIDI API, Canvas, vanilla JavaScript, custom HTML elements, and PNG sprites for Frames. The project is developed and served using Vite, with basic formatting and linting handled by Prettier and Stylelint.

AKVJ listens to MIDI notes from all inputs, using the channel number and note number to display different visuals and animations. Each note triggers a unique animation, and each channel adds a layer to the canvas, with channel 0 being the furthest in the back.

## Table of Contents

- [Introduction](#introduction)
- [Usage](#usage)
- [Installation](#installation)
- [Development](#development)
- [Build](#build)
- [Scripts](#scripts)
- [License](#license)
- [AI Instructions](#ai-instructions)

## Introduction

This project is a Vite-based application designed for AKVJ. It provides a foundational setup and configuration for both development and production environments.

## Usage

hello

### Animations

Animations are basically a bit of meta and an image.

#### Meta json

```json
{
	"velocityLayers": [
		{
			"minVelocity": 0,
			"numberOfFrames": 64,
			"framesPerRow": 8,
			"loop": true,
			"src": "bg.png",
			"frameRatesForFrames": {
				"0": 2
			}
		},
		{
			"minVelocity": 6,
			"numberOfFrames": 64,
			"framesPerRow": 8,
			"loop": true,
			"src": "bg2.png",
			"frameRatesForFrames": {
				"0": 2
			}
		}
	]
}
```

#### Meta json: Velocity layers (velocityLayers)

Each note can contain up to 13 animations, distributed across 13 different velocity layers. This allows for the grouping of animations within a single note. Velocity layers are created by assigning a value to the minVelocity integer, ranging from 0 to 13.

If you utilize all 13 layers, it would look something like this:

```mono
| minVelocity | Velocity interval | Recomended velocity value |
|-------------|-------------------|---------------------------|
| 0           |   1 - 10          | 5                         |
| 1           |  10 - 20          | 15                        |
| 2           |  20 - 30          | 25                        |
| 3           |  30 - 40          | 35                        |
| 4           |  40 - 50          | 45                        |
| 5           |  50 - 60          | 55                        |
| 6           |  60 - 70          | 65                        |
| 7           |  70 - 80          | 75                        |
| 8           |  80 - 90          | 85                        |
| 9           |  90 - 100         | 95                        |
| 10          | 100 - 110         | 105                       |
| 11          | 110 - 120         | 115                       |
| 12          | 120 - 127         | 125                       |
```

This is how I would implement two velocity layers. The recommended velocity value becomes less significant due to the larger intervals. I personally use the 5 above minVelocity because it’s easy to remember.

```mono
| minVelocity | Velocity interval | Recomended velocity value |
|-------------|-------------------|---------------------------|
| 0           |  1 - 60           | 5                         |
| 6           | 60 - 127          | 65                        |
```

If only one layer is present, it will occupy the entire velocity layer, and the minVelocity parameter will be ignored.

```mono
| minVelocity | Velocity interval | Recomended velocity value |
|-------------|-------------------|---------------------------|
| 0           | 1 - 127           | 5                         |
```

## Installation

The basic installation uses the standard npm install command. Additionally, I’ve added a few npm scripts to clean up and upgrade packages. Since this is meant to be run locally, for example, on a screen in a live setting, the packages should always be updated to the latest versions. There shouldn’t be any problems caused by this, as the dependencies are there to aid development.

### Init

```bash
npm install
```

## Development

Vite runs a local dev server. URI in terminal.

```bash
npm run dev
```

## Build

Vite builds to ./dist/ folder.

```bash
npm run build
```

## Scripts

Some extra scripts to clean up and keep dependencies updated.

### Prune and install

```bash
npm run fix-install
```

### Prune, fix and install

```bash
npm run fix-quick
```

### Upgrade dependencies

```bash
npm run fix-upgrade
```

### Remove dependencies, upgrade, clean install

```bash
npm run fix-deep
```

## License

This project is released under a dual-license model. The source code and the animation assets are governed by separate licenses.

### Source Code

All source code in this repository (including .js, .html, .css, and .md files) is licensed under the **MIT License**. See the [LICENSE-CODE.md](LICENSE-CODE.md) file for more details.

### Animation Assets

All animation assets (including all .png and .json files located in the `src/public/animations/` directory) are **proprietary and All Rights Reserved**. These assets are included for demonstration purposes only. See the [LICENSE-ASSETS.md](src/public/animations/LICENSE-ASSETS.md) file for the full terms.

## AI Instructions

For comprehensive documentation designed specifically for AI assistants, GitHub Copilot, and modern development tools, see [AI_INSTRUCTIONS.md](AI_INSTRUCTIONS.md). This file contains detailed information about the project architecture, MIDI-to-visual mapping logic, performance requirements, and guidelines for AI-assisted development.
