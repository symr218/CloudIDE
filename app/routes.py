from flask import Blueprint, render_template, jsonify
from datetime import datetime
import random

main_bp = Blueprint('main', __name__)

# ダッシュボード用のモックデータを生成する関数
def get_dashboard_data():
    """ダッシュボード用データの取得"""
    return {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'system_status': 'オンライン',
        'cpu_usage': random.randint(10, 95),
        'memory_usage': random.randint(20, 80),
        'disk_usage': random.randint(30, 75),
        'network_latency': random.randint(5, 50),
        'active_users': random.randint(5, 50),
        'total_requests': random.randint(1000, 10000),
    }

@main_bp.route('/')
def dashboard():
    """ダッシュボード画面"""
    data = get_dashboard_data()
    return render_template('dashboard.html', data=data)

@main_bp.route('/api/dashboard-data')
def api_dashboard_data():
    """API: ダッシュボードデータ取得（リアルタイム更新用）"""
    data = get_dashboard_data()
    return jsonify(data)

@main_bp.route('/health')
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})
