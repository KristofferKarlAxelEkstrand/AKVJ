# Animation Pipeline Refactor

Plan for improving the animation asset workflow.

## Goals

1. Separate source assets from build output
2. Add PNG optimization for smaller file sizes
3. Validate animation metadata before build
4. Automate the prepare/build/copy workflow

## Directory Structure

### Current

```
src/public/animations/          # Source AND output (mixed)
scripts/animations/             # Build pipeline (validate, optimize, generate) - located under `scripts/animations`
```

### Proposed

```
animations/                     # Source assets (editable, committed)
  0/0/0/
    sprite.png
    meta.json
.cache/animations/              # Optimized cache (generated, git-ignored)
  0/0/0/
    sprite.png                  # Optimized PNG
    sprite.png.hash             # Source file hash (for change detection)
  animations.json               # Generated metadata
scripts/animations/
  index.js                      # Main entry point, orchestrates pipeline
  lib/
    validate.js                 # Validation logic
    optimize.js                 # PNG optimization with sharp
    generate.js                 # Generate animations.json
    copy.js                     # Copy to public folder
    hash.js                     # Hash utilities
src/public/animations/          # Final output (generated, git-ignored)
```

## Architecture

### Single orchestrator pattern

One entry point (`scripts/animations/index.js`) handles the full pipeline:

```javascript
// scripts/animations/index.js
import { validate } from './lib/validate.js';
import { optimize } from './lib/optimize.js';
import { generate } from './lib/generate.js';
import { copyToPublic } from './lib/copy.js';

async function run(options = {}) {
    const animations = await validate('animations/');

    if (animations.errors.length > 0) {
        console.error('Validation failed:', animations.errors);
        process.exit(1);
    }

    const optimized = await optimize(animations.valid, '.cache/animations/');
    await generate(optimized, '.cache/animations/animations.json');
    await copyToPublic('.cache/animations/', 'src/public/animations/');

    console.log(`Processed ${optimized.length} animations`);
}
```

### Hash-based change detection

Instead of a central manifest file, use sidecar `.hash` files:

```
.cache/animations/0/0/0/
  sprite.png           # Optimized output
  sprite.png.hash      # Contains: sha256 of source file
```

**Benefits:**

