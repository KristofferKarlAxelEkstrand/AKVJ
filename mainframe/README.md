# AKVJ Admin

Vanilla JS + CSS Vite app for managing the shared `clips/` bucket and `set-mapping.json`.

## Commands

From repo root:

```bash
npm run admin    # UI on :5174, API on :8787
npm run build -w admin
```

## API (127.0.0.1:8787)

| Method  | Path                    | Purpose                             |
| ------- | ----------------------- | ----------------------------------- |
| GET     | `/api/clips`            | List clip bucket                    |
| GET     | `/api/clips/:id/sprite` | Preview sprite                      |
| POST    | `/api/clips`            | Create clip from base64 PNG frames  |
| GET/PUT | `/api/mapping`          | Read/write `clips/set-mapping.json` |
| POST    | `/api/pipeline`         | Run `npm run clips -w vj-server`    |

No Express — plain Node `http`/`fs` + `sharp` for spritesheets.

The clip validate/optimize/generate pipeline lives in `admin/scripts/clips/` (CLI: `npm run clips`). Admin triggers it via `POST /api/pipeline` (`node admin/scripts/clips/index.js`).
