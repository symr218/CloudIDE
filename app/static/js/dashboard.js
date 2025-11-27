// CloudIDE ダッシュボード JavaScriptロジック

/**
 * ダッシュボードデータを更新
 */
async function updateDashboard() {
    try {
        const response = await fetch('/api/dashboard-data');
        const data = await response.json();
        
        // 各メトリクスを更新
        updateMetric('cpu-usage', data.cpu_usage, '%');
        updateMetric('memory-usage', data.memory_usage, '%');
        updateMetric('disk-usage', data.disk_usage, '%');
        updateMetric('network-latency', data.network_latency, 'ms');
        updateMetric('active-users', data.active_users, '');
        updateMetric('total-requests', data.total_requests, '');
        
        // タイムスタンプを更新
        updateTimestamp(data.timestamp);
        
    } catch (error) {
        console.error('ダッシュボード更新エラー:', error);
    }
}

/**
 * 単一メトリクスを更新
 * @param {string} elementId - 要素ID
 * @param {number} value - 値
 * @param {string} unit - 単位
 */
function updateMetric(elementId, value, unit) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // 値の更新
    const valueElement = element.querySelector('.card-value');
    if (valueElement) {
        valueElement.textContent = value + (unit ? ' ' + unit : '');
    }
    
    // プログレスバーの更新（パーセンテージの場合）
    if (unit === '%') {
        const progressBar = element.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = value + '%';
            // 値に基づいて色を変更
            if (value > 80) {
                progressBar.style.background = 'linear-gradient(90deg, #f44336 0%, #e91e63 100%)';
            } else if (value > 60) {
                progressBar.style.background = 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
            }
        }
    }
    
    // 更新インジケーターの表示
    showUpdateIndicator(elementId);
}

/**
 * タイムスタンプを更新
 * @param {string} timestamp - タイムスタンプ
 */
function updateTimestamp(timestamp) {
    const element = document.querySelector('.timestamp');
    if (element) {
        element.textContent = '最終更新: ' + timestamp;
    }
}

/**
 * 更新インジケーターを表示
 * @param {string} elementId - 要素ID
 */
function showUpdateIndicator(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let indicator = element.querySelector('.update-indicator');
    if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'update-indicator';
        element.querySelector('.card-title').appendChild(indicator);
    }
    
    // フェードアニメーション
    indicator.style.opacity = '1';
    setTimeout(() => {
        indicator.style.opacity = '0.5';
    }, 500);
}

/**
 * ページ読み込み時の初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    // 初回更新
    updateDashboard();
    
    // 3秒ごとに自動更新
    setInterval(updateDashboard, 3000);
    
    // ダークモード対応の用意
    checkPrefersDarkMode();
});

/**
 * ダークモード設定をチェック
 */
function checkPrefersDarkMode() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    }
}

/**
 * リアルタイム時刻を更新
 */
function updateRealTimeClock() {
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP');
    // 時刻表示要素がある場合は更新
    const clockElement = document.getElementById('current-time');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

// 1秒ごとに時刻を更新
setInterval(updateRealTimeClock, 1000);
