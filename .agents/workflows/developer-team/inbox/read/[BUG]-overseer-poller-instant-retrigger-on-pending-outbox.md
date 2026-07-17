# [BUG] Overseer's Sleep Script Instantly Re-Triggers Whenever an Unanswered Outbox Question Is Pending

## Issue Description
`.agents/workflows/developer-team/scripts/await-messages-random.js` is used by the Overseer's "go to sleep" step (`prompts/overseer.prompt.md`, Step 5) to block until either a new file appears in a watched directory or a random 2-5 minute timeout fires. Its `checkDirectories()` function runs once synchronously **before** entering the `setInterval` wait loop (lines 44-45):

```javascript
// 1. Check immediately on startup
checkDirectories();
```

`checkDirectories()` treats "any `.md`/`.json` file currently present in the directory" as a waiting message and calls `process.exit(0)` immediately — it has no concept of "already seen" vs. "new," and no state persists between invocations (each call is a fresh process).

Since a recent protocol update (`team-update-overseer-outbox.md`), the Overseer's Step 4 ("Ask the Human") is now **mandatory** — the Overseer is expected to always have a pending question sitting in `outbox/` while it waits for the human. But that's exactly the condition that makes this script useless: as soon as the Overseer writes its question file and then calls the sleep script, `checkDirectories()` sees that same file (which the Overseer itself just created and which has no answer yet) and exits immediately, reporting "message waiting." The Overseer wakes up, finds nothing new (the `Answer:` field is still empty), and if it naively calls the sleep script again, the exact same thing happens — instantly, in a tight loop, with no real delay at all.

This defeats the entire purpose of Step 5 ("you MUST put yourself to sleep so you don't burn API tokens" — marked CRITICAL in the prompt) and, if not caught, would cause the Overseer to re-wake (i.e., trigger a brand-new agent turn) as fast as it can physically re-invoke the script — a real, unbounded cost/resource problem, not just an annoyance. I hit this directly: after sending a follow-up question and calling the sleep script, it returned in under a second reporting the same unanswered file as "waiting," twice in a row.

## How to Fix
The script needs to distinguish "a file I haven't reported on yet" from "the same file I already reported as waiting, still sitting there unanswered." A few options, roughly in order of simplicity:
1. **Track a per-file signature (mtime + size, or content hash) in a small state file** (e.g. `.agents/workflows/developer-team/scripts/.await-state.json`, gitignored) written on each `process.exit(0)`. On startup, only treat a file as "new" if its signature differs from what was last recorded for that path — this also correctly handles the human editing the file in place (mtime/hash changes) rather than only file creation/deletion.
2. Simpler but Overseer-specific: only count a file in `outbox/` as "waiting" if it contains a non-empty `Answer:` field (i.e., grep-check content, not just existence) — files with an empty `Answer:` are known-pending-on-human and shouldn't retrigger. This wouldn't help `slack/*` directories (which don't use the Question/Answer format), so option 1 is more general if other agents hit a similar pattern.
3. Least invasive: accept a `--baseline` flag/env var that tells the script to snapshot the directory listing at startup and only report files added *after* that snapshot, requiring callers to pass the current listing before writing their own new file. More plumbing, avoids a persistent state file.

Whichever approach: please also check whether the plain `await-messages.js` (non-random variant, used by Team Lead/developers/QA per their own prompts) has the same "any existing file counts as waiting" issue — if any of those workflows ever leave a file behind un-deleted (e.g., a failed cleanup), they'd hit the same instant-retrigger loop.

## Key Files
- `.agents/workflows/developer-team/scripts/await-messages-random.js` (`checkDirectories`, lines 19-42)
- `.agents/workflows/developer-team/scripts/await-messages.js` (check for the same pattern)
- `.agents/workflows/developer-team/prompts/overseer.prompt.md` (Step 4/5 — the mandatory-question protocol that exposed this)

## Dependencies
- None. This is infrastructure used by all 5 agents, not a bug in `akvj`/`mainframe` — flagging as high priority since it can cause runaway token burn, not just incorrect behavior.
