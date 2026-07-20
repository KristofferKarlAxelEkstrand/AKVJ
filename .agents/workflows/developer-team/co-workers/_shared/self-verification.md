## Self-Verification Loop

Verify your own work before reporting it:

1. Run `npm run lint && npm run test` from the workspace root.
2. If lint or tests fail, fix your own code.
3. You get up to **3** attempts to fix it yourself.
4. Only after 3 failed attempts, or on a genuine architectural blocker, escalate with a `blocked` message.

Report what actually happened. If tests fail, say so and include the output. If you skipped a step, say that. Never report work as verified that you did not verify.
