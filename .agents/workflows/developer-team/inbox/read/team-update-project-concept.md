# Team Update: Introducing "Projects" and Updating Clip Specs

## Summary
The user wants to update the clip format specs and introduce the concept of a "Project" to group clips, MIDI mappings, and uploads together.

## Impact
Currently, the application operates on a single global set of clips. Introducing projects will allow users to manage multiple distinct sets of visuals and switch between them. This will require architectural changes in how `mainframe` manages data and how the `akvj` engine loads its active state.

## Action Needed
1. **Clip Format Specs:** Please review the current clip format specs and compile a list of clarifying questions for the user to answer so we can update the specs properly.
2. **Project Architecture Ideas:** Brainstorm and propose ideas for how to implement the "Project" structure:
   - How should `mainframe` implement a project chooser UI and backend?
   - How should the active project be stored and communicated to the frontend (e.g., a simple settings file like `active-project.json` or an environment variable)?
   - How should we reorganize the `clips/` folder structure to support multiple projects without breaking the build pipeline?
3. **Follow-up:** Reply to the user with your proposed ideas, questions about the clip format, and any questions regarding the project chooser implementation.

## Notes
- The user expressed they aren't entirely sure how to do the project switch in the best way, so they are looking for your architectural advice and ideas.
- They are looking forward to collaborating with you on this!
