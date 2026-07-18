Question: The Refactor for Greatness Wave 2 epic (`epics/refactor-for-greateness-2.md`, §P0.1)
found that Task 128's per-project clip migration is **not durable in git**: `projects/` is
entirely untracked (a fresh clone gets zero source clip data), while the legacy `clips/`
directory is still tracked in the git index (62 files) despite being deleted on disk. I
independently verified this directly — `git status --short projects/` shows `?? projects/`,
and `git ls-files clips/` still lists dozens of files. A fresh clone of this repo would not
build correctly today.

Committing this migration (staging the new `projects/` tree — which includes binary PNG
sprite assets — and removing the stale `clips/` entries from the index) is a real, sizeable,
history-altering git operation. Per git-safety practice I'm not authorized to commit
autonomously, and I don't think it's right to delegate an actual `git add`/`git commit` of
this scope to a developer agent without your awareness either, given it touches binary assets
and rewrites what's tracked.

I've dispatched the safe, non-git portions of P0 as normal file-edit tasks (fixing CI's
verify-clips step, `akvj/build:full`, the Vite HMR clip-path glob, and the generated-output
`.gitignore` policy) — those don't require your sign-off, they're routine edits like every
other task this session. But someone needs to actually decide whether to commit `projects/`
and retire tracked `clips/`, and I'd rather you make that call (or explicitly tell me/a
developer to proceed) than have it happen silently.

Answer:
