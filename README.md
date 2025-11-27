# CloudIDE ダッシュボードアプリケーション

アプリケーションサーバーで起動できるリアルタイムダッシュボードアプリケーションです。システムのCPU、メモリ、ディスク使用率などをリアルタイムで監視・表示します。

## 🎯 機能

- **リアルタイム監視**: CPU使用率、メモリ使用率、ディスク使用率をリアルタイムで表示
- **自動更新**: 3秒ごとにダッシュボード情報を自動更新
- **レスポンシブデザイン**: モバイルデバイスにも対応した画面レイアウト
- **ヘルスチェック**: `/health` エンドポイントでサーバーの稼働状況を確認
- **REST API**: `/api/dashboard-data` でダッシュボードデータをJSON形式で取得

## 📋 必要要件

- Python 3.8 以上
- pip（Pythonパッケージ管理ツール）

## 🚀 インストール手順

### 1. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 2. アプリケーションの起動

```bash
python app.py
```

またはPythonの仮想環境を使用する場合:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows

pip install -r requirements.txt
python app.py
```

## 🌐 アクセス方法

アプリケーション起動後、ブラウザで以下のURLにアクセスしてください：

```
http://localhost:5000
```

また、リモートアクセスが必要な場合：

```
http://<サーバーIP>:5000
```

## 📊 利用可能なエンドポイント

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| `/` | GET | ダッシュボード画面 |
| `/api/dashboard-data` | GET | ダッシュボードデータ（JSON形式） |
| `/health` | GET | ヘルスチェック |

## 🔧 環境変数設定

`.env` ファイルで以下の設定が可能です：

```env
FLASK_ENV=development  # 開発環境モード
HOST=0.0.0.0          # バインドするホストアドレス
PORT=5000             # バインドするポート番号
```

## 📁 ディレクトリ構造

```
.
├── app.py                    # アプリケーションメインファイル
├── requirements.txt          # Python依存パッケージ
├── .env                     # 環境変数設定
├── .gitignore               # Git管理外ファイル設定
└── app/
    ├── __init__.py          # Flaskアプリケーションファクトリー
    ├── routes.py            # ルーティング定義
    ├── templates/
    │   └── dashboard.html   # ダッシュボードHTMLテンプレート
    └── static/
        ├── css/
        │   └── style.css    # ダッシュボードスタイル
        └── js/
            └── dashboard.js # ダッシュボードJavaScript
```

## 🎨 ダッシュボード表示項目

- **CPU使用率**: リアルタイムCPU使用率（パーセンテージ）
- **メモリ使用率**: 現在のメモリ使用率（パーセンテージ）
- **ディスク使用率**: ディスク容量使用率（パーセンテージ）
- **ネットワークレイテンシ**: ネットワーク応答時間（ミリ秒）
- **アクティブユーザー**: 現在接続中のユーザー数
- **総リクエスト数**: 処理済みリクエスト数

## 💡 使用技術

- **バックエンド**: Flask（Python Webフレームワーク）
- **フロントエンド**: HTML5、CSS3、JavaScript（ES6+）
- **スタイリング**: CSS Grid、Flexbox
- **自動更新**: Fetch API、setInterval

## 🛠️ カスタマイズ方法

### ポート番号の変更

`.env` ファイルで `PORT` を変更してください：

```env
PORT=8080
```

### データ更新間隔の変更

`app/static/js/dashboard.js` の以下の行を編集：

```javascript
// 3秒ごとに自動更新（3000ミリ秒）
setInterval(updateDashboard, 3000);
```

## ⚡ パフォーマンス

- 初回ロード時間: < 1秒
- ダッシュボード更新間隔: 3秒
- ページレスポンス: < 100ms

## 📝 ライセンス

MIT License

## 👨‍💻 開発者向け情報

### デバッグモード有効時

デバッグモードで起動すると、コード変更時に自動的にサーバーが再起動します（開発時に便利）。

### ログ確認

アプリケーション実行時のログは以下で確認できます：

```bash
tail -f /tmp/dashboard_app.log  # Linux/Mac
```

## 🐛 トラブルシューティング

### ポートが既に使用されている場合

別のポートで起動してください：

```bash
PORT=8000 python app.py
```

### ModuleNotFoundError が発生した場合

依存パッケージを確認してインストールしてください：

```bash
pip install -r requirements.txt
```

## 📞 サポート

問題が発生した場合は、Issue を作成してください。

---

**作成日**: 2025年11月27日
**バージョン**: 1.0.0
