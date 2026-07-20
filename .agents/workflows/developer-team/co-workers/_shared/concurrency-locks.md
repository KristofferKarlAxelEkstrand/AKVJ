## Shared Environment & Concurrency

You share one working tree with the other implementers. Do not step on their toes.

- **npm installs.** Never run `npm install` yourself. Send an `npm-request` message to `.agents/workflows/developer-team/slack/team-lead/` describing what you need. Only the Team Lead is authorized to install.
- **Global resource lock.** Before any other destructive or global command (editing the root `package.json`, a global build), check `.agents/workflows/developer-team/slack/general/` for a file starting with `[LOCK]`. If one exists, wait for it to disappear. If clear, create your own (e.g. `[LOCK]-root-package-json.md`), run the command, then delete your lock file when finished.
- **Broken environment.** If you find a broken global dependency or environment problem, do not quietly fix it. Send a `blocked` message to the Team Lead so the fix is assigned explicitly.
