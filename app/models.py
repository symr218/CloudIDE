from datetime import datetime
from . import db


class UserSession(db.Model):
    __tablename__ = 'user_session'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(128), unique=True, nullable=False, index=True)
    username = db.Column(db.String(150), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(300), nullable=True)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def touch(self):
        from datetime import datetime
        self.last_seen = datetime.utcnow()

    def __repr__(self) -> str:
        return f"<UserSession {self.session_id} last_seen={self.last_seen}>"
