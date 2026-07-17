# AKVJ Mainframe

Vanilla JS + CSS Vite app for managing the shared `clips/` bucket and `set-mapping.json`.

## Commands

From repo root:

```bash
npm run mainframe    # UI on :9999, API on :7777
npm run build -w mainframe
```

## API (127.0.0.1:7777)

| Method  | Path                    | Purpose                             |
| ------- | ----------------------- | ----------------------------------- |
| GET     | `/api/clips`            | List clip bucket                    |
| GET     | `/api/clips/:id/sprite` | Preview sprite                      |
| POST    | `/api/clips`            | Create clip from base64 PNG frames  |
| GET/PUT | `/api/mapping`          | Read/write `clips/set-mapping.json` |
| POST    | `/api/pipeline`         | Run `npm run clips`                 |

No Express — plain Node `http`/`fs` + `sharp` for spritesheets.

The clip validate/optimize/generate pipeline lives in `mainframe/scripts/clips/` (CLI: `npm run clips`). Mainframe triggers it via `POST /api/pipeline` (`node mainframe/scripts/clips/index.js`).
