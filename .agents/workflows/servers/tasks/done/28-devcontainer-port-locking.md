# Task 28: Devcontainer Port Locking

## Objective
Lock down Vite ports to prevent silent port fallback in devcontainers. Use custom distinct ports to avoid conflicts with host machine Vite projects.

## Requirements
1. **Choose new ports**: `8888` for akvj, `9999` for mainframe UI, keep API on `8787` (or move to `7777`)
2. **Update Vite configs**: Set `port` and `strictPort: true` in both `akvj/vite.config.js` and `mainframe/vite.config.js`
3. **Update devcontainer.json**: Update `forwardPorts` and `portsAttributes` to match new ports
4. **Update documentation**: Search for mentions of `5173`/`5174` in READMEs and update
5. **Update smoke test**: Update `mainframe/test/smoke/startup.test.js` URLs to match new ports
6. **Update CORS**: Update `ALLOWED_ORIGINS` in `mainframe/server/index.js` if ports change

## Dependencies
- Task 25 already added `strictPort: true` to akvj — this task extends that with custom port numbers

## Notes
- akvj already has `strictPort: true` on port 5173 (added in task 25)
- mainframe already has `strictPort: true` on port 5174
- This task changes the port numbers themselves
