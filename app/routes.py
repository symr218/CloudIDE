from flask import Blueprint, render_template, jsonify, request, make_response
from datetime import datetime, timedelta
import random
import uuid

from . import db
from .models import UserSession

main_bp = Blueprint('main', __name__)


# ダッシュボード用のモックデータを生成する関数
def get_dashboard_data(active_users: int):
    """ダッシュボード用データの取得（active_usersはDBから渡す）"""
    return {
        'timestamp': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
        'system_status': 'オンライン',
        'cpu_usage': random.randint(10, 95),
        'memory_usage': random.randint(20, 80),
        'disk_usage': random.randint(30, 75),
        'network_latency': random.randint(5, 50),
        'active_users': active_users,
        'total_requests': random.randint(1000, 10000),
    }


def _upsert_session(resp):
    """セッション cookie を使って UserSession を作成/更新する。resp は make_response したレスポンス。"""
    session_id = request.cookies.get('session_id')
    new_cookie = False
    if not session_id:
        session_id = str(uuid.uuid4())
        new_cookie = True

    # upsert
    sess = UserSession.query.filter_by(session_id=session_id).first()
    if not sess:
        sess = UserSession(session_id=session_id,
                           ip_address=request.remote_addr,
                           user_agent=request.headers.get('User-Agent'))
        db.session.add(sess)
    else:
        sess.ip_address = request.remote_addr
        sess.user_agent = request.headers.get('User-Agent')
        sess.touch()

    db.session.commit()

    if new_cookie:
        # 長めの有効期限で cookie を設定
        resp.set_cookie('session_id', session_id, max_age=30 * 24 * 3600, httponly=True)


@main_bp.route('/')
def dashboard():
    """ダッシュボード画面 - DB の user_session を参照してアクティブユーザー数を算出"""
    # 5分以内にアクセスのあったセッションを「アクティブ」とみなす
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    active_count = UserSession.query.filter(UserSession.last_seen >= cutoff).count()

    data = get_dashboard_data(active_count)
    resp = make_response(render_template('dashboard.html', data=data))

    # セッションの作成/更新（レスポンスにクッキーを付与するためここで行う）
    _upsert_session(resp)

    return resp


@main_bp.route('/api/dashboard-data')
def api_dashboard_data():
    """API: ダッシュボードデータ取得（リアルタイム更新用）"""
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    active_count = UserSession.query.filter(UserSession.last_seen >= cutoff).count()

    data = get_dashboard_data(active_count)
    return jsonify(data)


@main_bp.route('/health')
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})
