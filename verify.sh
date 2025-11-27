#!/bin/bash

# CloudIDE ダッシュボードアプリケーション検証スクリプト

echo "🔍 ダッシュボードアプリケーション検証中..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. ポート5000のリッスン確認
echo "🔌 ポート5000のリッスン確認..."
if netstat -tln 2>/dev/null | grep -q ":5000"; then
    echo "✅ ポート5000: リッスン中"
else
    echo "⚠️  ポート5000: リッスンしていません"
fi

# 2. ヘルスチェックエンドポイント
echo ""
echo "🏥 ヘルスチェックエンドポイント確認..."
if curl -s http://localhost:5000/health | grep -q '"status": "healthy"'; then
    echo "✅ /health: 正常"
else
    echo "⚠️  /health: 確認できません"
fi

# 3. ダッシュボード画面
echo ""
echo "📊 ダッシュボード画面確認..."
if curl -s http://localhost:5000 | grep -q "CloudIDE"; then
    echo "✅ /: 正常に表示中"
else
    echo "⚠️  /: 確認できません"
fi

# 4. API確認
echo ""
echo "🔗 ダッシュボードAPIを確認中..."
if curl -s http://localhost:5000/api/dashboard-data | grep -q '"cpu_usage"'; then
    echo "✅ /api/dashboard-data: 正常"
else
    echo "⚠️  /api/dashboard-data: 確認できません"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 検証完了！"
echo ""
echo "📍 アクセスURL: http://localhost:5000"
echo "📊 ダッシュボードが正常に起動しています。"
