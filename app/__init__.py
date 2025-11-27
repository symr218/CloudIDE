from flask import Flask

def create_app():
    """アプリケーションファクトリー"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    
    # ブループリントの登録
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    return app
