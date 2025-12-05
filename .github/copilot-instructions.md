# GitHub Copilot Instructions for AKVJ - Adventure Kid Video Jockey

**ALWAYS follow these instructions first** and only fallback to additional search and context gathering if the information in these instructions is incomplete or found to be in error.

## Project Overview

AKVJ is a real-time VJ (Video Jockey) application built with Vite, vanilla JavaScript, Web MIDI API, and HTML5 Canvas. It listens to MIDI input and triggers pixel-perfect sprite animations for live performance visuals. The application uses a 240x135 pixel canvas with frame-based animations organized by MIDI channel, note, and velocity layers.

## Required Environment & Dependencies

### Prerequisites

- **Node.js** (any recent version - tested with Node 18+)
- **Chrome/Chromium browser** (required for Web MIDI API support)
- **MIDI device** (optional, for full functionality testing)

### Installation Commands

```bash
npm install                              # Takes ~13 seconds - NEVER CANCEL
```

## Build & Development Commands

### Core Development Workflow

```bash
npm run dev                              # Start Vite dev server (http://localhost:5173/)
npm run build                            # Build for production - takes <1 second
npm run preview                          # Preview production build (http://localhost:4173/)
```

### Code Quality & Formatting

```bash
npm run lint                             # Lint JavaScript with ESLint
npm run lint:fix                         # Lint and auto-fix issues
npm run format:prettier                  # Format JS/JSON/Markdown - takes ~1 second
npm run format:stylelint                 # Format and lint CSS - takes <1 second
```

### Animation Management

```bash
npm run generate-animation-json-to-json  # Generate animation metadata - takes <1 second
npm run watch:animations                 # Watch animation changes (runs continuously)
```

### Dependency Management

```bash
npm run fix                              # Updates all dependencies in package.json to their latest versions using npm-check-updates (ncu) and runs npm install. CAUTION: Modifies package.json and package-lock.json, may introduce breaking changes.
```

**CRITICAL TIMING NOTES:**

- npm install: ~13 seconds - NEVER CANCEL, set timeout to 60+ seconds
- npm run build: <1 second - very fast Vite build
- npm run dev: starts in ~200ms, runs until stopped
- All format commands: <1 second each

## Validation Requirements

### ALWAYS Test These Scenarios After Changes

1. **Build Validation:**

    ```bash
    npm run build                         # Must complete successfully
    npm run preview                       # Must start preview server
    ```

2. **Development Server Validation:**

    ```bash
    npm run dev                           # Must start on localhost:5173
    ```

    - Open http://localhost:5173/ in Chrome/Chromium
    - Verify black canvas appears (expected initial state)
    - Check browser console for "JSON for animations loaded" message
    - Verify no JavaScript errors in console

3. **Code Quality Validation:**

    ```bash
    npm run lint                          # Must complete without errors
    npm run format:prettier               # Must complete without errors
    npm run format:stylelint              # Must complete without errors
    ```

4. **Animation System Validation:**

    ```bash
    npm run generate-animation-json-to-json # Must rebuild animation metadata
    ```

    - Verify `src/public/animations/animations.json` is updated
    - Check console output shows channel/note/velocity processing

### Manual Testing Scenarios

**CRITICAL:** Always perform these manual tests after making changes:

1. **Application Load Test:**
    - Start dev server: `npm run dev`
    - Navigate to http://localhost:5173/
    - Verify application loads with black canvas
    - Check browser console for successful animation JSON loading

2. **MIDI Compatibility Test:**
    - Open browser DevTools console
    - Look for Web MIDI API availability logs
    - Test in Chrome/Chromium (other browsers may not support Web MIDI)

3. **Build Production Test:**
    - Run: `npm run build`
    - Run: `npm run preview`
    - Verify production build works identically to dev build

## File Structure & Key Locations

### Core Application Files

- **`src/main.js`** - Application entry point
- **`src/index.html`** - Main HTML template
- **`src/js/adventure-kid-video-jockey.js`** - Main VJ component (custom element)
- **`src/js/midi.js`** - Web MIDI API integration
- **`src/js/app-state.js`** - Global state management
- **`src/js/settings.js`** - Configuration constants
- **`src/js/fullscreen.js`** - Fullscreen functionality