- No manifest corruption issues
- Atomic per-file (partial failures don't break everything)
- Easy to inspect and debug
- `rm -rf .cache` is a clean reset

### Error handling strategy

| Scenario                       | Behavior                           |
| ------------------------------ | ---------------------------------- |
| Validation fails               | Exit with code 1, block build      |
| Single file optimization fails | Log error, continue, report at end |
| Source folder empty            | Warn, exit 0 (not an error)        |
| Output folder write fails      | Exit with code 1                   |

## Pipeline Steps

### 1. Validate (`lib/validate.js`)

- Scan `animations/` for `meta.json` files
- Parse and validate each animation
- Return `{ valid: [...], errors: [...] }`
- **Blocks pipeline if errors found**

### 2. Optimize (`lib/optimize.js`)

- For each valid animation:
    - Compute source file hash
    - Check if `.hash` sidecar matches
    - Skip if unchanged, optimize if new/changed
- Use **sharp** with palette mode for 8-bit PNG
- Write optimized PNG + `.hash` sidecar to `.cache/`

```javascript
import sharp from 'sharp';
import { createHash } from 'crypto';

async function optimizeIfChanged(sourcePath, cachePath) {
    const sourceHash = await hashFile(sourcePath);
    const cachedHash = await readHashFile(cachePath + '.hash').catch(() => null);

    if (sourceHash === cachedHash) {
        return { skipped: true };
    }

    await sharp(sourcePath).png({ palette: true, quality: 80, effort: 10 }).toFile(cachePath);

    await writeFile(cachePath + '.hash', sourceHash);
    return { optimized: true };
}
```

### 3. Generate (`lib/generate.js`)

- Scan `.cache/animations/` for optimized assets
- Build `animations.json` with all metadata
- Write to `.cache/animations/animations.json`

### 4. Copy (`lib/copy.js`)

- Sync `.cache/animations/` to `src/public/animations/`
- Only copy files where content differs
- Remove orphaned files in destination

## CLI Interface

```bash
# Full pipeline (default)
node scripts/animations

# Watch mode with debouncing
node scripts/animations --watch

# Individual steps (for debugging)
node scripts/animations --validate-only
node scripts/animations --no-optimize
node scripts/animations --clean  # Remove .cache and output
```

## npm Scripts

```json
{
    "scripts": {
        "animations": "node scripts/animations",
        "animations:watch": "node scripts/animations --watch",
        "animations:clean": "node scripts/animations --clean"
    }
}
```

## Watch Mode

Use `chokidar` as a library (not CLI wrapper) for reliable cross-platform file watching:

```javascript
import chokidar from 'chokidar';

function debounce(fn, ms) {
    let timeout;
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(fn, ms);
    };
}

const debouncedRun = debounce(() => run(), 100);

chokidar.watch('animations/', { ignoreInitial: true }).on('all', debouncedRun);
```

Note: `fs.watch` has inconsistent behavior across platforms. `chokidar` handles edge cases reliably.

## Implementation Order

1. [ ] Create `scripts/animations/` folder structure
2. [ ] Move existing animation index building logic to `lib/generate.js`
3. [ ] Create `index.js` orchestrator (no optimization yet)
4. [ ] Move source animations from `src/public/animations/` to `animations/`
5. [ ] Create `lib/copy.js` to sync to `src/public/animations/`
6. [ ] Add `src/public/animations/` and `.cache/` to `.gitignore`
7. [ ] Update npm scripts
8. [ ] Add `lib/validate.js` with all checks
9. [ ] Add `lib/optimize.js` with sharp + hash sidecar
10. [ ] Add `lib/hash.js` utilities
11. [ ] Add `--watch` mode with debouncing
12. [ ] Update documentation

## PNG Optimization Notes

For pixel art with transparency, 8-bit palette with alpha is ideal:

- Converts 32-bit RGBA to 8-bit palette (256 colors max)
- Typically 60-80% size reduction for pixel art
- Preserves sharp edges (no blur like JPEG)
- Alpha channel preserved

Using `sharp`:

```javascript
import sharp from 'sharp';

await sharp(input).png({ palette: true, quality: 80, effort: 10 }).toFile(output);
```

Alternative CLI tool if needed: `pngquant --quality=80-100 --speed 1 input.png`

## Validation Rules

| Check                      | Description                            |
| -------------------------- | -------------------------------------- |
| `meta.json` exists         | Required metadata file                 |
| Valid JSON                 | Parseable JSON format                  |
| `png` field                | Points to existing PNG file            |
| `numberOfFrames` > 0       | At least one frame                     |
| `framesPerRow` > 0         | At least one frame per row             |
| Image dimensions           | Width divisible by framesPerRow        |
| Frame count                | Rows \* framesPerRow >= numberOfFrames |
| `frameRatesForFrames` keys | Numbers from 0 to numberOfFrames-1     |
| `loop` type                | Boolean (if present)                   |
| `retrigger` type           | Boolean (if present)                   |

## Decisions

- **Single orchestrator** - One entry point, internal lib modules, no separate scripts to run in order
- **Hash sidecar files** - Per-file `.hash` files instead of central manifest, atomic and debuggable
- **Optimized PNGs go to `.cache/`** - Preserves originals, clear cache invalidation
- **Built-in watch mode** - Debounced, no external chokidar CLI wrapper needed
- **Use `sharp`** - Faster, cross-platform, no external CLI dependencies

## Additional Tools

### Animation Preview Tool

A standalone HTML page for previewing animations without the full app:

```
src/tools/
  animation-preview/
    index.html          # Preview UI
    preview.js          # Animation playback logic
    preview.css         # Minimal styling
```

**Features:**

- Dropdowns to select channel/note/velocity
- Plays animation with actual frame rates from `meta.json`
- Shows animation info (frame count, dimensions, file size)
- Pause/step through frames manually
- No build step required - works with Vite dev server

**Usage:**

```bash
npm run dev
# Open http://localhost:5173/tools/animation-preview/
```

## Final Step

After completing a pipeline change and validating behavior (lint, tests, build), push your branch and request a Copilot review via MCP:

- Push your changes:
    ```bash
    git push origin YOUR_BRANCH
    ```
- Request Copilot review (example pseudo-call):
    ```js
    mcp_io_github_git_request_copilot_review({ owner: 'KristofferKarlAxelEkstrand', repo: 'AKVJ', pullNumber: 34 });
    ```
    Confirm CI passes before marking PR ready to merge.

### Sprite Sheet Generator

Combines individual frames into a sprite sheet:

```bash
node scripts/animations/spritesheet.js ./frames-folder ./output
# Creates: output/sprite.png + output/meta.json

# With options:
node scripts/animations/spritesheet.js ./frames-folder ./output --frames-per-row 8 --frame-rate 12
```

**Input:** Folder with numbered frames (`frame001.png`, `frame002.png`, etc.)

**Output:**

- Single sprite sheet PNG (frames arranged in rows)
- Auto-generated `meta.json` with correct `numberOfFrames` and `framesPerRow`

```javascript
// scripts/animations/spritesheet.js
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function createSpriteSheet(inputDir, outputDir, options = {}) {
    const { framesPerRow = 8, frameRate = 12 } = options;

    // Find all frame images, sorted numerically
    const files = (await fs.readdir(inputDir))
        .filter(f => /\.(png|jpg)$/i.test(f))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });

    if (files.length === 0) {
        throw new Error('No image files found');
    }

    // Get frame dimensions from first image
    const firstImage = await sharp(path.join(inputDir, files[0])).metadata();
    const frameWidth = firstImage.width;
    const frameHeight = firstImage.height;

    // Calculate sprite sheet dimensions
    const cols = Math.min(files.length, framesPerRow);
    const rows = Math.ceil(files.length / framesPerRow);

    // Composite all frames into sprite sheet
    const composites = await Promise.all(
        files.map(async (file, i) => ({
            input: await sharp(path.join(inputDir, file)).toBuffer(),
            left: (i % framesPerRow) * frameWidth,
            top: Math.floor(i / framesPerRow) * frameHeight
        }))
    );

    await sharp({
        create: {
            width: cols * frameWidth,
            height: rows * frameHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite(composites)
        .png()
        .toFile(path.join(outputDir, 'sprite.png'));

    // Generate meta.json
    const meta = {
        numberOfFrames: files.length,
        framesPerRow,
        loop: true,
        retrigger: true,
        frameRatesForFrames: { 0: frameRate }
    };

    await fs.writeFile(path.join(outputDir, 'meta.json'), JSON.stringify(meta, null, '\t'));

    console.log(`Created sprite sheet: ${files.length} frames, ${cols}x${rows} grid`);
}
```

### Animation Scaffolding

Create new animation slots with a single command:

```bash
node scripts/animations/new.js 0 5 0
# Creates: animations/0/5/0/meta.json (template)
```

```javascript
// scripts/animations/new.js
import fs from 'fs/promises';
import path from 'path';

const template = {
    numberOfFrames: 1,
    framesPerRow: 1,
    loop: true,
    retrigger: true,
    frameRatesForFrames: { 0: 12 }
};

async function createAnimation(channel, note, velocity) {
    const dir = `animations/${channel}/${note}/${velocity}`;

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(template, null, '\t'));

    console.log(`Created ${dir}/meta.json`);
    console.log('Add your sprite.png and update meta.json');
}

const [, , channel, note, velocity] = process.argv;
if (!channel || !note || !velocity) {
    console.log('Usage: node scripts/animations/new.js <channel> <note> <velocity>');
    process.exit(1);
}
createAnimation(channel, note, velocity);
```

## Open Questions

- Add `--dry-run` flag to show what would change?
- Add size report after optimization?
