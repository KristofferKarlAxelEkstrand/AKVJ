Enforce strict AKVJ naming standards:
- **No vague terms**: Ban `data`, `val`, `obj`, `temp`, `thing`. Use explicit domain names (e.g., `pixels`, `layerGroup`, `animationsMetadata`).
- **File casing**: Use `PascalCase.js` ONLY for files exporting a class. All other files must be `camelCase.js` or `lowercase.js`.
- **Class members**: Use `#` for all private fields and methods. Use `#bound` for cached event listeners (e.g., `#boundHandleMIDIMessage`).
- **Clarity over brevity**: Variable and function names must explicitly describe their purpose and data type.
