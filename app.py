#!/usr/bin/env python3
"""
CloudIDE ダッシュボードアプリケーション
アプリケーションサーバーのメインエントリーポイント
"""

import os
from app import create_app

# アプリケーションインスタンスの作成
app = create_app()

if __name__ == '__main__':
    # デバッグモード（開発環境）で起動
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    
    print(f"🚀 ダッシュボードアプリケーションを起動中...")
    print(f"📍 アクセスURL: http://{host if host != '0.0.0.0' else 'localhost'}:{port}")
    print(f"🔧 デバッグモード: {debug_mode}")
    
    app.run(debug=debug_mode, host=host, port=port)
