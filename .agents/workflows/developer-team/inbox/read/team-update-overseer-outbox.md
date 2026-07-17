# Team Update: Overseer proactive questions and outbox rename

## Summary
The human wants the Overseer to take a more proactive role in understanding the project. The Overseer should start asking the human questions to get more info about the project, update specs, learn about new ideas for projects and clips, understand the code of conduct, and get background context.
To reflect this two-way communication, the `human-inbox/` directory has been renamed to `outbox/`.

## Impact
- The Overseer's prompt has been updated.
- The `human-inbox/` directory is now named `outbox/`.
- The Overseer will now ask proactive, high-level questions in the `outbox/` to gather information and update `spec/` files accordingly.

## Action Needed
- **Overseer**: Start asking questions immediately. Create a `.md` file in the `outbox/` asking the human for background on the project, the new ideas regarding projects and clips, and code of conduct. Follow up on the answers by updating the project specs and goals.
- **Team Lead**: Acknowledge the directory name change to `outbox/` if any scripts need further adjusting, though the primary scripts have been updated.

## Notes
The overarching goal is to make the Overseer an active participant in shaping the project specs by querying the human directly.
