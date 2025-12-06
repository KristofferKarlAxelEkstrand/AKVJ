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
generateAnimationsJson.js       # Build script in root
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

Built-in watch with debouncing (no external chokidar dependency for the script):

```javascript
import { watch } from 'fs';

let timeout;
watch('animations/', { recursive: true }, () => {
	clearTimeout(timeout);
	timeout = setTimeout(() => run(), 100); // 100ms debounce
});
```

## Implementation Order

1. [ ] Create `scripts/animations/` folder structure
2. [ ] Move `generateAnimationsJson.js` logic to `lib/generate.js`
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

## Open Questions

- Add animation preview/test tool?
- Add `--dry-run` flag to show what would change?
