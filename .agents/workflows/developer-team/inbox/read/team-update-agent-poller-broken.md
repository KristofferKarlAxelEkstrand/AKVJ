# Team Update: Agent Poller / Sleep Not Working

## Summary
The agent poller or sleep mechanism is broken. Agents do not wake up after sleeping, and they do not properly await terminal commands. Something in the wake/await flow is not functioning.

## Impact
- Agents that sleep or wait for terminal output never resume
- Any workflow relying on async agent behavior (polling, waiting for builds, etc.) is blocked
- Team inbox messages may not get picked up by agent workers

## Action Needed
Investigate the agent poller/sleep mechanism. The issue appears to be in the wake-up or terminal await path — agents enter sleep but never come back. Needs debugging.

## Notes
This is blocking agent-driven workflow automation. High priority.
