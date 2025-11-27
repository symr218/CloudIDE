#!/bin/bash

# CloudIDE ダッシュボードアプリケーション起動スクリプト

set -e

echo "🚀 CloudIDE ダッシュボードアプリケーション起動スクリプト"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# スクリプトのディレクトリに移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 仮想環境のチェック
if [ ! -d ".venv" ]; then
    echo "📦 仮想環境を作成中..."
    python3 -m venv .venv
fi

# 仮想環境の有効化
echo "✅ 仮想環境を有効化中..."
source .venv/bin/activate

# 依存パッケージのインストール
echo "📚 依存パッケージをインストール中..."
pip install -q -r requirements.txt

# .env ファイルのチェック
if [ ! -f ".env" ]; then
    echo "⚠️  .env ファイルが見つかりません。デフォルト設定を使用します。"
else
    echo "✅ .env ファイルを読み込みました。"
fi

# アプリケーションの起動
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 ダッシュボードアプリケーション起動中..."
echo ""

python app.py
