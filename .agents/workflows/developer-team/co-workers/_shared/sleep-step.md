## The Sleep Step (how your loop ends)

Every cycle ends by running your wait command **as a background task**, then ending your turn immediately.

1. **Background, never foreground.** Run in the foreground and the harness's own tool-call timeout can kill the command before any message arrives — you get a killed result instead of a clean wake, and your loop desyncs from a stuck-but-invisible state.
2. **The instant it is started, stop.** End your turn with at most a one-line acknowledgment. No further tool calls, no "while I'm waiting, let me also check X." Ending the turn is what puts the session into the idle, waiting state; keeping working means you never actually slept.
3. **Ending your turn is not ending your session.** Do not `exit 0` here. The background task completing (new message, or your timer) is what resumes this same session at the top of your loop.
4. **An error, kill, abort, or timeout is not a real wake.** Do not treat it as licence to do unrelated work or skip sleeping — immediately re-invoke the identical command in the background and end your turn again. Observed live: a correctly backgrounded sleep is sometimes aborted after a few seconds with no message. Same recovery. Do not give up after repeated aborts; that is how a role silently leaves the await state.

If you are idle because you are blocked on someone else, say so before sleeping:

```bash
node .agents/workflows/scripts/post-awaiting.js developer-team <your-agent-name> "<waiting-on>" "<short reason>"
```

It is cleared automatically when a message wakes you.
