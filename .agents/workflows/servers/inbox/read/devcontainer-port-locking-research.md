# Research: Devcontainer Port Forwarding & Port Locking

**Context:**
Currently, our `devcontainer.json` forwards ports `5173` (akvj Vite), `4173` (akvj Preview), `5174` (mainframe Vite), and `8787` (mainframe API).

**The Problem with Vite's Default Behavior:**
By default, Vite tries to start on port `5173`. If that port is already in use (e.g., by a zombie process or a process on the host machine), Vite will silently auto-increment and try `5174`, `5175`, etc. 
In a devcontainer, this is a **major problem** because:
1. If `akvj` shifts to `5174`, it takes over the port assigned to `mainframe`.
2. If it shifts to a port not listed in `forwardPorts` in `devcontainer.json`, the developer won't be able to access the app from their host browser at all without manually adding the port in VS Code.

**Is it a "nono" to lock ports?**
No, in fact, **port locking is highly recommended best practice for devcontainers**. It is much better for the server to crash loudly with a "Port in use" error than to silently jump to an un-forwarded port, leaving the developer wondering why the site isn't loading.

**Is using ports like 8888 and 9999 a good idea?**
Yes. Using custom, distinct ports (like 8888 and 9999) instead of Vite's default 5173/5174 is a great idea. It prevents conflicts with other standard Vite projects you might be running locally on your host machine simultaneously.

### Action Plan for the Server Architect:
Please execute a task to lock these ports down:
1. **Choose new ports:** E.g., `8888` for `akvj` and `9999` for `mainframe` UI. (Keep API on `8787` or move it to something like `7777`).
2. **Update Vite Configs:** Edit both `akvj/vite.config.js` and `mainframe/vite.config.js` to set:
   ```javascript
   server: {
     port: 8888, // or 9999
     strictPort: true // This is the crucial part that locks the port
   }
   ```
3. **Update devcontainer.json:** Update `forwardPorts` and `portsAttributes` to match the new locked ports.
4. **Update Documentation:** Search for mentions of `5173` in READMEs and update them to the new locked ports.
