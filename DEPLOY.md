# 易經占卜 - 部署指南

## 快速部署到 appserver

### 方法一：使用部署腳本（本機執行）

在本機執行以下命令部署：

```bash
# 1. 複製項目到 appserver
scp -r ./iching-fortune denvy@172.31.254.165:/home/denvy/workspace/

# 2. SSH 到 appserver 並執行部署
ssh denvy@172.31.254.165 << 'ENDSSH'
cd /home/denvy/workspace/iching-fortune

# 安裝依賴
npm install

# 構建
npm run build

# 安裝 PM2 並啟動
npm install -g pm2
pm2 delete iching-fortune 2>/dev/null
pm2 start npm --name "iching-fortune" -- start

# 保存 PM2 進程表
pm2 save

# 設置開機自啟
pm2 startup
ENDSSH
```

### 方法二：手動部署

```bash
# 在 appserver 上：
cd /home/denvy/workspace/iching-fortune
npm install
npm run build
npm install -g pm2
pm2 start npm --name "iching-fortune" -- start
pm2 save
pm2 startup
```

### 訪問

部署完成後訪問：`http://172.31.254.165:3000`

---

## 直接用 Vercel 部署（無需伺服器）

```bash
cd iching-fortune
npx vercel
```

按提示登入 Vercel 即可自動部署，獲得公開 URL。

---

## PM2 管理命令

```bash
pm2 status              # 查看狀態
pm2 logs iching-fortune # 查看日誌
pm2 restart iching-fortune  # 重啟
pm2 stop iching-fortune     # 停止
```
