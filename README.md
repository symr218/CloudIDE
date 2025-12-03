# iTraNavi (Static UI + API)

Static board/admin UIs now talk to a small Flask API with SQLite persistence and file uploads.

## Files
- `app/static/dashboard-static.html` - public board UI.
- `app/static/js/board.js` - board front-end logic (fetches cases, likes/comments/PV via API).
- `app/static/dashboard-admin.html` - admin/ops UI.
- `app/static/js/board-admin.js` - admin front-end logic (CRUD, analytics, uploads via API).
- `app/static/css/style.css` - shared styles.
- `server/app.py` - Flask API + SQLite storage + upload handler (`/api/*`, `/uploads/*`).
- `requirements.txt` - Python deps.

## Setup
```bash
python -m venv .venv
./.venv/Scripts/Activate.ps1   # Windows PowerShell
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
python server/app.py           # starts API + serves static files
```

Visit:
- `http://localhost:5000/dashboard-static.html`
- `http://localhost:5000/dashboard-admin.html`

## Behavior
- Data is stored server-side in SQLite at `data/app.db` (auto-created). Files are saved under `uploads/` and served from `/uploads/<file>`.
- The API seeds a few sample cases on first run. PV/いいね/コメントは API 経由で更新。
- Front-end keeps a local “liked” set perブラウザ to avoid多重いいね, but cases/comments/PV/live data come from the API.
