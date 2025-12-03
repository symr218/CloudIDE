import json
import os
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, abort
from flask_sqlalchemy import SQLAlchemy

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
DB_PATH = DATA_DIR / "app.db"

DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

app = Flask(
    __name__,
    static_folder=str(BASE_DIR / "app" / "static"),
    static_url_path="",
)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Case(db.Model):
    __tablename__ = "case"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    detail = db.Column(db.Text, nullable=False)
    tags_json = db.Column("tags", db.Text, default="[]")
    owner = db.Column(db.String(120), default="")
    impact = db.Column(db.String(120), default="")
    date = db.Column(db.String(20), default="")
    likes = db.Column(db.Integer, default=0)
    pv = db.Column(db.Integer, default=0)
    image_url = db.Column(db.Text, nullable=True)
    pdf_url = db.Column(db.Text, nullable=True)
    pdf_name = db.Column(db.String(255), nullable=True)
    deleted = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comments = db.relationship(
        "Comment", backref="case", lazy="dynamic", cascade="all, delete-orphan"
    )

    @property
    def tags(self):
        try:
            data = json.loads(self.tags_json or "[]")
            if isinstance(data, list):
                return [t for t in data if t]
        except Exception:
            pass
        return []

    @tags.setter
    def tags(self, value):
        try:
            self.tags_json = json.dumps([t for t in (value or []) if t])
        except Exception:
            self.tags_json = "[]"


class Comment(db.Model):
    __tablename__ = "comment"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("case.id"), nullable=False, index=True)
    name = db.Column(db.String(120), default="")
    team = db.Column(db.String(120), default="")
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


def serialize_comment(comment: Comment):
    return {
        "id": comment.id,
        "case_id": comment.case_id,
        "name": comment.name or "",
        "team": comment.team or "",
        "text": comment.text or "",
        "created_at": comment.created_at.isoformat(),
    }


def serialize_case(case: Case, include_comments=True):
    data = {
        "id": case.id,
        "title": case.title,
        "summary": case.summary,
        "detail": case.detail,
        "tags": case.tags,
        "owner": case.owner,
        "impact": case.impact,
        "date": case.date,
        "likes": case.likes,
        "pv": case.pv,
        "image_url": case.image_url,
        "pdf_url": case.pdf_url,
        "pdf_name": case.pdf_name,
        "deleted": case.deleted,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
    }
    if include_comments:
        data["comments"] = [
            serialize_comment(c) for c in case.comments.order_by(Comment.created_at.asc())
        ]
    return data


def seed_data():
    if Case.query.count() > 0:
        return
    samples = [
        {
            "title": "AI で問い合わせ自動振り分け",
            "summary": "問い合わせを分類し担当へ自動エスカレーション。",
            "detail": "自然言語でカテゴリを推定し、Jira キューへ振り分け。SLA 違反を 25% 減。",
            "tags": ["自動化", "ヘルプデスク", "AI"],
            "owner": "IT サービスデスク",
            "impact": "SLA違反 -25%",
            "date": "2025-05-01",
            "likes": 8,
        },
        {
            "title": "リモートワーク VPN 可視化",
            "summary": "帯域・同時接続をダッシュボード化し混雑を緩和。",
            "detail": "ピーク時のゲート自動増設で接続失敗を 30% 減少。",
            "tags": ["監視", "クラウド", "運用改善"],
            "owner": "ネットワークチーム",
            "impact": "失敗率 -30%",
            "date": "2025-04-18",
            "likes": 5,
        },
        {
            "title": "権限申請のセルフサービス化",
            "summary": "フォーム化と承認フロー自動化でリードタイム短縮。",
            "detail": "Power Automate で承認を自動化し 3 日→1 日へ短縮。",
            "tags": ["権限管理", "自動化", "ナレッジ"],
            "owner": "ID 管理",
            "impact": "リードタイム -66%",
            "date": "2025-05-10",
            "likes": 7,
        },
    ]
    for s in samples:
        case = Case(
            title=s["title"],
            summary=s["summary"],
            detail=s["detail"],
            tags=s["tags"],
            owner=s["owner"],
            impact=s["impact"],
            date=s["date"],
            likes=s.get("likes", 0),
            pv=0,
        )
        db.session.add(case)
    db.session.commit()


