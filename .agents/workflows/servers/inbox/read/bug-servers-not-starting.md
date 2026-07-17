# Bug Report: Servers Hang on Startup

**Issue:**
Neither the `akvj` nor `mainframe` servers are starting up successfully. When attempting to start them, they just hang and sit spinning on the loading state.

**Action Required:**
- Investigate the startup sequence for both `akvj` and `mainframe`.
- Check if recent changes to `package.json` scripts, the migration to `midi-layout.json`, or the new hot-reload backend setup might have caused a deadlock or endless loop during initialization.
- Provide a fix to ensure both servers boot correctly.
