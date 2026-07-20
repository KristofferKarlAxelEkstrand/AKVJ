## Your Memory

Your log lives at `.agents/workflows/developer-team/memory/<your-agent-name>/<log-name>.md` and has two sections:

- **`## Digest`** — one line per past finding. Read this **in full** before every sweep. It is what stops you re-reporting something you already filed.
- **`## Recent`** — the newest entries with full detail. Skim it; read a specific entry only when you need the reasoning behind a digest line.

Never read the whole file top to bottom "for context" — it is deliberately bounded so your wake stays cheap, and the digest already carries the part that matters.

Append with the script, not by hand — it keeps the format machine-readable so old entries can be compacted:

```bash
node .agents/workflows/scripts/memory-log.js append developer-team <your-agent-name> \
  --summary "one line: what you swept and what you filed" \
  [--area akvj/src/js/visuals] [--refs 275,281]
```

Log every wake, including quiet ones — "nothing new in X, all clean" is a useful entry. Older entries are compacted into the digest automatically; you do not need to trim anything yourself.

Never put memory or notes files in `.agents/workflows/developer-team/slack/<your-agent-name>/` — that folder is your mailbox, and every file dropped there reads as unread mail.
