# CloudIDE Dashboard

A small Flask-based real-time dashboard. CPU, memory, disk, and network metrics are generated server-side and fetched every 3 seconds from a REST API to update the page. Sessions are stored in SQLite so the app can count active users.

## Features
- Dashboard at `/` with auto-refresh every 3 seconds.
- REST endpoint `/api/dashboard-data` returns JSON metrics plus active user count.
- Health check at `/health`.
- Cookie-based session upsert into the `user_session` table; sessions seen within 5 minutes are counted as active.
- Host/port can be set via CLI flags (`--host`, `--port`) or `.env` (`HOST`, `PORT`).

## Requirements
- Python 3.8+
- pip (virtualenv recommended)
- SQLite bundled; switch to PostgreSQL, etc. via `DATABASE_URL`.

## Setup
```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

Optional `.env`:
```env
FLASK_ENV=development
HOST=0.0.0.0
PORT=5000
SECRET_KEY=change-me-in-production
DATABASE_URL=sqlite:///dev.db
```

## Run
- Dev: `python app.py --host 0.0.0.0 --port 5000`
- macOS/Linux helper: `./run.sh`
- Windows PowerShell: `./run.ps1 -Mode dev -Host 0.0.0.0 -Port 5000`
- Windows batch: `run.bat`
- Production-style (Waitress): `./run.ps1 -Mode prod -Host 0.0.0.0 -Port 5000`

## API and Pages
| Path | Method | Description |
| --- | --- | --- |
| `/` | GET | Dashboard page (auto-refreshes every 3s) |
| `/api/dashboard-data` | GET | JSON metrics (`cpu_usage`, `memory_usage`, `disk_usage`, `network_latency`, `active_users`, `total_requests`, `timestamp`) |
| `/health` | GET | Health check returning `{ "status": "healthy" }` |

## Database and Migrations
- Default: SQLite `dev.db` in the project root.
- Flask-Migrate/Alembic is included. After the first setup:
```bash
export FLASK_APP=app:create_app
flask db init      # only once
flask db migrate -m "init"
flask db upgrade
```
- For another DB: `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname`

## Behavior Notes
- Client polls with Fetch + `setInterval` (3s).
- Issues a `session_id` cookie and upserts `UserSession`; rows with `last_seen` in the last 5 minutes are active.
- Detects `prefers-color-scheme: dark` and adds `dark-mode` to the body (CSS can be extended).

## Verification
- macOS/Linux: `./verify.sh` (requires `netstat` and `curl`) checks port 5000 plus `/health`, `/api/dashboard-data`, `/`.
- Manual: `curl http://localhost:5000/health` and `curl http://localhost:5000/api/dashboard-data`

## Project Layout
```
app.py                 # entry point with CLI flags
run.sh / run.ps1 / run.bat
app/
  __init__.py          # Flask app factory, DB setup
  routes.py            # views, REST API, health check
  models.py            # UserSession model
  templates/dashboard.html
  static/css/style.css
  static/js/dashboard.js
  static/dashboard-static.html  # UI prototype, not served by Flask
migrations/            # for Flask-Migrate (created after init)
requirements.txt
```

## License
MIT
