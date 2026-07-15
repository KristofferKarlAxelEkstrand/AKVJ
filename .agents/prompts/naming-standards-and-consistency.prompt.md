# AKVJ Naming Standards & Consistency

Enforce strict naming conventions across the AKVJ codebase to maximize readability and domain accuracy. This prompt serves as a deep-dive supplement to the core Code of Conduct. Run this to audit and fix naming inconsistencies:

## 1. Domain Terminology
- **No Vague Terms**: Ban generic terms like `data`, `val`, `obj`, `temp`, `thing`, or `item`. 
- **Use VJ Terminology**: Force explicit domain names (e.g., `pixels`, `destinationPixels`, `layerGroupA`, `clipsMetadata`, `compositor`, `velocityThreshold`).

## 2. File & Module Casing
- **Files**: Use `PascalCase.js` ONLY for files whose primary export is a class (e.g., `LayerManager.js`). All other modules (utilities, singletons, effect configs) must be `camelCase.js` or `lowercase.js`.
- **Classes**: Class declarations must be `PascalCase`. Instances of classes must be `camelCase` (e.g., `const layerManager = new LayerManager()`).

## 3. Constants
- **Global Constants**: Use `UPPER_SNAKE_CASE` strictly for magic numbers, fixed configuration limits, and global event string constants (e.g., `MAX_LAYERS`, `EVENT_MIDI_NOTE_ON`).

## 4. Web Components & DOM
- **Custom Elements**: Use `kebab-case` for HTML tags, custom web components (e.g., `<adventure-kid-video-jockey>`), and DOM attributes to comply with HTML5 specifications.
