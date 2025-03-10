# AKVJ - Adventure Kid Video Jockey

A VJ application focused on pixel and 8-bit graphics, built with Web MIDI API, Canvas, vanilla JavaScript, custom HTML elements, and PNG sprites for Frames. The project is developed and served using Vite, with basic formatting and linting handled by Prettier and Stylelint.

AKVJ listens to MIDI notes from all inputs, using the channel number and note number to display different visuals and animations. Each note triggers a unique animation, and each channel adds a layer to the canvas, with channel 0 being the furthest in the back.

## Table of Contents

-   [Introduction](#introduction)
-   [Usage](#usage)
-   [Installation](#installation)
-   [Development](#development)
-   [Build](#build)
-   [Scripts](#scripts)
-   [License](#license)

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

MIT License

Copyright (c) [Year] [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

**Exclusions: This license does not grant permission to use, copy, modify, merge, publish, distribute, sublicense, and/or sell any animations included in the repository.**

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
