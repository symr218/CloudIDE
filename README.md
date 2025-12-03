# iTraNavi (Static UI + API)

Static board/admin UIs now talk to a small Flask API with SQLite persistence and file uploads.

## Files
- `app/static/dashboard-static.html` - public board UI.
- `app/static/js/board.js` - board front-end logic (fetches cases, likes/comments/PV via API).
- `app/static/dashboard-admin.html` - admin/ops UI.
- `app/static/js/board-admin.js` - admin front-end logic (CRUD, analytics, uploads via API).
- `app/static/css/style.css` - shared styles.
- `app/static/db-view.html` / `app/static/js/db-view.js` - simple DB viewer (read-only list of cases/comments).
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
- `http://localhost:5000/db-view.html` (DB簡易ビュー/参照のみ)

## Run modes
- 開発・簡易: `python server/app.py`（Flask内蔵サーバー。Ctrl+Cで停止）
- 本番寄り (WSGI): `pip install waitress` の上で  
  `waitress-serve --port=5000 "server.app:app"`  
  を常駐させる。サービス化やタスクスケジューラに登録すると安定。
- リバースプロキシ (例: nginx): 80/443 で受けて `proxy_pass http://127.0.0.1:5000;`。TLS終端や圧縮、基本認証などはプロキシ側で。

## Config notes
- 環境変数: `HOST` (既定 0.0.0.0), `PORT` (既定 5000), `SECRET_KEY` を本番用に設定。
- データ: SQLite `data/app.db`、ファイルは `uploads/` に保存され `/uploads/<file>` で配信。
- API: `/api/cases` CRUD, `/api/cases/<id>/comments`, `/api/cases/<id>/like`, `/api/cases/<id>/view`, `/api/upload`.

## Behavior
- Data is stored server-side in SQLite at `data/app.db` (auto-created). Files are saved under `uploads/` and served from `/uploads/<file>`.
- The API seeds a few sample cases on first run. PV/いいね/コメントは API 経由で更新。
- Front-end keeps a local “liked” set perブラウザ to avoid多重いいね, but cases/comments/PV/live data come from the API.
