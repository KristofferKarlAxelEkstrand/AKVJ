# AKVJ Naming Standards & Consistency

Enforce strict naming conventions across the AKVJ codebase to maximize human readability and domain accuracy. **Code must be instantly understandable to humans.** This prompt serves as a deep-dive supplement to the core Code of Conduct. Run this to audit and fix naming inconsistencies:

## 1. Domain Terminology
- **No Vague Terms**: Ban generic terms like `data`, `val`, `obj`, `temp`, `thing`, or `item`. 
- **Use VJ Terminology**: Force explicit domain names (e.g., `pixels`, `destinationPixels`, `layerGroupA`, `clipsMetadata`, `compositor`, `velocityThreshold`).
- **Optimization Buffers**: Pre-allocated objects/arrays used inside the render loop to prevent garbage collection must be explicitly named as scratch buffers (e.g., `#scratchBuffer`, `_bufferX`, `tempMatrix`) to distinguish them from standard state.

## 2. File & Module Casing
- **Files**: Use `PascalCase.js` ONLY for files whose primary export is a class (e.g., `LayerManager.js`). All other modules (utilities, singletons, effect configs) must be `camelCase.js` or `lowercase.js`.
- **Classes**: Class declarations must be `PascalCase`. Instances of classes must be `camelCase` (e.g., `const layerManager = new LayerManager()`).

## 3. Constants
- **Global Constants**: Use `UPPER_SNAKE_CASE` strictly for magic numbers, fixed configuration limits, and global event string constants (e.g., `MAX_LAYERS`, `EVENT_MIDI_NOTE_ON`).

## 4. Web Components & DOM
- **Custom Elements**: Use `kebab-case` for HTML tags, custom web components (e.g., `<adventure-kid-video-jockey>`), and DOM attributes to comply with HTML5 specifications.


## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to execute this specific task, update this `.prompt.md` file to permanently document your findings.
