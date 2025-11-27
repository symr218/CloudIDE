import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# 拡張のインスタンスをモジュールレベルで作成
db = SQLAlchemy()
migrate = Migrate()


def create_app():
    """アプリケーションファクトリー"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

    # Database 設定
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///dev.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # 拡張を初期化
    db.init_app(app)
    migrate.init_app(app, db)

    # ブループリントの登録
    from .routes import main_bp
    app.register_blueprint(main_bp)

    # モデルをインポートしてFlask-Migrateが認識できるようにする
    # （遅延インポート）
    with app.app_context():
        # import models so they are registered with SQLAlchemy
        from . import models  # noqa: F401

    return app