### Animation System

- **`src/public/animations/`** - Animation assets organized as: `{channel}/{note}/{velocity}/`
- **`generateAnimationsJson.js`** - Build script for animation metadata
- **`src/public/animations/animations.json`** - Generated animation index

### Configuration Files

- **`vite.config.js`** - Vite build configuration
- **`package.json`** - Dependencies and scripts
- **`.prettierrc`** - Code formatting rules
- **`.stylelintrc`** - CSS linting rules

### Documentation

- **`readme.md`** - Basic project documentation
- **`AI_INSTRUCTIONS.md`** - Detailed AI development guidelines
- **`LICENSE-CODE.md`** - MIT license for source code

## Critical Development Rules

### Performance Requirements

- **Real-time rendering:** Changes must not impact 60fps canvas rendering
- **MIDI latency:** Keep MIDI input to visual output under 20ms
- **Memory management:** Ensure proper cleanup of animation resources
- **Canvas operations:** Optimize for pixel-perfect 240x135 rendering

### Architecture Constraints

- **Vanilla JavaScript only** - No frameworks, maintain existing architecture
- **Web MIDI API dependency** - Application requires Chrome/Chromium
- **Custom element pattern** - Follow existing `<adventure-kid-video-jockey>` structure
- **ES6+ modules** - Use modern JavaScript module syntax

### Code Quality

- **Always run linting and formatting before commits:**
    ```bash
    npm run lint && npm run format:prettier && npm run format:stylelint
    ```
- **ESLint flat config** - Uses `eslint.config.js` with recommended rules
- **Follow existing code patterns** - match indentation and style conventions

## Common Issues & Troubleshooting

### MIDI Not Working

- **Issue:** Web MIDI API not available
- **Solution:** Use Chrome/Chromium browser, other browsers lack support
- **Validation:** Check `navigator.requestMIDIAccess` availability in console

### Build Failures

- **Issue:** npm install failures
- **Solution:** Delete `node_modules/` and `package-lock.json`, run `npm install`
- **Prevention:** Use exact commands listed above with proper timeouts

### Animation Loading Issues

- **Issue:** Animations not displaying
- **Solution:** Run `npm run generate-animation-json-to-json` to rebuild metadata
- **Validation:** Check console for "JSON for animations loaded" message

### Performance Issues

- **Issue:** Dropped frames or laggy rendering
- **Solution:** Profile canvas operations, check for memory leaks
- **Prevention:** Test changes with multiple concurrent animations

## Script Discrepancies Warning

**IMPORTANT:** The README.md mentions some npm scripts that, at the time of writing, are not present in `package.json`:

- `npm run fix-install`
- `npm run fix-quick`
- `npm run fix-upgrade`
- `npm run fix-deep`

Please check your current `package.json` to confirm which scripts are available. As of the last update, only `npm run fix` exists and it updates ALL dependencies (use with caution).

## Browser Compatibility

### Minimum Requirements

- **Chrome 43+** or **Chromium** (Web MIDI API support)
- **HTML5 Canvas with 2D context**
- **ES6+ JavaScript support**
- **RequestAnimationFrame API**

### Unsupported Browsers

- **Firefox** - No Web MIDI API support
- **Safari** - Limited Web MIDI API support
- **Internet Explorer** - Not supported

## Development Workflow Summary

1. **Setup:** `npm install` (13 seconds, set 60+ second timeout)
2. **Develop:** `npm run dev` → http://localhost:5173/
3. **Lint:** `npm run lint`
4. **Format:** `npm run format:prettier && npm run format:stylelint`
5. **Build:** `npm run build` (<1 second)
6. **Test:** `npm run preview` → http://localhost:4173/
7. **Validate:** Manual browser testing in Chrome/Chromium

**NEVER CANCEL long-running operations** - all commands complete quickly except npm install which needs full time to complete.

---

This documentation provides the essential commands and validation steps for effective development of the AKVJ VJ application. Always test in Chrome/Chromium and verify real-time performance after changes.
