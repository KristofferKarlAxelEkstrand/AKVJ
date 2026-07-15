# Enforce UTF-8 Encoding

Run this prompt if you suspect file encoding issues (e.g., weird characters appearing in logs, or builds failing on different operating systems).

1. Execute the UTF-8 conversion script to force all text files into clean UTF-8 encoding (stripping BOMs and converting Windows-1252 anomalies):
```bash
node .agents/scripts/convert-to-utf8.js
```
2. Verify that no binary files (like `.png` sprite sheets) were corrupted.
3. Run the linter (`npm run lint:fix`) to clean up any spacing anomalies introduced during the conversion.
