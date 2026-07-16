**Task Continuation Protocol:**

1. **Check State**: Review `task.md`, recent terminal outputs, and any open artifacts.
2. **If Incomplete**: IMMEDIATELY resume execution. Execute the next required tool call, run the next command, or write the next file. Do NOT ask for permission to continue.
3. **If Complete**: STOP. Do not invent new tasks. State that the objective is achieved and stand by.


## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to execute this specific task, update this `.prompt.md` file to permanently document your findings.