def get_case_or_404(case_id: int) -> Case:
    case = Case.query.filter_by(id=case_id, deleted=False).first()
    if not case:
        abort(404, description="Case not found")
    return case


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})


@app.route("/api/cases", methods=["GET"])
def list_cases():
    cases = (
        Case.query.filter_by(deleted=False)
        .order_by(Case.created_at.desc(), Case.id.desc())
        .all()
    )
    return jsonify({"cases": [serialize_case(c) for c in cases]})


@app.route("/api/cases", methods=["POST"])
def create_case():
    data = request.get_json(force=True)
    required = ["title", "summary", "detail"]
    if not all(data.get(k) for k in required):
        abort(400, description="Missing required fields")
    case = Case(
        title=data["title"],
        summary=data["summary"],
        detail=data["detail"],
        tags=data.get("tags") or [],
        owner=data.get("owner") or "",
        impact=data.get("impact") or "",
        date=data.get("date") or "",
        likes=0,
        pv=0,
        image_url=data.get("image_url"),
        pdf_url=data.get("pdf_url"),
        pdf_name=data.get("pdf_name"),
    )
    db.session.add(case)
    db.session.commit()
    return jsonify({"case": serialize_case(case)}), 201


@app.route("/api/cases/<int:case_id>", methods=["GET"])
def get_case(case_id: int):
    case = get_case_or_404(case_id)
    return jsonify({"case": serialize_case(case)})


@app.route("/api/cases/<int:case_id>", methods=["PATCH"])
def update_case(case_id: int):
    case = get_case_or_404(case_id)
    data = request.get_json(force=True)
    for field in ["title", "summary", "detail", "owner", "impact", "date", "image_url", "pdf_url", "pdf_name"]:
        if field in data:
            setattr(case, field, data.get(field) or "")
    if "tags" in data:
        case.tags = data.get("tags") or []
    db.session.commit()
    return jsonify({"case": serialize_case(case)})


@app.route("/api/cases/<int:case_id>", methods=["DELETE"])
def delete_case(case_id: int):
    case = get_case_or_404(case_id)
    case.deleted = True
    db.session.commit()
    return jsonify({"ok": True})


@app.route("/api/cases/<int:case_id>/comments", methods=["POST"])
def add_comment(case_id: int):
    case = get_case_or_404(case_id)
    data = request.get_json(force=True)
    text = (data.get("text") or "").strip()
    if not text:
        abort(400, description="Comment text is required")
    comment = Comment(
        case=case,
        name=(data.get("name") or "").strip(),
        team=(data.get("team") or "").strip(),
        text=text,
    )
    db.session.add(comment)
    db.session.commit()
    db.session.refresh(case)
    return jsonify({"case": serialize_case(case)})


@app.route("/api/cases/<int:case_id>/like", methods=["POST"])
def like_case(case_id: int):
    case = get_case_or_404(case_id)
    case.likes = (case.likes or 0) + 1
    db.session.commit()
    return jsonify({"case": serialize_case(case)})


@app.route("/api/cases/<int:case_id>/view", methods=["POST"])
def view_case(case_id: int):
    case = get_case_or_404(case_id)
    case.pv = (case.pv or 0) + 1
    db.session.commit()
    return jsonify({"case": serialize_case(case)})


def allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in {"png", "jpg", "jpeg", "gif", "svg", "webp", "pdf"}


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        abort(400, description="No file provided")
    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename):
        abort(400, description="Invalid file")
    ext = file.filename.rsplit(".", 1)[1].lower()
    new_name = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / new_name
    file.save(dest)
    url_path = f"/uploads/{new_name}"
    return jsonify({"url": url_path, "name": file.filename})


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)


def bootstrap():
    with app.app_context():
        db.create_all()
        seed_data()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    bootstrap()
    app.run(host=host, port=port, debug=True)
