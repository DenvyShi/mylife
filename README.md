# 易經占卜 | I Ching Fortune

線上易經蓍草占卜系統，完整 64 卦數據，匿名使用。

🔗 **線上訪問：** https://mylife.first.pet

---

## 功能

- 🧙 **64 卦完整數據** — 卦辭、爻辭、象辭、五行含義
- 🔮 **蓍草占卜法** — 模擬傳統 18 次操作，動畫演示
- 📊 **五維分析** — 總論/財運/事業/感情/健康
- 🔒 **完全匿名** — 客戶端計算，零數據回傳伺服器
- 🌐 **響應式設計** — 支持桌面和移動設備

---

## 技術棧

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **部署:** Cloudflare Tunnel → mylife.first.pet

---

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 訪問 http://localhost:3000
```

---

## 部署

### 部署到現有伺服器

```bash
# 1. 安裝 Node.js 20+
# 2. npm install
# 3. npm run build
# 4. 使用 PM2 啟動：

pm2 start npm --name "iching-fortune" -- start
pm2 save
pm2 startup
```

### Cloudflare Tunnel 部署

```bash
# 1. 創建 Cloudflare Tunnel
cloudflared tunnel create iching

# 2. 配置隧道
cat > ~/.cloudflared/config.yml << EOF
url: http://localhost:3000
tunnel: <TUNNEL_ID>
credentials-file: /home/denvy/.cloudflared/<TUNNEL_ID>.json
EOF

# 3. 啟動
cloudflared tunnel --config ~/.cloudflared/config.yml run iching

# 4. 配置 DNS 路由
cloudflared tunnel route dns <TUNNEL_NAME> your-domain.com
```

---

## 項目結構

```
src/
├── app/            # Next.js App Router 頁面
│   ├── page.tsx    # 主頁面
│   ├── layout.tsx  # 佈局
│   └── globals.css # 全局樣式
├── data/
│   └── hexagrams.ts  # 64 卦完整數據
└── lib/
    └── divination.ts # 蓍草占卜算法
```

---

## License

MIT
