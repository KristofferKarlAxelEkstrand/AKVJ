# Health Reports

Snapshots written by `health-report.js` on every monitor pass. Transient — only
the newest three are kept, and nothing here requires a human response.

(This was the Health Inspector agent's job until 2026-07-20. It spent a CLI turn
every 40–50 minutes computing what a script computes for free, so the role was
retired and the report format kept.)

Things that need a human *decision* go to `../../mail/out/` instead.
