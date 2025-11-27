@echo off
REM CloudIDE ダッシュボードアプリケーション起動スクリプト（Windows用）

echo.
echo 🚀 CloudIDE ダッシュボードアプリケーション起動スクリプト
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM 仮想環境のチェック
if not exist "venv" (
    echo 📦 仮想環境を作成中...
    python -m venv venv
)

REM 仮想環境の有効化
echo ✅ 仮想環境を有効化中...
call venv\Scripts\activate.bat

REM 依存パッケージのインストール
echo 📚 依存パッケージをインストール中...
pip install -q -r requirements.txt

REM .env ファイルのチェック
if not exist ".env" (
    echo ⚠️  .env ファイルが見つかりません。デフォルト設定を使用します。
) else (
    echo ✅ .env ファイルを読み込みました。
)

REM アプリケーションの起動
echo.
echo 🌐 ダッシュボードアプリケーション起動中...
echo.

python app.py

pause
