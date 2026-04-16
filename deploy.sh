#!/bin/bash
# 部署腳本 - 在本機執行（需要有 SSH 訪問 appserver 的權限）

set -e

APP_SERVER="denvy@172.31.254.165"
APP_DIR="/home/denvy/workspace/iching-fortune"
LOCAL_DIR="./iching-fortune"

echo "=== 易經占卜 部署腳本 ==="
echo ""

# 1. 檢查本機目錄
if [ ! -d "$LOCAL_DIR" ]; then
    echo "❌ 錯誤：請在 iching-fortune 目錄的父目錄執行此腳本"
    exit 1
fi

# 2. 測試 SSH 連接
echo "📡 測試 SSH 連接..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $APP_SERVER "echo 'SSH OK'" > /dev/null 2>&1; then
    echo "❌ SSH 連接失敗，請檢查網絡或 VPN 連接"
    exit 1
fi
echo "✅ SSH 連接成功"

# 3. 創建遠程目錄
echo "📁 創建遠程目錄..."
ssh $APP_SERVER "mkdir -p $APP_DIR"
echo "✅ 目錄就緒"

# 4. 同步文件（排除 node_modules, .next, .git）
echo "📤 同步文件..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.gitignore' \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/" \
    "$APP_SERVER:$APP_DIR/"
echo "✅ 文件同步完成"

# 5. 在遠程服務器上安裝依賴並構建
echo "🔧 安裝依賴..."
ssh $APP_SERVER "cd $APP_DIR && npm install 2>&1 | tail -5"
echo "✅ 依賴安裝完成"

echo "🏗️  構建項目..."
ssh $APP_SERVER "cd $APP_DIR && npm run build 2>&1 | tail -10"
echo "✅ 構建完成"

# 6. 安裝 PM2 並啟動
echo "🚀 配置 PM2..."
ssh $APP_SERVER << 'ENDPM2'
cd /home/denvy/workspace/iching-fortune
npm install -g pm2 2>/dev/null || true
pm2 delete iching-fortune 2>/dev/null || true
pm2 start npm --name "iching-fortune" -- start
pm2 save 2>/dev/null || true
pm2 startup 2>/dev/null || true
ENDPM2
echo "✅ PM2 配置完成"

# 7. 檢查狀態
echo "📊 服務狀態："
ssh $APP_SERVER "pm2 status iching-fortune 2>/dev/null | head -10"

echo ""
echo "=== ✅ 部署完成 ==="
echo "訪問地址：http://172.31.254.165:3000"
echo ""
