# Verify Transformer: Property Exchange Controller Resources M2-117-UM

The transformer for **Property Exchange Controller Resources M2-117-UM** has generated the structured data in `midi-mcp/data/structured/property-exchange-controller-resources.json` from `data/m2-117-um-property-exchange-controller-resources.md`.

Your task is to:
1. **Think about how this data is currently exposed (or not exposed) by the MCP server.** Does the server actually use this structured data, or is it just sitting there?
2. **Update the UX doc (`.agents/workflows/midi-mcp/midi-mcp-developer.usability.md`)** with your thoughts on how this specific structured data can be made usable for AI agents via MCP tools.
3. **Verify the implementation & data correctness.** Test the transformer and manually check the output JSON against the source markdown. Ensure there are no hallucinations, OCR errors, or dropped data. We need to be absolutely certain the data is perfectly correct and highly usable.
4. If you find any issues, fix the transformer and regenerate the JSON.
