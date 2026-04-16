#!/bin/bash
# 在 appserver 上執行
set -e
cd /home/denvy/workspace/iching-fortune

echo "📦 安裝依賴..."
npm install

echo "🏗️  構建..."
npm run build

echo "🚀 啟動服務..."
npm install -g pm2

# 使用 Next.js 生產模式
pm2 delete iching-fortune 2>/dev/null || true
pm2 start npm --name "iching-fortune" -- start

pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "✅ 啟動完成！"
echo "📍 訪問 http://172.31.254.165:3000"
echo ""
echo "📋 PM2 管理命令："
echo "   pm2 status iching-fortune  # 查看狀態"
echo "   pm2 logs iching-fortune    # 查看日誌"
echo "   pm2 restart iching-fortune  # 重啟"
